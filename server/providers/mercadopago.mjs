import {createHmac} from 'node:crypto';
import {equals} from '../security.mjs';
import {toCents} from '../domain/pricing.mjs';
import {AppError,ensure,safeId} from '../domain/errors.mjs';
const API='https://api.mercadopago.com';
export function safeCheckoutUrl(value) {
 let url;try{url=new URL(value);}catch{throw new AppError(502,'MP_CHECKOUT_URL','Mercado Pago devolvió un enlace no válido.');}
 ensure(url.protocol==='https:'&&!url.username&&!url.password&&['www.mercadopago.com.ar','mercadopago.com.ar','sandbox.mercadopago.com.ar'].includes(url.hostname)&&url.pathname.startsWith('/checkout'),502,'MP_CHECKOUT_URL','El enlace no pertenece al checkout permitido.');return url.href;
}
export function verifyWebhook(headers,url,body,config,now=Date.now()) {
 const signature=headers['x-signature'],requestId=headers['x-request-id'];const dataId=url.searchParams.get('data.id');
 ensure(typeof signature==='string'&&typeof requestId==='string'&&requestId.length<=200&&/^\d{1,30}$/.test(dataId||'')&&config.mpWebhookSecret,401,'WEBHOOK_SIGNATURE','Notificación no autenticada.');
 const parts=signature.split(',').map(p=>p.trim().split('='));const ts=parts.find(([k])=>k==='ts')?.[1];const hashes=parts.filter(([k])=>k==='v1').map(([,v])=>v);
 ensure(/^\d{10,16}$/.test(ts||''),401,'WEBHOOK_TIMESTAMP','Fecha de notificación inválida.');const ms=Number(ts)>1e12?Number(ts):Number(ts)*1000;
 ensure(Number.isFinite(ms)&&ms<=now+300000&&now-ms<=(config.webhookMaxAgeSeconds||86400)*1000,401,'WEBHOOK_EXPIRED','Notificación fuera de la ventana de verificación.');
 ensure(body?.data?.id===undefined||String(body.data.id)===dataId,400,'WEBHOOK_ID','Identificadores inconsistentes.');
 const expected=createHmac('sha256',config.mpWebhookSecret).update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`).digest('hex');
 ensure(hashes.some(v=>/^[0-9a-f]{64}$/.test(v||'')&&equals(v,expected)),401,'WEBHOOK_SIGNATURE','Firma inválida.');return {paymentId:dataId,eventKey:`mp:${dataId}:${requestId}:${ts}`};
}
export class MercadoPago {
 constructor(config,fetchImpl=fetch){this.c=config;this.fetch=fetchImpl;}
 async request(path,{method='GET',token,body,idem}={}) {
  const headers={'Content-Type':'application/json','Accept':'application/json'};if(token)headers.Authorization=`Bearer ${token}`;if(idem)headers['X-Idempotency-Key']=idem;
  let response;try{response=await this.fetch(API+path,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000),redirect:'error'});}catch{throw new AppError(502,'MP_UNCERTAIN','No se pudo confirmar la respuesta de Mercado Pago. La operación debe reconciliarse antes de repetirla.');}
  if(!response.ok)throw new AppError(502,`MP_HTTP_${response.status}`,'Mercado Pago no pudo procesar la solicitud. Revisá el estado de la operación o la vinculación.');
  let data;try{data=await response.json();}catch{throw new AppError(502,'MP_INVALID_RESPONSE','Respuesta inválida de Mercado Pago.');}return data;
 }
 authorizationUrl(state,challenge){const u=new URL('https://auth.mercadopago.com/authorization');u.search=new URLSearchParams({client_id:this.c.mpClientId,response_type:'code',platform_id:'mp',redirect_uri:this.c.baseUrl+'/api/mp/oauth/callback',state,code_challenge:challenge,code_challenge_method:'S256'});return u.href;}
 exchangeCode(code,verifier){return this.request('/oauth/token',{method:'POST',body:{client_id:this.c.mpClientId,client_secret:this.c.mpClientSecret,grant_type:'authorization_code',code,redirect_uri:this.c.baseUrl+'/api/mp/oauth/callback',code_verifier:verifier,test_token:this.c.mode!=='live'}});}
 refresh(refreshToken){return this.request('/oauth/token',{method:'POST',body:{client_id:this.c.mpClientId,client_secret:this.c.mpClientSecret,grant_type:'refresh_token',refresh_token:refreshToken,test_token:this.c.mode!=='live'}});}
 me(token){return this.request('/users/me',{token});}
 async createPreference(token,b,a,email){
  const payload={items:[{id:b.id,title:`${b.title.slice(0,100)} · bloque de 15 min`,currency_id:'ARS',quantity:b.blocks,unit_price:b.price_ars}],marketplace_fee:b.commission_cents/100,external_reference:a.external_ref,metadata:{intera_version:5,booking_id:b.id,attempt_id:a.id},payer:{email},notification_url:`${this.c.baseUrl}/api/mp/webhook?seller=${encodeURIComponent(b.seller_id)}&source_news=webhooks`,back_urls:Object.fromEntries(['success','pending','failure'].map(s=>[s,`${this.c.baseUrl}/pago/retorno?booking=${encodeURIComponent(b.id)}&result=${s}`])),auto_return:'approved',expires:true,expiration_date_from:new Date((a.created_at||Date.now())-60000).toISOString(),expiration_date_to:new Date(a.expires_at).toISOString(),payment_methods:{installments:1,default_installments:1,excluded_payment_types:[{id:'ticket'},{id:'atm'}]},statement_descriptor:'INTERA'};
  // Preferences API has no relied-upon idempotency guarantee. Call once; UNKNOWN must reconcile.
  const p=await this.request('/checkout/preferences',{method:'POST',token,body:payload});
  ensure(typeof p.id==='string'&&p.id.length<200,502,'MP_INVALID_PREFERENCE','Preferencia inválida.');
  const checkout=safeCheckoutUrl(this.c.mode==='sandbox'?p.sandbox_init_point:p.init_point);return {id:p.id,checkoutUrl:checkout};
 }
 getPreference(token,pid){ensure(safeId(pid),422,'ID','Identificador inválido.');return this.request('/checkout/preferences/'+encodeURIComponent(pid),{token});}
 async expirePreference(token,pid){ensure(safeId(pid),422,'ID','Identificador inválido.');return this.request('/checkout/preferences/'+encodeURIComponent(pid),{method:'PUT',token,body:{expires:true,expiration_date_to:new Date(Date.now()-60000).toISOString()}});}
 async attestCheckoutPayment(token,p,a,b){
  ensure(p.order?.type==='merchant_order'&&/^\d{1,30}$/.test(String(p.order.id)),409,'PAYMENT_ORDER','Falta la orden comercial de Checkout Pro; requiere conciliación.');
  const order=await this.request('/merchant_orders/'+encodeURIComponent(p.order.id),{token});
  ensure(order.external_reference===a.external_ref&&String(order.collector?.id)===a.mp_seller_id&&String(order.application_id)===this.c.mpClientId&&toCents(order.total_amount)===b.gross_cents&&Array.isArray(order.payments)&&order.payments.some(v=>String(v.id)===String(p.id)),409,'PAYMENT_ORDER','La orden comercial no corresponde al cobro de INTERA.');
  ensure(typeof order.preference_id==='string'&&(!a.preference_id||order.preference_id===a.preference_id),409,'PAYMENT_PREFERENCE','El pago proviene de otra preferencia de cobro.');
  const pref=await this.getPreference(token,order.preference_id);
  ensure(String(pref.id)===order.preference_id&&pref.external_reference===a.external_ref&&String(pref.collector_id)===a.mp_seller_id&&toCents(pref.marketplace_fee)===b.commission_cents&&Array.isArray(pref.items)&&pref.items.length>0&&pref.items.every(v=>v.currency_id==='ARS'&&Number.isSafeInteger(v.quantity)&&v.quantity>0)&&pref.items.reduce((n,v)=>n+toCents(v.unit_price)*v.quantity,0)===b.gross_cents,409,'PAYMENT_PREFERENCE','La preferencia no respeta el bruto, vendedor o comisión contratados.');
  return {id:pref.id,checkoutUrl:safeCheckoutUrl(this.c.mode==='sandbox'?pref.sandbox_init_point:pref.init_point)};
 }
 getPayment(token,pid){ensure(/^\d{1,30}$/.test(String(pid)),422,'ID','Identificador de pago inválido.');return this.request('/v1/payments/'+encodeURIComponent(pid),{token});}
 async searchPayments(token,reference){let result=[];for(let offset=0;offset<1000;offset+=100){const p=new URLSearchParams({external_reference:reference,sort:'date_created',criteria:'desc',limit:'100',offset:String(offset)});const page=await this.request('/v1/payments/search?'+p,{token});ensure(Array.isArray(page.results),502,'MP_SEARCH','Respuesta de conciliación inválida.');result.push(...page.results);if(page.results.length<100)return result;}throw new AppError(502,'MP_SEARCH_LIMIT','Demasiados pagos para una orden. Requiere revisión operativa.');}
 refund(token,pid,cents,key){ensure(/^\d{1,30}$/.test(String(pid))&&Number.isSafeInteger(cents)&&cents>0&&key,422,'REFUND_INPUT','Reembolso inválido.');return this.request(`/v1/payments/${encodeURIComponent(pid)}/refunds`,{method:'POST',token,idem:key,body:{amount:cents/100}});}
}
