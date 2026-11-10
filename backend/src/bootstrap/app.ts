import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "../app.module";
import { loadConfig, type AppConfig } from "../shared/config/env";

export async function buildApp(config: AppConfig = loadConfig()): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  app.enableCors({ origin: config.CORS_ORIGINS.split(",").map((origin) => origin.trim()) });
  app.enableShutdownHooks();
  return app;
}
