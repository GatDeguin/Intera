# INTERA v5 · Servicios pagos por bloques

**Versión 5.0.0 · 8 de septiembre de 2026.** Repositorio completo del cambio de modelo: aplicación web + servidor + base persistente + integración REST de Mercado Pago + simulador local + pruebas.

> **Estado de entrega:** implementación ejecutable con pagos simulados y adaptador real preparado. No hay una cuenta de Mercado Pago conectada en esta entrega. No se ejecutaron transacciones en sandbox ni live del proveedor. Activación comercial, credenciales, OAuth de prestadores, dominio HTTPS y validaciones legales/contables están pendientes. No es una certificación de producción.

## Nuevo modelo, sin ambigüedades

Cada bloque dura **15 minutos**. Quien publica el servicio elige **$1.000, $2.500 o $5.000 ARS por bloque**. Se contratan de 1 a 32 bloques. Una ampliación usa la misma tarifa del acuerdo original y requiere otra aprobación/pago: no existe cobro automático por cronómetro.

INTERA cobra **50/1.000 del bruto = 5%** como comisión total propia. Se descuenta del bruto destinado al prestador; no se suma al total del comprador. Los cargos de Mercado Pago, retenciones y demás obligaciones son externos y no se inventan ni se hardcodean como un porcentaje adicional.

| Tarifa / bloque | Minutos | Total comprador | INTERA 5% | Prestador antes de cargos externos |
|---|---:|---:|---:|---:|
| $1.000 | 15 | $1.000 | $50 | $950 |
| $2.500 | 15 | $2.500 | $125 | $2.375 |
| $5.000 | 15 | $5.000 | $250 | $4.750 |
| $2.500 × 4 bloques | 60 | $10.000 | $500 | $9.500 |

**$9.500 no es un neto garantizado:** falta el costo externo aplicable. La app muestra por separado lo contratado, lo informado por Mercado Pago y la disponibilidad informada por el proveedor. No promete retiro instantáneo.

No hay CT, bienvenida monetaria, compra de créditos, billetera ni escrow propio. Finalizar un servicio **no libera dinero**: Mercado Pago administra la acreditación/disponibilidad mediante Split 1:1.

## Probar en Windows, sin npm install

1. Descomprimí **todo** el ZIP en una carpeta nueva.
2. Instalá Node.js LTS **22.13 o superior** si aún no está instalado.
3. Hacé doble clic en `INICIAR_INTERA.bat` y dejá abierta la ventana.
4. Se abre `http://127.0.0.1:4173`. Si no, ingresá esa dirección manualmente.

No abras `public/index.html` con doble clic: esta versión necesita el servidor para las cuentas, cotizaciones y pagos. No desactives CORS ni protecciones del navegador. Los lanzadores nativos de Windows/macOS no se ejecutaron en este entorno Linux.

En macOS/Linux: `sh INICIAR_INTERA.sh`. O desde terminal, dentro de la carpeta:

```sh
node -v
npm run setup
npm start
```

**No hay dependencias npm de ejecución.** `node:sqlite` está incluido en Node; Node 22.16 imprime una advertencia experimental. La versión de Node usada para las pruebas se documenta en el informe. Pinneá y validá la versión de despliegue.

## Recorrido local completo

En Inicio, seleccioná **1 · Activar a Mateo**. Aceptá las condiciones y elegí **Vincular Mercado Pago**: en modo MOCK la vinculación está expresamente simulada. Mateo ya tiene ofertas de ejemplo.

Luego seleccioná **2 · Contratar como Ana** (o Cambiar perfil de prueba), aceptá las condiciones, buscá **Tu compu, sin vueltas**, elegí cuatro bloques y un horario. Se crea una solicitud por $10.000.

Cambiá a Mateo, entrá en Mis servicios y aceptá. Volvé a Ana, abrí la orden y elegí Pagar: verás $10.000 bruto, $500 de INTERA y $9.500 antes de costos externos. Confirmá y elegí **Pago aprobado** en el simulador. El servidor concilia el resultado; no se acredita dinero real.

Probá el chat. Como Mateo, iniciá y marcá completado. Como Ana, confirmá y valorá. No hay segundo movimiento de fondos al completar. La primera valoración no se envía a la contraparte hasta que ambas hayan evaluado o pasen siete días.

Para probar una devolución, creá otra orden, aprobá su pago y cancelala **antes de iniciarla**. El worker procesa la devolución y la muestra confirmada solo después de consultar al proveedor simulado. El panel Pagos y cobros muestra el registro operativo.

## Funciones incluidas

- Inicio y catálogo monetarios, fotos ilustrativas, tema claro/oscuro, movimiento reducido, microinteracciones, favoritos con Deshacer y comparador de hasta tres servicios.
- Publicación/edición/pausa de ofertas; tres tarifas cerradas y aceptación expresa de comisión; vista previa del importe.
- Necesidades con presupuesto máximo; agenda personal y exportación ICS sin invitaciones.
- Registro 18+, email verificado, contraseñas scrypt, recuperación, sesiones de servidor y cookies HttpOnly. Verificación/correo simulados solo en MOCK; Resend en sandbox/live.
- Condiciones inmutables versionadas por hash, aceptación registrada y exigida del lado del servidor.
- Cotización congelada en cada orden, permisos por participante, disponibilidad sin solapamientos, ampliaciones separadas, chat, reviews ciegas, reportes y bloqueos.
- OAuth PKCE para cada prestador, tokens cifrados AES-GCM, refresh, Checkout Pro Preferences API con `marketplace_fee`, Webhooks HMAC y consulta a la API antes de confirmar.
- Conciliación de pago, orden comercial y preferencia; reintentos persistentes, devoluciones idempotentes, pagos duplicados/tardíos, contracargos y errores de resultado desconocido.
- Registro monetario en centavos enteros, asientos compensatorios, auditoría append-only, exportación de datos propios y CSV.
- CLI de operación para cola de trabajos, reclamos, devoluciones, conciliación, suspensiones y backup.

