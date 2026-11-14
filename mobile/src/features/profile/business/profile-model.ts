import { AuthError, type PrivateAccount } from "../../auth/business/auth";
import type { AuthCoordinator } from "../../auth/business/auth-coordinator";
import type { ProfileRepository } from "./profile";

export type ProfileState = { status: "idle" | "loading" | "ready" | "error"; account: PrivateAccount | null; message: string };

export function createProfileModel(repository: ProfileRepository, auth: AuthCoordinator) {
  let state: ProfileState = { status: "idle", account: null, message: "" };
  let generation = 0;
  let observedEpoch = auth.getSnapshot().epoch;
  let observedAccountId = auth.getSnapshot().account?.id;
  const listeners = new Set<() => void>();
  function update(next: ProfileState) { state = next; listeners.forEach(listener => listener()); }
  function reset() { generation++; update({ status: "idle", account: null, message: "" }); }
  const unsubscribe = auth.subscribe(() => {
    const current = auth.getSnapshot();
    if (current.epoch !== observedEpoch || current.account?.id !== observedAccountId || current.status !== "authenticated") {
      observedEpoch = current.epoch;
      observedAccountId = current.account?.id;
      reset();
    }
  });
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    reset,
    async load() {
      if (state.status === "loading") return;
      const owner = auth.getSnapshot();
      if (owner.status !== "authenticated" || !owner.account) { reset(); return; }
      const attempt = ++generation;
      update({ status: "loading", account: null, message: "" });
      const current = () => {
        const session = auth.getSnapshot();
        return attempt === generation && session.status === "authenticated"
          && session.epoch === owner.epoch && session.account?.id === owner.account!.id;
      };
      try {
        const account = await repository.load();
        if (!current()) return;
        if (account.id !== owner.account.id) throw new AuthError("IDENTITY_MISMATCH", "Không xác nhận được đúng hồ sơ.");
        update({ status: "ready", account, message: "" });
      } catch (error) {
        if (!current()) return;
        update({ status: "error", account: null, message: error instanceof AuthError && error.code === "NETWORK_ERROR"
          ? "Không kết nối được máy chủ. Kiểm tra mạng và thử lại."
          : "Chưa tải được hồ sơ của bạn. Vui lòng thử lại." });
      }
    },
    dispose() { reset(); unsubscribe(); listeners.clear(); },
  };
}

export type ProfileModel = ReturnType<typeof createProfileModel>;
