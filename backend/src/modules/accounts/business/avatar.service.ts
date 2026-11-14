import { DataSource } from "typeorm";
import { Account } from "./account.entity";
import { AvatarCleanup } from "./avatar-cleanup.entity";
import { privateAccountDto } from "./account-projection";
import type { AvatarStorage, StoredAvatar } from "./avatar-storage";
import { AuthError } from "../../auth/business/auth-errors";
export class AvatarService {
  constructor(private readonly source: DataSource, private readonly storage: AvatarStorage) {}
  async cleanup(accountId: string) {
    const queue = this.source.getRepository(AvatarCleanup);
    let pending: AvatarCleanup[];
    try { pending = await queue.find({ where: { accountId }, take: 20, order: { id: "ASC" } }); } catch { return; }
    for (const item of pending) {
      try { await this.storage.destroy(item.publicId); await queue.delete(item.id); } catch { /* Keep durable intent for next mutation/operator retry. Never expose provider errors. */ }
    }
  }
  async replace(accountId: string, bytes: Buffer) {
    let uploaded: StoredAvatar;
    try { uploaded = await this.storage.upload(accountId, bytes); } catch { throw new AuthError(503, "SERVICE_UNAVAILABLE"); }
    try {
      if (new URL(uploaded.url).protocol !== "https:") throw new Error();
    } catch {
      try { await this.source.getRepository(AvatarCleanup).save({accountId,publicId:uploaded.publicId}); await this.cleanup(accountId); } catch {}
      throw new AuthError(503, "SERVICE_UNAVAILABLE");
    }
    try {
      const result = await this.source.transaction(async manager => {
        const repo = manager.getRepository(Account);
        const current = await repo.createQueryBuilder("account").addSelect("account.loginDisabledAt").addSelect("account.avatarPublicId")
          .where("account.id = :accountId", { accountId }).setLock("pessimistic_write").getOne();
        if (!current) throw new AuthError(401, "UNAUTHENTICATED");
        if (current.loginDisabledAt) throw new AuthError(403, "FORBIDDEN");
        if (current.avatarPublicId) await manager.getRepository(AvatarCleanup).save({accountId, publicId:current.avatarPublicId});
        await repo.update(accountId, {avatarUrl:uploaded.url,avatarPublicId:uploaded.publicId});
        return privateAccountDto(await repo.findOneOrFail({where:{id:accountId},relations:{declaredSchool:true,area:true}}));
      });
      await this.cleanup(accountId); return result;
    } catch (error) {
      try { await this.source.getRepository(AvatarCleanup).save({accountId,publicId:uploaded.publicId}); await this.cleanup(accountId); } catch { /* provider may need orphan reconciliation if DB is unavailable */ }
      throw error;
    }
  }
  async remove(accountId: string) {
    await this.source.transaction(async manager => {
      const repo=manager.getRepository(Account);
      const current=await repo.createQueryBuilder("account").addSelect("account.loginDisabledAt").addSelect("account.avatarPublicId")
        .where("account.id = :accountId",{accountId}).setLock("pessimistic_write").getOne();
      if(!current)throw new AuthError(401,"UNAUTHENTICATED");
      if(current.loginDisabledAt)throw new AuthError(403,"FORBIDDEN");
      if(current.avatarPublicId)await manager.getRepository(AvatarCleanup).save({accountId,publicId:current.avatarPublicId});
      await repo.update(accountId,{avatarUrl:null,avatarPublicId:null});
    });
    await this.cleanup(accountId);
  }
}
