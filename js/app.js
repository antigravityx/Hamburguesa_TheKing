document.addEventListener('DOMContentLoaded', () => {
    
    // --- DATOS DEL MENÚ ---
    const phoneWhatsApp = "5493794299964";
    
    const PRODUCTS = {
        promos: [
            {
                id: "promo-1",
                name: "3 Hambur Gruesas Especiales",
                desc: "Pan Brioche, Blend de Carne, Queso, Tomate, Huevo, Jamon, Mayonesa Casera. + Papas Fritas.",
                price: 19000,
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            },
            {
                id: "promo-2",
                name: "2 Bur Gruesas Cheese \"Doble !\"",
                desc: "Pan Brioche, Blend de Carne, Queso Cheddar, Mayonesa Casera. + Papas Fritas.",
                price: 18000,
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            },
            {
                id: "promo-3",
                name: "2 Hambur Provolone Simple",
                desc: "Pan Brioche, Blend de Carne, Queso (Provolone), Mayonesa Casera. + Papas Fritas.",
                price: 10000,
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            },
            {
                id: "promo-4",
                name: "2 Provolone \"Doble !\"",
                desc: "Pan Brioche, Blend de Carne, Queso (Provolone), Mayonesa Casera. + Papas Fritas.",
                price: 18000,
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            },
            {
                id: "promo-5",
                name: "2 Cleopatra Simple",
                desc: "Pan Brioche, Blend de Carne, Queso Cheddar, Panceta, Mayonesa Casera. + Papas Fritas.",
                price: 12000,
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            },
            {
                id: "promo-6",
                name: "2 Arturo Simple",
                desc: "Pan Brioche, Blend de Carne, Queso Tybo, Mayonesa Casera. + Papas Fritas.",
                price: 12000,
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            }
        ],
        premium: [
            {
                id: "premium-arturo",
                name: "Arturo Premium",
                desc: "Pan Brioche, Blend de Carne, Queso Tybo, Huevo, Mayonesa Casera. Incluye papas.",
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                sizes: { doble: 9000, triple: 12000 }
            },
            {
                id: "premium-alejandro",
                name: "Alejandro Magno",
                desc: "Pan Brioche, Blend de Carne, Queso Cheddar, Cebolla Caramelizada, Mayonesa Casera. Incluye papas.",
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                sizes: { doble: 9500, triple: 13000 }
            },
            {
                id: "premium-cleopatra",
                name: "Cleopatra Premium",
                desc: "Pan Brioche, Blend de Carne, Queso Cheddar, Panceta, Mayonesa Casera. Incluye papas.",
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                sizes: { doble: 9500, triple: 13000 }
            },
            {
                id: "premium-leonidas",
                name: "Leónidas",
                desc: "Pan Brioche, Mayonesa casera, Blend de Carne, Queso Tybo, Jamón y Morrones Ahumados. Incluye papas.",
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                sizes: { doble: 9500, triple: 13000 }
            },
            {
                id: "premium-ragnar",
                name: "Ragnar",
                desc: "Pan Brioche con Queso Parmesano, Blend de Carne, Queso Cheddar, Queso Tybo, Panceta, Huevo, Mayonesa Casera. Incluye papas.",
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                sizes: { doble: 10000, triple: 14000 }
            },
            {
                id: "premium-lathgertha",
                name: "Lathgertha",
                desc: "Pan Brioche con Queso Parmesano, Blend de Carne, Queso Tybo, Jamon Cocido, Huevo, Lechuga Repollada, Tomate, Mayonesa Casera. Incluye papas.",
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                sizes: { doble: 10000, triple: 14000 }
            },
            {
                id: "premium-marcus",
                name: "Marcus Aurelius",
                desc: "Pan Brioche con Queso Parmesano, Blend de carne, Queso Cheddar x4, Panceta Ahumada, Pepinillos, Mayonesa Casera. Incluye papas.",
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                sizes: { doble: 10000, triple: 14000 }
            }
        ],
        clasicas: [
            {
                id: "clasica-comun",
                name: "Común",
                desc: "Pan de papa, mayonesa casera, blend de carne, queso, tomate.",
                price: 6500,
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            },
            {
                id: "clasica-especial",
                name: "Especial",
                desc: "Pan de papa, mayonesa casera, blend de carne, queso, jamón cocido, huevo, tomate.",
                price: 7000,
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            }
        ],
        pizzas: [
            {
                id: "pizza-mozzarella",
                name: "Pizza Mozzarella",
                desc: "Masa casera, salsa, queso mozzarella, orégano, aceitunas.",
                price: 8500,
                img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            },
            {
                id: "pizza-morrones",
                name: "Pizza Morrones Ahumados",
                desc: "Masa casera, salsa, queso mozzarella, jamón cocido, morrones ahumados, orégano, aceitunas.",
                price: 9500,
                img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            },
            {
                id: "pizza-fugazzeta",
                name: "Pizza Fugazzeta",
                desc: "Masa casera, salsa, queso mozzarella, orégano, aceitunas, cebollas salteadas.",
                price: 9000,
                img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            },
            {
                id: "pizza-calabresa",
                name: "Pizza Calabresa",
                desc: "Masa casera, salsa, queso mozzarella, orégano, calabresa.",
                price: 9500,
                img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            },
            {
                id: "pizza-theking",
                name: "Pizza The King",
                desc: "Masa casera, salsa, queso mozzarella, tomates, orégano, huevos fritos.",
                price: 10500,
                img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            }
        ],
        papas: [
            {
                id: "papas-clasicas",
                name: "Papas Clásicas",
                desc: "Papas fritas clásicas bastón crujientes.",
                price: 9000,
                img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            },
            {
                id: "papas-cheddar",
                name: "Papas Clásicas con Cheddar",
                desc: "Papas fritas bastón bañadas con abundante queso cheddar fundido.",
                price: 9500,
                img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            },
            {
                id: "papas-cheddar-panceta",
                name: "Papas Clásicas con Cheddar y Panceta",
                desc: "Papas fritas bastón con queso cheddar fundido y panceta picada crujiente.",
                price: 10500,
                img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            }
        ],
        bebidas: [
            {
                id: "bebida-gaseosa",
                name: "Gaseosa 500ml",
                desc: "Línea Coca-Cola, Sprite o Fanta bien fría.",
                price: 3500,
                img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            },
            {
                id: "bebida-cerveza",
                name: "Cerveza en Lata",
                desc: "Lata Heineken o Stella Artois de 473ml helada.",
                price: 4500,
                img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            },
            {
                id: "bebida-agua",
                name: "Agua Mineral 500ml",
                desc: "Agua mineral con o sin gas bien fría.",
                price: 2500,
                img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
            }
        ]
    };

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

    // --- NAVEGACIÓN Y RENDERIZADO ---
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-target');
            
            // Actualizar título
            sectionTitle.textContent = btn.textContent;
            
            // Renderizar productos
            renderProducts(category);
        });
    });

    // Función para renderizar productos de la categoría seleccionada
    function renderProducts(category) {
        productsGrid.innerHTML = '';
        const items = PRODUCTS[category] || [];

        if (items.length === 0) {
            productsGrid.innerHTML = '<p class="empty-cart-msg">No hay productos en esta categoría.</p>';
            return;
        }

        items.forEach(product => {
            const card = document.createElement('article');
            card.classList.add('product-card', 'glassmorphism');

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

            card.innerHTML = `
                <div class="product-img">
                    <img src="${product.img}" alt="${product.name}">
                </div>
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

                        // Actualizar precio visualmente
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
            if (checkoutForm) checkoutForm.style.display = 'none';
            return;
        }

        if (checkoutForm) checkoutForm.style.display = 'flex';

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

        if (!name || !address) {
            showToast("¡Por favor completa tu Nombre y Dirección!");
            return;
        }

        let total = 0;
        let message = `👑 *NUEVO PEDIDO - THE KING BURGER* 👑%0A%0A`;
        
        message += `👤 *Cliente:* ${name}%0A`;
        message += `📍 *Dirección:* ${address}%0A`;
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
