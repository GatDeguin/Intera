# API de INTERA v5

Mismo origen que la web, prefijo `/api`. JSON UTF-8. Errores `{error: "mensaje", code: "CODIGO"}`. POST/PATCH requieren `Content-Type:application/json`, `Origin` exacto de APP_BASE_URL, cookie de sesión y `X-CSRF-Token`, salvo registro/login/recuperación. El Webhook tiene su autenticación HMAC separada. No se confía en precios, ID del usuario o estados enviados por la UI.

## Públicos / sesión

| Ruta | Método | Contenido |
|---|---|---|
| `/config` | GET | Versión, modo y configuración pública; nunca secretos |
| `/health` | GET | Disponibilidad del proceso/base |
| `/legal` | GET | Texto, hash y versión vigente |
| `/session` | GET | Usuario propio o null y token CSRF de la sesión |
| `/bootstrap` | GET | Catálogo/perfiles públicos; órdenes propias según sesión |
| `/auth/register` | POST | email, password, name, neighborhood, dob, conditions {accept,version,hash} |
| `/auth/login` | POST | email, password |
| `/auth/logout` | POST | Revoca sesión actual |
| `/auth/verify` | POST | token de un solo uso |
| `/auth/resend` | POST | Reenvío de verificación con límites |
| `/auth/forgot` | POST | email; respuesta genérica |
| `/auth/reset` | POST | token, password; revoca sesiones previas |
| `/terms/accept` | POST | accept:true, version y hash exactos |

Revisar `server/http.mjs` para el contrato ejecutable completo. El navegador recibe un perfil sanitizado, nunca password_hash, tokens OAuth ni claves de la base.

## Marketplace

`POST /offers`: title, description, category, modality='REMOTE', neighborhood, priceArs (1000/2500/5000), blocks (1..32), availability, sellerFeeAccepted=true.

`PATCH /offers/:id`: mismos campos para editar o solo `{active:false/true}` para pausar/reactivar una oferta propia.

`POST /needs`: title, description, category, maxPriceArs, blocks. `POST /needs/:id/close`: cerrar necesidad propia.

`POST /bookings` + `Idempotency-Key`:

```json
{
  "offerId":"id-de-publicacion",
  "blocks":4,
  "expectedPriceArs":2500,
  "scheduledAt":"2026-09-20T17:00:00-03:00",
  "notes":"Descripción de lo solicitado",
  "quoteAccepted":true,
  "termsHash":"hash-del-documento-vigente"
}
```

El servidor toma precio de la oferta, calcula gross/commission en centavos y congela esa cotización. Reusar clave con otro payload da `409`; reusar con el mismo retorna la orden original. Horario futuro y no más de 90 días; hasta 32 bloques. `needId` opcional propio, activo y compatible con categoría/presupuesto.

`GET /bookings/:id` solo participantes: acuerdo, chat, reviews autorizadas, pagos, devoluciones, ampliaciones y reclamos propios.

Acciones POST bajo `/bookings/:id/`:

- `accept`: solo prestador; bloqueo de disponibilidad; plazo de pago.
- `checkout`: comprador, `{accept:true,termsHash}`; devuelve URL oficial/attempt. No cobra directamente tarjeta.
- `reconcile`: encola consulta al proveedor; la UI no define el resultado.
- `start`, `complete`: prestador, pago aprobado; `confirm`: comprador, prestación completada. No transfieren fondos.
- `extension`: `{blocks}`; nueva orden ligada con misma tarifa y nuevo pago consentido.
- `cancel`: `{reason}` antes de inicio, o reclamo posterior. Encola devolución cuando corresponde.
- `messages`: `{body}`; texto máximo 2000 caracteres.
- `reviews`: `{rating:1..5,comment}`; una por rol tras completar y con pago aprobado, revelación bilateral/7 días.

Otros: `PATCH /profile`; `POST /favorites/:offerId`; `POST /blocks/:userId`; `POST /reports` con type/body/bookingId/subjectId; `GET /finances`; `GET /export` de datos propios. **No hay endpoint de importar saldos, ajustar una comisión arbitraria, marcar pagado ni administrar dinero desde el cliente.**

## Mercado Pago

- `POST /mp/connect`: inicia OAuth seguro o conexión MOCK explícita.
- `GET /mp/oauth/callback?state=...&code=...`: sesión igual a la del inicio, state válido y de un solo uso, PKCE y validación de país/identidad MP.
- `POST /mp/pause`: impide nuevos cobros; conserva tokens cifrados para conciliación y reintegros anteriores.
- `POST /mp/webhook?data.id=...`: HMAC x-signature + x-request-id, timestamps y cuerpo consistentes; recepción durable y GET proveedor.
- `GET /pago/retorno` está fuera de `/api`: redirige a una pantalla. Sus parámetros no actualizan estados.

## Solo MOCK

`POST /demo/login` selecciona exclusivamente perfiles `is_demo=true`. `POST /demo/pay/:bookingId` simula aprobado/pendiente/rechazado para el comprador actual con preferencia existente. Fuera de MOCK ambas rutas responden 404; el backend rechaza abrir MOCK en una interfaz pública. Las páginas indican “sin dinero real”.

## Códigos relevantes

401 sin sesión/firma; 403 sin permiso/CSRF/cuenta restringida; 404 privado o inexistente; 409 estado/precio/cuenta/horario/conflicto; 422 validación; 428 aceptación pendiente; 429 frecuencia; 502 respuesta del PSP no confirmada; 503 proveedor no configurado. Un timeout no demuestra que no haya cobro: revisar la orden y conciliar antes de reintentar.
