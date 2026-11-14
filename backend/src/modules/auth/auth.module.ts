import { Module, type DynamicModule } from "@nestjs/common";
import { DataSource } from "typeorm";
import type { AppConfig } from "../../shared/config/env";
import { AuthService } from "./business/auth.service";
import { LoginRateLimiter } from "./business/login-rate-limiter";
import { AuthController } from "./presentation/auth.controller";

@Module({})
export class AuthModule {
  static register(config: AppConfig): DynamicModule {
    if (!config.AUTH_RATE_LIMIT_SECRET) throw new Error("Configure AUTH_RATE_LIMIT_SECRET before starting authentication");
    return {
      module: AuthModule, controllers: [AuthController],
      providers: [{ provide: AuthService, inject: [DataSource], useFactory: (source: DataSource) => new AuthService(source, new LoginRateLimiter(config.AUTH_RATE_LIMIT_SECRET!)) }],
    };
  }
}
