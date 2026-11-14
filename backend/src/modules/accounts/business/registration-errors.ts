export class EmailAlreadyExistsError extends Error {}

export class RegistrationRateLimitedError extends Error {
  constructor(readonly retryAfter: number) {
    super("Registration rate limited");
  }
}

export class RegistrationUnavailableError extends Error {}
