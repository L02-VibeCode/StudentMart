import { AuthError, type LoginInput } from "../business/auth";
import { isValidEmail } from "../business/registration";

type LoginState = { email: string; password: string; fields: Partial<Record<"email" | "password", string>>; message: string; submitting: boolean; retryUntil: number };
export function createLoginModel(login: (input: LoginInput) => Promise<void>, initialEmail = "", now: () => number = Date.now) {
  let state: LoginState = { email: initialEmail, password: "", fields: {}, message: "", submitting: false, retryUntil: 0 };
  let active = true;
  const listeners = new Set<() => void>();
  function update(next: Partial<LoginState>) { if (active) { state = { ...state, ...next }; listeners.forEach(listener => listener()); } }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    activate() { active = true; },
    dispose() { active = false; state = { ...state, password: "" }; listeners.clear(); },
    setField(key: "email" | "password", value: string) { if (!state.submitting) update({ [key]: value, fields: { ...state.fields, [key]: undefined }, message: "" }); },
    async submit() {
      if (!active || state.submitting || now() < state.retryUntil) return;
      const fields: LoginState["fields"] = {};
      if (!isValidEmail(state.email.trim().toLowerCase())) fields.email = "Nhập địa chỉ email hợp lệ.";
      const length = Array.from(state.password).length;
      if (length < 8 || length > 128) fields.password = "Mật khẩu cần từ 8 đến 128 ký tự.";
      if (Object.keys(fields).length) { update({ fields, message: "Kiểm tra lại thông tin bên dưới." }); return; }
      update({ submitting: true, message: "", fields: {} });
      try { await login({ email: state.email.trim().toLowerCase(), password: state.password }); update({ password: "" }); }
      catch (error) {
        update({ message: error instanceof AuthError ? error.message : "Chưa thể đăng nhập. Vui lòng thử lại.",
          retryUntil: error instanceof AuthError && error.code === "RATE_LIMITED" ? now() + error.retryAfter * 1000 : state.retryUntil });
      } finally { update({ submitting: false }); }
    },
  };
}
