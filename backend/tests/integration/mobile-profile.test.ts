import "reflect-metadata";
import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { DataSource, In } from "typeorm";
import { expect, it } from "vitest";
import { Account } from "../../src/modules/accounts/business/account.entity";
import { AccountsService } from "../../src/modules/accounts/business/accounts.service";
import { AuthSession } from "../../src/modules/auth/business/auth-session.entity";
import { loadConfig } from "../../src/shared/config/env";
import { databaseOptions } from "../../src/shared/database/database-options";
import { authApp } from "../support/auth-app";
import { createAuthApi } from "../../../mobile/src/features/auth/data/auth-api";
import { createCredentialStore } from "../../../mobile/src/features/auth/data/credential-store";
import { createAuthCoordinator } from "../../../mobile/src/features/auth/business/auth-coordinator";
import { createProfileRepository } from "../../../mobile/src/features/profile/data/profile-repository";
import { createProfileModel } from "../../../mobile/src/features/profile/business/profile-model";

const password = "profile-fixture-password";
async function fixture() {
  const config = loadConfig();
  if (!config.DATABASE_URL || new URL(config.DATABASE_URL).pathname !== "/student-mart") throw new Error("Requires student-mart");
  const source = new DataSource(databaseOptions(config));
  await source.initialize();
  const app = await authApp(source);
  const ids: string[] = [];
  const accounts = source.getRepository(Account);
  const cleanup = async () => {
    await app.close();
    try {
      if (ids.length) {
        await source.getRepository(AuthSession).delete({ accountId: In(ids) });
        await accounts.delete({ id: In(ids) });
      }
    } finally { await source.destroy(); }
  };
  try {
    const service = new AccountsService(accounts);
    for (const name of ["A", "B"]) ids.push((await service.create({ email: `profile-${randomUUID()}@example.invalid`, password, displayName: `Profile ${name}` })).id);
    await accounts.update({ id: ids[0] }, { bio: "A real persisted profile biography" });
    await app.listen({ host: "127.0.0.1", port: 0 });
    const people = await Promise.all(ids.map(id => accounts.findOneByOrFail({ id })));
    const origin = await app.getUrl();
    const api = createAuthApi(origin);
    const memory = new Map<string, string>();
    const store = createCredentialStore({
      async getItemAsync(key) { return memory.get(key) ?? null; },
      async setItemAsync(key, value) { memory.set(key, value); },
      async deleteItemAsync(key) { memory.delete(key); },
    });
    return { source, app, people, api, origin, store, cleanup };
  } catch (error) { await cleanup(); throw error; }
}

it("reads current PostgreSQL profile through the mobile client, ignores account impersonation and projects only contract fields", async () => {
  const f = await fixture();
  try {
    const [a, b] = f.people;
    const loginA = await f.api.login({ email: a.email, password });
    const loginB = await f.api.login({ email: b.email, password });
    const response = await f.app.inject({ method: "GET", url: `/api/v1/accounts/me?accountId=${b.id}&role=ADMIN`, headers: { authorization: `Bearer ${loginA.session.token}` } });
    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    const account = response.json().account;
    expect(Object.keys(account).sort()).toEqual(["id", "email", "displayName", "role", "avatarUrl", "declaredSchool", "area", "bio", "schoolVerification", "createdAt", "updatedAt"].sort());
    expect(account).toMatchObject({ id: a.id, email: a.email, displayName: a.displayName, role: "MEMBER", bio: a.bio, avatarUrl: null, declaredSchool: null, area: null, schoolVerification: { status: "UNVERIFIED", school: null, verifiedAt: null } });
    const payload = JSON.stringify(response.json());
    for (const privateKey of ["password", "passwordHash", "password_hash", "token", "tokenHash", "token_hash", "sessionId", "loginDisabledAt", "listingCount"]) expect(payload).not.toContain(`"${privateKey}"`);
    expect(payload).not.toContain(loginA.session.token);
    expect(payload).not.toContain(b.email);
    expect(await f.api.me(loginA.session.token)).toEqual(account);
    expect(await f.api.me(loginB.session.token)).toMatchObject({ id: b.id, bio: null, avatarUrl: null, declaredSchool: null, area: null });
    expect((await f.app.inject({ method: "GET", url: "/api/v1/accounts/me" })).statusCode).toBe(401);
  } finally { await f.cleanup(); }
}, 30000);

it("retries a failed profile request and ignores a delayed real A profile after logout and B login", async () => {
  const f = await fixture();
  let failNext = false;
  let holdNext = false;
  let announceHold!: () => void;
  let release!: () => void;
  const held = new Promise<void>(resolve => { announceHold = resolve; });
  const gate = new Promise<void>(resolve => { release = resolve; });
  const api = createAuthApi(f.origin, async (input, init) => {
    const selfProfile = String(input).endsWith("/accounts/me");
    if (selfProfile && failNext) { failNext = false; throw new TypeError("Simulated unavailable network"); }
    const response = await fetch(input, init);
    if (selfProfile && holdNext) {
      holdNext = false;
      // Buffer the real server response so a transport ignoring abort can still finish late.
      const late = new Response(await response.text(), { status: response.status, headers: response.headers });
      announceHold();
      await gate;
      return late;
    }
    return response;
  });
  const auth = createAuthCoordinator(api, f.store);
  const model = createProfileModel(createProfileRepository(auth), auth);
  try {
    await auth.login({ email: f.people[0].email, password });
    failNext = true;
    await model.load();
    expect(model.getSnapshot()).toMatchObject({ status: "error", account: null });
    expect(model.getSnapshot().message).not.toBe("");
    await model.load();
    expect(model.getSnapshot()).toMatchObject({ status: "ready", account: { id: f.people[0].id, bio: f.people[0].bio } });
    holdNext = true;
    const oldLoad = model.load();
    await held;
    await auth.endSession();
    expect(model.getSnapshot().account).toBeNull();
    await auth.login({ email: f.people[1].email, password });
    await model.load();
    expect(model.getSnapshot()).toMatchObject({ status: "ready", account: { id: f.people[1].id, bio: null } });
    release();
    await oldLoad;
    expect(model.getSnapshot()).toMatchObject({ status: "ready", account: { id: f.people[1].id, bio: null } });
    expect(JSON.stringify(model.getSnapshot())).not.toContain(f.people[0].email);
    expect((await f.store.read())?.accountId).toBe(f.people[1].id);
  } finally { release(); model.dispose(); await f.cleanup(); }
}, 30000);

it("drops the private mobile identity when the real server session expires during a profile access", async () => {
  const f = await fixture();
  try {
    const auth = createAuthCoordinator(f.api, f.store);
    await auth.login({ email: f.people[0].email, password });
    const record = (await f.store.read())!;
    const tokenHash = createHash("sha256").update(record.token).digest("hex");
    await f.source.getRepository(AuthSession).update({ tokenHash }, { createdAt: new Date(Date.now() - 120000), expiresAt: new Date(Date.now() - 60000) });
    await expect(auth.runPrivate((token, signal) => f.api.me(token, signal))).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    expect(auth.getSnapshot()).toMatchObject({ status: "guest", account: null });
    expect(await f.store.read()).toBeNull();
  } finally { await f.cleanup(); }
}, 30000);
