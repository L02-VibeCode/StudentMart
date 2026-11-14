import { createHash, randomBytes } from "node:crypto";
import { DataSource, IsNull } from "typeorm";
import { z } from "zod";
import { Account } from "../../accounts/business/account.entity";
import { privateAccountDto } from "../../accounts/business/account-projection";
import { AuthSession } from "./auth-session.entity";
import { AuthError } from "./auth-errors";
import { LoginRateLimiter } from "./login-rate-limiter";
import { verifyPassword } from "./password";
import type { SessionActor } from "./session-actor";
import type { LogoutCleanupHook } from "./logout-cleanup";

const loginSchema = z.strictObject({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().refine(value => Array.from(value).length >= 8 && Array.from(value).length <= 128),
});
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
function bearer(header: string | undefined): string {
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(header ?? "");
  if (!match) throw new AuthError(401, "UNAUTHENTICATED");
  return match[1];
}

export class AuthService {
  constructor(private readonly source: DataSource, private readonly limiter: LoginRateLimiter,
    private readonly logoutCleanup: readonly LogoutCleanupHook[] = []) {}
  async login(input: unknown, ip: string) {
    const { email, password } = loginSchema.parse(input);
    const complete = this.limiter.reserve(ip, email);
    let failed = false;
    try {
      const found = await this.source.getRepository(Account).createQueryBuilder("account")
        .addSelect("account.passwordHash").where("account.email = :email", { email }).getOne();
      const valid = await verifyPassword(password, found?.passwordHash);
      if (!found || !valid) throw new AuthError(401, "INVALID_CREDENTIALS");
      const result = await this.source.transaction(async manager => {
        const account = await manager.getRepository(Account).createQueryBuilder("account")
          .addSelect("account.loginDisabledAt").leftJoinAndSelect("account.declaredSchool", "declaredSchool").leftJoinAndSelect("account.area", "area").where("account.id = :id", { id: found.id }).setLock("pessimistic_read", undefined, ["account"]).getOne();
        if (!account) throw new AuthError(401, "INVALID_CREDENTIALS");
        if (account.loginDisabledAt) throw new AuthError(403, "FORBIDDEN");
        const token = randomBytes(32).toString("base64url");
        const createdAt = new Date();
        const expiresAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
        await manager.getRepository(AuthSession).save(manager.getRepository(AuthSession).create({
          accountId: account.id, tokenHash: digest(token), createdAt, expiresAt, revokedAt: null,
        }));
        return { account: privateAccountDto(account), session: { token, expiresAt: expiresAt.toISOString() } };
      });
      return result;
    } catch (error) {
      failed = error instanceof AuthError && ["INVALID_CREDENTIALS", "FORBIDDEN"].includes(error.code);
      throw error;
    } finally { complete(failed); }
  }
  async authenticate(authorization?: string): Promise<SessionActor> {
    const token = bearer(authorization);
    const session = await this.source.getRepository(AuthSession).createQueryBuilder("session")
      .innerJoinAndSelect("session.account", "account").leftJoinAndSelect("account.declaredSchool", "declaredSchool").leftJoinAndSelect("account.area", "area").addSelect("account.loginDisabledAt")
      .where("session.tokenHash = :hash", { hash: digest(token) }).getOne();
    if (!session || session.revokedAt) throw new AuthError(401, "UNAUTHENTICATED");
    if (session.expiresAt.getTime() <= Date.now()) throw new AuthError(401, "SESSION_EXPIRED");
    if (session.account.loginDisabledAt) throw new AuthError(403, "FORBIDDEN");
    return { account: privateAccountDto(session.account), sessionId: session.id };
  }
  async me(authorization?: string) {
    const actor = await this.authenticate(authorization);
    return { account: actor.account };
  }
  async logout(authorization?: string) {
    const token = bearer(authorization);
    const sessions = this.source.getRepository(AuthSession);
    const session = await sessions.findOneBy({ tokenHash: digest(token) });
    if (!session) return;
    // Commit revocation before invoking external systems; hook failure must never revive a token.
    await sessions.update({ id: session.id, revokedAt: IsNull() }, { revokedAt: new Date() });
    const scope = Object.freeze({ sessionId: session.id, accountId: session.accountId });
    const results = await Promise.allSettled(this.logoutCleanup.map(hook => Promise.resolve().then(() => hook.onSessionRevoked(scope))));
    // Retry on a repeated logout, including already-revoked sessions. Adapters must be idempotent.
    if (results.some(result => result.status === "rejected")) throw new AuthError(503, "SERVICE_UNAVAILABLE");
  }
}
