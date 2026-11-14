import { randomBytes, scrypt } from "node:crypto";
import { QueryFailedError, type Repository } from "typeorm";
import { z } from "zod";
import { Account, AccountRole } from "./account.entity";
import { EmailAlreadyExistsError } from "./registration-errors";

const deriveKey = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, key) => {
    if (error) reject(error);
    else resolve(key);
  });
});
const lengthBetween = (minimum: number, maximum: number) => (value: string) => {
  const length = Array.from(value).length;
  return length >= minimum && length <= maximum;
};
const createAccountSchema = z.strictObject({
  email: z.string().trim().toLowerCase().email().refine(lengthBetween(1, 254)),
  password: z.string().refine(lengthBetween(8, 128)),
  displayName: z.string().trim().refine(lengthBetween(1, 100)),
});

export type CreateAccountInput = z.input<typeof createAccountSchema>;
export type PublicAccount = Pick<Account, "id" | "email" | "displayName" | "role" | "createdAt" | "updatedAt">;

export class AccountsService {
  constructor(private readonly accounts: Repository<Account>) {}

  async create(input: unknown): Promise<PublicAccount> {
    const { email, password, displayName } = createAccountSchema.parse(input);
    const salt = randomBytes(16).toString("hex");
    const key = await deriveKey(password, salt);
    const account = this.accounts.create({
      email,
      displayName,
      role: AccountRole.MEMBER,
      passwordHash: `scrypt$16384$8$1$${salt}$${key.toString("hex")}`,
    });
    try {
      const saved = await this.accounts.save(account);
      return {
        id: saved.id,
        email: saved.email,
        displayName: saved.displayName,
        role: saved.role,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
    } catch (error) {
      if (error instanceof QueryFailedError
        && error.driverError.code === "23505"
        && error.driverError.constraint === "UQ_cc1420f32afa2392dfdb5003647") {
        throw new EmailAlreadyExistsError();
      }
      throw error;
    }
  }
}
