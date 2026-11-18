import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req,res,next)=>{
  const requestId = randomUUID();
  res.setHeader('X-Request-Id', requestId);
  res.locals.requestId = requestId;
  next();
});
app.use(helmet({
  contentSecurityPolicy: config.isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin(origin,callback) {
    if (!origin || config.corsOrigins.includes(origin)) return callback(null,true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
}));
app.use(express.json({limit:'1mb',strict:true}));
app.use(express.urlencoded({extended:false,limit:'1mb'}));
app.use(rateLimit({
  windowMs: 60_000,
  limit: config.isProduction ? 120 : 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
}));

app.get('/health',(_req,res)=>res.status(200).json({
  status:'ok',
  service:'esekone-platform',
  timestamp:new Date().toISOString(),
}));

app.use((_req,res)=>res.status(404).json({error:'Not found',requestId:res.locals.requestId}));
app.use((error:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  if (!res.headersSent) res.status(400).json({
    error: config.isProduction ? 'Request could not be processed' : message,
    requestId:res.locals.requestId,
  });
});

app.listen(config.PORT,()=> {
  process.stdout.write('ESEKONE platform listening on port '+config.PORT+'\n');
});
