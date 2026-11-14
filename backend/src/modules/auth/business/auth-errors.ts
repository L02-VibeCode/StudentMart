export class AuthError extends Error {
  constructor(readonly status: number, readonly code: "INVALID_CREDENTIALS" | "UNAUTHENTICATED" | "SESSION_EXPIRED" | "FORBIDDEN" | "RATE_LIMITED" | "SERVICE_UNAVAILABLE", readonly retryAfter?: number) {
    super(code);
  }
}
