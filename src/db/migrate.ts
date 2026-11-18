import "dotenv/config";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { config } from "../config.js";
import { parseEsekoneDatabaseTarget } from "./database-target.js";

if (!config.DATABASE_MIGRATION_URL) {
  throw new Error("DATABASE_MIGRATION_URL is required to run migrations");
}
if (!config.ESEKONE_DATABASE_HOST || !config.ESEKONE_DATABASE_NAME) {
  throw new Error("ESEKONE database identity must be configured before migrations");
}

parseEsekoneDatabaseTarget(
  config.DATABASE_MIGRATION_URL,
  config.ESEKONE_DATABASE_HOST,
  config.ESEKONE_DATABASE_NAME,
  config.NODE_ENV,
);

const pool = new pg.Pool({
  connectionString: config.DATABASE_MIGRATION_URL,
  application_name: "esekone-migrations",
  ssl: config.isProduction ? { rejectUnauthorized: true } : undefined,
});
const migrations = [
  "0000_initial_schema.sql",
  "0001_tenant_security.sql",
  "0002_contacts.sql",
  "0003_force_tenant_rls.sql",
];

try {
  const identity = await pool.query("select current_database() as database_name");
  if (identity.rows[0]?.database_name !== config.ESEKONE_DATABASE_NAME) {
    throw new Error("Migration connection is not the configured ESEKONE database");
  }

  await pool.query(
    "CREATE TABLE IF NOT EXISTS esekone_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  for (const name of migrations) {
    const { rowCount } = await pool.query("SELECT 1 FROM esekone_migrations WHERE name=$1", [name]);
    if (rowCount) continue;

    const sql = await readFile(new URL("../../migrations/" + name, import.meta.url), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO esekone_migrations(name) VALUES($1)", [name]);
      await client.query("COMMIT");
      process.stdout.write("Applied " + name + "\n");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}