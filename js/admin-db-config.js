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
let db = null;
try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
    } else {
        console.warn('[Verix Engine] Firebase no cargó (posible adblocker o sin internet). Funcionando en modo local.');
    }
} catch(e) {
    console.error('[Verix Engine] Error inicializando Firebase:', e);
}

const KING_ADMIN_CONFIG = {
    STORAGE_KEY_PRODUCTS: 'king_live_products_v1',
    STORAGE_KEY_BANNERS: 'king_live_banners_v1'
};

// BroadcastChannel para sincronización entre pestañas del mismo dominio
let _menuChannel = null;
try {
    if ('BroadcastChannel' in window) {
        _menuChannel = new BroadcastChannel('theking_menu_channel');
    }
} catch (e) { }

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
        if (this.db) {
            try {
                const doc = await this.db.collection('menu').doc('current').get();
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
                    return data;
                }
            } catch (e) {
                console.warn('[Verix Engine] initialLoadProducts: usando datos estáticos como fallback', e);
            }
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
        } catch (e) { }

        return null;
    }

    /**
     * Carga inicial de banners al arrancar la carta pública.
     */
    async initialLoadBanners() {
        if (this.db) {
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
        }

        // Intentar desde localStorage
        try {
            const cached = localStorage.getItem(KING_ADMIN_CONFIG.STORAGE_KEY_BANNERS);
            if (cached) {
                const data = JSON.parse(cached);
                if (data.phoneWhatsApp) this._phoneWhatsApp = data.phoneWhatsApp;
                return data;
            }
        } catch (e) { }

        return null;
    }

    /**
     * Obtiene los productos desde Firestore (usado por el admin)
     */
    async getProductsAsync() {
        if (this.db) {
            try {
                const doc = await this.db.collection('menu').doc('current').get();
                if (doc.exists) {
                    this.localProducts = doc.data();
                    return this.localProducts;
                }
            } catch (e) {
                console.warn('[Verix Engine] Sin conexión a Firebase, usando datos locales', e);
            }
        }

        try {
            const cached = localStorage.getItem(KING_ADMIN_CONFIG.STORAGE_KEY_PRODUCTS);
            if (cached) return JSON.parse(cached);
        } catch (e) { }

        return (typeof PRODUCTS !== 'undefined') ? PRODUCTS : null;
    }

    /**
     * Guarda la carta de productos en Firestore y sincroniza
     */
    async saveProductsAsync(productsObject) {
        try {
            if (this.db) {
                await this.db.collection('menu').doc('current').set(productsObject);
            }
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
            if (this.db) {
                const doc = await this.db.collection('config').doc('banners').get();
                if (doc.exists) {
                    this.localBanners = { ...defaultBanners, ...doc.data() };
                    if (this.localBanners.phoneWhatsApp) this._phoneWhatsApp = this.localBanners.phoneWhatsApp;
                    return this.localBanners;
                }
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
        if (!this.db) return null;
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
        if (!this.db) return null;
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
        if (!this.db) { callback({ active: false }); return null; }
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
            if (this.db) {
                await this.db.collection('config').doc('banners').set(bannersObject);
            }
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
            if (this.db) {
                const doc = await this.db.collection('config').doc('sorteo').get();
                if (doc.exists) {
                    return doc.data();
                }
            }
        } catch (e) {
            console.error(e);
        }
        return { active: false, premio: 'Premio Sorpresa', ganador: null };
    }

    async saveSorteoConfig(config) {
        try {
            if (this.db) {
                await this.db.collection('config').doc('sorteo').set(config, { merge: true });
            }
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Participantes del Sorteo (Observador en tiempo real)
     */
    listenSorteoParticipantes(callback) {
        if (!this.db) { callback([]); return null; }
        let legacyParticipants = [];
        let currentParticipants = [];
        const notify = () => callback([...legacyParticipants, ...currentParticipants]);
        const readParticipants = (snapshot) => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const unsubscribeLegacy = this.db.collection('sorteo_participantes').onSnapshot(
            snapshot => {
                legacyParticipants = readParticipants(snapshot);
                notify();
            },
            error => console.error('[Verix Engine] No se pudieron leer participantes anteriores:', error)
        );
        const unsubscribeCurrent = this.db.collection('sorteo_contactos').onSnapshot(
            snapshot => {
                currentParticipants = readParticipants(snapshot);
                notify();
            },
            error => console.error('[Verix Engine] No se pudieron leer contactos del sorteo:', error)
        );

        return () => {
            unsubscribeLegacy();
            unsubscribeCurrent();
        };
    }

    listenSorteoCount(callback) {
        if (!this.db) { callback(0); return null; }
        return this.db.collection('sorteo_publico').doc('estado').onSnapshot(
            snapshot => callback(snapshot.exists ? Number(snapshot.data().total) || 0 : 0),
            error => console.error('[Verix Engine] No se pudo leer el contador publico del sorteo:', error)
        );
    }

    async clearSorteoParticipantes() {
        try {
            if (this.db) {
                const snapshots = await Promise.all([
                    this.db.collection('sorteo_participantes').get(),
                    this.db.collection('sorteo_contactos').get()
                ]);
                const docs = snapshots.flatMap(snapshot => snapshot.docs);

                for (let index = 0; index < docs.length; index += 400) {
                    const batch = this.db.batch();
                    docs.slice(index, index + 400).forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                }

                await this.db.collection('sorteo_publico').doc('estado').set({
                    total: 0,
                    lastParticipantId: '',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                await this.db.collection('config').doc('sorteo').set({ ganador: null }, { merge: true });
            }
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async login(email, password) {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            throw new Error('Firebase Authentication no está disponible.');
        }
        return firebase.auth().signInWithEmailAndPassword(email.trim(), password);
    }

    async loginWithGoogle() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            throw new Error('Firebase Authentication no está disponible.');
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            return await firebase.auth().signInWithPopup(provider);
        } catch (error) {
            if (['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request']
                .includes(error.code)) {
                return firebase.auth().signInWithRedirect(provider);
            }
            throw error;
        }
    }

    async sendPasswordResetEmail(email) {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            throw new Error('Firebase Authentication no está disponible.');
        }
        return firebase.auth().sendPasswordResetEmail(email.trim());
    }

    async isAuthenticated(user = firebase.auth().currentUser) {
        if (!user || !this.db) return false;

        const access = await this.db.collection('adminUsers').doc(user.uid).get();
        if (!access.exists) return false;

        const profile = access.data();
        return profile.active === true && ['owner', 'secretary'].includes(profile.role) ? user : false;
    }

    logout() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            throw new Error('Firebase Authentication no está disponible.');
        }
        return firebase.auth().signOut();
    }

    async changePassword(currentPassword, newPassword) {
        const user = firebase.auth().currentUser;
        if (!user || !user.email) {
            throw new Error('No hay una sesión de correo válida.');
        }
        if (!newPassword || newPassword.length < 8) {
            throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
        }

        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPassword);
    }

    /**
     * ==========================================
     * MODULOS DE ESTADÍSTICAS Y SEMILLA IA
     * ==========================================
     */

    // Guardar Intento de Pedido (Web -> Firebase)
    async saveOrderIntent(cartItems) {
        try {
            if (!this.db) return true; // Pretender éxito si estamos offline
            const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const docRef = this.db.collection('stats_orders').doc(dateStr);

            await this.db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);

                let data = doc.exists ? doc.data() : { totalOrders: 0, products: {} };
                data.totalOrders += 1;

                cartItems.forEach(item => {
                    const cleanName = item.name.replace(/[^a-zA-Z0-9]/g, '_');
                    if (!data.products[cleanName]) data.products[cleanName] = 0;
                    data.products[cleanName] += item.quantity;
                });

                transaction.set(docRef, data);
            });
            return true;
        } catch (e) {
            console.warn('[Verix Engine] No se pudo guardar stat:', e);
            return false;
        }
    }

    // Guardar Valoración de Corona (Web -> Firebase)
    async saveCrownRating(productName, stars) {
        try {
            if (!this.db) return true;
            const cleanName = productName.replace(/[^a-zA-Z0-9]/g, '_');
            const docRef = this.db.collection('stats_ratings').doc(cleanName);

            await this.db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);
                let data = doc.exists ? doc.data() : { productName, totalVotes: 0, totalStars: 0, average: 0 };

                data.totalVotes += 1;
                data.totalStars += stars;
                data.average = data.totalStars / data.totalVotes;

                transaction.set(docRef, data);
            });
            return true;
        } catch (e) {
            console.warn('[Verix Engine] No se pudo guardar rating:', e);
            return false;
        }
    }

    // Escuchar Stats de los últimos 7 días (Para Admin Dashboard)
    listenStats7Days(callback) {
        if (!this.db) { callback([]); return null; }
        const past7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        });

        return this.db.collection('stats_orders').onSnapshot(snapshot => {
            const stats = [];
            snapshot.forEach(doc => {
                if (past7Days.includes(doc.id)) {
                    stats.push({ date: doc.id, ...doc.data() });
                }
            });
            stats.sort((a, b) => a.date.localeCompare(b.date)); // Cronológico
            callback(stats);
        });
    }

    // Escuchar Ratings (Para Admin Dashboard)
    listenRatings(callback) {
        if (!this.db) { callback([]); return null; }
        return this.db.collection('stats_ratings').onSnapshot(snapshot => {
            const ratings = [];
            snapshot.forEach(doc => {
                ratings.push(doc.data());
            });
            callback(ratings);
        });
    }
}

// Instancia global
window.kingDB = new KingDatabaseEngine();
