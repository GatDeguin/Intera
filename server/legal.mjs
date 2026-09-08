import {readFileSync} from 'node:fs';
import {hash,id} from './security.mjs';
import {ensure} from './domain/errors.mjs';
export function createLegal(store,config) {
  let content=readFileSync(new URL('../docs/legal/CONDICIONES_ES.md',import.meta.url),'utf8');
  const vars={OPERATOR_NAME:config.operatorName||'Operador pendiente de identificación (entorno de prueba)',OPERATOR_CUIT:config.operatorTaxId||'Pendiente',OPERATOR_ADDRESS:config.operatorAddress||'Pendiente',SUPPORT_EMAIL:config.supportEmail||'Sin canal operativo configurado (prueba local)'};
  for(const [k,v] of Object.entries(vars)) content=content.replaceAll(`{{${k}}}`,String(v));
  const doc={version:'5.0-ARS-2026-09-08',hash:hash(content),content};
  store.run('INSERT OR IGNORE INTO legal_documents VALUES(?,?,?,?)',doc.hash,doc.version,doc.content,store.now());
  return {document:doc,
    accepted(userId){return !!store.one('SELECT id FROM consents WHERE user_id=? AND document_hash=?',userId,doc.hash);},
    accept(userId,input,context={}) {
      ensure(input.accept===true&&input.version===doc.version&&input.hash===doc.hash,428,'TERMS_REQUIRED','Leé y aceptá la versión vigente de las condiciones.');
      store.run('INSERT OR IGNORE INTO consents VALUES(?,?,?,?,?,?,?)',id(),userId,doc.hash,doc.version,context.ipHash||'local-test',context.agentHash||'local-test',store.now());
      store.audit(userId,'TERMS_ACCEPTED',doc.hash,{version:doc.version});return {accepted:true,hash:doc.hash};
    }
  };
}
