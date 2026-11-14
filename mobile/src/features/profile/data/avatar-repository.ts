import { AuthError, parseAccount } from "../../auth/business/auth";
import type { AuthCoordinator } from "../../auth/business/auth-coordinator";
import type { AvatarRepository } from "../business/avatar-model";
import type { ApiRequest } from "../../auth/data/registration-api";
export function createAvatarRepository(origin: string, auth: AuthCoordinator, request: ApiRequest = fetch): AvatarRepository {
  async function send(token: string, signal: AbortSignal, body?: FormData) {
    const controller = new AbortController(); const abort = () => controller.abort();
    if (signal.aborted) abort(); else signal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, 30000);
    try { const response = await request(`${origin}/api/v1/accounts/me/avatar`, { method: body ? "PUT" : "DELETE", body, signal: controller.signal, headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
      if (!response.ok) {
        if (response.status === 401) throw new AuthError("UNAUTHENTICATED", "Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.");
        if (response.status === 403) throw new AuthError("FORBIDDEN", "Tài khoản hiện không được phép thay đổi ảnh.");
        if (response.status === 413) throw new AuthError("PAYLOAD_TOO_LARGE", "Ảnh vượt quá 5 MiB. Vui lòng chọn ảnh nhỏ hơn.");
        if (response.status === 415) throw new AuthError("UNSUPPORTED_MEDIA_TYPE", "Ảnh chưa được hỗ trợ. Hãy chọn ảnh JPEG, PNG hoặc WebP.");
        if (response.status === 400) throw new AuthError("VALIDATION_ERROR", "Máy chủ từ chối nội dung ảnh. Hãy chọn ảnh JPEG, PNG hoặc WebP khác.");
        if (response.status === 503) throw new AuthError("SERVICE_UNAVAILABLE", "Dịch vụ lưu ảnh chưa sẵn sàng. Vui lòng thử lại sau.");
        throw new AuthError("SERVICE_UNAVAILABLE", "Máy chủ chưa xử lý được ảnh. Vui lòng thử lại sau.");
      }
      if (body) { if (response.status !== 200) throw new AuthError("INVALID_RESPONSE", "Chưa xác nhận cập nhật ảnh."); return parseAccount((await response.json()).account); }
      if (response.status !== 204) throw new AuthError("INVALID_RESPONSE", "Chưa xác nhận xóa ảnh.");
      return null;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError("NETWORK_ERROR", "Không kết nối được máy chủ hoặc tải ảnh quá lâu. Kiểm tra mạng rồi thử lại.");
    } finally { clearTimeout(timer); signal.removeEventListener("abort", abort); }
  }
  return {
    upload: asset => auth.runPrivate(async (token, signal) => { const body = new FormData(); body.append("file", { uri: asset.uri, name: asset.name, type: asset.mimeType } as unknown as Blob); const account = await send(token, signal, body); if (!account) throw new Error("Missing account"); return account; }),
    remove: async () => { await auth.runPrivate((token, signal) => send(token, signal)); return auth.runPrivate(async () => { const a = auth.getSnapshot().account; if (!a) throw new Error("Missing account"); return a; }); },
  };
}
