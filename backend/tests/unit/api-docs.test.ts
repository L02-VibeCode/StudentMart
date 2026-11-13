import type { Repository } from "typeorm";
import { expect, it } from "vitest";
import type { Account } from "../../src/modules/accounts/business/account.entity";
import { registrationApp } from "../support/registration-app";

it("serves local Swagger UI/assets and the canonical contract for implemented routes only", async () => {
  const app = await registrationApp({} as Repository<Account>);
  try {
    const page = await app.inject({ method: "GET", url: "/api/docs" });
    expect(page.statusCode).toBe(200);
    expect(page.headers["content-type"]).toContain("text/html");
    expect(page.body).toContain("StudentMart API Docs");
    const asset = await app.inject({ method: "GET", url: "/api/docs/swagger-ui-bundle.js" });
    expect(asset.statusCode).toBe(200);
    expect(asset.headers["content-type"]).toMatch(/javascript/);
    const response = await app.inject({ method: "GET", url: "/api/docs/openapi.json" });
    expect(response.statusCode).toBe(200);
    const document = response.json();
    expect(document.servers[0].url).toBe("/");
    expect(Object.keys(document.paths)).toEqual(["/api/v1/auth/register"]);
    const registration = document.paths["/api/v1/auth/register"].post;
    expect(registration.security).toEqual([]);
    expect(registration.requestBody.content["application/json"].schema.$ref).toBe("#/components/schemas/RegisterRequest");
    expect(registration.responses["201"]).toBeDefined();
    expect(document.components.schemas.RegisterRequest.additionalProperties).toBe(false);
    const yaml = await app.inject({ method: "GET", url: "/api/docs/openapi.yaml" });
    expect(yaml.statusCode).toBe(200);
    expect(yaml.body).toContain("openapi: 3.0.3");
  } finally {
    await app.close();
  }
});
