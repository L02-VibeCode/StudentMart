import { Module, type DynamicModule } from "@nestjs/common";
import { DataSource } from "typeorm";
import { APP_GUARD } from "@nestjs/core";
import type { AppConfig } from "../../shared/config/env";
import { AuthService } from "./business/auth.service";
import { LoginRateLimiter } from "./business/login-rate-limiter";
import { AuthController } from "./presentation/auth.controller";
import { SessionGuard } from "./presentation/session.guard";
import { ResourceAccessGuard } from "./presentation/resource-access.guard";
import { LOGOUT_CLEANUP_HOOKS, type LogoutCleanupHook } from "./business/logout-cleanup";

@Module({})
export class AuthModule {
  static register(config: AppConfig): DynamicModule {
    if (!config.AUTH_RATE_LIMIT_SECRET) throw new Error("Configure AUTH_RATE_LIMIT_SECRET before starting authentication");
    return {
      module: AuthModule, controllers: [AuthController],
      providers: [
        { provide: LOGOUT_CLEANUP_HOOKS, useValue: [] },
        { provide: AuthService, inject: [DataSource, LOGOUT_CLEANUP_HOOKS], useFactory: (source: DataSource, hooks: LogoutCleanupHook[]) => new AuthService(source, new LoginRateLimiter(config.AUTH_RATE_LIMIT_SECRET!), hooks) },
        SessionGuard, ResourceAccessGuard,
        { provide: APP_GUARD, useExisting: SessionGuard },
        { provide: APP_GUARD, useExisting: ResourceAccessGuard },
      ],
      exports: [AuthService, LOGOUT_CLEANUP_HOOKS],
    };
  }
}
