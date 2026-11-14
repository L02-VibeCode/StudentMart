import { expect, it, vi } from "vitest";
import { createAuthCoordinator } from "../../src/features/auth/business/auth-coordinator";
import { createProfileEditModel } from "../../src/features/profile/business/profile-edit-model";
import { createAvatarModel, type AvatarAsset } from "../../src/features/profile/business/avatar-model";
import { profileErrors, profilePatch, draftFrom } from "../../src/features/profile/business/profile-edit";
import { account, credential, expiresAt, now, deferred } from "../support/auth-fixtures";
async function setup() {
  const api = { login: vi.fn().mockResolvedValue({ account: account(), session: { token: credential().token, expiresAt } }), me: vi.fn().mockResolvedValue(account()), logout: vi.fn().mockResolvedValue(undefined) };
  const auth = createAuthCoordinator(api, { async read() { return null; }, async write() {}, async clear() {} }, () => now);
  await auth.login({ email: account().email, password: "password" });
  const repo = { load: vi.fn().mockResolvedValue(account()), save: vi.fn().mockResolvedValue({ ...account(), displayName: "Saved" }), catalog: vi.fn().mockResolvedValue([]) };
  const model = createProfileEditModel(repo, auth); await model.load(); return { api, auth, repo, model };
}
it("prefills and saves only changed normalized fields, resets dirty only after server confirmation", async () => {
  const { model, repo } = await setup(); expect(model.dirty()).toBe(false); expect(await model.save()).toBe(false);
  model.change("displayName", " Saved "); expect(model.dirty()).toBe(true);
  const pending = deferred<ReturnType<typeof account>>(); repo.save.mockReturnValueOnce(pending.promise); const result = model.save();
  expect(model.getSnapshot().busy).toBe(true); model.change("bio", "ignored while saving"); expect(model.getSnapshot().draft.bio).toBe("");
  pending.resolve({ ...account(), displayName: "Saved" }); expect(await result).toBe(true);
  expect(repo.save).toHaveBeenCalledWith({ displayName: "Saved" }); expect(model.dirty()).toBe(false); model.dispose();
});
it("validation counts unicode codepoints and nullable clear patches preserve whitelist", () => {
  const original = { ...account(), bio: "old", area: { id: account(2).id, name: "Area" } };
  expect(profileErrors({ ...draftFrom(original), displayName: "😀".repeat(100) })).toEqual({});
  expect(profileErrors({ ...draftFrom(original), bio: "😀".repeat(501) }).bio).toBeTruthy();
  expect(profilePatch({ ...draftFrom(original), bio: " ", areaId: null }, original)).toEqual({ bio: null, areaId: null });
});
it("foreground identity revalidation preserves same-account unsaved input", async () => {
  const { model, auth } = await setup(); model.change("bio", "Keep this draft");
  await auth.runPrivate(async () => undefined);
  expect(model.getSnapshot().draft.bio).toBe("Keep this draft"); expect(model.dirty()).toBe(true); model.dispose();
});
it("save failures preserve input and late old-account responses cannot overwrite reset model", async () => {
  const { model, repo, auth } = await setup(); model.change("bio", "Unsaved draft"); repo.save.mockRejectedValueOnce(Error("offline"));
  expect(await model.save()).toBe(false); expect(model.getSnapshot().draft.bio).toBe("Unsaved draft"); expect(model.dirty()).toBe(true);
  const late = deferred<ReturnType<typeof account>>(); repo.save.mockReturnValueOnce(late.promise); const saving = model.save(); await auth.endSession();
  late.resolve({ ...account(), bio: "Unsaved draft" }); expect(await saving).toBe(false); expect(model.getSnapshot().original).toBeNull(); model.dispose();
});
const asset: AvatarAsset = { uri: "file:///test.jpg", name: "test.jpg", mimeType: "image/jpeg", size: 42 };
it("picker cancel and upload failure preserve avatar; retry updates only after server reply", async () => {
  const { auth } = await setup(); const pick = vi.fn().mockResolvedValueOnce(null).mockResolvedValue(asset);
  const repo = { upload: vi.fn().mockRejectedValueOnce(Error("offline")).mockResolvedValue({ ...account(), avatarUrl: "https://cdn.example.invalid/new.jpg" }), remove: vi.fn().mockResolvedValue(account()) };
  const model = createAvatarModel(repo, auth, pick); await model.choose(); expect(model.getSnapshot().pending).toBeNull();
  await model.choose(); await model.upload(); expect(model.getSnapshot().avatarUrl).toBeNull(); expect(model.getSnapshot().pending).toEqual(asset);
  await model.upload(); expect(model.getSnapshot().avatarUrl).toContain("new.jpg"); expect(model.getSnapshot().pending).toBeNull();
  await model.remove(); expect(model.getSnapshot().avatarUrl).toBeNull(); model.dispose();
});
it("rejects unsupported/oversize picker assets and clears pending resources when logout occurs", async () => {
  const { auth } = await setup(); const pick = vi.fn().mockResolvedValueOnce({ ...asset, size: 5242881 }).mockResolvedValueOnce({ ...asset, mimeType: "image/gif" }).mockResolvedValue(asset);
  const repo = { upload: vi.fn(), remove: vi.fn() }; const model = createAvatarModel(repo, auth, pick);
  await model.choose(); expect(model.getSnapshot().pending).toBeNull(); await model.choose(); expect(model.getSnapshot().pending).toBeNull();
  await model.choose(); expect(model.getSnapshot().pending).toEqual(asset); await auth.endSession(); expect(model.getSnapshot().pending).toBeNull(); model.dispose();
});
