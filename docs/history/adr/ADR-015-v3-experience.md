# ADR-015 · INTERA v3: experiencia mejorada, distribución compatible

**Estado:** implementado en la demo local. **Fecha:** 2026-09-05.

## Contexto

La v2 elimina la instalación y el servidor obligatorios. La nueva petición es mejorar esa experiencia, no introducir servicios externos, reconstruir el sistema económico ni afirmar que la demo es productiva.

## Decisión

Mantener un solo HTML con script clásico, estilos e íconos locales embebidos. Mantener el dominio y DemoService recibidos. Añadir módulos de experiencia de solo lectura (recomendaciones, selección comparativa, agenda, búsqueda) y un serializador ICS; cambios económicos siguen pasando por DemoService. No incorporar librerías o conexiones de terceros.

El esquema de respaldo y la clave de datos v2 no cambian; el paquete de interfaz es 0.3.0. Las preferencias visuales usan `intera.interface.v3` con recuperación segura si no hay almacenamiento. La selección del comparador se separa por perfil y permanece en memoria.

Propuestas sin aceptar no aparecen en agenda. Los ICS corresponden a acuerdos del perfil activo y se rotulan como DEMO; no son invitaciones ni notificaciones. Se serializan en UTC con CRLF, escape y plegado de líneas UTF-8.

## Alternativas y consecuencias

Un framework o CDN agregaría dependencias sin resolver el objetivo portable. Un backend habilitaría interacción real, pero requeriría otro alcance y controles de seguridad. La decisión mantiene apertura sin Node y simplifica revisión del código; no crea aislamiento multiusuario ni sincronización entre dispositivos.

Las recomendaciones son reglas transparentes basadas en categorías, necesidades declaradas y saldo; no predicciones de IA. El tema y las exportaciones no modifican CT. Los cambios de `hash` con diálogos se coordinan sin dejar eventos de cierre atrasados que invaliden un diálogo recién abierto.

## Recuperación y rollback

Guardar respaldo v2 antes de probar v3. Importarlo expresamente en v3 y conservar el original. Para volver a la interfaz anterior, usar el HTML v2 y el respaldo original. No depender de que distintos archivos compartan localStorage. No se envían ni migran datos por red.

## Verificación

Tests heredados más `tests/v3/`; navegador en `docs/qa-v3/browser-qa.py`. El alcance probado y los límites de file/PWA están documentados en `QA-REPORT-v3.md`.
