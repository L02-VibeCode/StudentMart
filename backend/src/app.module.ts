import { Module, type DynamicModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccountsModule } from "./modules/accounts/accounts.module";
import { HealthController } from "./modules/health/presentation/health.controller";
import type { AppConfig } from "./shared/config/env";
import { databaseOptions } from "./shared/database/database-options";

@Module({ controllers: [HealthController] })
export class AppModule {
  static register(config: AppConfig, connectDatabase = true): DynamicModule {
    return {
      module: AppModule,
      imports: connectDatabase
        ? [TypeOrmModule.forRoot({ ...databaseOptions(config), retryAttempts: 1 }), AccountsModule]
        : [],
    };
  }
}
