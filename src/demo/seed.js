import { createLedgerState, grantWelcomeCredit } from '../domain/ledger.js';

const USERS = [
  { id: 'u_ana', name: 'Ana Torres', neighborhood: 'Almagro', intent: 'BOTH', skills: ['Inglés', 'Fotografía'], needs: ['Soporte tecnológico'], avatar: 'AT', verification: 'V2_DEMO', bio: 'Docente de inglés y fotógrafa amateur. Me gusta aprender herramientas digitales.' },
  { id: 'u_mateo', name: 'Mateo Ruiz', neighborhood: 'Caballito', intent: 'BOTH', skills: ['Soporte tecnológico', 'Programación'], needs: ['Inglés'], avatar: 'MR', verification: 'V2_DEMO', bio: 'Técnico de sistemas. Ayudo con notebooks, software y organización digital.' },
  { id: 'u_lucia', name: 'Lucía Benítez', neighborhood: 'Villa Crespo', intent: 'BOTH', skills: ['Diseño', 'Edición'], needs: ['Mantenimiento'], avatar: 'LB', verification: 'V1_DEMO', bio: 'Diseñadora visual. Intercambio piezas gráficas por ayuda práctica.' },
  { id: 'u_nico', name: 'Nicolás Acosta', neighborhood: 'Almagro', intent: 'BOTH', skills: ['Mantenimiento', 'Armado de muebles'], needs: ['Tecnología'], avatar: 'NA', verification: 'V2_DEMO', bio: 'Me doy maña con arreglos y armado. Quiero mejorar mis herramientas digitales.' },
  { id: 'u_santi', name: 'Santiago Leiva', neighborhood: 'Caballito', intent: 'BOTH', skills: ['Mascotas', 'Jardinería'], needs: ['Diseño'], avatar: 'SL', verification: 'V2_DEMO', bio: 'Paseo perros y cuido plantas. Emprendiendo un proyecto barrial.' },
  { id: 'u_carla', name: 'Carla Méndez', neighborhood: 'Villa Crespo', intent: 'BOTH', skills: ['Organización', 'Asistencia administrativa'], needs: ['Fotografía'], avatar: 'CM', verification: 'V1_DEMO', bio: 'Organizo agendas, documentos y procesos simples para personas y emprendimientos.' },
  { id: 'u_joaquin', name: 'Joaquín Paz', neighborhood: 'Caballito', intent: 'BOTH', skills: ['Fotografía', 'Edición'], needs: ['Mascotas'], avatar: 'JP', verification: 'V2_DEMO', bio: 'Fotógrafo de producto y editor. Busco ayuda ocasional con mi perro.' },
];

const OFFERS = [
  { id: 'o_ana_ingles', providerId: 'u_ana', title: 'Conversación en inglés sin vueltas', category: 'Idiomas', skill: 'Inglés', description: 'Práctica conversacional para adultos, enfocada en soltarse y ganar vocabulario.', modality: 'REMOTE', neighborhood: 'Almagro', durationCt: 2, availability: 'Mar y jue por la tarde', active: true },
  { id: 'o_mateo_tech', providerId: 'u_mateo', title: 'Puesta a punto de notebook', category: 'Tecnología', skill: 'Soporte tecnológico', description: 'Diagnóstico, limpieza de software, copias y configuración básica remota.', modality: 'REMOTE', neighborhood: 'Caballito', durationCt: 4, availability: 'Lun a vie 18–21 h', active: true },
  { id: 'o_lucia_diseno', providerId: 'u_lucia', title: 'Diseño de flyer o pieza simple', category: 'Diseño', skill: 'Diseño', description: 'Una pieza gráfica clara para redes, evento o emprendimiento.', modality: 'REMOTE', neighborhood: 'Villa Crespo', durationCt: 4, availability: 'Mié y sáb', active: true },
  { id: 'o_nico_muebles', providerId: 'u_nico', title: 'Armado de muebles y arreglos menores', category: 'Mantenimiento', skill: 'Armado de muebles', description: 'Armado de muebles en caja y pequeñas reparaciones no reguladas.', modality: 'IN_PERSON', neighborhood: 'Almagro', durationCt: 8, availability: 'Sábados', active: true },
  { id: 'o_santi_mascotas', providerId: 'u_santi', title: 'Paseo de perros por el barrio', category: 'Mascotas', skill: 'Mascotas', description: 'Paseo individual de perros adultos de bajo riesgo.', modality: 'IN_PERSON', neighborhood: 'Caballito', durationCt: 4, availability: 'Mañanas y tardes', active: true },
  { id: 'o_carla_admin', providerId: 'u_carla', title: 'Ordeno tu agenda y documentos', category: 'Organización', skill: 'Asistencia administrativa', description: 'Te ayudo a ordenar tareas, agenda y documentos digitales.', modality: 'REMOTE', neighborhood: 'Villa Crespo', durationCt: 4, availability: 'Lun, mié y vie', active: true },
  { id: 'o_joaquin_foto', providerId: 'u_joaquin', title: 'Edición rápida de fotos', category: 'Fotografía', skill: 'Edición', description: 'Selección, recorte y retoque básico de hasta diez fotos.', modality: 'REMOTE', neighborhood: 'Caballito', durationCt: 4, availability: 'Flexible', active: true },
];

const REQUESTS = [
  { id: 'r_ana_tech', requesterId: 'u_ana', title: 'Quiero ordenar y acelerar mi notebook', category: 'Tecnología', modality: 'REMOTE', neighborhood: 'Almagro', durationCt: 4, notes: 'Necesito revisar programas, espacio y backups.', status: 'OPEN' },
  { id: 'r_mateo_ingles', requesterId: 'u_mateo', title: 'Practicar inglés para una entrevista', category: 'Idiomas', modality: 'REMOTE', neighborhood: 'Caballito', durationCt: 2, notes: 'Conversación y preguntas típicas.', status: 'OPEN' },
  { id: 'r_lucia_muebles', requesterId: 'u_lucia', title: 'Armar una biblioteca pequeña', category: 'Mantenimiento', modality: 'IN_PERSON', neighborhood: 'Villa Crespo', durationCt: 8, notes: 'Mueble en caja, herramientas básicas disponibles.', status: 'OPEN' },
  { id: 'r_santi_diseno', requesterId: 'u_santi', title: 'Necesito un flyer para mi emprendimiento', category: 'Diseño', modality: 'REMOTE', neighborhood: 'Caballito', durationCt: 4, notes: 'Una pieza cuadrada para redes.', status: 'OPEN' },
];

export function createSeedState() {
  const ledger = createLedgerState();
  for (const user of USERS) grantWelcomeCredit(ledger, user.id, `welcome:${user.id}`);
  return {
    schemaVersion: 1,
    activeUserId: 'u_ana',
    users: structuredClone(USERS),
    offers: structuredClone(OFFERS),
    requests: structuredClone(REQUESTS),
    exchanges: [],
    conversations: [],
    reviews: [],
    ledger,
    counters: { user: 100, offer: 100, request: 100, exchange: 100, message: 100, review: 100 },
    updatedAt: '2026-09-02T22:23:00-03:00',
  };
}
