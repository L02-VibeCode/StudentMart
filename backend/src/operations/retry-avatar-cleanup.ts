import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { loadConfig } from "../shared/config/env";
import { databaseOptions } from "../shared/database/database-options";
import { AvatarCleanup } from "../modules/accounts/business/avatar-cleanup.entity";
import { AvatarService } from "../modules/accounts/business/avatar.service";
import { CloudinaryAvatarStorage } from "../modules/accounts/data/cloudinary-avatar-storage";
async function run(){
 const config=loadConfig();const source=new DataSource(databaseOptions(config));await source.initialize();
 try{
  const repository=source.getRepository(AvatarCleanup);const before=await repository.count();
  const owners=await repository.createQueryBuilder("cleanup").select("cleanup.accountId","accountId").distinct(true).getRawMany<{accountId:string}>();
  const service=new AvatarService(source,new CloudinaryAvatarStorage(config));
  for(const owner of owners)await service.cleanup(owner.accountId);
  const pending=await repository.count();console.info(`Avatar cleanup: ${before-pending} completed, ${pending} pending.`);
  if(pending)process.exitCode=1;
 }finally{await source.destroy();}
}
void run().catch(()=>{console.error("Avatar cleanup unavailable; check database/provider configuration.");process.exitCode=1;});
