import {DatabaseSync} from 'node:sqlite';
import {readFileSync,chmodSync} from 'node:fs';
import {id} from '../security.mjs';
export class Store {
  constructor(path,mode,now=()=>Date.now()) {
    this.now=now;this.db=new DatabaseSync(path);this.depth=0;
    this.db.exec('PRAGMA foreign_keys=ON;PRAGMA journal_mode=WAL;PRAGMA busy_timeout=5000;PRAGMA synchronous=FULL;');
    const version=this.one('PRAGMA user_version').user_version;
    if(version===0)this.tx(()=>this.db.exec(readFileSync(new URL('./migrations/001_marketplace.sql',import.meta.url),'utf8')));
    else if(version!==1)throw new Error('Versión de base de datos no soportada. No se abre una base de demo v4.');
    const current=this.one("SELECT value FROM meta WHERE key='mode'");
    if(current&&current.value!==mode)throw new Error('Está prohibido mezclar datos mock/sandbox/live.');
    this.run("INSERT OR IGNORE INTO meta(key,value) VALUES('mode',?)",mode);if(path!==':memory:')chmodSync(path,0o600);
  }
  one(sql,...params){return this.db.prepare(sql).get(...params)||null;}
  all(sql,...params){return this.db.prepare(sql).all(...params);}
  run(sql,...params){return this.db.prepare(sql).run(...params);}
  tx(fn){if(this.depth)return fn();this.db.exec('BEGIN IMMEDIATE');this.depth++;try{const v=fn();if(v?.then)throw new Error('No await dentro de transacciones SQLite.');this.db.exec('COMMIT');return v;}catch(e){this.db.exec('ROLLBACK');throw e;}finally{this.depth--;}}
  audit(actor,action,subject,details={}){this.run('INSERT INTO audit VALUES(?,?,?,?,?,?)',id(),actor,action,subject,JSON.stringify(details),this.now());}
  enqueue(kind,payload,dedupeKey=null,delay=0){const jobId=id();this.run('INSERT OR IGNORE INTO jobs(id,dedupe_key,kind,payload,available_at,created_at) VALUES(?,?,?,?,?,?)',jobId,dedupeKey,kind,JSON.stringify(payload),this.now()+delay,this.now());return jobId;}
  claimJob(){return this.tx(()=>{const row=this.one("SELECT * FROM jobs WHERE (status='PENDING' AND available_at<=?) OR (status='RUNNING' AND lease_until<=?) ORDER BY available_at LIMIT 1",this.now(),this.now());if(!row)return null;this.run("UPDATE jobs SET status='RUNNING',attempts=attempts+1,lease_until=? WHERE id=?",this.now()+120000,row.id);return {...row,attempts:row.attempts+1,payload:JSON.parse(row.payload)};});}
  completeJob(jobId){this.run("UPDATE jobs SET status='DONE',payload='{}' WHERE id=?",jobId);}
  failJob(job,error){const code=String(error.code||'PROVIDER_ERROR').slice(0,100);const failed=job.attempts>=8;this.run('UPDATE jobs SET status=?,last_error=?,available_at=? WHERE id=?',failed?'FAILED':'PENDING',code,this.now()+Math.min(3600000,1000*2**job.attempts),job.id);}
  close(){this.db.close();}
}
