import { DataSource } from "typeorm";
import { ZodError } from "zod";
import { Account } from "./account.entity";
import { School, Area } from "./catalog.entity";
import { privateAccountDto } from "./account-projection";
export type UpdateProfileInput = { displayName?: string; bio?: string | null; declaredSchoolId?: string | null; areaId?: string | null };
import { AuthError } from "../../auth/business/auth-errors";
export class ProfileService {
  constructor(private readonly source: DataSource) {}
  catalog(kind: "schools" | "areas") {
    return this.source.getRepository(kind === "schools" ? School : Area).find({ order: { name: "ASC", id: "ASC" } });
  }
  async update(accountId: string, input: UpdateProfileInput) {
    return this.source.transaction(async manager => {
      const accounts = manager.getRepository(Account);
      const account = await accounts.createQueryBuilder("account").addSelect("account.loginDisabledAt")
        .where("account.id = :accountId", { accountId }).setLock("pessimistic_write").getOne();
      if (!account) throw new AuthError(401, "UNAUTHENTICATED");
      if (account.loginDisabledAt) throw new AuthError(403, "FORBIDDEN");
      for (const [field, entity] of [["declaredSchoolId", School], ["areaId", Area]] as const) {
        const id = input[field];
        if (id) {
          const found = await manager.getRepository(entity).createQueryBuilder("lookup").where("lookup.id = :id", { id })
            .setLock("pessimistic_read").getOne();
          if (!found) throw new ZodError([{ code: "custom", path: [field], message: "Invalid lookup" }]);
        }
      }
      await accounts.update({ id: accountId }, input);
      const saved = await accounts.findOneOrFail({ where: { id: accountId }, relations: { declaredSchool: true, area: true } });
      return privateAccountDto(saved);
    });
  }
}
