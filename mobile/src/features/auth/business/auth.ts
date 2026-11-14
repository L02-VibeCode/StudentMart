export type Lookup = { id: string; name: string };
export type PrivateAccount = {
  id: string; email: string; displayName: string; role: "MEMBER" | "ADMIN";
  avatarUrl: string | null; declaredSchool: Lookup | null; area: Lookup | null; bio: string | null;
  schoolVerification: { status: "UNVERIFIED"; school: null; verifiedAt: null }
    | { status: "VERIFIED"; school: Lookup; verifiedAt: string };
  createdAt: string; updatedAt: string;
};
export type Credential = { token: string; expiresAt: string; accountId: string };
export type LoginInput = { email: string; password: string };
export type LoginResult = { account: PrivateAccount; session: { token: string; expiresAt: string } };
export type AuthApi = {
  login(input: LoginInput): Promise<LoginResult>;
  me(token: string, signal?: AbortSignal): Promise<PrivateAccount>;
  logout(token: string): Promise<void>;
};
export type CredentialStore = { read(): Promise<Credential | null>; write(value: Credential): Promise<void>; clear(): Promise<void> };

export class AuthError extends Error {
  constructor(readonly code: string, message: string, readonly retryAfter = 0) { super(message); }
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const tokenFormat = /^[A-Za-z0-9_-]{43}$/;
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const isDate = (value: unknown): value is string => typeof value === "string"
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
const isLookup = (value: unknown): value is Lookup => isRecord(value) && typeof value.id === "string" && uuid.test(value.id) && typeof value.name === "string";
function invalid(): never { throw new AuthError("INVALID_RESPONSE", "Chưa xác nhận được danh tính. Vui lòng thử lại."); }

export function parseAccount(value: unknown): PrivateAccount {
  if (!isRecord(value) || typeof value.id !== "string" || !uuid.test(value.id)
    || typeof value.email !== "string" || typeof value.displayName !== "string"
    || !["MEMBER", "ADMIN"].includes(String(value.role)) || !isDate(value.createdAt) || !isDate(value.updatedAt)
    || !(value.avatarUrl === null || typeof value.avatarUrl === "string")
    || !(value.bio === null || typeof value.bio === "string")
    || !(value.declaredSchool === null || isLookup(value.declaredSchool)) || !(value.area === null || isLookup(value.area))) invalid();
  const verification = value.schoolVerification;
  if (!isRecord(verification)) invalid();
  let schoolVerification: PrivateAccount["schoolVerification"];
  if (verification.status === "UNVERIFIED" && verification.school === null && verification.verifiedAt === null) {
    schoolVerification = { status: "UNVERIFIED", school: null, verifiedAt: null };
  } else if (verification.status === "VERIFIED" && isLookup(verification.school) && isDate(verification.verifiedAt)) {
    schoolVerification = { status: "VERIFIED", school: { id: verification.school.id, name: verification.school.name }, verifiedAt: verification.verifiedAt };
  } else invalid();
  const lookup = (v: unknown): Lookup | null => isLookup(v) ? { id: v.id, name: v.name } : null;
  return {
    id: value.id, email: value.email, displayName: value.displayName, role: value.role as PrivateAccount["role"],
    avatarUrl: value.avatarUrl as string | null, bio: value.bio as string | null,
    declaredSchool: lookup(value.declaredSchool), area: lookup(value.area), schoolVerification,
    createdAt: value.createdAt, updatedAt: value.updatedAt,
  };
}

export function parseCredential(value: unknown): Credential {
  if (!isRecord(value) || typeof value.token !== "string" || !tokenFormat.test(value.token)
    || !isDate(value.expiresAt) || typeof value.accountId !== "string" || !uuid.test(value.accountId)
    || Object.keys(value).some(key => !["token", "expiresAt", "accountId"].includes(key))) invalid();
  return { token: value.token, expiresAt: value.expiresAt, accountId: value.accountId };
}

export function parseLogin(value: unknown): LoginResult {
  if (!isRecord(value) || !isRecord(value.session)) invalid();
  const account = parseAccount(value.account);
  const credential = parseCredential({ ...value.session, accountId: account.id });
  return { account, session: { token: credential.token, expiresAt: credential.expiresAt } };
}
