/**
 * 👑 THE KING BURGER - AUTENTICACIÓN v2
 * Firebase Auth (Google Sign-In) — Método Redirect (anti-bloqueo de popup)
 */

document.addEventListener('DOMContentLoaded', () => {
    const userProfileBtn = document.getElementById('user-profile-btn');
    const userNameDisplay = document.getElementById('user-name-display');

    // Esperar a que Firebase esté listo
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.warn('[Auth] Firebase Auth no está cargado aún');
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();

    // === 1. Capturar resultado del redirect (si vuelve de Google) ===
    firebase.auth().getRedirectResult().then((result) => {
        if (result.user) {
            console.log('[Auth] Redirect exitoso:', result.user.displayName);
        }
    }).catch((error) => {
        console.error('[Auth] Error en redirect result:', error);
    });

    // === 2. Escuchar estado de autenticación ===
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log('[Auth] Usuario autenticado:', user.displayName);

            // Actualizar botón con foto y nombre
            if (userProfileBtn) {
                userProfileBtn.innerHTML = `
                    <img src="${user.photoURL || ''}" alt="${user.displayName}" 
                         style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--accent-color);"
                         onerror="this.style.display='none'">
                    <span style="font-size: 0.85rem; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${user.displayName ? user.displayName.split(' ')[0] : 'Usuario'}</span>
                `;
            }

            // Guardar perfil en Firestore
            try {
                firebase.firestore().collection('users').doc(user.uid).set({
                    uid: user.uid,
                    name: user.displayName || 'Sin nombre',
                    email: user.email || '',
                    photo: user.photoURL || '',
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (e) {
                console.warn('[Auth] No se pudo guardar perfil en Firestore:', e);
            }

        } else {
            // No logueado — mostrar botón de entrar
            if (userProfileBtn) {
                userProfileBtn.innerHTML = `
                    <i class="ri-google-fill" style="font-size: 1.5rem; color: var(--accent-color);"></i>
                    <span style="font-size: 0.85rem;">Entrar</span>
                `;
            }
        }
    });

    // === 3. Click en botón de perfil ===
    if (userProfileBtn) {
        userProfileBtn.addEventListener('click', () => {
            const currentUser = firebase.auth().currentUser;

            if (currentUser) {
                // Ya logueado → Mostrar mini-menú
                showUserMenu(currentUser);
            } else {
                // No logueado → Iniciar sesión con redirect (NO popup)
                firebase.auth().signInWithRedirect(provider);
            }
        });
    }

    // === Mini-menú de usuario logueado ===
    function showUserMenu(user) {
        // Remover menú existente si hay uno
        const existing = document.getElementById('king-user-menu');
        if (existing) { existing.remove(); return; }

        const menu = document.createElement('div');
        menu.id = 'king-user-menu';
        menu.style.cssText = `
            position: fixed; top: 60px; right: 15px; z-index: 9999;
            background: rgba(20, 22, 35, 0.97); backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 183, 3, 0.3); border-radius: 16px;
            padding: 1.2rem; min-width: 240px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6);
            animation: fadeInMenu 0.2s ease-out;
        `;

        menu.innerHTML = `
            <style>
                @keyframes fadeInMenu { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .king-menu-item { display: flex; align-items: center; gap: 10px; padding: 0.7rem 0.5rem; border-radius: 10px; cursor: pointer; transition: background 0.2s; color: #fff; font-size: 0.9rem; }
                .king-menu-item:hover { background: rgba(255,255,255,0.08); }
            </style>
            <div style="display: flex; align-items: center; gap: 10px; padding-bottom: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 0.5rem;">
                <img src="${user.photoURL || ''}" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #FFB703;" onerror="this.style.display='none'">
                <div>
                    <div style="font-weight: 700; font-size: 0.95rem;">${user.displayName || 'Usuario'}</div>
                    <div style="font-size: 0.75rem; color: #888; max-width: 160px; overflow: hidden; text-overflow: ellipsis;">${user.email || ''}</div>
                </div>
            </div>
            <div class="king-menu-item" id="king-menu-arcade">
                <span>🕹️</span> <span>Zona Arcade</span>
            </div>
            <div class="king-menu-item" id="king-menu-logout" style="color: #ef233c;">
                <span>🚪</span> <span>Cerrar Sesión</span>
            </div>
        `;

        document.body.appendChild(menu);

        // Eventos del menú
        document.getElementById('king-menu-arcade').addEventListener('click', () => {
            window.location.href = 'tetrix.html';
        });

        document.getElementById('king-menu-logout').addEventListener('click', () => {
            firebase.auth().signOut().then(() => {
                menu.remove();
            });
        });

        // Cerrar al hacer click fuera
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && !userProfileBtn.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }
});
