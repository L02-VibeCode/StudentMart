import { AuthError, parseAccount, parseLogin, type AuthApi } from "../business/auth";
import type { ApiRequest } from "./registration-api";

export function createAuthApi(origin: string, request: ApiRequest = fetch): AuthApi {
  async function send(path: string, method: string, token?: string, input?: unknown, expectedStatus = 200, signal?: AbortSignal) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await request(`${origin}/api/v1${path}`, {
        method, cache: "no-store", signal: controller.signal,
        headers: { Accept: "application/json", ...(input ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(input ? { body: JSON.stringify(input) } : {}),
      });
      if (response.ok && response.status !== expectedStatus) throw new AuthError("INVALID_RESPONSE", "Chưa xác nhận được kết quả từ máy chủ. Vui lòng thử lại.");
      if (response.status === 204 && response.ok) return null;
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const code = body?.error?.code;
        if (response.status === 401 && code === "INVALID_CREDENTIALS") throw new AuthError(code, "Email hoặc mật khẩu chưa đúng.");
        if (response.status === 401) throw new AuthError(code === "SESSION_EXPIRED" ? code : "UNAUTHENTICATED", "Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.");
        if (response.status === 403) throw new AuthError("FORBIDDEN", "Tài khoản hiện không được phép truy cập. Vui lòng liên hệ hỗ trợ.");
        if (response.status === 429) {
          const seconds = Number(response.headers.get("Retry-After"));
          const retryAfter = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 900;
          throw new AuthError("RATE_LIMITED", `Bạn đã thử quá nhiều lần. Thử lại sau khoảng ${Math.ceil(retryAfter / 60)} phút.`, retryAfter);
        }
        if (response.status === 400) throw new AuthError("VALIDATION_ERROR", "Vui lòng kiểm tra lại email và mật khẩu.");
        throw new AuthError("SERVICE_UNAVAILABLE", "Dịch vụ tạm thời chưa sẵn sàng. Vui lòng thử lại sau.");
      }
      return body;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError("NETWORK_ERROR", "Không kết nối được máy chủ. Kiểm tra mạng và thử lại.");
    } finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
  }
  return {
    async login(input) { return parseLogin(await send("/auth/login", "POST", undefined, { email: input.email, password: input.password })); },
    async me(token, signal) { const body = await send("/accounts/me", "GET", token, undefined, 200, signal); return parseAccount(body?.account); },
    async logout(token) { await send("/auth/logout", "POST", token, undefined, 204); },
  };
}
