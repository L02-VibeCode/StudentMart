import { Body, Controller, HttpCode, Inject, Post, Res } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { AccountsService } from "../business/accounts.service";
import { PublicRoute } from "../../auth/presentation/access.decorators";

@Controller("api/v1/auth")
export class RegistrationController {
  constructor(@Inject(AccountsService) private readonly accounts: AccountsService) {}

  @Post("register")
  @PublicRoute()
  @HttpCode(201)
  async register(
    @Body() input: unknown,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    reply.header("Cache-Control", "no-store");
    const account = await this.accounts.create(input);
    return {
      account: {
        id: account.id,
        email: account.email,
        displayName: account.displayName,
        role: account.role,
        avatarUrl: null,
        declaredSchool: null,
        area: null,
        bio: null,
        schoolVerification: { status: "UNVERIFIED", school: null, verifiedAt: null },
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      },
    };
  }
}
