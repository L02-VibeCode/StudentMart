import { describe, expect, it, vi } from "vitest";
import { RegistrationError, validateRegistration, type RegistrationForm, type RegisteredAccount } from "../../src/features/auth/business/registration";
import { createRegistrationModel } from "../../src/features/auth/presentation/registration-model";
import { createRegistrationApi } from "../../src/features/auth/data/registration-api";
import { resolveApiOrigin } from "../../src/shared/config/api-origin";

const valid = { email: " MEMBER@Example.com ", displayName: " Student ", password: " password-kept ", confirmPassword: " password-kept " };
const account: RegisteredAccount = { id: "test-id", email: "member@example.com", displayName: "Student", role: "MEMBER" };
function fill(model: ReturnType<typeof createRegistrationModel>, input: RegistrationForm = valid) {
  for (const field of Object.keys(input) as (keyof RegistrationForm)[]) model.setField(field, input[field]);
}

describe("registration client", () => {
  it("validates email, Unicode lengths and exact password confirmation", () => {
    expect(validateRegistration(valid)).toEqual({});
    expect(validateRegistration({ ...valid, displayName: "😀".repeat(100), password: "😀".repeat(128), confirmPassword: "😀".repeat(128) })).toEqual({});
    expect(validateRegistration({ ...valid, email: "bad", displayName: " ", password: "short", confirmPassword: "different" })).toHaveProperty("email");
    expect(Object.keys(validateRegistration({ ...valid, email: "bad", displayName: " ", password: "short", confirmPassword: "different" })).sort()).toEqual(["confirmPassword", "displayName", "email", "password"]);
    expect(validateRegistration({ ...valid, confirmPassword: valid.password.trim() })).toHaveProperty("confirmPassword");
    expect(validateRegistration({ ...valid, displayName: "😀".repeat(101) })).toHaveProperty("displayName");
  });

  it("does not submit invalid forms", async () => {
    const register = vi.fn();
    const navigate = vi.fn();
    const model = createRegistrationModel(register, navigate);
    await model.submit();
    expect(register).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(model.getSnapshot().fields).toHaveProperty("password");
  });

  it("blocks repeated submits immediately, normalizes only allowed fields, and navigates after confirmation", async () => {
    let finish!: (value: RegisteredAccount) => void;
    const register = vi.fn(() => new Promise<RegisteredAccount>(resolve => { finish = resolve; }));
    const navigate = vi.fn();
    const model = createRegistrationModel(register, navigate);
    fill(model);
    const first = model.submit();
    await model.submit();
    expect(register).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith({ email: "member@example.com", displayName: "Student", password: valid.password });
    expect(model.getSnapshot().submitting).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
    finish(account);
    await first;
    expect(navigate).toHaveBeenCalledWith(account.email);
    expect(model.getSnapshot().form.password).toBe("");
    expect(model.getSnapshot().form.confirmPassword).toBe("");
  });

  it("preserves input on duplicate/network errors and allows corrections", async () => {
    const register = vi.fn().mockRejectedValueOnce(new RegistrationError("Email đã tồn tại", { email: "Email đã tồn tại" })).mockRejectedValueOnce(new RegistrationError("Không có mạng"));
    const navigate = vi.fn();
    const model = createRegistrationModel(register, navigate);
    fill(model);
    await model.submit();
    expect(model.getSnapshot()).toMatchObject({ form: valid, submitting: false, fields: { email: "Email đã tồn tại" } });
    model.setField("email", "another@example.com");
    expect(model.getSnapshot().fields.email).toBeUndefined();
    await model.submit();
    expect(model.getSnapshot().form.password).toBe(valid.password);
    expect(model.getSnapshot().message).toBe("Không có mạng");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("ignores responses after leaving the screen and clears credentials", async () => {
    let finish!: (value: RegisteredAccount) => void;
    const navigate = vi.fn();
    const model = createRegistrationModel(() => new Promise(resolve => { finish = resolve; }), navigate);
    fill(model);
    const pending = model.submit();
    model.dispose();
    finish(account);
    await pending;
    expect(navigate).not.toHaveBeenCalled();
    expect(model.getSnapshot().form.password).toBe("");
  });

  it("posts only whitelist fields and projects the confirmed account", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ account: { ...account, schoolVerification: { status: "UNVERIFIED" } } }), { status: 201 }));
    const register = createRegistrationApi("http://192.168.1.53:3000", request);
    const result = await register({ email: account.email, password: valid.password, displayName: account.displayName });
    expect(result).toEqual(account);
    expect(request.mock.calls[0][0]).toBe("http://192.168.1.53:3000/api/v1/auth/register");
    expect(JSON.parse(request.mock.calls[0][1]!.body as string)).toEqual({ email: account.email, password: valid.password, displayName: account.displayName });
  });

  it.each([
    [400, { code: "VALIDATION_ERROR", fields: { email: "invalid" } }, "kiểm tra"],
    [409, { code: "EMAIL_ALREADY_EXISTS" }, "đã được sử dụng"],
    [429, { code: "RATE_LIMITED" }, "2 phút"],
    [503, { code: "SERVICE_UNAVAILABLE" }, "thử lại sau"],
  ])("maps HTTP %i errors to actionable messages", async (status, error, expected) => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ error }), { status, headers: { "Retry-After": "61" } }));
    await expect(createRegistrationApi("http://api", request)(valid)).rejects.toThrow(expected);
  });

  it("does not report success for an unexpected response or network failure", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(JSON.stringify({ account }), { status: 201 })).mockRejectedValueOnce(new TypeError("Network private detail"));
    const register = createRegistrationApi("http://api", request);
    await expect(register(valid)).rejects.toThrow("Chưa xác nhận");
    await expect(register(valid)).rejects.toThrow("Không kết nối");
  });

  it("times out without retrying a mutation automatically", async () => {
    vi.useFakeTimers();
    try {
      const request = vi.fn((url: string, options?: RequestInit) => new Promise<Response>((resolve, reject) => {
        options?.signal?.addEventListener("abort", () => reject(new Error("Aborted")));
      }));
      const rejection = expect(createRegistrationApi("http://api", request)(valid)).rejects.toThrow("Không kết nối");
      await vi.advanceTimersByTimeAsync(15000);
      await rejection;
      expect(request).toHaveBeenCalledTimes(1);
    } finally { vi.useRealTimers(); }
  });
});

describe("API origin for Expo", () => {
  it.each(["android", "ios"])("uses Metro's LAN host on a real %s phone", platform => {
    expect(resolveApiOrigin({ platform, development: true, metroHost: "192.168.1.53:8081" })).toBe("http://192.168.1.53:3000");
  });
  it("honors an explicit API host/port and removes trailing slashes", () => {
    expect(resolveApiOrigin({ platform: "ios", development: true, metroHost: "192.168.1.53:8081", configuredUrl: "https://api.example.com:444/" })).toBe("https://api.example.com:444");
  });
  it("does not mistake the Expo tunnel for an API tunnel", () => {
    expect(resolveApiOrigin({ platform: "android", development: true, metroHost: "project.exp.direct" })).toBe("http://10.0.2.2:3000");
  });
});
