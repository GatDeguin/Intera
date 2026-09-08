# Changelog

## 5.0.0 — 2026-09-08

Cambio económico solicitado por el titular: bloques de 15 minutos a $1.000/$2.500/$5.000 ARS, comisión total propia 5% bruto. Plataforma intermediaria con OAuth de prestador y Mercado Pago Split 1:1. No convierte créditos viejos en dinero.

Reemplaza el backend local en navegador por Node + SQLite en servidor, autenticación/consentimiento, autorización por participante, snapshots de precio y registro monetario. Integra Checkout Pro Preferences, Webhooks HMAC, validación de orden comercial, conciliación durable, cancelación/reembolso/contracargos. Separa estado del servicio y acreditación.

Rediseña la navegación y las vistas para ARS: catálogo, publicación, contratación, detalle, pago, prestador y movimientos. Conserva recursos visuales/movimiento accesible, comparación, favoritos, necesidades, chat, reviews, agenda y exportaciones. Agrega operación CLI, backup, plantilla de configuración, CI y documentación de puesta en marcha.

Configuración por defecto MOCK, sin cobros reales y restringida a loopback. SANDBOX/LIVE no disponen de endpoints de simulación y parten de bases separadas. LIVE exige configuración y aprobación declarada/hashiada de condiciones. Pruebas externas del PSP, despliegue y validaciones profesionales pendientes.

## 4.x — histórico

Demo autocontenida de intercambio de Créditos de Tiempo, sin autoridad de servidor sobre dinero. El snapshot recibido permanece en el historial Git; no se ejecuta como modo alternativo del marketplace v5.
