import { describe, expect, it, vi } from "vitest";
import { AuthError, type AuthApi, type Credential } from "../../src/features/auth/business/auth";
import { createAuthCoordinator } from "../../src/features/auth/business/auth-coordinator";
import { createSessionNavigation, parseIntent } from "../../src/navigation/session-navigation";
import { unavailableListings, type ListingGateway } from "../../src/features/listings/business/listing-gateway";
import { account, credential, deferred, expiresAt, now } from "../support/auth-fixtures";

const listingId = "11111111-1111-4111-8111-111111111111";
const loginInput = { email: account().email, password: "test-password" };
function setup(initial: Credential | null = null) {
  let record = initial;
  const store = { read: vi.fn(async () => record), write: vi.fn(async (value: Credential) => { record = value; }), clear: vi.fn(async () => { record = null; }) };
  const api = { login: vi.fn<AuthApi["login"]>().mockResolvedValue({ account: account(), session: { token: credential().token, expiresAt } }),
    me: vi.fn<AuthApi["me"]>().mockResolvedValue(account()), logout: vi.fn<AuthApi["logout"]>().mockResolvedValue(undefined) };
  const auth = createAuthCoordinator(api, store, () => now);
  const listing = { id: listingId, title: "Test-only listing", description: "Fixture only", open: true };
  const gateway = { list: vi.fn<ListingGateway["list"]>().mockResolvedValue([listing]), get: vi.fn<ListingGateway["get"]>().mockResolvedValue(listing),
    checkContact: vi.fn<ListingGateway["checkContact"]>().mockResolvedValue(undefined), checkCreate: vi.fn<ListingGateway["checkCreate"]>().mockResolvedValue(undefined) };
  const nav = createSessionNavigation(auth, gateway);
  return { auth, api, store, gateway, nav, record: () => record };
}

