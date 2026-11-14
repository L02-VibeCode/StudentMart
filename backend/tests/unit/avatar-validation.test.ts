import { expect, it } from "vitest";
import sharp from "sharp";
import { normalizeAvatar, MAX_AVATAR_BYTES } from "../../src/modules/accounts/presentation/avatar-validation";
import { CloudinaryAvatarStorage } from "../../src/modules/accounts/data/cloudinary-avatar-storage";
import { loadConfig } from "../../src/shared/config/env";
it("fully decodes and normalizes JPEG/PNG/WebP, rejects mismatches, malformed contents and oversize",async()=>{
 for(const [format,mime] of [["jpeg","image/jpeg"],["png","image/png"],["webp","image/webp"]] as const){
  const bytes=await sharp({create:{width:16,height:16,channels:3,background:"orange"}}).toFormat(format).toBuffer();
  const normalized=await normalizeAvatar(bytes,mime);expect((await sharp(normalized).metadata()).format).toBe("webp");
 }
 await expect(normalizeAvatar(Buffer.alloc(MAX_AVATAR_BYTES+1),"image/png")).rejects.toMatchObject({status:413});
 for(const [bytes,mime] of [[Buffer.from("not an image"),"image/png"],[Buffer.from("<svg/>"),"image/svg+xml"],[Buffer.from([0x89,0x50,0x4e,0x47]),"image/png"]] as const)await expect(normalizeAvatar(bytes,mime)).rejects.toMatchObject({status:415});
 const png=await sharp({create:{width:1,height:1,channels:3,background:"red"}}).png().toBuffer();await expect(normalizeAvatar(png,"image/jpeg")).rejects.toMatchObject({status:415});
});
it("missing Cloudinary configuration fails safely without attempting remote upload",async()=>{
 const storage=new CloudinaryAvatarStorage(loadConfig({NODE_ENV:"test"}));
 await expect(storage.upload("account",Buffer.from("anything"))).rejects.toMatchObject({status:503,code:"SERVICE_UNAVAILABLE"});
});
