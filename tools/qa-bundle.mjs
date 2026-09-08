// Test-only assembly for a browser whose navigation is blocked by enterprise policy.
// This is not a deployable bundle and never changes production source files.
import {readFileSync,writeFileSync} from 'node:fs';
const names=['format','icons','api','motion','views','app'];let out='const __modules = {};\n';
for(const name of names){let src=readFileSync(new URL(`../public/js/${name}.js`,import.meta.url),'utf8');const exported=[...src.matchAll(/export\s+(?:async\s+)?(?:const|let|function|class)\s+(\w+)/g)].map(m=>m[1]);src=src.replace(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]\.\/(\w+)\.js['"];?/g,(_,alias,dep)=>`const ${alias}=__modules['${dep}'];`);src=src.replace(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/(\w+)\.js['"];?/g,(_,vars,dep)=>`const {${vars.replace(/\s+as\s+/g,':')}}=__modules['${dep}'];`);src=src.replace(/\bexport\s+/g,'');out+=`__modules['${name}']=(()=>{\n${src}\nreturn {${exported.join(',')}};})();\n`;}
writeFileSync(process.argv[2]||'docs/qa/browser-bundle.js',out);console.log('QA-only bundle written');
