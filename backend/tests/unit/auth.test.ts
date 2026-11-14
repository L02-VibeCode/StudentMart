import { randomBytes, scryptSync } from "node:crypto";
import { expect, it } from "vitest";
import type { DataSource } from "typeorm";
import { LoginRateLimiter } from "../../src/modules/auth/business/login-rate-limiter";
import { AuthError } from "../../src/modules/auth/business/auth-errors";
import { verifyPassword } from "../../src/modules/auth/business/password";
import { authApp } from "../support/auth-app";

const secret = "test-secret-for-hmac-at-least-32-chars";
it("limits failed attempts independently by IP and normalized-email HMAC", () => {
  const limiter = new LoginRateLimiter(secret);
  for (let index = 0; index < 5; index++) limiter.reserve("first-ip", `email${index}@example.com`)(true);
  expect(() => limiter.reserve("first-ip", "other@example.com")).toThrow(AuthError);
  const emailLimiter = new LoginRateLimiter(secret);
  for (let index = 0; index < 5; index++) emailLimiter.reserve(`ip-${index}`, "member@example.com")(true);
  expect(() => emailLimiter.reserve("different-ip", "member@example.com")).toThrow(AuthError);
  expect(() => emailLimiter.reserve("different-ip", "other@example.com")).not.toThrow();
});

it("reserves capacity before async hashing and releases successes without counting them as failures", () => {
  let now = 0;
  const limiter = new LoginRateLimiter(secret, () => now);
  const reserved = Array.from({ length: 5 }, (_, index) => limiter.reserve(`ip-${index}`, "one@example.com"));
  expect(() => limiter.reserve("sixth", "one@example.com")).toThrow(AuthError);
  reserved.forEach(complete => { complete(false); complete(true); });
  for (let index = 0; index < 20; index++) limiter.reserve("ip", "one@example.com")(false);
  for (let index = 0; index < 5; index++) limiter.reserve("ip", "one@example.com")(true);
  try { limiter.reserve("ip", "one@example.com"); } catch (error) { expect(error).toMatchObject({ retryAfter: 900 }); }
  now = 15 * 60 * 1000;
  expect(() => limiter.reserve("ip", "one@example.com")).not.toThrow();
});

it("uses the existing scrypt parameters, preserves password whitespace, and rejects missing/corrupt hashes safely", async () => {
  const salt = randomBytes(16).toString("hex");
  const password = " password-kept ";
  const hash = `scrypt$16384$8$1$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
  expect(await verifyPassword(password, hash)).toBe(true);
  expect(await verifyPassword(password.trim(), hash)).toBe(false);
  expect(await verifyPassword(password)).toBe(false);
  expect(await verifyPassword(password, "scrypt$999999999$8$1$invalid$bad")).toBe(false);
});

it("requires a secret and returns safe HTTP errors for invalid login and bearer formats", async () => {
  expect(() => new LoginRateLimiter("short")).toThrow();
  const app = await authApp({} as DataSource);
  try {
    for (const payload of [{}, { email: "test@example.com", password: "password", role: "ADMIN" }]) {
      const response = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload });
      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe("VALIDATION_ERROR");
      expect(response.headers["cache-control"]).toBe("no-store");
      expect(response.body).not.toContain("ADMIN");
    }
    for (const authorization of [undefined, "Bearer bad", "Basic private", `Bearer ${"a".repeat(43)}, other`]) {
      const response = await app.inject({ method: "GET", url: "/api/v1/accounts/me", headers: authorization ? { authorization } : {} });
      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe("UNAUTHENTICATED");
      expect(response.body).not.toContain("private");
    }
    const docs = await app.inject({ method: "GET", url: "/api/docs/openapi.json" });
    expect(Object.keys(docs.json().paths).sort()).toEqual(["/api/v1/accounts/me", "/api/v1/accounts/me/avatar", "/api/v1/auth/login", "/api/v1/auth/logout", "/api/v1/catalog/areas", "/api/v1/catalog/schools"]);
  } finally { await app.close(); }
});
