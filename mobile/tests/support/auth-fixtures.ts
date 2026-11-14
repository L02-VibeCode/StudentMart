import type { Credential, PrivateAccount } from "../../src/features/auth/business/auth";

export const now = Date.UTC(2026, 10, 14);
export const expiresAt = new Date(now + 3600000).toISOString();
export function account(index = 1): PrivateAccount {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`, email: `member${index}@example.invalid`, displayName: `Member ${index}`,
    role: "MEMBER", avatarUrl: null, declaredSchool: null, area: null, bio: null,
    schoolVerification: { status: "UNVERIFIED", school: null, verifiedAt: null },
    createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
  };
}
export function credential(index = 1): Credential {
  return { accountId: account(index).id, expiresAt, token: (index === 1 ? "A" : "B").repeat(43) };
}
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
