/**
 * 👑 THE KING BURGER - MOTOR DE BASE DE DATOS Y SINCRONIZACIÓN EN TIEMPO REAL
 * Forjado por Verix & r1ch0n para la administración autónoma de theking.sbs
 * v9.0 - Firebase Firestore Edition
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
    
    // Credenciales predeterminadas iniciales (Secretaría)
    DEFAULT_USER: 'secretaria@theking.sbs',
    DEFAULT_PASS_PLAIN: 'King2026!'
};

class KingDatabaseEngine {
    constructor() {
        this.db = db;
        // Caché local para evitar lecturas innecesarias
        this.localProducts = null;
        this.localBanners = null;
    }

    /**
     * Obtiene los productos desde Firestore
     */
    async getProductsAsync() {
        try {
            const doc = await this.db.collection('menu').doc('current').get();
            if (doc.exists) {
                this.localProducts = doc.data();
                return this.localProducts;
            }
        } catch (e) {
            console.error('[Verix Engine] Error al leer productos de Firebase', e);
        }
        
        // Retornar objeto global de PRODUCTS si existe como fallback
        return (typeof PRODUCTS !== 'undefined') ? PRODUCTS : null;
    }

    /**
     * Guarda la carta de productos en Firestore
     */
    async saveProductsAsync(productsObject) {
        try {
            await this.db.collection('menu').doc('current').set(productsObject);
            this.localProducts = productsObject;
            return { success: true, message: 'Menú guardado y sincronizado en la nube' };
        } catch (e) {
            console.error('[Verix Engine] Error al guardar productos', e);
            return { success: false, error: e.message };
        }
    }

    /**
     * Obtiene los datos del Banner y Textos Destacados desde Firestore
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
                return this.localBanners;
            }
        } catch (e) {
            console.error('[Verix Engine] Error al leer banners de Firebase', e);
        }
        return defaultBanners;
    }

    /**
     * Escuchadores en tiempo real para clientes
     */
    listenProducts(callback) {
        return this.db.collection('menu').doc('current').onSnapshot(doc => {
            if (doc.exists) {
                this.localProducts = doc.data();
                if (typeof PRODUCTS !== 'undefined') {
                    Object.assign(PRODUCTS, this.localProducts); // Actualiza la var global temporalmente
                }
                callback(this.localProducts);
            }
        });
    }

    listenBanners(callback) {
        return this.db.collection('config').doc('banners').onSnapshot(doc => {
            if (doc.exists) {
                this.localBanners = doc.data();
                callback(this.localBanners);
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
            
            // Limpiar ganador también
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
