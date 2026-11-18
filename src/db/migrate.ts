import "dotenv/config";
import {readFile} from "node:fs/promises";
import pg from "pg";
import {config} from "../config.js";
if(!config.DATABASE_URL)throw new Error("DATABASE_URL is required to run migrations");
const pool=new pg.Pool({connectionString:config.DATABASE_URL,ssl:config.isProduction?{rejectUnauthorized:true}:undefined});
const migrations=["0000_initial_schema.sql","0001_tenant_security.sql","0002_contacts.sql","0003_work_items.sql","0004_workspace_bootstrap.sql","0005_agent_worker_access.sql"];
const client=await pool.connect();
try{
 await client.query("SELECT pg_advisory_lock(hashtext('esekone_migrations'))");
 await client.query("CREATE TABLE IF NOT EXISTS esekone_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
 for(const name of migrations){
  const {rowCount}=await client.query("SELECT 1 FROM esekone_migrations WHERE name=$1",[name]);
  if(rowCount)continue;
  const sql=await readFile(new URL("../../migrations/"+name,import.meta.url),"utf8");
  try{
   await client.query("BEGIN");
   await client.query(sql);
   await client.query("INSERT INTO esekone_migrations(name) VALUES($1)",[name]);
   await client.query("COMMIT");
   process.stdout.write("Applied "+name+"\n");
  }catch(error){await client.query("ROLLBACK");throw error;}
 }
}finally{
 try{await client.query("SELECT pg_advisory_unlock(hashtext('esekone_migrations'))");}
 finally{client.release();await pool.end();}
}
