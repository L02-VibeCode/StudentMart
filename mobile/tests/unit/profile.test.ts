import { describe, expect, it, vi } from "vitest";
import { AuthError, type AuthApi, type Credential, type PrivateAccount } from "../../src/features/auth/business/auth";
import { createAuthCoordinator } from "../../src/features/auth/business/auth-coordinator";
import { createProfileModel } from "../../src/features/profile/business/profile-model";
import { profileDetails, profileInitials } from "../../src/features/profile/business/profile";
import { createProfileRepository } from "../../src/features/profile/data/profile-repository";
import { createSessionNavigation } from "../../src/navigation/session-navigation";
import { unavailableListings } from "../../src/features/listings/business/listing-gateway";
import { account, credential, deferred, expiresAt, now } from "../support/auth-fixtures";

async function setup() {
  let record: Credential | null = null;
  const api = { login: vi.fn<AuthApi["login"]>().mockResolvedValue({ account: account(), session: { token: credential().token, expiresAt } }),
    me: vi.fn<AuthApi["me"]>().mockResolvedValue(account()), logout: vi.fn<AuthApi["logout"]>().mockResolvedValue(undefined) };
  const store = { async read() { return record; }, async write(value: Credential) { record = value; }, async clear() { record = null; } };
  const auth = createAuthCoordinator(api, store, () => now);
  await auth.login({ email: account().email, password: "test-password" });
  const model = createProfileModel(createProfileRepository(auth), auth);
  return { api, auth, model };
}

describe("current profile", () => {
  it("loads a fresh account through the session repository, deduplicates loading and keeps no stale profile while fetching", async () => {
    const { api, model } = await setup();
    const reply = deferred<PrivateAccount>();
    api.me.mockReturnValueOnce(reply.promise);
    const before = api.me.mock.calls.length;
    const load = model.load();
    expect(model.getSnapshot()).toEqual({ status: "loading", account: null, message: "" });
    await model.load();
    expect(api.me.mock.calls.length).toBe(before + 1);
    reply.resolve({ ...account(), bio: "Sinh viên thích trao đổi sách." });
    await load;
    expect(model.getSnapshot()).toMatchObject({ status: "ready", account: { id: account().id, bio: "Sinh viên thích trao đổi sách." } });
    model.dispose();
  });

  it("reports network failure, then retries and displays the server's current value", async () => {
    const { api, model } = await setup();
    api.me.mockRejectedValueOnce(new AuthError("NETWORK_ERROR", "internal detail"));
    await model.load();
    expect(model.getSnapshot()).toMatchObject({ status: "error", account: null });
    expect(model.getSnapshot().message).toContain("Kiểm tra mạng");
    api.me.mockResolvedValueOnce({ ...account(), displayName: "Tên đã cập nhật" });
    await model.load();
    expect(model.getSnapshot()).toMatchObject({ status: "ready", account: { displayName: "Tên đã cập nhật" }, message: "" });
    model.dispose();
  });

  it("clears previously loaded details on error and never displays raw provider errors", async () => {
    const { api, model } = await setup();
    await model.load();
    api.me.mockRejectedValueOnce(new Error("private-provider-token-detail"));
    await model.load();
    expect(model.getSnapshot()).toMatchObject({ status: "error", account: null });
    expect(JSON.stringify(model.getSnapshot())).not.toContain("private-provider");
    model.dispose();
  });

  it("does not show A's delayed response after logout and a new B session", async () => {
    const { api, auth, model } = await setup();
    const old = deferred<PrivateAccount>();
    api.me.mockReturnValueOnce(old.promise);
    const loadingA = model.load();
    await auth.endSession();
    expect(model.getSnapshot().account).toBeNull();
    api.login.mockResolvedValueOnce({ account: account(2), session: { token: credential(2).token, expiresAt } });
    api.me.mockResolvedValue(account(2));
    await auth.login({ email: account(2).email, password: "test-password" });
    await model.load();
    old.resolve(account()); await loadingA;
    expect(model.getSnapshot()).toMatchObject({ status: "ready", account: { id: account(2).id } });
    expect(JSON.stringify(model.getSnapshot())).not.toContain(account().email);
    model.dispose();
  });

  it("drops a pending result after screen reset instead of repopulating private cache", async () => {
    const { api, model } = await setup();
    const reply = deferred<PrivateAccount>(); api.me.mockReturnValueOnce(reply.promise);
    const load = model.load(); model.reset(); reply.resolve(account()); await load;
    expect(model.getSnapshot()).toEqual({ status: "idle", account: null, message: "" });
    model.dispose();
  });

  it("rejects a profile identity mismatch and clears the invalid session", async () => {
    const { api, auth, model } = await setup();
    api.me.mockResolvedValueOnce(account(2));
    await model.load();
    expect(model.getSnapshot().account).toBeNull();
    expect(auth.getSnapshot()).toMatchObject({ status: "guest", account: null });
    model.dispose();
  });

  it("uses null fallbacks and only server verification status while keeping declared and verified schools separate", () => {
    expect(profileDetails(account())).toEqual({ school: "Chưa chọn trường", area: "Chưa chọn khu vực", bio: "Bạn chưa thêm giới thiệu bản thân.", verified: false });
    const details = profileDetails({ ...account(), bio: "Mua bán sách", declaredSchool: { id: account().id, name: "Trường tự khai" },
      area: { id: account().id, name: "Khu vực đã chọn" }, schoolVerification: { status: "VERIFIED", school: { id: account(2).id, name: "Trường xác thực khác" }, verifiedAt: expiresAt } });
    expect(details).toEqual({ school: "Trường tự khai", area: "Khu vực đã chọn", bio: "Mua bán sách", verified: true });
    expect(profileInitials("  Nguyễn   Linh ")).toBe("NL");
  });

  it("makes edit/verification entry points private and removes them when the session ends", async () => {
    const { auth, model } = await setup();
    const nav = createSessionNavigation(auth, unavailableListings);
    await nav.request({ action: "openPrivateProfile" });
    nav.profileDestination("edit"); expect(nav.getSnapshot().route.name).toBe("profile-edit");
    await nav.request({ action: "openPrivateProfile" });
    nav.profileDestination("verification"); expect(nav.getSnapshot().route.name).toBe("profile-verification");
    await auth.endSession();
    nav.profileDestination("edit");
    expect(nav.getSnapshot().route.name).toBe("login");
    nav.dispose(); model.dispose();
  });
});
