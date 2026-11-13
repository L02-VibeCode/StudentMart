import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import type { Repository } from "typeorm";
import { z } from "zod";
import { Account, AccountRole } from "./account.entity";

const deriveKey = promisify(scrypt);
const createAccountSchema = z.strictObject({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(100),
});

export type CreateAccountInput = z.input<typeof createAccountSchema>;
export type PublicAccount = Omit<Account, "passwordHash">;

export class AccountsService {
  constructor(private readonly accounts: Repository<Account>) {}

  async create(input: CreateAccountInput): Promise<PublicAccount> {
    const { email, password, displayName } = createAccountSchema.parse(input);
    const salt = randomBytes(16).toString("hex");
    const key = await deriveKey(password, salt, 64) as Buffer;
    const account = this.accounts.create({
      email,
      displayName,
      role: AccountRole.MEMBER,
      passwordHash: `scrypt$16384$8$1$${salt}$${key.toString("hex")}`,
    });
    const saved = await this.accounts.save(account);
    const { passwordHash: _passwordHash, ...publicAccount } = saved;
    return publicAccount;
  }
}
