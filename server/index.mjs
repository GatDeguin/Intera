import {createApp} from './app.mjs';import {loadConfig} from './config.mjs';import {acquireProcessLock} from './process-lock.mjs';
let app,release;try{const config=loadConfig();release=acquireProcessLock(config.dbPath+'.server.lock');app=createApp(config);}catch(e){release?.();console.error(e.message);process.exit(1);}
app.server.requestTimeout=20000;app.server.headersTimeout=10000;
let closing=false;async function close(){if(closing)return;closing=true;const closed=new Promise(r=>app.server.close(r));await app.worker.drain();await closed;app.store.close();release();process.exitCode=0;}
app.server.on('error',async e=>{console.error(e.code==='EADDRINUSE'?'El puerto está ocupado. Cerrá la otra instancia o cambiá PORT y APP_BASE_URL.':'No se pudo iniciar el servidor: '+e.code);await close();process.exitCode=1;});
app.server.listen(app.config.port,app.config.host,()=>{console.log(`INTERA ${app.config.version} · ${app.config.mode.toUpperCase()}\n${app.config.baseUrl}\n${app.config.mode==='mock'?'SIMULADOR LOCAL: no se cobra ni se acredita dinero.':'Adaptador Mercado Pago habilitado. Se requieren cuentas vinculadas.'}\nDejá esta ventana abierta. Ctrl+C para detener.`);app.worker.start();});
process.on('SIGINT',close);process.on('SIGTERM',close);
