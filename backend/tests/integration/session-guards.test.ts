import "reflect-metadata";
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { DataSource, In } from "typeorm";
import { expect, it } from "vitest";
import { Account, AccountRole } from "../../src/modules/accounts/business/account.entity";
import { AccountsService } from "../../src/modules/accounts/business/accounts.service";
import { AuthSession } from "../../src/modules/auth/business/auth-session.entity";
import { loadConfig } from "../../src/shared/config/env";
import { databaseOptions } from "../../src/shared/database/database-options";
import { accessApp, TestResourceAccess } from "../support/access-app";

async function fixture() {
  const config = loadConfig();
  if (!config.DATABASE_URL || new URL(config.DATABASE_URL).pathname !== "/student-mart") throw new Error("Requires student-mart");
  const source = new DataSource(databaseOptions(config));
  await source.initialize();
  const resources = new TestResourceAccess();
  const app = await accessApp(source, resources);
  const ids: string[] = [];
  const accounts = source.getRepository(Account);
  const service = new AccountsService(accounts);
  try {
    for (let index = 0; index < 2; index++) {
      const created = await service.create({ email: `guard-${randomUUID()}@example.invalid`, displayName: "Guard test", password: "guard-password" });
      ids.push(created.id);
    }
    const people = await Promise.all(ids.map(id => accounts.findOneByOrFail({ id })));
    const tokens: string[] = [];
    for (const person of people) {
      const response = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: person.email, password: "guard-password" } });
      if (response.statusCode !== 200) throw new Error("Test login failed");
      tokens.push(response.json().session.token);
    }
    return { app, source, resources, people, tokens, async cleanup() {
      await app.close();
      try { await source.getRepository(AuthSession).delete({ accountId: In(ids) }); await accounts.delete({ id: In(ids) }); }
      finally { await source.destroy(); }
    } };
  } catch (error) {
    await app.close();
    try { if (ids.length) { await source.getRepository(AuthSession).delete({ accountId: In(ids) }); await accounts.delete({ id: In(ids) }); } }
    finally { await source.destroy(); }
    throw error;
  }
}

it("defaults private routes to session authentication while keeping explicitly public routes anonymous", async () => {
  const { app, cleanup, tokens, people } = await fixture();
  try {
    expect((await app.inject({ method: "GET", url: "/test/access/public" })).statusCode).toBe(200);
    for (const authorization of [undefined, "Bearer malformed", `Bearer ${"x".repeat(43)}`]) {
      const response = await app.inject({ method: "GET", url: "/test/access/private", headers: authorization ? { authorization } : {} });
      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe("UNAUTHENTICATED");
    }
    const own = await app.inject({ method: "GET", url: `/test/access/private?accountId=${people[1].id}&role=ADMIN`, headers: { authorization: `Bearer ${tokens[0]}` } });
    expect(own.statusCode).toBe(200);
    expect(own.json()).toEqual({ accountId: people[0].id, role: "MEMBER" });
    expect(own.headers["cache-control"]).toBe("no-store");
  } finally { await cleanup(); }
}, 30000);

