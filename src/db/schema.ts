import {boolean,foreignKey,index,integer,pgTable,text,timestamp,uniqueIndex,uuid} from "drizzle-orm/pg-core";
const createdAt=()=>timestamp("created_at",{withTimezone:true}).notNull().defaultNow();
const updatedAt=()=>timestamp("updated_at",{withTimezone:true}).notNull().defaultNow();
export const users=pgTable("users",{
 id:uuid("id").defaultRandom().primaryKey(),
 identitySubject:text("identity_subject").notNull().unique(),
 email:text("email").notNull(),
 displayName:text("display_name"),
 active:boolean("active").notNull().default(true),
 createdAt:createdAt(),updatedAt:updatedAt()
},t=>[uniqueIndex("users_email_unique").on(t.email)]);
export const organizations=pgTable("organizations",{
 id:uuid("id").defaultRandom().primaryKey(),
 name:text("name").notNull(),slug:text("slug").notNull().unique(),
 status:text("status").notNull().default("active"),
 createdAt:createdAt(),updatedAt:updatedAt()
});
export const workspaces=pgTable("workspaces",{
 id:uuid("id").defaultRandom().primaryKey(),
 organizationId:uuid("organization_id").notNull().references(()=>organizations.id,{onDelete:"cascade"}),
 name:text("name").notNull(),slug:text("slug").notNull(),
 createdAt:createdAt(),updatedAt:updatedAt()
},t=>[uniqueIndex("workspaces_org_slug_unique").on(t.organizationId,t.slug),index("workspaces_org_idx").on(t.organizationId)]);
export const memberships=pgTable("memberships",{
 id:uuid("id").defaultRandom().primaryKey(),
 workspaceId:uuid("workspace_id").notNull().references(()=>workspaces.id,{onDelete:"cascade"}),
 userId:uuid("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
 role:text("role").notNull().default("member"),status:text("status").notNull().default("active"),createdAt:createdAt()
},t=>[uniqueIndex("memberships_workspace_user_unique").on(t.workspaceId,t.userId),index("memberships_user_idx").on(t.userId,t.status)]);
export const auditEvents=pgTable("audit_events",{
 id:uuid("id").defaultRandom().primaryKey(),
 workspaceId:uuid("workspace_id").references(()=>workspaces.id,{onDelete:"set null"}),
 actorUserId:uuid("actor_user_id").references(()=>users.id,{onDelete:"set null"}),
 action:text("action").notNull(),resourceType:text("resource_type").notNull(),resourceId:text("resource_id"),
 metadata:text("metadata"),createdAt:createdAt()
},t=>[index("audit_workspace_created_idx").on(t.workspaceId,t.createdAt),index("audit_actor_created_idx").on(t.actorUserId,t.createdAt)]);
export const contacts=pgTable("contacts",{
 id:uuid("id").defaultRandom().primaryKey(),
 workspaceId:uuid("workspace_id").notNull().references(()=>workspaces.id,{onDelete:"cascade"}),
 fullName:text("full_name").notNull(),
 email:text("email"),
 phone:text("phone"),
 company:text("company"),
 status:text("status").notNull().default("lead"),
 createdAt:createdAt(),updatedAt:updatedAt()
},t=>[
 index("contacts_workspace_created_idx").on(t.workspaceId,t.createdAt),
 index("contacts_workspace_email_idx").on(t.workspaceId,t.email)
]);

export const projects=pgTable("projects",{
 id:uuid("id").defaultRandom().primaryKey(),
 workspaceId:uuid("workspace_id").notNull().references(()=>workspaces.id,{onDelete:"cascade"}),
 name:text("name").notNull(),description:text("description"),
 status:text("status").notNull().default("planned"),
 ownerUserId:uuid("owner_user_id").references(()=>users.id,{onDelete:"set null"}),
 startAt:timestamp("start_at",{withTimezone:true}),dueAt:timestamp("due_at",{withTimezone:true}),
 createdByUserId:uuid("created_by_user_id").references(()=>users.id,{onDelete:"set null"}),
 createdAt:createdAt(),updatedAt:updatedAt()
},t=>[
 uniqueIndex("projects_id_workspace_unique").on(t.id,t.workspaceId),
 index("projects_workspace_status_idx").on(t.workspaceId,t.status,t.updatedAt)
]);
export const workItems=pgTable("work_items",{
 id:uuid("id").defaultRandom().primaryKey(),
 workspaceId:uuid("workspace_id").notNull().references(()=>workspaces.id,{onDelete:"cascade"}),
 projectId:uuid("project_id"),
 title:text("title").notNull(),description:text("description"),
 status:text("status").notNull().default("backlog"),priority:text("priority").notNull().default("normal"),
 dueAt:timestamp("due_at",{withTimezone:true}),
 assignedUserId:uuid("assigned_user_id").references(()=>users.id,{onDelete:"set null"}),
 assignedAgent:text("assigned_agent"),acceptanceCriteria:text("acceptance_criteria"),
 latestEvidence:text("latest_evidence"),nextAction:text("next_action"),
 createdByUserId:uuid("created_by_user_id").references(()=>users.id,{onDelete:"set null"}),
 createdAt:createdAt(),updatedAt:updatedAt()
},t=>[
 index("work_items_workspace_status_idx").on(t.workspaceId,t.status,t.updatedAt),
 index("work_items_workspace_assignee_idx").on(t.workspaceId,t.assignedUserId,t.status),
 foreignKey({name:"work_items_project_workspace_fk",columns:[t.projectId,t.workspaceId],foreignColumns:[projects.id,projects.workspaceId]}).onDelete("restrict")
]);
export const workItemEvents=pgTable("work_item_events",{
 id:uuid("id").defaultRandom().primaryKey(),
 workspaceId:uuid("workspace_id").notNull().references(()=>workspaces.id,{onDelete:"cascade"}),
 workItemId:uuid("work_item_id").notNull().references(()=>workItems.id,{onDelete:"cascade"}),
 actorUserId:uuid("actor_user_id").references(()=>users.id,{onDelete:"set null"}),
 eventType:text("event_type").notNull(),fromStatus:text("from_status"),toStatus:text("to_status"),
 detail:text("detail"),createdAt:createdAt()
},t=>[index("work_item_events_item_created_idx").on(t.workItemId,t.createdAt)]);
export const agentRequests=pgTable("agent_requests",{
 id:uuid("id").defaultRandom().primaryKey(),
 workspaceId:uuid("workspace_id").notNull().references(()=>workspaces.id,{onDelete:"cascade"}),
 workItemId:uuid("work_item_id").notNull().references(()=>workItems.id,{onDelete:"cascade"}),
 requestedByUserId:uuid("requested_by_user_id").references(()=>users.id,{onDelete:"set null"}),
 agentKey:text("agent_key").notNull().default("admin"),prompt:text("prompt").notNull(),
 status:text("status").notNull().default("queued"),resultSummary:text("result_summary"),
 attemptCount:integer("attempt_count").notNull().default(0),maxAttempts:integer("max_attempts").notNull().default(3),
 createdAt:createdAt(),startedAt:timestamp("started_at",{withTimezone:true}),completedAt:timestamp("completed_at",{withTimezone:true})
},t=>[index("agent_requests_queue_idx").on(t.status,t.createdAt),index("agent_requests_workspace_idx").on(t.workspaceId,t.createdAt)]);
