import { describe, expect, it } from "vitest";
import { buildApp } from "../../src/bootstrap/app.js";
import { loadConfig } from "../../src/shared/config/env.js";

describe("backend bootstrap", () => {
  it("returns a healthy response", async () => {
    const app = await buildApp(loadConfig({ NODE_ENV: "test" }));
    try {
      await app.init();
      await app.getHttpAdapter().getInstance().ready();
      const response = await app.inject({ method: "GET", url: "/health" });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: "ok" });
      const missing = await app.inject({ method: "GET", url: "/missing" });
      expect(missing.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("validates and defaults runtime configuration", () => {
    expect(loadConfig({ NODE_ENV: "test" })).toMatchObject({
      NODE_ENV: "test",
      HOST: "0.0.0.0",
      PORT: 3000,
    });
  });

  it("rejects invalid ports", () => {
    expect(() => loadConfig({ PORT: "invalid" })).toThrow();
    expect(() => loadConfig({ PORT: "65536" })).toThrow();
  });

  it("reads a PostgreSQL connection string for student-mart", () => {
    const databaseUrl = "postgresql://postgres:p%40ss%3Aword@localhost:5432/student-mart";
    expect(loadConfig({ DATABASE_URL: databaseUrl }).DATABASE_URL).toBe(databaseUrl);
  });

  it("rejects malformed or non-PostgreSQL database URLs", () => {
    for (const value of ["not-a-url", "https://localhost/student-mart", "postgresql://localhost/"]) {
      expect(() => loadConfig({ DATABASE_URL: value })).toThrow();
    }
  });
});
