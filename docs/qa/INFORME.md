# INTERA v5 — Informe de verificación

**Fecha:** 8 de septiembre de 2026. **Versión:** 5.0.0. Alcance: repositorio del marketplace ARS con proveedor MOCK y adaptador real no activado. No certifica producción ni la conexión con una cuenta Mercado Pago.

## Resultados medidos

| Comprobación | Resultado |
|---|---|
| `npm test` | 79 pruebas, 79 aprobadas, 0 fallidas, 0 omitidas |
| `npm run check` | 41 archivos JavaScript/MJS con sintaxis válida |
| Navegador Chromium | 172 comprobaciones de UI/layout aprobadas; 0 excepciones JS |
| Layout | 15 rutas × 5 anchos (320/390/768/1024/1440) × 2 temas = 150 combinaciones dentro de las 172 comprobaciones |
| Backend en recorrido de navegador | 829 solicitudes HTTP locales a la instancia MOCK mediante puente de QA |
| Restauración | Snapshot SQLite sintético restaurado con foreign keys válidas e integridad; no constituye restore de infraestructura productiva |
| Paquete extraído | 79 pruebas y 41 archivos válidos; recorrido HTTP nativo de 12 comprobaciones en MOCK |
| PSP externo | **0** cobros, autorizaciones OAuth o devoluciones reales/sandbox ejecutados |

Los conteos no se suman como casos independientes de aceptación productiva. La suite de 79 reemplaza las antiguas pruebas CT; no se conservan sus cifras como prueba del nuevo modelo. Los tests usan respuestas mock para Mercado Pago. El pipeline GitHub se configuró, pero no se ejecutó remotamente. Docker y lanzadores Windows/macOS no se ejecutaron.

## Cobertura de la suite

Tres tarifas exactas, centavos enteros, 5% bruto, cantidades inválidas, cotización congelada, precio cambiado, necesidad compatible y presupuesto máximo; condiciones/versión/hash obligatorios, mayoría de edad, scrypt, correo de un uso, sesiones y recuperación que revoca acceso; permisos de cada rol, privado entre usuarios, ocultación de reviews antes de la revelación.

OAuth state asociado a usuario/sesión, consumo único y PKCE; tokens cifrados con contexto autenticado, renovación que no reactiva cobros pausados, metadata saneada; preferencias con token del vendedor y marketplace_fee como monto, URL de checkout controlada, orden comercial y preferencia asociadas a la aplicación, HMAC válido/inválido y cuerpo inconsistente.

Pagos pendientes/rechazados/aprobados, propiedades erróneas, conciliación idempotente, pagos duplicados/tardíos, timeout de preferencia sin reintento ciego, cancelación, reembolso total/parcial, contracargo terminal, fechas antiguas, extensión separada, no liberar dinero al confirmar prestación. Asientos compensatorios, snapshot SQL inmutable y backup consistente.

Pruebas HTTP nativas: cookies/sesión, Origin/CSRF, autorización, archivos privados, aceptación obligatoria aun con flags falsos en el request, retorno de pago sin efectos, Webhook durable y deduplicado, endpoints de demo ausentes fuera de MOCK. Worker ejecuta vencimiento/conciliación/refund sin intervención del navegador. Backup, restauración y exclusión de dos coordinadores para la misma base.

## Recorrido de UI

Activar Mateo → aceptar condiciones → conectar cuenta MOCK → publicar tarifa $5.000 y verificar desglose → cambiar a Ana → aceptar condiciones → buscar y abrir vista rápida → solicitar cuatro bloques de $2.500 → Mateo acepta → Ana acepta cotización y paga en simulador → pago validado en servidor → chat con texto HTML escapado → Mateo inicia/completa → Ana confirma sin transferir otra vez → reviews ciegas y revelación → movimientos, comparación, favoritos, buscador y matriz responsive.

No se presentan fotos como personas reales ni una conexión MOCK como autorización de Mercado Pago.

## Método de navegador y límites

La política organizacional del Chromium de este entorno bloquea la navegación a URLs locales y `file://`. **No se modificó ni eludió esa política.** El HTML/CSS/JS se cargó en `about:blank` mediante `page.set_content`. Un bundle exclusivo de QA reúne los módulos sin cambiar el código servido al usuario.

Las llamadas del frontend se enviaron por un puente explícito Python/requests a un servidor HTTP local real; las imágenes se cargaron en memoria desde los archivos. El puente conserva cookies del cliente de prueba y configura los headers; por eso **no demuestra el comportamiento nativo del navegador frente a cookies/CSRF/CORS/CSP/HTTPS ni redirecciones OAuth de Mercado Pago**. Los controles de la API se verifican adicionalmente con HTTP nativo en Node.

No se ejecutó Mercado Pago sandbox/live ni Resend real. No se midieron Lighthouse, carga concurrente a escala, API p95, lector de pantalla o auditoría WCAG formal, ni se hizo pentest independiente. No hay soporte humano ni despliegue productivo instalado. Fotos ilustrativas reutilizadas de las maquetas proporcionadas; sin archivos de fuentes.

Las capturas full-page muestran las barras fijas en la ubicación de la ventana de captura: no deben interpretarse como un diseño en el que la barra se fija en medio de la página.

## Problemas encontrados y corregidos

Durante la implementación: validación incorrecta de safeId usada como valor; cantidad de parámetros SQL; ofertas pausadas visibles para terceros; pausa de MP perdida al refrescar un token; quote mutable por SQL; actualización contradictoria después de contracargo; enlaces de reset simultáneos e igualdad de strings multibyte; cambio de estado de disputa antes de validar su texto; presupuesto de necesidad ignorado. Se agregaron pruebas de regresión y los casos pasaron.

Durante UI: selector de formulario ambiguo con meta description y comparación de moneda sin considerar espacios no separables (se corrigió el test); falta de crypto.randomUUID en el contexto de memoria (se agregó fallback a getRandomValues criptográfico, jamás Math.random); rutas de hash independientes del origen de QA. Los archivos `*red*`, `*initial*`, `browser-second/third/fourth` y `failure.png` son evidencia intermedia, no la entrega final.

## Reproducción

```sh
npm test
npm run check
node tools/qa-bundle.mjs
```

Para UI: servidor MOCK limpio separado en puerto 4180 con DATA_DIR temporal. Luego `python tests/qa/browser.py http://127.0.0.1:4180`. Requiere Python/requests/Playwright y Chromium en `/usr/bin/chromium`, solo para QA. No borrar una base con datos reales para repetir una prueba.

Evidencia final: `final-suite.txt`, `final-check.txt`, `browser-final.txt`, `browser-report.json`, capturas en `screenshots/` y `package-smoke.json`/`package-validation.json` para la comprobación desde el paquete extraído. El smoke del paquete es MOCK, no acreditación externa.
