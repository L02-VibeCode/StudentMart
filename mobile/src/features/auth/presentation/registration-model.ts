import { emptyRegistrationForm, RegistrationError, validateRegistration, type FieldErrors, type RegisterAccount, type RegistrationForm } from "../business/registration";

export type RegistrationState = { form: RegistrationForm; fields: FieldErrors; submitting: boolean; message: string };

export function createRegistrationModel(register: RegisterAccount, onRegistered: (email: string) => void) {
  let state: RegistrationState = { form: { ...emptyRegistrationForm }, fields: {}, submitting: false, message: "" };
  let active = true;
  const listeners = new Set<() => void>();
  function update(next: Partial<RegistrationState>) {
    if (!active) return;
    state = { ...state, ...next };
    listeners.forEach(listener => listener());
  }
  return {
    getSnapshot: () => state,
    activate() { active = true; },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    dispose() { active = false; state = { form: { ...emptyRegistrationForm }, fields: {}, submitting: false, message: "" }; listeners.clear(); },
    setField(key: keyof RegistrationForm, value: string) {
      if (state.submitting) return;
      update({ form: { ...state.form, [key]: value }, fields: { ...state.fields, [key]: undefined }, message: "" });
    },
    async submit() {
      if (!active || state.submitting) return;
      const fields = validateRegistration(state.form);
      if (Object.keys(fields).length) { update({ fields, message: "Kiểm tra lại những thông tin bên dưới." }); return; }
      const { email, password, displayName } = state.form;
      update({ submitting: true, fields: {}, message: "" });
      try {
        const account = await register({ email: email.trim().toLowerCase(), password, displayName: displayName.trim() });
        if (!active) return;
        update({ form: { ...emptyRegistrationForm }, submitting: false });
        onRegistered(account.email);
      } catch (error) {
        update({ submitting: false, message: error instanceof RegistrationError ? error.message : "Chưa thể đăng ký. Vui lòng thử lại.",
          fields: error instanceof RegistrationError ? error.fields : {} });
      }
    },
  };
}
