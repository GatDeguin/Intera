# ADR-017 · Marketplace ARS con Split 1:1

Estado: implementado, activación externa pendiente. Decisión económica explícita del usuario: 15 minutos; tres tarifas ARS; comisión 5% bruto. La aplicación anterior era una demo de CT local y no podía convertirse en autoridad monetaria confiable modificando solamente etiquetas.

Se reemplaza por un monolito Node con SQLite de un solo proceso, UI modular nativa y adaptadores separados real/mock. Cotización inmutable, aritmética entera y operaciones de PSP verificadas del lado del servidor. Se conserva el trabajo visual, no los balances ficticios.

Alternativas consideradas: recaudar todo en una cuenta de INTERA y enviar transferencias a terceros (mayor custodia/responsabilidad, no implementado); copiar CT a dinero en el navegador (descartado por integridad); PostgreSQL gestionado (mejor para escalado, requiere infraestructura/configuración externa para pruebas reproducibles).

Consecuencias: el despliegue debe tener disco persistente local, un único coordinador y supervisión. El HTML ya no es ejecutable por doble clic para operar pagos. No se promete escrow ni fecha de liberación distinta a MP. LIVE no está autorizado por entregar código o flags.

Migración futura: Store + SQL a PostgreSQL, transacciones y coordinación distribuida equivalentes; jobs dedicados; frontend conserva contratos HTTP. Antes del paso: pruebas de concurrencia sobre la base destino y reconciliación del historial; no generar saldos ni recrear pagos.
