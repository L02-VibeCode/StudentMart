import type { PrivateAccount } from "../../auth/business/auth";

export type ProfileRepository = { load(): Promise<PrivateAccount> };

export function profileInitials(name: string): string {
  return name.trim().split(/\s+/u).filter(Boolean).slice(0, 2).map(part => Array.from(part)[0]).join("").toLocaleUpperCase("vi") || "SM";
}

export function profileDetails(account: PrivateAccount) {
  return {
    school: account.declaredSchool?.name ?? "Chưa chọn trường",
    area: account.area?.name ?? "Chưa chọn khu vực",
    bio: account.bio?.trim() || "Bạn chưa thêm giới thiệu bản thân.",
    verified: account.schoolVerification.status === "VERIFIED",
  };
}
