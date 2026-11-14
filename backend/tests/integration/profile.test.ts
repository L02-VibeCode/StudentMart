import "reflect-metadata";
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { parse } from "yaml";
import { DataSource } from "typeorm";
import { expect, it } from "vitest";
import { Account } from "../../src/modules/accounts/business/account.entity";
import { AccountsService } from "../../src/modules/accounts/business/accounts.service";
import { AuthSession } from "../../src/modules/auth/business/auth-session.entity";
import { loadConfig } from "../../src/shared/config/env";
import { databaseOptions } from "../../src/shared/database/database-options";
import { authApp } from "../support/auth-app";

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(parse(readFileSync("../docs/contracts/accounts.openapi.yaml", "utf8")), "account-contract");
const validate = ajv.getSchema("account-contract#/components/schemas/AccountResponse")!;

it("reads the current stored self profile, never another account or credential projection", async () => {
  const config = loadConfig();
  if (!config.DATABASE_URL || new URL(config.DATABASE_URL).pathname !== "/student-mart") throw new Error("Integration requires student-mart");
  const source = new DataSource(databaseOptions(config));
  await source.initialize();
  const ids: string[] = [];
  const app = await authApp(source);
  try {
    const accounts = new AccountsService(source.getRepository(Account));
    const a = await accounts.create({ email: `profile-a-${randomUUID()}@example.invalid`, password: "test-password", displayName: "Account A" }); ids.push(a.id);
    const b = await accounts.create({ email: `profile-b-${randomUUID()}@example.invalid`, password: "test-password", displayName: "Account B" }); ids.push(b.id);
    const login = async (email: string) => {
      const result = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email, password: "test-password" } });
      expect(result.statusCode).toBe(200);
      return result.json().session.token as string;
    };
    const tokenA = await login(a.email), tokenB = await login(b.email);
    await source.getRepository(Account).update(a.id, { bio: "Stored introduction for A", displayName: "Updated A" });
    await source.getRepository(Account).update(b.id, { bio: "Private introduction for B" });
    const get = (token: string, query = "") => app.inject({ method: "GET", url: `/api/v1/accounts/me${query}`, headers: { authorization: `Bearer ${token}` } });
    const response = await get(tokenA, `?accountId=${b.id}`);
    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(validate(response.json()), JSON.stringify(validate.errors)).toBe(true);
    expect(response.json().account).toMatchObject({ id: a.id, email: a.email, displayName: "Updated A", bio: "Stored introduction for A", avatarUrl: null, declaredSchool: null, area: null, schoolVerification: { status: "UNVERIFIED", school: null, verifiedAt: null } });
    expect(response.body).not.toMatch(/password|token|loginDisabled|listingCount|Private introduction for B/);
    expect((await get(tokenB)).json().account).toMatchObject({ id: b.id, bio: "Private introduction for B" });
    await source.getRepository(Account).update(a.id, { bio: null });
    expect((await get(tokenA)).json().account.bio).toBeNull();
    await source.getRepository(AuthSession).update({ accountId: a.id }, { expiresAt: new Date(Date.now() - 1000), createdAt: new Date(Date.now() - 2000) });
    const expired = await get(tokenA);
    expect(expired.statusCode).toBe(401);
    expect(expired.json().error.code).toBe("SESSION_EXPIRED");
    await source.getRepository(Account).update(b.id, { loginDisabledAt: new Date() });
    expect((await get(tokenB)).statusCode).toBe(403);
    expect((await app.inject({ method: "GET", url: "/api/v1/accounts/me" })).statusCode).toBe(401);
  } finally {
    await app.close();
    try {
      for (const id of ids) {
        await source.getRepository(AuthSession).delete({ accountId: id });
        await source.getRepository(Account).delete({ id });
      }
    } finally { await source.destroy(); }
  }
}, 30000);
