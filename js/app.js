document.addEventListener('DOMContentLoaded', () => {
    
    // --- DATOS DEL MENÚ ---
    const phoneWhatsApp = "5493794299964";
    
    // Los productos se cargan desde products.js de forma global

    let cart = JSON.parse(localStorage.getItem('king_cart')) || [];

    // --- ELEMENTOS DEL DOM ---
    const categoryBtns = document.querySelectorAll('.category-btn');
    const sectionTitle = document.getElementById('section-title');
    const productsGrid = document.getElementById('products-grid');
    
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

    // Nuevos elementos para Delivery vs Retiro y GPS
    const optionDelivery = document.getElementById('option-delivery');
    const optionTakeaway = document.getElementById('option-takeaway');
    const deliveryDetailsContainer = document.getElementById('delivery-details-container');
    const takeawayDetailsContainer = document.getElementById('takeaway-details-container');
    const gpsBtn = document.getElementById('gps-btn');
    const gpsStatus = document.getElementById('gps-status');

    let deliveryType = 'Delivery'; // 'Delivery' o 'Retiro'
    let gpsCoordsUrl = ''; // Guardará el link de Google Maps si se pulsa el botón de GPS

    // Manejar visibilidad y lógica de copia de Alias
    paymentMethod.addEventListener('change', () => {
        if (paymentMethod.value === 'Transferencia') {
            aliasContainer.style.display = 'flex';
        } else {
            aliasContainer.style.display = 'none';
        }
    });

    copyAliasBtn.addEventListener('click', () => {
        const alias = "olivares.95";
        navigator.clipboard.writeText(alias).then(() => {
            showToast("¡Alias copiado al portapapeles!");
        }).catch(err => {
            console.error('Error al copiar:', err);
        });
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
    });

    // Lógica para geolocalización GPS
    gpsBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showToast("Tu navegador no soporta geolocalización");
            return;
        }

        gpsBtn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i> Obteniendo ubicación...';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                gpsCoordsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
                
                gpsBtn.style.background = 'rgba(34, 197, 94, 0.15)';
                gpsBtn.style.borderColor = '#22c55e';
                gpsBtn.style.color = '#22c55e';
                gpsBtn.innerHTML = '<i class="ri-checkbox-circle-fill"></i> ¡Ubicación Obtenida!';
                gpsStatus.style.display = 'block';
                showToast("📍 Ubicación GPS obtenida correctamente");
            },
            (error) => {
                console.error("Error GPS:", error);
                gpsBtn.innerHTML = '<i class="ri-map-pin-user-fill"></i> Compartir mi Ubicación GPS';
                gpsBtn.style.background = 'rgba(239, 68, 68, 0.15)';
                gpsBtn.style.borderColor = '#ef4444';
                gpsBtn.style.color = '#ef4444';
                showToast("No pudimos acceder al GPS. Escribe la dirección.");
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
    // --- NAVEGACIÓN Y RENDERIZADO ---
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-target');
            
            // Actualizar título con animación
            sectionTitle.textContent = btn.textContent;
            sectionTitle.classList.remove('title-animate');
            void sectionTitle.offsetWidth; // Trigger reflow
            sectionTitle.classList.add('title-animate');
            
            // Renderizar productos
            renderProducts(category);
        });
    });

    // Función para renderizar productos de la categoría seleccionada
    function renderProducts(category) {
        productsGrid.innerHTML = '';
        const rawItems = PRODUCTS[category] || [];
        // Filtrar productos que no estén disponibles (sin stock)
        const items = rawItems.filter(p => p.available !== false);

        if (items.length === 0) {
            productsGrid.innerHTML = '<p class="empty-cart-msg">No hay productos disponibles en esta categoría.</p>';
            return;
        }

        items.forEach((product, index) => {
            const card = document.createElement('article');
            card.classList.add('product-card', 'glassmorphism');
            card.style.setProperty('--card-delay', `${index * 0.08}s`);

            let sizeSelectorHTML = '';
            let initialPrice = product.price;

            // Si tiene tamaños (Premium)
            if (product.sizes) {
                initialPrice = product.sizes.doble; // precio por defecto es Doble
                sizeSelectorHTML = `
                    <div class="size-selector">
                        <button class="size-btn active" data-size="doble" data-price="${product.sizes.doble}">Doble</button>
                        <button class="size-btn" data-size="triple" data-price="${product.sizes.triple}">Triple</button>
                    </div>
                `;
            }

            const KING_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="%2313151f" rx="16"/><g transform="translate(60,60)"><path d="M40 160C40 90 240 90 280 160Z" fill="%23e60023"/><path d="M20 120L50 70L80 100L110 50L140 110Z" fill="%23ffb703"/><ellipse cx="140" cy="115" rx="7" ry="4" fill="%23fff"/><ellipse cx="190" cy="105" rx="7" ry="4" fill="%23fff"/><ellipse cx="230" cy="130" rx="7" ry="4" fill="%23fff"/><path d="M35 165L285 165L250 200L220 175L170 210L130 175Z" fill="%23ffb703"/><path d="M45 195C45 260 275 260 275 195Z" fill="%23b70425"/></g></svg>`;
            
            const badgeHTML = product.includesFries 
                ? `<div class="product-badge">🍟 ¡Incluye Papas!</div>` 
                : '';

            const imgHTML = `<div class="product-img-wrapper">
                    ${badgeHTML}
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

            // Agregar listeners para el selector de tamaño si existe
            if (product.sizes) {
                const sizeBtns = card.querySelectorAll('.size-btn');
                const priceSpan = card.querySelector('.price');
                const addToCartBtn = card.querySelector('.add-to-cart-btn');

                sizeBtns.forEach(sizeBtn => {
                    sizeBtn.addEventListener('click', () => {
                        // Cambiar botón activo
                        sizeBtns.forEach(sb => sb.classList.remove('active'));
                        sizeBtn.classList.add('active');

                        const selectedSize = sizeBtn.getAttribute('data-size');
                        const selectedPrice = parseFloat(sizeBtn.getAttribute('data-price'));

                        // Actualizar precio visualmente con animación
                        priceSpan.classList.remove('price-pop');
                        void priceSpan.offsetWidth; // Reflow
                        priceSpan.classList.add('price-pop');
                        priceSpan.textContent = `$${selectedPrice.toLocaleString('es-AR')}`;

                        // Actualizar atributos del botón de agregar al carrito
                        addToCartBtn.setAttribute('data-price', selectedPrice);
                        addToCartBtn.setAttribute('data-size-selected', selectedSize);
                    });
                });
            }
        });

        // Configurar los listeners para añadir al carrito
        setupAddToCartListeners();
    }

    function setupAddToCartListeners() {
        const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                let name = btn.getAttribute('data-name');
                const price = parseFloat(btn.getAttribute('data-price'));
                const sizeSelected = btn.getAttribute('data-size-selected') || 'doble'; // por defecto doble si aplica

                let finalId = id;
                const hasSizes = PRODUCTS.premium.some(p => p.id === id);
                if (hasSizes) {
                    finalId = `${id}-${sizeSelected}`;
                    const sizeLabel = sizeSelected.charAt(0).toUpperCase() + sizeSelected.slice(1);
                    name = `${name} (${sizeLabel})`;
                }

                addToCart({ id: finalId, name, price, quantity: 1 });
                showToast(`¡${name} agregado!`);
            });
        });
    }

    // Cargar estado inicial
    renderProducts('promos');
    updateCartUI();

    // --- LÓGICA DEL CARRITO ---

    // Abrir/Cerrar Carrito
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
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            localStorage.setItem('king_cart', JSON.stringify(cart));
            updateCartUI();
        }
    }

    function updateCartUI() {
        // Actualizar contador
        const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
        cartCount.textContent = totalItems;

        // Renderizar items
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío</p>';
            cartTotal.textContent = '$0';
            if (checkoutForm) {
                checkoutForm.style.display = 'none';
                aliasContainer.style.display = 'none';
            }
            return;
        }

        if (checkoutForm) {
            checkoutForm.style.display = 'flex';
            // Sincronizar visibilidad del alias al actualizar la UI del carrito
            if (paymentMethod.value === 'Transferencia') {
                aliasContainer.style.display = 'flex';
            } else {
                aliasContainer.style.display = 'none';
            }
        }

        let total = 0;
        cart.forEach(item => {
            total += item.price * item.quantity;
            
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

        cartTotal.textContent = `$${total.toLocaleString('es-AR')}`;

        // Añadir listeners a los nuevos botones
        document.querySelectorAll('.minus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                changeQuantity(e.target.getAttribute('data-id'), -1);
            });
        });

        document.querySelectorAll('.plus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                changeQuantity(e.target.getAttribute('data-id'), 1);
            });
        });
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // --- CHECKOUT WHATSAPP ---
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showToast("El carrito está vacío");
            return;
        }
        
        const name = customerName.value.trim();
        const address = customerAddress.value.trim();
        const payment = paymentMethod.value;

        if (!name) {
            showToast("¡Por favor completa tu Nombre y Apellido!");
            return;
        }

        if (deliveryType === 'Delivery' && !address) {
            showToast("¡Por favor completa tu Dirección de Envío!");
            return;
        }

        let total = 0;
        let message = `👑 *NUEVO PEDIDO - THE KING BURGER* 👑%0A%0A`;
        
        message += `👤 *Cliente:* ${name}%0A`;
        message += `🛵 *Entrega:* ${deliveryType}%0A`;
        
        if (deliveryType === 'Delivery') {
            message += `📍 *Dirección:* ${address}%0A`;
            if (gpsCoordsUrl) {
                message += `🗺️ *Mapa GPS:* ${gpsCoordsUrl}%0A`;
            }
        } else {
            message += `📍 *Retiro:* Local The King Burger%0A`;
        }
        
        message += `💵 *Pago:* ${payment}%0A%0A`;
        message += `🍔 *DETALLE DEL PEDIDO:*%0A`;

        cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            message += `▪ ${item.quantity}x ${item.name} ($${item.price.toLocaleString('es-AR')}) = $${subtotal.toLocaleString('es-AR')}%0A`;
        });

        message += `%0A*TOTAL A PAGAR: $${total.toLocaleString('es-AR')}*%0A%0A`;
        message += `_¡Muchas gracias por elegirnos!_`;

        const url = `https://wa.me/${phoneWhatsApp}?text=${message}`;
        window.open(url, '_blank');
    });

});
