import type { PublicAccount } from "./accounts.service";

export function privateAccountDto(account: PublicAccount) {
  return {
    id: account.id, email: account.email, displayName: account.displayName, role: account.role,
    // Catalog/media and school verification sources belong to their owning tasks.
    // Do not derive those values from login email or design/demo data.
    avatarUrl: account.avatarUrl ?? null, declaredSchool: account.declaredSchool ? { id: account.declaredSchool.id, name: account.declaredSchool.name } : null,
    area: account.area ? { id: account.area.id, name: account.area.name } : null, bio: account.bio ?? null,
    schoolVerification: { status: "UNVERIFIED", school: null, verifiedAt: null },
    createdAt: account.createdAt.toISOString(), updatedAt: account.updatedAt.toISOString(),
  };
}
