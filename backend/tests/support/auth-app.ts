import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { DataSource } from "typeorm";
import { AuthModule } from "../../src/modules/auth/auth.module";
import { loadConfig } from "../../src/shared/config/env";
import { configureHttp } from "../../src/shared/http/configure-http";
import { configureApiDocs } from "../../src/shared/http/api-docs";
import { AVATAR_STORAGE, type AvatarStorage } from "../../src/modules/accounts/business/avatar-storage";
import { LOGOUT_CLEANUP_HOOKS, type LogoutCleanupHook } from "../../src/modules/auth/business/logout-cleanup";

export async function authApp(source: DataSource, hooks: LogoutCleanupHook[] = [], avatarStorage?: AvatarStorage): Promise<NestFastifyApplication> {
  const auth = AuthModule.register(loadConfig({ NODE_ENV: "test", AUTH_RATE_LIMIT_SECRET: "test-secret-not-for-deployment-123456" }));
  const builder = Test.createTestingModule({ imports: [{ ...auth,
    providers: [...auth.providers!, { provide: DataSource, useValue: source }],
  }] }).overrideProvider(LOGOUT_CLEANUP_HOOKS).useValue(hooks);
  if (avatarStorage) builder.overrideProvider(AVATAR_STORAGE).useValue(avatarStorage);
  const module = await builder.compile();
  const app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter({ requestIdHeader: false, bodyLimit: 16384 }), { logger: false });
  configureHttp(app);
  configureApiDocs(app);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
