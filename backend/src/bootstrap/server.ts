import "dotenv/config";
import { buildApp } from "./app";
import { loadConfig } from "../shared/config/env";

async function bootstrap() {
  const config = loadConfig();
  const app = await buildApp(config);
  await app.listen({ host: config.HOST, port: config.PORT });
}

void bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
