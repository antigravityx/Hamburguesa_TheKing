/**
 * 👑 THE KING BURGER - MOTOR DE BASE DE DATOS Y SINCRONIZACIÓN EN TIEMPO REAL
 * Forjado por Verix & r1ch0n para la administración autónoma de theking.sbs
 * v9.1 - Firebase Firestore + Sync Dual (BroadcastChannel + localStorage)
 */

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyB2S21A2BfQbpJSG3KaT3t8IiH5ViMZZmc",
    authDomain: "theking-burger.firebaseapp.com",
    projectId: "theking-burger",
    storageBucket: "theking-burger.firebasestorage.app",
    messagingSenderId: "647398051589",
    appId: "1:647398051589:web:17655a8455a8f9539df16c"
};

// Initialize Firebase (compat mode)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const KING_ADMIN_CONFIG = {
    STORAGE_KEY_AUTH: 'king_admin_session',
    STORAGE_KEY_PASS: 'king_admin_password_hash',
    STORAGE_KEY_PRODUCTS: 'king_live_products_v1',   // constante faltante — CORREGIDA
    STORAGE_KEY_BANNERS: 'king_live_banners_v1',      // constante faltante — CORREGIDA

    // Credenciales predeterminadas iniciales (Secretaría)
    DEFAULT_USER: 'secretaria@theking.sbs',
    DEFAULT_PASS_PLAIN: 'King2026!'
};

// BroadcastChannel para sincronización entre pestañas del mismo dominio
let _menuChannel = null;
try {
    if ('BroadcastChannel' in window) {
        _menuChannel = new BroadcastChannel('theking_menu_channel');
    }
} catch(e) {}

class KingDatabaseEngine {
    constructor() {
        this.db = db;
        this.localProducts = null;
        this.localBanners = null;
        this._phoneWhatsApp = '5493794299964'; // Fallback
    }

    /**
     * Carga inicial de productos al arrancar la carta pública.
     * Lee de Firebase primero, actualiza PRODUCTS global y localStorage.
     */
    async initialLoadProducts() {
        try {
            const doc = await this.db.collection('menu').doc('current').get();
            if (doc.exists) {
                const data = doc.data();
                this.localProducts = data;
                if (typeof PRODUCTS !== 'undefined') {
                    // Reemplazar categoría por categoría
                    Object.keys(data).forEach(key => { PRODUCTS[key] = data[key]; });
                    // Eliminar categorías que ya no existen en Firebase
                    Object.keys(PRODUCTS).forEach(key => {
                        if (!(key in data)) delete PRODUCTS[key];
                    });
                }
                localStorage.setItem(KING_ADMIN_CONFIG.STORAGE_KEY_PRODUCTS, JSON.stringify(data));
                return data;
            }
        } catch (e) {
            console.warn('[Verix Engine] initialLoadProducts: usando datos estáticos como fallback', e);
        }

        // Intentar desde localStorage como segundo fallback
        try {
            const cached = localStorage.getItem(KING_ADMIN_CONFIG.STORAGE_KEY_PRODUCTS);
            if (cached) {
                const data = JSON.parse(cached);
                if (typeof PRODUCTS !== 'undefined') {
                    Object.keys(data).forEach(key => { PRODUCTS[key] = data[key]; });
                }
                return data;
            }
        } catch(e) {}

        return null;
    }

    /**
     * Carga inicial de banners al arrancar la carta pública.
     */
    async initialLoadBanners() {
        try {
            const doc = await this.db.collection('config').doc('banners').get();
            if (doc.exists) {
                const data = doc.data();
                this.localBanners = data;
                if (data.phoneWhatsApp) this._phoneWhatsApp = data.phoneWhatsApp;
                localStorage.setItem(KING_ADMIN_CONFIG.STORAGE_KEY_BANNERS, JSON.stringify(data));
                return data;
            }
        } catch (e) {
            console.warn('[Verix Engine] initialLoadBanners: usando fallback', e);
        }

        // Intentar desde localStorage
        try {
            const cached = localStorage.getItem(KING_ADMIN_CONFIG.STORAGE_KEY_BANNERS);
            if (cached) {
                const data = JSON.parse(cached);
                if (data.phoneWhatsApp) this._phoneWhatsApp = data.phoneWhatsApp;
                return data;
            }
        } catch(e) {}

        return null;
    }

