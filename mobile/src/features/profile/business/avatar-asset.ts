import type { AvatarAsset } from "./avatar-model";

// Picker metadata is only a client hint; the backend still verifies decoded file content.
export function avatarAssetFromPicker(asset: { uri: string; fileName?: string | null; mimeType?: string | null; fileSize?: number }): AvatarAsset {
  const extension = (asset.fileName ?? asset.uri.split("?")[0]).split(".").pop()?.toLowerCase();
  const inferred = extension === "jpg" || extension === "jpeg" ? "image/jpeg" : extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : undefined;
  const declared = asset.mimeType?.split(";")[0].trim().toLowerCase();
  const mimeType = declared === "image/jpg" ? "image/jpeg" : !declared || declared === "application/octet-stream" ? inferred ?? "application/octet-stream" : declared;
  return { uri: asset.uri, name: asset.fileName ?? `avatar.${mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "bin"}`, mimeType, size: asset.fileSize };
}
