# Migración de banco de tiempo a servicios pagos

La instrucción del titular del proyecto del 8/9/2026 reemplaza las decisiones anteriores de igualdad temporal, CT no monetarios y ausencia de comisión. Las notas de arquitectura v2–v4 se conservan solo como historia en `docs/history/`. **No son reglas vigentes del marketplace monetario.**

## Decisiones v5

- Unidad: bloque de 15 minutos de un servicio específico; no una moneda transferible.
- Tarifa elegida por publicación: $1.000, $2.500 o $5.000 ARS/bloque. No se admiten valores libres.
- Total comprador: bloques × tarifa. Comisión total INTERA 5% del bruto, incluida, descontada al prestador. Cargos de MP separados.
- Pago mediante Checkout Pro + Split 1:1 a la cuenta vinculada del prestador y al integrador; sin custodiar ni prometer wallet/escrow.
- Acreditación informada por MP; completar una prestación no transfiere ni libera dinero.
- Cancelación antes del inicio: devolución total del pago restante, sujeta a ejecución verificable del proveedor. No se reutilizan automáticamente las penalidades económicas del antiguo CT. Posterior: revisión humana y derechos obligatorios.
- Mayoría de edad y primera cohorte remota. Presencial/V2 y categorías reguladas continúan detrás de un bloqueo, no se autohabilitan con un texto legal.

## Qué se conservó

Marca, iconografía, recursos fotográficos ilustrativos, microinteracciones y adaptación responsive; catálogo, necesidades, órdenes, mensajes, valoraciones, agenda y exportaciones, ahora reimplementados contra el backend monetario. Se conserva la intención de confianza local sin presentar la demo como actividad real.

## Qué se retiró

Billetera CT, bonos de bienvenida, donaciones de CT, equivalencias de horas iguales, reservas de créditos en localStorage, importación JSON económica y liberación a las 48 horas desde un navegador. No hay conversión automática de ningún crédito a pesos.

## Datos históricos

El código v4 recibido es la base histórica del primer commit local. La versión activa usa un esquema SQLite nuevo y archivos separados por ambiente. Los balances/reviews ficticios v4 no se migran. No se alteraron archivos originales entregados al usuario.

Para un eventual paso desde una base de datos REAL previa, se necesita un mapeo explícito de identidad y consentimientos, pruebas en una copia, respaldo verificado y conciliación de cada obligación; esta entrega no supone que esa base exista. Exportar datos personales no crea una orden real ni acredita reputación.

El repositorio no afirma disponibilidad o registro de la marca, dominio o estructura fiscal del operador.
