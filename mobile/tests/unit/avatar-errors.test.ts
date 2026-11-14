import { afterEach, expect, it, vi } from "vitest";
import { AuthError } from "../../src/features/auth/business/auth";
import { createAuthCoordinator } from "../../src/features/auth/business/auth-coordinator";
import { createAvatarRepository } from "../../src/features/profile/data/avatar-repository";
import { createAvatarModel } from "../../src/features/profile/business/avatar-model";
import { avatarAssetFromPicker } from "../../src/features/profile/business/avatar-asset";
import { account, credential, expiresAt, now } from "../support/auth-fixtures";

afterEach(() => vi.unstubAllGlobals());
const asset = { uri: "file:///photo.jpg", name: "photo.jpg", mimeType: "image/jpeg", size: 42 };
async function authFixture() {
  const a = { ...account(), avatarUrl: "https://cdn.example.invalid/previous.jpg" };
  const api = { login: vi.fn().mockResolvedValue({ account: a, session: { token: credential().token, expiresAt } }), me: vi.fn().mockResolvedValue(a), logout: vi.fn().mockResolvedValue(undefined) };
  const auth = createAuthCoordinator(api, { async read() { return null; }, async write() {}, async clear() {} }, () => now);
  await auth.login({ email: a.email, password: "password" });
  return auth;
}
function nativeFormDataFixture() {
  class NativeFormData { entries: unknown[][] = []; append(...entry: unknown[]) { this.entries.push(entry); } }
  vi.stubGlobal("FormData", NativeFormData);
}
it("normalizes supported picker metadata without pretending HEIC is JPEG", () => {
  expect(avatarAssetFromPicker({ uri: "content://photo", fileName: "photo.JPG", mimeType: null }).mimeType).toBe("image/jpeg");
  expect(avatarAssetFromPicker({ uri: "file:///photo", mimeType: "IMAGE/JPG" }).name).toBe("avatar.jpg");
  expect(avatarAssetFromPicker({ uri: "file:///photo.heic", mimeType: "image/heic" }).mimeType).toBe("image/heic");
});
it.each([[413, "PAYLOAD_TOO_LARGE", "5 MiB"], [415, "UNSUPPORTED_MEDIA_TYPE", "JPEG"], [400, "VALIDATION_ERROR", "nội dung ảnh"], [503, "SERVICE_UNAVAILABLE", "lưu ảnh chưa sẵn sàng"]])("explains HTTP %i safely without forwarding provider errors", async (status, code, message) => {
  nativeFormDataFixture();
  const auth = await authFixture();
  const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "provider-secret-debug-data" } }), { status }));
  const repository = createAvatarRepository("https://api.example.invalid", auth, request);
  const model = createAvatarModel(repository, auth, async () => asset);
  await model.choose(); await model.upload();
  expect(model.getSnapshot().message).toContain(message);
  expect(model.getSnapshot().message).not.toContain("provider-secret");
  expect(model.getSnapshot().avatarUrl).toContain("previous.jpg");
  expect(model.getSnapshot().pending).toEqual(asset);
  await expect(repository.upload(asset)).rejects.toMatchObject({ code });
  const [url, options] = request.mock.calls[0];
  expect(url).toBe("https://api.example.invalid/api/v1/accounts/me/avatar");
  expect(options.method).toBe("PUT");
  expect(options.headers).not.toHaveProperty("Content-Type");
  expect(options.body.entries).toEqual([["file", { uri: asset.uri, name: asset.name, type: asset.mimeType }]]);
  model.dispose();
});
it("keeps the native network failure distinguishable from provider failure", async () => {
  nativeFormDataFixture(); const auth = await authFixture();
  const repository = createAvatarRepository("https://api.example.invalid", auth, vi.fn().mockRejectedValue(new TypeError("network failed")));
  await expect(repository.upload(asset)).rejects.toBeInstanceOf(AuthError);
  await expect(repository.upload(asset)).rejects.toMatchObject({ code: "NETWORK_ERROR" });
});
