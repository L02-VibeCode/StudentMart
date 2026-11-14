import "reflect-metadata";
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { DataSource, In } from "typeorm";
import { expect, it, vi } from "vitest";
import { Account } from "../../src/modules/accounts/business/account.entity";
import { AccountsService } from "../../src/modules/accounts/business/accounts.service";
import { AuthSession } from "../../src/modules/auth/business/auth-session.entity";
import { loadConfig } from "../../src/shared/config/env";
import { databaseOptions } from "../../src/shared/database/database-options";
import { authApp } from "../support/auth-app";
import { createAuthApi } from "../../../mobile/src/features/auth/data/auth-api";
import { createCredentialStore } from "../../../mobile/src/features/auth/data/credential-store";
import { createAuthCoordinator } from "../../../mobile/src/features/auth/business/auth-coordinator";
import { createAccountLogoutResources } from "../../../mobile/src/features/auth/business/account-logout-resources";
import { AuthError } from "../../../mobile/src/features/auth/business/auth";

async function fixture() {
  const config = loadConfig();
  if (!config.DATABASE_URL || new URL(config.DATABASE_URL).pathname !== "/student-mart") throw new Error("Requires student-mart");
  const source = new DataSource(databaseOptions(config));
  await source.initialize();
  const scopes: { accountId: string; sessionId: string }[] = [];
  const app = await authApp(source, [{ async onSessionRevoked(scope) { scopes.push(scope); } }]);
  const ids: string[] = [];
  const service = new AccountsService(source.getRepository(Account));
  try {
    for (const name of ["A", "B"]) ids.push((await service.create({ email: `logout-${randomUUID()}@example.invalid`, password: "logout-password-only", displayName: `QA ${name}` })).id);
    await app.listen({ host: "127.0.0.1", port: 0 });
  } catch (error) {
    await app.close();
    if (ids.length) await source.getRepository(Account).delete({ id: In(ids) });
    await source.destroy();
    throw error;
  }
  const accounts = await Promise.all(ids.map(id => source.getRepository(Account).findOneByOrFail({ id })));
  const records = new Map<string, string>();
  const store = createCredentialStore({ async getItemAsync(key) { return records.get(key) ?? null; }, async setItemAsync(key, value) { records.set(key, value); }, async deleteItemAsync(key) { records.delete(key); } });
  const api = createAuthApi(await app.getUrl());
  const resources = createAccountLogoutResources();
  const privateCache = new Map(accounts.map(account => [account.id, { draft: `private-${account.id}` }]));
  const publicCache = new Map([["public-catalog", "retained"]]);
  const disconnects: string[] = [];
  const push: string[] = [];
  resources.register({ async clearPrivate(id) { privateCache.delete(id); }, disconnectRealtime(id) { disconnects.push(id); }, releasePush(id) { push.push(id); } });
  return { source, app, accounts, api, store, records, scopes, resources, privateCache, publicCache, disconnects, push,
    async cleanup() {
      await app.close();
      try { await source.getRepository(AuthSession).delete({ accountId: In(ids) }); await source.getRepository(Account).delete({ id: In(ids) }); }
      finally { await source.destroy(); }
    },
  };
}

it("logs out one real HTTP session, clears only local account resources, and preserves other sessions/accounts/public data", async () => {
  const f = await fixture();
  const [a, b] = f.accounts;
  try {
    const auth = createAuthCoordinator(f.api, f.store, Date.now, f.resources);
    await auth.login({ email: a.email, password: "logout-password-only" });
    const old = (await f.store.read())!;
    const otherA = await f.api.login({ email: a.email, password: "logout-password-only" });
    const otherB = await f.api.login({ email: b.email, password: "logout-password-only" });
    const before = JSON.stringify(await f.source.getRepository(Account).findBy({ id: In([a.id, b.id]) }));
    await auth.endSession();
    expect(auth.getSnapshot()).toMatchObject({ status: "guest", account: null, busy: false });
    expect(f.records.size).toBe(0);
    expect(f.privateCache.has(a.id)).toBe(false);
    expect(f.privateCache.has(b.id)).toBe(true);
    expect(f.publicCache.get("public-catalog")).toBe("retained");
    expect(f.disconnects).toEqual([a.id]);
    expect(f.push).toEqual([a.id]);
    await vi.waitFor(() => expect(f.scopes.length).toBe(1));
    await expect(f.api.me(old.token)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await f.api.logout(old.token);
    expect(f.scopes.every(scope => scope.accountId === a.id)).toBe(true);
    expect((await f.api.me(otherA.session.token)).id).toBe(a.id);
    expect((await f.api.me(otherB.session.token)).id).toBe(b.id);
    expect(JSON.stringify(await f.source.getRepository(Account).findBy({ id: In([a.id, b.id]) }))).toBe(before);
    await auth.login({ email: b.email, password: "logout-password-only" });
    expect(auth.getSnapshot()).toMatchObject({ status: "authenticated", account: { id: b.id, email: b.email } });
    expect(JSON.stringify(auth.getSnapshot()).includes(a.email)).toBe(false);
    expect((await f.store.read())?.accountId).toBe(b.id);
  } finally { await f.cleanup(); }
}, 30000);

it("completes local logout while offline and does not let the late revoke failure overwrite a new account", async () => {
  const f = await fixture();
  const [a, b] = f.accounts;
  let fail!: (error: unknown) => void;
  const offline = new Promise<void>((_resolve, reject) => { fail = reject; });
  try {
    const auth = createAuthCoordinator({ ...f.api, logout: async () => offline }, f.store, Date.now, f.resources);
    await auth.login({ email: a.email, password: "logout-password-only" });
    const old = (await f.store.read())!;
    await auth.endSession();
    expect(auth.getSnapshot()).toMatchObject({ status: "guest", account: null, busy: false });
    expect(auth.getSnapshot().message).toContain("Chưa xác nhận");
    expect(f.records.size).toBe(0);
    expect(f.privateCache.has(a.id)).toBe(false);
    expect((await f.api.me(old.token)).id).toBe(a.id); // Server never received logout: do not claim revocation.
    await auth.login({ email: b.email, password: "logout-password-only" });
    fail(new AuthError("NETWORK_ERROR", "Offline"));
    await Promise.resolve(); await Promise.resolve();
    expect(auth.getSnapshot()).toMatchObject({ status: "authenticated", account: { id: b.id }, message: "" });
    expect((await f.store.read())?.accountId).toBe(b.id);
    expect(f.publicCache.get("public-catalog")).toBe("retained");
  } finally { fail(new Error("Test complete")); await f.cleanup(); }
}, 30000);
