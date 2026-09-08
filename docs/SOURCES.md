# Fuentes y criterios de implementación

Consultadas el **8 de septiembre de 2026**. Son documentación pública, no confirmación de la habilitación particular de INTERA. Precios/tarifas de servicios y comisión INTERA provienen de la instrucción del titular, no de estas fuentes. No se copia una tabla histórica de cargos del PSP.

## Mercado Pago — fuentes primarias

- Split 1:1, alcance/países: https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/overview
- Prerrequisitos: https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/prerequisites
- Integración, token del vendedor, marketplace_fee, split y devoluciones: https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace
- OAuth, state, PKCE y test_token: https://www.mercadopago.com.ar/developers/es/docs/security/oauth/creation
- Renovación: https://www.mercadopago.com.ar/developers/en/docs/security/oauth/renewal
- Webhooks y confirmación por consulta: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/additional-content/notifications/webhooks
- API de pagos: https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-pro-preferences/get-payment/get
- Orden comercial/preferencia: https://www.mercadopago.com.ar/developers/en/reference/online-payments/checkout-pro/merchant_orders/update-merchant-order/put
- Ejemplo de asociación payment.order.id a merchant order: https://www.mercadopago.com.ar/developers/en/docs/checkout-bricks/additional-content/your-integrations/notifications/ipn
- Reembolsos idempotentes: https://www.mercadopago.com.ar/developers/en/reference/online-payments/checkout-pro/create-refund/post
- Vencimiento de preferencias: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/additional-settings/term-of-preference

Se usa HMAC de Webhooks, **no IPN** (esa página se consultó solo para entender la relación de orden comercial). API/mercado se deben revalidar con el contrato actual de las cuentas al activar. Las respuestas reales deben compararse con el schema probado; no se hicieron llamadas autenticadas reales en esta entrega.

## Otros proveedores y normativa

- Node SQLite nativo: https://nodejs.org/api/sqlite.html
- Resend send-email: https://resend.com/docs/api-reference/emails/send-email
- Resend idempotencia: https://resend.com/docs/dashboard/emails/idempotency-keys
- Defensa del consumidor, texto actualizado: https://www.argentina.gob.ar/normativa/nacional/ley-24240-638/actualizacion
- Protección de datos, texto actualizado: https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790/actualizacion

Los borradores legales no afirman exención de responsabilidad, exención de impuestos ni cumplimiento automático por aceptar un checkbox. La determinación del tratamiento jurídico y tributario concreto corresponde a revisión profesional antes de operar.
