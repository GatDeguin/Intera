# INTERA — MVP demo autocontenido

INTERA conecta lo que una persona **puede aportar** con lo que otra **necesita** usando tiempo como unidad de valor.

Esta carpeta contiene una PWA funcional de demostración, no un mockup. Permite recorrer el flujo bilateral completo con perfiles ficticios de Almagro, Caballito y Villa Crespo: publicar, encontrar un match, proponer, reservar Créditos de Tiempo (escrow), intercambiar, conversar, confirmar y valorar.

> **Modo demo local:** identidad, verificación, reputación, personas y operaciones de esta versión son simuladas. No coordines servicios reales desde esta demo.

## Inicio rápido

Requisito: **Node.js 22 o superior**.

No hace falta ejecutar `npm install`: el proyecto no tiene dependencias de terceros ni necesita credenciales, APIs o acceso al registry de npm.

### Windows — recomendado

No abras `index.html` con doble clic: Chrome ejecuta ese archivo mediante `file://` y bloquea los módulos ES, el manifest y las capacidades PWA por política de seguridad del navegador.

1. Descomprimí la carpeta completa.
2. Hacé doble clic en **`INICIAR_INTERA.bat`**.
3. Se abrirá automáticamente `http://127.0.0.1:4173`.
4. Mantené abierta la ventana del servidor mientras uses la demo; cerrala para detenerla.

### Terminal

```bash
npm run dev
```

Abrí `http://127.0.0.1:4173`.

También podés arrancarlo sin npm:

```bash
node tools/server.mjs
```

Para elegir otro puerto:

```bash
PORT=8080 npm run dev
```

## Recorrido recomendado de la demo

1. Entrá como **Ana Torres**.
2. Abrí su solicitud de soporte tecnológico o creá una nueva.
3. Elegí a **Mateo Ruiz** y enviá una propuesta.
4. Desde el selector **Modo demo local**, cambiá a Mateo.
5. Aceptá: los CT de Ana pasan de `AVAILABLE` a `HELD`.
6. Iniciá el intercambio y escribí mensajes.
7. Como Mateo, marcá el trabajo como completado.
8. Volvé a Ana y confirmá: los CT salen del escrow y se acreditan a Mateo.
9. Enviá una valoración y revisá perfil e historial.

El detalle del intercambio permite además simular extensión de duración, cancelación, no-show y disputa.

## Regla económica

- **1 CT = 15 minutos.**
- Los servicios se acuerdan en CT enteros.
- Internamente `1 CT = 4 ct_quarters` para ajustes porcentuales.
- Cada perfil demo nuevo recibe **4 CT** de bienvenida.
- No se permite saldo negativo.
- No se compran, venden ni convierten CT en dinero.
- Reputación y verificación son capas distintas del producto.
- El valor del tiempo no cambia según profesión, barrio, reputación o seniority.

## Arquitectura

```text
UI SPA / hash routes
       ↓
DemoService (casos de uso y mutaciones atómicas)
       ↓
Domain modules
CT · ledger · state machine · matching · reputation
       ↓
LocalRepository
       ↓
localStorage versionado
```

El dominio no depende del DOM ni de `localStorage`. El ledger es append-only, usa `ct_quarters` enteros e idempotency keys, y deriva saldos a partir de postings.

La PWA usa únicamente APIs estándar: ES Modules, `localStorage`, Service Worker y Web App Manifest.

## Checks

```bash
npm test
npm run e2e
npm run check
npm run build
```

- `npm test`: unit, integration, smoke y journey tests con `node:test`.
- `npm run e2e`: ejecuta de forma aislada el journey completo a nivel aplicación/UI-contract.
- `npm run check`: `node --check` sobre módulos JS/MJS.
- `npm run build`: genera una copia distribuible en `dist/`.

## Build distribuible

```bash
npm run build
cd dist
npm run dev
```

`dist/` conserva el mismo requisito: Node.js 22+, cero paquetes externos.

## Persistencia y reset

El estado se guarda en `localStorage` bajo una clave versionada. El panel **Modo demo local** permite cambiar de perfil y **Restablecer demo**, que vuelve a cargar los datos seed.

## PWA y offline

El service worker cachea el app shell y los módulos locales. Después de una primera carga servida por HTTP, la interfaz puede reutilizar esos recursos sin red. La persistencia de los intercambios permanece en el navegador.

## Qué incluye

- 7 perfiles ficticios y oferta/demanda seed.
- onboarding demo y 4 CT de bienvenida;
- ofertas y solicitudes;
- matching determinístico y explicable;
- selector multiusuario para demostrar ambos lados;
- escrow de CT;
- lifecycle de intercambio;
- extensión con aprobación bilateral;
- cancelaciones y no-show con reglas 100/0, 25/75 y 50/50;
- disputa demo que mantiene CT congelados;
- chat local por intercambio;
- reviews posteriores a confirmación;
- reputación separada de verificación;
- historial del ledger;
- UI mobile-first y navegación por teclado;
- PWA/offline app shell.

## Fuera de alcance

No hay autenticación real, OTP, DNI, biometría, Veriff, Mercado Pago, dinero, Supabase, moderación humana, geolocalización continua, notificaciones externas ni servicios regulados. La demo no sustituye los gates legales, tributarios, de seguridad y Trust & Safety del MVP productivo.

## Migración futura

Las interfaces separan reglas de producto e infraestructura. Para un MVP productivo pueden reemplazarse progresivamente `localStorage` por PostgreSQL/Supabase, sesión demo por Auth, verificación simulada por un proveedor KYC y el ledger local por operaciones transaccionales de base de datos, conservando los casos de uso centrales.

## Nota de validación del entorno

El journey automatizado recorre el contrato de UI y dominio completo sin dependencias externas. En el entorno donde se construyó esta entrega, Chromium está instalado pero una política organizacional bloquea la navegación a URLs locales y `file://`; por eso no se incluye una afirmación de E2E visual en navegador ni screenshots validados. La demo sí queda lista para abrirse en un navegador normal mediante `npm run dev`.
