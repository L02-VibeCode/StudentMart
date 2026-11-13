import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "../app.module";
import { loadConfig, type AppConfig } from "../shared/config/env";
import { configureHttp } from "../shared/http/configure-http";

export async function buildApp(
  config: AppConfig = loadConfig(),
  options: { connectDatabase?: boolean } = {},
): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register(config, options.connectDatabase ?? true), new FastifyAdapter({ requestIdHeader: false, bodyLimit: 16384 }),
  );
  configureHttp(app);
  app.enableCors({ origin: config.CORS_ORIGINS.split(",").map((origin) => origin.trim()) });
  app.enableShutdownHooks();
  return app;
}
