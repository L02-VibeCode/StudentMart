import { describe, expect, it, vi } from "vitest";
import { createAuthCoordinator } from "../../src/features/auth/business/auth-coordinator";
import { createAccountLogoutResources } from "../../src/features/auth/business/account-logout-resources";
import { createSessionNavigation } from "../../src/navigation/session-navigation";
import { unavailableListings } from "../../src/features/listings/business/listing-gateway";
import { type AuthApi, type Credential } from "../../src/features/auth/business/auth";
import { account, credential, deferred, expiresAt, now } from "../support/auth-fixtures";

function setup() {
  let record: Credential | null = null;
  const store = { read: vi.fn(async () => record), write: vi.fn(async (value: Credential) => { record = value; }), clear: vi.fn(async () => { record = null; }) };
  const api = { login: vi.fn<AuthApi["login"]>().mockResolvedValue({ account: account(), session: { token: credential().token, expiresAt } }),
    me: vi.fn<AuthApi["me"]>().mockResolvedValue(account()), logout: vi.fn<AuthApi["logout"]>().mockResolvedValue(undefined) };
  const resources = createAccountLogoutResources();
  return { api, store, resources, record: () => record, auth: createAuthCoordinator(api, store, () => now, resources) };
}
const input = { email: account().email, password: "test-password" };

describe("logout isolation", () => {
  it("finishes local logout without waiting for remote revocation and ignores the late result after B logs in", async () => {
    const { auth, api, record } = setup();
    await auth.login(input);
    const remote = deferred<void>();
    api.logout.mockImplementationOnce(() => remote.promise);
    await auth.endSession();
    expect(record()).toBeNull();
    expect(auth.getSnapshot()).toMatchObject({ status: "guest", account: null, busy: false });
    expect(auth.getSnapshot().message).toContain("Chưa xác nhận thu hồi");
    api.login.mockResolvedValueOnce({ account: account(2), session: { token: credential(2).token, expiresAt } });
    api.me.mockResolvedValueOnce(account(2));
    await auth.login({ ...input, email: account(2).email });
    remote.resolve();
    await remote.promise; await Promise.resolve(); await Promise.resolve();
    expect(auth.getSnapshot()).toMatchObject({ status: "authenticated", account: { id: account(2).id }, message: "" });
    expect(record()?.accountId).toBe(account(2).id);
  });

  it("clears only A's private resources, disconnects local realtime/push and preserves public/B data", async () => {
    const { auth, resources } = setup();
    const cache = new Map([[account().id, { draft: "A", messages: ["A"] }], [account(2).id, { draft: "B", messages: ["B"] }]]);
    const publicCache = new Map([["categories", ["public"]]]);
    const disconnectRealtime = vi.fn(); const releasePush = vi.fn();
    resources.register({ async clearPrivate(id) { cache.delete(id); }, disconnectRealtime, releasePush });
    await auth.login(input);
    await auth.endSession();
    expect(cache.has(account().id)).toBe(false);
    expect(cache.get(account(2).id)).toEqual({ draft: "B", messages: ["B"] });
    expect(publicCache.get("categories")).toEqual(["public"]);
    expect(disconnectRealtime).toHaveBeenCalledExactlyOnceWith(account().id);
    expect(releasePush).toHaveBeenCalledExactlyOnceWith(account().id);
  });

  it("blocks new authentication until failed account cleanup is retried, including restore", async () => {
    const { auth, resources, api } = setup();
    const clearPrivate = vi.fn().mockRejectedValueOnce(new Error("adapter private detail")).mockResolvedValueOnce(undefined);
    resources.register({ clearPrivate });
    await auth.login(input);
    await auth.endSession();
    expect(auth.getSnapshot()).toMatchObject({ status: "blocked", account: null });
    await expect(auth.login(input)).rejects.toMatchObject({ code: "STORAGE_ERROR" });
    const reads = api.me.mock.calls.length;
    await auth.restore();
    expect(api.me.mock.calls.length).toBe(reads);
    expect(auth.getSnapshot().status).toBe("blocked");
    expect(auth.getSnapshot().message).not.toContain("adapter private detail");
    await auth.endSession();
    expect(clearPrivate.mock.calls.map(call => call[0])).toEqual([account().id, account().id]);
    expect(auth.getSnapshot()).toMatchObject({ status: "guest", account: null });
  });

  it("does not lose failed cleanup scope when an older concurrent logout completes later", async () => {
    const { auth, resources } = setup();
    const first = deferred<void>();
    const clearPrivate = vi.fn().mockImplementationOnce(() => first.promise).mockRejectedValueOnce(new Error("failed second cleanup")).mockResolvedValueOnce(undefined);
    resources.register({ clearPrivate });
    await auth.login(input);
    const earlier = auth.endSession();
    const later = auth.endSession();
    await later;
    first.resolve(); await earlier;
    await auth.restore();
    expect(auth.getSnapshot().status).toBe("blocked");
    await auth.endSession();
    expect(clearPrivate).toHaveBeenCalledTimes(3);
    expect(clearPrivate.mock.calls.every(call => call[0] === account().id)).toBe(true);
    expect(auth.getSnapshot().status).toBe("guest");
  });

  it("resets navigation origin/intent so Back cannot revisit account A's private context", async () => {
    const { auth } = setup();
    const nav = createSessionNavigation(auth, unavailableListings);
    await auth.login(input);
    await nav.request({ action: "openPrivateProfile" });
    expect(nav.getSnapshot().route.name).toBe("profile");
    nav.resetForLogout();
    await auth.endSession();
    nav.cancelLogin();
    expect(nav.getSnapshot()).toMatchObject({ route: { name: "browse" }, intent: null, resuming: false });
    expect(auth.getSnapshot().account).toBeNull();
    nav.dispose();
  });
});
