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
import { createAuthCoordinator } from "../../../mobile/src/features/auth/business/auth-coordinator";
import type { Credential } from "../../../mobile/src/features/auth/business/auth";
import { createProfileEditRepository } from "../../../mobile/src/features/profile/data/profile-edit-repository";
import { createProfileEditModel } from "../../../mobile/src/features/profile/business/profile-edit-model";

const password = "profile-edit-fixture-password";
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
    for (const name of ["A", "B"]) ids.push((await service.create({ email: `edit-${randomUUID()}@example.invalid`, password, displayName: `Edit ${name}` })).id);
    await app.listen({ host: "127.0.0.1", port: 0 });
    const people = await Promise.all(ids.map(id => accounts.findOneByOrFail({ id })));
    const origin = await app.getUrl();
    return { source, app, people, origin, api: createAuthApi(origin), cleanup };
  } catch (error) { await cleanup(); throw error; }
}

it("persists only the current actor profile and atomically rejects privilege/identity injection", async () => {
  const f = await fixture();
  try {
    const [a, b] = f.people;
    const login = await f.api.login({ email: a.email, password });
    const patch = (payload: unknown, suffix = "") => f.app.inject({ method: "PATCH", url: `/api/v1/accounts/me${suffix}`, headers: { authorization: `Bearer ${login.session.token}` }, payload });
    const saved = await patch({ displayName: "Updated account A", bio: "A persisted introduction" }, `?accountId=${b.id}`);
    expect(saved.statusCode).toBe(200);
    expect(saved.json().account).toMatchObject({ id: a.id, displayName: "Updated account A", bio: "A persisted introduction", role: "MEMBER", schoolVerification: { status: "UNVERIFIED" } });
    expect(await f.api.me(login.session.token)).toMatchObject({ displayName: "Updated account A", bio: "A persisted introduction" });
    expect(await f.source.getRepository(Account).findOneByOrFail({ id: b.id })).toMatchObject({ displayName: b.displayName, bio: null });
    for (const injected of [{ accountId: b.id }, { role: "ADMIN" }, { schoolVerification: { status: "VERIFIED" } }, { email: "new@example.invalid" }, { avatarUrl: "https://example.invalid/avatar.png" }]) {
      expect((await patch({ displayName: "Must not persist", ...injected })).statusCode).toBe(400);
      expect((await f.api.me(login.session.token)).displayName).toBe("Updated account A");
    }
    expect((await patch({ displayName: "Must not persist", bio: "x".repeat(501) })).statusCode).toBe(400);
    expect((await patch({ displayName: "Must not persist", declaredSchoolId: randomUUID() })).statusCode).toBe(400);
    expect((await f.api.me(login.session.token)).displayName).toBe("Updated account A");
    expect((await patch({})).statusCode).toBe(400);
    expect((await f.api.me(login.session.token)).bio).toBe("A persisted introduction");
    expect((await patch({ bio: null })).statusCode).toBe(200);
    expect((await f.api.me(login.session.token)).bio).toBeNull();
    expect((await f.app.inject({ method: "PATCH", url: "/api/v1/accounts/me", payload: { displayName: "Unauthorized" } })).statusCode).toBe(401);
  } finally { await f.cleanup(); }
}, 30000);

it("keeps an offline mobile draft, retries the real PATCH and reloads the saved profile", async () => {
  const f = await fixture();
  let record: Credential | null = null;
  const auth = createAuthCoordinator(f.api, { async read() { return record; }, async write(value) { record = value; }, async clear() { record = null; } });
  let failNext = false;
  const repository = createProfileEditRepository(f.origin, auth, async (input, init) => {
    if (init?.method === "PATCH" && failNext) { failNext = false; throw new TypeError("Simulated offline transport"); }
    return fetch(input, init);
  });
  const model = createProfileEditModel(repository, auth);
  try {
    await auth.login({ email: f.people[0].email, password });
    await model.load();
    expect(model.dirty()).toBe(false);
    expect(await model.save()).toBe(false);
    model.change("displayName", "Saved from mobile");
    model.change("bio", "Mobile introduction persisted by PostgreSQL");
    failNext = true;
    expect(await model.save()).toBe(false);
    expect(model.getSnapshot()).toMatchObject({ busy: false, draft: { displayName: "Saved from mobile", bio: "Mobile introduction persisted by PostgreSQL" } });
    expect(model.getSnapshot().message).not.toBe("");
    expect((await f.source.getRepository(Account).findOneByOrFail({ id: f.people[0].id })).displayName).toBe(f.people[0].displayName);
    expect(await model.save()).toBe(true);
    expect(model.dirty()).toBe(false);
    model.reset();
    await model.load();
    expect(model.getSnapshot()).toMatchObject({ status: "ready", draft: { displayName: "Saved from mobile", bio: "Mobile introduction persisted by PostgreSQL" } });
    expect((await f.source.getRepository(Account).findOneByOrFail({ id: f.people[1].id })).displayName).toBe(f.people[1].displayName);
  } finally { model.dispose(); await f.cleanup(); }
}, 30000);

it("ignores an old mobile save result after account A logs out and account B loads", async () => {
  const f = await fixture();
  let record: Credential | null = null;
  const auth = createAuthCoordinator(f.api, { async read() { return record; }, async write(value) { record = value; }, async clear() { record = null; } });
  let announce!: () => void, release!: () => void;
  const held = new Promise<void>(resolve => { announce = resolve; });
  const gate = new Promise<void>(resolve => { release = resolve; });
  const repository = createProfileEditRepository(f.origin, auth, async (input, init) => {
    const response = await fetch(input, init);
    if (init?.method !== "PATCH") return response;
    const buffered = new Response(await response.text(), { status: response.status, headers: response.headers });
    announce();
    await gate;
    return buffered;
  });
  const model = createProfileEditModel(repository, auth);
  try {
    await auth.login({ email: f.people[0].email, password });
    await model.load();
    model.change("bio", "A delayed save");
    const oldSave = model.save();
    await held;
    await auth.endSession();
    expect(model.getSnapshot().original).toBeNull();
    await auth.login({ email: f.people[1].email, password });
    await model.load();
    release();
    expect(await oldSave).toBe(false);
    expect(model.getSnapshot()).toMatchObject({ status: "ready", original: { id: f.people[1].id }, draft: { displayName: f.people[1].displayName, bio: "" } });
    expect(JSON.stringify(model.getSnapshot())).not.toContain("A delayed save");
    expect(record?.accountId).toBe(f.people[1].id);
  } finally { release(); model.dispose(); await f.cleanup(); }
}, 30000);
