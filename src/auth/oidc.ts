import {createRemoteJWKSet,jwtVerify,type JWTPayload} from "jose";
import {config} from "../config.js";
export type AuthenticatedIdentity={subject:string;email:string;name?:string};
const configured=Boolean(process.env.OIDC_ISSUER&&process.env.OIDC_AUDIENCE&&process.env.OIDC_JWKS_URL);
const issuer=process.env.OIDC_ISSUER;
const audience=process.env.OIDC_AUDIENCE;
const jwksUrl=process.env.OIDC_JWKS_URL;
const jwks=configured?createRemoteJWKSet(new URL(jwksUrl!)):null;
export async function authenticateAuthorizationHeader(header?:string):Promise<AuthenticatedIdentity|null>{
 if(!jwks||!issuer||!audience||!header?.startsWith("Bearer "))return null;
 const token=header.slice(7).trim();
 if(!token)return null;
 const {payload}=await jwtVerify(token,jwks,{issuer,audience});
 const claims=payload as JWTPayload&{email?:string;name?:string};
 if(typeof claims.sub!=="string"||typeof claims.email!=="string"||claims.email_verified!==true)return null;
 return {subject:claims.sub,email:claims.email,name:claims.name};
}
export const oidcConfigured=configured;