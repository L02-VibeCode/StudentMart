import { createHmac } from "node:crypto";
import { AuthError } from "./auth-errors";

type Bucket = { failures: number; pending: number; expiresAt: number };
export class LoginRateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  constructor(private readonly secret: string, private readonly now: () => number = Date.now) {
    if (secret.length < 32) throw new Error("AUTH_RATE_LIMIT_SECRET must contain at least 32 characters");
  }
  reserve(ip: string, normalizedEmail: string): (failed: boolean) => void {
    const now = this.now();
    const keys = [`ip:${ip}`, `email:${createHmac("sha256", this.secret).update(normalizedEmail).digest("hex")}`];
    if (this.buckets.size >= 20000) {
      for (const [key, bucket] of this.buckets) if (bucket.expiresAt <= now && bucket.pending === 0) this.buckets.delete(key);
    }
    if (this.buckets.size + keys.filter(key => !this.buckets.has(key)).length > 20000) throw new AuthError(503, "SERVICE_UNAVAILABLE");
    const buckets = keys.map(key => {
      let bucket = this.buckets.get(key);
      if (!bucket || (bucket.expiresAt <= now && bucket.pending === 0)) {
        bucket = { failures: 0, pending: 0, expiresAt: now + 15 * 60 * 1000 };
        this.buckets.set(key, bucket);
      }
      return bucket;
    });
    const limited = buckets.filter(bucket => bucket.failures + bucket.pending >= 5);
    if (limited.length) throw new AuthError(429, "RATE_LIMITED", Math.max(1, ...limited.map(bucket => Math.ceil((bucket.expiresAt - now) / 1000))));
    buckets.forEach(bucket => bucket.pending++);
    let completed = false;
    return failed => {
      if (completed) return;
      completed = true;
      buckets.forEach(bucket => { bucket.pending--; if (failed) bucket.failures++; });
    };
  }
}
