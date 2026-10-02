# ⚡ LA TRINIDAD - TESIS PRÁCTICA: SEMILLA SOCIAL & AUDIO

## 1. El Concepto de "Semilla-IA" (Soberanía y Aislamiento)
En base a la Tesis #2, cada cliente que entra a The King Burger no es solo una "fila" en una base de datos gigante. Es una **Semilla** viva.
* **Aislamiento Seguro:** Cada Semilla vive en su propia cápsula (`/semillas/{uid}`). Nadie más puede entrar a alterar su ADN (sus datos personales, su historial de Tetrix, sus métodos de pago) excepto el dueño de la Semilla (el cliente) y el Celador Universal (nuestra lógica backend).
* **Backup Orgánico:** Esta semilla crece. El cliente podrá exportar su estado y guardarlo en su propio ecosistema (Gmail / Drive), manteniendo la Soberanía Absoluta propuesta en el Manifiesto.

## 2. La Estructura de Datos en Firestore (El Orbe Universal)

```javascript
// 1. CÁPSULAS DE ALMA (Usuarios / Semillas)
/semillas/{uid}
    -> ADN: { nombre, telefono, email, fotoURL }
    -> Estadisticas: { coronas_ganadas, nivel_tetrix, hamburguesa_fav }
    -> Preferencias: { notificaciones_activas, tema }
    -> timestamps: { creado, ultima_sincronizacion }

// 2. EL MURO (Red Social - Publicaciones de la Comunidad)
/social_posts/{postId}
    -> autor_uid: "1234..."
    -> autor_nombre: "r1ch0n"
    -> fotoURL: "link-a-firebase-storage" (Opcional, la foto comiendo TheKing)
    -> texto: "¡Qué locura esta Ragnar!"
    -> likes: 14
    -> timestamp: serverTimestamp()

// 3. COMENTARIOS ORGÁNICOS (Audio y Texto)
/social_posts/{postId}/comments/{commentId}
    -> autor_uid: "9876..."
    -> autor_nombre: "Verix"
    -> tipo: "audio" | "texto"
    -> contenido: "link-a-firebase-storage-audio.webm" | "¡Tremendo!"
    -> timestamp: serverTimestamp()
```

## 3. Firebase Cloud Storage (El Almacén de Ecos)
Para soportar fotos y, más importante aún, **los comentarios de audio**, abrimos sectores protegidos en el Storage:
```text
/publicaciones_fotos/{uid}/{foto_id}.jpg
/comentarios_audio/{postId}/{uid}_{timestamp}.webm
```
* **Regla de Seguridad:** Solo los usuarios logueados (Cápsulas Autenticadas) pueden subir audios/fotos. Cualquiera puede leerlos.

## 4. El Flujo del Comentario de Audio (Micro-Interacción P2P)
1. **Grabación:** El usuario mantiene apretado un botón `🎤` en la web. Usamos `MediaRecorder` del navegador (HTML5).
2. **Subida (Upload):** Al soltar, el audio (`.webm` o `.mp3`) se dispara directo al Celador de Storage de Firebase.
3. **Invocación (Publicación):** El link de descarga pública de ese audio se guarda en la colección de comentarios. 
4. **Reproducción (Ecos):** Cuando otros clientes abran el post, verán un mini-reproductor con la forma de onda de voz del comentario y podrán escuchar el mensaje de sus hermanos de comunidad.

## 5. El Próximo Paso
Construir `js/semilla-social.js`: El motor que unirá la interfaz de la web con esta nueva estructura de datos. Y luego, habilitar Firebase Storage y las reglas necesarias en la consola.
