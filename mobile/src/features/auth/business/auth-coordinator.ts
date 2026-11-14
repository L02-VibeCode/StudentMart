import { AuthError, type AuthApi, type Credential, type CredentialStore, type LoginInput, type PrivateAccount } from "./auth";
import type { AccountLogoutResources } from "./account-logout-resources";

export type AuthState = {
  status: "checking" | "guest" | "authenticated" | "offline" | "blocked" | "restricted";
  account: PrivateAccount | null;
  busy: boolean;
  message: string;
  epoch: number;
};

export function createAuthCoordinator(api: AuthApi, store: CredentialStore, now: () => number = Date.now, resources?: AccountLogoutResources) {
  let state: AuthState = { status: "checking", account: null, busy: false, message: "", epoch: 0 };
  let credential: Credential | null = null;
  let pendingRevocations = 0;
  let revocationUnconfirmed = false;
  let cleanupAccountId: string | null = null;
  let storageQueue: Promise<void> = Promise.resolve();
  const listeners = new Set<() => void>();
  const privateRequests = new Set<AbortController>();
  function abortPrivateRequests() { privateRequests.forEach(controller => controller.abort()); privateRequests.clear(); }
  async function readIdentity(token: string) {
    const controller = new AbortController();
    privateRequests.add(controller);
    try { return await api.me(token, controller.signal); }
    finally { privateRequests.delete(controller); }
  }
  function update(next: Partial<AuthState>) { state = { ...state, ...next }; listeners.forEach(listener => listener()); }
  function mutateStorage(action: () => Promise<void>) {
    const task = storageQueue.then(action, action);
    storageQueue = task.catch(() => undefined);
    return task;
  }
  async function revoke(token: string) {
    pendingRevocations++;
    try { await api.logout(token); return true; }
    catch { revocationUnconfirmed = true; return false; }
    finally { pendingRevocations--; }
  }
  const isCurrent = (epoch: number) => state.epoch === epoch;
  const isBlocked = () => state.status === "blocked";
  function safeError(error: unknown) {
    return error instanceof AuthError ? error : new AuthError("SERVICE_UNAVAILABLE", "Chưa thể đăng nhập. Vui lòng thử lại.");
  }
  async function removeInvalid(epoch: number, message: string, advanceEpoch = true) {
    if (!isCurrent(epoch)) return;
    credential = null;
    abortPrivateRequests();
    const invalidEpoch = epoch + (advanceEpoch ? 1 : 0);
    update({ epoch: invalidEpoch, status: "checking", account: null, busy: true });
    try {
      await mutateStorage(() => store.clear());
      if (isCurrent(invalidEpoch)) update({ status: "guest", account: null, message, busy: false });
    } catch {
      if (isCurrent(invalidEpoch)) update({ status: "blocked", account: null, busy: false, message: "Không thể xóa phiên trên thiết bị. Vui lòng thử lại thao tác xóa phiên." });
    }
  }

  async function runPrivate<T>(action: (token: string, signal: AbortSignal) => Promise<T>): Promise<T> {
    const record = credential;
    const actor = state.account;
    const epoch = state.epoch;
    if (state.status !== "authenticated" || !actor || !record || record.accountId !== actor.id) {
      throw new AuthError("UNAUTHENTICATED", "Vui lòng đăng nhập để tiếp tục.");
    }
    if (Date.parse(record.expiresAt) <= now()) {
      await removeInvalid(epoch, "Phiên đã hết hạn. Vui lòng đăng nhập lại.");
      throw new AuthError("SESSION_EXPIRED", "Phiên đã hết hạn. Vui lòng đăng nhập lại.");
    }
    const controller = new AbortController();
    privateRequests.add(controller);
    let checkingIdentity = true;
    try {
      const fresh = await readIdentity(record.token);
      if (!isCurrent(epoch)) throw new AuthError("STALE_SESSION", "Phiên sử dụng đã thay đổi.");
      if (fresh.id !== actor.id) throw new AuthError("IDENTITY_MISMATCH", "Không xác nhận được đúng tài khoản.");
      update({ account: fresh });
      checkingIdentity = false;
      const result = await action(record.token, controller.signal);
      if (!isCurrent(epoch) || state.account?.id !== actor.id || state.status !== "authenticated") throw new AuthError("STALE_SESSION", "Phiên sử dụng đã thay đổi.");
      return result;
    } catch (error) {
      if (!isCurrent(epoch)) throw new AuthError("STALE_SESSION", "Phiên sử dụng đã thay đổi.");
      const failure = safeError(error);
      if (["UNAUTHENTICATED", "SESSION_EXPIRED", "IDENTITY_MISMATCH"].includes(failure.code)) await removeInvalid(epoch, failure.message);
      else if (failure.code === "FORBIDDEN" && checkingIdentity) {
        abortPrivateRequests();
        update({ epoch: epoch + 1, status: "restricted", account: null, busy: false, message: failure.message });
      }
      else if (failure.code === "FORBIDDEN") {
        // A resource-level 403 denies this action, not every other action/account.
        update({ message: failure.message });
      }
      throw failure;
    } finally { privateRequests.delete(controller); }
  }

  return {
    getSnapshot: () => state,
    runPrivate,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },

    async restore(options: { force?: boolean } = {}) {
      if (cleanupAccountId) {
        update({ status: "blocked", account: null, message: "Dữ liệu riêng chưa được dọn xong. Vui lòng thử lại thao tác xóa phiên." });
        return;
      }
      if (state.busy || (state.status === "authenticated" && !options.force)) return;
      abortPrivateRequests();
      const epoch = state.epoch + 1;
      update({ epoch, busy: true, status: "checking", account: null, message: "" });
      try {
        let record: Credential | null;
        try { record = await store.read(); }
        catch { if (isCurrent(epoch)) update({ status: "blocked", message: "Không thể đọc phiên đã lưu. Thử lại hoặc xóa phiên để đăng nhập lại." }); return; }
        if (!isCurrent(epoch)) return;
        credential = record;
        if (!record) { update({ status: "guest" }); return; }
        if (Date.parse(record.expiresAt) <= now()) { await removeInvalid(epoch, "Phiên đã hết hạn. Vui lòng đăng nhập lại."); return; }
        try {
          const account = await readIdentity(record.token);
          if (!isCurrent(epoch)) return;
          if (account.id !== record.accountId) { await removeInvalid(epoch, "Không xác nhận được đúng tài khoản. Vui lòng đăng nhập lại."); return; }
          update({ status: "authenticated", account });
        } catch (error) {
          if (!isCurrent(epoch)) return;
          const failure = safeError(error);
          if (["UNAUTHENTICATED", "SESSION_EXPIRED"].includes(failure.code)) await removeInvalid(epoch, failure.message);
          else update({ status: failure.code === "FORBIDDEN" ? "restricted" : "offline", account: null, message: failure.message });
        }
      } finally { if (isCurrent(epoch)) update({ busy: false }); }
    },

    async login(input: LoginInput) {
      if (state.busy) throw new AuthError("BUSY", "Đang xử lý đăng nhập.");
      if (state.status === "blocked") throw new AuthError("STORAGE_ERROR", "Hãy xóa phiên lỗi trước khi đăng nhập lại.");
      if (state.status === "authenticated" || credential) throw new AuthError("ACCOUNT_ACTIVE", "Hãy kết thúc phiên hiện tại trước khi dùng tài khoản khác.");
      const epoch = state.epoch + 1;
      abortPrivateRequests();
      update({ epoch, busy: true, account: null, status: "guest", message: "" });
      let issued: Credential | null = null;
      let persisted = false;
      try {
        const result = await api.login(input);
        issued = { token: result.session.token, expiresAt: result.session.expiresAt, accountId: result.account.id };
        if (!isCurrent(epoch)) { await revoke(issued.token); return; }
        if (Date.parse(issued.expiresAt) <= now()) throw new AuthError("SESSION_EXPIRED", "Phiên vừa tạo không còn hiệu lực. Vui lòng thử lại.");
        try { await mutateStorage(() => store.write(issued!)); persisted = true; }
        catch {
          await revoke(issued.token);
          if (isCurrent(epoch)) await removeInvalid(epoch, "Không lưu được phiên trên thiết bị. Vui lòng đăng nhập lại.", false);
          throw new AuthError("STORAGE_ERROR", "Không lưu được phiên trên thiết bị. Vui lòng thử lại.");
        }
        if (!isCurrent(epoch)) { await revoke(issued.token); return; }
        credential = issued;
        const account = await readIdentity(issued.token);
        if (!isCurrent(epoch)) { await revoke(issued.token); return; }
        if (account.id !== issued.accountId) throw new AuthError("IDENTITY_MISMATCH", "Không xác nhận được đúng tài khoản. Vui lòng đăng nhập lại.");
        update({ status: "authenticated", account, message: "" });
      } catch (error) {
        if (!isCurrent(epoch)) return;
        const failure = safeError(error);
        if (persisted && issued) {
          if (["UNAUTHENTICATED", "SESSION_EXPIRED", "IDENTITY_MISMATCH"].includes(failure.code)) {
            await revoke(issued.token);
            await removeInvalid(epoch, failure.message, false);
          } else update({ status: failure.code === "FORBIDDEN" ? "restricted" : "offline", account: null, message: failure.message });
        } else {
          if (issued && failure.code !== "STORAGE_ERROR") await revoke(issued.token);
          if (!isBlocked()) update({ status: "guest", account: null, message: failure.message });
        }
        throw failure;
      } finally { if (isCurrent(epoch)) update({ busy: false }); }
    },

    async endSession() {
      const previous = credential;
      cleanupAccountId = previous?.accountId ?? state.account?.id ?? cleanupAccountId;
      credential = null;
      abortPrivateRequests();
      const epoch = state.epoch + 1;
      update({ epoch, status: "checking", account: null, busy: true, message: "" });
      const revoked = previous ? revoke(previous.token) : Promise.resolve(true);
      // Local logout must not wait for the network timeout. Never let this response affect account B.
      void revoked.then(() => {
        if (isCurrent(epoch) && state.status === "guest") update({ message: revocationUnconfirmed || pendingRevocations > 0
          ? "Đã đăng xuất trên thiết bị. Chưa xác nhận thu hồi phiên trên máy chủ." : "Đã đăng xuất." });
      });
      try {
        const accountId = cleanupAccountId;
        const results = await Promise.allSettled([
          mutateStorage(() => store.clear()),
          ...(accountId && resources ? [resources.clear(accountId)] : []),
        ]);
        if (results.some(result => result.status === "rejected")) throw new Error("Local cleanup incomplete");
        if (isCurrent(epoch)) cleanupAccountId = null;
        if (isCurrent(epoch)) update({ status: "guest", message: revocationUnconfirmed || pendingRevocations > 0
          ? "Đã đăng xuất trên thiết bị. Chưa xác nhận thu hồi phiên trên máy chủ." : "Đã đăng xuất." });
      } catch {
        if (isCurrent(epoch)) update({ status: "blocked", message: "Chưa xóa hết phiên hoặc dữ liệu riêng trên thiết bị. Vui lòng thử lại thao tác xóa phiên." });
      } finally { if (isCurrent(epoch)) update({ busy: false }); }
    },
  };
}

export type AuthCoordinator = ReturnType<typeof createAuthCoordinator>;
