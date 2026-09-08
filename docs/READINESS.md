# Estado de preparación de INTERA v5

## Hecho en esta entrega

Código fuente de web/servidor y adaptador MP, aritmética ARS por bloques, condiciones versionadas y aceptación obligatoria, sesiones, verificaciones por correo, permisos, OAuth/PKCE cifrado, split de comisión, Webhook autenticado, conciliación, jobs persistentes, reembolsos, reportes/CLI, pruebas locales y respaldo/restauración sintética. Registro de resultados en docs/qa/INFORME.md.

## NO autorizado ni ejecutado por entregar este repo

- [ ] Credenciales reales de la aplicación del titular, Dashboard MP y aprobación de elegibilidad Split 1:1.
- [ ] Cuentas de prestadores con identificación requerida y OAuth real finalizado.
- [ ] Prueba sandbox del flujo completo, notificación real, mapping de merchant_order/fees y recuperación ante errores del PSP.
- [ ] Cobro controlado LIVE, acreditación en vendedor e integrador, costos/retenciones y devolución real.
- [ ] Abogado argentino: operador, T&C, defensa del consumidor, privacidad, intermediación, cancelaciones/reclamos, transferencias de datos, seguridad y retención.
- [ ] Contador: comisión, IVA incluido dentro de la comisión propia o desglose fiscal aprobado sin superar el 5% contratado, comprobantes y obligaciones de cada prestador.
- [ ] Titularidad/uso de marca y dominio; identidad y canal real de soporte.
- [ ] TLS, permisos del host, secreto de cifrado en vault, backup externo, RPO/RTO y simulacro en destino real.
- [ ] Soporte humano, apelaciones, reclamos de privacidad, manejo de contracargos/falta de fondos.
- [ ] Auditoría de seguridad independiente, pruebas de carga/concurrencia en infraestructura destino y monitoreo de jobs/alertas.
- [ ] Navegadores reales Windows/Edge/Firefox/Safari/iOS y flujo de cookies/HTTPS/OAuth nativo.
- [ ] Accesibilidad formal, lector de pantalla real, medición de rendimiento en dispositivos y red reales.

Las casillas no se tildan automáticamente con un flag. LEGAL_APPROVED_HASH asegura que el despliegue referencia el texto declarado revisado, no que un profesional lo haya aprobado.

## Alcance y diferencias frente a expectativas de “producción completa”

Esta es una **base ejecutable de integración**, no un servicio ya desplegado y autorizado para usuarios con dinero real. No hay cuenta de MP conectada en el sandbox de esta conversación. No hay URL pública de staging/producción ni repositorio GitHub remoto creado. Se entrega el repositorio local completo y un historial Git exportable.

No se agregaron cobros como botones decorativos: el adaptador real existe y los estados monetarios se ejecutan en servidor. El modo MOCK sirve para demostrar los flujos y no se reutiliza como fallback silencioso de SANDBOX/LIVE.

La monetización no habilita automáticamente presencial, oficios regulados, salud, menores, transportes o cuidado de personas. Solo servicios remotos para adultos. No hay video ni llamadas internas, carga de documentos, KYC propio, donaciones, billetera, retiros ni facturación fiscal automática.

## Criterio de apertura recomendado

Primero desplegar staging aislado, validar proveedores con cuentas de prueba y ejecutar una revisión técnica/profesional. Luego piloto cerrado remoto con soporte disponible, transacciones controladas autorizadas y límites de volumen. Abrir público solo con respaldo restaurable, operación verificable, resolución de fallas económicas y gates anteriores documentados.
