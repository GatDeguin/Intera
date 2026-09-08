# ADR-016 — INTERA v4: aplicación fotográfica con movimiento progresivo

## Decisión aprobada
Implementar las maquetas presentadas como HTML autónomo, sobre el código de v3. Se conserva el motor de dominio, el formato de respaldo v2 y los perfiles ficticios. Las maquetas orientan el diseño, no reemplazan las reglas: 1 CT = 15 min; las ofertas continúan en categorías permitidas para adultos. No se incorporan servicios para menores o cuidado de personas, tarifas CT/h variables, ubicación GPS, identidad comprobada ni supuestas respuestas humanas.

## Implementación
1. Reutilizar y recortar las fotografías ilustrativas de las imágenes generadas en esta conversación. Incluirlas como WebP/data URI dentro del JavaScript empaquetado, sin solicitudes externas.
2. Ampliar la interfaz con fotografías en tarjetas, perfiles y vista rápida; rediseñar inicio y saldo, conservar rutas y controles de v3.
3. Agregar un controlador de movimiento separado del dominio: entradas breves, presión y ripple, favoritos con feedback y deshacer, saldo visual animado, celebración después de liberación efectiva, conversación y carrusel.
4. Guardar preferencias visuales fuera del respaldo económico. Respetar el ajuste de movimiento reducido del sistema y ofrecer desactivación manual. Cancelar animaciones cuando el documento esté oculto.
5. Mantener exactamente los datos económicos: no recalcular saldos con el contador visual y no bloquear acciones al desactivar animaciones.
6. Ejecutar los tests heredados, las regresiones nuevas y QA de Chromium sobre el HTML distribuible. Documentar la diferencia entre HTML inyectado y navegación nativa file://.

## Límites
Es una demo local, no hay backend, usuarios remotos, llamadas, KYC, moderación humana ni geolocalización. Las fotos son ilustrativas generadas; no prueban la identidad de los perfiles. No se incluyen fuentes externas. No se cambian políticas del navegador.

## Alternativas
Una captura estática no resuelve el pedido. Un framework externo agregaría instalación y dependencias al HTML. Una imagen CDN en tiempo de ejecución dejaría de ser autónoma.
