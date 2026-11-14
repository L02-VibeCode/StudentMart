import { AuthError, parseAccount } from "../../auth/business/auth";
import type { AuthCoordinator } from "../../auth/business/auth-coordinator";
import type { ProfileEditRepository } from "../business/profile-edit";
import type { ApiRequest } from "../../auth/data/registration-api";
export function createProfileEditRepository(origin: string, auth: AuthCoordinator, request: ApiRequest = fetch): ProfileEditRepository {
  async function send(path: string, token: string, signal: AbortSignal, patch?: unknown) {
    const controller = new AbortController(); const abort = () => controller.abort();
    if (signal.aborted) abort(); else signal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, 15000);
    try {
      const response = await request(`${origin}/api/v1${path}`, { method: patch ? "PATCH" : "GET", signal: controller.signal, cache: "no-store", headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...(patch ? { "Content-Type": "application/json" } : {}) }, ...(patch ? { body: JSON.stringify(patch) } : {}) });
      if (!response.ok) throw new AuthError(response.status === 401 ? "UNAUTHENTICATED" : response.status === 403 ? "FORBIDDEN" : "SERVICE_UNAVAILABLE", "Chưa thực hiện được yêu cầu.");
      return await response.json();
    } catch (e) { if (e instanceof AuthError) throw e; throw new AuthError("NETWORK_ERROR", "Không kết nối được máy chủ."); }
    finally { clearTimeout(timer); signal.removeEventListener("abort", abort); }
  }
  return {
    load: () => auth.runPrivate(async () => { const account = auth.getSnapshot().account; if (!account) throw new AuthError("UNAUTHENTICATED", "Vui lòng đăng nhập."); return account; }),
    save: patch => auth.runPrivate(async (token, signal) => { const body = await send("/accounts/me", token, signal, patch); return parseAccount(body?.account); }),
    catalog: kind => auth.runPrivate(async (token, signal) => { const body = await send(`/catalog/${kind}`, token, signal); if (!body || !Array.isArray(body.items) || body.items.some((v: any) => typeof v.id !== "string" || typeof v.name !== "string")) throw new AuthError("INVALID_RESPONSE", "Danh mục chưa sẵn sàng."); return body.items.map((v: any) => ({ id: v.id, name: v.name })); }),
  };
}
