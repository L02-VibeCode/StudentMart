export type RegistrationForm = { displayName: string; email: string; password: string; confirmPassword: string };
export type RegistrationInput = Omit<RegistrationForm, "confirmPassword">;
export type FieldErrors = Partial<Record<keyof RegistrationForm, string>>;
export type RegisteredAccount = { id: string; email: string; displayName: string; role: "MEMBER" };
export type RegisterAccount = (input: RegistrationInput) => Promise<RegisteredAccount>;

export const emptyRegistrationForm: RegistrationForm = { displayName: "", email: "", password: "", confirmPassword: "" };
// Matches the backend's Zod default email validation, after trim/lowercase.
const emailPattern = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
export const isValidEmail = (email: string) => Array.from(email).length <= 254 && emailPattern.test(email);
export function validateRegistration(form: RegistrationForm): FieldErrors {
  const errors: FieldErrors = {};
  const nameLength = Array.from(form.displayName.trim()).length;
  if (nameLength < 1 || nameLength > 100) errors.displayName = "Tên hiển thị cần từ 1 đến 100 ký tự.";
  const email = form.email.trim().toLowerCase();
  if (!isValidEmail(email)) errors.email = "Nhập địa chỉ email hợp lệ, tối đa 254 ký tự.";
  const length = Array.from(form.password).length;
  if (length < 8 || length > 128) errors.password = "Mật khẩu cần từ 8 đến 128 ký tự.";
  if (form.confirmPassword !== form.password) errors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
  return errors;
}

export class RegistrationError extends Error {
  constructor(message: string, readonly fields: FieldErrors = {}) { super(message); }
}