**Alcance deliberado de esta primera entrega monetaria: servicios remotos entre adultos.** Presencial, KYC de identidad INTERA y profesiones reguladas permanecen bloqueados. La identificación exigida por Mercado Pago a sus cuentas no equivale a implementar V2 de INTERA. No se prometen llamadas/video integrados, notificaciones push, facturación fiscal automática ni soporte humano provisto por el software.

## Mercado Pago real

Leé **[docs/MERCADOPAGO.md](docs/MERCADOPAGO.md)**. Incluye alta de aplicación, seller OAuth, firma Webhook, separación MOCK/SANDBOX/LIVE, requisitos de Split 1:1 y pruebas externas pendientes. No pegues secretos en el chat ni en el HTML.

Se entrega el código de integración, **no una conexión activada ni una prueba de acreditación real**. Los métodos de pago, identificación/eligibilidad, costos y plazos deben confirmarse con Mercado Pago. Las devoluciones pueden requerir saldo del vendedor. Aprobar condiciones no elimina derechos de consumidores ni obligaciones legales.

## Ejecutar pruebas

```sh
npm test
npm run check
```

`npm test` usa el runner incluido en Node y SQLite temporal; no llama proveedores reales. El QA de interfaz es opcional, usa Python + Playwright + requests como herramientas de desarrollo; ver `docs/qa/INFORME.md` y `tests/qa/browser.py`. El resultado HTTP/cookies se prueba además nativamente con el servidor. No confundir estas pruebas con certificación del PSP.

## Estructura

```text
public/                 Interfaz HTML/CSS/JS y recursos locales
server/domain/          Reglas de tarifa, dinero y validación
server/db/              SQLite, migración SQL, transacciones y trabajos
server/providers/       Mercado Pago real y proveedor MOCK separado
server/                 Auth, consentimiento, servicios, pagos, HTTP, worker
 tools/                 Inicio, setup, check y CLI administrativa
 tests/                 Dominio, integración HTTP, proveedor mock, operaciones, UI
 docs/                  API, economía, Mercado Pago, legal, seguridad, operación, QA
 .github/workflows/      Pipeline configurado (no ejecutado remotamente aquí)
 .env.example           Configuración sin secretos, por defecto MOCK
```

## Persistencia y operación

Un proceso Node por base en **disco local persistente**: `data/intera-mock.sqlite`, `intera-sandbox.sqlite` o `intera-live.sqlite`. SQLite usa WAL, transacciones inmediatas y bloqueo de proceso. No es un backend serverless ni de réplicas horizontales; antes de escalar migrá a PostgreSQL y reemplazá los locks en memoria por coordinación transaccional distribuida.

Los vencimientos y devoluciones siguen trabajando sin navegador abierto mientras el servidor y su worker estén operativos. Hace falta supervisión de proceso, HTTPS, monitoreo de trabajos fallidos, backups externos cifrados, pruebas de restauración y soporte humano. Ver **[docs/OPERACIONES.md](docs/OPERACIONES.md)**.

No se distribuyen bases, cuentas reales, tokens ni claves. La clave privada se almacena separada del respaldo; perderla impide descifrar las autorizaciones de vendedores.

## Migración de v4

**No se importan saldos, reviews ni perfiles ficticios como dinero o reputación real.** La base v5 es nueva y los ambientes no se mezclan. Conservá el HTML y los JSON de v4 como demostración histórica; no hay conversión automática de CT a ARS. Ver `docs/MIGRACION.md`.

## Límites para el lanzamiento

`LIVE_PAYMENTS_ENABLED=false`, `LEGAL_APPROVED=false` y `MP_MARKETPLACE_APPROVED=false` por defecto. LIVE exige identidad del operador, HTTPS, claves, correo real y el hash exacto del texto revisado. Estos flags son controles de despliegue: **no prueban aprobación jurídica, tributaria o comercial**. Ver `docs/READINESS.md` antes de abrir a usuarios reales.

## Historial Git incluido en el ZIP

La carpeta `historial/` del paquete contiene `INTERA-v5.bundle`: snapshot inicial v4 y rama actualizada `feat/paid-blocks-mercadopago`. Es un repositorio local exportado, no una URL de GitHub ni una publicación remota. Para recuperar ramas, commits y etiqueta, con Git instalado:

```sh
git clone -b feat/paid-blocks-mercadopago historial/INTERA-v5.bundle ../intera-con-historia
cd ../intera-con-historia
git log --oneline --all
```

El historial es opcional para ejecutar la app. El código de la carpeta principal ya corresponde a v5. La rama `main` del bundle conserva el snapshot histórico recibido, no la versión monetaria activa.
