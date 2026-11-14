import { describe, expect, it, vi } from "vitest";
import { AuthError, parseAccount, parseCredential, type AuthApi, type Credential, type CredentialStore } from "../../src/features/auth/business/auth";
import { createAuthCoordinator } from "../../src/features/auth/business/auth-coordinator";
import { createAuthApi } from "../../src/features/auth/data/auth-api";
import { CREDENTIAL_KEY, createCredentialStore } from "../../src/features/auth/data/credential-store";
import { createLoginModel } from "../../src/features/auth/presentation/login-model";
import { account, credential, deferred, expiresAt, now } from "../support/auth-fixtures";

const input = { email: "member1@example.invalid", password: " password-kept " };
function setup() {
  let record: Credential | null = null;
  const store = {
    read: vi.fn(async () => record),
    write: vi.fn(async (value: Credential) => { record = value; }),
    clear: vi.fn(async () => { record = null; }),
  } satisfies CredentialStore;
  const api = {
    login: vi.fn<AuthApi["login"]>().mockResolvedValue({ account: account(), session: { token: credential().token, expiresAt } }),
    me: vi.fn<AuthApi["me"]>().mockResolvedValue(account()),
    logout: vi.fn<AuthApi["logout"]>().mockResolvedValue(undefined),
  } satisfies AuthApi;
  return { api, store, record: () => record, auth: createAuthCoordinator(api, store, () => now) };
}

