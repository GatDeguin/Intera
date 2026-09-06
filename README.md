# INTERA v4 — Experiencia HTML autocontenida

**Demo local funcional. Sin instalación para abrirla.** La interfaz, las imágenes y el JavaScript están incluidos en `INTERA.html`. No es una captura ni una maqueta estática.

## Abrir

Guardá `INTERA.html` y abrilo con un navegador. En Windows también podés usar `ABRIR_INTERA.bat`, después de descomprimir el paquete. No necesitás Node.js, npm, extensiones, fuentes ni dependencias para probar este HTML.

Si se abre en un editor, elegí **Abrir con → tu navegador**. No desactives la seguridad del navegador. No hace falta un servidor: no se cargan módulos JavaScript, hojas de estilo ni fotografías externas al abrir el archivo.

**Primer recorrido:** Inicio → Probar el recorrido → Empezar con Ana. Enviale una propuesta de 30 minutos a Mateo, cambiá al perfil de Mateo para aceptar, iniciá el intercambio, escribí un mensaje y marcá el servicio como completado. Volvé a Ana para confirmar y liberar los 2 CT. Cada parte puede valorar después. Los cambios de perfil están señalados como demostración.

## Qué incluye

- Inicio rediseñado con fotografías ilustrativas, saldo y próxima acción real según el estado local.
- Catálogo, búsqueda sin tildes, filtros por categoría, barrio, duración, modalidad y saldo.
- Tarjetas fotográficas, vista rápida operativa, guardar con **Deshacer**, comparador de hasta tres habilidades y carrusel con deslizamiento y controles de teclado.
- Publicación de ofertas y necesidades, vista previa del formulario, edición de perfiles ficticios, pausa/reactivación y comunidad por barrio.
- Propuesta, reserva de CT por intercambio, aceptación, inicio, chat local, extensión aprobada por ambas partes, finalización, confirmación y valoración bilateral.
- Cancelaciones, ausencias y disputas de ejemplo; reportes y bloqueo locales.
- Agenda y exportación `.ics`, mensajes, actividad pendiente, historial de CT y CSV.
- Exportación/importación JSON, confirmación antes de reemplazar datos y protección ante respaldos malformados.
- Tema claro/oscuro; panel **Experiencia visual** con animaciones adaptadas al sistema, movimiento reducido o desactivado.

### Animaciones y microinteracciones implementadas

Entradas escalonadas de contenido y diálogos; elevación de tarjetas; brillo breve de bienvenida en el saldo; contador visual que termina en el valor exacto; ripple al pulsar controles; respuesta del corazón de guardado y de la comparación; entrada de mensajes reales; confeti breve **solo después de confirmar y liberar los CT de la demo**. Los botones del carrusel reflejan sus límites.

No hay carga simulada con espera artificial, audio, vibraciones, video automático, respuestas de personas ficticias ni estados de presencia inventados. Las respuestas sugeridas y los emojis solo editan el borrador del chat: **no se envían hasta pulsar Enviar**.

El modo reducido del sistema prevalece sobre las preferencias de movimiento completo. Desactivar animaciones cancela los efectos pendientes y deja el saldo final visible. Las animaciones no modifican el ledger.

### Teclado y accesos

`Ctrl+K` / `Cmd+K`: búsqueda rápida. `/`: búsqueda cuando no estás escribiendo. Flechas y Enter: recorrer y abrir resultados. Escape: cerrar diálogos. Flechas izquierda/derecha: mover el carrusel cuando tiene el foco. El botón de ajustes visuales está disponible también en celular.

## Reglas que no cambian

**1 Crédito de Tiempo (CT) = 15 minutos.** Cuatro CT equivalen a una hora para cualquier habilidad. Los servicios se acuerdan en CT enteros; ajustes y cancelaciones usan cuartos de CT. No se compran CT, no se convierten a dinero y no se permite saldo negativo. El saldo disponible es distinto de los CT reservados. La bienvenida de 4 CT es de ejemplo, única por perfil y con vencimiento.

La verificación es simulada. El presencial conserva los controles V2 de demo para ambas partes. No se habilitaron menores, cuidado de personas, salud ni otras categorías excluidas del alcance.

Las ilustraciones de referencia contenían tarifas variables por hora y categorías fuera del MVP; esas inconsistencias visuales **no se trasladaron a las reglas del producto**. En esta versión no se muestran distancias GPS inventadas, calificaciones ficticias como reputación real, llamadas, videollamadas ni un mapa sin datos.

