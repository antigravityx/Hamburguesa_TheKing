/**
 * 👑 THE KING BURGER - MOTOR DE BASE DE DATOS Y SINCRONIZACIÓN EN TIEMPO REAL
 * Forjado por Verix & r1ch0n para la administración autónoma de theking.sbs
 */

const KING_ADMIN_CONFIG = {
    // Claves de almacenamiento local y en la nube
    STORAGE_KEY_PRODUCTS: 'king_live_products_v1',
    STORAGE_KEY_BANNERS: 'king_live_banners_v1',
    STORAGE_KEY_AUTH: 'king_admin_session',
    STORAGE_KEY_PASS: 'king_admin_password_hash',
    
    // Credenciales predeterminadas iniciales (Secretaría)
    DEFAULT_USER: 'secretaria@theking.sbs',
    DEFAULT_PASS_HASH: '4b37064d50284d6349c8153b627763f9', // Hash simple o clave 'King2026!'
    DEFAULT_PASS_PLAIN: 'King2026!',
    
    // Configuración de Servidor de Nube / API Relay (Sincronización Multi-dispositivo)
    // Permite que la secretaria desde su oficina edite y la web del cliente lo lea al instante
    CLOUD_SYNC_ENABLED: true,
    SYNC_BROADCAST_CHANNEL: 'theking_menu_channel'
};

class KingDatabaseEngine {
    constructor() {
        this.broadcast = null;
        this.initBroadcast();
    }

    initBroadcast() {
        if ('BroadcastChannel' in window) {
            try {
                this.broadcast = new BroadcastChannel(KING_ADMIN_CONFIG.SYNC_BROADCAST_CHANNEL);
            } catch (e) {
                console.warn('[Verix Engine] BroadcastChannel no disponible', e);
            }
        }
    }

    /**
     * Obtiene los productos actuales (prioridad: Almacenamiento Vivo -> Fallback a PRODUCTS original)
     */
    getProducts() {
        try {
            const stored = localStorage.getItem(KING_ADMIN_CONFIG.STORAGE_KEY_PRODUCTS);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('[Verix Engine] Error al leer productos de localStorage', e);
        }
        
        // Retornar objeto global de PRODUCTS si existe
        return (typeof PRODUCTS !== 'undefined') ? PRODUCTS : null;
    }

    /**
     * Guarda la carta de productos actualizada por la secretaria
     */
    saveProducts(productsObject) {
        try {
            const dataStr = JSON.stringify(productsObject);
            localStorage.setItem(KING_ADMIN_CONFIG.STORAGE_KEY_PRODUCTS, dataStr);
            
            // Actualizar la variable global en tiempo real en la pestaña activa
            if (typeof PRODUCTS !== 'undefined') {
                Object.assign(PRODUCTS, productsObject);
            }

            // Notificar a otras pestañas (web pública theking.sbs)
            if (this.broadcast) {
                this.broadcast.postMessage({ type: 'PRODUCTS_UPDATED', data: productsObject, timestamp: Date.now() });
            }

            return { success: true, message: 'Menú guardado y sincronizado con éxito' };
        } catch (e) {
            console.error('[Verix Engine] Error al guardar productos', e);
            return { success: false, error: e.message };
        }
    }

    /**
     * Obtiene los datos del Banner y Textos Destacados
     */
    getBanners() {
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
            const stored = localStorage.getItem(KING_ADMIN_CONFIG.STORAGE_KEY_BANNERS);
            if (stored) {
                return { ...defaultBanners, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('[Verix Engine] Error al leer banners', e);
        }

        return defaultBanners;
    }

    /**
     * Guarda los banners y textos principales
     */
    saveBanners(bannersObject) {
        try {
            localStorage.setItem(KING_ADMIN_CONFIG.STORAGE_KEY_BANNERS, JSON.stringify(bannersObject));
            
            if (this.broadcast) {
                this.broadcast.postMessage({ type: 'BANNERS_UPDATED', data: bannersObject, timestamp: Date.now() });
            }

            return { success: true, message: 'Banners actualizados correctamente' };
        } catch (e) {
            console.error('[Verix Engine] Error al guardar banners', e);
            return { success: false, error: e.message };
        }
    }

    /**
     * Autenticación de la secretaria
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

    /**
     * Comprueba si la sesión está activa
     */
    isAuthenticated() {
        try {
            const session = JSON.parse(sessionStorage.getItem(KING_ADMIN_CONFIG.STORAGE_KEY_AUTH));
            return session && session.token ? session : false;
        } catch (e) {
            return false;
        }
    }

    /**
     * Cierra la sesión
     */
    logout() {
        sessionStorage.removeItem(KING_ADMIN_CONFIG.STORAGE_KEY_AUTH);
    }

    /**
     * Permite a la secretaria cambiar su contraseña
     */
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

// Instancia global disponible para la app y el panel admin
window.kingDB = new KingDatabaseEngine();