it("checks current ownership/member/admin sources and denies A-to-B access or absent authorization sources", async () => {
  const { app, source, resources, people, tokens, cleanup } = await fixture();
  const owned = randomUUID();
  const conversation = randomUUID();
  resources.owners.set(owned, people[0].id);
  resources.conversationMembers.set(conversation, new Set([people[0].id]));
  const headers = { authorization: `Bearer ${tokens[0]}` };
  const other = { authorization: `Bearer ${tokens[1]}` };
  try {
    expect((await app.inject({ method: "GET", url: `/test/access/owners/${owned}`, headers })).statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: `/test/admin-owner/${owned}`, headers })).statusCode).toBe(403);
    expect((await app.inject({ method: "GET", url: `/test/access/admin-and-owner/${owned}`, headers })).statusCode).toBe(403);
    expect((await app.inject({ method: "GET", url: `/test/access/owners/${owned}?accountId=${people[0].id}&role=ADMIN`, headers: other })).statusCode).toBe(403);
    expect((await app.inject({ method: "GET", url: `/test/access/conversations/${conversation}`, headers })).statusCode).toBe(200);
    resources.conversationMembers.get(conversation)!.delete(people[0].id);
    expect((await app.inject({ method: "GET", url: `/test/access/conversations/${conversation}`, headers })).statusCode).toBe(403);
    resources.owners.set(owned, people[1].id);
    expect((await app.inject({ method: "GET", url: `/test/access/owners/${owned}`, headers })).statusCode).toBe(403);
    expect((await app.inject({ method: "GET", url: "/test/access/admin?role=ADMIN", headers })).statusCode).toBe(403);
    await source.getRepository(Account).update({ id: people[0].id }, { role: AccountRole.ADMIN });
    expect((await app.inject({ method: "GET", url: "/test/access/admin", headers })).statusCode).toBe(200);
    resources.owners.set(owned, people[0].id);
    expect((await app.inject({ method: "GET", url: `/test/admin-owner/${owned}`, headers })).statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: `/test/access/admin-and-owner/${owned}`, headers })).statusCode).toBe(200);
    resources.owners.set(owned, people[1].id);
    expect((await app.inject({ method: "GET", url: `/test/admin-owner/${owned}`, headers })).statusCode).toBe(403);
    expect((await app.inject({ method: "GET", url: `/test/access/admin-and-owner/${owned}`, headers })).statusCode).toBe(403);
    // ADMIN is not an implicit bypass for ownership or private conversation membership.
    expect((await app.inject({ method: "GET", url: `/test/access/owners/${owned}`, headers })).statusCode).toBe(403);
    expect((await app.inject({ method: "GET", url: `/test/access/conversations/${conversation}`, headers })).statusCode).toBe(403);
    await source.getRepository(Account).update({ id: people[0].id }, { role: AccountRole.MEMBER });
    expect((await app.inject({ method: "GET", url: "/test/access/admin", headers })).statusCode).toBe(403);
    for (const path of [`/test/access/owners/${randomUUID()}`, `/test/access/unconfigured/${owned}`, "/test/access/missing-param", "/test/access/empty-policy"]) {
      expect((await app.inject({ method: "GET", url: path, headers })).statusCode).toBe(403);
    }
  } finally { await cleanup(); }
}, 30000);

it("revalidates expiry, revocation and restriction on each guarded request instead of trusting a previous verification", async () => {
  const { app, source, people, tokens, cleanup } = await fixture();
  const headers = { authorization: `Bearer ${tokens[0]}` };
  const sessions = source.getRepository(AuthSession);
  try {
    expect((await app.inject({ method: "GET", url: "/test/access/private", headers })).statusCode).toBe(200);
    await sessions.update({ accountId: people[0].id }, { createdAt: new Date(Date.now() - 20000), expiresAt: new Date(Date.now() - 10000) });
    const expired = await app.inject({ method: "GET", url: "/test/access/private", headers });
    expect(expired.statusCode).toBe(401);
    expect(expired.json().error.code).toBe("SESSION_EXPIRED");
    await sessions.update({ accountId: people[0].id }, { expiresAt: new Date(Date.now() + 60000), revokedAt: new Date() });
    expect((await app.inject({ method: "GET", url: "/test/access/private", headers })).statusCode).toBe(401);
    await sessions.update({ accountId: people[0].id }, { revokedAt: null });
    await source.getRepository(Account).update({ id: people[0].id }, { loginDisabledAt: new Date() });
    expect((await app.inject({ method: "GET", url: "/test/access/private", headers })).statusCode).toBe(403);
    expect((await app.inject({ method: "GET", url: "/test/access/public", headers })).statusCode).toBe(200);
    expect((await app.inject({ method: "POST", url: "/api/v1/auth/logout", headers })).statusCode).toBe(204);
  } finally { await cleanup(); }
}, 30000);
