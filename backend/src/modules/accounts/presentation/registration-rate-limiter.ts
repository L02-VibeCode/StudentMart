import { RegistrationRateLimitedError, RegistrationUnavailableError } from "../business/registration-errors";

export class RegistrationRateLimiter {
  private readonly attempts = new Map<string, { count: number; expiresAt: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  consume(ip: string): void {
    const currentTime = this.now();
    let bucket = this.attempts.get(ip);
    if (!bucket || bucket.expiresAt <= currentTime) {
      if (this.attempts.size >= 10000) {
        for (const [key, value] of this.attempts) {
          if (value.expiresAt <= currentTime) this.attempts.delete(key);
        }
        if (!this.attempts.has(ip) && this.attempts.size >= 10000) throw new RegistrationUnavailableError();
      }
      bucket = { count: 0, expiresAt: currentTime + 15 * 60 * 1000 };
      this.attempts.set(ip, bucket);
    }
    if (bucket.count >= 5) {
      throw new RegistrationRateLimitedError(Math.ceil((bucket.expiresAt - currentTime) / 1000));
    }
    bucket.count++;
  }
}
