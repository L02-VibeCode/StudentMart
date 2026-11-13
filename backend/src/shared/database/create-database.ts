import "dotenv/config";
import { Client } from "pg";
import { loadConfig } from "../config/env";

async function createDatabase() {
  const config = loadConfig();
  if (!config.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const url = new URL(config.DATABASE_URL);
  const database = decodeURIComponent(url.pathname.slice(1));
  if (database !== "student-mart") {
    throw new Error("Database initialization is restricted to student-mart");
  }
  // Connect to the maintenance database because the target may not exist yet.
  url.pathname = "/postgres";
  const client = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
    if (result.rowCount) {
      console.log("Database student-mart already exists; preserved existing data.");
      return;
    }
    try {
      await client.query('CREATE DATABASE "student-mart"');
      console.log("Created database student-mart.");
    } catch (error) {
      if ((error as { code?: string }).code !== "42P04") throw error;
      console.log("Database student-mart was created by another process.");
    }
  } finally {
    await client.end();
  }
}

void createDatabase().catch((error: unknown) => {
  const code = (error as { code?: string }).code ?? "UNKNOWN";
  console.error(`Database initialization failed (${code}). Check PostgreSQL access and DATABASE_URL.`);
  process.exitCode = 1;
});
