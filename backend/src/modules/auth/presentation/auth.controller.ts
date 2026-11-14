import { Body, Controller, Get, Headers, HttpCode, Inject, Post, Req, Res } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "../business/auth.service";
import { CurrentActor, PublicRoute } from "./access.decorators";
import type { SessionActor } from "../business/session-actor";

@Controller("api/v1")
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  @Post("auth/login") @HttpCode(200)
  @PublicRoute()
  login(@Body() input: unknown, @Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    reply.header("Cache-Control", "no-store");
    return this.auth.login(input, request.ip);
  }
  @Get("accounts/me")
  me(@CurrentActor() actor: SessionActor, @Res({ passthrough: true }) reply: FastifyReply) {
    reply.header("Cache-Control", "no-store");
    return { account: actor.account };
  }
  @Post("auth/logout") @HttpCode(204)
  @PublicRoute()
  async logout(@Headers("authorization") authorization: string | undefined, @Res({ passthrough: true }) reply: FastifyReply) {
    reply.header("Cache-Control", "no-store");
    await this.auth.logout(authorization);
  }
}
