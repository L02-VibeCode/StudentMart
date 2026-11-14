import { Body, Controller, Get, Inject, Patch, Res } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { CurrentActor, PublicRoute } from "../../auth/presentation/access.decorators";
import type { SessionActor } from "../../auth/business/session-actor";
import { ProfileService } from "../business/profile.service";
import { updateProfileSchema } from "./profile-validation";
@Controller("api/v1")
export class ProfileController {
  constructor(@Inject(ProfileService) private readonly profiles: ProfileService) {}
  @Patch("accounts/me")
  async update(@CurrentActor() actor: SessionActor, @Body() body: unknown, @Res({ passthrough: true }) reply: FastifyReply) {
    reply.header("Cache-Control", "no-store");
    return { account: await this.profiles.update(actor.account.id, updateProfileSchema.parse(body)) };
  }
  @PublicRoute() @Get("catalog/schools")
  async schools() { return { items: await this.profiles.catalog("schools") }; }
  @PublicRoute() @Get("catalog/areas")
  async areas() { return { items: await this.profiles.catalog("areas") }; }
}
