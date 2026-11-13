import { join } from "node:path";
import type { DataSourceOptions } from "typeorm";
import { Account } from "../../modules/accounts/business/account.entity";
import type { AppConfig } from "../config/env";

export function databaseOptions(config: AppConfig): DataSourceOptions {
  if (!config.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to connect to PostgreSQL");
  }
  return {
    type: "postgres",
    url: config.DATABASE_URL,
    entities: [Account],
    migrations: [join(__dirname, "migrations", "*.js")],
    migrationsTableName: "typeorm_migrations",
    synchronize: false,
    migrationsRun: false,
    logging: false,
    uuidExtension: "pgcrypto",
    installExtensions: false,
    connectTimeoutMS: 10000,
    extra: { max: 10, connectionTimeoutMillis: 10000 },
  };
}
