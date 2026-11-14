import "reflect-metadata";
import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import { expect, it, vi } from "vitest";
import { Account } from "../../src/modules/accounts/business/account.entity";
import { AccountsService } from "../../src/modules/accounts/business/accounts.service";
import { AuthSession } from "../../src/modules/auth/business/auth-session.entity";
import { loadConfig } from "../../src/shared/config/env";
import { databaseOptions } from "../../src/shared/database/database-options";
import { authApp } from "../support/auth-app";

async function fixture() {
  const config = loadConfig();
  if (!config.DATABASE_URL || new URL(config.DATABASE_URL).pathname !== "/student-mart") throw new Error("Integration requires student-mart");
  const source = new DataSource(databaseOptions(config));
  await source.initialize();
  const account = await new AccountsService(source.getRepository(Account)).create({ email: `auth-${randomUUID()}@example.invalid`, password: " password-kept ", displayName: "Student" });
  const app = await authApp(source);
  return { source, account, app, async cleanup() {
    await app.close();
    try {
      await source.getRepository(AuthSession).delete({ accountId: account.id });
      await source.getRepository(Account).delete({ id: account.id });
    } finally { await source.destroy(); }
  } };
}

it("creates digest-only 30-day sessions, resolves current identity from bearer, and gives identical invalid-credential errors", async () => {
  const { source, account, app, cleanup } = await fixture();
  const logs = ["log", "info", "warn", "error", "debug"].map(method => vi.spyOn(console, method as "log").mockImplementation(() => {}));
  try {
    const response = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: ` ${account.email.toUpperCase()} `, password: " password-kept " } });
    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    const body = response.json();
    expect(body.account).toMatchObject({ id: account.id, email: account.email, role: "MEMBER", schoolVerification: { status: "UNVERIFIED" } });
    expect(body.session.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(response.body).not.toMatch(/password|tokenHash|loginDisabled/);
    const [stored] = await source.getRepository(AuthSession).createQueryBuilder("session").addSelect("session.tokenHash").where("session.accountId = :id", { id: account.id }).getMany();
    expect(stored.tokenHash).toBe(createHash("sha256").update(body.session.token).digest("hex"));
    expect(stored.tokenHash).not.toBe(body.session.token);
    expect((await source.getRepository(AuthSession).findOneByOrFail({ id: stored.id })).tokenHash).toBeUndefined();
    expect(stored.expiresAt.getTime() - stored.createdAt.getTime()).toBe(30 * 86400000);
    const current = await app.inject({ method: "GET", url: `/api/v1/accounts/me?accountId=${randomUUID()}`, headers: { authorization: `Bearer ${body.session.token}` } });
    expect(current.statusCode).toBe(200);
    expect(current.json().account).toEqual(body.account);
    expect(current.headers["cache-control"]).toBe("no-store");
    expect(current.body).not.toMatch(/password|token|loginDisabled/);
    const incorrect = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: account.email, password: "wrong-password" } });
    const unknown = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: `unknown-${randomUUID()}@example.invalid`, password: "wrong-password" } });
    expect(incorrect.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(incorrect.json().error).toMatchObject({ code: "INVALID_CREDENTIALS", message: unknown.json().error.message });
    expect(await source.getRepository(AuthSession).countBy({ accountId: account.id })).toBe(1);
    const output = logs.flatMap(log => log.mock.calls).flat().map(value => typeof value === "string" ? value : JSON.stringify(value)).join(" ");
    expect(output).not.toContain(" password-kept ");
    expect(output).not.toContain(body.session.token);
    expect(output).not.toContain(stored.tokenHash);
  } finally { logs.forEach(log => log.mockRestore()); await cleanup(); }
}, 30000);

it("rejects expired/revoked/restricted sessions and idempotently revokes a valid-format bearer", async () => {
  const { source, account, app, cleanup } = await fixture();
  try {
    const response = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: account.email, password: " password-kept " } });
    const token = response.json().session.token;
    const headers = { authorization: `Bearer ${token}` };
    const sessions = source.getRepository(AuthSession);
    const [session] = await sessions.findBy({ accountId: account.id });
    await sessions.update({ id: session.id }, { createdAt: new Date(Date.now() - 20000), expiresAt: new Date(Date.now() - 10000) });
    const expired = await app.inject({ method: "GET", url: "/api/v1/accounts/me", headers });
    expect(expired.statusCode).toBe(401);
    expect(expired.json().error.code).toBe("SESSION_EXPIRED");
    await sessions.update({ id: session.id }, { expiresAt: new Date(Date.now() + 60000), revokedAt: new Date() });
    const revoked = await app.inject({ method: "GET", url: "/api/v1/accounts/me", headers });
    expect(revoked.statusCode).toBe(401);
    expect(revoked.json().error.code).toBe("UNAUTHENTICATED");
    await sessions.update({ id: session.id }, { revokedAt: null });
    await source.getRepository(Account).update({ id: account.id }, { loginDisabledAt: new Date() });
    const restricted = await app.inject({ method: "GET", url: "/api/v1/accounts/me", headers });
    expect(restricted.statusCode).toBe(403);
    const restrictedLogin = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: account.email, password: " password-kept " } });
    expect(restrictedLogin.statusCode).toBe(403);
    expect(await sessions.countBy({ accountId: account.id })).toBe(1);
    const logout = await app.inject({ method: "POST", url: "/api/v1/auth/logout", headers });
    expect(logout.statusCode).toBe(204);
    expect(logout.body).toBe("");
    expect((await sessions.findOneByOrFail({ id: session.id })).revokedAt).toBeInstanceOf(Date);
    for (const authorization of [`Bearer ${token}`, `Bearer ${"a".repeat(43)}`]) {
      expect((await app.inject({ method: "POST", url: "/api/v1/auth/logout", headers: { authorization } })).statusCode).toBe(204);
    }
    expect((await app.inject({ method: "POST", url: "/api/v1/auth/logout" })).statusCode).toBe(401);
  } finally { await cleanup(); }
}, 30000);

it("enforces the email failure limit across IP changes without creating a session", async () => {
  const { source, account, app, cleanup } = await fixture();
  try {
    for (let index = 0; index < 5; index++) {
      const failed = await app.inject({ method: "POST", url: "/api/v1/auth/login", remoteAddress: `192.0.2.${index + 1}`, payload: { email: index % 2 ? account.email.toUpperCase() : account.email, password: "wrong-password" } });
      expect(failed.statusCode).toBe(401);
    }
    const limited = await app.inject({ method: "POST", url: "/api/v1/auth/login", remoteAddress: "192.0.2.99", payload: { email: account.email, password: " password-kept " } });
    expect(limited.statusCode).toBe(429);
    expect(limited.json().error.code).toBe("RATE_LIMITED");
    expect(Number(limited.headers["retry-after"])).toBeGreaterThan(0);
    expect(await source.getRepository(AuthSession).countBy({ accountId: account.id })).toBe(0);
  } finally { await cleanup(); }
}, 30000);
