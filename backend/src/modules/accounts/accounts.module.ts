import { Module } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { Account } from "./business/account.entity";
import { AccountsService } from "./business/accounts.service";
import { RegistrationController } from "./presentation/registration.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  controllers: [RegistrationController],
  providers: [{
    provide: AccountsService,
    inject: [getRepositoryToken(Account)],
    useFactory: (repository: Repository<Account>) => new AccountsService(repository),
  }],
  exports: [AccountsService],
})
export class AccountsModule {}
