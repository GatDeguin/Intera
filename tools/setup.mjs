import {copyFileSync,existsSync,chmodSync} from 'node:fs';import {loadConfig} from '../server/config.mjs';
const [major,minor]=process.versions.node.split('.').map(Number);if(major<22||(major===22&&minor<13))throw new Error('Se requiere Node.js 22.13 o superior, incluyendo node:sqlite.');
if(!existsSync('.env')){copyFileSync('.env.example','.env');chmodSync('.env',0o600);console.log('.env creado en modo mock local; no habilita cobros reales.');}else console.log('Se conservó el archivo .env existente.');
// This command deliberately does not print or overwrite secrets.
console.log('Ejecutá npm start. No hace falta npm install. Para Mercado Pago real seguí docs/MERCADOPAGO.md.');
