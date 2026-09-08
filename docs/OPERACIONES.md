# Operación de una instancia de INTERA

## Modelo de despliegue

Una instancia Node por base SQLite, disco persistente local y reverse proxy HTTPS. El bloqueo `.server.lock` impide otro coordinador sobre el mismo archivo. No montar SQLite/WAL en NFS o almacenamiento efímero ni ejecutar múltiples réplicas. Dockerfile es una receta; **no se construyó ni desplegó Docker en esta entrega**. Ejecución MOCK solo loopback; en un contenedor público configurar SANDBOX/LIVE, HTTPS y variables completas.

Ejemplo de proxy Nginx (ajustar dominio/certificados; configuración no ejecutada aquí):

```nginx
location / {
    proxy_pass http://127.0.0.1:4173;
    proxy_set_header Host $host;
    proxy_read_timeout 40s;
    client_max_body_size 64k;
}
```

Conservar Host público; TLS a cargo del proxy. Correr Node como usuario de sistema no privilegiado. Limitar SSH mediante MFA/VPN/grupos de acceso. No abrir el puerto interno a Internet. HSTS se envía para el origen HTTPS configurado.

## Administración

La administración es CLI del host, no una ruta web sin MFA. `OPERATOR_ID` identifica al operador en auditoría; el control de acceso efectivo lo realiza el sistema operativo/SSH. No compartir la cuenta del sistema entre operadores sin registros externos.

```sh
npm run admin -- status
npm run admin -- reports
npm run admin -- booking UUID_DE_ORDEN
npm run admin -- reconcile UUID_DE_ORDEN --confirm
npm run admin -- refund ID_MP 2500 "Reintegro autorizado por resolución del reclamo" --confirm
npm run admin -- retry-job UUID_DE_TRABAJO --confirm
npm run admin -- resolve-report UUID_DE_RECLAMO "Se informó al usuario la resolución y los próximos pasos" --confirm
```

refund y reconcile **encolan**, no se convierten en un segundo worker ni crean un token OAuth nuevo. El servidor debe seguir ejecutándose para procesar la cola. No editar `payments`, `bookings.primary_payment_id` ni el ledger para forzar un resultado.

`restore-service` sirve luego de cerrar todos los reclamos de servicio: restaura únicamente el estado que permiten sus timestamps previos, no el estado financiero. Si corresponde reintegro, solicitarlo aparte y verificar el PSP. `suspend/unsuspend` revocan sesiones y registran motivo; no destruyen derechos, historial ni reportes. Definir notificación y apelación con el equipo humano.

## Qué monitorear

- Salud HTTP `/api/health` y errores del proxy; no prueba salud del PSP ni calidad de soporte.
- `npm run admin -- status`: jobs FAILED/RUNNING atrasados, checkouts UNKNOWN, integridad de la base, foreign keys y asientos desbalanceados.
- Casos de dinero `PAYMENT_REVIEW`, `MEDIATION`, `CHARGED_BACK`, `REFUND_PENDING` sin resolución.
- Credenciales revocadas, correos fallidos, falta de saldo del vendedor y cambios de términos.

El worker ejecuta hasta 15 jobs por turno, cada 5 segundos, con leases, hasta 8 intentos y espera exponencial (tope una hora). Conciliación más frecuente antes de pago y aproximadamente horaria después. Un estado persistente desconocido exige revisión humana. Webhook se valida antes de guardar; los eventos antiguos se recuperan por conciliación en lugar de confiar en firmas fuera de ventana.

No se configuró un proveedor externo de alertas, Sentry, PostHog ni guardia humana. Conectar monitoreo del operador antes de publicar. Mantener reportes de MP para comparar comisión efectiva, reintegros y retenciones con la tabla operativa.

## Backup y restauración

```sh
npm run backup
# o:
npm run admin -- backup /ruta-segura/intera-snapshot.sqlite
```

Se usa `VACUUM INTO` para una copia consistente, no copiar solamente el archivo `.sqlite` mientras hay WAL activo. No se sobreescribe un backup existente. Almacenar snapshot cifrado, permisos limitados y copia fuera de la máquina.

**La clave TOKEN_ENCRYPTION_KEY y secretos de proveedores no van en el backup ni en Git.** Guardarlos en el vault del operador con política de recuperación. Sin la clave, las autorizaciones antiguas y mails pendientes no se descifran.

Restauración ensayada solo con datos sintéticos SQLite. Procedimiento real:

1. Detener el servidor de destino y confirmar ausencia de procesos.
2. Guardar una copia íntegra de su volumen y WAL/SHM como evidencia; nunca sobrescribir en caliente.
3. Restaurar el snapshot con el nombre exacto de ambiente en un **directorio vacío**; recuperar la misma clave por canal seguro. Nunca LIVE sobre MOCK.
4. Verificar permisos y ejecutar `npm run admin -- status`: quick_check=ok, foreignKeyErrors=0, unbalancedEntries=0.
5. Arrancar inicialmente sin tráfico de usuarios; conciliar con MP los pagos ocurridos después del punto de recuperación. El backup de INTERA no revierte pagos efectuados en el PSP.
6. Probar acceso, ofertas y una orden de prueba autorizada antes de abrir tráfico.

Definir RPO/RTO, retención y simulacros con evidencia antes de producción; esta entrega no promete valores operativos sin infraestructura.

## Reinicios y bloqueo

Usar SIGTERM/Ctrl+C: el servidor deja de aceptar conexiones, espera el trabajo en curso y libera el bloqueo. Tras un cierre abrupto, `unlock --confirm` solo elimina el bloqueo si el PID local ya no vive. En otro contenedor/host o PID reutilizado debe verificarse manualmente el volumen: no quitar el bloqueo con un servidor activo.

## Incidentes

Un checkout UNKNOWN no implica falta de cobro. No generar otro intento sin conciliación. Si falta saldo para devolver, conservar el caso abierto, avisar al usuario y coordinar fondos/reintegro con MP. Un contracargo congela el flujo operativo y crea asientos compensatorios; no lo “resolver” reenviando approved. Consultar el PSP y procedimiento profesional antes de decisiones que afecten dinero real.

Rollback: parar despliegue nuevo, conservar DB/WAL, volver a una versión compatible con el esquema. El esquema v5 no es compatible con el banco de CT v4. No restaurar v4 para operar ARS.

## Retención y privacidad

Se purgan sesiones, states OAuth y tokens de acceso temporal vencidos. No existe borrado automático integral de usuarios/chats/ledger en esta entrega: solicitudes de privacidad se reciben como reportes y el operador debe aplicar un procedimiento validado. Definir retención, minimización, backups y segregación antes de incorporar datos reales. Un export no debe incluir secretos o reviews todavía privadas para la contraparte.
