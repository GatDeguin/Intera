# INTERA v5 — Plan de implementación y decisión económica

## Alcance aprobado
Cambio solicitado por el propietario: 15 minutos por bloque; tarifas de ARS 1.000, 2.500 y 5.000 elegidas por el prestador; comisión total INTERA de 50/1000 = 5% del bruto de servicios. La comisión se deduce del importe del prestador, no se agrega al comprador. Costos de Mercado Pago y retenciones son independientes. Sin créditos de bienvenida, trueque, saldo convertible, wallet ni custodia propia.

## Arquitectura
Servidor Node 22.13+ ESM sin dependencias de npm; SQLite transaccional en disco para instalación de una instancia; interfaz HTML/CSS/JS con fotos y movimiento de v4. Integración REST Checkout Pro Preferences + Split 1:1 y OAuth de cada vendedor. La demora de acreditación es la que informe MP: confirmar el servicio no mueve fondos. Tres modos estrictos: mock local, sandbox y live. No hay conversión de respaldos v4.

No se puede ejecutar dinero real abriendo un HTML local: los secretos y las validaciones quedan en servidor. El cambio de arquitectura se limita a lo necesario para el cambio a pagos. SQLite requiere disco persistente, una sola instancia y backups; no desplegar esta edición en funciones efímeras ni escalar horizontalmente.

## Secuencia verificable
- [x] Economía: `server/domain/pricing.mjs`, validación de 3 tarifas, enteros en centavos y snapshots. `node --test tests/pricing.test.mjs`.
- [x] Persistencia y permisos: `server/db`, sesiones, aceptación por hash/versión, tokens cifrados, publicaciones, reservas. `node --test tests/service.test.mjs`.
- [x] MP: adapter REST, state + PKCE, refresh, preferencia, validación HMAC, consulta del pago, reembolsos idempotentes, jobs/reconciliación. `node --test tests/payments.test.mjs tests/mp.test.mjs`.
- [x] Aplicación: catálogo, calculadora, comparación, oferta/necesidad, contratación, panel del prestador, cobros, agenda, chat, valoraciones, reportes, condiciones, conexión de cuenta y aceptación obligatoria. `node --test tests/http.test.mjs` y QA de navegador.
- [x] Entrega: README, env, arranque Windows, Docker/CI, pruebas de restauración, documentación de API y operación, informe de verificación, repositorio con historia Git.

## Criterios de aceptación
Cotización de 4 bloques a $2.500: bruto $10.000, comisión $500, $9.500 antes de cargos MP. Ni request del cliente ni URL de retorno pueden marcar pago aprobado. Webhook firmado solo solicita una lectura a MP. Se valida moneda, monto, vendedor, referencia y ambiente. Repeticiones no duplican movimiento ni reembolso. Ninguna sesión puede consultar chats ajenos. Una condición cambiada obliga a reaceptar antes de contratar, publicar o cobrar; nunca bloquea logout, reporte, cancelación, reembolso o acceso a datos. Pagos y servicio tienen estados separados. Modo live no admite endpoints demo ni datos seed. Revisión legal, credenciales y prueba real externa son gates, no hechos cumplidos.

## Política operativa conservadora
Cancelación previa al inicio solicita devolución completa; no se trasladan multas en CT a pesos. Una disputa de servicio no congela fondos dentro de Mercado Pago. Resoluciones posteriores al inicio requieren operador autorizado y evidencia. Ampliaciones se cotizan como una nueva orden asociada y solo se autorizan al acreditarse su pago. La fórmula del servicio original no cambia. Mercado Pago no se sustituye por un simulador en sandbox/live.

## Estado externo
Credenciales del titular, OAuth y pruebas sandbox/live de Mercado Pago, despliegue público y aprobación profesional NO ejecutados. Se entregan adaptadores y documentación; esas activaciones no se marcan completas.
