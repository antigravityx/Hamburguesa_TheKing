/**
 * ==========================================================================
 * THE KING BURGER — MAPA & MISIÓN DEL REY RPG (juego.js)
 * Motor de Leaflet, Simulación de Delivery y Aventuras en Corrientes Capital
 * ==========================================================================
 */

(function() {
    'use strict';

    // --- COORDENADAS BASE DEL CASTILLO THE KING (Río Chico 5410, Corrientes) ---
    const LOCAL_LAT = -27.4611;
    const LOCAL_LON = -58.7817;
    const WHATSAPP_PHONE = '5493794299964';

    // --- ZONAS DE DELIVERY OFICIALES ---
    const ZONES_CONFIG = [
        { id: 1, name: 'Zona 1 ($1.800)', price: 1800, maxKm: 1.8, color: '#10b981', barrios: 'Lomas del Mirador, Frondizi, 6 Hectáreas' },
        { id: 2, name: 'Zona 2 ($2.200)', price: 2200, maxKm: 3.2, color: '#f59e0b', barrios: 'Molina Punta, Punta Taítalo, Sol de Mayo, Shopping, UNNE Eragia' },
        { id: 3, name: 'Zona 3 ($3.000)', price: 3000, maxKm: 5.2, color: '#f97316', barrios: 'Centro, Bañado Norte, Parque Mitre, Cambá Cuá, 17 de Agosto' },
        { id: 4, name: 'Zona 4 ($4.000)', price: 4000, maxKm: 7.2, color: '#ef4444', barrios: 'Maipú, La Reina, Santa Lucía, Ponce, Boca Unidos' },
        { id: 5, name: 'Zona 5 ($4.000)', price: 4000, maxKm: 10.0, color: '#ec4899', barrios: 'Costanera Sur, Arazaty, Galván, Hosp. Vidal' }
    ];

    // --- BASE DE DATOS DE DESTINOS / CLIENTES RPG EN CORRIENTES ---
    const QUEST_DESTINATIONS = [
        { name: 'Plaza 25 de Mayo (Centro)', client: 'El Gran Magistrado', lat: -27.4655, lon: -58.8355, barrio: 'Centro Histórico', zone: 'Zona 3' },
        { name: 'Molina Punta (Costanera Norte)', client: 'La Reina del Río', lat: -27.4465, lon: -58.8025, barrio: 'Molina Punta', zone: 'Zona 2' },
        { name: 'Parque Mitre (Faro de los Niños)', client: 'El Centinela Nocturno', lat: -27.4585, lon: -58.8260, barrio: 'Parque Mitre', zone: 'Zona 3' },
        { name: 'Costanera Arazaty (Bajo el Puente)', client: 'El Caballero del Puente', lat: -27.4725, lon: -58.8475, barrio: 'Costanera Sur', zone: 'Zona 5' },
        { name: 'Barrio Cambá Cuá', client: 'El Maestro del Candombe', lat: -27.4710, lon: -58.8385, barrio: 'Cambá Cuá', zone: 'Zona 3' },
        { name: 'Barrio Ponce', client: 'El Guardián del Este', lat: -27.4850, lon: -58.7660, barrio: 'Barrio Ponce', zone: 'Zona 4' },
        { name: 'Centenario Shopping Mall', client: 'Don José el Hojaldrero', lat: -27.4615, lon: -58.8090, barrio: 'Barrio Industrial', zone: 'Zona 2' },
        { name: 'Barrio 17 de Agosto', client: 'El Herrero de la Rotonda', lat: -27.4820, lon: -58.8100, barrio: '17 de Agosto', zone: 'Zona 3' }
    ];

    // --- ESTADO GLOBAL DEL JUEGO ---
    let map = null;
    let currentMode = 'quest'; // 'quest' o 'radar'
    let castilloMarker = null;
    let kingMarker = null;
    let targetMarker = null;
    let routePolyline = null;
    let currentQuest = null;
    let questTimerInterval = null;
    let questTimeLeft = 60;
    let isDrivingAnimation = false;

    // Persistencia de jugador
    let coronas = parseInt(localStorage.getItem('king_rpg_coronas') || '150', 10);
    let playerLevel = parseInt(localStorage.getItem('king_rpg_level') || '1', 10);
    let deliveriesCompleted = parseInt(localStorage.getItem('king_rpg_deliveries') || '0', 10);

    // --- SINTETIZADOR DE AUDIO RETRO (Web Audio API) ---
    const AudioEngine = {
        ctx: null,
        init() {
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) this.ctx = new AudioContext();
            }
        },
        playTone(freq, type, duration, gainStart = 0.15) {
            this.init();
            if (!this.ctx) return;
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                gain.gain.setValueAtTime(gainStart, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + duration);
            } catch (e) {
                // Audio no disponible o bloqueado por navegador
            }
        },
        playCoin() {
            this.playTone(987.77, 'sine', 0.12, 0.2); // B5
            setTimeout(() => this.playTone(1318.51, 'sine', 0.35, 0.25), 100); // E6
        },
        playEngine() {
            this.playTone(120, 'triangle', 0.18, 0.12);
            setTimeout(() => this.playTone(180, 'sawtooth', 0.22, 0.1), 80);
        },
        playVictory() {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C alta
            notes.forEach((freq, idx) => {
                setTimeout(() => this.playTone(freq, 'triangle', 0.25, 0.25), idx * 120);
            });
        }
    };

    // --- CALCULO HAVERSINE (Distancia real en KM) ---
    function haversineKm(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function calculateZone(lat, lon) {
        const km = haversineKm(lat, lon, LOCAL_LAT, LOCAL_LON);
        for (const zone of ZONES_CONFIG) {
            if (km <= zone.maxKm) return { ...zone, distanceKm: km };
        }
        return { ...ZONES_CONFIG[ZONES_CONFIG.length - 1], distanceKm: km };
    }

    // --- INICIALIZACIÓN DEL MAPA ---
    function initMap() {
        if (!window.L) {
            console.error("Leaflet no está cargado");
            return;
        }

        // Crear mapa centrado en The King
        map = L.map('map', {
            zoomControl: true,
            attributionControl: false
        }).setView([LOCAL_LAT, LOCAL_LON], 14);

        // Tile layer con Esri (Rápido, libre y sin API keys)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: '© Esri & OpenStreetMap'
        }).addTo(map);

        // Capas circulares de Zonas de Delivery
        ZONES_CONFIG.slice().reverse().forEach(zone => {
            L.circle([LOCAL_LAT, LOCAL_LON], {
                radius: zone.maxKm * 1000,
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: 0.07,
                weight: 1.5,
                dashArray: '5, 8'
            }).addTo(map);
        });

        // 1. Marcador del Castillo Central The King
        const castilloIcon = L.divIcon({
            className: 'marker-castillo-container',
            html: `
                <div class="marker-castillo">
                    <div class="castillo-radar-pulse"></div>
                    <div class="castillo-icon">🏰</div>
                </div>
            `,
            iconSize: [50, 50],
            iconAnchor: [25, 25]
        });

        castilloMarker = L.marker([LOCAL_LAT, LOCAL_LON], { icon: castilloIcon })
            .addTo(map)
            .bindPopup(`
                <div style="text-align:center; padding: 4px;">
                    <strong style="color:#ffb703; font-size:1.1rem;">🏰 Castillo The King</strong><br>
                    <span style="font-size:0.85rem; color:#ccc;">Av. Río Chico 5410, Corrientes</span><br>
                    <span style="font-size:0.75rem; color:#4ade80;">👑 Centro de Operaciones y Cocina</span>
                </div>
            `);

        // 2. Marcador de Su Majestad el Rey en la Moto
        const kingIcon = L.divIcon({
            className: 'marker-rey-container',
            html: `
                <div class="marker-rey-moto">
                    <div class="moto-shadow-glow"></div>
                    <div class="moto-avatar">👑🏍️</div>
                </div>
            `,
            iconSize: [58, 58],
            iconAnchor: [29, 29]
        });

        kingMarker = L.marker([LOCAL_LAT + 0.001, LOCAL_LON + 0.001], {
            icon: kingIcon,
            draggable: true
        }).addTo(map);

        // Eventos de arrastre del Rey
        kingMarker.on('dragstart', () => {
            AudioEngine.playEngine();
        });

        kingMarker.on('drag', (e) => {
            const pos = e.target.getLatLng();
            if (currentMode === 'radar') {
                updateRadarInfo(pos.lat, pos.lng);
            }
        });

        kingMarker.on('dragend', (e) => {
            const pos = e.target.getLatLng();
            if (currentMode === 'radar') {
                updateRadarInfo(pos.lat, pos.lng);
            } else if (currentMode === 'quest' && currentQuest) {
                // Verificar si llegó cerca del cliente (menos de 300 metros)
                const distToClient = haversineKm(pos.lat, pos.lng, currentQuest.lat, currentQuest.lon);
                if (distToClient <= 0.35) {
                    completeDelivery();
                }
            }
        });

        // Click en el mapa para mover al Rey en modo Radar
        map.on('click', (e) => {
            if (currentMode === 'radar') {
                kingMarker.setLatLng(e.latlng);
                updateRadarInfo(e.latlng.lat, e.latlng.lng);
                AudioEngine.playEngine();
            }
        });

        // Inicializar modo predeterminado
        setupUI();
        startNewQuest();
    }

    // --- CONFIGURACIÓN DE LA INTERFAZ Y EVENTOS ---
    function setupUI() {
        updatePlayerStatsDisplay();

        // Botones de Modo
        const modeQuestBtn = document.getElementById('mode-quest-btn');
        const modeRadarBtn = document.getElementById('mode-radar-btn');
        const hudQuest = document.getElementById('hud-quest');
        const hudRadar = document.getElementById('hud-radar');

        if (modeQuestBtn && modeRadarBtn) {
            modeQuestBtn.addEventListener('click', () => {
                currentMode = 'quest';
                modeQuestBtn.classList.add('active');
                modeRadarBtn.classList.remove('active');
                if (hudQuest) hudQuest.style.display = 'block';
                if (hudRadar) hudRadar.style.display = 'none';
                if (!currentQuest) startNewQuest();
            });

            modeRadarBtn.addEventListener('click', () => {
                currentMode = 'radar';
                modeRadarBtn.classList.add('active');
                modeQuestBtn.classList.remove('active');
                if (hudQuest) hudQuest.style.display = 'none';
                if (hudRadar) hudRadar.style.display = 'block';
                const pos = kingMarker.getLatLng();
                updateRadarInfo(pos.lat, pos.lng);
            });
        }

        // Botón Conducir Moto al Destino
        const btnDrive = document.getElementById('btn-drive-quest');
        if (btnDrive) {
            btnDrive.addEventListener('click', () => {
                driveKingToDestination();
            });
        }

        // Botón Entregar Pedido
        const btnDeliver = document.getElementById('btn-deliver-quest');
        if (btnDeliver) {
            btnDeliver.addEventListener('click', () => {
                completeDelivery();
            });
        }

        // Botón Castillo (Menú RPG)
        const btnCastillo = document.getElementById('btn-open-castillo');
        const modalCastillo = document.getElementById('modal-castillo');
        const btnCloseCastillo = document.getElementById('btn-close-castillo');

        if (btnCastillo && modalCastillo) {
            btnCastillo.addEventListener('click', () => {
                renderCastilloMenu();
                modalCastillo.classList.add('active');
            });
        }

        if (btnCloseCastillo && modalCastillo) {
            btnCloseCastillo.addEventListener('click', () => {
                modalCastillo.classList.remove('active');
            });
        }

        // Modal de Victoria
        const modalVictory = document.getElementById('modal-victory');
        const btnNextQuest = document.getElementById('btn-next-quest');
        if (btnNextQuest && modalVictory) {
            btnNextQuest.addEventListener('click', () => {
                modalVictory.classList.remove('active');
                startNewQuest();
            });
        }

        // Botón de Acción en Radar (Pedir a esta Zona)
        const btnRadarOrder = document.getElementById('btn-radar-order');
        if (btnRadarOrder) {
            btnRadarOrder.addEventListener('click', () => {
                const pos = kingMarker.getLatLng();
                const zone = calculateZone(pos.lat, pos.lng);
                const text = encodeURIComponent(`👑 ¡Hola The King Burger! Estuve en el Mapa del Rey y quiero pedir a mi zona: ${zone.name} (${zone.distanceKm.toFixed(1)} km) en Corrientes. ¿Me toman el pedido?`);
                window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${text}`, '_blank');
            });
        }
    }

    // --- MODO AVENTURA / RPG: GENERAR NUEVA MISIÓN ---
    function startNewQuest() {
        if (questTimerInterval) clearInterval(questTimerInterval);

        // Elegir un destino al azar
        const dest = QUEST_DESTINATIONS[Math.floor(Math.random() * QUEST_DESTINATIONS.length)];

        // Obtener productos disponibles desde products.js si existe
        let burgerItem = {
            name: '3 Hambur Gruesas Especiales',
            img: 'img/pan-353---.jpg',
            price: 19000
        };

        if (typeof PRODUCTS !== 'undefined' && PRODUCTS.promos && PRODUCTS.promos.length > 0) {
            const promo = PRODUCTS.promos[Math.floor(Math.random() * PRODUCTS.promos.length)];
            burgerItem = {
                name: promo.name,
                img: promo.img || 'img/pan-353---.jpg',
                price: promo.price
            };
        }

        currentQuest = {
            ...dest,
            burger: burgerItem,
            coronasReward: 50 + (playerLevel * 10),
            xpReward: 100
        };

        // Regresar al Rey a The King
        kingMarker.setLatLng([LOCAL_LAT, LOCAL_LON]);

        // Crear/actualizar marcador del cliente en el mapa
        if (targetMarker) map.removeLayer(targetMarker);

        const targetIcon = L.divIcon({
            className: 'marker-target-container',
            html: `
                <div class="marker-target-cliente">
                    <div class="target-icon">🏠</div>
                    <span class="target-badge">📦 ${currentQuest.client}</span>
                </div>
            `,
            iconSize: [60, 50],
            iconAnchor: [30, 25]
        });

        targetMarker = L.marker([currentQuest.lat, currentQuest.lon], { icon: targetIcon })
            .addTo(map)
            .bindPopup(`
                <div style="text-align:center; padding: 4px;">
                    <strong style="color:#ffd166; font-size:1.05rem;">📍 ${currentQuest.name}</strong><br>
                    <span style="font-size:0.85rem; color:#fff;">Cliente: ${currentQuest.client}</span><br>
                    <span style="font-size:0.8rem; color:#ffb703;">Esperando: ${currentQuest.burger.name}</span>
                </div>
            `);

        // Dibujar ruta dorada
        if (routePolyline) map.removeLayer(routePolyline);
        routePolyline = L.polyline([
            [LOCAL_LAT, LOCAL_LON],
            [currentQuest.lat, currentQuest.lon]
        ], {
            color: '#ffb703',
            weight: 4,
            dashArray: '8, 12',
            opacity: 0.85
        }).addTo(map);

        // Ajustar vista para abarcar ambos puntos
        map.fitBounds([
            [LOCAL_LAT, LOCAL_LON],
            [currentQuest.lat, currentQuest.lon]
        ], { padding: [80, 80] });

        // Actualizar HUD
        const questTitle = document.getElementById('quest-title');
        const questLocation = document.getElementById('quest-location');
        const questReward = document.getElementById('quest-reward');
        const questImg = document.getElementById('quest-burger-img');

        if (questTitle) questTitle.textContent = currentQuest.burger.name;
        if (questLocation) questLocation.innerHTML = `<i class="ri-map-pin-2-fill"></i> ${currentQuest.name} (${currentQuest.zone})`;
        if (questReward) questReward.textContent = `Recompensa: +${currentQuest.coronasReward} Coronas | +${currentQuest.xpReward} XP`;
        if (questImg) questImg.src = currentQuest.burger.img;

        // Iniciar Temporizador (60s)
        questTimeLeft = 60;
        updateTimerDisplay();
        questTimerInterval = setInterval(() => {
            questTimeLeft--;
            updateTimerDisplay();
            if (questTimeLeft <= 0) {
                clearInterval(questTimerInterval);
                // Tiempo agotado pero entrega tardía con menor recompensa
                currentQuest.coronasReward = Math.max(10, currentQuest.coronasReward - 30);
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const timerEl = document.getElementById('quest-time-display');
        if (timerEl) {
            timerEl.textContent = `${questTimeLeft}s`;
            if (questTimeLeft <= 15) {
                timerEl.style.color = '#ef233c';
            } else {
                timerEl.style.color = '#ffd166';
            }
        }
    }

    // --- ANIMACIÓN DE CONDUCCIÓN DEL REY HACIA EL DESTINO ---
    function driveKingToDestination() {
        if (!currentQuest || isDrivingAnimation) return;
        isDrivingAnimation = true;

        const btnDrive = document.getElementById('btn-drive-quest');
        if (btnDrive) btnDrive.disabled = true;

        AudioEngine.playEngine();

        const startLat = LOCAL_LAT;
        const startLon = LOCAL_LON;
        const endLat = currentQuest.lat;
        const endLon = currentQuest.lon;

        const totalSteps = 45;
        let step = 0;

        const interval = setInterval(() => {
            step++;
            const progress = step / totalSteps;
            const currentLat = startLat + (endLat - startLat) * progress;
            const currentLon = startLon + (endLon - startLon) * progress;

            kingMarker.setLatLng([currentLat, currentLon]);

            if (step % 10 === 0) {
                AudioEngine.playEngine();
            }

            if (step >= totalSteps) {
                clearInterval(interval);
                isDrivingAnimation = false;
                if (btnDrive) btnDrive.disabled = false;
                completeDelivery();
            }
        }, 35);
    }

    // --- COMPLETAR ENTREGA (VICTORIA DE MISIÓN) ---
    function completeDelivery() {
        if (!currentQuest) return;
        if (questTimerInterval) clearInterval(questTimerInterval);

        AudioEngine.playVictory();
        deliveriesCompleted++;
        coronas += currentQuest.coronasReward;

        // Subida de nivel cada 3 entregas
        if (deliveriesCompleted % 3 === 0) {
            playerLevel++;
        }

        // Guardar progreso en disco local
        localStorage.setItem('king_rpg_coronas', coronas.toString());
        localStorage.setItem('king_rpg_level', playerLevel.toString());
        localStorage.setItem('king_rpg_deliveries', deliveriesCompleted.toString());

        updatePlayerStatsDisplay();

        // Lanzar confeti si la librería está disponible
        if (window.confetti) {
            window.confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        // Mostrar Modal de Victoria
        const modalVictory = document.getElementById('modal-victory');
        const victoryMsg = document.getElementById('victory-reward-text');
        const couponCode = document.getElementById('victory-coupon-code');

        if (victoryMsg) {
            victoryMsg.innerHTML = `¡El pedido de <strong>${currentQuest.client}</strong> en ${currentQuest.name} llegó crujiente y caliente!<br>Ganaste <span style="color:#ffb703; font-weight:800;">+${currentQuest.coronasReward} Coronas</span>.`;
        }

        if (couponCode) {
            const codes = ['REYHOT2026', 'CORONA10OFF', 'THEKINGWARRIOR', 'DELIVERYFREE7'];
            couponCode.textContent = codes[Math.floor(Math.random() * codes.length)];
        }

        if (modalVictory) {
            modalVictory.classList.add('active');
        }
    }

    // --- ACTUALIZAR STATS EN PANTALLA ---
    function updatePlayerStatsDisplay() {
        const coronasEl = document.getElementById('player-coronas-count');
        const levelEl = document.getElementById('player-level-title');

        if (coronasEl) coronasEl.textContent = coronas;
        if (levelEl) {
            const titles = ['Cadete de Cocina', 'Mensajero Real', 'Caballero del Asfalto', 'Centinela de Corrientes', 'Gran Monarca del Sabor'];
            const titleIdx = Math.min(playerLevel - 1, titles.length - 1);
            levelEl.textContent = `Nv. ${playerLevel} · ${titles[titleIdx]}`;
        }
    }

    // --- MODO RADAR: CALCULAR ZONA Y PRECIO AL ARRASTRAR ---
    function updateRadarInfo(lat, lon) {
        const zone = calculateZone(lat, lon);

        const radarZoneEl = document.getElementById('radar-zone-name');
        const radarDistEl = document.getElementById('radar-distance-km');
        const radarPriceEl = document.getElementById('radar-price-val');
        const radarBarriosEl = document.getElementById('radar-zone-barrios');

        if (radarZoneEl) radarZoneEl.textContent = `Zona ${zone.id}`;
        if (radarDistEl) radarDistEl.textContent = `${zone.distanceKm.toFixed(1)} km`;
        if (radarPriceEl) radarPriceEl.textContent = `$${zone.price.toLocaleString('es-AR')}`;
        if (radarBarriosEl) radarBarriosEl.textContent = zone.barrios;
    }

    // --- RENDERIZAR MENÚ DEL CASTILLO (INVENTARIO RPG) ---
    function renderCastilloMenu() {
        const grid = document.getElementById('rpg-items-grid');
        if (!grid) return;

        let items = [];

        // Leer desde products.js si está cargado
        if (typeof PRODUCTS !== 'undefined' && PRODUCTS.promos) {
            items = PRODUCTS.promos;
        } else {
            // Fallback de combos
            items = [
                { id: 'p1', name: '3 Hambur Gruesas Especiales', desc: 'Pan Brioche, Blend Carne, Queso, Huevo, Jamón + Papas.', price: 19000, img: 'img/pan-353---.jpg' },
                { id: 'p2', name: '2 Bur Gruesas Cheese Doble', desc: 'Pan Brioche, Doble Carne, Cheddar Fundido + Papas.', price: 18000, img: 'img/pan-35467---.jpg' },
                { id: 'p3', name: '2 Cleopatra Simple', desc: 'Pan Brioche, Blend de Carne, Cheddar, Panceta + Papas.', price: 12000, img: 'img/pan-6td67---.jpg' },
                { id: 'p4', name: '2 Arturo Simple', desc: 'Pan Brioche, Blend de Carne, Queso Tybo + Papas.', price: 12000, img: 'img/pan-6td6ddd7---.jpg' }
            ];
        }

        grid.innerHTML = items.map((item, idx) => {
            const power = 85 + (idx * 3);
            const taste = 92 + (idx * 2);
            const coronasBonus = Math.floor(item.price / 400);

            return `
                <div class="rpg-item-card">
                    <span class="rpg-item-rarity">⭐ LEGENDARIO</span>
                    <img src="${item.img || 'img/pan-353---.jpg'}" alt="${item.name}" class="rpg-item-img" onerror="this.src='img/pan-353---.jpg'">
                    <h3 class="rpg-item-name">${item.name}</h3>
                    <p class="rpg-item-desc">${item.desc || 'Receta secreta del Castillo The King.'}</p>
                    
                    <div class="rpg-stats-row">
                        <span class="rpg-stat taste">⚡ Sabor: ${taste}%</span>
                        <span class="rpg-stat power">🛡️ Saciedad: ${power}%</span>
                        <span class="rpg-stat reward">👑 +${coronasBonus} Coronas</span>
                    </div>

                    <div class="rpg-item-footer">
                        <span class="rpg-item-price">$${item.price.toLocaleString('es-AR')}</span>
                        <button class="btn-rpg-order" onclick="window.orderItemViaWhatsApp('${encodeURIComponent(item.name)}')">
                            <i class="ri-whatsapp-line"></i> Pedir
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Función global para pedir item desde el modal
    window.orderItemViaWhatsApp = function(itemName) {
        const decoded = decodeURIComponent(itemName);
        const text = encodeURIComponent(`👑 ¡Hola The King! Vi "${decoded}" en el Menú del Castillo y quiero hacer el pedido. ¿Tienen disponibilidad ahora?`);
        window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${text}`, '_blank');
    };

    // Iniciar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        initMap();
    });

})();
