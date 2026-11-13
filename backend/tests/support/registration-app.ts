import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import type { Repository } from "typeorm";
import { AccountsModule } from "../../src/modules/accounts/accounts.module";
import { Account } from "../../src/modules/accounts/business/account.entity";
import { configureHttp } from "../../src/shared/http/configure-http";

export async function registrationApp(repository: Repository<Account>): Promise<NestFastifyApplication> {
  const module = await Test.createTestingModule({ imports: [AccountsModule] })
    .overrideProvider(getRepositoryToken(Account)).useValue(repository).compile();
  const app = module.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ requestIdHeader: false, bodyLimit: 16384 }), { logger: false },
  );
  configureHttp(app);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
