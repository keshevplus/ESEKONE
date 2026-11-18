import {boolean,index,pgTable,text,timestamp,uniqueIndex,uuid} from "drizzle-orm/pg-core";
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