describe("mobile login/session coordinator", () => {
  it("waits for secure persistence and /me, then publishes only the confirmed identity", async () => {
    const { api, store, auth } = setup();
    const write = deferred<void>();
    store.write.mockImplementation(async () => { await write.promise; });
    api.me.mockResolvedValue({ ...account(), displayName: "Identity from me" });
    const pending = auth.login(input);
    await vi.waitFor(() => expect(store.write).toHaveBeenCalledOnce());
    expect(auth.getSnapshot()).toMatchObject({ account: null, busy: true });
    expect(api.me).not.toHaveBeenCalled();
    write.resolve();
    await pending;
    expect(auth.getSnapshot()).toMatchObject({ status: "authenticated", account: { id: account().id, displayName: "Identity from me" }, busy: false });
    expect(store.write).toHaveBeenCalledWith(credential());
    expect(JSON.stringify(auth.getSnapshot())).not.toContain(credential().token);
  });

  it("does not create a local session for wrong credentials or a forbidden account", async () => {
    for (const code of ["INVALID_CREDENTIALS", "FORBIDDEN"]) {
      const { api, store, auth } = setup();
      api.login.mockRejectedValue(new AuthError(code, "Không thể đăng nhập"));
      await expect(auth.login(input)).rejects.toMatchObject({ code });
      expect(auth.getSnapshot()).toMatchObject({ status: "guest", account: null });
      expect(store.write).not.toHaveBeenCalled();
      expect(api.me).not.toHaveBeenCalled();
    }
  });

  it("cleans up and revokes the newly issued session when SecureStore write fails", async () => {
    const { api, store, auth } = setup();
    store.write.mockRejectedValue(new Error("native secret detail"));
    await expect(auth.login(input)).rejects.toMatchObject({ code: "STORAGE_ERROR" });
    expect(api.logout).toHaveBeenCalledWith(credential().token);
    expect(store.clear).toHaveBeenCalled();
    expect(auth.getSnapshot()).toMatchObject({ status: "guest", account: null, busy: false });
    expect(auth.getSnapshot().message).not.toContain("native secret");
  });

  it("blocks access when persistent cleanup fails instead of claiming that credentials were removed", async () => {
    const { store, auth } = setup();
    store.write.mockRejectedValue(new Error("write failed"));
    store.clear.mockRejectedValue(new Error("delete failed"));
    await expect(auth.login(input)).rejects.toMatchObject({ code: "STORAGE_ERROR" });
    expect(auth.getSnapshot()).toMatchObject({ status: "blocked", account: null });
    await expect(auth.login(input)).rejects.toMatchObject({ code: "STORAGE_ERROR" });
  });

  it("keeps the credential after /me network failure, withholds private UI, and retries verification", async () => {
    const { api, auth, store, record } = setup();
    api.me.mockRejectedValueOnce(new AuthError("NETWORK_ERROR", "Không có mạng"));
    await expect(auth.login(input)).rejects.toMatchObject({ code: "NETWORK_ERROR" });
    expect(auth.getSnapshot()).toMatchObject({ status: "offline", account: null });
    expect(record()).toEqual(credential());
    expect(store.clear).not.toHaveBeenCalled();
    await auth.restore();
    expect(auth.getSnapshot()).toMatchObject({ status: "authenticated", account: { id: account().id } });
  });

  it.each(["UNAUTHENTICATED", "SESSION_EXPIRED"])("removes a server-rejected session (%s)", async code => {
    const { api, auth, record } = setup();
    api.me.mockRejectedValueOnce(new AuthError(code, "Phiên không còn hiệu lực"));
    await expect(auth.login(input)).rejects.toMatchObject({ code });
    expect(auth.getSnapshot()).toMatchObject({ status: "guest", account: null });
    expect(record()).toBeNull();
    expect(api.logout).toHaveBeenCalled();
  });

  it("rejects mismatched account identities between login, stored record and /me", async () => {
    const { api, auth, record } = setup();
    api.me.mockResolvedValue(account(2));
    await expect(auth.login(input)).rejects.toMatchObject({ code: "IDENTITY_MISMATCH" });
    expect(auth.getSnapshot().account).toBeNull();
    expect(record()).toBeNull();
  });

  it("does not grant access from a stored credential alone; expiry clears it without calling /me", async () => {
    const { api, auth, store } = setup();
    store.read.mockResolvedValue({ ...credential(), expiresAt: new Date(now - 1).toISOString() });
    await auth.restore();
    expect(api.me).not.toHaveBeenCalled();
    expect(store.clear).toHaveBeenCalled();
    expect(auth.getSnapshot()).toMatchObject({ status: "guest", account: null });
  });

  it("handles corrupt or unreadable storage without exposing the record", async () => {
    const { auth, store, api } = setup();
    store.read.mockRejectedValue(new Error("raw token detail"));
    await auth.restore();
    expect(auth.getSnapshot()).toMatchObject({ status: "blocked", account: null });
    expect(auth.getSnapshot().message).not.toContain("raw token");
    expect(api.me).not.toHaveBeenCalled();
  });

  it("ignores a late account-A response after switching to account B", async () => {
    const { auth, api, record } = setup();
    const late = deferred<ReturnType<typeof account>>();
    api.me.mockImplementationOnce(() => late.promise).mockResolvedValueOnce(account(2));
    api.login.mockResolvedValueOnce({ account: account(), session: { token: credential().token, expiresAt } })
      .mockResolvedValueOnce({ account: account(2), session: { token: credential(2).token, expiresAt } });
    const first = auth.login(input);
    await vi.waitFor(() => expect(api.me).toHaveBeenCalledOnce());
    await auth.endSession();
    await auth.login({ ...input, email: account(2).email });
    late.resolve(account());
    await first;
    expect(auth.getSnapshot()).toMatchObject({ status: "authenticated", account: { id: account(2).id } });
    expect(record()).toEqual(credential(2));
  });

  it("serializes logout/credential-write races so a completed late write cannot restore the old record", async () => {
    const { auth, api, store } = setup();
    let record: Credential | null = null;
    const written = deferred<void>();
    store.write.mockImplementation(async value => { await written.promise; record = value; });
    store.clear.mockImplementation(async () => { record = null; });
    const login = auth.login(input);
    await vi.waitFor(() => expect(store.write).toHaveBeenCalledOnce());
    const end = auth.endSession();
    written.resolve();
    await Promise.all([login, end]);
    expect(record).toBeNull();
    expect(auth.getSnapshot()).toMatchObject({ status: "guest", account: null, busy: false });
    expect(api.me).not.toHaveBeenCalled();
  });

  it("retains server revocation uncertainty when retrying a failed local cleanup", async () => {
    const { auth, api, store } = setup();
    await auth.login(input);
    api.logout.mockRejectedValueOnce(new AuthError("NETWORK_ERROR", "Offline"));
    store.clear.mockRejectedValueOnce(new Error("Native delete failed"));
    await auth.endSession();
    expect(auth.getSnapshot()).toMatchObject({ status: "blocked", account: null });
    await auth.endSession();
    expect(auth.getSnapshot()).toMatchObject({ status: "guest", account: null });
    expect(auth.getSnapshot().message).toContain("Chưa xác nhận thu hồi");
  });
});

