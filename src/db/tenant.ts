import {sql} from "drizzle-orm";
import {db} from "./client.js";
/** Establish transaction-local tenant context only after membership authorization. */
export async function withWorkspaceContext<T>(workspaceId:string,userId:string,run:(tx:any)=>Promise<T>):Promise<T>{
 if(!db)throw new Error("DATABASE_URL is not configured");
 return db.transaction(async tx=>{
  await tx.execute(sql`select set_config('app.workspace_id', ${workspaceId}, true)`);
  await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`);
  return run(tx);
 });
}
