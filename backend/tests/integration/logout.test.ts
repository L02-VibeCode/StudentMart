import "reflect-metadata";
import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { DataSource, In } from "typeorm";
import { expect, it, vi } from "vitest";
import { Account } from "../../src/modules/accounts/business/account.entity";
import { AccountsService } from "../../src/modules/accounts/business/accounts.service";
import { AuthSession } from "../../src/modules/auth/business/auth-session.entity";
import type { LogoutCleanupHook } from "../../src/modules/auth/business/logout-cleanup";
import { loadConfig } from "../../src/shared/config/env";
import { databaseOptions } from "../../src/shared/database/database-options";
import { authApp } from "../support/auth-app";

async function setup(hooks: LogoutCleanupHook[] = []) {
  const config = loadConfig();
  if (!config.DATABASE_URL || new URL(config.DATABASE_URL).pathname !== "/student-mart") throw new Error("Requires student-mart");
  const source = new DataSource(databaseOptions(config));
  await source.initialize();
  const app = await authApp(source, hooks);
  const ids: string[] = [];
  return { source, app, async create(label: string) {
    const saved = await new AccountsService(source.getRepository(Account)).create({ email: `logout-${randomUUID()}@example.invalid`, password: "test-password-only", displayName: label });
    ids.push(saved.id);
    return saved;
  }, async login(email: string) {
    const response = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email, password: "test-password-only" } });
    expect(response.statusCode).toBe(200);
    return response.json().session.token as string;
  }, async cleanup() {
    await app.close();
    try { if (ids.length) { await source.getRepository(AuthSession).delete({ accountId: In(ids) }); await source.getRepository(Account).delete({ id: In(ids) }); } }
    finally { await source.destroy(); }
  } };
}

it("revokes only the current session, repeats safely and leaves other sessions/accounts intact", async () => {
  const hook = { onSessionRevoked: vi.fn().mockResolvedValue(undefined) };
  const ctx = await setup([hook]);
  try {
    const a = await ctx.create("Test A"), b = await ctx.create("Test B");
    const first = await ctx.login(a.email), second = await ctx.login(a.email), other = await ctx.login(b.email);
    const sessions = ctx.source.getRepository(AuthSession);
    const digest = createHash("sha256").update(first).digest("hex");
    const target = await sessions.findOneByOrFail({ tokenHash: digest });
    const headers = { authorization: `Bearer ${first}` };
    const result = await ctx.app.inject({ method: "POST", url: `/api/v1/auth/logout?accountId=${b.id}`, headers, payload: { accountId: b.id, sessionId: randomUUID() } });
    expect(result.statusCode).toBe(204);
    expect(result.body).toBe("");
    expect(result.headers["cache-control"]).toBe("no-store");
    const timestamp = (await sessions.findOneByOrFail({ id: target.id })).revokedAt;
    expect(timestamp).toBeInstanceOf(Date);
    expect((await ctx.app.inject({ method: "GET", url: "/api/v1/accounts/me", headers })).statusCode).toBe(401);
    for (const token of [second, other]) expect((await ctx.app.inject({ method: "GET", url: "/api/v1/accounts/me", headers: { authorization: `Bearer ${token}` } })).statusCode).toBe(200);
    expect((await ctx.app.inject({ method: "POST", url: "/api/v1/auth/logout", headers })).statusCode).toBe(204);
    expect((await sessions.findOneByOrFail({ id: target.id })).revokedAt!.getTime()).toBe(timestamp!.getTime());
    expect(hook.onSessionRevoked.mock.calls).toEqual([[{ accountId: a.id, sessionId: target.id }], [{ accountId: a.id, sessionId: target.id }]]);
    expect(await sessions.countBy({ accountId: a.id })).toBe(2);
    expect((await ctx.source.getRepository(Account).findOneByOrFail({ id: b.id })).displayName).toBe("Test B");
    expect(await ctx.source.getRepository(Account).countBy({ id: In([a.id, b.id]) })).toBe(2);
  } finally { await ctx.cleanup(); }
}, 30000);

it("keeps revocation durable when push/realtime hooks fail and retries scoped cleanup on repeated logout", async () => {
  const failing = { onSessionRevoked: vi.fn().mockRejectedValueOnce(new Error("private-provider-secret" )).mockResolvedValue(undefined) };
  const realtime = { onSessionRevoked: vi.fn().mockResolvedValue(undefined) };
  const ctx = await setup([failing, realtime]);
  try {
    const a = await ctx.create("Test hooks");
    const token = await ctx.login(a.email);
    const headers = { authorization: `Bearer ${token}` };
    const failed = await ctx.app.inject({ method: "POST", url: "/api/v1/auth/logout", headers });
    expect(failed.statusCode).toBe(503);
    expect(failed.json().error.code).toBe("SERVICE_UNAVAILABLE");
    expect(failed.body.includes("private-provider-secret")).toBe(false);
    expect((await ctx.app.inject({ method: "GET", url: "/api/v1/accounts/me", headers })).statusCode).toBe(401);
    expect(realtime.onSessionRevoked).toHaveBeenCalledOnce();
    expect((await ctx.app.inject({ method: "POST", url: "/api/v1/auth/logout", headers })).statusCode).toBe(204);
    expect(realtime.onSessionRevoked).toHaveBeenCalledTimes(2);
    expect(failing.onSessionRevoked).toHaveBeenCalledTimes(2);
    expect(Object.keys(failing.onSessionRevoked.mock.calls[0][0]).sort()).toEqual(["accountId", "sessionId"]);
  } finally { await ctx.cleanup(); }
}, 30000);

it("handles expired/revoked/unknown bearer idempotently and rejects malformed headers without cleanup", async () => {
  const hook = { onSessionRevoked: vi.fn().mockResolvedValue(undefined) };
  const ctx = await setup([hook]);
  try {
    const a = await ctx.create("Test expiry");
    const token = await ctx.login(a.email);
    const sessions = ctx.source.getRepository(AuthSession);
    await sessions.update({ accountId: a.id }, { createdAt: new Date(Date.now() - 60000), expiresAt: new Date(Date.now() - 1000) });
    for (const authorization of [`Bearer ${token}`, `Bearer ${token}`, `Bearer ${"a".repeat(43)}`]) {
      expect((await ctx.app.inject({ method: "POST", url: "/api/v1/auth/logout", headers: { authorization } })).statusCode).toBe(204);
    }
    expect(hook.onSessionRevoked).toHaveBeenCalledTimes(2);
    for (const authorization of [undefined, "Bearer short", "Basic secret"]) {
      expect((await ctx.app.inject({ method: "POST", url: "/api/v1/auth/logout", headers: authorization ? { authorization } : {} })).statusCode).toBe(401);
    }
    expect(hook.onSessionRevoked).toHaveBeenCalledTimes(2);
  } finally { await ctx.cleanup(); }
}, 30000);
