import type { AuthCoordinator } from "../../auth/business/auth-coordinator";
import type { PrivateAccount } from "../../auth/business/auth";
export type AvatarAsset = { uri: string; name: string; mimeType: string; size?: number };
export type AvatarRepository = { upload(asset: AvatarAsset): Promise<PrivateAccount>; remove(): Promise<PrivateAccount> };
export function createAvatarModel(repository: AvatarRepository, auth: AuthCoordinator, pick: () => Promise<AvatarAsset | null>) {
  let state = { busy: false, pending: null as AvatarAsset | null, message: "", avatarUrl: auth.getSnapshot().account?.avatarUrl ?? null };
  let generation = 0, owner = auth.getSnapshot(); const listeners = new Set<() => void>();
  const update = (next: Partial<typeof state>) => { state = { ...state, ...next }; listeners.forEach(l => l()); };
  const reset = () => { generation++; update({ busy: false, pending: null, message: "", avatarUrl: auth.getSnapshot().account?.avatarUrl ?? null }); };
  const unsubscribe = auth.subscribe(() => { const next = auth.getSnapshot(); if (next.epoch !== owner.epoch || next.account?.id !== owner.account?.id || next.status !== "authenticated") reset(); owner = next; });
  const current = (n: number) => generation === n && auth.getSnapshot().status === "authenticated";
  async function upload() { if (state.busy || !state.pending) return; const n = generation, asset = state.pending; update({ busy: true, message: "Đang tải ảnh lên…" }); try { const account = await repository.upload(asset); if (account.id !== auth.getSnapshot().account?.id) throw new Error("Identity mismatch"); if (current(n)) update({ avatarUrl: account.avatarUrl, pending: null, message: "Đã cập nhật ảnh đại diện." }); } catch { if (current(n)) update({ message: "Chưa tải được ảnh. Ảnh hiện tại được giữ nguyên. Bạn có thể thử lại." }); } finally { if (current(n)) update({ busy: false }); } }
  return { getSnapshot: () => state, subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }, reset, upload,
    async choose() { if (state.busy) return; const n = generation; update({ busy: true, message: "" }); try { const asset = await pick(); if (!current(n)) return; if (asset && (!['image/jpeg','image/png','image/webp'].includes(asset.mimeType) || (asset.size !== undefined && asset.size > 5242880))) { update({ message: "Chọn ảnh JPEG, PNG hoặc WebP tối đa 5 MiB." }); return; } if (asset) update({ pending: asset }); } catch { if (current(n)) update({ message: "Chưa mở được thư viện ảnh. Kiểm tra quyền truy cập ảnh trong cài đặt thiết bị." }); } finally { if (current(n)) update({ busy: false }); } },
    async remove() { if (state.busy) return; const n = generation; update({ busy: true, message: "Đang xóa ảnh…" }); try { const account = await repository.remove(); if (current(n)) update({ avatarUrl: account.avatarUrl, pending: null, message: "Đã xóa ảnh đại diện." }); } catch { if (current(n)) update({ message: "Chưa xóa được ảnh. Ảnh hiện tại vẫn được giữ nguyên." }); } finally { if (current(n)) update({ busy: false }); } },
    dispose() { reset(); unsubscribe(); listeners.clear(); },
  };
}
export type AvatarModel = ReturnType<typeof createAvatarModel>;
