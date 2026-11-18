import {drizzle} from "drizzle-orm/node-postgres";
import pg from "pg";
import {config} from "../config.js";
import * as schema from "./schema.js";
if(!config.DATABASE_URL) throw new Error("DATABASE_URL is required for database operations");
const pool=new pg.Pool({connectionString:config.DATABASE_URL,max:10,idleTimeoutMillis:30000,connectionTimeoutMillis:5000,ssl:config.isProduction?{rejectUnauthorized:true}:undefined});
pool.on("error",error=>console.error("Unexpected database pool error",error.message));
export const db=drizzle(pool,{schema});
export async function checkDatabase(){await pool.query("select 1");}
export async function closeDatabase(){await pool.end();}