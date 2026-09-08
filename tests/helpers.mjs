import {Store} from '../server/db/store.mjs';
import {createLegal} from '../server/legal.mjs';
import {seal} from '../server/security.mjs';
export function fixture(){
 let clock=Date.parse('2026-09-08T15:00:00Z');
 const config={mode:'mock',baseUrl:'http://127.0.0.1:4173',encryptionKey:Buffer.alloc(32,7).toString('base64'),mpClientId:'1234',mpClientSecret:'test-secret',mpWebhookSecret:'webhook-test',emailMode:'mock',inPersonEnabled:false,webhookMaxAgeSeconds:86400};
 const store=new Store(':memory:','mock',()=>clock);const legal=createLegal(store,config);
 for(const [id,name] of [['buyer','Ana'],['seller','Mateo'],['other','Lucía']]){
  store.run('INSERT INTO users(id,email,password_hash,name,neighborhood,dob,email_verified,is_demo,created_at) VALUES(?,?,?,?,?,?,?,?,?)',id,`${id}@example.test`,'invalid',name,'Almagro','1990-01-01',1,1,clock);
  legal.accept(id,{accept:true,version:legal.document.version,hash:legal.document.hash});
 }
 store.run('INSERT INTO seller_accounts VALUES(?,?,?,?,?,?,?)','seller','9002',seal({access_token:'mock-seller',refresh_token:'refresh'},config.encryptionKey,'mock:seller'),clock+86400000,'CONNECTED','mock',clock);
 return {store,legal,config,setTime(v){clock=v;},advance(ms){clock+=ms;}};
}
export const offerInput={title:'Asistencia digital',description:'Revisión remota de documentos y herramientas.',category:'Tecnología',modality:'REMOTE',neighborhood:'Almagro',priceArs:2500,blocks:2,availability:'A coordinar',sellerFeeAccepted:true};
export function bookingInput(f,offer,overrides={}){return {offerId:offer.id,blocks:4,expectedPriceArs:2500,scheduledAt:new Date(f.store.now()+86400000).toISOString(),notes:'Prueba de cuatro bloques.',quoteAccepted:true,termsHash:f.legal.document.hash,...overrides};}
