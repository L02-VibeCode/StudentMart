import { RegistrationError, type RegisterAccount } from "../business/registration";

export type ApiRequest = (url: string, init?: RequestInit) => Promise<Response>;

export function createRegistrationApi(origin: string, request: ApiRequest = fetch): RegisterAccount {
  return async input => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await request(`${origin}/api/v1/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: input.email, password: input.password, displayName: input.displayName }),
        signal: controller.signal,
      });
      const body = await response.json().catch(() => null);
      if (response.status === 409 && body?.error?.code === "EMAIL_ALREADY_EXISTS") {
        throw new RegistrationError("Email này đã được sử dụng. Hãy dùng email khác hoặc đăng nhập.", { email: "Email đã được sử dụng." });
      }
      if (response.status === 400 && body?.error?.code === "VALIDATION_ERROR") {
        const fields: Record<string, string> = {};
        for (const key of ["email", "password", "displayName"] as const) {
          if (typeof body.error.fields?.[key] === "string") fields[key] = "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.";
        }
        throw new RegistrationError("Vui lòng kiểm tra lại thông tin đăng ký.", fields);
      }
      if (response.status === 429) {
        const seconds = Number(response.headers.get("Retry-After"));
        const minutes = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds / 60) : 15;
        throw new RegistrationError(`Bạn đã thử quá nhiều lần. Thử lại sau khoảng ${minutes} phút.`);
      }
      if (!response.ok) throw new RegistrationError("Chưa thể tạo tài khoản lúc này. Vui lòng thử lại sau.");
      const account = body?.account;
      if (response.status !== 201 || !account || typeof account.id !== "string" || typeof account.email !== "string"
        || typeof account.displayName !== "string" || account.role !== "MEMBER"
        || account.schoolVerification?.status !== "UNVERIFIED" || body.session !== undefined) {
        throw new RegistrationError("Chưa xác nhận được kết quả đăng ký. Vui lòng kiểm tra trước khi thử lại.");
      }
      return { id: account.id, email: account.email, displayName: account.displayName, role: account.role };
    } catch (error) {
      if (error instanceof RegistrationError) throw error;
      throw new RegistrationError("Không kết nối được máy chủ. Kiểm tra mạng và thử lại. Nếu vừa gửi đăng ký, hãy kiểm tra tài khoản trước khi gửi lại.");
    } finally {
      clearTimeout(timeout);
    }
  };
}
