import { afterEach, expect, it, vi } from "vitest";
import { createAuthCoordinator } from "../../src/features/auth/business/auth-coordinator";
import { createNativeAvatarRepository } from "../../src/features/profile/data/native-avatar-repository";
import { account, credential, expiresAt, now } from "../support/auth-fixtures";
const native = vi.hoisted(() => ({ request: vi.fn(), exists: true }));
vi.mock("expo/fetch", () => ({ fetch: native.request }));
vi.mock("expo-file-system", () => ({ File: class extends Blob { uri: string; constructor(uri: string) { super([new Uint8Array([1, 2, 3])], { type: "image/png" }); this.uri = uri; } get exists() { return native.exists; } } }));
afterEach(() => { vi.clearAllMocks(); vi.useRealTimers(); native.exists = true; });
async function setup() {
  const api = { login: vi.fn().mockResolvedValue({ account: account(), session: { token: credential().token, expiresAt } }), me: vi.fn().mockResolvedValue(account()), logout: vi.fn().mockResolvedValue(undefined) };
  const auth = createAuthCoordinator(api, { async read() { return null; }, async write() {}, async clear() {} }, () => now);
  await auth.login({ email: account().email, password: "password" });
  return createNativeAvatarRepository("https://api.example.invalid", auth);
}
const asset = { uri: "file:///picked.png", name: "picked.png", mimeType: "image/png", size: 3 };
it("production adapter sends native File bytes through Expo fetch instead of URI object coercion", async () => {
  const repository = await setup();
  native.request.mockResolvedValueOnce(new Response(JSON.stringify({ account: { ...account(), avatarUrl: "https://cdn.example.invalid/avatar.png" } }), { status: 200 }));
  expect((await repository.upload(asset)).avatarUrl).toContain("avatar.png");
  const [url, options] = native.request.mock.calls[0];
  expect(url).toBe("https://api.example.invalid/api/v1/accounts/me/avatar");
  expect(options.headers).not.toHaveProperty("Content-Type");
  const part = options.body.get("file") as File;
  expect(part.name).toBe("picked.png");
  expect(new Uint8Array(await part.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
});
it("reports unavailable local URI before making any upload network request", async () => {
  const repository = await setup(); native.exists = false;
  await expect(repository.upload(asset)).rejects.toMatchObject({ code: "LOCAL_FILE_UNAVAILABLE" });
  expect(native.request).not.toHaveBeenCalled();
});
it("distinguishes a real deadline abort from an immediate transport failure", async () => {
  const repository = await setup(); vi.useFakeTimers();
  native.request.mockImplementationOnce((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new Error("aborted")))));
  const uploading = repository.upload(asset);
  const assertion = expect(uploading).rejects.toMatchObject({ code: "UPLOAD_TIMEOUT" });
  await vi.advanceTimersByTimeAsync(30001); await assertion;
});
