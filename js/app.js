document.addEventListener('DOMContentLoaded', () => {
    
    // --- VARIABLES GLOBALES ---
    const phoneWhatsApp = "5493794299964";
    let cart = [];

    // --- ELEMENTOS DEL DOM ---
    const categoryBtns = document.querySelectorAll('.category-btn');
    const menuSections = document.querySelectorAll('.menu-section');
    const addToCartBtns = document.querySelectorAll('.add-to-cart');
    
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

    // --- NAVEGACIÓN DE CATEGORÍAS ---
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Quitar clase active de todos los botones y secciones
            categoryBtns.forEach(b => b.classList.remove('active'));
            menuSections.forEach(s => s.classList.remove('active'));

            // Añadir clase active al clickeado
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- LOGICA DEL CARRITO ---

    // Abrir/Cerrar Carrito
    cartToggle.addEventListener('click', () => cartModal.classList.add('open'));
    closeCartBtn.addEventListener('click', () => cartModal.classList.remove('open'));

    // Añadir al carrito
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            const price = parseFloat(btn.getAttribute('data-price'));

            addToCart({ id, name, price, quantity: 1 });
            showToast(`¡${name} agregado!`);
        });
    });

    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push(product);
        }
        updateCartUI();
    }

    function changeQuantity(id, delta) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
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
                    <span class="item-price">$${item.price}</span>
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
            message += `▪ ${item.quantity}x ${item.name} ($${item.price}) = $${subtotal}%0A`;
        });

        message += `%0A*TOTAL A PAGAR: $${total.toLocaleString('es-AR')}*%0A%0A`;
        message += `_¡Muchas gracias por elegirnos!_`;

        const url = `https://wa.me/${phoneWhatsApp}?text=${message}`;
        window.open(url, '_blank');
    });

});
