import { Controller, Delete, HttpCode, HttpException, Inject, Put, Req, Res } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { CurrentActor } from "../../auth/presentation/access.decorators";
import type { SessionActor } from "../../auth/business/session-actor";
import { AvatarService } from "../business/avatar.service";
import { MAX_AVATAR_BYTES, normalizeAvatar } from "./avatar-validation";
@Controller("api/v1/accounts/me/avatar")
export class AvatarController {
  constructor(@Inject(AvatarService) private readonly avatars: AvatarService) {}
  @Put()
  async upload(@CurrentActor() actor: SessionActor,@Req() request: FastifyRequest,@Res({passthrough:true}) reply:FastifyReply) {
    reply.header("Cache-Control","no-store");
    if(!request.isMultipart())throw new HttpException("Multipart required",415);
    let image:Buffer|undefined;let mime="";
    for await (const part of request.parts({limits:{fileSize:MAX_AVATAR_BYTES,files:1,fields:0,parts:1}})) {
      if(part.type!=="file" || part.fieldname!=="file")throw new HttpException("One file required",400);
      mime=part.mimetype;image=await part.toBuffer();
      if(part.file.truncated)throw new HttpException("Avatar too large",413);
    }
    if(!image)throw new HttpException("One file required",400);
    return {account:await this.avatars.replace(actor.account.id,await normalizeAvatar(image,mime))};
  }
  @Delete() @HttpCode(204)
  async remove(@CurrentActor() actor:SessionActor,@Res({passthrough:true}) reply:FastifyReply){reply.header("Cache-Control","no-store");await this.avatars.remove(actor.account.id);}
}