    /**
     * Obtiene los productos desde Firestore (usado por el admin)
     */
    async getProductsAsync() {
        try {
            const doc = await this.db.collection('menu').doc('current').get();
            if (doc.exists) {
                this.localProducts = doc.data();
                return this.localProducts;
            }
        } catch (e) {
            console.warn('[Verix Engine] Sin conexión a Firebase, usando datos locales', e);
        }

        try {
            const cached = localStorage.getItem(KING_ADMIN_CONFIG.STORAGE_KEY_PRODUCTS);
            if (cached) return JSON.parse(cached);
        } catch(e) {}

        return (typeof PRODUCTS !== 'undefined') ? PRODUCTS : null;
    }

    /**
     * Guarda la carta de productos en Firestore y sincroniza
     */
    async saveProductsAsync(productsObject) {
        try {
            await this.db.collection('menu').doc('current').set(productsObject);
            this.localProducts = productsObject;
            localStorage.setItem(KING_ADMIN_CONFIG.STORAGE_KEY_PRODUCTS, JSON.stringify(productsObject));
            if (_menuChannel) {
                _menuChannel.postMessage({ type: 'PRODUCTS_UPDATED', data: productsObject });
            }
            return { success: true, message: 'Menú guardado y sincronizado en la nube' };
        } catch (e) {
            console.error('[Verix Engine] Error al guardar productos', e);
            return { success: false, error: e.message };
        }
    }

    /**
     * Obtiene los banners desde Firestore (usado por el admin)
     */
    async getBannersAsync() {
        const defaultBanners = {
            heroTitle: "THE KING BURGER",
            heroSubtitle: "El Sabor de la Corona",
            heroSub: "Hamburguesas Artesanales · Pizzas · Delivery Propio",
            phone: "3794-29-9964",
            phoneWhatsApp: "5493794299964",
            instagram: "@theking.ctes",
            promoBarText: "🔥 ¡Promociones Especiales de la Semana activas! Hacé tu pedido por WhatsApp.",
            promoBarActive: true
        };

        try {
            const doc = await this.db.collection('config').doc('banners').get();
            if (doc.exists) {
                this.localBanners = { ...defaultBanners, ...doc.data() };
                if (this.localBanners.phoneWhatsApp) this._phoneWhatsApp = this.localBanners.phoneWhatsApp;
                return this.localBanners;
            }
        } catch (e) {
            console.warn('[Verix Engine] Error al leer banners de Firebase', e);
        }
        return defaultBanners;
    }