## Guardar y recuperar

El archivo intenta usar almacenamiento local del navegador. Si el navegador lo impide, se indica **sesión temporal** y los cambios solo viven en la pestaña. Cambiar el nombre/ubicación del HTML, usar otro navegador o borrar sus datos puede cambiar el almacenamiento accesible.

**Exportá un JSON desde Centro de demo → Exportar respaldo antes de cerrar, mover o actualizar.** Para pasar de v2/v3 a v4: conservá el HTML anterior y su respaldo; en v4 elegí Importar respaldo, revisá el resumen y confirmá. No borres el JSON hasta verificar lo recuperado. La compatibilidad conserva `intera-demo-backup`, versión 2; no es un error de numeración.

La preferencia de tema/movimiento se guarda aparte del estado económico. El comparador y los borradores pertenecen a la sesión de interfaz; no forman parte del respaldo económico.

## Imágenes

Las escenas y los retratos son **imágenes ilustrativas generadas**, recortadas de las tres maquetas de INTERA presentes en esta conversación. No representan usuarios reales ni acreditan identidad, experiencia, reputación o servicios prestados. Hay 11 recursos WebP locales; algunas tarjetas reutilizan la escena de su categoría. Los perfiles sin un retrato propio conservan sus iniciales.

`assets/photos/provenance.json` documenta los recortes y `src/interface/media-data.js` contiene los datos incrustados. La copia fuente incorpora las imágenes preparadas: no es necesario regenerarlas para construir el HTML. No se distribuyen fuentes tipográficas.

## Modo demo local: límites de esta entrega

Es una demo de navegador, no un servicio productivo. No hay backend de negocio, autenticación real, usuarios conectados entre dispositivos, KYC, dinero, llamadas, soporte humano ni moderación real. Un HTML local editable no es una autoridad segura para créditos o reputación.

El chat, las valoraciones, los acuerdos y los reportes quedan dentro de la demo. No ingreses DNI, contraseñas, domicilios ni información de terceras personas. Los reportes no avisan a servicios de emergencia. Los eventos de calendario llevan marca DEMO y no envían invitaciones.

La QA automatizada se ejecuta en Chromium con el HTML cargado en memoria. No equivale a una prueba de doble clic en Windows, persistencia nativa `file://`, Safari/Firefox/iOS o instalación PWA. Detalle y evidencias: `docs/qa-v4/QA-REPORT-v4.md` en la fuente; `INFORME_DE_PRUEBAS.md` en la distribución.

## Código fuente y verificación

Solo para desarrollar: Node.js 22+ y comandos sin instalación de paquetes. No hace falta ejecutar `npm install`.

```sh
npm test
npm run check
npm run build
npm run e2e
```

`npm test` incluye el recorrido de dominio E2E; no sumar `npm run e2e` como una suite adicional. El build genera el mismo HTML en `index.html`, `INTERA.html` y `dist/`. El empaquetador resuelve imports durante la construcción; el archivo entregado usa un único script clásico sin `eval` ni imports en tiempo de ejecución.

Para QA de interfaz, con Python, Playwright y Chromium disponibles:

```sh
python docs/qa-v4/browser-qa.py
python docs/qa-v4/interactions-qa.py
python docs/qa-v4/visual-regression.py
```

Estas herramientas de QA no son dependencias del archivo que abre el usuario. No se modifica la política administrada del navegador.

### Servidor/PWA opcional

`npm run dev`, `node tools/server.mjs` o `INICIAR_SERVIDOR.bat` sirven la demo en `http://127.0.0.1:4173`. Ese modo opcional sí necesita Node, no afecta a la apertura directa. Manifiesto y service worker se registran únicamente por HTTP/HTTPS; nunca al abrir el archivo `file://`.

El servidor escucha solo en loopback y permite una lista acotada de archivos. No conecta dispositivos ni sincroniza datos. La distribución incluye los archivos de PWA, pero no se certifica instalación o funcionamiento offline de su service worker en dispositivos reales.

## Organización

`src/domain`: reglas económicas; `src/application`: casos de uso; `src/persistence`: guardado y respaldos; `src/demo`: perfiles ficticios; `src/interface`: vistas, fotos y movimiento; `assets`: recursos locales y estilos; `tests`: verificaciones; `tools`: construcción/servidor; `docs/qa-v4`: evidencia y límites.

La implementación de v4 conserva el dominio y el servicio de aplicación de v3. Se modifica la experiencia de presentación, no el valor temporal de las habilidades.