describe("session bootstrap and request guards", () => {
  it("waits for server verification without switching to the login route", async () => {
    const { auth, api, nav } = setup(credential());
    const pending = deferred<ReturnType<typeof account>>();
    api.me.mockImplementationOnce(() => pending.promise);
    const restore = auth.restore();
    expect(auth.getSnapshot()).toMatchObject({ status: "checking", account: null });
    expect(nav.getSnapshot().route.name).toBe("browse");
    pending.resolve(account());
    await restore;
    expect(auth.getSnapshot()).toMatchObject({ status: "authenticated", account: { id: account().id } });
    nav.dispose();
  });

  it.each(["UNAUTHENTICATED", "SESSION_EXPIRED"])("removes server-rejected stored credentials (%s)", async code => {
    const { auth, api, record, nav } = setup(credential());
    api.me.mockRejectedValueOnce(new AuthError(code, "Expired"));
    await auth.restore();
    expect(record()).toBeNull();
    expect(auth.getSnapshot()).toMatchObject({ status: "guest", account: null, busy: false });
    nav.dispose();
  });

  it.each(["NETWORK_ERROR", "SERVICE_UNAVAILABLE", "RATE_LIMITED", "FORBIDDEN"])("withholds private UI but retains storage on %s", async code => {
    const { auth, api, record, nav } = setup(credential());
    api.me.mockRejectedValueOnce(new AuthError(code, "Unavailable"));
    await auth.restore();
    expect(auth.getSnapshot()).toMatchObject({ status: code === "FORBIDDEN" ? "restricted" : "offline", account: null });
    expect(record()).toEqual(credential());
    nav.browse();
    expect(nav.getSnapshot().route.name).toBe("browse");
    nav.dispose();
  });

  it("revalidates an authenticated account after foregrounding and removes a newly revoked session", async () => {
    const { auth, api, nav } = setup();
    await auth.login(loginInput);
    api.me.mockRejectedValueOnce(new AuthError("UNAUTHENTICATED", "Revoked"));
    await auth.restore({ force: true });
    expect(auth.getSnapshot()).toMatchObject({ status: "guest", account: null });
    nav.dispose();
  });

  it("does not issue any private action for a guest", async () => {
    const { auth, api, nav } = setup();
    await auth.restore();
    const action = vi.fn();
    await expect(auth.runPrivate(action)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(action).not.toHaveBeenCalled();
    expect(api.me).not.toHaveBeenCalled();
    nav.dispose();
  });

  it("checks current server identity before a private callback and keeps resource-level 403 action-scoped", async () => {
    const { auth, api, record, nav } = setup();
    await auth.login(loginInput);
    api.me.mockResolvedValueOnce({ ...account(), role: "ADMIN" });
    await expect(auth.runPrivate(async () => { throw new AuthError("FORBIDDEN", "Not a member"); })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(auth.getSnapshot()).toMatchObject({ status: "authenticated", account: { role: "ADMIN" } });
    expect(record()).not.toBeNull();
    nav.dispose();
  });

  it("blocks a now-restricted account before performing an intent without deleting its credential", async () => {
    const { auth, api, record, nav } = setup();
    await auth.login(loginInput);
    api.me.mockRejectedValueOnce(new AuthError("FORBIDDEN", "Restricted"));
    const action = vi.fn();
    await expect(auth.runPrivate(action)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(action).not.toHaveBeenCalled();
    expect(auth.getSnapshot()).toMatchObject({ status: "restricted", account: null });
    expect(record()).not.toBeNull();
    nav.dispose();
  });

  it("aborts old private requests and ignores their late401 after another account logs in", async () => {
    const { auth, api, nav, record } = setup();
    await auth.login(loginInput);
    const late = deferred<string>();
    let signal: AbortSignal | undefined;
    const action = vi.fn(async (_token: string, current: AbortSignal) => { signal = current; return late.promise; });
    const pending = auth.runPrivate(action);
    const rejection = expect(pending).rejects.toMatchObject({ code: "STALE_SESSION" });
    await vi.waitFor(() => expect(action).toHaveBeenCalledOnce());
    await auth.endSession();
    expect(signal?.aborted).toBe(true);
    api.login.mockResolvedValueOnce({ account: account(2), session: { token: credential(2).token, expiresAt } });
    api.me.mockResolvedValueOnce(account(2));
    await auth.login({ ...loginInput, email: account(2).email });
    late.reject(new AuthError("UNAUTHENTICATED", "Late A response"));
    await rejection;
    expect(auth.getSnapshot()).toMatchObject({ status: "authenticated", account: { id: account(2).id } });
    expect(record()?.accountId).toBe(account(2).id);
    nav.dispose();
  });
});

describe("return-to intents", () => {
  it("accepts only semantic whitelisted actions and UUIDs, never arbitrary URLs/credentials", () => {
    for (const value of [null, [], { action: "https://evil.test" }, { action: "contactListing", listingId: "bad" },
      { action: "contactListing", listingId, token: "private" }, { action: "createListing", accountId: account().id }, { action: { toString: () => "createListing" } }]) expect(parseIntent(value)).toBeNull();
    expect(parseIntent({ action: "contactListing", listingId })).toEqual({ action: "contactListing", listingId });
  });

  it("returns to the selected listing after login, using fresh read-only permission checks", async () => {
    const { auth, nav, gateway } = setup();
    await auth.restore();
    nav.openListing(listingId);
    await nav.request({ action: "contactListing", listingId });
    expect(nav.getSnapshot().route.name).toBe("login");
    expect(gateway.checkContact).not.toHaveBeenCalled();
    await auth.login(loginInput);
    await vi.waitFor(() => expect(nav.getSnapshot().resuming).toBe(false));
    expect(nav.getSnapshot().route).toEqual({ name: "listing", listingId, contactReady: true });
    expect(gateway.get).toHaveBeenCalledWith(listingId);
    expect(gateway.checkContact).toHaveBeenCalledOnce();
    nav.dispose();
  });

  it("cancels login to the original listing, clears the intent, and never contacts/posts automatically", async () => {
    const { auth, nav, gateway } = setup();
    await auth.restore();
    await nav.request({ action: "contactListing", listingId });
    nav.cancelLogin();
    await auth.login(loginInput);
    expect(nav.getSnapshot()).toMatchObject({ route: { name: "listing", listingId }, intent: null });
    expect(gateway.get).not.toHaveBeenCalled();
    expect(gateway.checkContact).not.toHaveBeenCalled();
    expect(gateway.checkCreate).not.toHaveBeenCalled();
    nav.dispose();
  });

  it("invalidates a contact permission marker whenever the verified auth epoch changes", async () => {
    const { auth, nav } = setup();
    await auth.login(loginInput);
    await nav.request({ action: "contactListing", listingId });
    expect(nav.getSnapshot().route).toMatchObject({ contactReady: true });
    await auth.restore({ force: true });
    expect(nav.getSnapshot().route).toEqual({ name: "listing", listingId });
    await auth.endSession();
    expect(nav.getSnapshot().route).toEqual({ name: "listing", listingId });
    nav.dispose();
  });

  it("invalidates a pending A resume while preserving the intent for a fresh B permission check", async () => {
    const { auth, api, nav, gateway } = setup();
    await auth.login(loginInput);
    const late = deferred<{ id: string; title: string; description: string; open: boolean }>();
    gateway.get.mockImplementationOnce(() => late.promise);
    const original = nav.request({ action: "contactListing", listingId });
    await vi.waitFor(() => expect(gateway.get).toHaveBeenCalledOnce());
    await auth.endSession();
    expect(nav.getSnapshot()).toMatchObject({ route: { name: "login" }, intent: { action: "contactListing", listingId }, resuming: false });
    api.login.mockResolvedValueOnce({ account: account(2), session: { token: credential(2).token, expiresAt } });
    api.me.mockResolvedValue(account(2));
    await auth.login({ ...loginInput, email: account(2).email });
    await vi.waitFor(() => expect(nav.getSnapshot().resuming).toBe(false));
    late.resolve({ id: listingId, title: "Old fixture", description: "", open: true });
    await original;
    expect(nav.getSnapshot()).toMatchObject({ route: { name: "listing", listingId, contactReady: true }, intent: null });
    expect(gateway.checkContact).toHaveBeenCalledOnce();
    expect(gateway.checkContact.mock.calls[0][1] === credential(2).token).toBe(true);
    nav.dispose();
  });

  it("returns an expired private screen to login with a semantic intent, not the previous private identity", async () => {
    const { auth, api, nav } = setup();
    await auth.login(loginInput);
    await nav.request({ action: "openPrivateProfile" });
    expect(nav.getSnapshot().route.name).toBe("profile");
    api.me.mockRejectedValueOnce(new AuthError("UNAUTHENTICATED", "Revoked"));
    await auth.restore({ force: true });
    expect(nav.getSnapshot()).toMatchObject({ route: { name: "login" }, intent: { action: "openPrivateProfile" } });
    expect(auth.getSnapshot().account).toBeNull();
    nav.dispose();
  });

  it("drops a closed-listing intent without invoking contact access", async () => {
    const { auth, nav, gateway } = setup();
    await auth.restore();
    await nav.request({ action: "contactListing", listingId });
    gateway.get.mockResolvedValueOnce({ id: listingId, title: "Closed fixture", description: "", open: false });
    await auth.login(loginInput);
    await vi.waitFor(() => expect(nav.getSnapshot().resuming).toBe(false));
    expect(nav.getSnapshot()).toMatchObject({ route: { name: "listing", listingId }, intent: null, message: "Tin không còn mở để liên hệ." });
    expect(gateway.checkContact).not.toHaveBeenCalled();
    nav.dispose();
  });

  it("does not treat a missing production listing API as successful integration", async () => {
    const { auth } = setup();
    const nav = createSessionNavigation(auth, unavailableListings);
    await auth.login(loginInput);
    await nav.request({ action: "createListing" });
    expect(nav.getSnapshot()).toMatchObject({ route: { name: "browse" }, intent: null });
    expect(nav.getSnapshot().message).toContain("chưa sẵn sàng");
    nav.dispose();
  });
});
