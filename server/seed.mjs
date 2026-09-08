import {ensure} from './domain/errors.mjs';
/** Synthetic fixtures only. No artificial consent or connection is created for these people. */
export function seedMock(store,config){ensure(config.mode==='mock',400,'SEED_MODE','Está prohibido cargar ejemplos fuera de mock.');if(store.one("SELECT value FROM meta WHERE key='seed5'"))return;store.tx(()=>{
 const people=[['ana','Ana García','Almagro','Diseñadora. Me gusta aprender herramientas nuevas y compartir lo que sé.'],['mateo','Mateo Ríos','Caballito','Acompaño a personas adultas a resolver tareas digitales con claridad y paciencia.'],['lucia','Lucía Fernández','Villa Crespo','Editora y fotógrafa. Trabajo con emprendimientos e ideas que necesitan una buena imagen.'],['carla','Carla López','Almagro','Profesora de idiomas para personas adultas. Conversación, práctica y confianza.'],['santi','Santiago Díaz','Caballito','Programación y organización. Soluciones concretas para proyectos pequeños.']];
 for(const [slug,name,barrio,bio]of people)store.run('INSERT INTO users(id,email,password_hash,name,neighborhood,bio,dob,email_verified,is_demo,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)','demo_'+slug,slug+'@example.test','demo-only-no-password',name,barrio,bio,'1990-01-01',1,1,store.now());
 const offers=[
 ['mateo','Tu compu, sin vueltas','Tecnología',2500,2,'Resolvemos juntos dudas de tu computadora por videollamada. No te pediré contraseñas ni acceso a tus cuentas.'],
 ['mateo','Poné en orden tu Excel','Tecnología',1000,1,'Una consulta puntual de fórmulas o tablas. Traé una planilla de ejemplo sin datos personales.'],
 ['lucia','Fotos que cuentan tu proyecto','Fotografía',5000,4,'Sesión remota para revisar y editar fotografías de tu emprendimiento. Trabajamos sobre tus propias imágenes.'],
 ['ana','Un CV que te represente','Diseño',2500,2,'Revisamos diseño y organización de tu currículum. Te llevás ideas concretas y una estructura clara.'],
 ['carla','Soltate hablando inglés','Idiomas',2500,2,'Conversación por videollamada para personas adultas. Adaptamos los temas a tus objetivos e intereses.'],
 ['santi','Destrabá tu código','Programación',5000,2,'Una revisión remota de un problema de programación. Compartí código propio sin secretos o claves.'],
 ['lucia','Textos claros, ideas fuertes','Redacción',2500,2,'Revisión de claridad y estructura de textos de hasta tres páginas, para comunicar mejor lo importante.'],
 ['ana','Diseño para tu próxima idea','Diseño',5000,4,'Revisamos una propuesta gráfica y definimos próximos pasos. No incluye licencias ni servicios externos.'],
 ['santi','Organizá tu semana','Organización',1000,1,'Una ayuda breve para ordenar pendientes y elegir prioridades con un método sencillo.'],
 ['mateo','Primeros pasos con herramientas digitales','Tecnología',2500,4,'Aprendé a organizar documentos y videollamadas. Taller remoto, individual y exclusivamente para adultos.'],
 ['carla','Practicá tu presentación','Idiomas',1000,1,'Ensayá una presentación breve en inglés. Recibí correcciones y sugerencias concretas para seguir practicando.'],
 ['lucia','Edición de imagen express','Fotografía',2500,1,'Orientación puntual de luz, encuadre o edición. Usamos una fotografía tuya como ejercicio.']];
 offers.forEach(([slug,title,category,price,blocks,description],i)=>store.run('INSERT INTO offers VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)','demo_offer_'+(i+1),'demo_'+slug,title,description,category,'REMOTE',people.find(p=>p[0]===slug)[2],price,blocks,'A coordinar · días hábiles',1,store.now()-i*1000,store.now()));
 store.run('INSERT INTO needs VALUES(?,?,?,?,?,?,?,?,?,?)','demo_need_1','demo_ana','Necesito ayuda para organizar una planilla','Busco una consulta remota para ordenar una planilla de trabajo de ejemplo, sin información sensible.','Tecnología','Almagro',2500,2,1,store.now());
 store.run("INSERT INTO meta VALUES('seed5','1')");store.audit('system','MOCK_SEEDED','fixtures',{notice:'Perfiles e imágenes ficticios. Sin saldos ni aceptaciones reales.'});});}
