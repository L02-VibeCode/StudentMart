import "reflect-metadata";
import "dotenv/config";
import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { parse } from "yaml";
import { DataSource } from "typeorm";
import { expect, it } from "vitest";
import { Account } from "../../src/modules/accounts/business/account.entity";
import { loadConfig } from "../../src/shared/config/env";
import { databaseOptions } from "../../src/shared/database/database-options";
import { registrationApp } from "../support/registration-app";

it("registers through HTTP, safely resolves concurrent normalized duplicates, and enforces database constraints", async () => {
  const config = loadConfig();
  if (!config.DATABASE_URL || new URL(config.DATABASE_URL).pathname !== "/student-mart") {
    throw new Error("Integration test requires the student-mart database");
  }
  const source = new DataSource(databaseOptions(config));
  await source.initialize();
  const repository = source.getRepository(Account);
  const email = `registration-${randomUUID()}@example.invalid`;
  const password = " password-kept ";
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(parse(readFileSync("../docs/contracts/accounts.openapi.yaml", "utf8")), "account-contract");
  const validateResponse = ajv.getSchema("account-contract#/components/schemas/AccountResponse")!;
  const app = await registrationApp(repository);
  try {
    const responses = await Promise.all([
      app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { email, password, displayName: " Student " } }),
      app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { email: ` ${email.toUpperCase()} `, password, displayName: " Student " } }),
    ]);
    expect(responses.map(response => response.statusCode).sort()).toEqual([201, 409]);
    const success = responses.find(response => response.statusCode === 201)!;
    expect(validateResponse(success.json()), JSON.stringify(validateResponse.errors)).toBe(true);
    expect(Object.keys(success.json())).toEqual(["account"]);
    expect(success.json().account).toEqual({
      id: expect.any(String), email, displayName: "Student", role: "MEMBER",
      avatarUrl: null, declaredSchool: null, area: null, bio: null,
      schoolVerification: { status: "UNVERIFIED", school: null, verifiedAt: null },
      createdAt: expect.any(String), updatedAt: expect.any(String),
    });
    expect(success.headers["cache-control"]).toBe("no-store");
    const conflict = responses.find(response => response.statusCode === 409)!;
    expect(conflict.json().error.code).toBe("EMAIL_ALREADY_EXISTS");
    expect(conflict.body).not.toMatch(/password|constraint|INSERT|23505/);
    expect(await repository.countBy({ email })).toBe(1);
    const saved = await repository.createQueryBuilder("account").addSelect("account.passwordHash")
      .where("account.email = :email", { email }).getOneOrFail();
    const [algorithm, cost, blockSize, parallelism, salt, hash] = saved.passwordHash.split("$");
    expect(algorithm).toBe("scrypt");
    expect([cost, blockSize, parallelism]).toEqual(["16384", "8", "1"]);
    expect(timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, "hex"))).toBe(true);
    expect(scryptSync(password.trim(), salt, 64).toString("hex")).not.toBe(hash);
    expect(saved.role).toBe("MEMBER");

    for (const payload of [
      { email, password: "short", displayName: "Student" },
      { email, password, displayName: "Student", role: "ADMIN" },
      { email, password, displayName: "Student", schoolVerification: { status: "VERIFIED" } },
    ]) {
      const invalid = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload, remoteAddress: "192.0.2.50" });
      expect(invalid.statusCode).toBe(400);
      expect(invalid.json().error.code).toBe("VALIDATION_ERROR");
    }
    expect(await repository.countBy({ email })).toBe(1);
    await expect(repository.update({ id: saved.id }, { email: ` ${email.toUpperCase()} ` }))
      .rejects.toMatchObject({ driverError: { code: "23514", constraint: "CHK_Account_email_normalized" } });
    expect((await repository.findOneByOrFail({ id: saved.id })).email).toBe(email);
  } finally {
    await app.close();
    try {
      // Concurrent uniqueness needs independent committed transactions. Delete only this test's UUID email.
      await repository.delete({ email });
    } finally {
      await source.destroy();
    }
  }
}, 30000);
