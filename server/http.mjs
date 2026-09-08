import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {AppError,ensure,safeId} from './domain/errors.mjs';
import {privateHash,equals} from './security.mjs';
import {verifyWebhook} from './providers/mercadopago.mjs';
const parseId=value=>{ensure(safeId(value),400,'ID','Identificador inválido.');return value;};
const PUBLIC=fileURLToPath(new URL('../public/',import.meta.url));
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'};
function cookie(req){const raw=req.headers.cookie||'';return raw.split(';').map(p=>p.trim()).find(p=>p.startsWith('intera_session='))?.slice(15)||'';}
function validJSON(value,depth=0){ensure(depth<15,400,'JSON_DEPTH','El documento es demasiado profundo.');if(value&&typeof value==='object')for(const [k,v] of Object.entries(value)){ensure(!['__proto__','prototype','constructor'].includes(k),400,'JSON_KEY','Propiedad no admitida.');validJSON(v,depth+1);}return value;}
async function body(req){ensure((req.headers['content-type']||'').split(';')[0]==='application/json',415,'JSON_REQUIRED','Enviá JSON.');let n=0;const chunks=[];for await(const chunk of req){n+=chunk.length;ensure(n<=65536,413,'TOO_LARGE','Solicitud demasiado grande.');chunks.push(chunk);}try{const value=JSON.parse(Buffer.concat(chunks).toString()||'{}');ensure(value&&typeof value==='object'&&!Array.isArray(value),400,'JSON','Objeto JSON requerido.');return validJSON(value);}catch(e){if(e instanceof AppError)throw e;throw new AppError(400,'JSON','JSON inválido.');}}
function headers(res,c){res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=()');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");if(c.secureCookie)res.setHeader('Strict-Transport-Security','max-age=31536000');}
export function createHttpServer(ctx){const {store:s,config:c,auth,legal,market,payments,worker}=ctx;
 function send(res,data,status=200){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));}
 function sessionCookie(res,token,maxAge=43200){res.setHeader('Set-Cookie',`intera_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${c.secureCookie?'; Secure':''}`);}
 function rate(key,max=120,window=60000){return s.tx(()=>{const old=s.one('SELECT * FROM rate_limits WHERE key=?',key),now=s.now();if(!old||old.expires_at<=now){s.run('INSERT INTO rate_limits VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=1,expires_at=excluded.expires_at',key,1,now+window);return;}ensure(old.count<max,429,'RATE_LIMIT','Demasiados intentos. Esperá un minuto.');s.run('UPDATE rate_limits SET count=count+1 WHERE key=?',key);});}
 return http.createServer(async(req,res)=>{headers(res,c);try{
  const expectedHost=new URL(c.baseUrl).host;ensure(req.headers.host===expectedHost,400,'HOST','Host no permitido.');
  const url=new URL(req.url,c.baseUrl),path=url.pathname,method=req.method;const token=cookie(req),session=auth.session(token),uid=session?.user_id;
  const ipHash=privateHash(req.socket.remoteAddress||'unknown',c.encryptionKey),agentHash=privateHash((req.headers['user-agent']||'').slice(0,500),c.encryptionKey);const context={ipHash,agentHash};
  const requireUser=()=>{ensure(session,401,'LOGIN','Iniciá sesión para continuar.');return uid;};
  const demo=()=>ensure(c.mode==='mock',404,'NOT_FOUND','Recurso no encontrado.');
  if(path==='/api/mp/webhook'&&method==='POST'){
   const input=await body(req);const verified=verifyWebhook(req.headers,url,input,c,s.now());let seller=url.searchParams.get('seller');
   if(!seller&&input.user_id)seller=s.one('SELECT user_id FROM seller_accounts WHERE mp_user_id=?',String(input.user_id))?.user_id;
   ensure(seller&&s.one('SELECT user_id FROM seller_accounts WHERE user_id=? AND mode=?',seller,c.mode),400,'WEBHOOK_SELLER','No hay una cuenta vinculada para esta notificación.');
   // The seller query is not HMAC-signed: bind it in deduplication; GET validates ownership.
   s.enqueue('reconcile_payment',{paymentId:verified.paymentId,sellerId:seller},verified.eventKey+':'+seller);send(res,{received:true});return;
  }
  if(path.startsWith('/api/'))rate('api:'+ipHash,600);
  const write=['POST','PUT','PATCH','DELETE'].includes(method);
  if(write){ensure(req.headers.origin===c.baseUrl,403,'ORIGIN','Origen no permitido.');rate('write:'+ipHash,120);}
  const openWrites=['/api/auth/register','/api/auth/login','/api/auth/verify','/api/auth/forgot','/api/auth/reset','/api/demo/login'];
  if(write&&path.startsWith('/api/')&&!openWrites.includes(path)){requireUser();ensure(equals(req.headers['x-csrf-token']||'',session.csrf),403,'CSRF','La sesión cambió. Recargá la página e intentá otra vez.');}
  if(path==='/api/config'&&method==='GET'){send(res,{version:c.version||'5.0.0',mode:c.mode,blockMinutes:15,priceTiers:[1000,2500,5000],commissionBps:500,terms:{version:legal.document.version,hash:legal.document.hash},supportEmail:c.supportEmail||null,inPersonEnabled:false,mpConfigured:c.mode==='mock'||!!(c.mpClientId&&c.mpClientSecret&&c.mpWebhookSecret)});return;}
  if(path==='/api/health'&&method==='GET'){send(res,{ok:true,version:c.version||'5.0.0',mode:c.mode});return;}
  if(path==='/api/legal'&&method==='GET'){send(res,legal.document);return;}
  if(path==='/api/session'&&method==='GET'){send(res,{user:session?{...market.safeUser(session.user),email:session.user.email,emailVerified:!!session.user.email_verified,suspended:!!session.user.suspended}:null,csrf:session?.csrf||null,conditionsAccepted:uid?legal.accepted(uid):false});return;}
  if(path==='/api/bootstrap'&&method==='GET'){send(res,market.bootstrap(uid));return;}
  if(path==='/api/auth/register'&&method==='POST'){rate('auth:'+ipHash,10);const input=await body(req);const user=await auth.register(input,context),ses=auth.createSession(user.id),link=auth.sendAction(user,'VERIFY');sessionCookie(res,ses.token);send(res,{ok:true,verificationLink:link,notice:link?'Correo simulado: abrí el enlace para verificar.':'Te enviamos un enlace de verificación.'},201);return;}
  if(path==='/api/auth/login'&&method==='POST'){rate('auth:'+ipHash,10);const input=await body(req),ses=await auth.login(input.email,input.password);sessionCookie(res,ses.token);send(res,{ok:true});return;}
  if(path==='/api/auth/logout'&&method==='POST'){auth.logout(token);sessionCookie(res,'',0);send(res,{ok:true});return;}
  if(path==='/api/auth/verify'&&method==='POST'){rate('token:'+ipHash,20);auth.useToken((await body(req)).token,'VERIFY');send(res,{ok:true});return;}
  if(path==='/api/auth/resend'&&method==='POST'){rate('email:'+uid,3,3600000);send(res,{verificationLink:auth.sendAction(session.user,'VERIFY'),ok:true});return;}
  if(path==='/api/auth/forgot'&&method==='POST'){rate('auth:'+ipHash,10);const input=await body(req),u=typeof input.email==='string'?s.one('SELECT * FROM users WHERE email=?',input.email.toLowerCase().trim()):null;const link=u?auth.sendAction(u,'RESET'):null;send(res,{ok:true,notice:'Si el correo existe, recibirás instrucciones.',...(c.mode==='mock'?{recoveryLink:link}:{})});return;}
  if(path==='/api/auth/reset'&&method==='POST'){rate('auth:'+ipHash,10);const input=await body(req);await auth.resetPassword(input.token,input.password);sessionCookie(res,'',0);send(res,{ok:true});return;}
  if(path==='/api/terms/accept'&&method==='POST'){send(res,legal.accept(uid,await body(req),context));return;}
  if(path==='/api/demo/login'&&method==='POST'){demo();rate('demo:'+ipHash,40);const input=await body(req),u=s.one('SELECT id FROM users WHERE id=? AND is_demo=1',String(input.userId||''));ensure(u,404,'DEMO_USER','Perfil de demostración inexistente.');if(token)auth.logout(token);const ses=auth.createSession(u.id);sessionCookie(res,ses.token);s.audit(u.id,'MOCK_SESSION',u.id);send(res,{ok:true,simulated:true});return;}
  if(path.startsWith('/api/demo/pay/')&&method==='POST'){demo();const bid=decodeURIComponent(path.slice(14));const b=market.getBooking(uid,bid);ensure(b.buyer_id===uid,403,'ROLE','Solo el solicitante puede simular su pago.');market.operate(uid);const a=s.one('SELECT * FROM attempts WHERE booking_id=?',bid);ensure(a&&a.status==='READY',409,'CHECKOUT','Creá primero el checkout.');const input=await body(req);ensure(['approved','pending','rejected'].includes(input.status),422,'STATUS','Estado de simulación inválido.');ensure(b.status==='ACCEPTED'&&!b.primary_payment_id,409,'PAID','La orden ya no admite un pago simulado.');const p=ctx.gateway.simulate(a,input.status);await payments.reconcilePayment(p.id,b.seller_id);send(res,{ok:true,paymentId:p.id,simulated:true});return;}
  if(path==='/api/mp/connect'&&method==='POST'){send(res,c.mode==='mock'?payments.mockConnect(uid):payments.beginOAuth(uid,session.token_hash));return;}
  if(path==='/api/mp/pause'&&method==='POST'){send(res,payments.pauseConnection(uid));return;}
  if(path==='/api/mp/oauth/callback'&&method==='GET'){requireUser();await payments.finishOAuth(uid,session.token_hash,url.searchParams.get('state'),url.searchParams.get('code'));res.writeHead(303,{Location:c.baseUrl+'/#/prestador?connected=1'});res.end();return;}
  if(path==='/pago/retorno'&&method==='GET'){const bid=parseId(url.searchParams.get('booking'));res.writeHead(303,{Location:c.baseUrl+'/#/orden/'+encodeURIComponent(bid)});res.end();return;}
  if(path==='/api/offers'&&method==='POST'){send(res,market.publish(uid,await body(req)),201);return;}
  let match;
  if((match=path.match(/^\/api\/offers\/([^/]+)$/))&&method==='PATCH'){send(res,market.updateOffer(uid,parseId(match[1]),await body(req)));return;}
  if(path==='/api/needs'&&method==='POST'){send(res,market.publishNeed(uid,await body(req)),201);return;}
  if((match=path.match(/^\/api\/needs\/([^/]+)\/close$/))&&method==='POST'){send(res,market.closeNeed(uid,parseId(match[1])));return;}
  if(path==='/api/bookings'&&method==='POST'){rate('booking:'+uid,20,86400000);const key=req.headers['idempotency-key'];ensure(typeof key==='string'&&key.length>=8&&key.length<=150,400,'IDEMPOTENCY','Falta la clave idempotente.');send(res,market.book(uid,await body(req),key),201);return;}
  if((match=path.match(/^\/api\/bookings\/([^/]+)(?:\/([^/]+))?$/))){requireUser();const bid=parseId(match[1]),action=match[2];if(!action&&method==='GET'){send(res,market.details(uid,bid));return;}if(method==='POST'){const input=await body(req);let result;
   switch(action){case 'accept':result=market.accept(uid,bid);break;
    case 'start':case 'complete':case 'confirm':result=market.transition(uid,bid,action);break;
    case 'cancel':result=market.cancel(uid,bid,input.reason);break;
    case 'extension':result=market.proposeExtension(uid,bid,input.blocks);break;
    case 'checkout':result=await payments.checkout(uid,bid,input);break;
    case 'reconcile':{market.getBooking(uid,bid);rate('reconcile:'+uid,10);s.enqueue('reconcile_booking',{bookingId:bid},`user-poll:${bid}:${Math.floor(s.now()/10000)}`);result={queued:true};break;}
    case 'messages':result=market.message(uid,bid,input.body);break;
    case 'reviews':result=market.review(uid,bid,input);break;
    default:throw new AppError(404,'NOT_FOUND','Acción no encontrada.');}
   send(res,result);return;
  }}
  if(path==='/api/reports'&&method==='POST'){send(res,market.report(uid,await body(req)),201);return;}
  if(path==='/api/profile'&&method==='PATCH'){send(res,market.profile(uid,await body(req)));return;}
  if((match=path.match(/^\/api\/favorites\/([^/]+)$/))&&method==='POST'){send(res,market.toggleFavorite(uid,parseId(match[1])));return;}
  if((match=path.match(/^\/api\/blocks\/([^/]+)$/))&&method==='POST'){send(res,market.toggleBlock(uid,parseId(match[1])));return;}
  if(path==='/api/finances'&&method==='GET'){requireUser();send(res,market.finances(uid));return;}
  if(path==='/api/export'&&method==='GET'){requireUser();send(res,market.exportUser(uid));return;}
  if(path.startsWith('/api/'))throw new AppError(404,'NOT_FOUND','Recurso no encontrado.');
  ensure(['GET','HEAD'].includes(method),405,'METHOD','Método no permitido.');
  let rel;try{rel=decodeURIComponent(path);}catch{throw new AppError(404,'NOT_FOUND','Recurso no encontrado.');}if(rel==='/')rel='/index.html';
  ensure(!rel.includes('\0')&&!rel.split(/[\\/]/).some(p=>p.startsWith('.')),404,'NOT_FOUND','Recurso no encontrado.');const filename=resolve(PUBLIC,'.'+rel);ensure(filename.startsWith(PUBLIC+sep)||filename.startsWith(PUBLIC)&&PUBLIC.endsWith(sep),404,'NOT_FOUND','Recurso no encontrado.');ensure(MIME[extname(filename)],404,'NOT_FOUND','Recurso no encontrado.');
  let data;try{const info=await stat(filename);ensure(info.isFile(),404,'NOT_FOUND','Recurso no encontrado.');data=await readFile(filename);}catch{throw new AppError(404,'NOT_FOUND','Recurso no encontrado.');}res.setHeader('Cache-Control',path.startsWith('/assets/')?'public, max-age=86400':'no-cache');res.writeHead(200,{'Content-Type':MIME[extname(filename)],'Content-Length':data.length});res.end(method==='HEAD'?undefined:data);
 }catch(e){if(res.headersSent){res.end();return;}const known=e instanceof AppError;if(!known)console.error('Request error:',e.code||e.name||'INTERNAL');send(res,{error:known?e.message:'No se pudo completar la operación. Reintentá o contactá soporte.',code:known?e.code:'INTERNAL'},known?e.status:500);}});
}
