import http from 'node:http';
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
let root=process.env.INTERA_SERVE_DIR?resolve(process.env.INTERA_SERVE_DIR):project;
if(!process.env.INTERA_SERVE_DIR)try{await access(resolve(project,'dist/index.html'));root=resolve(project,'dist');}catch{}
const port=Number(process.env.PORT||4173);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('PORT debe ser un puerto entre 1024 y 65535.');
const allowed=new Set(['/index.html','/INTERA.html','/offline.html','/manifest.webmanifest','/sw.js','/assets/icon-192.png','/assets/icon-512.png','/assets/intera-mark.svg']);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  if((req.url||'').length>4096){res.writeHead(414);res.end();return;}
  const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);const requested=path==='/'?'/index.html':path;
  if(!allowed.has(requested)){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('No encontrado.');return;}
  const body=await readFile(resolve(root,'.'+requested));
  res.writeHead(200,{'Content-Type':mime[extname(requested)],'Content-Length':body.length,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=()'});
  res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('No encontrado.');}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`El puerto ${port} ya está en uso. Abrí la instancia existente o cambiá PORT.`:error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`INTERA demo local: http://127.0.0.1:${port}\nSolo sirve los archivos de la demo. Ctrl+C para detener.`));
