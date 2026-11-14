import "reflect-metadata";
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import { expect, it } from "vitest";
import { Account } from "../../src/modules/accounts/business/account.entity";
import { loadConfig } from "../../src/shared/config/env";
import { databaseOptions } from "../../src/shared/database/database-options";
import { registrationApp } from "../support/registration-app";
import { createRegistrationApi } from "../../../mobile/src/features/auth/data/registration-api";
import { createRegistrationModel } from "../../../mobile/src/features/auth/presentation/registration-model";

it("connects the mobile registration flow to real HTTP/PostgreSQL, blocks double submit, and preserves a duplicate form", async () => {
  const config = loadConfig();
  if (!config.DATABASE_URL || new URL(config.DATABASE_URL).pathname !== "/student-mart") throw new Error("Requires student-mart");
  const source = new DataSource(databaseOptions(config));
  await source.initialize();
  const repository = source.getRepository(Account);
  const email = `mobile-${randomUUID()}@example.invalid`;
  const app = await registrationApp(repository);
  try {
    await app.listen({ host: "127.0.0.1", port: 0 });
    const origin = await app.getUrl();
    let requests = 0;
    const register = createRegistrationApi(origin, async (url, options) => { requests++; return fetch(url, options); });
    const navigations: string[] = [];
    const model = createRegistrationModel(register, value => { navigations.push(value); });
    for (const [key, value] of Object.entries({ email: ` ${email.toUpperCase()} `, displayName: " Sinh viên ", password: " mobile-password ", confirmPassword: " mobile-password " })) {
      model.setField(key as "email" | "displayName" | "password" | "confirmPassword", value);
    }
    await Promise.all([model.submit(), model.submit(), model.submit()]);
    expect(requests).toBe(1);
    expect(navigations).toEqual([email]);
    expect(model.getSnapshot().form.password).toBe("");
    expect(await repository.countBy({ email })).toBe(1);

    const duplicate = createRegistrationModel(register, value => { navigations.push(value); });
    duplicate.setField("email", email.toUpperCase());
    duplicate.setField("displayName", "Sinh viên");
    duplicate.setField("password", "another-password");
    duplicate.setField("confirmPassword", "another-password");
    await duplicate.submit();
    expect(duplicate.getSnapshot().fields.email).toContain("đã được sử dụng");
    expect(duplicate.getSnapshot().form.password).toBe("another-password");
    expect(duplicate.getSnapshot().submitting).toBe(false);
    expect(navigations).toEqual([email]);
    expect(await repository.countBy({ email })).toBe(1);
    const saved = await repository.findOneByOrFail({ email });
    expect(saved).toMatchObject({ email, displayName: "Sinh viên", role: "MEMBER" });
    expect(saved.passwordHash).toBeUndefined();
    model.dispose();
    duplicate.dispose();
  } finally {
    await app.close();
    try { await repository.delete({ email }); }
    finally { await source.destroy(); }
  }
}, 30000);
