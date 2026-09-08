# Mercado Pago · integración y activación

**Fecha de revisión documental: 8 de septiembre de 2026.** Implementación: Checkout Pro, **Preferences API**, Split 1:1. No se usa Checkout API Orders, no se mezclan sus contratos. Este archivo es configuración técnica, no un contrato de disponibilidad con Mercado Pago.

## 1. Qué está implementado y qué no ocurrió

Está implementado el adapter REST en `server/providers/mercadopago.mjs`, OAuth/PKCE y almacenamiento cifrado en `server/payments.mjs`, recepción de Webhooks en `server/http.mjs` y ejecución durable en `server/worker.mjs`. Las pruebas ejercitan esos contratos con respuestas sintéticas.

**No se recibió ninguna credencial tuya; no se autorizó tu cuenta ni cuentas de prestadores; no hubo un pago sandbox o real, devolución real, validación del Dashboard ni acreditación real en esta sesión.** No alcanza con cambiar tres flags para considerar aprobado un despliegue.

## 2. Flujo financiero exacto

1. El prestador abre una cuenta compatible de Mercado Pago Argentina y autoriza la aplicación de INTERA mediante OAuth.
2. INTERA conserva los tokens cifrados solo en el servidor.
3. La orden fija tarifa, cantidad de bloques, importe bruto y 5% de comisión. Se verifica precio y consentimiento en servidor.
4. Se crea una preferencia con el Access Token OAuth del vendedor y `marketplace_fee` como **importe en ARS**, no como porcentaje.
5. El comprador paga en la página de Mercado Pago. La plataforma no recibe tarjeta/CVV.
6. La notificación se autentica con HMAC, se guarda un trabajo y se responde rápido. El worker consulta el pago y verifica monto, moneda, modo, cobrador, referencia y orden comercial/preferencia de la aplicación.
7. Recién después se actualiza el registro de pago. El retorno `success` del navegador no acredita nada.
8. Mercado Pago maneja el split y la disponibilidad del dinero. Finalizar el servicio no llama a una API de liberación/retención: no se implementó escrow.

Ejemplo de 4 bloques a $2.500:

```json
{
  "items": [{"currency_id":"ARS","quantity":4,"unit_price":2500}],
  "marketplace_fee":500
}
```

El cliente paga $10.000. INTERA solicita $500 de comisión. Los $9.500 restantes son **antes de cargos externos**, no el neto final garantizado. El registro propio es operativo; reconciliar facturación y reportes del PSP por separado.

## 3. Requisitos externos a confirmar

La documentación de Split 1:1 exige cuenta de vendedor con identificación KYC 6, aplicación, credenciales y OAuth de los prestadores. Para modificar condiciones de liberación de comisión remite a soporte comercial. Esto no acredita automáticamente la verificación V2 de identidad dentro de INTERA.

La guía de integración consultada restringe Split 1:1 a dinero en cuenta entre cuentas Mercado Pago y excluye transferencias desde instituciones externas. **No se promete aceptación universal de tarjetas, cuotas o transferencias.** Confirmá con Mercado Pago los métodos que habilita para tu integración y valídalos en las cuentas reales antes de anunciar disponibilidad. El checkout es alojado y no se inventa un selector de medios en INTERA.

En reembolsos la documentación prevé reversión proporcional entre plataforma y prestador; falta de fondos del prestador puede impedir completar la devolución. El sistema deja el caso en proceso/fallido para intervención y no informa éxito sin evidencia del PSP. Un eventual reintegro por otro canal requiere procedimiento humano y conciliación separada; no existe un retiro arbitrario desde la app.

Fuentes oficiales: [prerrequisitos](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/prerequisites), [integración Split 1:1](https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace).

## 4. Preparar SANDBOX

Creá una aplicación en **Tus integraciones** de Mercado Pago con el producto compatible, cuentas de prueba separadas de comprador/vendedor/integrador y la modalidad de pruebas correspondiente. Confirmá con el proveedor los pasos de autorización disponibles para esas cuentas. No uses el Access Token de INTERA como sustituto del token de cada prestador.

Desplegá UNA instancia de Node con disco persistente y un dominio HTTPS de staging. Configurá:

```dotenv
PAYMENTS_MODE=sandbox
HOST=0.0.0.0
PORT=4173
APP_BASE_URL=https://beta.tu-dominio.com
DATA_DIR=/app/data
TOKEN_ENCRYPTION_KEY=VALOR_BASE64_DE_32_BYTES
MP_CLIENT_ID=ID_DE_LA_APLICACION
MP_CLIENT_SECRET=SECRETO_DE_LA_APLICACION
MP_WEBHOOK_SECRET=FIRMA_SECRETA_DEL_WEBHOOK
EMAIL_MODE=resend
EMAIL_FROM=INTERA <notificaciones@tu-dominio.com>
RESEND_API_KEY=CLAVE_DEL_CORREO
OPERATOR_LEGAL_NAME=RAZON_SOCIAL_DEL_OPERADOR
OPERATOR_CUIT=CUIT_DEL_OPERADOR
OPERATOR_ADDRESS=DOMICILIO_DEL_OPERADOR
SUPPORT_EMAIL=soporte@tu-dominio.com
LEGAL_APPROVED=false
MP_MARKETPLACE_APPROVED=false
LIVE_PAYMENTS_ENABLED=false
```