    /**
     * Escuchadores en tiempo real — Sincronización FULL
     */
    listenProducts(callback) {
        return this.db.collection('menu').doc('current').onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                this.localProducts = data;
                if (typeof PRODUCTS !== 'undefined') {
                    Object.keys(data).forEach(key => { PRODUCTS[key] = data[key]; });
                    Object.keys(PRODUCTS).forEach(key => {
                        if (!(key in data)) delete PRODUCTS[key];
                    });
                }
                localStorage.setItem(KING_ADMIN_CONFIG.STORAGE_KEY_PRODUCTS, JSON.stringify(data));
                if (_menuChannel) {
                    _menuChannel.postMessage({ type: 'PRODUCTS_UPDATED', data });
                }
                callback(data);
            }
        });
    }

    listenBanners(callback) {
        return this.db.collection('config').doc('banners').onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                this.localBanners = data;
                if (data.phoneWhatsApp) this._phoneWhatsApp = data.phoneWhatsApp;
                localStorage.setItem(KING_ADMIN_CONFIG.STORAGE_KEY_BANNERS, JSON.stringify(data));
                callback(data);
            }
        });
    }

    listenSorteo(callback) {
        return this.db.collection('config').doc('sorteo').onSnapshot(doc => {
            if (doc.exists) {
                callback(doc.data());
            } else {
                callback({ active: false });
            }
        });
    }

    /**
     * Guarda los banners en Firestore
     */
    async saveBannersAsync(bannersObject) {
        try {
            await this.db.collection('config').doc('banners').set(bannersObject);
            this.localBanners = bannersObject;
            if (bannersObject.phoneWhatsApp) this._phoneWhatsApp = bannersObject.phoneWhatsApp;
            localStorage.setItem(KING_ADMIN_CONFIG.STORAGE_KEY_BANNERS, JSON.stringify(bannersObject));
            return { success: true, message: 'Banners actualizados en la nube' };
        } catch (e) {
            console.error('[Verix Engine] Error al guardar banners', e);
            return { success: false, error: e.message };
        }
    }

    /**
     * Configuración del Sorteo
     */
    async getSorteoConfig() {
        try {
            const doc = await this.db.collection('config').doc('sorteo').get();
            if (doc.exists) {
                return doc.data();
            }
        } catch (e) {
            console.error(e);
        }
        return { active: false, premio: 'Premio Sorpresa', ganador: null };
    }

    async saveSorteoConfig(config) {
        try {
            await this.db.collection('config').doc('sorteo').set(config, { merge: true });
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Participantes del Sorteo (Observador en tiempo real)
     */
    listenSorteoParticipantes(callback) {
        return this.db.collection('sorteo_participantes').onSnapshot((snapshot) => {
            const participantes = [];
            snapshot.forEach(doc => {
                participantes.push({ id: doc.id, ...doc.data() });
            });
            callback(participantes);
        });
    }

    async clearSorteoParticipantes() {
        try {
            const snapshot = await this.db.collection('sorteo_participantes').get();
            const batch = this.db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            await this.db.collection('config').doc('sorteo').set({ ganador: null }, { merge: true });
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Autenticación básica local de la secretaria
     */
    login(user, password) {
        const cleanUser = user.trim().toLowerCase();
        const customPass = localStorage.getItem(KING_ADMIN_CONFIG.STORAGE_KEY_PASS) || KING_ADMIN_CONFIG.DEFAULT_PASS_PLAIN;

        if ((cleanUser === 'secretaria@theking.sbs' || cleanUser === 'admin@theking.sbs' || cleanUser === 'secretaria' || cleanUser === 'admin') && password === customPass) {
            const session = {
                user: cleanUser,
                token: 'king_sec_token_' + Math.random().toString(36).substring(2),
                loginTime: Date.now()
            };
            sessionStorage.setItem(KING_ADMIN_CONFIG.STORAGE_KEY_AUTH, JSON.stringify(session));
            return { success: true, session };
        }
        return { success: false, error: 'Usuario o contraseña incorrectos.' };
    }

    isAuthenticated() {
        try {
            const session = JSON.parse(sessionStorage.getItem(KING_ADMIN_CONFIG.STORAGE_KEY_AUTH));
            return session && session.token ? session : false;
        } catch (e) {
            return false;
        }
    }

    logout() {
        sessionStorage.removeItem(KING_ADMIN_CONFIG.STORAGE_KEY_AUTH);
    }

    changePassword(oldPass, newPass) {
        const currentPass = localStorage.getItem(KING_ADMIN_CONFIG.STORAGE_KEY_PASS) || KING_ADMIN_CONFIG.DEFAULT_PASS_PLAIN;
        if (oldPass !== currentPass) {
            return { success: false, error: 'La contraseña actual no es correcta.' };
        }
        if (!newPass || newPass.length < 6) {
            return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
        }
        localStorage.setItem(KING_ADMIN_CONFIG.STORAGE_KEY_PASS, newPass);
        return { success: true, message: 'Contraseña cambiada exitosamente.' };
    }
}

// Instancia global
window.kingDB = new KingDatabaseEngine();

