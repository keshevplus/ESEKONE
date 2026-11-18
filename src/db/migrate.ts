import "dotenv/config";
import {readFile} from "node:fs/promises";
import pg from "pg";
import {config} from "../config.js";
if(!config.DATABASE_URL)throw new Error("DATABASE_URL is required to run migrations");
const pool=new pg.Pool({connectionString:config.DATABASE_URL,ssl:config.isProduction?{rejectUnauthorized:true}:undefined});
const migrations=["0000_initial_schema.sql","0001_tenant_security.sql"];
try{
 for(const name of migrations){
  const sql=await readFile(new URL("../../migrations/"+name,import.meta.url),"utf8");
  const client=await pool.connect();
  try{await client.query("BEGIN");await client.query(sql);await client.query("COMMIT");process.stdout.write("Applied "+name+"\\n");}
  catch(error){await client.query("ROLLBACK");throw error;}
  finally{client.release();}
 }
}finally{await pool.end();}
