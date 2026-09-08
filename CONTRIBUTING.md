# Desarrollo

Trabajar en ramas cortas y abrir PR antes de integrar cambios a una rama protegida. Este repositorio se entrega localmente: la CI, protección de ramas y revisión requieren configurar el repositorio remoto del titular.

Ejecutar `npm test` y `npm run check` antes de cada cambio de dominio y de cada entrega. Agregar tests de regresión para permisos, quote immutable, comisión exacta, consentimiento, callbacks, duplicados/refunds. No marcar APPROVED desde UI ni confiar en parámetros de regreso del checkout.

Los importes se expresan en centavos enteros en el servidor. Los valores que envía/recibe el proveedor se convierten con toCents: no reemplazar por multiplicaciones flotantes arbitrarias. Las tarifas publicables y el 5% de bruto son decisiones de producto explícitas; no cambiarlas silenciosamente.

MOCK no es un fallback del PSP. Si un proveedor real falla, conservar el estado desconocido y reintentar/conciliar de forma segura. Un test con MockMercadoPago no acredita el funcionamiento real de Mercado Pago.

Cambiar el texto de condiciones produce otro hash y obliga a una nueva aceptación. Mantener documentos anteriores y snapshots de contratos. No reescribir saldos/historial ni emitir bienvenida monetaria.

No versionar .env, bases SQLite, claves, exports personales ni logs con datos reales. Capturas y tests incluidos aquí contienen solo datos de prueba. Publicar imágenes de personas reales requiere la autorización y política correspondiente.
