# ADR-014 — INTERA v2, demo portable y experiencia renovada

## Contexto
El usuario pidió mejorar ampliamente el MVP existente después de encontrar bloqueos CORS al abrir `index.html` y fricción para instalar Node. Se conserva el alcance aprobado: demo local sin proveedores externos, economía 1 CT = 15 minutos y participantes ficticios.

## Decisión
Conservar el dominio modular e incorporar una distribución HTML única con CSS, scripts clásicos y marca embebidos. Los módulos fuente siguen siendo comprobables con Node, pero Node no es requisito del usuario final. PWA queda disponible en la distribución servida por HTTP local/HTTPS; no se solicita manifest ni service worker desde file://.

Renovar navegación, dashboard, tarjetas, búsqueda y filtros, publicación, acuerdo, seguimiento, chat, perfil, historial y ayuda. Añadir exportación/importación de datos, guardados, reportes locales, guías de demostración y advertencias explícitas. Fortalecer elegibilidad presencial, aislamiento del escrow, estados, reviews ciegas, expiración promocional y recuperación del almacenamiento.

## Límites
No se convierte en producción ni en un servicio multiusuario real. No hay verificación de identidad, envíos externos ni moderación humana. El almacenamiento local no es una barrera de seguridad contra el propietario del dispositivo. File:// no garantiza persistencia homogénea entre navegadores; se ofrece respaldo JSON y aviso visible cuando solo se dispone de memoria. La PWA se valida por separado y no se presenta como instalable desde un HTML local.

## Verificación prevista
Pruebas de dominio y regresión, integración de flujo completo, contrato del bundle y pruebas DOM/visuales inyectando el HTML en Chromium sin navegación a URLs bloqueadas. No modificar políticas del navegador. Documentar por separado lo comprobado y lo pendiente en Windows/file:// y service worker real.

## Migración
Estado v1 disponible en el mismo origen se importa sin destruirlo. Los respaldos se validan antes de sustituir datos. Cambiar de ubicación/navegador requiere importar JSON. La arquitectura productiva del protocolo original permanece fuera del alcance de esta entrega.
