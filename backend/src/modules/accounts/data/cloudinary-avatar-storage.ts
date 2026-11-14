import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import type { AppConfig } from "../../../shared/config/env";
import { AuthError } from "../../auth/business/auth-errors";
import type { AvatarStorage, StoredAvatar } from "../business/avatar-storage";
export class CloudinaryAvatarStorage implements AvatarStorage {
  constructor(private readonly config: AppConfig) {}
  private options() {
    const { CLOUDINARY_CLOUD_NAME: cloud_name, CLOUDINARY_API_KEY: api_key, CLOUDINARY_API_SECRET: api_secret } = this.config;
    if (!cloud_name || !api_key || !api_secret) throw new AuthError(503, "SERVICE_UNAVAILABLE");
    return { cloud_name, api_key, api_secret, secure: true, timeout: 15000 };
  }
  async upload(accountId: string, bytes: Buffer): Promise<StoredAvatar> {
    const options = this.options();
    try {
      return await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ ...options, resource_type: "image", type: "upload", public_id: `studentmart/avatars/${accountId}/${randomUUID()}`, overwrite: false, allowed_formats: ["webp"] }, (error, result) => {
          if (error || !result?.public_id || !result.secure_url) { reject(new Error("Avatar provider unavailable")); return; }
          try { const url = new URL(result.secure_url); if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") throw new Error(); resolve({ publicId: result.public_id, url: url.href }); }
          catch { reject(new Error("Invalid avatar provider response")); }
        }).end(bytes);
      });
    } catch { throw new AuthError(503, "SERVICE_UNAVAILABLE"); }
  }
  async destroy(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, { ...this.options(), resource_type: "image", invalidate: true });
      if (!["ok", "not found"].includes(result.result)) throw new Error();
    } catch { throw new AuthError(503, "SERVICE_UNAVAILABLE"); }
  }
}
