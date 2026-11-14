import { Module, type DynamicModule } from "@nestjs/common";
import { DataSource } from "typeorm";
import { APP_GUARD } from "@nestjs/core";
import type { AppConfig } from "../../shared/config/env";
import { AuthService } from "./business/auth.service";
import { LoginRateLimiter } from "./business/login-rate-limiter";
import { AvatarController } from "../accounts/presentation/avatar.controller";
import { AvatarService } from "../accounts/business/avatar.service";
import { AVATAR_STORAGE, type AvatarStorage } from "../accounts/business/avatar-storage";
import { CloudinaryAvatarStorage } from "../accounts/data/cloudinary-avatar-storage";
import { ProfileService } from "../accounts/business/profile.service";
import { ProfileController } from "../accounts/presentation/profile.controller";
import { AuthController } from "./presentation/auth.controller";
import { SessionGuard } from "./presentation/session.guard";
import { ResourceAccessGuard } from "./presentation/resource-access.guard";
import { LOGOUT_CLEANUP_HOOKS, type LogoutCleanupHook } from "./business/logout-cleanup";

@Module({})
export class AuthModule {
  static register(config: AppConfig): DynamicModule {
    if (!config.AUTH_RATE_LIMIT_SECRET) throw new Error("Configure AUTH_RATE_LIMIT_SECRET before starting authentication");
    return {
      module: AuthModule, controllers: [AuthController, ProfileController, AvatarController],
      providers: [
        { provide: AVATAR_STORAGE, useFactory: () => new CloudinaryAvatarStorage(config) },
        { provide: AvatarService, inject: [DataSource, AVATAR_STORAGE], useFactory: (source:DataSource,storage:AvatarStorage) => new AvatarService(source,storage) },
        { provide: ProfileService, inject: [DataSource], useFactory: (source: DataSource) => new ProfileService(source) },
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
