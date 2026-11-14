import { HttpException } from "@nestjs/common";
import sharp from "sharp";
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export async function normalizeAvatar(bytes: Buffer, mime: string): Promise<Buffer> {
  if (bytes.length > MAX_AVATAR_BYTES) throw new HttpException("Avatar too large", 413);
  if (!bytes.length || !["image/jpeg","image/png","image/webp"].includes(mime)) throw new HttpException("Unsupported avatar",415);
  try {
    const image=sharp(bytes,{limitInputPixels:25000000,failOn:"warning",animated:false});
    const meta=await image.metadata();
    const expected={"image/jpeg":"jpeg","image/png":"png","image/webp":"webp"}[mime];
    if(meta.format!==expected || (meta.pages??1)>1)throw new Error();
    // Full decode/re-encode, strip EXIF/location metadata and bound served dimensions.
    return await image.rotate().resize(1024,1024,{fit:"inside",withoutEnlargement:true}).webp({quality:85}).toBuffer();
  } catch { throw new HttpException("Invalid image contents",415); }
}
