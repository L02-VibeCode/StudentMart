import { scryptSync } from "node:crypto";
import type { Repository } from "typeorm";
import { describe, expect, it, vi } from "vitest";
import { Account, AccountRole } from "../../src/modules/accounts/business/account.entity";
import { AccountsService } from "../../src/modules/accounts/business/accounts.service";

function setup() {
  const create = vi.fn((values: Partial<Account>) => Object.assign(new Account(), values));
  const save = vi.fn(async (account: Account) => Object.assign(account, {
    id: "test-account", createdAt: new Date(), updatedAt: new Date(),
  }));
  const repository = { create, save } as unknown as Repository<Account>;
  return { service: new AccountsService(repository), create, save };
}

describe("AccountsService", () => {
  it("normalizes input, hashes the password, and excludes it from the result", async () => {
    const { service, create } = setup();
    const result = await service.create({
      email: "  MEMBER@Example.com  ", password: "example-password", displayName: "  Member  ",
    });
    expect(result).toMatchObject({ email: "member@example.com", displayName: "Member", role: AccountRole.MEMBER });
    expect(result).not.toHaveProperty("passwordHash");
    const stored = create.mock.calls[0][0];
    const [algorithm, cost, blockSize, parallelism, salt, hash] = stored.passwordHash!.split("$");
    expect([algorithm, cost, blockSize, parallelism]).toEqual(["scrypt", "16384", "8", "1"]);
    expect(scryptSync("example-password", salt, 64).toString("hex")).toBe(hash);
  });

  it("uses a different random salt for each account", async () => {
    const { service, create } = setup();
    await service.create({ email: "one@example.com", password: "example-password", displayName: "One" });
    await service.create({ email: "two@example.com", password: "example-password", displayName: "Two" });
    expect(create.mock.calls[0][0].passwordHash).not.toBe(create.mock.calls[1][0].passwordHash);
  });

  it("rejects invalid input and attempts to choose an administrator role", async () => {
    const { service, save } = setup();
    await expect(service.create({ email: "invalid", password: "short", displayName: " " })).rejects.toThrow();
    await expect(service.create({
      email: "admin@example.com", password: "example-password", displayName: "Admin", role: AccountRole.ADMIN,
    } as Parameters<AccountsService["create"]>[0])).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
  });
});
