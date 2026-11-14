export const AVATAR_STORAGE = Symbol("AVATAR_STORAGE");
export type StoredAvatar = { publicId: string; url: string };
export interface AvatarStorage {
  upload(accountId: string, bytes: Buffer): Promise<StoredAvatar>;
  destroy(publicId: string): Promise<void>;
}
