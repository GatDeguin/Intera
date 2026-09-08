import {randomBytes,randomUUID,createHash,createHmac,scrypt as scryptCallback,timingSafeEqual,createCipheriv,createDecipheriv} from 'node:crypto';
import {promisify} from 'node:util';
import {ensure} from './domain/errors.mjs';
const scrypt=promisify(scryptCallback);
export const id=()=>randomUUID();
export const randomToken=()=>randomBytes(32).toString('base64url');
export const hash=s=>createHash('sha256').update(String(s)).digest('hex');
export const privateHash=(s,key)=>createHmac('sha256',Buffer.from(key,'base64')).update(String(s)).digest('hex');
export function equals(a,b) { if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y); }
export async function passwordHash(password) {
  ensure(typeof password==='string'&&password.length>=12&&password.length<=128,422,'PASSWORD','Usá una contraseña de entre 12 y 128 caracteres.');
  const salt=randomBytes(16).toString('hex');const key=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
  return `scrypt$32768$${salt}$${key.toString('hex')}`;
}
export async function verifyPassword(password,encoded) {
  if(typeof password!=='string'||password.length>128)return false;
  const [kind,n,salt,expected]=String(encoded||'').split('$');
  if(kind!=='scrypt'||n!=='32768'||!salt||!expected)return false;
  const key=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});return equals(key.toString('hex'),expected);
}
export function seal(value,key,aad) {
  const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',Buffer.from(key,'base64'),iv);cipher.setAAD(Buffer.from(aad));
  const data=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
  return ['v1',iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),data.toString('base64url')].join('.');
}
export function unseal(value,key,aad) {
  const [v,iv,tag,data]=String(value).split('.');ensure(v==='v1'&&iv&&tag&&data,500,'ENCRYPTION','No se pudieron leer las credenciales.');
  const decipher=createDecipheriv('aes-256-gcm',Buffer.from(key,'base64'),Buffer.from(iv,'base64url'));decipher.setAAD(Buffer.from(aad));decipher.setAuthTag(Buffer.from(tag,'base64url'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]).toString('utf8'));
}
export function pkce() {const verifier=randomToken()+randomToken();return {verifier,challenge:createHash('sha256').update(verifier).digest('base64url')};}
