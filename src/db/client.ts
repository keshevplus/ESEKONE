import {drizzle} from "drizzle-orm/node-postgres";
import pg from "pg";
import {config} from "../config.js";
import * as schema from "./schema.js";
const pool=config.DATABASE_URL?new pg.Pool({connectionString:config.DATABASE_URL,max:10,idleTimeoutMillis:30000,connectionTimeoutMillis:5000,ssl:config.isProduction?{rejectUnauthorized:true}:undefined}):null;
pool?.on("error",error=>console.error("Unexpected database pool error",error.message));
export const db=pool?drizzle(pool,{schema}):null;
export async function checkDatabase(){if(!pool)throw new Error("DATABASE_URL is not configured");await pool.query("select 1");}
export async function closeDatabase(){if(pool)await pool.end();}
