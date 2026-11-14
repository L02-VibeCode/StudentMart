import { z } from "zod";
const size = (min: number, max: number) => (s: string) => Array.from(s).length >= min && Array.from(s).length <= max;
export const updateProfileSchema = z.strictObject({
  displayName: z.string().trim().refine(size(1, 100)).optional(),
  bio: z.string().trim().refine(size(0, 500)).transform(value => value || null).nullable().optional(),
  declaredSchoolId: z.string().uuid().nullable().optional(),
  areaId: z.string().uuid().nullable().optional(),
}).refine(value => Object.keys(value).length > 0);
export type UpdateProfileInput = z.output<typeof updateProfileSchema>;
