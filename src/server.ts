import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { eq,and } from 'drizzle-orm';
import { config } from './config.js';
import { authenticateAuthorizationHeader,oidcConfigured } from './auth/oidc.js';
import { db,checkDatabase } from './db/client.js';
import { users,memberships,workspaces } from './db/schema.js';
import { withUserContext, WorkspaceAccessDeniedError } from './db/tenant.js';

const app=express();
app.disable('x-powered-by');
app.set('trust proxy',1);
app.use((req,res,next)=>{const requestId=randomUUID();res.setHeader('X-Request-Id',requestId);res.locals.requestId=requestId;next();});
app.use(helmet({contentSecurityPolicy:config.isProduction?undefined:false,crossOriginEmbedderPolicy:false}));
app.use(cors({origin(origin,callback){if(!origin||config.corsOrigins.includes(origin))return callback(null,true);return callback(new Error('Origin is not allowed by CORS'));},credentials:true,methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS']}));
app.use(express.json({limit:'1mb',strict:true}));
app.use(express.urlencoded({extended:false,limit:'1mb'}));
app.use(rateLimit({windowMs:60000,limit:config.isProduction?120:600,standardHeaders:'draft-7',legacyHeaders:false}));

app.get('/health/live',(_req,res)=>res.status(200).json({status:'ok',service:'esekone-platform',timestamp:new Date().toISOString()}));
app.get('/health/ready',async(_req,res)=>{try{await checkDatabase();return res.status(200).json({status:'ready',database:'connected'});}catch{return res.status(503).json({status:'not_ready',database:'unavailable'});}});

app.get('/v1/me',async(req,res)=>{
 if(!oidcConfigured)return res.status(503).json({error:'identity_provider_not_configured'});
 if(!db)return res.status(503).json({error:'database_not_configured'});
 let identity;
 try{identity=await authenticateAuthorizationHeader(req.headers.authorization);}catch{return res.status(401).json({error:'invalid_token'});}
 if(!identity)return res.status(401).json({error:'authentication_required'});
 const [user]=await db.select().from(users).where(and(eq(users.identitySubject,identity.subject),eq(users.active,true))).limit(1);
 if(!user)return res.status(403).json({error:'account_not_provisioned'});
 const membershipsForUser=await withUserContext(user.id,tx=>tx.select({workspaceId:workspaces.id,workspaceName:workspaces.name,workspaceSlug:workspaces.slug,organizationId:workspaces.organizationId,role:memberships.role})
  .from(memberships).innerJoin(workspaces,eq(memberships.workspaceId,workspaces.id))
  .where(and(eq(memberships.userId,user.id),eq(memberships.status,'active'))));
 return res.json({user:{id:user.id,email:user.email,displayName:user.displayName},workspaces:membershipsForUser});
});

app.use((_req,res)=>res.status(404).json({error:'Not found',requestId:res.locals.requestId}));
app.use((error:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
 const message=error instanceof Error?error.message:'Unexpected server error';
 const denied=error instanceof WorkspaceAccessDeniedError;
 if(!res.headersSent)res.status(denied?403:400).json({error:denied?error.code:(config.isProduction?'Request could not be processed':message),requestId:res.locals.requestId});
});
app.listen(config.PORT,()=>process.stdout.write('ESEKONE platform listening on port '+config.PORT+'\\n'));
