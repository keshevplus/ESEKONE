import {sql} from "drizzle-orm";
import {db} from "./client.js";
/**
 * Establishes transaction-local tenant context for PostgreSQL RLS policies.
 * Always call this only after membership has been verified by the API layer.
 */
export async function withWorkspaceContext<T>(workspaceId:string,userId:string,run:(tx:typeof db)=>Promise<T>):Promise<T>{
 return db.transaction(async tx=>{
  await tx.execute(sql`select set_config('app.workspace_id', ${workspaceId}, true)`);
  await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`);
  return run(tx as unknown as typeof db);
 });
}