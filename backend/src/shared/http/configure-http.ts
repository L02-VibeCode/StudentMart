import { configureAvatarDiagnostics } from "./avatar-request-diagnostics";
import multipart from "@fastify/multipart";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { RegistrationRateLimiter } from "../../modules/accounts/presentation/registration-rate-limiter";
import { ApiExceptionFilter, sendApiError } from "./api-exception.filter";

export function configureHttp(app: NestFastifyApplication, options: { avatarDiagnostics?: boolean } = {}): void {
  app.getHttpAdapter().getInstance().register(multipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 1 } });
  if(options.avatarDiagnostics)configureAvatarDiagnostics(app.getHttpAdapter().getInstance());
  const limiter = new RegistrationRateLimiter();
  app.getHttpAdapter().getInstance().addHook("onRequest", async (request, reply) => {
    reply.header("X-Request-Id", request.id);
    if (request.method === "POST" && request.url.split("?")[0] === "/api/v1/auth/register") {
      try {
        limiter.consume(request.ip);
      } catch (error) {
        return sendApiError(error, request, reply);
      }
    }
  });
  app.useGlobalFilters(new ApiExceptionFilter());
}
