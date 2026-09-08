import {loadConfig} from '../server/config.mjs';import {Store} from '../server/db/store.mjs';import {createLegal} from '../server/legal.mjs';import {Marketplace} from '../server/marketplace.mjs';import {inspectStore,backupStore} from '../server/operations.mjs';import {unlockStale} from '../server/process-lock.mjs';import {toCents} from '../server/domain/pricing.mjs';import {text,ensure} from '../server/domain/errors.mjs';import {existsSync} from 'node:fs';import {resolve} from 'node:path';
// Administrative CLI only. Grant OS/SSH access narrowly, with MFA and an external access log.
const [command='help',...args]=process.argv.slice(2),confirmed=args.includes('--confirm'),pos=args.filter(v=>v!=='--confirm');
const usage=`INTERA · Operaciones de servidor (no hay credenciales administrativas en la web)
node --env-file-if-exists=.env tools/admin.mjs status
... legal-hash
... backup [archivo.sqlite]
... reports
... booking <booking-id>
... reconcile <booking-id> --confirm
... refund <payment-id> <importe-ARS> "motivo de al menos 10 caracteres" --confirm
... retry-job <job-id> --confirm
... resolve-report <report-id> "resolución comunicada al usuario" --confirm
... restore-service <booking-id> "motivo documentado" --confirm
... suspend <user-id> "motivo documentado" --confirm
... unsuspend <user-id> "motivo documentado" --confirm
... unlock --confirm

Las escrituras requieren OPERATOR_ID en el entorno (identidad del operador con acceso al host).
refund ENCOLA la devolución; solo Mercado Pago confirma el resultado. No acredita dinero a mano.
restore-service solo restaura el estado deducido de los eventos previos tras cerrar los reclamos.
Los secretos y la clave de cifrado NO se incluyen en el backup: guardalos en un vault separado.
`;
if(command==='help'){console.log(usage);process.exit(0);}
let store;try{const config=loadConfig();const actor=process.env.OPERATOR_ID?.trim();const write=()=>{ensure(confirmed&&actor&&actor.length>=3,400,'CONFIRM','Se requiere OPERATOR_ID y --confirm.');return 'operator:'+text(actor,3,100,'Operador');};if(command==='unlock'){write();console.log(JSON.stringify(unlockStale(config.dbPath+'.server.lock'),null,2));process.exit(0);}
 if(!existsSync(config.dbPath)&&command!=='legal-hash')throw new Error('La base no existe. Iniciá el servidor una vez antes de operar.');
 store=new Store(config.dbPath,config.mode);const legal=createLegal(store,config),market=new Marketplace(store,legal,config);let result;
 switch(command){
 case 'status':result=inspectStore(store);break;
 case 'legal-hash':result={version:legal.document.version,hash:legal.document.hash,mode:config.mode,notice:'Verificá el texto y la identidad legal; este hash no sustituye aprobación profesional.'};break;
 case 'backup':result=backupStore(store,pos[0]||resolve(config.dataDir,'backups',`${config.mode}-${new Date().toISOString().replaceAll(':','-')}.sqlite`));break;
 case 'reports':result=store.all('SELECT * FROM reports ORDER BY created_at DESC LIMIT 100');break;
 case 'booking':{const b=store.one('SELECT * FROM bookings WHERE id=?',pos[0]);ensure(b,404,'NOT_FOUND','Orden no encontrada.');result={booking:b,attempts:store.all('SELECT id,status,preference_id,external_ref,created_at FROM attempts WHERE booking_id=?',b.id),payments:store.all('SELECT * FROM payments WHERE booking_id=?',b.id),refunds:store.all('SELECT * FROM refunds WHERE booking_id=?',b.id)};break;}
 case 'reconcile':{const a=write();ensure(store.one('SELECT id FROM bookings WHERE id=?',pos[0]),404,'NOT_FOUND','Orden no encontrada.');result={jobId:store.enqueue('reconcile_booking',{bookingId:pos[0]})};store.audit(a,'MANUAL_RECONCILE_QUEUED',pos[0]);break;}
 case 'refund':{const a=write();result={refundId:market.requestRefund(pos[0],toCents(pos[1]),pos[2],a),notice:'Solicitada, todavía NO devuelta. El worker verifica Mercado Pago.'};break;}
 case 'retry-job':{const a=write();const j=store.one("SELECT * FROM jobs WHERE id=? AND status='FAILED'",pos[0]);ensure(j,409,'JOB','Solo se reintentan trabajos fallidos.');store.tx(()=>{store.run("UPDATE jobs SET status='PENDING',attempts=0,available_at=?,last_error=NULL WHERE id=?",store.now(),j.id);store.audit(a,'JOB_RETRIED',j.id,{kind:j.kind});});result={queued:j.id};break;}
 case 'resolve-report':{const a=write(),resolution=text(pos[1],10,3000,'Resolución');store.tx(()=>{const r=store.one("SELECT * FROM reports WHERE id=? AND status='OPEN'",pos[0]);ensure(r,404,'REPORT','Reclamo no abierto.');store.run("UPDATE reports SET status='CLOSED',resolution=? WHERE id=?",resolution,r.id);store.audit(a,'REPORT_RESOLVED',r.id,{resolution});});result={resolved:pos[0],notice:'No cambia fondos ni el estado del servicio. Informá la resolución al usuario por soporte.'};break;}
 case 'restore-service':{const a=write(),reason=text(pos[1],10,1500,'Motivo');result=store.tx(()=>{const b=store.one("SELECT * FROM bookings WHERE id=? AND status='DISPUTED'",pos[0]);ensure(b&&!store.one("SELECT id FROM reports WHERE booking_id=? AND type='DISPUTE' AND status='OPEN'",pos[0]),409,'DISPUTE','Cerrá los reclamos de la orden antes de restaurar el servicio.');const status=b.confirmed_at?'COMPLETED':b.completed_at?'COMPLETED_BY_PROVIDER':b.started_at?'IN_PROGRESS':'ACCEPTED';store.run('UPDATE bookings SET status=?,updated_at=? WHERE id=?',status,store.now(),b.id);store.audit(a,'SERVICE_RESTORED_AFTER_REVIEW',b.id,{reason,status,movesMoney:false});return {status,movesMoney:false};});break;}
 case 'suspend':case 'unsuspend':{const a=write(),reason=text(pos[1],10,1500,'Motivo');ensure(store.one('SELECT id FROM users WHERE id=?',pos[0]),404,'USER','Cuenta no encontrada.');store.tx(()=>{store.run('UPDATE users SET suspended=? WHERE id=?',command==='suspend'?1:0,pos[0]);store.run('DELETE FROM sessions WHERE user_id=?',pos[0]);store.audit(a,command.toUpperCase(),pos[0],{reason});});result={userId:pos[0],suspended:command==='suspend',sessionsRevoked:true};break;}
 default:throw new Error(usage);
 }console.log(JSON.stringify(result,null,2));
}catch(e){console.error(`${e.code||'ERROR'}: ${e.message}`);process.exitCode=1;}finally{store?.close();}
