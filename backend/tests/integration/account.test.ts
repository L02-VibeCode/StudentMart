import "reflect-metadata";
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import { expect, it } from "vitest";
import { Account, AccountRole } from "../../src/modules/accounts/business/account.entity";
import { AccountsService } from "../../src/modules/accounts/business/accounts.service";
import { EmailAlreadyExistsError } from "../../src/modules/accounts/business/registration-errors";
import { loadConfig } from "../../src/shared/config/env";
import { databaseOptions } from "../../src/shared/database/database-options";

it("persists Account fields, hides hashes, enforces unique email, and matches the migration", async () => {
  const config = loadConfig();
  if (!config.DATABASE_URL || new URL(config.DATABASE_URL).pathname !== "/student-mart") {
    throw new Error("Integration test requires the student-mart database");
  }
  const dataSource = new DataSource(databaseOptions(config));
  await dataSource.initialize();
  const runner = dataSource.createQueryRunner();
  try {
    const schema = await dataSource.driver.createSchemaBuilder().log();
    expect(schema.upQueries).toEqual([]);
    await runner.connect();
    await runner.startTransaction();
    const repository = runner.manager.getRepository(Account);
    const service = new AccountsService(repository);
    const email = `integration-${randomUUID()}@example.invalid`;
    const saved = await service.create({ email: email.toUpperCase(), password: "test-password-only", displayName: " Test " });
    expect(saved).toMatchObject({ email, displayName: "Test", role: AccountRole.MEMBER });
    expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(saved.updatedAt).toBeInstanceOf(Date);
    const found = await repository.findOneByOrFail({ id: saved.id });
    expect(found.passwordHash).toBeUndefined();
    const withHash = await repository.createQueryBuilder("account")
      .addSelect("account.passwordHash").where("account.id = :id", { id: saved.id }).getOneOrFail();
    expect(withHash.passwordHash).toMatch(/^scrypt\$/);
    await expect(service.create({ email, password: "other-password", displayName: "Duplicate" }))
      .rejects.toBeInstanceOf(EmailAlreadyExistsError);
  } finally {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    await runner.release();
    await dataSource.destroy();
  }
}, 30000);
