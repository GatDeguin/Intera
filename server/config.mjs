import {mkdirSync,readFileSync,writeFileSync,existsSync,chmodSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
export function loadConfig(env=process.env) {
  const mode=env.PAYMENTS_MODE||'mock';if(!['mock','sandbox','live'].includes(mode))throw new Error('PAYMENTS_MODE inválido.');
  const port=Number(env.PORT||4173);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT inválido.');
  const host=env.HOST||'127.0.0.1';const baseUrl=(env.APP_BASE_URL||`http://127.0.0.1:${port}`).replace(/\/$/,'');
  const url=new URL(baseUrl);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('APP_BASE_URL debe ser un origen HTTP(S), sin ruta.');
  const local=['127.0.0.1','localhost','[::1]'].includes(url.hostname);
  if(mode==='mock'&&(!local||!['127.0.0.1','localhost','::1'].includes(host)))throw new Error('Mock solo se puede escuchar en loopback.');
  if(mode!=='mock'&&(url.protocol!=='https:'||local))throw new Error('Sandbox y live requieren APP_BASE_URL HTTPS público.');
  const dataDir=resolve(env.DATA_DIR||'data');mkdirSync(dataDir,{recursive:true,mode:0o700});
  const keyFile=resolve(dataDir,'mock-only.key');let encryptionKey=env.TOKEN_ENCRYPTION_KEY;
  if(!encryptionKey&&mode==='mock') {if(!existsSync(keyFile))writeFileSync(keyFile,randomBytes(32).toString('base64'),{mode:0o600});encryptionKey=readFileSync(keyFile,'utf8').trim();}
  if(!encryptionKey||Buffer.from(encryptionKey,'base64').length!==32)throw new Error('TOKEN_ENCRYPTION_KEY requiere 32 bytes aleatorios en base64.');
  const cfg={mode,port,host,baseUrl,dataDir,dbPath:resolve(dataDir,`intera-${mode}.sqlite`),encryptionKey,secureCookie:url.protocol==='https:',
    mpClientId:env.MP_CLIENT_ID||'',mpClientSecret:env.MP_CLIENT_SECRET||'',mpWebhookSecret:env.MP_WEBHOOK_SECRET||'',
    webhookMaxAgeSeconds:Number(env.MP_WEBHOOK_MAX_AGE_SECONDS||86400),
    operatorName:env.OPERATOR_LEGAL_NAME||'',operatorTaxId:env.OPERATOR_CUIT||'',operatorAddress:env.OPERATOR_ADDRESS||'',supportEmail:env.SUPPORT_EMAIL||'',
    legalApproved:env.LEGAL_APPROVED==='true',legalApprovedHash:env.LEGAL_APPROVED_HASH||'',paymentsEnabled:env.LIVE_PAYMENTS_ENABLED==='true',marketplaceApproved:env.MP_MARKETPLACE_APPROVED==='true',
    emailMode:env.EMAIL_MODE||(mode==='mock'?'mock':'resend'),emailFrom:env.EMAIL_FROM||'',resendKey:env.RESEND_API_KEY||'',
    inPersonEnabled:false, workerIntervalMs:5000, version:'5.0.0'};
  if(mode==='live') {
    const required=['mpClientId','mpClientSecret','mpWebhookSecret','operatorName','operatorTaxId','operatorAddress','supportEmail','emailFrom','resendKey'];
    if(required.some(k=>!cfg[k])||!cfg.legalApproved||!cfg.paymentsEnabled||!cfg.marketplaceApproved||cfg.emailMode!=='resend')throw new Error('Live bloqueado: faltan credenciales, identidad del operador, correo o aprobaciones explícitas. Consultá .env.example.');
  }
  if(mode!=='mock'&&cfg.emailMode==='mock')throw new Error('El correo simulado está prohibido fuera de mock.');
  if(existsSync(cfg.dbPath))chmodSync(cfg.dbPath,0o600);
  return Object.freeze(cfg);
}
