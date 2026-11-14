import "reflect-metadata";
import "dotenv/config";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { DataSource, In } from "typeorm";
import { expect, it } from "vitest";
import { Account } from "../../src/modules/accounts/business/account.entity";
import { AccountsService } from "../../src/modules/accounts/business/accounts.service";
import { AuthSession } from "../../src/modules/auth/business/auth-session.entity";
import { loadConfig } from "../../src/shared/config/env";
import { databaseOptions } from "../../src/shared/database/database-options";
import { authApp } from "../support/auth-app";
import type { AvatarStorage } from "../../src/modules/accounts/business/avatar-storage";
import { AvatarCleanup } from "../../src/modules/accounts/business/avatar-cleanup.entity";
import { createAuthApi } from "../../../mobile/src/features/auth/data/auth-api";
import { createAuthCoordinator } from "../../../mobile/src/features/auth/business/auth-coordinator";
import { parseAccount, type Credential } from "../../../mobile/src/features/auth/business/auth";
import { createAvatarModel, type AvatarAsset } from "../../../mobile/src/features/profile/business/avatar-model";

const password = "avatar-fixture-password";
async function fixture(configured = true) {
  const config = loadConfig();
  if (!config.DATABASE_URL || new URL(config.DATABASE_URL).pathname !== "/student-mart") throw new Error("Requires student-mart");
  const source = new DataSource(databaseOptions(config)); await source.initialize();
  let failUpload = false, uploads = 0;
  const storage: AvatarStorage = {
    async upload(accountId, bytes) {
      if (failUpload) throw new Error("Simulated provider unavailable");
      expect((await sharp(bytes).metadata()).format).toBeTruthy();
      const publicId = `test-avatar/${accountId}/${++uploads}`;
      return { publicId, url: `https://cdn.example.invalid/${publicId}.png` };
    },
    async destroy() {},
  };
  const app = await authApp(source, [], configured ? storage : undefined);
  const ids: string[] = [];
  const cleanup = async () => {
    await app.close();
    try {
      if (ids.length) { await source.getRepository(AvatarCleanup).delete({ accountId: In(ids) }); await source.getRepository(AuthSession).delete({ accountId: In(ids) }); await source.getRepository(Account).delete({ id: In(ids) }); }
    } finally { await source.destroy(); }
  };
  try {
    const service = new AccountsService(source.getRepository(Account));
    for (const name of ["A", "B"]) ids.push((await service.create({ email: `avatar-${randomUUID()}@example.invalid`, password, displayName: `Avatar ${name}` })).id);
    await source.getRepository(Account).update(ids[0], { bio: "Keep profile biography" });
    await app.listen({ host: "127.0.0.1", port: 0 });
    const people = await Promise.all(ids.map(id => source.getRepository(Account).findOneByOrFail({ id })));
    const origin = await app.getUrl();
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#f57c20" } }).png().toBuffer();
    return { source, app, people, origin, png, api: createAuthApi(origin), failNextUploads(value: boolean) { failUpload = value; }, cleanup };
  } catch (error) { await cleanup(); throw error; }
}

async function upload(origin: string, token: string, bytes: Buffer, mime = "image/png", query = "") {
  const body = new FormData(); body.append("file", new Blob([new Uint8Array(bytes)], { type: mime }), "avatar.png");
  return fetch(`${origin}/api/v1/accounts/me/avatar${query}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body });
}

it("validates multipart images, preserves the previous avatar on failure and scopes delete to the session actor", async () => {
  const f = await fixture();
  try {
    const a = await f.api.login({ email: f.people[0].email, password });
    const b = await f.api.login({ email: f.people[1].email, password });
    const saved = await upload(f.origin, a.session.token, f.png, "image/png", `?accountId=${f.people[1].id}`);
    expect(saved.status).toBe(200);
    const account = (await saved.json()).account;
    expect(account.id).toBe(f.people[0].id);
    expect(account.avatarUrl).toMatch(/^https:/);
    expect(account).not.toHaveProperty("avatarPublicId");
    expect(await f.api.me(b.session.token)).toMatchObject({ avatarUrl: null, displayName: f.people[1].displayName });
    expect((await upload(f.origin, a.session.token, Buffer.from("not a decoded PNG"))).status).toBe(415);
    expect((await upload(f.origin, a.session.token, Buffer.alloc(5242881))).status).toBe(413);
    f.failNextUploads(true);
    expect((await upload(f.origin, a.session.token, f.png)).status).toBe(503);
    expect(await f.api.me(a.session.token)).toMatchObject({ avatarUrl: account.avatarUrl, bio: "Keep profile biography" });
    const removed = await fetch(`${f.origin}/api/v1/accounts/me/avatar`, { method: "DELETE", headers: { Authorization: `Bearer ${a.session.token}` } });
    expect(removed.status).toBe(204);
    expect(await f.api.me(a.session.token)).toMatchObject({ id: f.people[0].id, avatarUrl: null, bio: "Keep profile biography" });
    expect(await f.source.getRepository(Account).countBy({ id: In(f.people.map(person => person.id)) })).toBe(2);
  } finally { await f.cleanup(); }
}, 30000);

it("fails safely when the Cloudinary provider configuration is absent", async () => {
  const f = await fixture(false);
  try {
    const login = await f.api.login({ email: f.people[0].email, password });
    const response = await upload(f.origin, login.session.token, f.png);
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("SERVICE_UNAVAILABLE");
    expect(await f.api.me(login.session.token)).toMatchObject({ avatarUrl: null, bio: "Keep profile biography" });
  } finally { await f.cleanup(); }
}, 30000);

it("runs the mobile avatar model against HTTP/PostgreSQL with cancel/failure/retry and delete", async () => {
  const f = await fixture();
  let record: Credential | null = null;
  const auth = createAuthCoordinator(f.api, { async read() { return record; }, async write(value) { record = value; }, async clear() { record = null; } });
  let cancelled = true;
  const asset: AvatarAsset = { uri: "memory://fixture.png", name: "fixture.png", mimeType: "image/png", size: f.png.length };
  // Node transport adapts the native image URI to fixture bytes; production model/auth remain unchanged.
  const model = createAvatarModel({
    upload: () => auth.runPrivate(async token => { const response = await upload(f.origin, token, f.png); if (!response.ok) throw new Error("Upload failed"); return parseAccount((await response.json()).account); }),
    remove: () => auth.runPrivate(async token => { const response = await fetch(`${f.origin}/api/v1/accounts/me/avatar`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) throw new Error("Delete failed"); return f.api.me(token); }),
  }, auth, async () => cancelled ? null : asset);
  try {
    await auth.login({ email: f.people[0].email, password });
    await model.choose(); expect(model.getSnapshot().pending).toBeNull();
    cancelled = false; await model.choose();
    f.failNextUploads(true); await model.upload();
    expect(model.getSnapshot()).toMatchObject({ avatarUrl: null, pending: asset, busy: false });
    f.failNextUploads(false); await model.upload();
    expect(model.getSnapshot().avatarUrl).toMatch(/^https:/);
    expect(model.getSnapshot().pending).toBeNull();
    const previous = model.getSnapshot().avatarUrl;
    cancelled = true; await model.choose();
    expect(model.getSnapshot().avatarUrl).toBe(previous);
    expect(model.getSnapshot().pending).toBeNull();
    await model.remove(); expect(model.getSnapshot().avatarUrl).toBeNull();
    expect((await f.source.getRepository(Account).findOneByOrFail({ id: f.people[0].id })).bio).toBe("Keep profile biography");
  } finally { model.dispose(); await f.cleanup(); }
}, 30000);
