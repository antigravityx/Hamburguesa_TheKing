/**
 * 👑 THE KING BURGER - LÓGICA DEL PANEL ADMINISTRATIVO DE SECRETARÍA
 * Manejo de UI, Auth, CRUD de Productos, Modificación de Banners y Sync en tiempo real
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const headerUserActions = document.getElementById('header-user-actions');

    // Navegación por Pestañas
    const navBtns = document.querySelectorAll('.admin-nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Gestión de Productos
    const adminProductsList = document.getElementById('admin-products-list');
    const categoryFilterBtns = document.querySelectorAll('#category-filters .category-btn');
    const addProductBtn = document.getElementById('add-product-btn');
    
    // Modal
    const productModal = document.getElementById('product-modal');
    const productForm = document.getElementById('product-form');
    const modalTitle = document.getElementById('modal-title');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const prodEditId = document.getElementById('prod-edit-id');
    const prodEditCategory = document.getElementById('prod-edit-category');
    const prodCategorySelect = document.getElementById('prod-category-select');
    const prodName = document.getElementById('prod-name');
    const prodDesc = document.getElementById('prod-desc');
    const prodPrice = document.getElementById('prod-price');
    const prodImg = document.getElementById('prod-img');
    const prodAvailable = document.getElementById('prod-available');
    const prodIncludesFries = document.getElementById('prod-includes-fries');

    // Banners
    const bannersForm = document.getElementById('banners-form');
    const bannerHeroTitle = document.getElementById('banner-hero-title');
    const bannerHeroSubtitle = document.getElementById('banner-hero-subtitle');
    const bannerHeroSub = document.getElementById('banner-hero-sub');
    const bannerPhone = document.getElementById('banner-phone');
    const bannerPhoneWa = document.getElementById('banner-phone-wa');
    const bannerInstagram = document.getElementById('banner-instagram');
    const bannerPromoActive = document.getElementById('banner-promo-active');
    const bannerPromoText = document.getElementById('banner-promo-text');

    // Seguridad
    const changePassForm = document.getElementById('change-pass-form');
    const passOld = document.getElementById('pass-old');
    const passNew = document.getElementById('pass-new');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const resetDefaultBtn = document.getElementById('reset-default-btn');
    const toastNotify = document.getElementById('toast-notify');

    let currentCategory = 'all';
    let localProductsState = window.kingDB.getProducts() || PRODUCTS;

    // --- 1. VERIFICACIÓN DE SESIÓN INICIAL ---
    checkAuth();

    function checkAuth() {
        const session = window.kingDB.isAuthenticated();
        if (session) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            headerUserActions.style.display = 'flex';
            loadDashboardData();
        } else {
            loginSection.style.display = 'flex';
            dashboardSection.style.display = 'none';
            headerUserActions.style.display = 'none';
        }
    }

    // --- 2. MANEJO DE LOGIN Y LOGOUT ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-password').value;

        const res = window.kingDB.login(user, pass);
        if (res.success) {
            loginError.style.display = 'none';
            showToast('¡Bienvenida al Panel de Control, Secretaría! 👑');
            checkAuth();
        } else {
            loginError.textContent = res.error;
            loginError.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', () => {
        window.kingDB.logout();
        showToast('Sesión cerrada correctamente');
        checkAuth();
    });

    // --- 3. NAVEGACIÓN POR PESTAÑAS ---
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // --- 4. CARGA DE DATOS AL DASHBOARD ---
    function loadDashboardData() {
        localProductsState = window.kingDB.getProducts() || PRODUCTS;
        renderProductsList();
        loadBannersData();
    }

    // --- 5. RENDERIZADO DE LA LISTA DE PRODUCTOS ---
    function renderProductsList() {
        adminProductsList.innerHTML = '';
        let hasItems = false;

        for (const catKey in localProductsState) {
            if (currentCategory !== 'all' && currentCategory !== catKey) continue;

            const categoryItems = localProductsState[catKey] || [];
            
            categoryItems.forEach((product, index) => {
                hasItems = true;
                const card = document.createElement('div');
                card.className = 'admin-product-card glassmorphism';
                
                const isAvailable = product.available !== false;

                card.innerHTML = `
                    <img src="${product.img || 'img/pan-353---.jpg'}" alt="${product.name}" class="admin-prod-img" onerror="this.src='img/pan-353---.jpg'">
                    <div class="admin-prod-info">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span class="admin-prod-title">${product.name}</span>
                            <span style="font-size: 0.75rem; background: rgba(255,255,255,0.1); padding: 0.1rem 0.5rem; border-radius: 6px; text-transform: uppercase;">${catKey}</span>
                        </div>
                        <p class="admin-prod-desc">${product.desc}</p>
                        <div class="admin-prod-price">$${product.price.toLocaleString('es-AR')}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <button class="stock-toggle-btn ${isAvailable ? 'available' : 'out-of-stock'}" data-cat="${catKey}" data-index="${index}">
                            <i class="${isAvailable ? 'ri-checkbox-circle-fill' : 'ri-close-circle-fill'}"></i>
                            ${isAvailable ? 'Disponible' : 'AGOTADO'}
                        </button>
                        <button class="btn-action-icon edit-prod-btn" data-cat="${catKey}" data-index="${index}" title="Editar">
                            <i class="ri-pencil-fill"></i>
                        </button>
                        <button class="btn-action-icon delete-prod-btn" data-cat="${catKey}" data-index="${index}" title="Eliminar" style="color: #ef233c;">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                `;
                adminProductsList.appendChild(card);
            });
        }

        if (!hasItems) {
            adminProductsList.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--text-muted);">No hay productos registrados en esta categoría.</div>`;
        }

        // Asignar Eventos a Botones
        attachProductEvents();
    }

    function attachProductEvents() {
        // Toggle Disponibilidad (1 Clic)
        document.querySelectorAll('.stock-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.getAttribute('data-cat');
                const idx = parseInt(btn.getAttribute('data-index'));
                
                const currentStatus = localProductsState[cat][idx].available !== false;
                localProductsState[cat][idx].available = !currentStatus;
                
                saveAndUpdateState(`Producto marcado como ${!currentStatus ? 'Disponible' : 'AGOTADO'}`);
            });
        });

        // Editar Producto
        document.querySelectorAll('.edit-prod-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.getAttribute('data-cat');
                const idx = parseInt(btn.getAttribute('data-index'));
                const prod = localProductsState[cat][idx];

                modalTitle.textContent = 'Editar Producto';
                prodEditId.value = idx;
                prodEditCategory.value = cat;
                prodCategorySelect.value = cat;
                prodName.value = prod.name;
                prodDesc.value = prod.desc;
                prodPrice.value = prod.price;
                prodImg.value = prod.img;
                prodAvailable.checked = prod.available !== false;
                prodIncludesFries.checked = !!prod.includesFries;

                productModal.style.display = 'flex';
            });
        });

        // Eliminar Producto
        document.querySelectorAll('.delete-prod-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.getAttribute('data-cat');
                const idx = parseInt(btn.getAttribute('data-index'));
                const prodNameStr = localProductsState[cat][idx].name;

                if (confirm(`¿Estás segura de eliminar "${prodNameStr}" de la carta?`)) {
                    localProductsState[cat].splice(idx, 1);
                    saveAndUpdateState('Producto eliminado correctamente');
                }
            });
        });
    }

    // Filtros por Categoría
    categoryFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.getAttribute('data-cat');
            renderProductsList();
        });
    });

    // --- 6. MODAL DE AGREGAR / EDITAR PRODUCTO ---
    addProductBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Agregar Nuevo Producto';
        prodEditId.value = '-1'; // -1 indica nuevo
        prodEditCategory.value = 'promos';
        prodCategorySelect.value = 'promos';
        prodName.value = '';
        prodDesc.value = '';
        prodPrice.value = '';
        prodImg.value = 'img/pan-353---.jpg';
        prodAvailable.checked = true;
        prodIncludesFries.checked = true;

        productModal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
        productModal.style.display = 'none';
    });

    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const idx = parseInt(prodEditId.value);
        const targetCategory = prodCategorySelect.value;
        const oldCategory = prodEditCategory.value;

        const newProd = {
            id: idx >= 0 && localProductsState[oldCategory][idx] ? localProductsState[oldCategory][idx].id : 'prod-' + Date.now(),
            name: prodName.value.trim(),
            desc: prodDesc.value.trim(),
            price: parseFloat(prodPrice.value),
            img: prodImg.value.trim(),
            includesFries: prodIncludesFries.checked,
            available: prodAvailable.checked
        };

        if (idx >= 0 && localProductsState[oldCategory][idx]) {
            // Edición existente
            if (targetCategory !== oldCategory) {
                // Se movió de categoría
                localProductsState[oldCategory].splice(idx, 1);
                if (!localProductsState[targetCategory]) localProductsState[targetCategory] = [];
                localProductsState[targetCategory].push(newProd);
            } else {
                localProductsState[targetCategory][idx] = newProd;
            }
        } else {
            // Producto nuevo
            if (!localProductsState[targetCategory]) localProductsState[targetCategory] = [];
            localProductsState[targetCategory].push(newProd);
        }

        productModal.style.display = 'none';
        saveAndUpdateState('¡Producto guardado y publicado en la web!');
    });

    // --- 7. MANEJO DE BANNERS Y TEXTOS ---
    function loadBannersData() {
        const banners = window.kingDB.getBanners();
        bannerHeroTitle.value = banners.heroTitle;
        bannerHeroSubtitle.value = banners.heroSubtitle;
        bannerHeroSub.value = banners.heroSub;
        bannerPhone.value = banners.phone;
        bannerPhoneWa.value = banners.phoneWhatsApp;
        bannerInstagram.value = banners.instagram;
        bannerPromoActive.checked = banners.promoBarActive;
        bannerPromoText.value = banners.promoBarText;
    }

    bannersForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const bannerData = {
            heroTitle: bannerHeroTitle.value.trim(),
            heroSubtitle: bannerHeroSubtitle.value.trim(),
            heroSub: bannerHeroSub.value.trim(),
            phone: bannerPhone.value.trim(),
            phoneWhatsApp: bannerPhoneWa.value.trim(),
            instagram: bannerInstagram.value.trim(),
            promoBarActive: bannerPromoActive.checked,
            promoBarText: bannerPromoText.value.trim()
        };

        const res = window.kingDB.saveBanners(bannerData);
        if (res.success) {
            showToast('✅ Banners actualizados en theking.sbs');
        } else {
            showToast('❌ Error al guardar banners');
        }
    });

    // --- 8. SEGURIDAD Y RESPALDOS ---
    changePassForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const oldP = passOld.value;
        const newP = passNew.value;

        const res = window.kingDB.changePassword(oldP, newP);
        if (res.success) {
            showToast('✅ Contraseña cambiada con éxito');
            passOld.value = '';
            passNew.value = '';
        } else {
            showToast('❌ ' + res.error);
        }
    });

    exportJsonBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localProductsState, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `theking_menu_backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('📦 Backup descargado correctamente');
    });

    resetDefaultBtn.addEventListener('click', () => {
        if (confirm('⚠️ ¿Estás segura de restaurar la carta original de fábrica? Se perderán las modificaciones no respaldadas.')) {
            localStorage.removeItem(KING_ADMIN_CONFIG.STORAGE_KEY_PRODUCTS);
            localStorage.removeItem(KING_ADMIN_CONFIG.STORAGE_KEY_BANNERS);
            localProductsState = PRODUCTS;
            loadDashboardData();
            showToast('🔄 Menú restaurado al estado original');
        }
    });

    // --- AUXILIARES ---
    function saveAndUpdateState(message) {
        window.kingDB.saveProducts(localProductsState);
        renderProductsList();
        showToast('✅ ' + message);
    }

    function showToast(msg) {
        toastNotify.textContent = msg;
        toastNotify.style.display = 'block';
        setTimeout(() => {
            toastNotify.style.display = 'none';
        }, 3000);
    }
});
