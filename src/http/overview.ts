import {and,desc,eq,gte,lt,ne,sql} from "drizzle-orm";
import {Router} from "express";
import {contacts,projects,workItems} from "../db/schema.js";
import {withAuthorizedWorkspace} from "./workspace-context.js";

export const overviewRouter=Router();

overviewRouter.get("/:workspaceId/overview",async(req,res)=>{
 return withAuthorizedWorkspace(req,res,async tx=>{
  const workspaceId=req.params.workspaceId;
  const today=new Date();
  today.setUTCHours(0,0,0,0);
  const tomorrow=new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
  const [contactsTotal]=await tx.select({value:sql<number>`count(*)::int`}).from(contacts).where(eq(contacts.workspaceId,workspaceId));
  const [customersTotal]=await tx.select({value:sql<number>`count(*)::int`}).from(contacts).where(and(eq(contacts.workspaceId,workspaceId),eq(contacts.status,"customer")));
  const [projectsTotal]=await tx.select({value:sql<number>`count(*)::int`}).from(projects).where(eq(projects.workspaceId,workspaceId));
  const [activeProjects]=await tx.select({value:sql<number>`count(*)::int`}).from(projects).where(and(eq(projects.workspaceId,workspaceId),eq(projects.status,"active")));
  const [openTasks]=await tx.select({value:sql<number>`count(*)::int`}).from(workItems).where(and(eq(workItems.workspaceId,workspaceId),ne(workItems.status,"done")));
  const [tasksDueToday]=await tx.select({value:sql<number>`count(*)::int`}).from(workItems).where(and(
   eq(workItems.workspaceId,workspaceId),ne(workItems.status,"done"),
   gte(workItems.dueAt,today),lt(workItems.dueAt,tomorrow)
  ));
  const recentTasks=await tx.select({id:workItems.id,title:workItems.title,status:workItems.status,priority:workItems.priority,dueAt:workItems.dueAt,updatedAt:workItems.updatedAt})
   .from(workItems).where(eq(workItems.workspaceId,workspaceId)).orderBy(desc(workItems.updatedAt)).limit(5);
  const recentContacts=await tx.select({id:contacts.id,fullName:contacts.fullName,status:contacts.status,company:contacts.company,createdAt:contacts.createdAt})
   .from(contacts).where(eq(contacts.workspaceId,workspaceId)).orderBy(desc(contacts.createdAt)).limit(5);
  return {
   generatedAt:new Date().toISOString(),
   metrics:{contactsTotal:contactsTotal.value,customersTotal:customersTotal.value,projectsTotal:projectsTotal.value,activeProjects:activeProjects.value,openTasks:openTasks.value,tasksDueToday:tasksDueToday.value},
   recentTasks,recentContacts
  };
 });
});