describe("login form", () => {
  it("validates input and blocks parallel submits without changing password whitespace", async () => {
    const pending = deferred<void>();
    const login = vi.fn(() => pending.promise);
    const model = createLoginModel(login);
    await model.submit();
    expect(login).not.toHaveBeenCalled();
    model.setField("email", " MEMBER1@Example.invalid ");
    model.setField("password", input.password);
    const first = model.submit();
    await model.submit();
    expect(login).toHaveBeenCalledExactlyOnceWith(input);
    expect(model.getSnapshot().submitting).toBe(true);
    pending.resolve();
    await first;
    expect(model.getSnapshot().password).toBe("");
  });

  it("preserves the editable form after errors and respects Retry-After without automatic retries", async () => {
    let clock = now;
    const login = vi.fn().mockRejectedValueOnce(new AuthError("RATE_LIMITED", "Chờ thử lại", 60)).mockResolvedValueOnce(undefined);
    const model = createLoginModel(login, input.email, () => clock);
    model.setField("password", input.password);
    await model.submit();
    await model.submit();
    expect(login).toHaveBeenCalledOnce();
    expect(model.getSnapshot().password).toBe(input.password);
    clock += 60000;
    await model.submit();
    expect(login).toHaveBeenCalledTimes(2);
    model.dispose();
    expect(model.getSnapshot().password).toBe("");
  });
});

describe("secure credential adapter and API", () => {
  it("stores only token, accountId and expiresAt under a versioned SecureStore key", async () => {
    const native = { getItemAsync: vi.fn().mockResolvedValue(JSON.stringify(credential())), setItemAsync: vi.fn().mockResolvedValue(undefined), deleteItemAsync: vi.fn().mockResolvedValue(undefined) };
    const store = createCredentialStore(native);
    await store.write(credential());
    expect(native.setItemAsync).toHaveBeenCalledOnce();
    expect(native.setItemAsync.mock.calls[0][0]).toBe(CREDENTIAL_KEY);
    expect(JSON.parse(native.setItemAsync.mock.calls[0][1])).toEqual(credential());
    expect(await store.read()).toEqual(credential());
    await store.clear();
    expect(native.deleteItemAsync).toHaveBeenCalledWith(CREDENTIAL_KEY);
    expect(() => parseCredential({ ...credential(), password: "private" })).toThrow(AuthError);
  });

  it("posts only email/password, fetches /me via bearer and never sends accountId as identity", async () => {
    const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ account: account(), session: { token: credential().token, expiresAt } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ account: account() }), { status: 200 }));
    const api = createAuthApi("http://api", request);
    const result = await api.login(input);
    await api.me(result.session.token);
    expect(JSON.parse(request.mock.calls[0][1].body)).toEqual(input);
    expect(request.mock.calls[1][0]).toBe("http://api/api/v1/accounts/me");
    expect(request.mock.calls[1][1].headers.Authorization).toBe(`Bearer ${credential().token}`);
    expect(request.mock.calls[1][1].body).toBeUndefined();
    expect(parseAccount({ ...account(), passwordHash: "private", loginDisabledAt: null })).toEqual(account());
  });

  it.each([401, 403, 429, 503])("maps HTTP %i without exposing server internals", async status => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: status === 401 ? "INVALID_CREDENTIALS" : "PRIVATE", message: "raw password token SQL" } }), { status, headers: { "Retry-After": "23" } }));
    const error = await createAuthApi("http://api", request).login(input).catch(failure => failure as AuthError);
    expect(error).toBeInstanceOf(AuthError);
    expect((error as AuthError).message).not.toMatch(/password|token|SQL/);
    if (status === 429) expect((error as AuthError).retryAfter).toBe(23);
  });

  it("requires the contract's exact success status before confirming login/me or revocation", async () => {
    const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ account: account(), session: { token: credential().token, expiresAt } }), { status: 201 }))
      .mockResolvedValueOnce(new Response("<html>proxy fallback</html>", { status: 200 }));
    const api = createAuthApi("http://api", request);
    await expect(api.login(input)).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    await expect(api.logout(credential().token)).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
});
