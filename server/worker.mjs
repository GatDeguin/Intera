import {unseal} from './security.mjs';
import {AppError,ensure} from './domain/errors.mjs';
/** Durable single-process worker. Network effects are retried with stable identifiers. */
export class Worker {
 constructor({store,market,payments,config},fetchImpl=fetch){this.s=store;this.market=market;this.payments=payments;this.c=config;this.fetch=fetchImpl;this.busy=false;this.timer=null;this.lastSweep=0;}
 async execute(job){const p=job.payload;switch(job.kind){
  case 'reconcile_payment':return this.payments.reconcilePayment(p.paymentId,p.sellerId);
  case 'reconcile_booking':return this.payments.reconcileBooking(p.bookingId);
  case 'refund':return this.payments.executeRefund(p.refundId);
  case 'expire_preference':return this.payments.expirePreference(p.attemptId);
  case 'mail':{ensure(this.c.mode!=='mock'&&this.c.resendKey&&this.c.emailFrom,503,'EMAIL_CONFIG','Correo transaccional no configurado.');const m=unseal(p.encrypted,this.c.encryptionKey,'mail');const r=await this.fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${this.c.resendKey}`,'Content-Type':'application/json','Idempotency-Key':'intera-mail-'+job.id},body:JSON.stringify({from:this.c.emailFrom,to:[m.to],subject:m.subject,text:m.text}),signal:AbortSignal.timeout(15000),redirect:'error'});ensure(r.ok,502,'EMAIL_PROVIDER','El proveedor no confirmó el correo.');return;}
  default:throw new AppError(500,'JOB_KIND','Trabajo no reconocido.');
 }}
 sweep(){const now=this.s.now();this.lastSweep=now;
  const overdue=this.s.all("SELECT id,buyer_id FROM bookings WHERE (status='REQUESTED' AND (scheduled_at<=? OR created_at<?)) OR (status='ACCEPTED' AND payment_status IN ('UNPAID','CHECKOUT_CREATED','PENDING','REJECTED') AND payment_deadline<=?) LIMIT 100",now,now-48*3600000,now);
  for(const b of overdue){try{this.market.cancel(b.buyer_id,b.id,'Cancelación automática: venció el plazo de aceptación o pago.');}catch(e){this.s.audit('system','EXPIRY_REVIEW',b.id,{code:e.code||'ERROR'});}}
  // Frequent for open checkouts, hourly after payment. Persist next poll across restarts.
  const attempts=this.s.all('SELECT * FROM attempts WHERE next_reconcile<=? ORDER BY next_reconcile LIMIT 20',now);
  for(const a of attempts)this.s.tx(()=>{this.s.enqueue('reconcile_booking',{bookingId:a.booking_id},`poll:${a.id}:${Math.floor(now/60000)}`);this.s.run('UPDATE attempts SET next_reconcile=? WHERE id=?',now+300000,a.id);});
  this.s.run('DELETE FROM sessions WHERE expires_at<?',now);this.s.run('DELETE FROM oauth_states WHERE expires_at<?',now);this.s.run('DELETE FROM action_tokens WHERE expires_at<?',now-86400000);this.s.run('DELETE FROM rate_limits WHERE expires_at<?',now);
 }
 async tick(){if(this.busy)return;this.busy=true;try{for(let i=0;i<15;i++){const job=this.s.claimJob();if(!job)break;try{await this.execute(job);this.s.completeJob(job.id);}catch(e){this.s.failJob(job,e);}}}finally{this.busy=false;}}
 start(){if(this.timer)return;const cycle=async()=>{if(this.busy)return;try{if(this.s.now()-this.lastSweep>=60000)this.sweep();await this.tick();}catch(e){console.error('Worker:',e.code||'INTERNAL_ERROR');}};this.timer=setInterval(cycle,this.c.workerIntervalMs||5000);cycle();}
 stop(){clearInterval(this.timer);this.timer=null;}
 async drain(){this.stop();while(this.busy)await new Promise(r=>setTimeout(r,50));}
}
