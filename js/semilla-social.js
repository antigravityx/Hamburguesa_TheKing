/**
 * 👑 THE KING BURGER — SEMILLA SOCIAL ENGINE v1.0
 * Motor de Red Social con Comentarios de Audio (Base64 en Firestore)
 * 100% Gratis — Sin Firebase Storage — Soberanía Total
 * 
 * Funcionalidades:
 * - Publicaciones con foto (comprimida a base64)
 * - Comentarios de texto
 * - Comentarios de AUDIO (grabados desde el micrófono, base64)
 * - Likes en publicaciones
 * - Perfil de usuario (Semilla/Cápsula)
 * - Feed en tiempo real con Firestore onSnapshot
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════
    // 1. CONFIGURACIÓN Y ESTADO
    // ═══════════════════════════════════════════════════
    const STATE = {
        currentUser: null,
        mediaRecorder: null,
        audioChunks: [],
        isRecording: false,
        recordingTimer: null,
        recordingSeconds: 0,
        MAX_AUDIO_SECONDS: 15,
        MAX_PHOTO_KB: 200,
        unsubscribeFeed: null
    };

    // ═══════════════════════════════════════════════════
    // 2. INICIALIZACIÓN
    // ═══════════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {
        const socialSection = document.getElementById('social-feed-section');
        if (!socialSection) return;

        // Esperar a que Firebase cargue
        if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
            console.warn('[Social] Firebase no disponible');
            return;
        }

        // Escuchar estado de autenticación
        firebase.auth().onAuthStateChanged((user) => {
            STATE.currentUser = user;
            updateSocialUI(user);
            if (!STATE.unsubscribeFeed) {
                loadFeed();
            }
        });

        // Vincular eventos de UI
        bindEvents();
    });

    // ═══════════════════════════════════════════════════
    // 3. UI: ACTUALIZAR INTERFAZ SEGÚN USUARIO
    // ═══════════════════════════════════════════════════
    function updateSocialUI(user) {
        const composer = document.getElementById('social-composer');
        const loginPrompt = document.getElementById('social-login-prompt');
        if (!composer || !loginPrompt) return;

        if (user) {
            composer.style.display = 'block';
            loginPrompt.style.display = 'none';
            const avatar = document.getElementById('composer-avatar');
            if (avatar && user.photoURL) {
                avatar.src = user.photoURL;
                avatar.style.display = 'block';
            }
            const nameEl = document.getElementById('composer-name');
            if (nameEl) nameEl.textContent = user.displayName ? user.displayName.split(' ')[0] : 'Rey/Reina';

            // Crear/actualizar Semilla del usuario en Firestore
            upsertSemilla(user);
        } else {
            composer.style.display = 'none';
            loginPrompt.style.display = 'flex';
        }
    }

    // ═══════════════════════════════════════════════════
    // 4. SEMILLA: Crear/Actualizar cápsula del usuario
    // ═══════════════════════════════════════════════════
    function upsertSemilla(user) {
        try {
            const db = firebase.firestore();
            db.collection('semillas').doc(user.uid).set({
                nombre: user.displayName || 'Rey Anónimo',
                email: user.email || '',
                fotoURL: user.photoURL || '',
                ultima_visita: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.warn('[Social] Error actualizando semilla:', e);
        }
    }

    // ═══════════════════════════════════════════════════
    // 5. EVENTOS
    // ═══════════════════════════════════════════════════
    function bindEvents() {
        // Publicar post
        const publishBtn = document.getElementById('social-publish-btn');
        if (publishBtn) publishBtn.addEventListener('click', handlePublish);

        // Adjuntar foto
        const photoInput = document.getElementById('social-photo-input');
        if (photoInput) photoInput.addEventListener('change', handlePhotoPreview);

        const photoBtn = document.getElementById('social-photo-btn');
        if (photoBtn) photoBtn.addEventListener('click', () => photoInput && photoInput.click());

        // Botón de micrófono (grabar audio para comentar)
        // Se vincula dinámicamente al abrir comentarios de un post
    }

    // ═══════════════════════════════════════════════════
    // 6. PUBLICAR POST (texto + foto opcional)
    // ═══════════════════════════════════════════════════
    async function handlePublish() {
        if (!STATE.currentUser) return;
        const textInput = document.getElementById('social-post-text');
        const text = textInput ? textInput.value.trim() : '';
        const previewImg = document.getElementById('social-photo-preview-img');
        const photoData = previewImg && previewImg.src && previewImg.src.startsWith('data:') ? previewImg.src : '';

        if (!text && !photoData) {
            shakeElement(document.getElementById('social-post-text'));
            return;
        }

        const publishBtn = document.getElementById('social-publish-btn');
        if (publishBtn) {
            publishBtn.disabled = true;
            publishBtn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Publicando...';
        }

        try {
            const db = firebase.firestore();
            await db.collection('social_posts').add({
                autor_uid: STATE.currentUser.uid,
                autor_nombre: STATE.currentUser.displayName ? STATE.currentUser.displayName.split(' ')[0] : 'Rey Anónimo',
                autor_foto: STATE.currentUser.photoURL || '',
                texto: text,
                fotoBase64: photoData,
                likes: 0,
                liked_by: [],
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Limpiar
            if (textInput) textInput.value = '';
            clearPhotoPreview();
            showToast('👑 ¡Publicación creada!');
        } catch (err) {
            console.error('[Social] Error publicando:', err);
            showToast('❌ Error al publicar');
        } finally {
            if (publishBtn) {
                publishBtn.disabled = false;
                publishBtn.innerHTML = '<i class="ri-send-plane-fill"></i> Publicar';
            }
        }
    }

    // ═══════════════════════════════════════════════════
    // 7. FOTO: Comprimir y previsualizar
    // ═══════════════════════════════════════════════════
    function handlePhotoPreview(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (ev) {
            const img = new Image();
            img.onload = function () {
                // Comprimir
                const canvas = document.createElement('canvas');
                const MAX_W = 800;
                const scale = Math.min(1, MAX_W / img.width);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const compressed = canvas.toDataURL('image/jpeg', 0.6);

                const preview = document.getElementById('social-photo-preview');
                const previewImg = document.getElementById('social-photo-preview-img');
                if (preview && previewImg) {
                    previewImg.src = compressed;
                    preview.style.display = 'block';
                }
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }

    function clearPhotoPreview() {
        const preview = document.getElementById('social-photo-preview');
        const previewImg = document.getElementById('social-photo-preview-img');
        const photoInput = document.getElementById('social-photo-input');
        if (preview) preview.style.display = 'none';
        if (previewImg) previewImg.src = '';
        if (photoInput) photoInput.value = '';
    }

    // ═══════════════════════════════════════════════════
    // 8. FEED: Cargar publicaciones en tiempo real
    // ═══════════════════════════════════════════════════
    function loadFeed() {
        const feedContainer = document.getElementById('social-feed');
        if (!feedContainer) return;

        const db = firebase.firestore();
        STATE.unsubscribeFeed = db.collection('social_posts')
            .orderBy('timestamp', 'desc')
            .limit(30)
            .onSnapshot((snapshot) => {
                if (snapshot.empty) {
                    feedContainer.innerHTML = `
                        <div class="social-empty-state">
                            <div style="font-size: 3rem; margin-bottom: 0.5rem;">👑</div>
                            <p>Todavía no hay publicaciones.<br>¡Sé el primero en compartir tu experiencia TheKing!</p>
                        </div>`;
                    return;
                }

                feedContainer.innerHTML = '';
                snapshot.forEach((doc) => {
                    const post = doc.data();
                    const postEl = createPostElement(doc.id, post);
                    feedContainer.appendChild(postEl);
                });
            }, (error) => {
                console.error('[Social] Error cargando feed:', error);
                feedContainer.innerHTML = '<div style="text-align:center;color:#888;padding:2rem;">Error al cargar publicaciones</div>';
            });
    }

    // ═══════════════════════════════════════════════════
    // 9. CREAR ELEMENTO DE POST
    // ═══════════════════════════════════════════════════
    function createPostElement(postId, post) {
        const div = document.createElement('div');
        div.className = 'social-post';
        div.id = `post-${postId}`;

        const isLiked = STATE.currentUser && post.liked_by && post.liked_by.includes(STATE.currentUser.uid);
        const timeStr = post.timestamp ? formatTime(post.timestamp.toDate()) : '';

        let photoHTML = '';
        if (post.fotoBase64) {
            photoHTML = `<div class="social-post-photo"><img src="${post.fotoBase64}" alt="Foto de ${post.autor_nombre}" loading="lazy"></div>`;
        }

        div.innerHTML = `
            <div class="social-post-header">
                <img src="${post.autor_foto || ''}" alt="" class="social-post-avatar" onerror="this.style.display='none'">
                <div>
                    <span class="social-post-author">${post.autor_nombre}</span>
                    <span class="social-post-time">${timeStr}</span>
                </div>
            </div>
            ${post.texto ? `<div class="social-post-text">${escapeHTML(post.texto)}</div>` : ''}
            ${photoHTML}
            <div class="social-post-actions">
                <button class="social-action-btn social-like-btn ${isLiked ? 'liked' : ''}" data-postid="${postId}">
                    <i class="${isLiked ? 'ri-heart-3-fill' : 'ri-heart-3-line'}"></i>
                    <span>${post.likes || 0}</span>
                </button>
                <button class="social-action-btn social-comment-btn" data-postid="${postId}">
                    <i class="ri-chat-3-line"></i>
                    <span>Comentar</span>
                </button>
            </div>
            <div class="social-comments-area" id="comments-area-${postId}" style="display: none;">
                <div class="social-comments-list" id="comments-list-${postId}"></div>
                <div class="social-comment-input-row" id="comment-input-row-${postId}" style="display: ${STATE.currentUser ? 'flex' : 'none'};">
                    <input type="text" class="social-comment-input" id="comment-input-${postId}" placeholder="Escribí un comentario...">
                    <button class="social-mic-btn" id="mic-btn-${postId}" data-postid="${postId}" title="Comentar con audio 🎤">
                        <i class="ri-mic-line"></i>
                    </button>
                    <button class="social-comment-send-btn" data-postid="${postId}" title="Enviar comentario">
                        <i class="ri-send-plane-fill"></i>
                    </button>
                </div>
                <div class="social-recording-indicator" id="recording-indicator-${postId}" style="display: none;">
                    <div class="recording-pulse"></div>
                    <span id="recording-timer-${postId}">0s</span>
                    <span> / ${STATE.MAX_AUDIO_SECONDS}s</span>
                    <button class="social-recording-stop-btn" data-postid="${postId}">⬛ Parar</button>
                </div>
            </div>
        `;

        // Bind like
        const likeBtn = div.querySelector('.social-like-btn');
        if (likeBtn) likeBtn.addEventListener('click', () => handleLike(postId));

        // Bind toggle comments
        const commentBtn = div.querySelector('.social-comment-btn');
        if (commentBtn) commentBtn.addEventListener('click', () => toggleComments(postId));

        // Bind send text comment
        const sendCommentBtn = div.querySelector('.social-comment-send-btn');
        if (sendCommentBtn) sendCommentBtn.addEventListener('click', () => sendTextComment(postId));

        // Bind Enter key for comment
        const commentInput = div.querySelector(`#comment-input-${postId}`);
        if (commentInput) commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendTextComment(postId);
        });

        // Bind mic button
        const micBtn = div.querySelector('.social-mic-btn');
        if (micBtn) micBtn.addEventListener('click', () => toggleAudioRecording(postId));

        // Bind stop recording
        const stopBtn = div.querySelector('.social-recording-stop-btn');
        if (stopBtn) stopBtn.addEventListener('click', () => stopAndSendAudio(postId));

        return div;
    }

    // ═══════════════════════════════════════════════════
    // 10. LIKES
    // ═══════════════════════════════════════════════════
    function handleLike(postId) {
        if (!STATE.currentUser) {
            showToast('Iniciá sesión para dar like 👑');
            return;
        }

        const db = firebase.firestore();
        const postRef = db.collection('social_posts').doc(postId);

        db.runTransaction(async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists) return;

            const data = postDoc.data();
            const likedBy = data.liked_by || [];
            const uid = STATE.currentUser.uid;

            if (likedBy.includes(uid)) {
                // Unlike
                transaction.update(postRef, {
                    likes: (data.likes || 1) - 1,
                    liked_by: firebase.firestore.FieldValue.arrayRemove(uid)
                });
            } else {
                // Like
                transaction.update(postRef, {
                    likes: (data.likes || 0) + 1,
                    liked_by: firebase.firestore.FieldValue.arrayUnion(uid)
                });
            }
        }).catch(err => console.error('[Social] Error en like:', err));
    }

    // ═══════════════════════════════════════════════════
    // 11. COMENTARIOS: Toggle y Cargar
    // ═══════════════════════════════════════════════════
    function toggleComments(postId) {
        const area = document.getElementById(`comments-area-${postId}`);
        if (!area) return;

        const isVisible = area.style.display !== 'none';
        area.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            loadComments(postId);
        }
    }

    function loadComments(postId) {
        const list = document.getElementById(`comments-list-${postId}`);
        if (!list) return;

        const db = firebase.firestore();
        db.collection('social_posts').doc(postId).collection('comments')
            .orderBy('timestamp', 'asc')
            .onSnapshot((snapshot) => {
                list.innerHTML = '';
                if (snapshot.empty) {
                    list.innerHTML = '<div class="social-no-comments">Sin comentarios aún. ¡Sé el primero! 🎤</div>';
                    return;
                }
                snapshot.forEach((doc) => {
                    const c = doc.data();
                    list.appendChild(createCommentElement(c));
                });
                list.scrollTop = list.scrollHeight;
            });
    }

    function createCommentElement(comment) {
        const div = document.createElement('div');
        div.className = 'social-comment';

        const timeStr = comment.timestamp ? formatTime(comment.timestamp.toDate()) : '';

        if (comment.tipo === 'audio' && comment.contenido) {
            // Comentario de AUDIO
            div.innerHTML = `
                <div class="social-comment-header">
                    <strong>${escapeHTML(comment.autor_nombre)}</strong>
                    <span class="social-comment-time">${timeStr}</span>
                </div>
                <div class="social-audio-comment">
                    <button class="social-play-audio-btn" onclick="window._playSocialAudio(this, '${comment.contenido}')">
                        <i class="ri-play-circle-fill"></i>
                    </button>
                    <div class="social-audio-wave">
                        <span></span><span></span><span></span><span></span><span></span>
                        <span></span><span></span><span></span><span></span><span></span>
                    </div>
                    <span class="social-audio-badge">🎤 Audio</span>
                </div>`;
        } else {
            // Comentario de TEXTO
            div.innerHTML = `
                <div class="social-comment-header">
                    <strong>${escapeHTML(comment.autor_nombre)}</strong>
                    <span class="social-comment-time">${timeStr}</span>
                </div>
                <div class="social-comment-text">${escapeHTML(comment.contenido || '')}</div>`;
        }
        return div;
    }

    // ═══════════════════════════════════════════════════
    // 12. ENVIAR COMENTARIO DE TEXTO
    // ═══════════════════════════════════════════════════
    function sendTextComment(postId) {
        if (!STATE.currentUser) return;
        const input = document.getElementById(`comment-input-${postId}`);
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;

        const db = firebase.firestore();
        db.collection('social_posts').doc(postId).collection('comments').add({
            autor_uid: STATE.currentUser.uid,
            autor_nombre: STATE.currentUser.displayName ? STATE.currentUser.displayName.split(' ')[0] : 'Rey Anónimo',
            tipo: 'texto',
            contenido: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            input.value = '';
        }).catch(err => {
            console.error('[Social] Error enviando comentario:', err);
            showToast('❌ Error al comentar');
        });
    }

    // ═══════════════════════════════════════════════════
    // 13. AUDIO: Grabar, convertir a Base64 y publicar
    // ═══════════════════════════════════════════════════
    function toggleAudioRecording(postId) {
        if (!STATE.currentUser) {
            showToast('Iniciá sesión para grabar audio 🎤');
            return;
        }

        if (STATE.isRecording) {
            stopAndSendAudio(postId);
        } else {
            startRecording(postId);
        }
    }

    async function startRecording(postId) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            STATE.audioChunks = [];
            STATE.recordingSeconds = 0;

            // Intentar grabar en webm, fallback a cualquiera
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '');

            STATE.mediaRecorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            STATE.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) STATE.audioChunks.push(e.data);
            };

            STATE.mediaRecorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop());
            };

            STATE.mediaRecorder.start(100); // Chunk cada 100ms
            STATE.isRecording = true;

            // UI: Mostrar indicador de grabación
            const indicator = document.getElementById(`recording-indicator-${postId}`);
            const inputRow = document.getElementById(`comment-input-row-${postId}`);
            const micBtn = document.getElementById(`mic-btn-${postId}`);
            if (indicator) indicator.style.display = 'flex';
            if (inputRow) inputRow.style.display = 'none';
            if (micBtn) {
                micBtn.innerHTML = '<i class="ri-stop-circle-fill"></i>';
                micBtn.classList.add('recording');
            }

            // Timer
            STATE.recordingTimer = setInterval(() => {
                STATE.recordingSeconds++;
                const timerEl = document.getElementById(`recording-timer-${postId}`);
                if (timerEl) timerEl.textContent = `${STATE.recordingSeconds}s`;

                if (STATE.recordingSeconds >= STATE.MAX_AUDIO_SECONDS) {
                    stopAndSendAudio(postId);
                }
            }, 1000);

        } catch (err) {
            console.error('[Social] Error accediendo al micrófono:', err);
            if (err.name === 'NotAllowedError') {
                showToast('⚠️ Necesitás permitir el micrófono en tu navegador');
            } else {
                showToast('❌ Error al acceder al micrófono');
            }
        }
    }

    function stopAndSendAudio(postId) {
        if (!STATE.mediaRecorder || STATE.mediaRecorder.state === 'inactive') return;

        STATE.isRecording = false;
        clearInterval(STATE.recordingTimer);

        STATE.mediaRecorder.stop();

        // Esperar a que se recopilen todos los chunks
        setTimeout(() => {
            const blob = new Blob(STATE.audioChunks, { type: STATE.mediaRecorder.mimeType || 'audio/webm' });

            // Convertir a Base64
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Audio = reader.result; // data:audio/webm;base64,...

                // Verificar tamaño (Firestore max ~1MB por doc)
                if (base64Audio.length > 900000) {
                    showToast('⚠️ Audio demasiado largo. Intentá con menos de 10 segundos.');
                    resetRecordingUI(postId);
                    return;
                }

                // Guardar en Firestore como comentario de audio
                const db = firebase.firestore();
                db.collection('social_posts').doc(postId).collection('comments').add({
                    autor_uid: STATE.currentUser.uid,
                    autor_nombre: STATE.currentUser.displayName ? STATE.currentUser.displayName.split(' ')[0] : 'Rey Anónimo',
                    tipo: 'audio',
                    contenido: base64Audio,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    showToast('🎤 ¡Audio publicado!');
                }).catch(err => {
                    console.error('[Social] Error enviando audio:', err);
                    showToast('❌ Error al enviar audio');
                });

                resetRecordingUI(postId);
            };
            reader.readAsDataURL(blob);
        }, 300);
    }

    function resetRecordingUI(postId) {
        const indicator = document.getElementById(`recording-indicator-${postId}`);
        const inputRow = document.getElementById(`comment-input-row-${postId}`);
        const micBtn = document.getElementById(`mic-btn-${postId}`);
        if (indicator) indicator.style.display = 'none';
        if (inputRow) inputRow.style.display = 'flex';
        if (micBtn) {
            micBtn.innerHTML = '<i class="ri-mic-line"></i>';
            micBtn.classList.remove('recording');
        }
    }

    // ═══════════════════════════════════════════════════
    // 14. REPRODUCTOR DE AUDIO (Global)
    // ═══════════════════════════════════════════════════
    window._socialAudioPlayer = null;

    window._playSocialAudio = function (btn, base64Data) {
        // Si ya hay uno reproduciéndose, pausar
        if (window._socialAudioPlayer) {
            window._socialAudioPlayer.pause();
            window._socialAudioPlayer = null;
            // Reset todos los botones de play
            document.querySelectorAll('.social-play-audio-btn.playing').forEach(b => {
                b.classList.remove('playing');
                b.innerHTML = '<i class="ri-play-circle-fill"></i>';
            });
        }

        if (btn.classList.contains('playing')) {
            btn.classList.remove('playing');
            btn.innerHTML = '<i class="ri-play-circle-fill"></i>';
            return;
        }

        const audio = new Audio(base64Data);
        window._socialAudioPlayer = audio;
        btn.classList.add('playing');
        btn.innerHTML = '<i class="ri-pause-circle-fill"></i>';

        // Animar las ondas
        const waveContainer = btn.parentElement.querySelector('.social-audio-wave');
        if (waveContainer) waveContainer.classList.add('animating');

        audio.play().catch(err => console.warn('Error reproduciendo audio:', err));

        audio.onended = () => {
            btn.classList.remove('playing');
            btn.innerHTML = '<i class="ri-play-circle-fill"></i>';
            if (waveContainer) waveContainer.classList.remove('animating');
            window._socialAudioPlayer = null;
        };
    };

    // ═══════════════════════════════════════════════════
    // 15. UTILIDADES
    // ═══════════════════════════════════════════════════
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatTime(date) {
        const now = new Date();
        const diff = (now - date) / 1000;
        if (diff < 60) return 'ahora';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    }

    function showToast(msg) {
        const existing = document.getElementById('social-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'social-toast';
        toast.className = 'social-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('visible'), 50);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function shakeElement(el) {
        if (!el) return;
        el.style.animation = 'shake 0.4s ease';
        setTimeout(() => el.style.animation = '', 400);
    }

})();
