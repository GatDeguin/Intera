# Seguridad y alcance de confianza

## Fronteras

El cliente HTML no es autoridad de identidad ni de pagos. Sesiones de servidor; comprobación del participante en cada orden; cotizaciones calculadas desde la publicación y congeladas; registro financiero en centavos; aceptación por hash exigida en operaciones. Cookies HttpOnly/SameSite y Secure en HTTPS. Request JSON + Origin + CSRF en escrituras. No hay tokens del PSP en la UI ni claves del integrador en recursos públicos.

La autorización al prestador usa OAuth state ligado a usuario y sesión, un solo uso y diez minutos, PKCE S256 y validación de país/cuenta/ambiente. Tokens de acceso y refresh cifrados AES-256-GCM, contexto autenticado por modo y usuario. El refresh no reactiva una cuenta pausada.

Webhook HMAC verifica data.id/ts/x-request-id, cuerpo compatible y ventana temporal. El parámetro seller no está firmado: se utiliza únicamente para localizar las credenciales con las que el backend consulta al proveedor. Propiedad, monto, moneda, modo, aplicación, orden comercial y preferencia se comprueban antes de actualizar. Repetir el evento no repite el efecto económico.

Los GET externos usan host fijo y no siguen redirects. Los enlaces de Checkout están restringidos a orígenes oficiales permitidos. No se habilita ninguna función para acreditar manualmente una orden como paid. La API de retorno del navegador solo redirige.

## Integridad monetaria

Tarifas allowlist, bloques enteros 1..32, regla 5% exacta. Trigger de cotización inmutable. Operaciones en SQLite BEGIN IMMEDIATE; un coordinador por base; idempotencia de solicitud/cobro, refund key estable, asientos append-only y suma cero. La política de resultado desconocido no inventa fallos ni éxitos: concilia.

La confirmación de la prestación no produce una liberación de dinero. Disputar un servicio bloquea su avance en INTERA, **no congela automáticamente fondos del vendedor en MP**. El registro propio muestra el bruto/fee pactado y guarda los importes/estado de disponibilidad informados por el proveedor. No es contabilidad fiscal ni prueba de saldo disponible.

Si un campo real difiere del contrato probado (por ejemplo fees tras reembolso), se detiene el procesamiento y queda evidencia del error para conciliar. La aprobación de sandbox del titular debe revisar todos esos mapeos antes de abrir live; no eliminar validaciones para ocultar discrepancias.

## Privacidad y contenido

Texto de usuario escapado al renderizar; CSP de scripts del mismo origen, sin inline JS; SVG propios estáticos. No se aceptan imágenes/adjuntos de usuarios todavía, para evitar sumar una superficie de carga sin escaneo. Las imágenes incluidas son demostraciones y no se aplican a perfiles reales nuevos.

El respaldo personal incluye solo el usuario y las órdenes a las que tiene acceso; las reviews ciegas de la contraparte no se envían antes de su revelación. No hay importación monetaria desde JSON. El estado económico v4 no se migra.

La ubicación se limita a barrio, sin direcciones exactas ni geolocalización. La edad se declara por fecha de nacimiento; **no hay prueba documental de edad**. Los controles de email tampoco prueban identidad física. Solo remoto adulto de bajo riesgo hasta contar con procesos adicionales.

## Administración, tasa y despliegue

No hay admin web abierto. Las acciones monetarias administrativas requieren OPERATOR_ID y confirmación en CLI; el acceso al host debe protegerse con cuentas individuales y MFA SSH. Quien obtiene acceso de escritura a la base o la clave del servidor puede comprometer el sistema: auditoría append-only no impide un atacante con privilegios de sistema.

Rate limits persistentes por hash de IP/usuario. No se confía en cabeceras de IP externas. Detrás de un reverse proxy todos pueden compartir la IP del proxy: agregar límites por cliente en el borde y ajustar un modelo de proxies confiables antes de un volumen público. No desactivar Origin/CSRF ni confiar en cualquier X-Forwarded-For para evitar ese límite.

Captura operativa de errores sin tokens/contraseñas. Jobs de correo cifrados; al completarse se borra el payload. Logs de proxy y sistema también deben enmascarar cookies, enlaces de verificación, códigos OAuth y querystrings sensibles. Se usa Referrer-Policy:no-referrer. Exportaciones administrativas contienen datos personales: protegerlas.

## Pendiente antes de producción

Revisión independiente de autorización, controles de abuso, protección de cuentas de alto valor, autenticación reforzada/MFA, antifraude real, observabilidad, alertas, guardia/soporte, retención, pedidos de supresión, pruebas de carga, recuperación de desastres y seguridad de proveedores. La aceptación de condiciones no constituye revisión legal ni una renuncia general del usuario a sus derechos.

La CI entregada ejecuta tests y sintaxis; no se afirma que hayan corrido CodeQL, pentest o escáner de secretos independiente. No hay secretos reales en esta entrega, pero el operador debe habilitar secret scanning y protección de ramas al publicar el repo.

Node y el sistema operativo deben mantenerse actualizados. `node:sqlite` de Node 22.16 emite advertencia experimental; pinnear una versión LTS validada y testear la actualización antes de despliegue. Una instancia SQLite no es alta disponibilidad; no usar funciones efímeras.
