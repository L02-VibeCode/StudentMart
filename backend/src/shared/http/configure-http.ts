import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { RegistrationRateLimiter } from "../../modules/accounts/presentation/registration-rate-limiter";
import { ApiExceptionFilter, sendApiError } from "./api-exception.filter";

export function configureHttp(app: NestFastifyApplication): void {
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
