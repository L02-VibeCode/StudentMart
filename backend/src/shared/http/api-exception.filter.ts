import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { EmailAlreadyExistsError, RegistrationRateLimitedError, RegistrationUnavailableError } from "../../modules/accounts/business/registration-errors";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    sendApiError(error, http.getRequest<FastifyRequest>(), http.getResponse<FastifyReply>());
  }
}

export function sendApiError(error: unknown, request: FastifyRequest, reply: FastifyReply): FastifyReply {
    let status = 500;
    let code = "INTERNAL_ERROR";
    let message = "Không thể xử lý yêu cầu.";
    let fields: Record<string, string> | undefined;
    if (error instanceof ZodError) {
      status = 400;
      code = "VALIDATION_ERROR";
      message = "Thông tin chưa hợp lệ.";
      fields = {};
      for (const issue of error.issues) {
        const name = String(issue.path[0] ?? "body");
        fields[["email", "password", "displayName"].includes(name) ? name : "body"] = "Thông tin chưa hợp lệ.";
      }
    } else if (error instanceof EmailAlreadyExistsError) {
      status = 409;
      code = "EMAIL_ALREADY_EXISTS";
      message = "Email đã được sử dụng.";
    } else if (error instanceof RegistrationRateLimitedError) {
      status = 429;
      code = "RATE_LIMITED";
      message = "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.";
      reply.header("Retry-After", error.retryAfter);
    } else if (error instanceof RegistrationUnavailableError) {
      status = 503;
      code = "SERVICE_UNAVAILABLE";
      message = "Dịch vụ tạm thời không khả dụng.";
    } else if (error instanceof HttpException) {
      status = error.getStatus();
      code = status === 400 ? "VALIDATION_ERROR"
        : status === 404 ? "NOT_FOUND"
        : status === 413 ? "PAYLOAD_TOO_LARGE"
        : status === 415 ? "UNSUPPORTED_MEDIA_TYPE" : "INTERNAL_ERROR";
    } else if (["FST_ERR_CTP_INVALID_JSON_BODY", "FST_ERR_CTP_EMPTY_JSON_BODY"].includes((error as { code?: string } | null)?.code ?? "")) {
      status = 400;
      code = "VALIDATION_ERROR";
    } else if ((error as { code?: string } | null)?.code === "FST_ERR_CTP_BODY_TOO_LARGE") {
      status = 413;
      code = "PAYLOAD_TOO_LARGE";
    } else if ((error as { code?: string } | null)?.code === "FST_ERR_CTP_INVALID_MEDIA_TYPE") {
      status = 415;
      code = "UNSUPPORTED_MEDIA_TYPE";
    } else {
      const databaseCode = (error as { driverError?: { code?: string }; code?: string } | null)?.driverError?.code
        ?? (error as { code?: string } | null)?.code;
      if (["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "08000", "08003", "08006", "57P01", "53300"].includes(databaseCode ?? "")) {
        status = 503;
        code = "SERVICE_UNAVAILABLE";
      }
    }
    return reply.header("Cache-Control", "no-store").code(status).send({
      error: { code, message, ...(fields ? { fields } : {}), requestId: request.id },
    });
}
