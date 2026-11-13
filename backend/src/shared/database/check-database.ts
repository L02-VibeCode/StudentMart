import dataSource from "./data-source";

async function checkDatabase() {
  try {
    await dataSource.initialize();
    const [{ database }] = await dataSource.query("SELECT current_database() AS database");
    const tables: { table_name: string }[] = await dataSource.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name",
    );
    const historyExists = tables.some((table) => table.table_name === "typeorm_migrations");
    const applied: { name: string }[] = historyExists
      ? await dataSource.query('SELECT name FROM "typeorm_migrations" ORDER BY id')
      : [];
    const appliedNames = new Set(applied.map((migration) => migration.name));
    const pending = dataSource.migrations
      .map((migration) => migration.name ?? migration.constructor.name)
      .filter((name) => !appliedNames.has(name));
    const schema = await dataSource.driver.createSchemaBuilder().log();

    console.log(`Database: ${database}`);
    console.log("Connection: OK");
    console.log(`Tables: ${tables.map((table) => table.table_name).join(", ") || "(none)"}`);
    console.log(`Applied migrations: ${applied.map((migration) => migration.name).join(", ") || "(none)"}`);
    console.log(`Pending migrations: ${pending.join(", ") || "(none)"}`);
    console.log(`Schema matches entities: ${schema.upQueries.length === 0 ? "yes" : "no"}`);
    if (pending.length || schema.upQueries.length) process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

void checkDatabase().catch((error: unknown) => {
  const code = (error as { code?: string }).code ?? "UNKNOWN";
  console.error(`Database check failed (${code}). Check DATABASE_URL and PostgreSQL access.`);
  process.exitCode = 1;
});
