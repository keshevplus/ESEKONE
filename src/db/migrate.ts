import "dotenv/config";
import {readFile} from "node:fs/promises";
import pg from "pg";
import {config} from "../config.js";
if(!config.DATABASE_URL)throw new Error("DATABASE_URL is required for the runtime role");
if(!config.DATABASE_MIGRATION_URL)throw new Error("DATABASE_MIGRATION_URL is required for schema migrations");
if(!config.DATABASE_APP_ROLE)throw new Error("DATABASE_APP_ROLE must name the separate runtime database role");
const pool=new pg.Pool({connectionString:config.DATABASE_MIGRATION_URL,ssl:config.isProduction?{rejectUnauthorized:true}:undefined});
const appPool=new pg.Pool({connectionString:config.DATABASE_URL,ssl:config.isProduction?{rejectUnauthorized:true}:undefined});
const migrations=["0000_initial_schema.sql","0001_tenant_security.sql","0002_contacts.sql","0003_work_items.sql","0004_workspace_bootstrap.sql","0005_agent_worker_access.sql","0006_projects.sql","0007_force_row_level_security.sql"];
const client=await pool.connect();
try{
 await client.query("SELECT pg_advisory_lock(hashtext('esekone_migrations'))");
 const migrationIdentity=await client.query("SELECT current_user");
 const runtimeIdentity=await appPool.query("SELECT current_user");
 if(migrationIdentity.rows[0].current_user===config.DATABASE_APP_ROLE)throw new Error("Migration and runtime roles must be different");
 if(runtimeIdentity.rows[0].current_user!==config.DATABASE_APP_ROLE)throw new Error("DATABASE_URL must connect as DATABASE_APP_ROLE");
 const role=await client.query("SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=$1",[config.DATABASE_APP_ROLE]);
 if(!role.rows[0]||role.rows[0].rolsuper||role.rows[0].rolbypassrls)throw new Error("Runtime database role must exist and must not be superuser or BYPASSRLS");
 const ownerCheck=await client.query("SELECT count(*)::int AS count FROM pg_class c JOIN pg_roles r ON r.oid=c.relowner WHERE r.rolname=$1 AND c.relkind IN ('r','p')",[config.DATABASE_APP_ROLE]);
 if(ownerCheck.rows[0].count>0)throw new Error("Runtime database role must not own application tables");
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
 const quotedRole='"'+config.DATABASE_APP_ROLE.replace(/"/g,'""')+'"';
 await client.query("GRANT USAGE ON SCHEMA public TO "+quotedRole);
 await client.query("GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO "+quotedRole);
 await client.query("GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO "+quotedRole);
 await client.query("REVOKE ALL ON TABLE esekone_migrations FROM "+quotedRole);
 await client.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO "+quotedRole);
 await client.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE,SELECT ON SEQUENCES TO "+quotedRole);
}finally{
 try{await client.query("SELECT pg_advisory_unlock(hashtext('esekone_migrations'))");}
 finally{client.release();await pool.end();await appPool.end();}
}