Los valores en mayúsculas son campos de configuración que debe completar el operador: no son credenciales válidas. No se incluye `.env` en la distribución. Generá la clave con:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Guardala en un gestor de secretos, no en Git. Reutilizá la misma clave al reiniciar la instancia; rotarla sin migrar ciphertext impide recuperar tokens. El token que devuelve OAuth debe tener `live_mode=false` en SANDBOX. Se envía `test_token=true` explícito.

### URLs a registrar

Para tu dominio real de staging, registrá exactamente:

- Redirect URI: `https://beta.tu-dominio.com/api/mp/oauth/callback`
- Webhook: `https://beta.tu-dominio.com/api/mp/webhook`
- Tema de notificación: **payment** para Checkout Pro Preferences.

La preferencia agrega `seller` y `source_news=webhooks` al notification_url por operación. Si se recibe el evento del Dashboard sin `seller`, se busca la cuenta vinculada por `body.user_id`; **ese campo nunca autoriza el pago**, solo sirve para consultar la API. Suscribirse a otros topics sin agregar sus verificadores específicos no está soportado por esta entrega. Los contracargos también se detectan mediante la consulta periódica del pago.

El reverse proxy debe conservar el `Host` público y permitir `x-signature`/`x-request-id`; el código no confía en un X-Forwarded-For arbitrario. Restricción por IP detrás de proxy: ver SEGURIDAD.md.

### Conectar y probar

Registrá usuarios, verificá sus correos y aceptá las condiciones. El prestador entra a **Soy prestador → Vincular Mercado Pago**. La autorización se enlaza con la sesión y un state de un solo uso; no hay ingreso manual de tokens de vendedores en el cliente.

Solicitá un servicio, aceptá como prestador y abrí Checkout Pro como comprador. Probá aprobado, pendiente, rechazado, vuelta sin pago, Webhook duplicado, retraso, credencial revocada, saldo insuficiente para devolución, pago duplicado y devolución completa/parcial. Verificá los reportes de **ambas cuentas** y la comisión del integrador, no solo una insignia verde de la app.

Fuente de OAuth: [creación](https://www.mercadopago.com.ar/developers/es/docs/security/oauth/creation), [renovación](https://www.mercadopago.com.ar/developers/en/docs/security/oauth/renewal). Fuente de notificaciones: [Webhooks](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/additional-content/notifications/webhooks).

## 5. Respuestas desconocidas y confirmaciones

La creación de preferencias no se reintenta a ciegas. Si se pierde la respuesta, queda `UNKNOWN`: se concilia por `external_reference`. Si aparece un pago, se valida además `merchant_order → preference_id → importe/marketplace_fee/collector/application_id` antes de recuperar la preferencia.

Si no hay pagos y no se recupera el checkout, el operador revisa el Dashboard, cancela la orden, espera el vencimiento de la preferencia y coordina una nueva solicitud. **No borrar intentos ni convertir `UNKNOWN` a `READY` editando SQL.** Los pagos tardíos a órdenes canceladas se destinan a devolución.

La validación estricta puede enviar a revisión una respuesta con campos ausentes o distintos de los contratos testeados. En SANDBOX se debe comprobar con la respuesta real el mapping de `application_id`, `merchant_order`, fees, refunds y metadata. Nunca resolverlo eliminando todas las verificaciones para que el checkout “pase”.

Los reembolsos usan un `X-Idempotency-Key` fijo. Primero se registra `REQUESTED`, luego se envían al PSP; solo la consulta confirmada habilita `COMPLETED`. La app no calcula la fecha real de acreditación: muestra `money_release_status` y `money_release_date` si el proveedor las informa.

## 6. Habilitar LIVE

Solo después de pasar el checklist de READINESS.md, configurar cuentas y obtener las revisiones profesionales:

1. Nueva base `intera-live.sqlite` y credenciales/firmas de LIVE, sin seed ni importación MOCK.
2. Definir la identidad exacta del operador, soporte efectivo y texto legal revisado.
3. Configurar `LEGAL_APPROVED=true`, `MP_MARKETPLACE_APPROVED=true`, `LIVE_PAYMENTS_ENABLED=true`; inicialmente sin iniciar el servidor.
4. Ejecutar `npm run admin -- legal-hash` con la configuración definitiva, comparar el texto y asignar el hash a `LEGAL_APPROVED_HASH`.
5. Arrancar. El servidor rechaza LIVE si faltan requisitos o el hash no corresponde al texto e identidad del operador.
6. Cada vendedor vuelve a autorizar en el ambiente de producción. Los tokens de prueba no se aceptan como LIVE.
7. Hacer una prueba controlada aprobada por los titulares de las cuentas, verificar split/acreditación/devolución real y recién entonces abrir cohortes.

**El cambio de flags no verifica por sí solo elegibilidad KYC, autorización comercial, revisión jurídica ni cumplimiento fiscal.** Esas evidencias debe obtenerlas y conservarlas el titular.
