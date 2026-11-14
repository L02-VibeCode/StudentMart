import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().min(1).default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  AUTH_RATE_LIMIT_SECRET: z.string().min(32).optional(),
  CORS_ORIGINS: z.string().default("http://localhost:8081,http://localhost:19006"),
  DATABASE_URL: z.string().refine((value) => {
    try {
      const url = new URL(value);
      return ["postgresql:", "postgres:"].includes(url.protocol)
        && Boolean(url.hostname)
        && url.pathname.length > 1;
    } catch {
      return false;
    }
  }, "DATABASE_URL must be a PostgreSQL URL with a host and database name").optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  return envSchema.parse(environment);
}
