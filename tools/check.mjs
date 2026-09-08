import {readdirSync,readFileSync,statSync} from 'node:fs';import {spawnSync} from 'node:child_process';import {join} from 'node:path';
function scan(dir){return readdirSync(dir).flatMap(n=>{const p=join(dir,n);return statSync(p).isDirectory()?scan(p):[p];});}
const files=['server','public/js','tests','tools'].flatMap(scan).filter(p=>/\.(mjs|js)$/.test(p));let bad=0;for(const p of files){const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status!==0){console.error(p,r.stderr);bad++;}}
const html=readFileSync('public/index.html','utf8');if(!html.includes('lang="es-AR"')||!html.includes('type="module"')){console.error('Bootstrap HTML inesperado.');bad++;}
console.log(`${files.length} archivos JavaScript: ${bad?'hay errores':'sintaxis válida'}.`);process.exitCode=bad?1:0;
