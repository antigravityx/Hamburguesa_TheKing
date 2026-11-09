document.addEventListener('DOMContentLoaded', async () => {

    // --- DATOS DEL MENÚ ---
    // phoneWhatsApp es mutable: se actualiza desde Firebase si la secretaria lo cambia en el admin
    let phoneWhatsApp = "5493794299964";

    // VELOCIDAD MÁXIMA & SINCRONIZACIÓN EN TIEMPO REAL CON FIREBASE
    if (window.kingDB) {
        // Cargar banners en background (sin await, no bloquea)
        window.kingDB.initialLoadBanners().then(firebaseBanners => {
            if (firebaseBanners && firebaseBanners.phoneWhatsApp) {
                phoneWhatsApp = firebaseBanners.phoneWhatsApp;
            } else if (window.kingDB._phoneWhatsApp) {
                phoneWhatsApp = window.kingDB._phoneWhatsApp;
            }
        }).catch(e => console.warn('[TheKing] Banners Firebase fallido, usando locales', e));

        // Cargar productos en background
        window.kingDB.initialLoadProducts().then(() => {
            refreshActiveCategoryUI();
        }).catch(
            e => console.warn('[TheKing] Productos Firebase fallidos, usando locales', e)
        );

        // ⚡ ESCUCHADOR EN TIEMPO REAL DE PRODUCTOS: actualiza el celular si la secretaria edita en el admin
        window.kingDB.listenProducts((newProducts) => {
            console.log('⚡ [TheKing Realtime] Productos actualizados en vivo desde Firebase!');
            refreshActiveCategoryUI();
        });

        // ⚡ ESCUCHADOR EN TIEMPO REAL DE BANNERS
        window.kingDB.listenBanners((banners) => {
            if (banners && banners.phoneWhatsApp) {
                phoneWhatsApp = banners.phoneWhatsApp;
            }
            const promoBarText = document.getElementById('promo-bar-text');
            if (promoBarText && banners.promoBarText) {
                promoBarText.textContent = banners.promoBarText;
            }
        });

        // ⚡ ESCUCHADOR EN TIEMPO REAL DE SORTEOS
        window.kingDB.listenSorteo((sorteo) => {
            if (sorteo && sorteo.ganador) {
                showSorteoWinnerToast(sorteo.ganador, sorteo.premio || 'Premio Corona');
            }
        });
    }

    // Escuchar eventos globales de sincronización entre pestañas (BroadcastChannel)
    window.addEventListener('king_products_changed', () => {
        refreshActiveCategoryUI();
    });

    function refreshActiveCategoryUI() {
        const activeBtn = document.querySelector('.category-btn.active');
        const activeCategory = activeBtn ? activeBtn.getAttribute('data-target') : 'promos';
        if (typeof renderProducts === 'function') {
            renderProducts(activeCategory);
        }
    }

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
    const openMpBtn = document.getElementById('open-mp-btn');
    const mpTotalBadge = document.getElementById('mp-total-badge');
    const receiptFileInput = document.getElementById('receipt-file-input');
    const receiptPreviewContainer = document.getElementById('receipt-preview-container');
    const receiptFilename = document.getElementById('receipt-filename');
    const removeReceiptBtn = document.getElementById('remove-receipt-btn');
    let attachedReceiptName = null;

    // Delivery vs Retiro y mapa inteligente
    const optionDelivery = document.getElementById('option-delivery');
    const optionTakeaway = document.getElementById('option-takeaway');
    const deliveryDetailsContainer = document.getElementById('delivery-details-container');
    const takeawayDetailsContainer = document.getElementById('takeaway-details-container');
    const mapPreviewContainer = document.getElementById('map-preview-container');
    const mapPreviewIframe = document.getElementById('map-preview-iframe');
    const mapPreviewLink = document.getElementById('map-preview-link');
    const formGpsBtn = document.getElementById('form-gps-btn');
    let currentLat = null;
    let currentLon = null;

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
        { id: 'zona1', label: '🟢 Zona 1 ($1.800) – Lomas del Mirador, Frondizi, Seis Hectáreas', price: 1800, keywords: ['lomas del mirador', 'frondizi', 'seis hectareas', 'libertad proxima'] },
        { id: 'zona2', label: '🟡 Zona 2 ($2.200) – Molina Punta, Punta Taitalo, Sol de Mayo, Shopping, UNNE Eragia', price: 2200, keywords: ['molina punta', 'punta taitalo', 'sol de mayo', 'centenario shopping', 'eragia', 'unne', 'aguapey', 'canal 13'] },
        { id: 'zona3', label: '🟠 Zona 3 ($3.000) – Centro, Bañado Norte, Parque Mitre, Camba Cuá, 17 de Agosto, Rotonda Itatí', price: 3000, keywords: ['centro', 'bañado norte', 'parque mitre', 'camba cua', '17 de agosto', 'rotonda itati', 'cichero', 'seminario', 'aldana'] },
        { id: 'zona4', label: '🔴 Zona 4 ($4.000) – Maipú, La Reina, Santa Lucía, Barrio Ponce, Boca Unidos', price: 4000, keywords: ['maipu', 'la reina', 'santa lucia', 'ponce', 'boca unidos', 'estadio boca unidos', 'tacuari', 'guemes'] },
        { id: 'zona5', label: '🔴 Zona 5 ($4.000) – Costanera, Arazaty, Galván, Hosp. Vidal, Virgen de los Dolores', price: 4000, keywords: ['arazaty', 'costanera', 'galvan', 'vidal', 'hospital vidal', 'virgen de los dolores', 'juan de garay', 'tte ibañez'] },
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

    // Actualiza la vista previa del mapa con OpenStreetMap y enlace directo a Google Maps
    function updateMapPreview(lat, lon, labelText) {
        if (!lat || !lon) return;
        currentLat = lat;
        currentLon = lon;
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

        if (mapPreviewLink) {
            mapPreviewLink.href = mapsUrl;
        }
        if (mapPreviewIframe) {
            const delta = 0.005;
            const bbox = `${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}`;
            mapPreviewIframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
        }
        if (mapPreviewContainer) {
            mapPreviewContainer.style.display = 'block';
        }
        const titleSpan = document.getElementById('map-preview-title');
        if (titleSpan && labelText) {
            titleSpan.innerHTML = `<i class="ri-map-pin-2-fill" style="color: var(--accent-color);"></i> ${labelText}`;
        }
    }

    // GPS: Método 1 de cálculo de envío (máxima prioridad)
    function requestGpsLocation(isFromForm = false) {
        if (!navigator.geolocation) {
            showToast("Por favor, activá el GPS de tu celular para sincronizar 📍");
            return;
        }
        showToast("📍 Obteniendo ubicación GPS precisa...");

        const gpsBtn = document.getElementById('form-gps-btn');
        if (gpsBtn) {
            gpsBtn.disabled = true;
            gpsBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i><span>...</span>';
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                if (gpsBtn) {
                    gpsBtn.disabled = false;
                    gpsBtn.innerHTML = '<i class="ri-check-line"></i><span>Listo</span>';
                    setTimeout(() => {
                        gpsBtn.innerHTML = '<i class="ri-crosshair-2-fill" style="font-size: 1.15rem;"></i><span>GPS</span>';
                    }, 3000);
                }

                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                currentLat = lat;
                currentLon = lon;
                mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

                // Calcular distancia y costo de envío via GPS (Haversine)
                const km = haversineKm(lat, lon, LOCAL_LAT, LOCAL_LON);
                setDeliveryCost(priceByKm(km), 'gps', `📡 GPS · ${km.toFixed(1)} km desde el local`);

                // Intentar geocodificación inversa para nombre de calle
                let friendlyAddr = `Ubicación GPS (${lat.toFixed(5)}, ${lon.toFixed(5)})`;
                try {
                    const revRes = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
                        { headers: { 'Accept-Language': 'es' } }
                    );
                    if (revRes.ok) {
                        const revData = await revRes.json();
                        if (revData && revData.address) {
                            const road = revData.address.road || revData.address.pedestrian || '';
                            const num = revData.address.house_number || '';
                            const sub = revData.address.neighbourhood || revData.address.suburb || revData.address.city_district || '';
                            if (road) {
                                friendlyAddr = `${road}${num ? ' ' + num : ''}${sub ? ' (' + sub + ')' : ''} [GPS Detectado]`;
                            }
                        }
                    }
                } catch (err) {
                    console.warn('Reverse geocode error:', err);
                }

                customerAddress.value = friendlyAddr;
                updateMapPreview(lat, lon, `GPS Sincronizado (${km.toFixed(1)} km)`);
                showToast(`✅ GPS sincronizado · Envío: $${priceByKm(km).toLocaleString('es-AR')}`);
            },
            (error) => {
                if (gpsBtn) {
                    gpsBtn.disabled = false;
                    gpsBtn.innerHTML = '<i class="ri-crosshair-2-fill" style="font-size: 1.15rem;"></i><span>GPS</span>';
                }
                console.error('Error GPS code:', error.code, error.message);
                if (error.code === 1) {
                    showToast('⚠️ Permiso de GPS denegado. Permití la ubicación en los ajustes del navegador.');
                } else if (error.code === 2) {
                    showToast('📡 GPS no disponible ahora. Activá la ubicación de tu celular.');
                } else if (error.code === 3) {
                    showToast('⏱️ Tiempo agotado buscando GPS. Probá de nuevo o escribí tu dirección.');
                } else {
                    showToast('❌ No pudimos obtener tu ubicación. Escribí tu dirección manualmente.');
                }
                if (!deliveryMethod) showZoneSelector(true);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
        );
    }

    menuGpsBtn.addEventListener('click', () => {
        appMenuDropdown.classList.remove('show');
        requestGpsLocation(false);
    });

    if (formGpsBtn) {
        formGpsBtn.addEventListener('click', () => {
            requestGpsLocation(true);
        });
    }

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
            showToast('Para instalar, usá "Agregar a Inicio" en el menú de tu navegador 📱👑');
        }
    });

    // Manejar visibilidad y lógica de copia de Alias & Mercado Pago
    paymentMethod.addEventListener('change', () => {
        aliasContainer.style.display = paymentMethod.value === 'Transferencia' ? 'flex' : 'none';
    });

    copyAliasBtn.addEventListener('click', () => {
        navigator.clipboard.writeText('olivares.95').then(() => {
            showToast('¡Alias olivares.95 copiado al portapapeles!');
        }).catch(err => console.error('Error al copiar:', err));
    });

    if (openMpBtn) {
        openMpBtn.addEventListener('click', () => {
            const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const envio = (deliveryType === 'Delivery') ? deliveryCost : 0;
            const grandTotal = subtotal + envio;

            if (grandTotal <= 0) {
                showToast('Agregá productos al carrito primero');
                return;
            }

            const mpDeepLink = `mercadopago://payment?amount=${grandTotal}&alias=olivares.95&description=Pedido%20TheKing`;
            const mpWebLink = `https://www.mercadopago.com.ar/pay?alias=olivares.95&amount=${grandTotal}`;

            showToast('Abriendo Mercado Pago... ¡Recordá sacar captura del comprobante!');
            
            // Intentar abrir la app nativa de MP; si no está, abrir versión web
            const start = Date.now();
            window.location.href = mpDeepLink;
            setTimeout(() => {
                if (Date.now() - start < 1500) {
                    window.open(mpWebLink, '_blank');
                }
            }, 1200);
        });
    }

    if (receiptFileInput) {
        receiptFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                attachedReceiptName = file.name;
                if (receiptFilename) receiptFilename.textContent = `📎 ${file.name}`;
                if (receiptPreviewContainer) receiptPreviewContainer.style.display = 'flex';
                showToast('✅ Comprobante adjunto. ¡Envialo por WhatsApp!');
            }
        });
    }

    if (removeReceiptBtn) {
        removeReceiptBtn.addEventListener('click', () => {
            attachedReceiptName = null;
            if (receiptFileInput) receiptFileInput.value = '';
            if (receiptPreviewContainer) receiptPreviewContainer.style.display = 'none';
            showToast('Comprobante desadjuntado');
        });
    }

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
            currentLat = null;
            currentLon = null;
            if (deliveryMethod !== 'gps') resetDeliveryCost();
            return;
        }

        mapDebounceTimer = setTimeout(async () => {
            const query = encodeURIComponent(`${direccion}, ${CIUDAD}`);
            mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
            if (mapPreviewLink) mapPreviewLink.href = mapsUrl;

            // Método 2: OpenStreetMap geocoding para calcular envío y ubicar mapa
            await tryOsmGeocoding(direccion);

            // Si OSM no obtuvo coordenadas exactas pero hay texto, mostrar mapa general de Corrientes
            if (!currentLat && mapPreviewContainer) {
                mapPreviewContainer.style.display = 'block';
                if (mapPreviewIframe && !mapPreviewIframe.src) {
                    mapPreviewIframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=-58.85%2C-27.52%2C-58.75%2C-27.44&layer=mapnik`;
                }
            }
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

    function sanitizeProductImage(value) {
        if (!value) return null;
        const source = String(value).trim();
        if (source.length > 300) return null;

        try {
            const imageUrl = new URL(source, window.location.origin);
            return imageUrl.origin === window.location.origin || imageUrl.protocol === 'https:'
                ? source
                : null;
        } catch (error) {
            return null;
        }
    }

    function renderProductCards(items) {
        productsGrid.innerHTML = '';
        items.forEach((product, index) => {
            const card = document.createElement('article');
            card.classList.add('product-card', 'glassmorphism');
            card.style.setProperty('--card-delay', `${index * 0.06}s`);

            const sizes = product.sizes && typeof product.sizes === 'object' ? product.sizes : null;
            const initialPrice = Number(sizes ? sizes.doble : product.price) || 0;
            const imageUrl = sanitizeProductImage(product.img);

            const imageWrapper = document.createElement('div');
            imageWrapper.className = imageUrl
                ? 'product-img-wrapper has-image'
                : 'product-img-wrapper';
            if (product.includesFries) {
                const badge = document.createElement('div');
                badge.className = 'product-badge';
                badge.textContent = '🍟 ¡Incluye Papas!';
                imageWrapper.appendChild(badge);
            }
            if (imageUrl) {
                const image = document.createElement('img');
                image.src = imageUrl;
                image.alt = String(product.name || '');
                image.loading = 'lazy';
                imageWrapper.appendChild(image);
            }

            const info = document.createElement('div');
            info.className = 'product-info';
            const title = document.createElement('h3');
            title.textContent = String(product.name || '');
            const description = document.createElement('p');
            description.textContent = String(product.desc || '');
            info.append(title, description);

            if (sizes) {
                const sizeSelector = document.createElement('div');
                sizeSelector.className = 'size-selector';
                ['doble', 'triple'].forEach((size, sizeIndex) => {
                    const sizeButton = document.createElement('button');
                    sizeButton.type = 'button';
                    sizeButton.className = sizeIndex === 0 ? 'size-btn active' : 'size-btn';
                    sizeButton.dataset.size = size;
                    sizeButton.dataset.price = String(Number(sizes[size]) || 0);
                    sizeButton.textContent = size === 'doble' ? 'Doble' : 'Triple';
                    sizeSelector.appendChild(sizeButton);
                });
                info.appendChild(sizeSelector);
            }

            const action = document.createElement('div');
            action.className = 'product-action';
            const price = document.createElement('span');
            price.className = 'price';
            price.textContent = `$${initialPrice.toLocaleString('es-AR')}`;
            const addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.className = 'add-to-cart-btn add-to-cart';
            addButton.dataset.id = String(product.id || '');
            addButton.dataset.name = String(product.name || '');
            addButton.dataset.price = String(initialPrice);
            const addIcon = document.createElement('i');
            addIcon.className = 'ri-add-line';
            const addText = document.createElement('span');
            addText.className = 'btn-cart-text';
            addText.textContent = ' Agregar';
            addButton.append(addIcon, addText);
            action.append(price, addButton);
            info.appendChild(action);
            card.append(imageWrapper, info);

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
                (String(p.name || '').toLowerCase().includes(query)
                    || String(p.desc || '').toLowerCase().includes(query))
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

    // Cargar estado inicial desde los datos ya fusionados (Firebase + estáticos)
    renderProducts('promos');
    updateCartUI();

    // Si Firebase cargó banners con éxito, aplicarlos ahora
    if (window.kingDB && window.kingDB.localBanners) {
        applyBannersData(window.kingDB.localBanners);
    }

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
            const info = document.createElement('div');
            info.className = 'item-info';
            const name = document.createElement('h4');
            name.textContent = String(item.name || '');
            const price = document.createElement('span');
            price.className = 'item-price';
            price.textContent = `$${Number(item.price || 0).toLocaleString('es-AR')}`;
            info.append(name, price);

            const controls = document.createElement('div');
            controls.className = 'item-controls';
            const minusButton = document.createElement('button');
            minusButton.type = 'button';
            minusButton.className = 'item-btn minus-btn';
            minusButton.dataset.id = String(item.id || '');
            minusButton.textContent = '-';
            const quantity = document.createElement('span');
            quantity.textContent = String(item.quantity);
            const plusButton = document.createElement('button');
            plusButton.type = 'button';
            plusButton.className = 'item-btn plus-btn';
            plusButton.dataset.id = String(item.id || '');
            plusButton.textContent = '+';
            controls.append(minusButton, quantity, plusButton);

            itemEl.append(info, controls);
            cartItemsContainer.appendChild(itemEl);
        });

        // Calcular total con envío según tipo de entrega
        const envio = (deliveryType === 'Delivery') ? deliveryCost : 0;
        const grandTotal = subtotal + envio;

        if (envio > 0) {
            if (subtotalRow) { subtotalRow.style.display = 'flex'; }
            if (cartSubtotal) cartSubtotal.textContent = `$${subtotal.toLocaleString('es-AR')}`;
            if (deliveryCostRow) { deliveryCostRow.style.display = 'flex'; }
            if (cartDeliveryCost) cartDeliveryCost.textContent = `$${envio.toLocaleString('es-AR')}`;
        } else {
            if (subtotalRow) subtotalRow.style.display = 'none';
            if (deliveryCostRow) deliveryCostRow.style.display = 'none';
        }

        cartTotal.textContent = `$${grandTotal.toLocaleString('es-AR')}`;
        if (mpTotalBadge) {
            mpTotalBadge.textContent = `$${grandTotal.toLocaleString('es-AR')}`;
        }

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
        if (km <= 1.8) return 1800;
        if (km <= 3.5) return 2200;
        if (km <= 5.2) return 3000;
        if (km <= 6.8) return 4000;
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

        // 2. Consultar OpenStreetMap por GPS aproximado
        try {
            const query = encodeURIComponent(`${direccion}, Corrientes, Argentina`);
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
                { headers: { 'Accept-Language': 'es' } }
            );
            if (!res.ok) throw new Error('OSM falló');
            const data = await res.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                updateMapPreview(lat, lon, 'Destino localizado');
                const km = haversineKm(lat, lon, LOCAL_LAT, LOCAL_LON);
                if (deliveryMethod !== 'zone_auto' && deliveryMethod !== 'zone') {
                    setDeliveryCost(priceByKm(km), 'osm', `📍 Automático · ${km.toFixed(1)} km`);
                }
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

        const name = customerName.value.trim();
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

            // ASEGURAR LINK DE MAPA Y COORDENADAS SIEMPRE
            let finalMapLink = mapsUrl;
            if (!finalMapLink && address) {
                finalMapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ', Corrientes, Argentina')}`;
            }
            if (finalMapLink) {
                message += `🗺️ *Ver en mapa / GPS:* ${finalMapLink}\n`;
            }
            if (currentLat && currentLon) {
                message += `📡 *Coordenadas GPS:* ${currentLat.toFixed(6)}, ${currentLon.toFixed(6)}\n`;
            }

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
            if (attachedReceiptName) {
                message += `💳 *Pago:* Transferencia (Alias: olivares.95)\n`;
                message += `📸 *Comprobante preparado:* "${attachedReceiptName}" (adjuntando captura)\n\n`;
            } else {
                message += `💳 *Pago:* Transferencia (Alias: olivares.95)\n`;
                message += `⚠️ *RECUERDE ENVIARNOS EL COMPROBANTE DE LA TRANSFERENCIA PARA PROCESAR SU PEDIDO.*\n\n`;
            }
        }
        message += `_¡Muchas gracias por elegirnos!_`;

        const url = `https://wa.me/${phoneWhatsApp}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');

        let completedOrders = parseInt(localStorage.getItem('king_completed_orders') || '0');
        localStorage.setItem('king_completed_orders', (completedOrders + 1).toString());

        // --- SEMILLA IA: Guardar Intento de Pedido ---
        if (window.kingDB) {
            window.kingDB.saveOrderIntent(cart);
        }
    });

    // --- REGISTRO DEL SERVICE WORKER (necesario para beforeinstallprompt) ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then((reg) => {
                console.log('✅ TheKing SW registrado:', reg.scope);
            })
            .catch((err) => {
                console.warn('⚠️ TheKing SW no pudo registrarse:', err);
            });
    }

    // --- LÓGICA ELEGANTE PWA NO INTRUSIVA ---
    const pwaBanner = document.getElementById('pwa-install-banner');
    const pwaAddBtn = document.getElementById('pwa-add-btn');
    const pwaCloseBtn = document.getElementById('pwa-close-btn');

    let visitCount = parseInt(localStorage.getItem('king_visit_count') || '0');
    visitCount++;
    localStorage.setItem('king_visit_count', visitCount.toString());

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log('✅ PWA: beforeinstallprompt capturado. Botón de instalación ACTIVO.');
        const isDismissed = localStorage.getItem('king_pwa_dismissed') === 'true';
        const completedOrders = parseInt(localStorage.getItem('king_completed_orders') || '0');
        if (!isDismissed && (visitCount >= 2 || completedOrders >= 1)) {
            setTimeout(() => { pwaBanner.style.display = 'flex'; }, 3000);
        }
    });

    // Si ya está instalada como PWA, marcar para no mostrar el banner
    window.addEventListener('appinstalled', () => {
        console.log('✅ TheKing instalada como PWA');
        deferredPrompt = null;
        if (pwaBanner) pwaBanner.style.display = 'none';
        localStorage.setItem('king_pwa_dismissed', 'true');
        showToast('👑 ¡The King Burger instalada en tu pantalla de inicio!');
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

    // --- INTEGRACIÓN CON FIREBASE EN TIEMPO REAL ---
    function applyBannersData(banners) {
        const heroTitle = document.querySelector('.hero-title');
        const heroTagline = document.querySelector('.hero-tagline');
        const heroSub = document.querySelector('.hero-sub');
        const phoneSpan = document.querySelector('.hero-info span:first-child');
        const instaSpan = document.querySelector('.hero-info span:last-child');

        if (heroTitle && banners.heroTitle) {
            const title = String(banners.heroTitle);
            const burgerIndex = title.indexOf('BURGER');
            if (burgerIndex === -1) {
                heroTitle.textContent = title;
            } else {
                const accent = document.createElement('span');
                accent.className = 'hero-accent';
                accent.textContent = 'BURGER';
                heroTitle.replaceChildren(
                    document.createTextNode(title.slice(0, burgerIndex)),
                    accent,
                    document.createTextNode(title.slice(burgerIndex + 'BURGER'.length))
                );
            }
        }
        if (heroTagline && banners.heroSubtitle) heroTagline.textContent = banners.heroSubtitle;
        if (heroSub && banners.heroSub) heroSub.textContent = banners.heroSub;
        if (phoneSpan && banners.phone) {
            const icon = document.createElement('i');
            icon.className = 'ri-phone-line';
            phoneSpan.replaceChildren(icon, document.createTextNode(` ${String(banners.phone)}`));
        }
        if (instaSpan && banners.instagram) {
            const icon = document.createElement('i');
            icon.className = 'ri-instagram-line';
            instaSpan.replaceChildren(icon, document.createTextNode(` ${String(banners.instagram)}`));
        }
        // Actualizar phoneWhatsApp dinámicamente para que los pedidos usen el número correcto
        if (banners.phoneWhatsApp) {
            const whatsappNumber = String(banners.phoneWhatsApp).replace(/\D/g, '');
            if (/^\d{8,15}$/.test(whatsappNumber)) {
                phoneWhatsApp = whatsappNumber;
                if (window.kingDB) window.kingDB._phoneWhatsApp = whatsappNumber;
            }
        }
    }

    if (window.kingDB) {
        // Escuchar cambios de menú en vivo
        window.kingDB.listenProducts((newProducts) => {
            const activeBtn = document.querySelector('.category-btn.active');
            const activeCat = activeBtn ? activeBtn.getAttribute('data-target') : 'promos';
            renderProducts(activeCat);
        });

        // Escuchar cambios de banners en vivo
        window.kingDB.listenBanners((banners) => {
            applyBannersData(banners);
        });

        // --- LÓGICA DE SORTEO PÚBLICO ---
        const sorteoSection = document.getElementById('sorteo-section');
        const sorteoPremioDisplay = document.getElementById('sorteo-premio-display');
        const sorteoPublicCount = document.getElementById('sorteo-public-count');
        const sorteoForm = document.getElementById('sorteo-form');
        const sorteoContentActive = document.getElementById('sorteo-content-active');
        const sorteoContentWinner = document.getElementById('sorteo-content-winner');
        const sorteoGanadorNombre = document.getElementById('sorteo-ganador-nombre');
        const sorteoGanadorPremio = document.getElementById('sorteo-ganador-premio');

        let sorteoData = {};

        if (sorteoSection) {
            window.kingDB.listenSorteo((config) => {
                sorteoData = config;
                if (config.active) {
                    sorteoSection.style.display = 'block';
                    sorteoPremioDisplay.textContent = config.premio;

                    if (config.ganador) {
                        sorteoContentActive.style.display = 'none';
                        sorteoContentWinner.style.display = 'block';
                        sorteoGanadorNombre.textContent = config.ganador.nombre;
                        sorteoGanadorPremio.textContent = config.premio;
                    } else {
                        sorteoContentActive.style.display = 'block';
                        sorteoContentWinner.style.display = 'none';
                    }
                } else {
                    sorteoSection.style.display = 'none';
                }
            });

            window.kingDB.listenSorteoCount((count) => {
                if (sorteoPublicCount) {
                    sorteoPublicCount.textContent = count;
                }
            });

            if (sorteoForm) {
                sorteoForm.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    // Solo permitir una inscripción por sesión local
                    if (localStorage.getItem('king_sorteo_participado_v1')) {
                        showToast('¡Ya estás participando en el sorteo actual!');
                        return;
                    }

                    const name = document.getElementById('sorteo-nombre').value.trim();
                    const tel = document.getElementById('sorteo-tel').value.trim();

                    const btn = sorteoForm.querySelector('button');
                    btn.innerHTML = 'Enviando...';
                    btn.disabled = true;

                    try {
                        const database = window.kingDB.db;
                        if (!database) throw new Error('Firestore no está disponible.');

                        const privateContact = database.collection('sorteo_contactos').doc();
                        const publicCount = database.collection('sorteo_publico').doc('estado');
                        const batch = database.batch();
                        batch.set(privateContact, {
                            nombre: name,
                            telefono: tel,
                            fecha: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        batch.set(publicCount, {
                            total: firebase.firestore.FieldValue.increment(1),
                            lastParticipantId: privateContact.id,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                        await batch.commit();

                        showToast('🎉 ¡Genial! Ya estás participando del sorteo.');
                        localStorage.setItem('king_sorteo_participado_v1', 'true');
                        sorteoForm.innerHTML = '<h3 style="color: #2ecc71;">¡Ya estás inscripto! ¡Mucha Suerte! 🍀</h3>';
                    } catch (err) {
                        showToast('Hubo un error al inscribirte. Intenta de nuevo.');
                        btn.innerHTML = '🎟️ QUIERO PARTICIPAR';
                        btn.disabled = false;
                    }
                });
            }
        }
    }

    // --- LÓGICA ESTRELLAS DE RESEÑAS ---
    const starRatings = document.querySelectorAll('.star-rating');
    const starsContainer = document.getElementById('stars-container');

    if (starRatings.length > 0 && starsContainer) {
        starRatings.forEach(star => {
            star.addEventListener('mouseenter', function () {
                const index = parseInt(this.getAttribute('data-index'));
                // Iluminar todas las estrellas hasta la actual
                starRatings.forEach(s => {
                    const sIndex = parseInt(s.getAttribute('data-index'));
                    if (sIndex <= index) {
                        s.classList.add('hovered');
                        s.querySelector('i').className = 'ri-star-fill';
                    } else {
                        s.classList.remove('hovered');
                        s.querySelector('i').className = 'ri-star-line';
                    }
                });
            });
        });

        starsContainer.addEventListener('mouseleave', function () {
            // Limpiar al salir del contenedor
            starRatings.forEach(s => {
                s.classList.remove('hovered');
                s.querySelector('i').className = 'ri-star-line';
            });
        });
    }

    // --- LÓGICA SISTEMA DE CORONAS (VALORACIÓN) ---
    const crownBtns = document.querySelectorAll('.crown-btn');
    const crownSubmitBtn = document.getElementById('crown-submit-btn');
    const crownSelect = document.getElementById('crown-product-select');
    const crownThanks = document.getElementById('crown-thanks-msg');
    let currentCrownRating = 0;

    if (crownBtns.length > 0) {
        crownBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const val = parseInt(btn.getAttribute('data-val'));
                currentCrownRating = val;

                crownBtns.forEach(b => {
                    const bVal = parseInt(b.getAttribute('data-val'));
                    if (bVal <= val) {
                        b.classList.add('rated');
                        b.querySelector('i').className = 'ri-vip-crown-fill';
                    } else {
                        b.classList.remove('rated');
                        b.querySelector('i').className = 'ri-vip-crown-line';
                    }
                });
            });
        });

        crownSubmitBtn.addEventListener('click', async () => {
            const product = crownSelect.value;
            if (!product) {
                showToast('👑 Por favor elegí una hamburguesa primero.');
                return;
            }
            if (currentCrownRating === 0) {
                showToast('👑 Dale al menos 1 corona a tu elegida.');
                return;
            }

            // Evitar spam local
            if (localStorage.getItem('king_crown_voted')) {
                showToast('👑 Ya dejaste tu voto real. ¡Gracias!');
                return;
            }

            crownSubmitBtn.textContent = 'Enviando...';
            crownSubmitBtn.disabled = true;

            if (window.kingDB) {
                const res = await window.kingDB.saveCrownRating(product, currentCrownRating);
                if (res) {
                    localStorage.setItem('king_crown_voted', 'true');
                    crownSubmitBtn.style.display = 'none';
                    crownThanks.style.display = 'block';
                }
            }
        });
    }

    // --- NOTIFICACIÓN FLOTANTE DE GANADOR EN TIEMPO REAL ---
    function showSorteoWinnerToast(ganador, premio) {
        let toastSorteo = document.getElementById('toast-sorteo-winner');
        if (!toastSorteo) {
            toastSorteo = document.createElement('div');
            toastSorteo.id = 'toast-sorteo-winner';
            toastSorteo.style.cssText = `
                position: fixed;
                bottom: 25px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
                border: 2px solid #f59e0b;
                color: #fff;
                padding: 16px 24px;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(245, 158, 11, 0.4);
                z-index: 999999;
                text-align: center;
                animation: popUpSorteo 0.5s ease-out;
            `;
            document.body.appendChild(toastSorteo);
        }
        const headline = document.createElement('div');
        headline.style.cssText = 'font-size:1.4rem; font-weight:800; color:#f59e0b; margin-bottom:4px;';
        headline.textContent = '🎉 ¡TENEMOS GANADOR EN VIVO! 🎉';
        const winnerLine = document.createElement('div');
        winnerLine.style.cssText = 'font-size:1.1rem; font-weight:700; color:#fff;';
        winnerLine.textContent = `🏆 ${String(ganador.nombre || 'Participante')}`;
        const prizeLine = document.createElement('div');
        prizeLine.style.cssText = 'font-size:0.9rem; color:#9ca3af; margin-top:4px;';
        const prizeLabel = document.createElement('strong');
        prizeLabel.textContent = String(premio || '');
        prizeLine.append(document.createTextNode('Premio: '), prizeLabel);
        toastSorteo.replaceChildren(headline, winnerLine, prizeLine);
        toastSorteo.style.display = 'block';
    }

});
