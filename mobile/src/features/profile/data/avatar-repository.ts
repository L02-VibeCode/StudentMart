import { AuthError, parseAccount } from "../../auth/business/auth";
import type { AuthCoordinator } from "../../auth/business/auth-coordinator";
import type { AvatarRepository } from "../business/avatar-model";
export function createAvatarRepository(origin: string, auth: AuthCoordinator): AvatarRepository {
  async function send(token: string, signal: AbortSignal, body?: FormData) {
    const controller = new AbortController(); const abort = () => controller.abort();
    if (signal.aborted) abort(); else signal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, 30000);
    try { const response = await fetch(`${origin}/api/v1/accounts/me/avatar`, { method: body ? "PUT" : "DELETE", body, signal: controller.signal, headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
      if (!response.ok) throw new AuthError(response.status === 401 ? "UNAUTHENTICATED" : response.status === 403 ? "FORBIDDEN" : "SERVICE_UNAVAILABLE", "Chưa xử lý được ảnh.");
      if (body) return parseAccount((await response.json()).account);
      if (response.status !== 204) throw new AuthError("INVALID_RESPONSE", "Chưa xác nhận xóa ảnh.");
      return null;
    } finally { clearTimeout(timer); signal.removeEventListener("abort", abort); }
  }
  return {
    upload: asset => auth.runPrivate(async (token, signal) => { const body = new FormData(); body.append("file", { uri: asset.uri, name: asset.name, type: asset.mimeType } as unknown as Blob); const account = await send(token, signal, body); if (!account) throw new Error("Missing account"); return account; }),
    remove: async () => { await auth.runPrivate((token, signal) => send(token, signal)); return auth.runPrivate(async () => { const a = auth.getSnapshot().account; if (!a) throw new Error("Missing account"); return a; }); },
  };
}
