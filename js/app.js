document.addEventListener('DOMContentLoaded', () => {
    
    // --- DATOS DEL MENÚ ---
    const phoneWhatsApp = "5493794299964";
    
    // Los productos se cargan desde products.js de forma global

    let cart = JSON.parse(localStorage.getItem('king_cart')) || [];
    let deliveryCost = 0;       // Costo de envío (calculado por GPS, OSM o zona manual)
    let deliveryMethod = null;  // 'gps' | 'osm' | 'zone' | null

    // --- REGISTRO DEL SERVICE WORKER (PWA) ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker Registrado con éxito', reg))
            .catch(err => console.warn('Error al registrar Service Worker', err));
    }

    let deferredPrompt;

    // --- ELEMENTOS DEL DOM ---
    const categoryBtns = document.querySelectorAll('.category-btn');
    const sectionTitle = document.getElementById('section-title');
    const productsGrid = document.getElementById('products-grid');
    
    // Buscador
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    
    // Menú de App
    const appMenuBtn = document.getElementById('app-menu-btn');
    const appMenuDropdown = document.getElementById('app-menu-dropdown');
    const menuGpsBtn = document.getElementById('menu-gps-btn');
    const menuInstallBtn = document.getElementById('menu-install-btn');

    const cartToggle = document.getElementById('cart-toggle');
    const closeCartBtn = document.getElementById('close-cart');
    const cartModal = document.getElementById('cart-modal');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const toast = document.getElementById('toast');

    // Formulario de datos
    const checkoutForm = document.getElementById('checkout-form');
    const customerName = document.getElementById('customer-name');
    const customerAddress = document.getElementById('customer-address');
    const paymentMethod = document.getElementById('payment-method');
    const aliasContainer = document.getElementById('alias-container');
    const copyAliasBtn = document.getElementById('copy-alias-btn');

    // Delivery vs Retiro y mapa inteligente
    const optionDelivery = document.getElementById('option-delivery');
    const optionTakeaway = document.getElementById('option-takeaway');
    const deliveryDetailsContainer = document.getElementById('delivery-details-container');
    const takeawayDetailsContainer = document.getElementById('takeaway-details-container');
    const mapPreviewContainer = document.getElementById('map-preview-container');
    const mapPreviewIframe = document.getElementById('map-preview-iframe');
    const mapPreviewLink = document.getElementById('map-preview-link');

    // Elementos del sistema de envío (Cascada: GPS → OSM → Zona manual)
    const zoneSelectorContainer = document.getElementById('zone-selector-container');
    const zoneSelect = document.getElementById('zone-select');
    const deliveryMethodInfo = document.getElementById('delivery-method-info');
    const deliveryMethodLabel = document.getElementById('delivery-method-label');
    const changeZoneBtn = document.getElementById('change-zone-btn');
    const subtotalRow = document.getElementById('subtotal-row');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const deliveryCostRow = document.getElementById('delivery-cost-row');
    const cartDeliveryCost = document.getElementById('cart-delivery-cost');

    const CIUDAD = 'Corrientes, Argentina';
    let mapsUrl = '';
    let mapDebounceTimer = null;

    // --- CONSTANTES DE ENTREGA (Local: Río Chico 5410, Corrientes) ---
    const LOCAL_LAT = -27.4611;
    const LOCAL_LON = -58.7817;
    const DELIVERY_ZONES = [
        { id: 'zona1', label: '🟢 Zona 1 ($1.500) – Lomas del Mirador, Frondizi, Seis Hectáreas', price: 1500, keywords: ['lomas del mirador', 'frondizi', 'seis hectareas', 'libertad proxima'] },
        { id: 'zona2', label: '🔴 Zona 2 ($2.500) – Molina Punta, Punta Taitalo, Sol de Mayo, Shopping, UNNE Eragia', price: 2500, keywords: ['molina punta', 'punta taitalo', 'sol de mayo', 'centenario shopping', 'eragia', 'unne', 'aguapey', 'canal 13'] },
        { id: 'zona3', label: '🔴 Zona 3 ($3.000) – Centro, Bañado Norte, Parque Mitre, Camba Cuá, 17 de Agosto, Rotonda Itatí', price: 3000, keywords: ['centro', 'bañado norte', 'parque mitre', 'camba cua', '17 de agosto', 'rotonda itati', 'cichero', 'seminario', 'aldana'] },
        { id: 'zona4', label: '🔴 Zona 4 ($3.500) – Maipú, La Reina, Santa Lucía, Ponce, Boca Unidos', price: 3500, keywords: ['maipu', 'la reina', 'santa lucia', 'ponce', 'boca unidos', 'estadio boca unidos', 'tacuari', 'guemes'] },
        { id: 'zona5', label: '🔴 Zona 5 ($4.000) – Costanera Sur, Arazaty, Galván, Hosp. Vidal, Virgen de los Dolores', price: 4000, keywords: ['arazaty', 'costanera', 'galvan', 'vidal', 'hospital vidal', 'virgen de los dolores', 'juan de garay', 'tte ibañez'] },
    ];

    let deliveryType = 'Delivery';

    // --- LÓGICA DEL MENÚ DE LA APP ---
    appMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        appMenuDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!appMenuDropdown.contains(e.target) && !appMenuBtn.contains(e.target)) {
            appMenuDropdown.classList.remove('show');
        }
    });

    // GPS: Método 1 de cálculo de envío (máxima prioridad)
    menuGpsBtn.addEventListener('click', () => {
        appMenuDropdown.classList.remove('show');
        if (!navigator.geolocation) {
            showToast("Tu navegador no soporta geolocalización");
            return;
        }
        showToast("📍 Solicitando permiso GPS...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;

                // Calcular distancia y costo de envío via GPS (Método 1 - Haversine)
                const km = haversineKm(lat, lon, LOCAL_LAT, LOCAL_LON);
                setDeliveryCost(priceByKm(km), 'gps', `📡 GPS · ${km.toFixed(1)} km desde el local`);

                if (customerAddress.value.trim() === '' || customerAddress.value === 'Ubicación GPS sincronizada') {
                    customerAddress.value = 'Ubicación GPS sincronizada';
                    if (mapPreviewIframe) {
                        mapPreviewIframe.src = `https://maps.google.com/maps?q=${lat},${lon}&output=embed&hl=es`;
                        mapPreviewLink.href = mapsUrl;
                        mapPreviewContainer.style.display = 'block';
                    }
                }
                showToast(`✅ GPS sincronizado · Envío: $${priceByKm(km).toLocaleString('es-AR')}`);
            },
            (error) => {
                console.error('Error GPS:', error);
                showToast('❌ No pudimos acceder al GPS. Revisa tus permisos.');
                if (!deliveryMethod) showZoneSelector(true);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });

    menuInstallBtn.addEventListener('click', () => {
        appMenuDropdown.classList.remove('show');
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    showToast('¡Gracias por instalar The King Burger! 👑');
                }
                deferredPrompt = null;
            });
        } else {
            showToast('La app ya está instalada o tu navegador no lo soporta.');
        }
    });

    // Manejar visibilidad y lógica de copia de Alias
    paymentMethod.addEventListener('change', () => {
        aliasContainer.style.display = paymentMethod.value === 'Transferencia' ? 'flex' : 'none';
    });

    copyAliasBtn.addEventListener('click', () => {
        navigator.clipboard.writeText('olivares.95').then(() => {
            showToast('¡Alias copiado al portapapeles!');
        }).catch(err => console.error('Error al copiar:', err));
    });

    // Manejar alternancia entre Delivery y Retiro
    optionDelivery.addEventListener('click', () => {
        deliveryType = 'Delivery';
        optionDelivery.style.background = 'var(--accent-color)';
        optionDelivery.style.color = '#000';
        optionDelivery.style.border = 'none';
        optionTakeaway.style.background = 'rgba(255,255,255,0.05)';
        optionTakeaway.style.color = '#fff';
        optionTakeaway.style.border = '1px solid var(--glass-border)';

        deliveryDetailsContainer.style.display = 'block';
        takeawayDetailsContainer.style.display = 'none';
        customerAddress.setAttribute('required', 'required');

        // Restaurar indicador de método si ya había uno calculado
        if (deliveryMethod && deliveryMethodInfo) {
            deliveryMethodInfo.style.display = 'flex';
        } else if (!deliveryMethod && cart.length > 0) {
            showZoneSelector(true);
        }
        updateCartUI();
    });

    optionTakeaway.addEventListener('click', () => {
        deliveryType = 'Retiro';
        optionTakeaway.style.background = 'var(--accent-color)';
        optionTakeaway.style.color = '#000';
        optionTakeaway.style.border = 'none';
        optionDelivery.style.background = 'rgba(255,255,255,0.05)';
        optionDelivery.style.color = '#fff';
        optionDelivery.style.border = '1px solid var(--glass-border)';

        deliveryDetailsContainer.style.display = 'none';
        takeawayDetailsContainer.style.display = 'block';
        customerAddress.removeAttribute('required');

        // Ocultar UI de envío sin borrar el método calculado (se restaura al volver a Delivery)
        showZoneSelector(false);
        if (deliveryMethodInfo) deliveryMethodInfo.style.display = 'none';
        updateCartUI();
    });

    // Dirección ingresada: mapa preview + Método 2 (OpenStreetMap geocoding)
    customerAddress.addEventListener('input', () => {
        clearTimeout(mapDebounceTimer);
        const direccion = customerAddress.value.trim();

        if (direccion.length < 4) {
            mapPreviewContainer.style.display = 'none';
            mapsUrl = '';
            if (deliveryMethod !== 'gps') resetDeliveryCost();
            return;
        }

        mapDebounceTimer = setTimeout(async () => {
            const query = encodeURIComponent(`${direccion}, ${CIUDAD}`);
            mapsUrl = `https://maps.google.com/maps?q=${query}`;
            mapPreviewLink.href = mapsUrl;
            mapPreviewIframe.src = `https://maps.google.com/maps?q=${query}&output=embed&hl=es`;
            mapPreviewContainer.style.display = 'block';

            // Método 2: OpenStreetMap geocoding para calcular envío
            await tryOsmGeocoding(direccion);
        }, 800);
    });

    // --- NAVEGACIÓN Y RENDERIZADO ---
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-target');
            if (searchInput.value.trim() !== '') {
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
            }

            sectionTitle.textContent = btn.textContent;
            sectionTitle.classList.remove('title-animate');
            void sectionTitle.offsetWidth;
            sectionTitle.classList.add('title-animate');
            renderProducts(category);
        });
    });

    function renderProducts(category) {
        const rawItems = PRODUCTS[category] || [];
        const items = rawItems.filter(p => p.available !== false);
        if (items.length === 0) {
            productsGrid.innerHTML = '<p class="empty-cart-msg">No hay productos disponibles en esta categoría.</p>';
            return;
        }
        renderProductCards(items);
    }

    function renderProductCards(items) {
        productsGrid.innerHTML = '';
        items.forEach((product, index) => {
            const card = document.createElement('article');
            card.classList.add('product-card', 'glassmorphism');
            card.style.setProperty('--card-delay', `${index * 0.06}s`);

            let sizeSelectorHTML = '';
            let initialPrice = product.price;

            if (product.sizes) {
                initialPrice = product.sizes.doble;
                sizeSelectorHTML = `
                    <div class="size-selector">
                        <button class="size-btn active" data-size="doble" data-price="${product.sizes.doble}">Doble</button>
                        <button class="size-btn" data-size="triple" data-price="${product.sizes.triple}">Triple</button>
                    </div>
                `;
            }

            const isRealImg = product.img && !product.img.startsWith('data:');
            const imgWrapperClass = isRealImg ? 'product-img-wrapper has-image' : 'product-img-wrapper';
            const badgeHTML = product.includesFries ? `<div class="product-badge">🍟 ¡Incluye Papas!</div>` : '';
            const imgHTML = `<div class="${imgWrapperClass}">
                    ${badgeHTML}
                    ${isRealImg ? `<img src="${product.img}" alt="${product.name}" loading="lazy">` : ''}
                   </div>`;

            card.innerHTML = `
                ${imgHTML}
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.desc}</p>
                    ${sizeSelectorHTML}
                    <div class="product-action">
                        <span class="price">$${initialPrice.toLocaleString('es-AR')}</span>
                        <button class="add-to-cart-btn add-to-cart" 
                                data-id="${product.id}" 
                                data-name="${product.name}" 
                                data-price="${initialPrice}">
                            <i class="ri-add-line"></i> Agregar
                        </button>
                    </div>
                </div>
            `;

            productsGrid.appendChild(card);

            if (product.sizes) {
                const sizeBtns = card.querySelectorAll('.size-btn');
                const priceSpan = card.querySelector('.price');
                const addToCartBtn = card.querySelector('.add-to-cart-btn');

                sizeBtns.forEach(sizeBtn => {
                    sizeBtn.addEventListener('click', () => {
                        sizeBtns.forEach(sb => sb.classList.remove('active'));
                        sizeBtn.classList.add('active');
                        const selectedSize = sizeBtn.getAttribute('data-size');
                        const selectedPrice = parseFloat(sizeBtn.getAttribute('data-price'));
                        priceSpan.classList.remove('price-pop');
                        void priceSpan.offsetWidth;
                        priceSpan.classList.add('price-pop');
                        priceSpan.textContent = `$${selectedPrice.toLocaleString('es-AR')}`;
                        addToCartBtn.setAttribute('data-price', selectedPrice);
                        addToCartBtn.setAttribute('data-size-selected', selectedSize);
                    });
                });
            }
        });
        setupAddToCartListeners();
    }

    function renderSearchResults(query) {
        sectionTitle.textContent = `Resultados para: "${searchInput.value}"`;
        let allMatches = [];
        for (const category in PRODUCTS) {
            const rawItems = PRODUCTS[category] || [];
            const matches = rawItems.filter(p =>
                p.available !== false &&
                (p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query))
            );
            allMatches = allMatches.concat(matches);
        }
        const uniqueMatches = [];
        const seenIds = new Set();
        allMatches.forEach(item => {
            if (!seenIds.has(item.id)) { seenIds.add(item.id); uniqueMatches.push(item); }
        });
        if (uniqueMatches.length === 0) {
            productsGrid.innerHTML = '<p class="empty-cart-msg">No encontramos productos que coincidan con tu búsqueda. 🔍</p>';
            return;
        }
        renderProductCards(uniqueMatches);
    }

    function setupAddToCartListeners() {
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                let name = btn.getAttribute('data-name');
                const price = parseFloat(btn.getAttribute('data-price'));
                const sizeSelected = btn.getAttribute('data-size-selected') || 'doble';

                let finalId = id;
                const hasSizes = PRODUCTS.premium.some(p => p.id === id);
                if (hasSizes) {
                    finalId = `${id}-${sizeSelected}`;
                    const sizeLabel = sizeSelected.charAt(0).toUpperCase() + sizeSelected.slice(1);
                    name = `${name} (${sizeLabel})`;
                }
                addToCart({ id: finalId, name, price, quantity: 1 });
                showToast(`¡${name} agregado!`);
                animateCartIcon();
            });
        });
    }

    function animateCartIcon() {
        cartToggle.classList.remove('wobble-cart');
        void cartToggle.offsetWidth;
        cartToggle.classList.add('wobble-cart');
    }

    // --- LOGICA DEL BUSCADOR ---
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length > 0) {
            clearSearchBtn.style.display = 'flex';
            renderSearchResults(query);
        } else {
            clearSearchBtn.style.display = 'none';
            const activeBtn = document.querySelector('.category-btn.active');
            const category = activeBtn ? activeBtn.getAttribute('data-target') : 'promos';
            sectionTitle.textContent = activeBtn ? activeBtn.textContent : 'Promociones';
            renderProducts(category);
        }
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        const activeBtn = document.querySelector('.category-btn.active');
        const category = activeBtn ? activeBtn.getAttribute('data-target') : 'promos';
        sectionTitle.textContent = activeBtn ? activeBtn.textContent : 'Promociones';
        renderProducts(category);
    });

    // --- INICIALIZAR SELECTOR DE ZONAS (Método 3) ---
    if (zoneSelect) {
        DELIVERY_ZONES.forEach(zone => {
            const opt = document.createElement('option');
            opt.value = zone.id;
            opt.textContent = `${zone.label} — $${zone.price.toLocaleString('es-AR')}`;
            zoneSelect.appendChild(opt);
        });

        zoneSelect.addEventListener('change', () => {
            const zone = DELIVERY_ZONES.find(z => z.id === zoneSelect.value);
            if (zone) {
                setDeliveryCost(zone.price, 'zone', `🏙️ ${zone.label.split('–')[0].trim()}`);
            } else {
                deliveryCost = 0;
                deliveryMethod = null;
                if (deliveryMethodInfo) deliveryMethodInfo.style.display = 'none';
                updateCartUI();
            }
        });
    }

    if (changeZoneBtn) {
        changeZoneBtn.addEventListener('click', () => {
            if (deliveryMethodInfo) deliveryMethodInfo.style.display = 'none';
            deliveryCost = 0;
            deliveryMethod = null;
            if (zoneSelect) zoneSelect.value = '';
            showZoneSelector(true);
            updateCartUI();
        });
    }

    // Cargar estado inicial
    renderProducts('promos');
    updateCartUI();

    // --- LÓGICA DEL CARRITO ---
    cartToggle.addEventListener('click', () => cartModal.classList.add('open'));
    closeCartBtn.addEventListener('click', () => cartModal.classList.remove('open'));

    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push(product);
        }
        localStorage.setItem('king_cart', JSON.stringify(cart));
        updateCartUI();
    }

    function changeQuantity(id, delta) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
            localStorage.setItem('king_cart', JSON.stringify(cart));
            updateCartUI();
        }
    }

    function updateCartUI() {
        const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
        cartCount.textContent = totalItems;

        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío</p>';
            cartTotal.textContent = '$0';
            if (subtotalRow) subtotalRow.style.display = 'none';
            if (deliveryCostRow) deliveryCostRow.style.display = 'none';
            if (checkoutForm) {
                checkoutForm.style.display = 'none';
                aliasContainer.style.display = 'none';
            }
            return;
        }

        if (checkoutForm) {
            checkoutForm.style.display = 'flex';
            aliasContainer.style.display = paymentMethod.value === 'Transferencia' ? 'flex' : 'none';
            // Si es delivery y no hay método calculado, mostrar selector de zona
            if (deliveryType === 'Delivery' && !deliveryMethod && zoneSelectorContainer) {
                zoneSelectorContainer.style.display = 'block';
            }
        }

        let subtotal = 0;
        cart.forEach(item => {
            subtotal += item.price * item.quantity;
            const itemEl = document.createElement('div');
            itemEl.classList.add('cart-item');
            itemEl.innerHTML = `
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <span class="item-price">$${item.price.toLocaleString('es-AR')}</span>
                </div>
                <div class="item-controls">
                    <button class="item-btn minus-btn" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="item-btn plus-btn" data-id="${item.id}">+</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemEl);
        });

        // Calcular total con envío según tipo de entrega
        const envio = (deliveryType === 'Delivery') ? deliveryCost : 0;
        const grandTotal = subtotal + envio;

        if (envio > 0) {
            if (subtotalRow)     { subtotalRow.style.display = 'flex'; }
            if (cartSubtotal)      cartSubtotal.textContent = `$${subtotal.toLocaleString('es-AR')}`;
            if (deliveryCostRow)  { deliveryCostRow.style.display = 'flex'; }
            if (cartDeliveryCost)  cartDeliveryCost.textContent = `$${envio.toLocaleString('es-AR')}`;
        } else {
            if (subtotalRow)    subtotalRow.style.display = 'none';
            if (deliveryCostRow) deliveryCostRow.style.display = 'none';
        }

        cartTotal.textContent = `$${grandTotal.toLocaleString('es-AR')}`;

        document.querySelectorAll('.minus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => changeQuantity(e.target.getAttribute('data-id'), -1));
        });
        document.querySelectorAll('.plus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => changeQuantity(e.target.getAttribute('data-id'), 1));
        });
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // ============================================================
    // --- SISTEMA DE ENVÍO: CASCADA GPS → OSM → ZONA MANUAL ---
    // ============================================================

    /** Calcula distancia en km entre dos puntos GPS (Fórmula de Haversine) */
    function haversineKm(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.asin(Math.sqrt(a));
    }

    /** Convierte distancia en km al precio de envío correspondiente */
    function priceByKm(km) {
        if (km <= 1.8) return 1500;
        if (km <= 3.5) return 2500;
        if (km <= 5.2) return 3000;
        if (km <= 6.8) return 3500;
        return 4000;
    }

    /** Registra un costo de envío calculado y actualiza toda la UI */
    function setDeliveryCost(price, method, label) {
        deliveryCost = price;
        deliveryMethod = method;
        if (deliveryMethodInfo) {
            deliveryMethodInfo.style.display = 'flex';
            if (deliveryMethodLabel) deliveryMethodLabel.textContent = label;
        }
        // Si fue calculado automáticamente, colapsar el selector de zona
        if (method !== 'zone' && zoneSelectorContainer) {
            zoneSelectorContainer.style.display = 'none';
        }
        updateCartUI();
    }

    /** Muestra u oculta el selector de zona manual */
    function showZoneSelector(visible) {
        if (!zoneSelectorContainer) return;
        zoneSelectorContainer.style.display = visible ? 'block' : 'none';
    }

    /** Resetea el costo de envío (vuelve a estado inicial sin método) */
    function resetDeliveryCost() {
        deliveryCost = 0;
        deliveryMethod = null;
        if (deliveryMethodInfo) deliveryMethodInfo.style.display = 'none';
        showZoneSelector(false);
        if (zoneSelect) zoneSelect.value = '';
        updateCartUI();
    }

    /** Método 2: Intenta matchear por barrio o geocodificar la dirección */
    async function tryOsmGeocoding(direccion) {
        if (deliveryMethod === 'gps') return; // GPS tiene prioridad absoluta

        const dirLower = direccion.toLowerCase();
        
        // 1. Detección Híbrida Inteligente por Palabras Clave de Barrio
        for (const zone of DELIVERY_ZONES) {
            if (zone.keywords && zone.keywords.some(kw => dirLower.includes(kw))) {
                setDeliveryCost(zone.price, 'zone_auto', `📍 Barrio Detectado: ${zone.label.split('–')[1] || zone.label}`);
                return;
            }
        }

        // 2. Si no coincide por texto, consultar OpenStreetMap por GPS aproximado
        try {
            const query = encodeURIComponent(`${direccion}, Corrientes, Argentina`);
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
                { headers: { 'Accept-Language': 'es' } }
            );
            if (!res.ok) throw new Error('OSM falló');
            const data = await res.json();
            if (data && data.length > 0) {
                const km = haversineKm(
                    parseFloat(data[0].lat), parseFloat(data[0].lon),
                    LOCAL_LAT, LOCAL_LON
                );
                setDeliveryCost(priceByKm(km), 'osm', `📍 Automático · ${km.toFixed(1)} km`);
            } else {
                // Dirección no encontrada → activar selector manual (Método 3)
                if (!deliveryMethod) showZoneSelector(true);
            }
        } catch (e) {
            // Sin señal o error de red → activar selector manual (Método 3)
            if (!deliveryMethod) showZoneSelector(true);
        }
    }

    // --- CHECKOUT WHATSAPP ---
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) { showToast('El carrito está vacío'); return; }

        const name    = customerName.value.trim();
        const address = customerAddress.value.trim();
        const payment = paymentMethod.value;

        if (!name) { showToast('¡Por favor completa tu Nombre y Apellido!'); return; }
        if (deliveryType === 'Delivery' && !address) {
            showToast('¡Por favor completa tu Dirección de Envío!'); return;
        }
        if (deliveryType === 'Delivery' && deliveryCost === 0) {
            showToast('⚠️ Seleccioná tu zona de envío para calcular el costo total');
            showZoneSelector(true);
            return;
        }

        let subtotal = 0;
        let message = `👑 *NUEVO PEDIDO - THE KING BURGER* 👑\n\n`;

        message += `👤 *Cliente:* ${name}\n`;
        message += `🛵 *Entrega:* ${deliveryType}\n`;

        if (deliveryType === 'Delivery') {
            message += `📍 *Dirección:* ${address}\n`;
            if (mapsUrl) message += `🗺️ *Ver en mapa:* ${mapsUrl}\n`;
            message += `🛵 *Costo de envío:* $${deliveryCost.toLocaleString('es-AR')}\n`;
            if (payment === 'Efectivo') {
                const totalConEnvio = cart.reduce((a, i) => a + i.price * i.quantity, 0) + deliveryCost;
                message += `💰 *Estado de pago:* ⚠️ COBRAR AL ENTREGAR ($${totalConEnvio.toLocaleString('es-AR')})\n`;
            } else {
                message += `💰 *Estado de pago:* ⚠️ SOLICITAR COMPROBANTE DE PAGO\n`;
            }
        } else {
            message += `📍 *Retiro:* Local The King Burger\n`;
        }

        message += `💵 *Pago:* ${payment}\n\n`;
        message += `🍔 *DETALLE DEL PEDIDO:*\n`;

        cart.forEach(item => {
            const sub = item.price * item.quantity;
            subtotal += sub;
            message += `▪ ${item.quantity}x ${item.name} ($${item.price.toLocaleString('es-AR')}) = $${sub.toLocaleString('es-AR')}\n`;
        });

        const envio = deliveryType === 'Delivery' ? deliveryCost : 0;
        const grandTotal = subtotal + envio;

        if (envio > 0) {
            message += `\nSubtotal productos: $${subtotal.toLocaleString('es-AR')}\n`;
            message += `🛵 Envío: $${envio.toLocaleString('es-AR')}\n`;
        }
        message += `\n*TOTAL A PAGAR: $${grandTotal.toLocaleString('es-AR')}*\n\n`;

        if (payment === 'Transferencia') {
            message += `⚠️ *RECUERDE ENVIARNOS EL COMPROBANTE DE LA TRANSFERENCIA PARA PROCESAR SU PEDIDO.*\n\n`;
        }
        message += `_¡Muchas gracias por elegirnos!_`;

        const url = `https://wa.me/${phoneWhatsApp}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');

        let completedOrders = parseInt(localStorage.getItem('king_completed_orders') || '0');
        localStorage.setItem('king_completed_orders', (completedOrders + 1).toString());
    });

    // --- LÓGICA ELEGANTE PWA NO INTRUSIVA ---
    const pwaBanner  = document.getElementById('pwa-install-banner');
    const pwaAddBtn  = document.getElementById('pwa-add-btn');
    const pwaCloseBtn = document.getElementById('pwa-close-btn');

    let visitCount = parseInt(localStorage.getItem('king_visit_count') || '0');
    visitCount++;
    localStorage.setItem('king_visit_count', visitCount.toString());

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const isDismissed = localStorage.getItem('king_pwa_dismissed') === 'true';
        const completedOrders = parseInt(localStorage.getItem('king_completed_orders') || '0');
        if (!isDismissed && (visitCount >= 2 || completedOrders >= 1)) {
            setTimeout(() => { pwaBanner.style.display = 'flex'; }, 3000);
        }
    });

    pwaAddBtn.addEventListener('click', () => {
        if (!deferredPrompt) return;
        pwaBanner.style.display = 'none';
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
    });

    pwaCloseBtn.addEventListener('click', () => {
        pwaBanner.style.display = 'none';
        localStorage.setItem('king_pwa_dismissed', 'true');
    });

    // --- INTEGRACIÓN CON CONSOLA DE SECRETARÍA & BANNERS EN TIEMPO REAL ---
    function applyLiveBanners() {
        if (!window.kingDB) return;
        const banners = window.kingDB.getBanners();
        
        const heroTitle = document.querySelector('.hero-title');
        const heroTagline = document.querySelector('.hero-tagline');
        const heroSub = document.querySelector('.hero-sub');
        const phoneSpan = document.querySelector('.hero-info span:first-child');
        const instaSpan = document.querySelector('.hero-info span:last-child');

        if (heroTitle && banners.heroTitle) {
            heroTitle.innerHTML = banners.heroTitle.replace('BURGER', '<span class="hero-accent">BURGER</span>');
        }
        if (heroTagline && banners.heroSubtitle) heroTagline.textContent = banners.heroSubtitle;
        if (heroSub && banners.heroSub) heroSub.textContent = banners.heroSub;
        if (phoneSpan && banners.phone) phoneSpan.innerHTML = `<i class="ri-phone-line"></i> ${banners.phone}`;
        if (instaSpan && banners.instagram) instaSpan.innerHTML = `<i class="ri-instagram-line"></i> ${banners.instagram}`;
    }

    applyLiveBanners();

    window.addEventListener('king_products_changed', () => {
        const activeBtn = document.querySelector('.category-btn.active');
        const activeCat = activeBtn ? activeBtn.getAttribute('data-target') : 'promos';
        renderProducts(activeCat);
    });

    if ('BroadcastChannel' in window) {
        try {
            const channel = new BroadcastChannel('theking_menu_channel');
            channel.onmessage = (event) => {
                if (event.data && event.data.type === 'BANNERS_UPDATED') {
                    applyLiveBanners();
                }
            };
        } catch (e) {}
    }

});

