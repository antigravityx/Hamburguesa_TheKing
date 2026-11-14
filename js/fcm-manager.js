/**
 * 👑 THE KING BURGER — GESTOR DE NOTIFICACIONES PUSH (FCM)
 * Integración con Firebase Cloud Messaging v9 (compat)
 * VAPID Key: BAYo-TQAb8CPV6EX75VFhCTpqAZzDwXv7gUpUDh4hpQ0ErUU0lkHbPIY22jySOmGaq-5d8F3JRMS-lu_AO8lzSo
 */

(function () {
    'use strict';

    const VAPID_KEY = 'BAYo-TQAb8CPV6EX75VFhCTpqAZzDwXv7gUpUDh4hpQ0ErUU0lkHbPIY22jySOmGaq-5d8F3JRMS-lu_AO8lzSo';
    const ADMIN_EMAIL = 'williphilem@gmail.com';

    class KingFCMManager {
        constructor() {
            this.messaging = null;
            this.currentToken = null;
            this.swRegistration = null;
            this.isSupported = false;
        }

        async init() {
            // Verificar soporte de Service Worker y Notificaciones
            if (!('serviceWorker' in navigator) || !('Notification' in window)) {
                console.warn('[KingFCM] Este navegador no soporta Notificaciones Push o Service Workers.');
                return false;
            }

            if (typeof firebase === 'undefined' || !firebase.messaging) {
                console.warn('[KingFCM] Firebase Messaging SDK no disponible.');
                return false;
            }

            try {
                this.isSupported = await firebase.messaging.isSupported();
                if (!this.isSupported) {
                    console.warn('[KingFCM] Firebase Messaging no es compatible en este contexto (posible modo incógnito o HTTP).');
                    return false;
                }

                // Registrar Service Worker
                this.swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                    scope: '/'
                });
                console.log('[KingFCM] Service Worker registrado exitosamente:', this.swRegistration.scope);

                this.messaging = firebase.messaging();

                // Escuchar mensajes en primer plano (Foreground)
                this.messaging.onMessage((payload) => {
                    console.log('[KingFCM] Mensaje recibido en primer plano:', payload);
                    this.showForegroundToast(payload);
                });

                // Si ya teníamos permiso concedido previamente, obtener token en silencio
                if (Notification.permission === 'granted') {
                    this.retrieveToken();
                }

                return true;
            } catch (err) {
                console.error('[KingFCM] Error inicializando FCM:', err);
                return false;
            }
        }

        async requestPermission() {
            if (!this.isSupported) {
                const initOk = await this.init();
                if (!initOk) return null;
            }

            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('[KingFCM] Permiso de notificaciones concedido.');
                    const token = await this.retrieveToken();
                    return token;
                } else {
                    console.warn('[KingFCM] Permiso de notificaciones denegado o cerrado:', permission);
                    return null;
                }
            } catch (err) {
                console.error('[KingFCM] Error al solicitar permiso:', err);
                return null;
            }
        }

        async retrieveToken() {
            try {
                if (!this.messaging) return null;

                const token = await this.messaging.getToken({
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration: this.swRegistration
                });

                if (token) {
                    this.currentToken = token;
                    console.log('[KingFCM] Token de dispositivo obtenido con éxito');
                    await this.saveTokenToFirestore(token);
                    return token;
                } else {
                    console.warn('[KingFCM] No se pudo generar token de registro.');
                    return null;
                }
            } catch (err) {
                console.error('[KingFCM] Error obteniendo token:', err);
                return null;
            }
        }

        async saveTokenToFirestore(token) {
            try {
                if (typeof firebase === 'undefined' || !firebase.firestore) return;
                const db = firebase.firestore();
                const currentUser = firebase.auth ? firebase.auth().currentUser : null;
                const tokenHash = btoa(token.substring(0, 32)).replace(/[/+=]/g, '_');

                const tokenData = {
                    token: token,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    userAgent: navigator.userAgent,
                    platform: navigator.platform || 'web',
                    userId: currentUser ? currentUser.uid : null,
                    userEmail: currentUser ? currentUser.email : null,
                    userName: currentUser ? currentUser.displayName : 'Visitante'
                };

                const hasAdminAccess = currentUser && window.kingDB
                    ? await window.kingDB.isAuthenticated(currentUser)
                    : false;

                if (hasAdminAccess) {
                    await db.collection('admin_fcm_tokens').doc(tokenHash).set({
                        ...tokenData,
                        role: 'admin',
                        emailAlert: currentUser.email || ''
                    }, { merge: true });
                    console.log('[KingFCM] Dispositivo registrado como Administrador para alertas de pedidos.');
                }

                // Guardar en la colección global de tokens
                await db.collection('fcm_subscribers').doc(tokenHash).set(tokenData, { merge: true });

                // Si hay usuario logueado, actualizar en su documento de usuario
                if (currentUser) {
                    await db.collection('users').doc(currentUser.uid).set({
                        fcmToken: token,
                        fcmUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
            } catch (e) {
                console.warn('[KingFCM] Error persistiendo token en Firestore:', e);
            }
        }

        showForegroundToast(payload) {
            const title = payload.notification?.title || payload.data?.title || '👑 The King Burger';
            const body = payload.notification?.body || payload.data?.body || 'Nueva notificación de la Corona';
            const url = payload.data?.url || '/comunidad.html';

            // Reproducir sonido suave si está disponible
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
                osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
                gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.3);
            } catch (e) { }

            // Crear Toast flotante con diseño King
            const toast = document.createElement('div');
            toast.className = 'king-fcm-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 10000;
                background: linear-gradient(135deg, rgba(20, 24, 38, 0.98), rgba(10, 12, 19, 0.98));
                border: 1px solid #ffb703;
                border-radius: 14px;
                padding: 1rem 1.2rem;
                box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 15px rgba(255,183,3,0.3);
                color: #fff;
                max-width: 320px;
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
                font-family: 'Outfit', sans-serif;
                animation: slideInUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                cursor: pointer;
            `;

            toast.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.2rem;">👑</span>
                        <strong style="color: #ffb703; font-size: 0.95rem;">${title}</strong>
                    </div>
                    <span id="close-toast-btn" style="cursor: pointer; color: #888; font-size: 1.1rem; padding: 0 4px;">&times;</span>
                </div>
                <p style="margin: 0; font-size: 0.85rem; color: #ddd; line-height: 1.3;">${body}</p>
            `;

            toast.addEventListener('click', (e) => {
                if (e.target.id === 'close-toast-btn') {
                    toast.remove();
                    return;
                }
                window.location.href = url;
            });

            document.body.appendChild(toast);
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 6500);
        }
    }

    // Instancia global
    window.KingFCM = new KingFCMManager();

    // Auto-iniciar al cargar el DOM
    document.addEventListener('DOMContentLoaded', () => {
        window.KingFCM.init();
    });
})();
