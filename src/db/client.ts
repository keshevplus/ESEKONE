import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { config } from "../config.js";
import * as schema from "./schema.js";

const pool = config.DATABASE_URL
  ? new pg.Pool({
      connectionString: config.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      application_name: "esekone-platform",
      ssl: config.isProduction ? { rejectUnauthorized: true } : undefined,
    })
  : null;

pool?.on("error", (error) => console.error("Unexpected database pool error", error.message));

export const db = pool ? drizzle(pool, { schema }) : null;

export async function checkDatabase() {
  if (!pool) throw new Error("DATABASE_URL is not configured");
  if (!config.ESEKONE_DATABASE_NAME) throw new Error("ESEKONE_DATABASE_NAME is not configured");
  const result = await pool.query("select current_database() as database_name");
  if (result.rows[0]?.database_name !== config.ESEKONE_DATABASE_NAME) {
    throw new Error("Connected database identity does not match ESEKONE_DATABASE_NAME");
  }
}

export async function closeDatabase() {
  if (pool) await pool.end();
}
