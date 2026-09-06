# INTERA v4 — Informe de pruebas

**Entrega:** demo HTML autocontenida / paquete 0.4.0. Este informe no certifica producción, seguridad multiusuario ni identidad real.

## Resultados finales

| Verificación | Resultado |
|---|---|
| `npm test` | 123 pruebas aprobadas; 0 fallidas, 0 omitidas |
| `npm run check` | 68 archivos JavaScript/MJS con sintaxis válida |
| `npm run build` | 32 módulos incorporados en un HTML de 452.765 bytes |
| `npm run e2e` | Recorrido de dominio aprobado; ya incluido en las 123 pruebas |
| Recorrido de interfaz | 394 comprobaciones aprobadas en Chromium 144.0.7559.96 |
| Interacciones específicas v4 | 71 comprobaciones aprobadas |
| Regresiones visuales/Deshacer | 7 comprobaciones aprobadas |
| Layout principal | 15 rutas × 5 anchos × 2 temas: 150 combinaciones, sin desborde horizontal del documento |
| Layout de diálogos | 3 diálogos × 5 anchos × 2 temas: 30 combinaciones |
| Excepciones JS / red durante los recorridos | 0 / 0 |
| Dominio y servicio de aplicación | 8 archivos idénticos por hash al código fuente v3 recibido |

Los conteos incluyen aserciones de navegación, renderizado y estado; no son certificaciones ni cientos de recorridos independientes. Las suites de navegador comparten controles. No sumar el E2E ejecutado aparte a la suite Node. Los anchos comprobados son 320, 390, 768, 1024 y 1440 px; temas claro y oscuro.

## Evidencias reproducibles

`final-suite.txt`, `final-check.txt`, `final-build.txt`, `final-e2e.txt`, `browser-final.txt`, `browser-report.json`, `layout-problems.json`, `interactions-final.txt`, `interactions-report.json`, `visual-regression-final.txt`, `domain-preservation.json` y `package-verification.json`.

Scripts: `browser-qa.py`, `interactions-qa.py`, `visual-regression.py`. Capturas de la app renderizada: `home-desktop-top.png`, `home-mobile-top.png`, `home-dark-mobile.png`, `explore-desktop.png`, `explore-mobile.png`, `exchange-desktop.png`, `agenda-desktop.png`, `comparison-desktop.png` y `publish-desktop.png`. Las capturas full-page de rutas desplazadas pueden ubicar las barras fijas en la posición actual del viewport; no son imágenes de diseño generadas.

## Método y alcance

El HTML construido se ejecutó en Chromium mediante `page.set_content` en `about:blank`. No se modificó ni eludió la política organizacional del navegador. Esta técnica verifica JavaScript, DOM, interacción, layout y descargas; no equivale a abrir un archivo mediante doble clic en Windows.

El recorrido preserva la demo v3 y verifica las funciones nuevas de v4. Las fotografías proceden de las maquetas generadas suministradas; no hay fotografías obtenidas de usuarios reales ni servicios de terceros para cargarlas.

## Cobertura nueva

Fotos incrustadas decodificadas; vista rápida con CT y elegibilidad; cierre por Escape y recuperación del foco; favoritos con Deshacer operativo; carrusel por botón y teclado; selector de barrio y filtro móvil visible; ripple finito; hover; contador de saldo exacto; movimiento reducido del sistema aplicado en vivo; cancelación de efectos al desactivarlos; sugerencias y emojis que no envían el borrador; contador de texto; celebración únicamente tras confirmar y liberar CT, con limpieza posterior.

Los diálogos de vista rápida, ajustes visuales y barrios se midieron en cinco anchos y ambos temas. El acceso de barrios en el header está oculto en móvil: para medir ese diálogo se usa clic DOM al control heredado, no se presenta como interacción móvil visible; el selector de barrio del catálogo sí se probó mediante su control visible.

## Regresión del producto

Ana solicita 2 CT / 30 minutos a Mateo; Mateo acepta y reserva; inicio; chat; finalización del prestador; confirmación de Ana y liberación; valoraciones privadas hasta completar ambas partes. Búsqueda, comparación sin tocar el ledger, publicación con borrador, pausa/reactivación, agenda, exportación ICS, elegibilidad V1/presencial, favoritos, importación de respaldo v2 y restablecimiento con confirmación.

Los tests heredados cubren saldos en cuartos de CT, no negativos, aislamiento de reservas, idempotencia, promociones, extensiones, cancelaciones, ausencias, disputas, revisión bilateral, vencimientos y respaldos. No se afirma implementación de toda la fórmula reputacional/antifraude del protocolo productivo.

## Problemas encontrados y corregidos

Un selector flex ampliaba la insignia de demo. Una regla de la versión anterior quitaba contraste al nombre de perfil. La especificidad CSS impedía posicionar la ilustración comunitaria en móvil y el resumen de actividad retenía un grid innecesario. El enlace extendido del título interceptaba los clics de la vista rápida. La pila de avisos heredaba `pointer-events:none`: se habilitó el botón Deshacer y se acotó su aviso a la última acción vigente. Se verificó cada corrección con casos que fallaban antes.

Los archivos `*-red.*`, `*-initial.*`, `browser-second.txt` y `browser-third.txt` documentan estados intermedios y correcciones de scripts de QA. Las referencias de aceptación son los logs finales y los reportes JSON; un error de un test exploratorio no significa que persista en el HTML final.

## Límites

No se probaron doble clic nativo de Windows/macOS, `.bat` en Windows, persistencia real `file://` entre sesiones, Safari/Firefox/Edge/iOS, instalación PWA ni funcionamiento real del service worker sin conexión. El fallback temporal y la persistencia se cubren con repositorios de prueba, no con todos los navegadores.

No se ejecutaron auditoría WCAG completa, lector de pantalla real, Lighthouse, prueba de carga, pentest independiente ni despliegue productivo. La ausencia de desborde horizontal no equivale a una auditoría visual completa. Se inspeccionaron capturas de escritorio, móvil, tema oscuro, catálogo y detalle de intercambio.

No hay backend, autenticación, KYC, dinero, soporte humano, usuarios conectados ni reputación certificada. Los datos y las imágenes son ilustrativos. El HTML local y su almacenamiento no constituyen controles de seguridad productivos. Conservar un respaldo JSON antes de cambiar de archivo o cerrar una sesión temporal.
