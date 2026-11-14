import type { PublicAccount } from "./accounts.service";

export function privateAccountDto(account: PublicAccount) {
  return {
    id: account.id, email: account.email, displayName: account.displayName, role: account.role,
    avatarUrl: null, declaredSchool: null, area: null, bio: null,
    schoolVerification: { status: "UNVERIFIED", school: null, verifiedAt: null },
    createdAt: account.createdAt.toISOString(), updatedAt: account.updatedAt.toISOString(),
  };
}
