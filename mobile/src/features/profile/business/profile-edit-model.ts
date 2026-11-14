import type { AuthCoordinator } from "../../auth/business/auth-coordinator";
import type { PrivateAccount, Lookup } from "../../auth/business/auth";
import { draftFrom, profileErrors, profilePatch, type ProfileDraft, type ProfileEditRepository } from "./profile-edit";

export function createProfileEditModel(repository: ProfileEditRepository, auth: AuthCoordinator) {
  type State = { status: "idle" | "loading" | "ready" | "error"; original: PrivateAccount | null; draft: ProfileDraft; busy: boolean; message: string; schools: Lookup[]; areas: Lookup[]; catalogError: boolean };
  const empty = (): State => ({ status: "idle", original: null, draft: { displayName: "", bio: "", declaredSchoolId: null, areaId: null }, busy: false, message: "", schools: [], areas: [], catalogError: false });
  let state = empty(), generation = 0;
  let owner = auth.getSnapshot();
  const listeners = new Set<() => void>();
  const update = (next: Partial<State>) => { state = { ...state, ...next }; listeners.forEach(l => l()); };
  function reset() { generation++; state = empty(); listeners.forEach(l => l()); }
  const unsubscribe = auth.subscribe(() => { const next = auth.getSnapshot(); if (next.epoch !== owner.epoch || next.account?.id !== owner.account?.id || next.status !== "authenticated") reset(); owner = next; });
  const current = (n: number) => generation === n && auth.getSnapshot().status === "authenticated";
  return {
    getSnapshot: () => state,
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }, reset,
    dirty: () => !!state.original && Object.keys(profilePatch(state.draft, state.original)).length > 0,
    errors: () => profileErrors(state.draft),
    change<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) { if (!state.busy) update({ draft: { ...state.draft, [key]: value }, message: "" }); },
    async load() { const n = ++generation; update({ status: "loading", message: "" }); try { const original = await repository.load(); if (current(n)) update({ original, draft: draftFrom(original), status: "ready" }); } catch { if (current(n)) update({ status: "error", message: "Chưa tải được hồ sơ. Vui lòng thử lại." }); } },
    async loadCatalog() { const n = generation; const results = await Promise.allSettled([repository.catalog("schools"), repository.catalog("areas")]); if (current(n)) update({ schools: results[0].status === "fulfilled" ? results[0].value : [], areas: results[1].status === "fulfilled" ? results[1].value : [], catalogError: results.some(r => r.status === "rejected") }); },
    async save() { if (!state.original || state.busy || Object.keys(profileErrors(state.draft)).length) return false; const patch = profilePatch(state.draft, state.original); if (!Object.keys(patch).length) return false; const n = generation; update({ busy: true, message: "" }); try { const original = await repository.save(patch); if (original.id !== state.original?.id) throw new Error("Identity mismatch"); if (!current(n)) return false; update({ original, draft: draftFrom(original), message: "Đã lưu hồ sơ." }); return true; } catch { if (current(n)) update({ message: "Chưa lưu được hồ sơ. Nội dung của bạn được giữ lại; hãy kiểm tra dữ liệu và thử lại." }); return false; } finally { if (current(n)) update({ busy: false }); } },
    dispose() { reset(); unsubscribe(); listeners.clear(); },
  };
}
export type ProfileEditModel = ReturnType<typeof createProfileEditModel>;
