/**
 * 👑 THE KING BURGER - SISTEMA DE AUTENTICACIÓN HÍBRIDO REY/REINA v4
 * Trinidad R1CH0N · VERIX · ARKH
 * 
 * Permite registro universal:
 * 1. WhatsApp Rápido (100% compatible con WebViews de Instagram, Facebook y celulares)
 * 2. Google Sign-In (con detección de WebView y fallback a redirect)
 * Sincronización automática con Carrito/Checkout y Firestore users/{uid}.
 */

document.addEventListener('DOMContentLoaded', () => {
    const userProfileBtn = document.getElementById('user-profile-btn');
    const menuAuthBtn = document.getElementById('menu-auth-btn');
    const menuAuthLabel = document.getElementById('menu-auth-label');
    
    // Elementos del Modal
    const authModal = document.getElementById('king-auth-modal');
    const closeAuthModalBtn = document.getElementById('close-auth-modal-btn');
    const closeAuthOverlay = document.getElementById('close-auth-overlay');
    const tabWhatsapp = document.getElementById('tab-auth-whatsapp');
    const tabGoogle = document.getElementById('tab-auth-google');
    const viewWhatsapp = document.getElementById('auth-view-whatsapp');
    const viewGoogle = document.getElementById('auth-view-google');
    const formQuickRegister = document.getElementById('form-quick-register');
    const btnGoogleLoginAction = document.getElementById('btn-google-login-action');
    const googleAuthStatus = document.getElementById('google-auth-status');
    const instagramNotice = document.getElementById('instagram-webview-notice');

    // Detección de WebView de Instagram / Facebook
    const isSocialWebView = /Instagram|FBAN|FBAV|TikTok/i.test(navigator.userAgent);
    if (isSocialWebView && instagramNotice) {
        instagramNotice.style.display = 'block';
    }

    // === GESTIÓN DE SESIÓN LOCAL Y ESTADO ===
    function getClientSession() {
        try {
            const raw = localStorage.getItem('king_client_session');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function setClientSession(data) {
        try {
            localStorage.setItem('king_client_session', JSON.stringify(data));
        } catch (e) {
            console.warn('[Auth] No se pudo guardar sesión local:', e);
        }
    }

    function clearClientSession() {
        try {
            localStorage.removeItem('king_client_session');
        } catch (e) {}
    }

    // Obtener usuario unificado (Firebase o Local WhatsApp)
    function getCurrentKingUser() {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            const fbUser = firebase.auth().currentUser;
            const local = getClientSession() || {};
            const userAddr = local.address || local.palacioReal || '';
            return {
                uid: fbUser.uid,
                name: fbUser.displayName || local.name || 'Rey/Reina',
                email: fbUser.email || '',
                phone: local.phone || '',
                address: userAddr,
                palacioReal: userAddr,
                photo: fbUser.photoURL || '',
                coronas: local.coronas || 10,
                isFirebase: true
            };
        }
        const local = getClientSession();
        if (local && (local.name || local.phone || local.uid)) {
            const userAddr = local.address || local.palacioReal || '';
            return {
                uid: local.uid || 'local_' + Date.now(),
                name: local.name || 'Rey/Reina',
                email: local.email || '',
                phone: local.phone || '',
                address: userAddr,
                palacioReal: userAddr,
                photo: local.photo || '',
                coronas: local.coronas || 10,
                isFirebase: false
            };
        }
        return null;
    }

    // Distintivo visual sutil y amigable de Palacio Real con reconocimiento automático de Soberanos
    function renderPalacioRealBadge(address) {
        let badge = document.getElementById('palacio-real-badge');
        if (!badge) {
            const container = document.getElementById('delivery-details-container');
            if (container) {
                badge = document.createElement('div');
                badge.id = 'palacio-real-badge';
                badge.style.cssText = `
                    display: none; align-items: center; gap: 8px; font-size: 0.78rem;
                    color: #ffb703; background: rgba(255, 183, 3, 0.08);
                    border: 1px dashed rgba(255, 183, 3, 0.35); border-radius: 8px;
                    padding: 8px 12px; margin-bottom: 0.6rem; animation: fadeIn 0.3s ease-out;
                `;
                const addressRow = document.getElementById('customer-address')?.parentElement;
                if (addressRow && addressRow.nextSibling) {
                    container.insertBefore(badge, addressRow.nextSibling);
                } else {
                    container.appendChild(badge);
                }
            }
        }
        if (!badge) return;

        if (address && String(address).trim().length >= 3) {
            // Reconocimiento inteligente de cliente real de Corrientes
            let clienteReconocido = null;
            if (window.CASTILLOS_CLIENTES_CORRIENTES && Array.isArray(window.CASTILLOS_CLIENTES_CORRIENTES)) {
                const addrNorm = String(address).toLowerCase().replace(/[^a-z0-9]/g, ' ');
                const words = addrNorm.split(' ').filter(w => w.length >= 3);
                if (words.length > 0) {
                    clienteReconocido = window.CASTILLOS_CLIENTES_CORRIENTES.find(c => {
                        const cNorm = (c.direccion || '').toLowerCase();
                        return words.every(w => cNorm.includes(w)) || 
                               (words.some(w => /^\d{2,5}$/.test(w) && cNorm.includes(w)) && 
                                words.some(w => !/^\d+$/.test(w) && cNorm.includes(w)));
                    });
                }
            }

            if (clienteReconocido) {
                badge.style.background = 'linear-gradient(135deg, rgba(255, 183, 3, 0.18), rgba(56, 189, 248, 0.12))';
                badge.style.border = '1px solid #ffd700';
                badge.innerHTML = `
                    <span style="font-size: 1.25rem;">👑</span>
                    <div>
                        <strong style="color: #ffd700; display:block;">¡Bienvenido de vuelta, Soberano de ${clienteReconocido.barrio}!</strong>
                        <span style="color: #e2e8f0; font-size: 0.74rem;">Tu castillo inicia en <strong>Nivel ${clienteReconocido.nivel}</strong> con <strong>+${clienteReconocido.coronas} Coronas Reales</strong>.</span>
                    </div>
                `;

                // Acreditar bono de coronas de bienvenida
                try {
                    const bonoKey = 'king_bono_soberano_' + clienteReconocido.id;
                    if (!localStorage.getItem(bonoKey)) {
                        const cur = parseInt(localStorage.getItem('king_coronas') || '0');
                        localStorage.setItem('king_coronas', (cur + clienteReconocido.coronas).toString());
                        localStorage.setItem(bonoKey, 'true');
                    }
                } catch (e) {}
            } else {
                badge.style.background = 'rgba(255, 183, 3, 0.08)';
                badge.style.border = '1px dashed rgba(255, 183, 3, 0.35)';
                badge.innerHTML = `<span>🏰</span> <span>Tu Palacio Real guardado <span style="color: #bbb; font-weight: normal;">(podés cambiarlo si estás en otra dirección)</span></span>`;
            }
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // Guardar / Actualizar Palacio Real (dirección) para cualquier usuario autenticado o local
    async function saveKingPalacioReal(address) {
        if (!address || typeof address !== 'string') return;
        const cleanAddr = address.trim();
        if (cleanAddr.length < 3) return;

        // 1. Guardar siempre en localStorage como respaldo general
        try {
            localStorage.setItem('king_customer_address', cleanAddr);
        } catch (e) {}

        // 2. Actualizar sesión local si existe usuario
        const local = getClientSession() || {};
        local.address = cleanAddr;
        local.palacioReal = cleanAddr;
        local.lastAddressUpdate = new Date().toISOString();
        setClientSession(local);

        // Mostrar distintivo visual en checkout
        renderPalacioRealBadge(cleanAddr);

        // 3. Si el usuario está autenticado en Firebase o Firestore disponible
        const currentUser = getCurrentKingUser();
        const uid = (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) 
            ? firebase.auth().currentUser.uid 
            : (local.uid || (currentUser ? currentUser.uid : null));

        if (uid && typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                await firebase.firestore().collection('users').doc(uid).set({
                    address: cleanAddr,
                    palacioReal: cleanAddr,
                    lastAddressUpdate: new Date().toISOString()
                }, { merge: true });
                console.log('[Auth] 🏰 Palacio Real guardado en Firestore para uid:', uid);
            } catch (err) {
                console.warn('[Auth] Error guardando Palacio Real en Firestore:', err);
            }
        }
    }

    // Actualizar campos de checkout automáticamente
    function syncCheckoutFields(user) {
        const currentUser = user || getCurrentKingUser();
        const nameInput = document.getElementById('customer-name');
        const addressInput = document.getElementById('customer-address');

        if (currentUser) {
            if (nameInput && !nameInput.value && currentUser.name) {
                nameInput.value = currentUser.name;
            }
            const savedAddress = currentUser.address || currentUser.palacioReal;
            if (savedAddress) {
                if (addressInput && !addressInput.value) {
                    addressInput.value = savedAddress;
                    addressInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                renderPalacioRealBadge(savedAddress);
            }
        } else {
            try {
                const fallbackAddress = localStorage.getItem('king_customer_address') || localStorage.getItem('customer_address');
                if (fallbackAddress && addressInput && !addressInput.value) {
                    addressInput.value = fallbackAddress;
                    addressInput.dispatchEvent(new Event('input', { bubbles: true }));
                    renderPalacioRealBadge(fallbackAddress);
                }
            } catch (e) {}
        }
    }

    // Actualizar visualización del botón de perfil y menú
    function updateAuthUI() {
        const user = getCurrentKingUser();

        if (user) {
            const firstName = user.name ? user.name.split(' ')[0] : 'Rey/Reina';
            
            if (userProfileBtn) {
                if (user.photo) {
                    userProfileBtn.innerHTML = `
                        <img src="${user.photo}" alt="${user.name}" 
                             style="width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid var(--accent-color);"
                             onerror="this.style.display='none'">
                        <span style="font-size: 0.8rem; font-weight: 700; color: #fff; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">👑 ${firstName}</span>
                    `;
                } else {
                    userProfileBtn.innerHTML = `
                        <span style="font-size: 1.1rem; line-height: 1;">👑</span>
                        <span style="font-size: 0.8rem; font-weight: 700; color: #fff; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${firstName}</span>
                    `;
                }
                userProfileBtn.title = `${user.name} (${user.coronas || 10} Coronas)`;
            }

            if (menuAuthLabel) {
                menuAuthLabel.textContent = `👑 Mi Cuenta (${firstName} · ${user.coronas || 10} 👑)`;
            }

            syncCheckoutFields(user);
        } else {
            if (userProfileBtn) {
                userProfileBtn.innerHTML = `
                    <i class="ri-user-star-fill" style="font-size: 1.15rem; color: var(--accent-color);"></i>
                    <span style="font-size: 0.8rem; font-weight: 700; color: #fff;">Mi Cuenta</span>
                `;
                userProfileBtn.title = "Mi Cuenta / Registrarme";
            }

            if (menuAuthLabel) {
                menuAuthLabel.textContent = "👑 Mi Cuenta / Registrarme";
            }
        }
    }

    // === CONTROL DEL MODAL DE AUTENTICACIÓN ===
    function openAuthModal(defaultTab = 'whatsapp') {
        if (!authModal) return;
        switchTab(defaultTab);
        authModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Pre-llenar datos si ya existían
        const existing = getClientSession();
        if (existing) {
            const nameInput = document.getElementById('quick-auth-name');
            const phoneInput = document.getElementById('quick-auth-phone');
            const addressInput = document.getElementById('quick-auth-address');
            if (nameInput && existing.name) nameInput.value = existing.name;
            if (phoneInput && existing.phone) phoneInput.value = existing.phone;
            if (addressInput && existing.address) addressInput.value = existing.address;
        }
    }

    function closeAuthModal() {
        if (!authModal) return;
        authModal.style.display = 'none';
        document.body.style.overflow = '';
        if (googleAuthStatus) googleAuthStatus.style.display = 'none';
    }

    function switchTab(tab) {
        if (tab === 'whatsapp') {
            if (tabWhatsapp) {
                tabWhatsapp.style.background = 'var(--accent-color)';
                tabWhatsapp.style.color = '#000';
            }
            if (tabGoogle) {
                tabGoogle.style.background = 'transparent';
                tabGoogle.style.color = '#fff';
            }
            if (viewWhatsapp) viewWhatsapp.style.display = 'block';
            if (viewGoogle) viewGoogle.style.display = 'none';
        } else {
            if (tabGoogle) {
                tabGoogle.style.background = 'var(--accent-color)';
                tabGoogle.style.color = '#000';
            }
            if (tabWhatsapp) {
                tabWhatsapp.style.background = 'transparent';
                tabWhatsapp.style.color = '#fff';
            }
            if (viewGoogle) viewGoogle.style.display = 'block';
            if (viewWhatsapp) viewWhatsapp.style.display = 'none';
        }
    }

    if (tabWhatsapp) tabWhatsapp.addEventListener('click', () => switchTab('whatsapp'));
    if (tabGoogle) tabGoogle.addEventListener('click', () => switchTab('google'));

    if (closeAuthModalBtn) closeAuthModalBtn.addEventListener('click', closeAuthModal);
    if (closeAuthOverlay) closeAuthOverlay.addEventListener('click', closeAuthModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && authModal && authModal.style.display === 'flex') {
            closeAuthModal();
        }
    });

    // Clicks en Botones de Perfil / Menú
    function handleProfileClick() {
        const user = getCurrentKingUser();
        if (user) {
            showUserMenu(user);
        } else {
            openAuthModal(isSocialWebView ? 'whatsapp' : 'whatsapp');
        }
    }

    if (userProfileBtn) {
        userProfileBtn.addEventListener('click', handleProfileClick);
    }

    if (menuAuthBtn) {
        menuAuthBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('app-menu-dropdown');
            if (dropdown) dropdown.classList.remove('active');
            handleProfileClick();
        });
    }

    // === REGISTRO RÁPIDO CON WHATSAPP ===
    if (formQuickRegister) {
        formQuickRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('quick-auth-name')?.value.trim();
            const phone = document.getElementById('quick-auth-phone')?.value.trim();
            let address = document.getElementById('quick-auth-address')?.value.trim() || '';

            if (!name || !phone) {
                alert('Por favor completá tu nombre y número de WhatsApp.');
                return;
            }

            // Si el cliente no puso dirección en el modal, asociar la del checkout o localStorage
            if (!address) {
                const checkoutAddrInput = document.getElementById('customer-address');
                if (checkoutAddrInput && checkoutAddrInput.value.trim().length >= 3) {
                    address = checkoutAddrInput.value.trim();
                } else {
                    try {
                        address = localStorage.getItem('king_customer_address') || localStorage.getItem('customer_address') || '';
                    } catch (e) {}
                }
            }

            const submitBtn = document.getElementById('btn-submit-quick-auth');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>⏳ Guardando cuenta...</span>';
            }

            const cleanPhone = phone.replace(/\D/g, '');
            const uid = 'wa_' + (cleanPhone || Date.now());
            const sessionData = {
                uid: uid,
                name: name,
                phone: phone,
                address: address,
                palacioReal: address,
                coronas: 10,
                authMethod: 'whatsapp',
                registeredAt: new Date().toISOString()
            };
            if (address) {
                sessionData.lastAddressUpdate = new Date().toISOString();
                try { localStorage.setItem('king_customer_address', address); } catch (e) {}
            }

            setClientSession(sessionData);

            // Intentar sincronizar con Firebase Anonymous si está disponible
            if (typeof firebase !== 'undefined' && firebase.auth) {
                try {
                    if (!firebase.auth().currentUser) {
                        await firebase.auth().signInAnonymously().catch(() => {});
                    }
                    if (firebase.auth().currentUser) {
                        await firebase.auth().currentUser.updateProfile({ displayName: name }).catch(() => {});
                    }
                } catch (authErr) {
                    console.log('[Auth] Anónimo opcional:', authErr);
                }
            }

            // Sincronizar en Firestore si está disponible
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                try {
                    const docId = (firebase.auth && firebase.auth().currentUser) ? firebase.auth().currentUser.uid : uid;
                    const fsPayload = {
                        uid: docId,
                        name: name,
                        phone: phone,
                        address: address,
                        palacioReal: address,
                        coronas: 10,
                        authMethod: 'whatsapp',
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    if (address) {
                        fsPayload.lastAddressUpdate = new Date().toISOString();
                    }
                    await firebase.firestore().collection('users').doc(docId).set(fsPayload, { merge: true });
                    console.log('[Auth] ✅ Perfil sincronizado en Firestore:', docId);
                } catch (fsErr) {
                    console.warn('[Auth] Firestore no disponible temporalmente:', fsErr);
                }
            }

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>👑 Activar Mi Cuenta (+10 Coronas)</span>';
            }

            closeAuthModal();
            updateAuthUI();

            // Notificación amigable
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed; bottom: 25px; left: 50%; transform: translateX(-50%);
                background: linear-gradient(135deg, #ffb703, #fb8500); color: #000;
                padding: 12px 22px; border-radius: 25px; font-weight: 800; font-size: 0.9rem;
                box-shadow: 0 8px 30px rgba(0,0,0,0.6); z-index: 10005; text-align: center;
                animation: fadeIn 0.3s ease-out;
            `;
            toast.innerHTML = `👑 ¡Bienvenido/a, ${name.split(' ')[0]}! Cuenta activada con 10 Coronas.`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);
        });
    }

    // === GOOGLE SIGN-IN ===
    let provider = null;
    if (typeof firebase !== 'undefined' && firebase.auth) {
        try {
            provider = new firebase.auth.GoogleAuthProvider();
        } catch (e) {}

        // Capturar redirect
        firebase.auth().getRedirectResult().then((result) => {
            if (result && result.user) {
                console.log('[Auth] ✅ Login redirect exitoso:', result.user.displayName);
                handleGoogleUserSuccess(result.user);
            }
        }).catch((error) => {
            console.error('[Auth] Error en redirect:', error);
        });

        // Escuchar cambios de estado
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('[Auth] ✅ Sesión Firebase activa:', user.displayName);
                handleGoogleUserSuccess(user);
            } else {
                updateAuthUI();
            }
        });
    }

    async function handleGoogleUserSuccess(user) {
        if (!user) return;
        const local = getClientSession() || {};

        // 🏰 Si el usuario no tiene domicilio guardado, buscar en checkout, localStorage o Firestore
        let savedAddress = local.address || local.palacioReal || '';
        if (!savedAddress) {
            const checkoutAddrInput = document.getElementById('customer-address');
            if (checkoutAddrInput && checkoutAddrInput.value.trim().length >= 3) {
                savedAddress = checkoutAddrInput.value.trim();
            } else {
                try {
                    savedAddress = localStorage.getItem('king_customer_address') || 
                                   localStorage.getItem('customer_address') || '';
                } catch (e) {}
            }
        }

        // Si aún no hay domicilio en local, verificar en Firestore si ya existía en su cuenta
        if (!savedAddress && typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const data = userDoc.data();
                    if (data && (data.palacioReal || data.address)) {
                        savedAddress = data.palacioReal || data.address;
                    }
                }
            } catch (fsErr) {
                console.log('[Auth] Consulta previa Firestore:', fsErr);
            }
        }

        const merged = {
            ...local,
            uid: user.uid,
            name: user.displayName || local.name || 'Cliente Rey',
            email: user.email || '',
            photo: user.photoURL || '',
            coronas: (local.coronas || 10),
            address: savedAddress,
            palacioReal: savedAddress,
            authMethod: 'google'
        };
        if (savedAddress) {
            merged.lastAddressUpdate = new Date().toISOString();
            try { localStorage.setItem('king_customer_address', savedAddress); } catch (e) {}
        }
        setClientSession(merged);

        if (typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                const fsPayload = {
                    uid: user.uid,
                    name: merged.name,
                    email: merged.email,
                    photo: merged.photo,
                    coronas: merged.coronas,
                    authMethod: 'google',
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                };
                if (savedAddress) {
                    fsPayload.address = savedAddress;
                    fsPayload.palacioReal = savedAddress;
                    fsPayload.lastAddressUpdate = new Date().toISOString();
                }
                await firebase.firestore().collection('users').doc(user.uid).set(fsPayload, { merge: true });
                console.log('[Auth] ✅ Perfil Google sincronizado en Firestore con Palacio Real:', savedAddress || '(sin dirección)');
            } catch (fsErr) {
                console.warn('[Auth] Error guardando perfil en Firestore:', fsErr);
            }
        }

        closeAuthModal();
        updateAuthUI();
    }

    function loginWithGoogle() {
        if (!provider || typeof firebase === 'undefined' || !firebase.auth) {
            alert('Firebase Auth no está inicializado.');
            return;
        }

        if (googleAuthStatus) {
            googleAuthStatus.style.display = 'block';
            googleAuthStatus.textContent = '⏳ Conectando con Google...';
        }

        // Si es WebView de Instagram o similar, avisar primero
        if (isSocialWebView) {
            alert('⚠️ Estás navegando dentro de Instagram o Facebook.\nGoogle suele bloquear el inicio de sesión aquí.\n\nTe sugerimos usar el "Registro Rápido con WhatsApp" en la otra pestaña.');
        }

        firebase.auth().signInWithPopup(provider).then((result) => {
            if (result && result.user) {
                handleGoogleUserSuccess(result.user);
            }
        }).catch((error) => {
            console.warn('[Auth] Popup falló:', error.code, error.message);

            if (googleAuthStatus) {
                googleAuthStatus.style.display = 'none';
            }

            if (error.code === 'auth/popup-blocked' || 
                error.code === 'auth/popup-closed-by-user' ||
                error.code === 'auth/cancelled-popup-request') {
                console.log('[Auth] Intentando con redirect...');
                firebase.auth().signInWithRedirect(provider);
                return;
            }

            if (error.code === 'auth/operation-not-allowed') {
                alert('⚠️ El inicio de sesión con Google aún no está habilitado en Firebase Console.\nPodés registrarte al instante con tu WhatsApp en la pestaña anterior.');
                switchTab('whatsapp');
                return;
            }

            if (error.code === 'auth/unauthorized-domain') {
                alert('⚠️ Dominio theking.sbs pendiente de autorizar en Firebase Console.\nPodés registrarte al instante con tu WhatsApp en la pestaña anterior.');
                switchTab('whatsapp');
                return;
            }

            alert(`⚠️ No se pudo completar el login con Google (${error.code}). Te recomendamos usar el Registro con WhatsApp.`);
            switchTab('whatsapp');
        });
    }

    if (btnGoogleLoginAction) {
        btnGoogleLoginAction.addEventListener('click', loginWithGoogle);
    }

    // === MENÚ DE USUARIO AUTENTICADO ===
    function showUserMenu(user) {
        const existing = document.getElementById('king-user-dropdown') || document.getElementById('king-user-menu');
        if (existing) { existing.remove(); return; }

        const menu = document.createElement('div');
        menu.id = 'king-user-dropdown';
        menu.className = 'king-user-dropdown';
        menu.style.cssText = `
            position: fixed; top: 60px; right: 15px; z-index: 10000;
            background: rgba(20, 22, 35, 0.98); backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 183, 3, 0.35); border-radius: 16px;
            padding: 1.2rem; min-width: 270px; max-width: 330px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.75);
            animation: fadeInMenu 0.2s ease-out;
        `;

        const castilloBadgeHTML = (typeof window.ReinoCastillos !== 'undefined' && window.ReinoCastillos.getCastilloBadgeHTML)
            ? window.ReinoCastillos.getCastilloBadgeHTML(user)
            : '';

        menu.innerHTML = `
            <style>
                @keyframes fadeInMenu { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .king-menu-item { display: flex; align-items: center; gap: 10px; padding: 0.7rem 0.5rem; border-radius: 10px; cursor: pointer; transition: background 0.2s; color: #fff; font-size: 0.88rem; }
                .king-menu-item:hover { background: rgba(255,255,255,0.08); }
            </style>
            <div style="display: flex; align-items: center; gap: 10px; padding-bottom: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 0.5rem;">
                ${user.photo ? `<img src="${user.photo}" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #FFB703;" onerror="this.style.display='none'">` : `<div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,183,3,0.2); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">👑</div>`}
                <div style="overflow: hidden;">
                    <div style="font-weight: 800; font-size: 0.95rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.name}</div>
                    <div style="font-size: 0.75rem; color: var(--accent-color); font-weight: 700;">🪙 ${user.coronas || 10} Coronas acumuladas</div>
                    ${user.phone ? `<div style="font-size: 0.72rem; color: #888;">📱 ${user.phone}</div>` : ''}
                </div>
            </div>
            ${castilloBadgeHTML}
            <div class="king-menu-item" id="king-menu-reino">
                <span>🏰</span> <span>Mapa del Reino & Mi Castillo</span>
            </div>
            <div class="king-menu-item" id="king-menu-edit">
                <span>✏️</span> <span>Modificar mis datos</span>
            </div>
            <div class="king-menu-item" id="king-menu-arcade">
                <span>🕹️</span> <span>Zona Arcade Tetrix</span>
            </div>
            <div class="king-menu-item" id="king-menu-logout" style="color: #ef233c; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.8rem;">
                <span>🚪</span> <span>Cerrar Sesión</span>
            </div>
        `;

        document.body.appendChild(menu);

        const reinoItem = document.getElementById('king-menu-reino');
        if (reinoItem) {
            reinoItem.addEventListener('click', () => {
                menu.remove();
                if (typeof window.ReinoCastillos !== 'undefined') {
                    window.ReinoCastillos.openReinoModal('mapa');
                }
            });
        }

        document.getElementById('king-menu-edit').addEventListener('click', () => {
            menu.remove();
            openAuthModal('whatsapp');
        });

        document.getElementById('king-menu-arcade').addEventListener('click', () => {
            window.location.href = 'tetrix.html';
        });

        document.getElementById('king-menu-logout').addEventListener('click', () => {
            clearClientSession();
            if (typeof firebase !== 'undefined' && firebase.auth) {
                firebase.auth().signOut().catch(() => {});
            }
            menu.remove();
            updateAuthUI();
        });

        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && (!userProfileBtn || !userProfileBtn.contains(e.target)) && (!menuAuthBtn || !menuAuthBtn.contains(e.target))) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    // Exponer API global de autenticación y Palacio Real
    window.KingAuth = {
        getClientSession,
        setClientSession,
        clearClientSession,
        getCurrentKingUser,
        saveKingPalacioReal,
        renderPalacioRealBadge,
        syncCheckoutFields,
        updateAuthUI,
        openAuthModal,
        closeAuthModal
    };
    window.saveKingPalacioReal = saveKingPalacioReal;
    window.getCurrentKingUser = getCurrentKingUser;
    window.renderPalacioRealBadge = renderPalacioRealBadge;
    window.syncCheckoutFields = syncCheckoutFields;

    // Inicializar UI al cargar
    updateAuthUI();
});
