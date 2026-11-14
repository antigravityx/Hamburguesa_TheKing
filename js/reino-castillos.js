/**
 * ==========================================================================
 * THE KING BURGER — MÓDULO DEL CASTILLO EVOLUTIVO Y MAPA DEL REINO
 * reino-castillos.js
 * ==========================================================================
 * Gamificación de Castillos Soberanos en Corrientes Capital.
 * - Niveles 1 a 4 con SVG dinámico, chimeneas humeantes, cúpulas doradas y neón.
 * - Mapa interactivo Leaflet de barrios correntinos y palacios reales.
 * - Leaderboard de barrios y panel de evolución del cliente.
 * 
 * Trinidad R1CH0N · VERIX · ARKH
 * ==========================================================================
 */

(function (window, document) {
    'use strict';

    // --- CONFIGURACIÓN BASE DEL REINO ---
    const COORDS_MATRIZ = { lat: -27.4611, lon: -58.7817 }; // Av. Río Chico 5410, Corrientes
    const WHATSAPP_PHONE = '5493794299964';

    // --- BANCO DE DATOS DE CASTILLOS DEL REINO EN CORRIENTES CAPITAL ---
    const BANCO_CASTILLOS_CORRIENTES = [
        {
            id: 'matriz-the-king',
            nombre: 'Gran Fortaleza Matriz The King',
            barrio: 'Río Chico / San Jerónimo',
            nivel: 4,
            lat: -27.4611,
            lon: -58.7817,
            soberano: 'Monarca Ricardo & Doña Rosa',
            coronas: 9999,
            pedidos: 5400,
            tipo: 'matriz',
            descripcion: 'El epicentro del fuego y la parrilla. Aquí se hornea el pan casero y se forjan las hamburguesas más legendarias de Corrientes.'
        },
        {
            id: 'baluarte-laguna-seca',
            nombre: 'Baluarte Laguna Seca',
            barrio: 'Laguna Seca',
            nivel: 3,
            lat: -27.4855,
            lon: -58.8055,
            soberano: 'Lord de la Doble Carne',
            coronas: 520,
            pedidos: 58,
            tipo: 'reino',
            descripcion: 'Bastión inexpugnable del sur correntino. Fanáticos de la Triple Cheddar y las papas cargadas hasta la madrugada.'
        },
        {
            id: 'fortaleza-mil-viviendas',
            nombre: 'Fortaleza Mil Viviendas',
            barrio: '1000 Viviendas',
            nivel: 3,
            lat: -27.4812,
            lon: -58.8285,
            soberano: 'Comandante de las Mil Torres',
            coronas: 610,
            pedidos: 67,
            tipo: 'reino',
            descripcion: 'La ciudadela más vibrante de la ciudad. Sus pasillos se llenan de aroma a carne asada con entregas relámpago.'
        },
        {
            id: 'ciudadela-camba-cua',
            nombre: 'Ciudadela Cambá Cuá',
            barrio: 'Cambá Cuá',
            nivel: 4,
            lat: -27.4710,
            lon: -58.8385,
            soberano: 'Duquesa del Candombe & San Baltasar',
            coronas: 780,
            pedidos: 84,
            tipo: 'reino',
            descripcion: 'Castillo bohemio bañado en luces de neón dorado y fucsia. Fiestas reales, música y el sabor indiscutible de The King.'
        },
        {
            id: 'corte-centro-historico',
            nombre: 'Corte Real Centro Histórico',
            barrio: 'Centro',
            nivel: 4,
            lat: -27.4655,
            lon: -58.8355,
            soberano: 'Gran Magistrado de Plaza 25',
            coronas: 890,
            pedidos: 96,
            tipo: 'reino',
            descripcion: 'El corazón institucional del reino. Banquete predilecto de universitarios, oficinistas y trasnochadores correntinos.'
        },
        {
            id: 'ciudadela-san-jeronimo',
            nombre: 'Ciudadela San Jerónimo',
            barrio: 'San Jerónimo',
            nivel: 2,
            lat: -27.4660,
            lon: -58.7990,
            soberano: 'Guardián del Eucaliptal',
            coronas: 310,
            pedidos: 35,
            tipo: 'reino',
            descripcion: 'Próxima a las arboledas del Eucaliptal. Hogar de caballeros leales que defienden la hamburguesa artesanal al 100%.'
        },
        {
            id: 'fortaleza-molina-punta',
            nombre: 'Fortaleza Molina Punta',
            barrio: 'Molina Punta',
            nivel: 2,
            lat: -27.4465,
            lon: -58.8025,
            soberano: 'Vigía del Paraná Norte',
            coronas: 280,
            pedidos: 31,
            tipo: 'reino',
            descripcion: 'Custodia el río y la costanera norte. Las motos de delivery vuelan por las avenidas con pedidos crujientes.'
        },
        {
            id: 'atalaya-barrio-ferre',
            nombre: 'Atalaya Ferré',
            barrio: 'Barrio Ferré',
            nivel: 2,
            lat: -27.4770,
            lon: -58.8180,
            soberano: 'Alcaide de los Monoblocks',
            coronas: 245,
            pedidos: 27,
            tipo: 'reino',
            descripcion: 'Ubicación clave entre plazoletas y avenidas anchas. Baluarte en ascenso constante sumando coronas cada fin de semana.'
        },
        {
            id: 'baluarte-san-marcelo',
            nombre: 'Baluarte San Marcelo',
            barrio: 'San Marcelo',
            nivel: 1,
            lat: -27.4740,
            lon: -58.7920,
            soberano: 'Caballero del Sol Naciente',
            coronas: 180,
            pedidos: 19,
            tipo: 'reino',
            descripcion: 'Noble bastión de reciente fundación. Creciendo con cada combo entregado a domicilio.'
        },
        {
            id: 'bastion-17-agosto',
            nombre: 'Bastión 17 de Agosto',
            barrio: '17 de Agosto',
            nivel: 3,
            lat: -27.4820,
            lon: -58.8100,
            soberano: 'Centinela de la Rotonda',
            coronas: 540,
            pedidos: 61,
            tipo: 'reino',
            descripcion: 'Frente al cruce neurálgico del este. Muros altos protegidos por amantes incondicionales de la King Burger con huevo frito.'
        },
        {
            id: 'palacio-costanera-arazaty',
            nombre: 'Palacio Costanera Arazaty',
            barrio: 'Costanera Sur',
            nivel: 3,
            lat: -27.4725,
            lon: -58.8475,
            soberano: 'Guardián Bajo el Puente Belgrano',
            coronas: 490,
            pedidos: 53,
            tipo: 'reino',
            descripcion: 'Mirador privilegiado frente a los atardeceres dorados del río Paraná y las luces del puente interprovincial.'
        },
        {
            id: 'torre-universitaria-aldana',
            nombre: 'Torre Universitaria Aldana',
            barrio: 'Aldana',
            nivel: 2,
            lat: -27.4640,
            lon: -58.8150,
            soberano: 'Maestre de la UNNE',
            coronas: 320,
            pedidos: 38,
            tipo: 'reino',
            descripcion: 'Campamento de estudio y camaradería. Hamburguesas gigantes que potencian noches de exámenes y victorias.'
        },
        {
            id: 'baluarte-ponce',
            nombre: 'Baluarte Barrio Ponce',
            barrio: 'Barrio Ponce',
            nivel: 1,
            lat: -27.4850,
            lon: -58.7660,
            soberano: 'Guardián del Extremo Este',
            coronas: 165,
            pedidos: 17,
            tipo: 'reino',
            descripcion: 'La frontera oriental del reino. Fieles comensales que acumulan coronas con entusiasmo imparable.'
        }
    ];

    // --- CÁLCULO DEL NIVEL DE CASTILLO ---
    /**
     * Calcula el nivel y upgrades del castillo según pedidos y coronas acumuladas:
     * - Nivel 1 (Baluarte Inicial): 1 a 2 pedidos (o 10-25 coronas).
     * - Nivel 2 (Fortaleza Moderna): 3 a 5 pedidos (o 26-50 coronas).
     * - Nivel 3 (Ciudadela de Lujo): 6 a 9 pedidos (o 51-99 coronas).
     * - Nivel 4 (Palacio Imperial Soberano): 10+ pedidos (o 100+ coronas).
     */
    function calcularNivelCastillo(user) {
        let coronas = 10;
        let pedidos = 0;

        if (user) {
            coronas = Number(user.coronas !== undefined ? user.coronas : (user.crowns || 10));
            pedidos = Number(user.ordersCount || user.pedidos || user.completedOrders || 0);
        } else {
            try {
                const storedUser = JSON.parse(localStorage.getItem('king_client_session') || '{}');
                coronas = Number(storedUser.coronas || localStorage.getItem('king_rpg_coronas') || 10);
                pedidos = Number(storedUser.ordersCount || localStorage.getItem('king_user_orders_count') || 0);
            } catch (e) {
                coronas = 10;
                pedidos = 0;
            }
        }

        if (isNaN(coronas) || coronas < 0) coronas = 10;
        if (isNaN(pedidos) || pedidos < 0) pedidos = 0;

        let nivel = 1;
        let nombre = 'Baluarte Inicial';
        let subtitulo = 'Torre vigía con fogata y cimientos de piedra tallada';
        let upgrades = ['Cimientos de Piedra', 'Torre Vigía', 'Antorcha Nocturna', 'Bandera The King'];
        let color = '#ffb703';
        let glowColor = 'rgba(255, 183, 3, 0.45)';
        let minCoronas = 10;
        let nextNivel = 2;
        let nextMinCoronas = 26;
        let nextNombre = 'Fortaleza Moderna';

        if (pedidos >= 10 || coronas >= 100) {
            nivel = 4;
            nombre = 'Palacio Imperial Soberano';
            subtitulo = 'Majestuosa cúpula dorada 24k, fuegos artificiales y guardia real';
            upgrades = ['Cúpula Dorada 24k', 'Salón del Trono Real', 'Fuegos Artificiales', 'Guardia Imperial de Asfalto', 'Festín Perpetuo'];
            color = '#ffd700';
            glowColor = 'rgba(255, 215, 0, 0.75)';
            minCoronas = 100;
            nextNivel = null;
            nextMinCoronas = null;
            nextNombre = 'Nivel Máximo Alcanzado';
        } else if (pedidos >= 6 || coronas >= 51) {
            nivel = 3;
            nombre = 'Ciudadela de Lujo';
            subtitulo = 'Estandartes de seda, torreones nobles e iluminación neón violeta';
            upgrades = ['Estandarte de Seda Real', 'Almenas Iluminadas', 'Triple Torreón Noble', 'Puente Levadizo Neón', 'Foso Reflejante'];
            color = '#c084fc';
            glowColor = 'rgba(192, 132, 252, 0.65)';
            minCoronas = 51;
            nextNivel = 4;
            nextMinCoronas = 100;
            nextNombre = 'Palacio Imperial Soberano';
        } else if (pedidos >= 3 || coronas >= 26) {
            nivel = 2;
            nombre = 'Fortaleza Moderna';
            subtitulo = 'Muros reforzados con chimenea humeante y asador criollo';
            upgrades = ['Muros Reforzados', 'Chimenea Humeante Activa', 'Parrilla Criolla', 'Horno de Barro', 'Troneras de Arqueros'];
            color = '#60a5fa';
            glowColor = 'rgba(96, 165, 250, 0.6)';
            minCoronas = 26;
            nextNivel = 3;
            nextMinCoronas = 51;
            nextNombre = 'Ciudadela de Lujo';
        } else {
            // Nivel 1 (1-2 pedidos o 10-25 coronas)
            nivel = 1;
            nombre = 'Baluarte Inicial';
            subtitulo = 'Torre vigía con fogata y cimientos de piedra tallada';
            upgrades = ['Cimientos de Piedra', 'Torre Vigía', 'Antorcha Nocturna', 'Bandera The King'];
            color = '#ffb703';
            glowColor = 'rgba(255, 183, 3, 0.45)';
            minCoronas = 10;
            nextNivel = 2;
            nextMinCoronas = 26;
            nextNombre = 'Fortaleza Moderna';
        }

        // Progreso relativo al siguiente nivel
        let progreso = 100;
        if (nextMinCoronas !== null) {
            const tramo = nextMinCoronas - minCoronas;
            const actualEnTramo = Math.max(0, coronas - minCoronas);
            progreso = Math.min(100, Math.max(8, Math.round((actualEnTramo / tramo) * 100)));
        }

        return {
            nivel,
            nombre,
            subtitulo,
            upgrades,
            color,
            glowColor,
            coronas,
            pedidos,
            minCoronas,
            nextNivel,
            nextMinCoronas,
            nextNombre,
            progreso
        };
    }

    // --- GENERADOR DE ICONOS SVG DINÁMICOS POR NIVEL ---
    /**
     * Genera un SVG optimizado del castillo según el nivel y upgrades.
     * Incluye animaciones CSS (humo flotante, antorcha vibrante, destello dorado, neón).
     */
    function getCastilloSVG(nivel, opts = {}) {
        const size = opts.size || 64;
        const animated = opts.animated !== false;
        const n = Math.min(4, Math.max(1, parseInt(nivel, 10) || 1));

        // Nivel 1: Baluarte Inicial (Torre de piedra, antorcha flameante y bandera)
        if (n === 1) {
            return `
            <svg class="reino-castillo-svg reino-castillo-nv1" viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle; filter:drop-shadow(0 4px 10px rgba(255,183,3,0.35));">
                <defs>
                    <linearGradient id="wallN1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#44403c"/>
                        <stop offset="100%" stop-color="#292524"/>
                    </linearGradient>
                    <linearGradient id="goldN1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#ffb703"/>
                        <stop offset="100%" stop-color="#fb8500"/>
                    </linearGradient>
                </defs>
                <!-- Base de roca -->
                <ellipse cx="50" cy="88" rx="42" ry="7" fill="#1c1917" opacity="0.6"/>
                <path d="M18 85 L82 85 L76 72 L24 72 Z" fill="#292524" stroke="#ffb703" stroke-width="1.2"/>
                <!-- Muralla central -->
                <rect x="28" y="44" width="44" height="34" rx="2" fill="url(#wallN1)" stroke="#ffb703" stroke-width="1.4"/>
                <!-- Almenas superiores -->
                <path d="M26 44 L32 44 L32 36 L38 36 L38 44 L46 44 L46 36 L54 36 L54 44 L62 44 L62 36 L68 36 L68 44 L74 44 L74 34 L26 34 Z" fill="#57534e" stroke="#ffb703" stroke-width="1.2"/>
                <!-- Puerta de madera con arco -->
                <path d="M42 78 L42 58 C42 53 58 53 58 58 L58 78 Z" fill="#78350f" stroke="#ffb703" stroke-width="1.2"/>
                <circle cx="54" cy="68" r="1.5" fill="#ffb703"/>
                <!-- Bandera en lo alto -->
                <line x1="50" y1="34" x2="50" y2="15" stroke="#ffb703" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M50 16 L68 22 L50 28 Z" fill="url(#goldN1)" stroke="#ffb703" stroke-width="1"/>
                <!-- Antorcha flameante con animación -->
                <rect x="33" y="56" width="3" height="8" rx="1" fill="#78350f"/>
                <circle cx="34.5" cy="54" r="3" fill="#ff4d00" ${animated ? 'style="animation: flamePulse 1.2s infinite alternate;"' : ''}/>
                <circle cx="34.5" cy="53" r="1.8" fill="#ffb703"/>
                <!-- Insignia Nivel 1 -->
                <circle cx="50" cy="46" r="4.5" fill="#1c1917" stroke="#ffb703" stroke-width="1"/>
                <text x="50" y="49" font-family="'Outfit', sans-serif" font-size="6" font-weight="900" fill="#ffb703" text-anchor="middle">1</text>
            </svg>
            `;
        }

        // Nivel 2: Fortaleza Moderna (Torres gemelas, murallas de ladrillo y chimenea humeante)
        if (n === 2) {
            return `
            <svg class="reino-castillo-svg reino-castillo-nv2" viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle; filter:drop-shadow(0 4px 12px rgba(96,165,250,0.4));">
                <defs>
                    <linearGradient id="wallN2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#334155"/>
                        <stop offset="100%" stop-color="#1e293b"/>
                    </linearGradient>
                    <linearGradient id="roofN2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#3b82f6"/>
                        <stop offset="100%" stop-color="#1d4ed8"/>
                    </linearGradient>
                </defs>
                <!-- Base rocosa -->
                <ellipse cx="50" cy="89" rx="44" ry="7" fill="#0f172a" opacity="0.7"/>
                <!-- Torre izquierda -->
                <rect x="15" y="42" width="22" height="42" rx="2" fill="url(#wallN2)" stroke="#60a5fa" stroke-width="1.2"/>
                <path d="M13 42 L26 22 L39 42 Z" fill="url(#roofN2)" stroke="#60a5fa" stroke-width="1.2"/>
                <!-- Torre derecha -->
                <rect x="63" y="42" width="22" height="42" rx="2" fill="url(#wallN2)" stroke="#60a5fa" stroke-width="1.2"/>
                <path d="M61 42 L74 22 L87 42 Z" fill="url(#roofN2)" stroke="#60a5fa" stroke-width="1.2"/>
                <!-- Cuerpo central -->
                <rect x="33" y="48" width="34" height="36" fill="url(#wallN2)" stroke="#60a5fa" stroke-width="1.2"/>
                <path d="M33 48 L38 48 L38 42 L44 42 L44 48 L56 48 L56 42 L62 42 L62 48 L67 48" fill="none" stroke="#60a5fa" stroke-width="1.2"/>
                <!-- Chimenea humeante en torre izquierda -->
                <rect x="22" y="16" width="6" height="12" fill="#475569" stroke="#60a5fa" stroke-width="1"/>
                <!-- Humo animado -->
                ${animated ? `
                <circle cx="25" cy="12" r="3" fill="#cbd5e1" opacity="0.8" style="animation: smokePuff1 2s infinite ease-out;"/>
                <circle cx="23" cy="7" r="4" fill="#cbd5e1" opacity="0.5" style="animation: smokePuff2 2s 0.6s infinite ease-out;"/>
                <circle cx="27" cy="2" r="4.5" fill="#94a3b8" opacity="0.3" style="animation: smokePuff3 2s 1.2s infinite ease-out;"/>
                ` : `
                <circle cx="25" cy="11" r="3" fill="#cbd5e1" opacity="0.6"/>
                <circle cx="23" cy="6" r="3.5" fill="#cbd5e1" opacity="0.4"/>
                `}
                <!-- Ventanas iluminadas cálidas -->
                <rect x="23" y="52" width="5" height="8" rx="2" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8"/>
                <rect x="72" y="52" width="5" height="8" rx="2" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8"/>
                <!-- Portón de hierro con rastrillo -->
                <path d="M43 84 L43 65 C43 60 57 60 57 65 L57 84 Z" fill="#0f172a" stroke="#60a5fa" stroke-width="1.4"/>
                <line x1="50" y1="62" x2="50" y2="84" stroke="#60a5fa" stroke-width="1" stroke-dasharray="2,2"/>
                <!-- Insignia Nivel 2 -->
                <circle cx="50" cy="54" r="5" fill="#1e293b" stroke="#60a5fa" stroke-width="1.2"/>
                <text x="50" y="57.5" font-family="'Outfit', sans-serif" font-size="6.5" font-weight="900" fill="#60a5fa" text-anchor="middle">2</text>
            </svg>
            `;
        }

        // Nivel 3: Ciudadela de Lujo (Triple torre, neón ciberpunk violeta, estandartes dorados)
        if (n === 3) {
            return `
            <svg class="reino-castillo-svg reino-castillo-nv3" viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle; filter:drop-shadow(0 4px 14px rgba(192,132,252,0.55));">
                <defs>
                    <linearGradient id="wallN3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#4c1d95"/>
                        <stop offset="100%" stop-color="#1e1b4b"/>
                    </linearGradient>
                    <linearGradient id="roofN3" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#c084fc"/>
                        <stop offset="100%" stop-color="#ec4899"/>
                    </linearGradient>
                    <linearGradient id="goldBanner" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#ffd700"/>
                        <stop offset="100%" stop-color="#b45309"/>
                    </linearGradient>
                </defs>
                <!-- Plataforma de energía neón -->
                <ellipse cx="50" cy="90" rx="46" ry="7" fill="#2e1065" stroke="#c084fc" stroke-width="1" opacity="0.9"/>
                <!-- Torre central alta -->
                <rect x="38" y="28" width="24" height="58" rx="2" fill="url(#wallN3)" stroke="#c084fc" stroke-width="1.4"/>
                <path d="M35 28 L50 8 L65 28 Z" fill="url(#roofN3)" stroke="#c084fc" stroke-width="1.4"/>
                <!-- Torre izquierda -->
                <rect x="14" y="44" width="20" height="42" rx="2" fill="url(#wallN3)" stroke="#c084fc" stroke-width="1.2"/>
                <path d="M12 44 L24 24 L36 44 Z" fill="url(#roofN3)" stroke="#c084fc" stroke-width="1.2"/>
                <!-- Torre derecha -->
                <rect x="66" y="44" width="20" height="42" rx="2" fill="url(#wallN3)" stroke="#c084fc" stroke-width="1.2"/>
                <path d="M64 44 L76 24 L88 44 Z" fill="url(#roofN3)" stroke="#c084fc" stroke-width="1.2"/>
                <!-- Estandarte noble dorado -->
                <path d="M47 38 L53 38 L53 50 L50 48 L47 50 Z" fill="url(#goldBanner)" stroke="#ffd700" stroke-width="0.6"/>
                <!-- Líneas de neón ciberpunk -->
                <line x1="20" y1="60" x2="28" y2="60" stroke="#06b6d4" stroke-width="1.5" ${animated ? 'style="animation: neonPulse 1.8s infinite alternate;"' : ''}/>
                <line x1="72" y1="60" x2="80" y2="60" stroke="#06b6d4" stroke-width="1.5" ${animated ? 'style="animation: neonPulse 1.8s infinite alternate;"' : ''}/>
                <path d="M38 70 L62 70" stroke="#f43f5e" stroke-width="1.2"/>
                <!-- Gran portal ojival -->
                <path d="M43 86 L43 68 C43 62 57 62 57 68 L57 86 Z" fill="#090514" stroke="#c084fc" stroke-width="1.4"/>
                <!-- Insignia Nivel 3 -->
                <circle cx="50" cy="20" r="5" fill="#2e1065" stroke="#ffd700" stroke-width="1.2"/>
                <text x="50" y="23.5" font-family="'Outfit', sans-serif" font-size="6.5" font-weight="900" fill="#ffd700" text-anchor="middle">3</text>
            </svg>
            `;
        }

        // Nivel 4: Palacio Imperial Soberano (Cúpula dorada 24k, agujas, resplandor imperial y corona)
        return `
        <svg class="reino-castillo-svg reino-castillo-nv4" viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle; filter:drop-shadow(0 4px 18px rgba(255,215,0,0.65));">
            <defs>
                <linearGradient id="goldDome" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fffbeb"/>
                    <stop offset="35%" stop-color="#fde047"/>
                    <stop offset="70%" stop-color="#eab308"/>
                    <stop offset="100%" stop-color="#854d0e"/>
                </linearGradient>
                <linearGradient id="palaceWalls" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#2a1b4e"/>
                    <stop offset="50%" stop-color="#1e1338"/>
                    <stop offset="100%" stop-color="#0f0920"/>
                </linearGradient>
                <radialGradient id="sunGlow" cx="50%" cy="30%" r="50%">
                    <stop offset="0%" stop-color="#fef08a" stop-opacity="0.9"/>
                    <stop offset="50%" stop-color="#eab308" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#ffd700" stop-opacity="0"/>
                </radialGradient>
            </defs>
            <!-- Aura de resplandor solar -->
            <circle cx="50" cy="35" r="28" fill="url(#sunGlow)" ${animated ? 'style="animation: sunAura 3s infinite alternate ease-in-out;"' : ''}/>
            <!-- Escalinata monumental -->
            <path d="M12 90 L88 90 L80 84 L20 84 Z" fill="#ffd700" opacity="0.3"/>
            <path d="M18 84 L82 84 L76 78 L24 78 Z" fill="#ffd700" opacity="0.4"/>
            <!-- Muros imperiales principales -->
            <rect x="22" y="44" width="56" height="38" rx="3" fill="url(#palaceWalls)" stroke="#ffd700" stroke-width="1.6"/>
            <!-- Agujas y minaretes laterales -->
            <rect x="12" y="38" width="12" height="44" rx="2" fill="url(#palaceWalls)" stroke="#ffd700" stroke-width="1.2"/>
            <path d="M10 38 L18 16 L26 38 Z" fill="url(#goldDome)" stroke="#ffd700" stroke-width="1"/>
            <rect x="76" y="38" width="12" height="44" rx="2" fill="url(#palaceWalls)" stroke="#ffd700" stroke-width="1.2"/>
            <path d="M74 38 L82 16 L90 38 Z" fill="url(#goldDome)" stroke="#ffd700" stroke-width="1"/>
            <!-- Cúpula imperial central 24k -->
            <path d="M30 44 C30 20 70 20 70 44 Z" fill="url(#goldDome)" stroke="#ffd700" stroke-width="1.6"/>
            <!-- Nervios de la cúpula -->
            <path d="M50 21 L50 44 M40 25 C43 32 44 38 45 44 M60 25 C57 32 56 38 55 44" stroke="#854d0e" stroke-width="0.8" fill="none"/>
            <!-- Corona remate superior -->
            <circle cx="50" cy="18" r="2.8" fill="#ffd700"/>
            <path d="M47 16 L48 12 L50 14 L52 12 L53 16 Z" fill="#ffd700" stroke="#f59e0b" stroke-width="0.6"/>
            <!-- Columnata y portal del palacio -->
            <path d="M42 82 L42 60 C42 54 58 54 58 60 L58 82 Z" fill="#0b0617" stroke="#ffd700" stroke-width="1.5"/>
            <line x1="32" y1="52" x2="32" y2="78" stroke="#ffd700" stroke-width="1.4"/>
            <line x1="68" y1="52" x2="68" y2="78" stroke="#ffd700" stroke-width="1.4"/>
            <!-- Destellos y estrellas -->
            ${animated ? `
            <polygon points="26,16 27,18 29,18 27.5,19.5 28,21.5 26,20 24,21.5 24.5,19.5 23,18 25,18" fill="#ffffff" style="animation: sparkleStar 2.2s infinite ease-in-out; transform-origin: 26px 18px;"/>
            <polygon points="74,16 75,18 77,18 75.5,19.5 76,21.5 74,20 72,21.5 72.5,19.5 71,18 73,18" fill="#ffffff" style="animation: sparkleStar 2.2s 1.1s infinite ease-in-out; transform-origin: 74px 16px;"/>
            ` : ''}
            <!-- Insignia Nivel 4 Soberano -->
            <circle cx="50" cy="50" r="5.5" fill="#ffd700" stroke="#854d0e" stroke-width="1"/>
            <text x="50" y="54" font-family="'Outfit', sans-serif" font-size="7" font-weight="900" fill="#2a1b4e" text-anchor="middle">4</text>
        </svg>
        `;
    }

    // --- INYECCIÓN DE ESTILOS CSS DEL REINO ---
    function injectReinoStyles() {
        if (document.getElementById('reino-castillos-styles')) return;

        const style = document.createElement('style');
        style.id = 'reino-castillos-styles';
        style.textContent = `
            /* Animaciones para los Castillos SVG */
            @keyframes flamePulse {
                0% { transform: scale(0.9); opacity: 0.8; }
                100% { transform: scale(1.2); opacity: 1; filter: drop-shadow(0 0 4px #ff4d00); }
            }
            @keyframes smokePuff1 {
                0% { transform: translate(0, 0) scale(0.8); opacity: 0.8; }
                50% { transform: translate(-3px, -10px) scale(1.3); opacity: 0.4; }
                100% { transform: translate(-6px, -20px) scale(1.8); opacity: 0; }
            }
            @keyframes smokePuff2 {
                0% { transform: translate(0, 0) scale(0.8); opacity: 0.7; }
                50% { transform: translate(3px, -12px) scale(1.4); opacity: 0.35; }
                100% { transform: translate(5px, -22px) scale(2); opacity: 0; }
            }
            @keyframes smokePuff3 {
                0% { transform: translate(0, 0) scale(0.8); opacity: 0.6; }
                50% { transform: translate(-2px, -14px) scale(1.5); opacity: 0.25; }
                100% { transform: translate(-4px, -26px) scale(2.2); opacity: 0; }
            }
            @keyframes neonPulse {
                0% { opacity: 0.6; stroke-width: 1.2; filter: drop-shadow(0 0 2px #06b6d4); }
                100% { opacity: 1; stroke-width: 2.2; filter: drop-shadow(0 0 6px #06b6d4); }
            }
            @keyframes sunAura {
                0% { transform: scale(0.95); opacity: 0.7; }
                100% { transform: scale(1.15); opacity: 1; }
            }
            @keyframes sparkleStar {
                0% { transform: scale(0.3) rotate(0deg); opacity: 0.2; }
                50% { transform: scale(1.3) rotate(90deg); opacity: 1; filter: drop-shadow(0 0 5px #ffd700); }
                100% { transform: scale(0.3) rotate(180deg); opacity: 0.2; }
            }
            @keyframes pulseGoldRing {
                0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.75); }
                70% { transform: scale(1.05); box-shadow: 0 0 0 16px rgba(255, 215, 0, 0); }
                100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
            }

            /* Botón del Header Reino */
            .header-reino-btn {
                background: linear-gradient(135deg, rgba(255,183,3,0.18), rgba(20,22,35,0.9));
                border: 1px solid rgba(255, 183, 3, 0.5);
                color: #ffb703;
                border-radius: 20px;
                padding: 5px 12px;
                font-family: 'Outfit', sans-serif;
                font-size: 0.82rem;
                font-weight: 800;
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                transition: all 0.25s ease;
                box-shadow: 0 0 12px rgba(255,183,3,0.2);
            }
            .header-reino-btn:hover {
                background: linear-gradient(135deg, rgba(255,183,3,0.32), rgba(30,35,55,0.95));
                border-color: #ffd700;
                transform: translateY(-2px);
                box-shadow: 0 0 18px rgba(255,215,0,0.45);
                color: #fff;
            }

            /* Modal Reino Mapa */
            .reino-modal-container {
                position: fixed;
                inset: 0;
                z-index: 10005;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 1rem;
                background: rgba(8, 10, 18, 0.85);
                backdrop-filter: blur(12px);
                animation: fadeInModal 0.25s ease-out;
            }
            .reino-modal-container.active {
                display: flex;
            }
            @keyframes fadeInModal {
                from { opacity: 0; transform: scale(0.98); }
                to { opacity: 1; transform: scale(1); }
            }
            .reino-modal-card {
                background: rgba(18, 20, 32, 0.98);
                border: 1px solid rgba(255, 183, 3, 0.4);
                border-radius: 22px;
                width: 100%;
                max-width: 940px;
                max-height: 92vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.85), 0 0 30px rgba(255,183,3,0.15);
            }
            .reino-modal-header {
                padding: 1.1rem 1.4rem;
                background: linear-gradient(90deg, rgba(255,183,3,0.12), rgba(20,22,35,0.5));
                border-bottom: 1px solid rgba(255, 183, 3, 0.25);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }
            .reino-tabs {
                display: flex;
                gap: 8px;
                padding: 0.6rem 1.4rem;
                background: rgba(12, 14, 24, 0.7);
                border-bottom: 1px solid rgba(255,255,255,0.06);
                overflow-x: auto;
            }
            .reino-tab-btn {
                background: transparent;
                border: 1px solid rgba(255,255,255,0.1);
                color: #aaa;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 0.82rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .reino-tab-btn:hover {
                color: #fff;
                border-color: rgba(255,183,3,0.4);
            }
            .reino-tab-btn.active {
                background: rgba(255,183,3,0.18);
                border-color: #ffb703;
                color: #ffd700;
                box-shadow: 0 0 10px rgba(255,183,3,0.25);
            }
            .reino-modal-body {
                flex: 1;
                overflow-y: auto;
                padding: 1.2rem;
                position: relative;
            }

            /* Leaflet map container */
            #reino-leaflet-map {
                width: 100%;
                height: 420px;
                border-radius: 16px;
                border: 1px solid rgba(255, 183, 3, 0.3);
                box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
                overflow: hidden;
            }

            /* Leaflet Custom DivIcon Markers */
            .reino-marker-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            .reino-marker-container:hover {
                transform: scale(1.15) translateY(-4px);
                z-index: 1000 !important;
            }
            .reino-marker-label {
                background: rgba(15, 17, 28, 0.92);
                border: 1px solid #ffb703;
                color: #fff;
                font-size: 0.68rem;
                font-weight: 800;
                padding: 2px 7px;
                border-radius: 10px;
                white-space: nowrap;
                margin-top: -4px;
                box-shadow: 0 3px 8px rgba(0,0,0,0.6);
            }
            .reino-marker-palacio-user {
                position: relative;
            }
            .reino-marker-palacio-user::before {
                content: '';
                position: absolute;
                inset: -6px;
                border-radius: 50%;
                border: 2px solid #ffd700;
                animation: pulseGoldRing 2s infinite ease-out;
            }
            .reino-marker-palacio-user .reino-marker-label {
                background: #ffd700;
                color: #12101e;
                border-color: #fff;
                box-shadow: 0 0 12px rgba(255,215,0,0.8);
            }

            /* Tarjetas de ranking */
            .reino-rank-card {
                background: rgba(25, 28, 45, 0.7);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 14px;
                padding: 12px 16px;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                transition: all 0.2s;
            }
            .reino-rank-card:hover {
                background: rgba(35, 40, 65, 0.9);
                border-color: rgba(255,183,3,0.4);
                transform: translateX(4px);
            }

            /* Responsive */
            @media (max-width: 640px) {
                #reino-leaflet-map {
                    height: 310px;
                }
                .reino-modal-card {
                    max-height: 96vh;
                    border-radius: 16px;
                }
                .reino-modal-header {
                    padding: 0.8rem 1rem;
                }
                .reino-tabs {
                    padding: 0.4rem 0.8rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // --- VARIABLES DE ESTADO DEL MAPA ---
    let leafletMapInstance = null;
    let markersLayerGroup = null;
    let userPalacioMarker = null;

    // --- OBTENER UBICACIÓN GUARDADA O APROXIMADA DEL USUARIO ---
    function getUserPalacioCoords(user) {
        // 1. Coordenadas explícitas guardadas
        try {
            const rawCoords = localStorage.getItem('king_customer_coords');
            if (rawCoords) {
                const parsed = JSON.parse(rawCoords);
                if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
                    return parsed;
                }
            }
        } catch (e) {}

        if (user && user.lat && user.lon) {
            return { lat: Number(user.lat), lon: Number(user.lon) };
        }

        // 2. Si tiene domicilio / Palacio Real que mencione barrios conocidos de Corrientes
        const addr = (user?.palacioReal || user?.address || localStorage.getItem('king_customer_address') || '').toLowerCase();
        if (addr) {
            if (addr.includes('laguna seca')) return { lat: -27.4862, lon: -58.8040, matchedBarrio: 'Laguna Seca' };
            if (addr.includes('mil viv') || addr.includes('1000')) return { lat: -27.4819, lon: -58.8270, matchedBarrio: '1000 Viviendas' };
            if (addr.includes('camba') || addr.includes('cambá')) return { lat: -27.4715, lon: -58.8370, matchedBarrio: 'Cambá Cuá' };
            if (addr.includes('centro') || addr.includes('25 de mayo')) return { lat: -27.4660, lon: -58.8340, matchedBarrio: 'Centro' };
            if (addr.includes('san jeronimo') || addr.includes('san jerónimo')) return { lat: -27.4668, lon: -58.7975, matchedBarrio: 'San Jerónimo' };
            if (addr.includes('molina punta')) return { lat: -27.4475, lon: -58.8010, matchedBarrio: 'Molina Punta' };
            if (addr.includes('ferre') || addr.includes('ferré')) return { lat: -27.4778, lon: -58.8165, matchedBarrio: 'Barrio Ferré' };
            if (addr.includes('san marcelo')) return { lat: -27.4745, lon: -58.7905, matchedBarrio: 'San Marcelo' };
            if (addr.includes('17 de agosto')) return { lat: -27.4828, lon: -58.8085, matchedBarrio: '17 de Agosto' };
            if (addr.includes('arazaty') || addr.includes('costanera')) return { lat: -27.4735, lon: -58.8460, matchedBarrio: 'Costanera Sur' };
            if (addr.includes('ponce')) return { lat: -27.4855, lon: -58.7645, matchedBarrio: 'Barrio Ponce' };
        }

        return null;
    }

    // --- INICIALIZAR MAPA LEAFLET ---
    function renderReinoLeafletMap(containerId = 'reino-leaflet-map') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (typeof L === 'undefined') {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #ffb703;">
                    <i class="ri-loader-4-line ri-spin" style="font-size: 2rem;"></i>
                    <p style="margin-top: 10px; font-weight: 700;">Conectando con el Mapa Real de Corrientes...</p>
                </div>
            `;
            return;
        }

        // Si ya existe el mapa, recalcular tamaño y centrar
        if (leafletMapInstance) {
            setTimeout(() => {
                try {
                    leafletMapInstance.invalidateSize();
                } catch (e) {}
            }, 150);
            return;
        }

        // Crear mapa centrado en Corrientes Capital
        leafletMapInstance = L.map(containerId, {
            zoomControl: true,
            attributionControl: false
        }).setView([COORDS_MATRIZ.lat, COORDS_MATRIZ.lon], 13);

        // Capa Esri / CartoDB Street
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: '© Esri & OpenStreetMap'
        }).addTo(leafletMapInstance);

        markersLayerGroup = L.layerGroup().addTo(leafletMapInstance);

        // Pintar todos los castillos del banco de datos
        poblarMarcadoresCastillos();
    }

    // --- POBLAR MARCADORES DE CASTILLOS EN EL MAPA ---
    function poblarMarcadoresCastillos() {
        if (!leafletMapInstance || !markersLayerGroup) return;
        markersLayerGroup.clearLayers();

        // 1. Castillos del Reino (Barrios de Corrientes)
        BANCO_CASTILLOS_CORRIENTES.forEach((c) => {
            const svgIconHtml = getCastilloSVG(c.nivel, { size: c.tipo === 'matriz' ? 44 : 36, animated: false });
            const customIcon = L.divIcon({
                className: 'reino-div-icon',
                html: `
                    <div class="reino-marker-container">
                        ${svgIconHtml}
                        <div class="reino-marker-label" style="border-color:${c.tipo === 'matriz' ? '#ffd700' : '#ffb703'}">
                            ${c.tipo === 'matriz' ? '👑 MATRIZ THE KING' : c.nombre.split(' ')[0] + ' ' + c.barrio}
                        </div>
                    </div>
                `,
                iconSize: [60, 60],
                iconAnchor: [30, 48],
                popupAnchor: [0, -48]
            });

            const marker = L.marker([c.lat, c.lon], { icon: customIcon });

            const popupContent = `
                <div style="font-family:'Outfit',sans-serif; color:#fff; min-width:210px; padding:4px;">
                    <div style="display:flex; align-items:center; gap:8px; border-bottom:1px solid rgba(255,255,255,0.15); padding-bottom:6px; margin-bottom:8px;">
                        ${getCastilloSVG(c.nivel, { size: 36, animated: false })}
                        <div>
                            <strong style="color:#ffb703; font-size:0.95rem; display:block;">${c.nombre}</strong>
                            <span style="font-size:0.75rem; color:#aaa;">📍 Barrio ${c.barrio}</span>
                        </div>
                    </div>
                    <div style="font-size:0.78rem; color:#e2e8f0; margin-bottom:6px;">
                        ${c.descripcion}
                    </div>
                    <div style="background:rgba(255,183,3,0.1); border-radius:8px; padding:6px; font-size:0.74rem; display:flex; justify-content:space-between;">
                        <span>👑 <strong>${c.coronas}</strong> Coronas</span>
                        <span>🍔 <strong>${c.pedidos}</strong> Pedidos</span>
                    </div>
                    <div style="margin-top:8px; text-align:center;">
                        <button type="button" onclick="window.ReinoCastillos.pedirDesdeCastillo('${c.barrio}')" style="background:#ffb703; color:#12101e; border:none; border-radius:12px; padding:5px 12px; font-size:0.75rem; font-weight:800; cursor:pointer; width:100%;">
                            🍔 ¡Pedir en esta Zona!
                        </button>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent, {
                className: 'reino-dark-popup',
                maxWidth: 280
            });

            markersLayerGroup.addLayer(marker);
        });

        // 2. Castillo / Palacio Real del Usuario Logueado (Si existe)
        const currentUser = (typeof window.KingAuth !== 'undefined' && window.KingAuth.getCurrentKingUser) 
            ? window.KingAuth.getCurrentKingUser() 
            : null;

        const userCoords = getUserPalacioCoords(currentUser);
        const userLevelInfo = calcularNivelCastillo(currentUser);
        const userName = (currentUser && currentUser.name) ? currentUser.name : 'Monarca Soberano';

        if (userCoords && typeof userCoords.lat === 'number' && typeof userCoords.lon === 'number') {
            const userCastleSVG = getCastilloSVG(userLevelInfo.nivel, { size: 48, animated: true });
            const userIcon = L.divIcon({
                className: 'reino-div-icon',
                html: `
                    <div class="reino-marker-container reino-marker-palacio-user">
                        ${userCastleSVG}
                        <div class="reino-marker-label">
                            🏰 TU PALACIO (Nv. ${userLevelInfo.nivel})
                        </div>
                    </div>
                `,
                iconSize: [64, 64],
                iconAnchor: [32, 52],
                popupAnchor: [0, -52]
            });

            userPalacioMarker = L.marker([userCoords.lat, userCoords.lon], { icon: userIcon, zIndexOffset: 2000 });

            const userPopupContent = `
                <div style="font-family:'Outfit',sans-serif; color:#fff; min-width:230px; padding:4px;">
                    <div style="display:flex; align-items:center; gap:8px; border-bottom:1px solid rgba(255,215,0,0.3); padding-bottom:6px; margin-bottom:8px;">
                        ${getCastilloSVG(userLevelInfo.nivel, { size: 42, animated: true })}
                        <div>
                            <strong style="color:#ffd700; font-size:1rem; display:block;">🏰 Tu Palacio Real</strong>
                            <span style="font-size:0.78rem; color:#fff; font-weight:700;">${userName} · Nivel ${userLevelInfo.nivel}</span>
                        </div>
                    </div>
                    <div style="font-size:0.76rem; color:#cbd5e1; margin-bottom:6px;">
                        <strong>Título:</strong> ${userLevelInfo.nombre}<br>
                        <em>${userLevelInfo.subtitulo}</em>
                    </div>
                    <div style="background:rgba(255,215,0,0.15); border:1px solid rgba(255,215,0,0.3); border-radius:8px; padding:6px; font-size:0.75rem; display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span>👑 <strong>${userLevelInfo.coronas}</strong> Coronas</span>
                        <span>🚀 <strong>${userLevelInfo.progreso}%</strong> a Nv.${userLevelInfo.nextNivel || 'MAX'}</span>
                    </div>
                    <div style="text-align:center;">
                        <button type="button" onclick="window.ReinoCastillos.cambiarPestana('palacio')" style="background:linear-gradient(90deg,#ffd700,#f59e0b); color:#000; border:none; border-radius:12px; padding:6px 12px; font-size:0.76rem; font-weight:800; cursor:pointer; width:100%;">
                            👑 Ver Mejoras de mi Castillo
                        </button>
                    </div>
                </div>
            `;

            userPalacioMarker.bindPopup(userPopupContent, { maxWidth: 300 });
            markersLayerGroup.addLayer(userPalacioMarker);
        }
    }

    // --- REORDENAR Y OBTENER RANKINGS DE BARRIOS ---
    function getRankingsBarrios() {
        return [...BANCO_CASTILLOS_CORRIENTES]
            .filter(c => c.tipo !== 'matriz')
            .sort((a, b) => b.coronas - a.coronas);
    }

    // --- CREAR / INICIALIZAR MODAL DEL REINO ---
    function ensureReinoModalExists() {
        let modal = document.getElementById('modal-reino-mapa');
        const isNew = !modal;

        if (isNew) {
            modal = document.createElement('div');
            modal.id = 'modal-reino-mapa';
            modal.className = 'reino-modal-container';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-label', 'Mapa del Reino The King');
            modal.innerHTML = `
                <div class="reino-modal-card">
                    <!-- Header -->
                    <div class="reino-modal-header">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.8rem; filter: drop-shadow(0 0 8px #ffd700);">🏰</span>
                            <div>
                                <h2 style="font-family:'Outfit',sans-serif; font-size:1.15rem; font-weight:900; color:#ffd700; margin:0; line-height:1.2;">
                                    MAPA DEL REINO THE KING
                                </h2>
                                <p style="font-size:0.75rem; color:#aaa; margin:0;">
                                    Castillos Soberanos & Rankings de Corrientes Capital
                                </p>
                            </div>
                        </div>
                        <button type="button" id="close-reino-modal-btn" style="background:transparent; border:none; color:#888; font-size:1.6rem; cursor:pointer; line-height:1; padding:4px 8px; border-radius:8px; transition:color 0.2s;" aria-label="Cerrar">
                            ✕
                        </button>
                    </div>

                    <!-- Tabs -->
                    <div class="reino-tabs">
                        <button type="button" class="reino-tab-btn active" data-tab="mapa" id="tab-reino-mapa">
                            🗺️ Mapa de Castillos
                        </button>
                        <button type="button" class="reino-tab-btn" data-tab="ranking" id="tab-reino-ranking">
                            🏆 Ranking de Barrios
                        </button>
                        <button type="button" class="reino-tab-btn" data-tab="palacio" id="tab-reino-palacio">
                            👑 Mi Palacio Real
                        </button>
                    </div>

                    <!-- Body dinámico -->
                    <div class="reino-modal-body">
                        <!-- Vista 1: Mapa Interactivo -->
                        <div id="reino-view-mapa" class="reino-view-pane" style="display: block;">
                            <div style="margin-bottom: 0.8rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                                <span style="font-size: 0.78rem; color: #cbd5e1;">
                                    📍 Explorá los baluartes en tu barrio. ¡Sumá pedidos para elevar tu castillo a Palacio Soberano!
                                </span>
                                <button type="button" id="reino-btn-sync-gps" style="background: rgba(255,183,3,0.15); border: 1px solid #ffb703; color: #ffb703; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                                    📡 Fijar mi Palacio con GPS
                                </button>
                            </div>
                            <div id="reino-leaflet-map"></div>
                            <div id="reino-map-stats-bar" style="margin-top: 10px; display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px;">
                                <!-- Inyectado dinámicamente -->
                            </div>
                        </div>

                        <!-- Vista 2: Ranking de Barrios -->
                        <div id="reino-view-ranking" class="reino-view-pane" style="display: none;">
                            <div style="margin-bottom: 1rem; background: rgba(255,183,3,0.08); border-left: 3px solid #ffd700; padding: 8px 12px; border-radius: 6px;">
                                <strong style="color: #ffd700; font-size: 0.88rem;">🏆 Tabla de Honor Correntina</strong>
                                <p style="font-size: 0.76rem; color: #ccc; margin: 2px 0 0 0;">
                                    Los barrios con más coronas acumuladas coronan a sus castillos y desbloquean beneficios y sorteos reales.
                                </p>
                            </div>
                            <div id="reino-rankings-container">
                                <!-- Inyectado dinámicamente -->
                            </div>
                        </div>

                        <!-- Vista 3: Mi Palacio Real -->
                        <div id="reino-view-palacio" class="reino-view-pane" style="display: none;">
                            <div id="reino-my-castle-details">
                                <!-- Inyectado dinámicamente -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        if (!modal.dataset.listenersAttached) {
            modal.dataset.listenersAttached = 'true';

            // Listeners de cierre
            const closeBtn = modal.querySelector('#close-reino-modal-btn');
            if (closeBtn) closeBtn.addEventListener('click', closeReinoModal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeReinoModal();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    closeReinoModal();
                }
            });

            // Tabs switching
            const tabBtns = modal.querySelectorAll('.reino-tab-btn');
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    cambiarPestana(btn.getAttribute('data-tab'));
                });
            });

            // GPS Sync button
            const btnGps = modal.querySelector('#reino-btn-sync-gps');
            if (btnGps) {
                btnGps.addEventListener('click', syncUserGpsPalacio);
            }
        }

        return modal;
    }

    // --- CAMBIAR PESTAÑAS DEL MODAL ---
    function cambiarPestana(tabName) {
        const modal = ensureReinoModalExists();
        const tabBtns = modal.querySelectorAll('.reino-tab-btn');
        const panes = modal.querySelectorAll('.reino-view-pane');

        tabBtns.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        panes.forEach(pane => pane.style.display = 'none');

        const targetPane = document.getElementById(`reino-view-${tabName}`);
        if (targetPane) targetPane.style.display = 'block';

        if (tabName === 'mapa') {
            renderReinoLeafletMap();
            actualizarBarraStatsMapa();
            setTimeout(() => {
                if (leafletMapInstance) leafletMapInstance.invalidateSize();
            }, 100);
        } else if (tabName === 'ranking') {
            renderRankingView();
        } else if (tabName === 'palacio') {
            renderMyPalacioView();
        }
    }

    // --- ABRIR Y CERRAR MODAL ---
    function openReinoModal(initialTab = 'mapa') {
        injectReinoStyles();
        const modal = ensureReinoModalExists();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        cambiarPestana(initialTab);
    }

    function closeReinoModal() {
        const modal = document.getElementById('modal-reino-mapa');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // --- ACTUALIZAR BARRA DE RESUMEN INFERIOR DEL MAPA ---
    function actualizarBarraStatsMapa() {
        const bar = document.getElementById('reino-map-stats-bar');
        if (!bar) return;

        const totalCastillos = BANCO_CASTILLOS_CORRIENTES.length;
        const totalCoronas = BANCO_CASTILLOS_CORRIENTES.reduce((acc, c) => acc + c.coronas, 0);

        bar.innerHTML = `
            <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:6px 12px; font-size:0.75rem; white-space:nowrap; display:flex; align-items:center; gap:6px;">
                <span>🏰</span> <span><strong>${totalCastillos}</strong> Castillos Custodiando</span>
            </div>
            <div style="background:rgba(255,183,3,0.1); border:1px solid rgba(255,183,3,0.3); border-radius:12px; padding:6px 12px; font-size:0.75rem; white-space:nowrap; display:flex; align-items:center; gap:6px; color:#ffd700;">
                <span>👑</span> <span><strong>${totalCoronas.toLocaleString('es-AR')}</strong> Coronas en Corrientes</span>
            </div>
            <div style="background:rgba(74,222,128,0.1); border:1px solid rgba(74,222,128,0.3); border-radius:12px; padding:6px 12px; font-size:0.75rem; white-space:nowrap; display:flex; align-items:center; gap:6px; color:#4ade80;">
                <span>🚀</span> <span>Delivery Activo en todas las zonas</span>
            </div>
        `;
    }

    // --- RENDER VISTA RANKINGS DE BARRIOS ---
    function renderRankingView() {
        const container = document.getElementById('reino-rankings-container');
        if (!container) return;

        const rankings = getRankingsBarrios();
        const medals = ['🥇', '🥈', '🥉'];

        container.innerHTML = rankings.map((c, index) => {
            const medal = index < 3 ? medals[index] : `#${index + 1}`;
            const castleIcon = getCastilloSVG(c.nivel, { size: 38, animated: false });

            return `
                <div class="reino-rank-card">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-size:1.2rem; font-weight:900; min-width:28px; text-align:center; color:#ffd700;">${medal}</span>
                        ${castleIcon}
                        <div>
                            <div style="font-weight:800; font-size:0.92rem; color:#fff;">${c.nombre}</div>
                            <div style="font-size:0.74rem; color:#aaa;">Barrio ${c.barrio} · Soberano: <span style="color:#ffb703;">${c.soberano}</span></div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.88rem; font-weight:800; color:#ffd700;">👑 ${c.coronas}</div>
                        <div style="font-size:0.72rem; color:#64748b;">${c.pedidos} pedidos</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- RENDER VISTA MI PALACIO REAL ---
    function renderMyPalacioView() {
        const container = document.getElementById('reino-my-castle-details');
        if (!container) return;

        const currentUser = (typeof window.KingAuth !== 'undefined' && window.KingAuth.getCurrentKingUser) 
            ? window.KingAuth.getCurrentKingUser() 
            : null;

        const nivelInfo = calcularNivelCastillo(currentUser);
        const userName = (currentUser && currentUser.name) ? currentUser.name : 'Monarca Soberano';
        const userAddress = (currentUser && (currentUser.palacioReal || currentUser.address)) || localStorage.getItem('king_customer_address') || 'Ubicación no guardada aún';
        const castleSVG = getCastilloSVG(nivelInfo.nivel, { size: 110, animated: true });

        container.innerHTML = `
            <div style="text-align:center; background:linear-gradient(180deg, rgba(255,183,3,0.12), rgba(15,18,30,0.8)); border:1px solid rgba(255,183,3,0.35); border-radius:18px; padding:1.5rem 1rem; margin-bottom:1.2rem;">
                <div style="margin-bottom:0.5rem;">
                    ${castleSVG}
                </div>
                <div style="display:inline-block; background:${nivelInfo.color}; color:#0f0f1b; font-size:0.75rem; font-weight:900; padding:2px 10px; border-radius:12px; margin-bottom:6px;">
                    NIVEL ${nivelInfo.nivel} · ${nivelInfo.nombre.toUpperCase()}
                </div>
                <h3 style="font-size:1.3rem; font-weight:900; color:#fff; margin:0 0 4px 0;">
                    🏰 Palacio Real de ${userName}
                </h3>
                <p style="font-size:0.82rem; color:#cbd5e1; max-width:500px; margin:0 auto 12px auto;">
                    ${nivelInfo.subtitulo}
                </p>

                <!-- Barra de progreso al siguiente nivel -->
                <div style="max-width:440px; margin:0 auto; background:rgba(0,0,0,0.4); border-radius:12px; padding:10px 14px; border:1px solid rgba(255,255,255,0.08);">
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:6px;">
                        <span style="color:#ffd700; font-weight:700;">🪙 ${nivelInfo.coronas} Coronas Acumuladas</span>
                        <span style="color:#aaa;">${nivelInfo.nextNivel ? `Próximo: Nivel ${nivelInfo.nextNivel} (${nivelInfo.nextMinCoronas} 👑)` : '¡Nivel Legendario Máximo!'}</span>
                    </div>
                    <div style="width:100%; height:10px; background:rgba(255,255,255,0.1); border-radius:5px; overflow:hidden;">
                        <div style="width:${nivelInfo.progreso}%; height:100%; background:linear-gradient(90deg, #ffb703, #ffd700); border-radius:5px; transition:width 0.4s ease;"></div>
                    </div>
                    <div style="font-size:0.7rem; color:#888; margin-top:6px; text-align:right;">
                        ${nivelInfo.nextNivel ? `Faltan ${Math.max(0, nivelInfo.nextMinCoronas - nivelInfo.coronas)} coronas para desbloquear ${nivelInfo.nextNombre}` : '👑 Soberano Absoluto de Corrientes'}
                    </div>
                </div>
            </div>

            <!-- Upgrades Desbloqueados -->
            <div style="margin-bottom:1.2rem;">
                <h4 style="font-size:0.95rem; font-weight:800; color:#ffd700; margin:0 0 10px 0; display:flex; align-items:center; gap:6px;">
                    <span>🛡️</span> Mejoras y Upgrades del Palacio
                </h4>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:8px;">
                    ${nivelInfo.upgrades.map(u => `
                        <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,183,3,0.2); border-radius:10px; padding:8px 12px; font-size:0.78rem; color:#e2e8f0; display:flex; align-items:center; gap:8px;">
                            <span style="color:#ffd700;">✦</span> <span>${u}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Domicilio y GPS -->
            <div style="background:rgba(18,20,32,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:12px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                <div>
                    <div style="font-size:0.72rem; color:#888;">DIRECCIÓN DEL PALACIO REAL:</div>
                    <div style="font-size:0.86rem; color:#fff; font-weight:700;">📍 ${userAddress}</div>
                </div>
                <button type="button" onclick="window.ReinoCastillos.syncUserGpsPalacio()" style="background:linear-gradient(135deg, #ffb703, #fb8500); color:#000; border:none; padding:8px 16px; border-radius:12px; font-weight:800; font-size:0.78rem; cursor:pointer;">
                    📡 Actualizar con mi GPS
                </button>
            </div>
        `;
    }

    // --- SINCRONIZAR UBICACIÓN GPS DEL USUARIO CON SU PALACIO ---
    function syncUserGpsPalacio() {
        if (!navigator.geolocation) {
            alert('⚠️ La geolocalización no está soportada por tu navegador.');
            return;
        }

        const btn = document.getElementById('reino-btn-sync-gps');
        if (btn) btn.innerHTML = '⌛ Obteniendo GPS...';

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                const coordsObj = { lat, lon };

                // Guardar en localStorage
                try {
                    localStorage.setItem('king_customer_coords', JSON.stringify(coordsObj));
                } catch (e) {}

                // Guardar en sesión de auth si existe
                if (typeof window.saveKingPalacioReal === 'function') {
                    window.saveKingPalacioReal(`Palacio Real GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
                }

                if (btn) btn.innerHTML = '✅ ¡Palacio Ubicado!';

                // Refrescar mapa
                if (markersLayerGroup) {
                    poblarMarcadoresCastillos();
                }
                if (leafletMapInstance) {
                    leafletMapInstance.setView([lat, lon], 15);
                }

                setTimeout(() => {
                    if (btn) btn.innerHTML = '📡 Fijar mi Palacio con GPS';
                }, 3000);
            },
            (err) => {
                console.warn('[ReinoCastillos] Error GPS:', err);
                if (btn) btn.innerHTML = '📡 Fijar mi Palacio con GPS';
                alert('⚠️ No se pudo obtener la señal GPS. Podés escribir tu barrio o calle en Mi Cuenta para posicionar tu palacio.');
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    }

    // --- GENERAR INSIGNIA VISUAL PARA EL MENÚ DE USUARIO (#king-user-dropdown) ---
    function getCastilloBadgeHTML(user) {
        const info = calcularNivelCastillo(user);
        const svgSmall = getCastilloSVG(info.nivel, { size: 36, animated: false });

        return `
            <div class="king-castillo-user-card" onclick="window.ReinoCastillos.openReinoModal('palacio')" style="background: linear-gradient(135deg, rgba(255,183,3,0.12), rgba(20,22,35,0.7)); border: 1px solid rgba(255,183,3,0.35); border-radius: 12px; padding: 8px 10px; margin: 8px 0; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;" title="Clic para ver tu Castillo y Mapa del Reino">
                ${svgSmall}
                <div style="overflow: hidden; flex: 1;">
                    <div style="font-size: 0.72rem; color: #ffd700; font-weight: 800; letter-spacing: 0.5px;">🏰 CASTILLO NIVEL ${info.nivel}</div>
                    <div style="font-size: 0.82rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${info.nombre}</div>
                    <div style="font-size: 0.68rem; color: #aaa;">${info.progreso}% al siguiente nivel</div>
                </div>
                <div style="font-size: 0.9rem; color: #ffb703;">➔</div>
            </div>
        `;
    }

    // --- ACCIÓN RÁPIDA: PEDIR DESDE UN CASTILLO / BARRIO ---
    function pedirDesdeCastillo(barrio) {
        closeReinoModal();
        const addressInput = document.getElementById('customer-address');
        if (addressInput) {
            addressInput.value = `Barrio ${barrio}, Corrientes Capital`;
            // Trigger auto-complete / zone calculation if available
            addressInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        // Scroll to products or open cart
        const menuSection = document.getElementById('menu');
        if (menuSection) {
            menuSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // --- ATAR BOTONES DEL HEADER Y MENÚ AL CARGAR EL DOM ---
    function initReinoButtons() {
        injectReinoStyles();

        // 1. Botón en header (si existe)
        const headerBtn = document.getElementById('header-reino-btn');
        if (headerBtn) {
            headerBtn.addEventListener('click', () => openReinoModal('mapa'));
        }

        // 2. Botón en menú de opciones (dropdown principal)
        const menuBtn = document.getElementById('menu-reino-mapa-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const dropdown = document.getElementById('app-menu-dropdown');
                if (dropdown) dropdown.classList.remove('show');
                openReinoModal('mapa');
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReinoButtons);
    } else {
        initReinoButtons();
    }

    // --- EXPOSICIÓN DE LA API GLOBAL ---
    window.ReinoCastillos = {
        calcularNivelCastillo,
        getCastilloSVG,
        getCastilloBadgeHTML,
        openReinoModal,
        closeReinoModal,
        cambiarPestana,
        syncUserGpsPalacio,
        pedirDesdeCastillo,
        getRankingsBarrios,
        getCastillos: () => BANCO_CASTILLOS_CORRIENTES
    };

})(window, document);
