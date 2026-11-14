import { randomUUID } from "node:crypto";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { QueryFailedError, type Repository } from "typeorm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Account } from "../../src/modules/accounts/business/account.entity";
import { RegistrationRateLimiter } from "../../src/modules/accounts/presentation/registration-rate-limiter";
import { RegistrationRateLimitedError } from "../../src/modules/accounts/business/registration-errors";
import { registrationApp } from "../support/registration-app";

const input = { email: "  MEMBER@Example.com  ", password: " password-kept ", displayName: " Member " };
let app: NestFastifyApplication | undefined;
afterEach(async () => { await app?.close(); app = undefined; });

function setupRepository() {
  const create = vi.fn((values: Partial<Account>) => Object.assign(new Account(), values));
  const save = vi.fn(async (account: Account) => Object.assign(account, {
    id: randomUUID(), createdAt: new Date(), updatedAt: new Date(),
  }));
  return { create, save, repository: { create, save } as unknown as Repository<Account> };
}

describe("registration HTTP contract", () => {
  it("returns a normalized MEMBER private DTO without session or credentials", async () => {
    const { repository } = setupRepository();
    app = await registrationApp(repository);
    const response = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: input, headers: { "x-request-id": "untrusted" } });
    expect(response.statusCode).toBe(201);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers["x-request-id"]).not.toBe("untrusted");
    expect(Object.keys(response.json())).toEqual(["account"]);
    expect(response.json().account).toEqual({
      id: expect.any(String), email: "member@example.com", displayName: "Member", role: "MEMBER",
      avatarUrl: null, declaredSchool: null, area: null, bio: null,
      schoolVerification: { status: "UNVERIFIED", school: null, verifiedAt: null },
      createdAt: expect.any(String), updatedAt: expect.any(String),
    });
  });

  it("rejects field injection and invalid input before persistence", async () => {
    const { repository, save } = setupRepository();
    app = await registrationApp(repository);
    const invalid = [
      ...["role", "schoolVerification", "accountId", "confirmPassword"].map(field => ({ ...input, [field]: "injected" })),
      { ...input, email: "invalid" }, { ...input, password: "short" }, { ...input, displayName: "   " },
      { ...input, displayName: "x".repeat(101) }, { ...input, password: "x".repeat(129) }, null, [],
    ];
    for (const [index, payload] of invalid.entries()) {
      const response = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: JSON.stringify(payload), headers: { "content-type": "application/json" }, remoteAddress: `192.0.2.${index + 1}` });
      expect(response.statusCode).toBe(400);
      expect(response.json().error).toMatchObject({ code: "VALIDATION_ERROR", requestId: expect.any(String), fields: expect.any(Object) });
      expect(response.body).not.toContain("injected");
      expect(response.body).not.toContain(input.password);
    }
    const unsupported = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: "sensitive", headers: { "content-type": "application/xml" } });
    expect(unsupported.statusCode).toBe(415);
    expect(unsupported.json().error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
    expect(unsupported.body).not.toContain("sensitive");
    expect(save).not.toHaveBeenCalled();
  });

  it("uses Unicode code points for both name and password", async () => {
    const { repository, create } = setupRepository();
    app = await registrationApp(repository);
    const response = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { ...input, displayName: "\u{1F600}".repeat(100), password: "\u{1F600}".repeat(128) } });
    expect(response.statusCode).toBe(201);
    expect(create.mock.calls[0][0].passwordHash).toMatch(/^scrypt\$/);
  });

  it("maps only email unique violations to 409 and hides internal details", async () => {
    const { repository, save } = setupRepository();
    app = await registrationApp(repository);
    save.mockRejectedValueOnce(new QueryFailedError("INSERT private", [], { code: "23505", constraint: "UQ_cc1420f32afa2392dfdb5003647" } as unknown as Error));
    const duplicate = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: input });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json().error.code).toBe("EMAIL_ALREADY_EXISTS");
    save.mockRejectedValueOnce(new Error("private password SQL stack"));
    const failure = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: input });
    expect(failure.statusCode).toBe(500);
    expect(failure.json().error.code).toBe("INTERNAL_ERROR");
    expect(failure.body).not.toMatch(/private|password|SQL|stack/);
    save.mockRejectedValueOnce(Object.assign(new Error("database private"), { code: "ECONNREFUSED" }));
    const unavailable = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: input });
    expect(unavailable.statusCode).toBe(503);
    expect(unavailable.json().error.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("enforces 5 attempts per IP and ignores spoofed forwarded IPs", async () => {
    const { repository, save } = setupRepository();
    app = await registrationApp(repository);
    for (let index = 0; index < 5; index++) {
      const result = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: {} });
      expect(result.statusCode).toBe(400);
    }
    const limited = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: input, headers: { "x-forwarded-for": "203.0.113.99" } });
    expect(limited.statusCode).toBe(429);
    expect(limited.json().error.code).toBe("RATE_LIMITED");
    expect(Number(limited.headers["retry-after"])).toBeGreaterThan(0);
    expect(save).not.toHaveBeenCalled();
  });

  it("returns safe envelopes for malformed JSON and oversized input", async () => {
    const { repository, save } = setupRepository();
    app = await registrationApp(repository);
    for (const [payload, status, code] of [
      ['{"password":"sensitive",', 400, "VALIDATION_ERROR"],
      [JSON.stringify({ ...input, displayName: "x".repeat(17000) }), 413, "PAYLOAD_TOO_LARGE"],
    ] as const) {
      const response = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload, headers: { "content-type": "application/json" } });
      expect(response.statusCode).toBe(status);
      expect(response.json().error).toMatchObject({ code, requestId: expect.any(String) });
      expect(response.body).not.toContain("sensitive");
    }
    expect(save).not.toHaveBeenCalled();
  });
});

it("resets the rate limit after expiry and isolates IP buckets", () => {
  let now = 0;
  const limiter = new RegistrationRateLimiter(() => now);
  for (let index = 0; index < 5; index++) limiter.consume("first");
  expect(() => limiter.consume("first")).toThrow(RegistrationRateLimitedError);
  expect(() => limiter.consume("second")).not.toThrow();
  now = 15 * 60 * 1000;
  expect(() => limiter.consume("first")).not.toThrow();
});
