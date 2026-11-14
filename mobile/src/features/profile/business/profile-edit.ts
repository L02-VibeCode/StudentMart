import type { Lookup, PrivateAccount } from "../../auth/business/auth";
export type ProfilePatch = { displayName?: string; bio?: string | null; declaredSchoolId?: string | null; areaId?: string | null };
export type ProfileEditRepository = {
  load(): Promise<PrivateAccount>;
  save(patch: ProfilePatch): Promise<PrivateAccount>;
  catalog(kind: "schools" | "areas"): Promise<Lookup[]>;
};
export type ProfileDraft = { displayName: string; bio: string; declaredSchoolId: string | null; areaId: string | null };
export const draftFrom = (a: PrivateAccount): ProfileDraft => ({ displayName: a.displayName, bio: a.bio ?? "", declaredSchoolId: a.declaredSchool?.id ?? null, areaId: a.area?.id ?? null });
export function profilePatch(draft: ProfileDraft, original: PrivateAccount): ProfilePatch {
  const patch: ProfilePatch = {};
  if (draft.displayName.trim() !== original.displayName) patch.displayName = draft.displayName.trim();
  if ((draft.bio.trim() || null) !== original.bio) patch.bio = draft.bio.trim() || null;
  if (draft.declaredSchoolId !== (original.declaredSchool?.id ?? null)) patch.declaredSchoolId = draft.declaredSchoolId;
  if (draft.areaId !== (original.area?.id ?? null)) patch.areaId = draft.areaId;
  return patch;
}
export function profileErrors(draft: ProfileDraft) {
  const errors: Partial<Record<keyof ProfileDraft, string>> = {};
  if (!draft.displayName.trim() || Array.from(draft.displayName.trim()).length > 100) errors.displayName = "Tên hiển thị cần từ 1 đến 100 ký tự.";
  if (Array.from(draft.bio.trim()).length > 500) errors.bio = "Giới thiệu tối đa 500 ký tự.";
  return errors;
}
