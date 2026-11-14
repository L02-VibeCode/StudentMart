import "reflect-metadata";
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { DataSource, In } from "typeorm";
import { expect, it } from "vitest";
import { Account } from "../../src/modules/accounts/business/account.entity";
import { AccountsService } from "../../src/modules/accounts/business/accounts.service";
import { AuthSession } from "../../src/modules/auth/business/auth-session.entity";
import { loadConfig } from "../../src/shared/config/env";
import { databaseOptions } from "../../src/shared/database/database-options";
import { authApp } from "../support/auth-app";
import { createAuthApi } from "../../../mobile/src/features/auth/data/auth-api";
import { CREDENTIAL_KEY, createCredentialStore } from "../../../mobile/src/features/auth/data/credential-store";
import { createAuthCoordinator } from "../../../mobile/src/features/auth/business/auth-coordinator";
import { createLoginModel } from "../../../mobile/src/features/auth/presentation/login-model";

it("connects mobile login to HTTP/PostgreSQL, persists only credential fields, and isolates account switches", async () => {
  const config = loadConfig();
  if (!config.DATABASE_URL || new URL(config.DATABASE_URL).pathname !== "/student-mart") throw new Error("Requires student-mart");
  const source = new DataSource(databaseOptions(config));
  await source.initialize();
  const app = await authApp(source);
  const ids: string[] = [];
  const password = " login-password-kept ";
  const accounts = source.getRepository(Account);
  const sessions = source.getRepository(AuthSession);
  try {
    const service = new AccountsService(accounts);
    for (const label of ["A", "B"]) {
      const created = await service.create({ email: `mobile-login-${randomUUID()}@example.invalid`, displayName: `Test ${label}`, password });
      ids.push(created.id);
    }
    const [a, b] = await Promise.all(ids.map(id => accounts.findOneByOrFail({ id })));
    await app.listen({ host: "127.0.0.1", port: 0 });
    const origin = await app.getUrl();
    let loginRequests = 0;
    const api = createAuthApi(origin, async (url, init) => {
      if (url.endsWith("/auth/login")) loginRequests++;
      return fetch(url, init);
    });
    const records = new Map<string, string>();
    const store = createCredentialStore({
      async getItemAsync(key) { return records.get(key) ?? null; },
      async setItemAsync(key, value) { records.set(key, value); },
      async deleteItemAsync(key) { records.delete(key); },
    });
    const auth = createAuthCoordinator(api, store);
    const model = createLoginModel(auth.login, ` ${a.email.toUpperCase()} `);
    model.setField("password", password);
    await Promise.all([model.submit(), model.submit(), model.submit()]);
    expect(loginRequests).toBe(1);
    expect(model.getSnapshot().password).toBe("");
    expect(auth.getSnapshot()).toMatchObject({ status: "authenticated", account: { id: a.id, email: a.email, schoolVerification: { status: "UNVERIFIED" } } });
    expect(await sessions.countBy({ accountId: a.id })).toBe(1);
    const raw = records.get(CREDENTIAL_KEY)!;
    const persisted = JSON.parse(raw);
    expect(Object.keys(persisted).sort()).toEqual(["accountId", "expiresAt", "token"]);
    expect(persisted.accountId === a.id).toBe(true);
    expect(/^[A-Za-z0-9_-]{43}$/.test(persisted.token)).toBe(true);
    expect(raw.includes(password)).toBe(false);
    expect(raw.includes(a.email)).toBe(false);
    expect(JSON.stringify(auth.getSnapshot()).includes(persisted.token)).toBe(false);

    const identity = await fetch(`${origin}/api/v1/accounts/me?accountId=${b.id}`, { headers: { Authorization: `Bearer ${persisted.token}` } });
    expect(identity.status).toBe(200);
    expect((await identity.json() as { account: { id: string } }).account.id).toBe(a.id);
    await auth.endSession();
    expect(records.size).toBe(0);
    expect(auth.getSnapshot().account).toBeNull();
    expect((await sessions.findOneByOrFail({ accountId: a.id })).revokedAt).toBeInstanceOf(Date);

    const wrong = createLoginModel(auth.login, a.email);
    wrong.setField("password", "wrong-password");
    await wrong.submit();
    expect(wrong.getSnapshot().message).toBe("Email hoặc mật khẩu chưa đúng.");
    expect(await sessions.countBy({ accountId: a.id })).toBe(1);
    expect(records.size).toBe(0);
    expect(auth.getSnapshot().account).toBeNull();

    const next = createLoginModel(auth.login, b.email);
    next.setField("password", password);
    await next.submit();
    expect(auth.getSnapshot()).toMatchObject({ status: "authenticated", account: { id: b.id, email: b.email } });
    expect(JSON.stringify(auth.getSnapshot()).includes(a.email)).toBe(false);
    const restored = createAuthCoordinator(api, store);
    await restored.restore();
    expect(restored.getSnapshot()).toMatchObject({ status: "authenticated", account: { id: b.id } });
    await sessions.update({ accountId: b.id }, { revokedAt: new Date() });
    const revoked = createAuthCoordinator(api, store);
    await revoked.restore();
    expect(revoked.getSnapshot()).toMatchObject({ status: "guest", account: null });
    expect(records.size).toBe(0);
    model.dispose(); wrong.dispose(); next.dispose();
  } finally {
    await app.close();
    try {
      if (ids.length) { await sessions.delete({ accountId: In(ids) }); await accounts.delete({ id: In(ids) }); }
    } finally { await source.destroy(); }
  }
}, 30000);
