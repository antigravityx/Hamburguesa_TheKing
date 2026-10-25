/**
 * 👑 THE KING BURGER — FIREBASE SERVICE WORKER (FCM)
 * Escuchador en segundo plano para notificaciones push en Android, iOS y Desktop
 * Ecosistema The King Burger (theking.sbs)
 */

importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Configuración idéntica a admin-db-config.js
const firebaseConfig = {
    apiKey: "AIzaSyB2S21A2BfQbpJSG3KaT3t8IiH5ViMZZmc",
    authDomain: "theking-burger.firebaseapp.com",
    projectId: "theking-burger",
    storageBucket: "theking-burger.firebasestorage.app",
    messagingSenderId: "647398051589",
    appId: "1:647398051589:web:17655a8455a8f9539df16c"
};

firebase.initializeApp(firebaseConfig);

let messaging = null;
try {
    messaging = firebase.messaging();
} catch (e) {
    console.error('[SW FCM] Error al inicializar messaging en SW:', e);
}

if (messaging) {
    // Al recibir notificación con la app en segundo plano o cerrada
    messaging.onBackgroundMessage((payload) => {
        console.log('[SW FCM] Mensaje push recibido en segundo plano:', payload);

        const title = payload.notification?.title || payload.data?.title || '👑 The King Burger';
        const options = {
            body: payload.notification?.body || payload.data?.body || '¡Hay novedades en The King!',
            icon: payload.notification?.icon || payload.data?.icon || '/2026-theking-logo-678678-.ico',
            badge: '/2026-theking-logo-678678-.ico',
            image: payload.notification?.image || payload.data?.image || null,
            vibrate: [250, 100, 250, 100, 250],
            tag: payload.data?.tag || 'theking-general',
            renotify: true,
            data: {
                url: payload.data?.url || '/comunidad.html'
            }
        };

        return self.registration.showNotification(title, options);
    });
}

// Al hacer clic en la notificación push
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Si ya hay una pestaña abierta del sitio, enfocarla
            for (let client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            // Si no está abierta, abrir nueva ventana/pestaña
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
