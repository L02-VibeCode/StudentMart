import "reflect-metadata";
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import { expect, it } from "vitest";
import { Account } from "../../src/modules/accounts/business/account.entity";
import { AccountsService } from "../../src/modules/accounts/business/accounts.service";
import { AuthSession } from "../../src/modules/auth/business/auth-session.entity";
import { loadConfig } from "../../src/shared/config/env";
import { databaseOptions } from "../../src/shared/database/database-options";
import { accessApp, TestResourceAccess } from "../support/access-app";
import { createAuthApi } from "../../../mobile/src/features/auth/data/auth-api";
import { createCredentialStore } from "../../../mobile/src/features/auth/data/credential-store";
import { createAuthCoordinator } from "../../../mobile/src/features/auth/business/auth-coordinator";
import { AuthError } from "../../../mobile/src/features/auth/business/auth";
import { createSessionNavigation } from "../../../mobile/src/navigation/session-navigation";
import type { ListingGateway } from "../../../mobile/src/features/listings/business/listing-gateway";

it("restores mobile sessions and resumes/cancels intents through real session/resource guards with test-only resources", async () => {
  const config = loadConfig();
  if (!config.DATABASE_URL || new URL(config.DATABASE_URL).pathname !== "/student-mart") throw new Error("Requires student-mart");
  const source = new DataSource(databaseOptions(config));
  await source.initialize();
  const resources = new TestResourceAccess();
  const app = await accessApp(source, resources);
  let id: string | undefined;
  try {
    const saved = await new AccountsService(source.getRepository(Account)).create({ email: `session-guard-${randomUUID()}@example.invalid`, password: "test-password-only", displayName: "Test client" });
    id = saved.id;
    const resourceId = randomUUID();
    resources.conversationMembers.set(resourceId, new Set([id]));
    await app.listen({ host: "127.0.0.1", port: 0 });
    const origin = await app.getUrl();
    const calls: string[] = [];
    const api = createAuthApi(origin, async (url, options) => { calls.push(`${options?.method} ${new URL(url).pathname}`); return fetch(url, options); });
    const records = new Map<string, string>();
    const store = createCredentialStore({ async getItemAsync(key) { return records.get(key) ?? null; }, async setItemAsync(key, value) { records.set(key, value); }, async deleteItemAsync(key) { records.delete(key); } });
    const auth = createAuthCoordinator(api, store);
    let permissionReads = 0;
    // Listing metadata/resource membership are fixtures, not production catalog/chat APIs.
    const listing = { id: resourceId, title: "Integration fixture", description: "Test only", open: true };
    const gateway: ListingGateway = {
      async list() { return [listing]; }, async get(key) { if (key !== resourceId) throw new Error("Unknown fixture"); return listing; },
      async checkContact(key, token, signal) {
        permissionReads++;
        const response = await fetch(`${origin}/test/access/conversations/${key}`, { signal, headers: { Authorization: `Bearer ${token}` } });
        if (response.status !== 200) throw new AuthError(response.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN", "Không còn quyền với tài nguyên này.");
      },
      async checkCreate(token, signal) {
        permissionReads++;
        const response = await fetch(`${origin}/test/access/private`, { signal, headers: { Authorization: `Bearer ${token}` } });
        if (response.status !== 200) throw new AuthError("UNAUTHENTICATED", "Vui lòng đăng nhập lại.");
      },
    };
    const nav = createSessionNavigation(auth, gateway);
    await auth.restore();
    expect(auth.getSnapshot().status).toBe("guest");
    expect((await fetch(`${origin}/test/access/public`)).status).toBe(200);
    expect((await fetch(`${origin}/test/access/private`)).status).toBe(401);
    await nav.request({ action: "contactListing", listingId: resourceId });
    expect(nav.getSnapshot().route.name).toBe("login");
    expect(permissionReads).toBe(0);
    await auth.login({ email: saved.email, password: "test-password-only" });
    await waitFor(() => !nav.getSnapshot().resuming);
    expect(nav.getSnapshot().route).toEqual({ name: "listing", listingId: resourceId, contactReady: true });
    expect(permissionReads).toBe(1);

    const reopened = createAuthCoordinator(api, store);
    await reopened.restore();
    expect(reopened.getSnapshot()).toMatchObject({ status: "authenticated", account: { id } });
    await nav.request({ action: "openPrivateProfile" });
    expect(nav.getSnapshot().route.name).toBe("profile");
    resources.conversationMembers.get(resourceId)!.delete(id);
    await nav.request({ action: "contactListing", listingId: resourceId });
    expect(nav.getSnapshot()).toMatchObject({ route: { name: "listing", listingId: resourceId }, intent: null, message: "Không còn quyền với tài nguyên này." });
    expect("contactReady" in nav.getSnapshot().route).toBe(false);
    expect(auth.getSnapshot().status).toBe("authenticated");

    await nav.request({ action: "openPrivateProfile" });
    await source.getRepository(AuthSession).update({ accountId: id }, { revokedAt: new Date() });
    await auth.restore({ force: true });
    expect(auth.getSnapshot()).toMatchObject({ status: "guest", account: null });
    expect(nav.getSnapshot().route.name).toBe("login");
    expect(records.size).toBe(0);
    nav.browse();
    await nav.request({ action: "createListing" });
    nav.cancelLogin();
    const before = permissionReads;
    await auth.login({ email: saved.email, password: "test-password-only" });
    expect(nav.getSnapshot()).toMatchObject({ route: { name: "browse" }, intent: null });
    expect(permissionReads).toBe(before);
    expect(calls.filter(call => call.startsWith("POST") && !call.endsWith("/auth/login") && !call.endsWith("/auth/logout"))).toEqual([]);

    await source.getRepository(Account).update({ id }, { loginDisabledAt: new Date() });
    await auth.restore({ force: true });
    expect(auth.getSnapshot()).toMatchObject({ status: "restricted", account: null });
    expect(records.size).toBe(1);
    nav.browse();
    expect(nav.getSnapshot().route.name).toBe("browse");
    nav.dispose();
  } finally {
    await app.close();
    try {
      if (id) { await source.getRepository(AuthSession).delete({ accountId: id }); await source.getRepository(Account).delete({ id }); }
    } finally { await source.destroy(); }
  }
}, 30000);

async function waitFor(predicate: () => boolean) {
  for (let attempt = 0; attempt < 100; attempt++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 10)); }
  throw new Error("Intent did not settle");
}
