# Acceso seguro del panel TheKing

## Estado

La preparacion actual es local. No se crearon cuentas, no se modifico Firebase en produccion y no se desplego ningun cambio. El panel requiere Firebase Authentication y un registro de autorizacion en Firestore; hasta completar esa configuracion, nadie podra entrar al panel nuevo.

## Modelo de acceso

- El panel admite inicio con Google para las cuentas existentes del proyecto, y correo/contrasena como alternativa. La recuperacion por correo aplica solo a cuentas creadas con ese proveedor.
- Cada cuenta autorizada necesita un documento `adminUsers/{uid}` con `active: true` y `role: "owner"` o `role: "secretary"`.
- La contrasena nunca se guarda en codigo ni en Firestore. El documento se administra desde una cuenta propietaria de Firebase; las reglas impiden que el usuario se otorgue permisos.
- El correo `*.local` del formulario anterior no es una direccion recuperable; usar correos reales controlados por el negocio.

## Configuracion pendiente del propietario

1. Recuperar la cuenta Google propietaria del proyecto Firebase mediante la recuperacion oficial de Google, o pedir a otro propietario del proyecto que invite una cuenta autorizada.
2. En Firebase Authentication, confirmar que Google siga habilitado. El proveedor correo/contrasena tambien esta soportado para cuentas creadas con correos reales.
3. En Firestore, crear un documento `adminUsers/{uid}` por persona, usando el UID de Authentication:

   ```json
   {
     "active": true,
     "role": "secretary"
   }
   ```

   Para el propietario, usar `"role": "owner"`. No agregar contrasenas al documento.
4. Antes de desplegar `firestore.rules`, inicializar `sorteo_publico/estado` con `total` igual al numero de documentos existentes en `sorteo_participantes`, `lastParticipantId` como cadena vacia y `updatedAt` como fecha/hora. Los participantes anteriores siguen en la coleccion privada y el panel los combina con los nuevos registros de `sorteo_contactos`. En `config/sorteo`, `ganador` debe contener solo `nombre`, nunca telefono. No desplegar reglas nuevas hasta verificar estos datos.
5. Probar inicio, cierre, recuperacion, permisos de secretaria/propietario y registro publico del sorteo en un entorno de prueba antes de cualquier publicacion.

La fuente de reglas seleccionada por `firebase.json` es `firestore.rules`. `firestore_reglas_semilla.txt` ya no es una fuente de reglas.

## Limitaciones conocidas

- Los contadores `stats_orders` y `stats_ratings` son de solo lectura para personal. Las escrituras desde el navegador no son confiables; para actualizar esas metricas hace falta un backend controlado, como Cloud Functions.
- El codigo anterior contenia una credencial local de demostracion. Se retiro de los archivos vigentes, pero el historial Git puede conservar versiones antiguas; debe rotarse cualquier credencial asociada cuando se recupere el control del proyecto.
