/**
 * 👑 THE KING BURGER - LÓGICA DEL PANEL ADMINISTRATIVO DE SECRETARÍA
 * Manejo de UI, Auth, CRUD de Productos, Modificación de Banners y Sync en tiempo real
 */

document.addEventListener('DOMContentLoaded', () => {
    try {
        localStorage.removeItem('king_admin_password_hash');
        sessionStorage.removeItem('king_admin_session');
    } catch (error) {
        console.error('[Admin] No se pudieron limpiar credenciales locales antiguas:', error);
    }

    // --- ELEMENTOS DEL DOM ---
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginUserInput = document.getElementById('login-user');
    const loginPasswordInput = document.getElementById('login-password');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const forgotPasswordBtn = document.getElementById('forgot-password-btn');
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
    let localProductsState = typeof PRODUCTS !== 'undefined' ? PRODUCTS : {};

    // --- 1. AUTENTICACIÓN Y AUTORIZACIÓN ---
    let loadedDashboardUserId = null;

    function showLogin() {
        loginSection.style.display = 'flex';
        dashboardSection.style.display = 'none';
        headerUserActions.style.display = 'none';
    }

    function showLoginMessage(message, type = 'error') {
        loginError.textContent = message;
        loginError.style.color = type === 'success' ? '#2ecc71' : type === 'info' ? '#a0aabf' : '#ef233c';
        loginError.style.display = 'block';
    }

    function getAuthErrorMessage(error) {
        switch (error.code) {
            case 'auth/invalid-email':
                return 'Ingresá un correo electrónico válido.';
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return 'Correo o contraseña incorrectos.';
            case 'auth/too-many-requests':
                return 'Hubo demasiados intentos. Esperá un momento y volvé a probar.';
            case 'auth/network-request-failed':
                return 'No hay conexión. Revisá internet e intentá de nuevo.';
            case 'auth/unauthorized-domain':
                return 'Este dominio aún no está autorizado en Firebase Authentication.';
            case 'auth/popup-blocked':
                return 'El navegador bloqueó la ventana de Google. Permití ventanas emergentes e intentá de nuevo.';
            case 'auth/weak-password':
                return 'La nueva contraseña no cumple los requisitos de seguridad.';
            default:
                return 'No se pudo completar la operación. Revisá la conexión e intentá de nuevo.';
        }
    }

    function handleAuthState(user) {
        if (!user) {
            loadedDashboardUserId = null;
            showLogin();
            return;
        }

        loginSection.style.display = 'flex';
        dashboardSection.style.display = 'none';
        headerUserActions.style.display = 'none';
        showLoginMessage('Verificando los permisos de esta cuenta...', 'info');

        window.kingDB.isAuthenticated(user).then(async (authorizedUser) => {
            if (!authorizedUser) {
                await window.kingDB.logout();
                showLoginMessage('Esta cuenta no está habilitada para administrar The King Burger.');
                return;
            }

            loginError.style.display = 'none';
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            headerUserActions.style.display = 'flex';

            if (loadedDashboardUserId !== user.uid) {
                loadedDashboardUserId = user.uid;
                try {
                    await loadDashboardData();
                } catch (error) {
                    console.error('[Admin] No se pudieron cargar los datos del panel:', error);
                    showToast('No se pudieron cargar todos los datos. Revisá la conexión.');
                }
            }
        }).catch((error) => {
            console.error('[Admin] No se pudo verificar la autorización:', error);
            showLogin();
            showLoginMessage('No se pudo verificar el acceso. Revisá la conexión e intentá de nuevo.');
        });
    }

    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(handleAuthState);
    } else {
        showLogin();
        showLoginMessage('Firebase Authentication no está disponible.');
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        try {
            await window.kingDB.login(loginUserInput.value, loginPasswordInput.value);
            loginError.style.display = 'none';
        } catch (error) {
            console.error('[Admin] Error de inicio de sesión:', error);
            showLoginMessage(getAuthErrorMessage(error));
        } finally {
            submitButton.disabled = false;
        }
    });

    googleLoginBtn.addEventListener('click', async () => {
        googleLoginBtn.disabled = true;
        try {
            await window.kingDB.loginWithGoogle();
            loginError.style.display = 'none';
        } catch (error) {
            console.error('[Admin] Error de inicio con Google:', error);
            showLoginMessage(getAuthErrorMessage(error));
        } finally {
            googleLoginBtn.disabled = false;
        }
    });

    forgotPasswordBtn.addEventListener('click', async () => {
        if (!loginUserInput.value.trim() || !loginUserInput.checkValidity()) {
            loginUserInput.reportValidity();
            return;
        }

        forgotPasswordBtn.disabled = true;
        try {
            await window.kingDB.sendPasswordResetEmail(loginUserInput.value);
            showLoginMessage(
                'Si existe una cuenta para ese correo, recibirás instrucciones para restablecer la contraseña.',
                'success'
            );
        } catch (error) {
            console.error('[Admin] Error al solicitar recuperación de contraseña:', error);
            if (['auth/user-not-found', 'auth/invalid-email'].includes(error.code)) {
                showLoginMessage(
                    'Si existe una cuenta para ese correo, recibirás instrucciones para restablecer la contraseña.',
                    'success'
                );
            } else {
                showLoginMessage(getAuthErrorMessage(error));
            }
        } finally {
            forgotPasswordBtn.disabled = false;
        }
    });

    logoutBtn.addEventListener('click', async () => {
        try {
            await window.kingDB.logout();
            showToast('Sesión cerrada correctamente');
        } catch (error) {
            console.error('[Admin] No se pudo cerrar la sesión:', error);
            showToast('No se pudo cerrar la sesión. Intentá de nuevo.');
        }
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
    async function loadDashboardData() {
        // VELOCIDAD: Mostrar productos locales INMEDIATAMENTE (sin esperar Firebase)
        localProductsState = typeof PRODUCTS !== 'undefined' ? JSON.parse(JSON.stringify(PRODUCTS)) : {};
        renderProductsList();

        // Luego, en segundo plano, sobreescribir con los datos de Firebase
        try {
            const products = await window.kingDB.getProductsAsync();
            if (products && Object.keys(products).length > 0) {
                localProductsState = products;
                renderProductsList(); // Actualizar silenciosamente
            }
        } catch(e) {
            console.warn('[Centinela] Firebase no respondió, usando datos locales.');
        }

        await loadBannersData();
        setupSorteoTab();
        initDashboardAI();
    }

    function initDashboardAI() {
        if (!window.kingDB) return;

        let ordersChartInstance = null;

        // 1. Escuchar Intentos de Pedido (Últimos 7 días)
        window.kingDB.listenStats7Days((stats) => {
            const todayStr = new Date().toISOString().split('T')[0];
            const todayStat = stats.find(s => s.date === todayStr);
            
            const ordersToday = todayStat ? todayStat.totalOrders : 0;
            document.getElementById('stats-orders-today').textContent = ordersToday;

            // Semilla IA: Lógica simple de sugerencias
            const aiSugg = document.getElementById('ai-suggestion');
            if (ordersToday === 0) {
                aiSugg.innerHTML = 'El tráfico está bajo. Sugiero activar una promoción en Instagram para atraer clientes.';
            } else if (ordersToday > 5) {
                aiSugg.innerHTML = '¡Excelente ritmo! Muchos clientes armando pedidos hoy. Asegúrate de que haya stock de papas.';
            } else {
                aiSugg.innerHTML = 'Ritmo estable. Ideal para preparar cajas y organizar la cocina.';
            }

            // Renderizar Gráfico
            const ctx = document.getElementById('ordersChart').getContext('2d');
            const labels = stats.map(s => s.date.slice(5)); // MM-DD
            const data = stats.map(s => s.totalOrders);

            if (ordersChartInstance) ordersChartInstance.destroy();
            ordersChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Pedidos',
                        data: data,
                        borderColor: '#ffb703',
                        backgroundColor: 'rgba(255, 183, 3, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { display: false, beginAtZero: true },
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0aabf' } }
                    }
                }
            });
        });

        // 2. Escuchar Valoraciones (Coronas)
        window.kingDB.listenRatings((ratings) => {
            const topProductEl = document.getElementById('stats-top-product');
            if (ratings.length === 0) {
                topProductEl.textContent = 'Aún sin votos';
                return;
            }

            // Ordenar por promedio más alto (mínimo 1 voto)
            const sorted = ratings.sort((a, b) => b.average - a.average);
            const best = sorted[0];
            
            if (best) {
                const productName = document.createElement('span');
                productName.textContent = best.productName || 'Producto sin nombre';

                const ratingSummary = document.createElement('span');
                ratingSummary.style.cssText = 'font-size:0.8rem; color:var(--text-muted);';
                const starIcon = document.createElement('i');
                starIcon.className = 'ri-star-fill';
                starIcon.style.color = 'var(--accent-color)';
                ratingSummary.append(
                    starIcon,
                    document.createTextNode(` ${Number(best.average).toFixed(1)}/5 (${Number(best.totalVotes) || 0} votos)`)
                );

                topProductEl.replaceChildren(productName, document.createElement('br'), ratingSummary);
            }
        });

        // Iniciar Centinela
        initCentinela();
    }

    // --- CENTINELA DE INTEGRIDAD WEB ---
    function initCentinela() {
        const logEl = document.getElementById('centinela-log');
        const statusEl = document.getElementById('centinela-status');
        const scanBtn = document.getElementById('centinela-scan-btn');
        const repairBtn = document.getElementById('centinela-repair-btn');
        if (!logEl) return;

        const SITE_URL = 'https://theking.sbs';
        let centinelaInterval = null;
        let lastStatus = 'ok';
        let issueLog = [];

        function centLog(msg, type = 'info') {
            const colors = { ok: '#2ecc71', warn: '#ffb703', error: '#ef233c', info: '#a0aabf', action: '#9b59b6' };
            const tags = { ok: 'OK', warn: 'AVISO', error: 'ERROR', info: 'INFO', action: 'ACCIÓN' };
            const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const line = document.createElement('div');
            const label = document.createElement('span');
            label.style.color = colors[type] || colors.info;
            label.textContent = `[${tags[type] || tags.info} ${time}]`;
            line.append(label, document.createTextNode(` ${String(msg)}`));
            logEl.appendChild(line);
            logEl.scrollTop = logEl.scrollHeight;
        }

        async function runScan() {
            centLog('Iniciando escaneo de integridad...', 'info');
            issueLog = [];

            // 1. Verificar conectividad con la web pública
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                const resp = await fetch(SITE_URL, { signal: controller.signal, mode: 'no-cors' });
                clearTimeout(timeout);
                centLog('Web pública theking.sbs: ACCESIBLE ✓', 'ok');
            } catch (e) {
                issueLog.push('Web pública no responde');
                centLog('⚠️ Web pública theking.sbs no responde. Verificar CDN o hosting.', 'error');
            }

            // 2. Verificar Firebase
            try {
                const snap = await window.kingDB.db.collection('config').doc('banners').get();
                if (snap.exists) {
                    centLog('Firebase Firestore: CONECTADO ✓', 'ok');
                } else {
                    issueLog.push('Documento banners no existe');
                    centLog('⚠️ Documento de configuración vacío en Firebase.', 'warn');
                }
            } catch (e) {
                issueLog.push('Firebase error');
                centLog('⚠️ Error de conexión con Firebase: ' + e.message, 'error');
            }

            // 3. Verificar integridad de productos locales
            const localProds = typeof PRODUCTS !== 'undefined' ? PRODUCTS : {};
            const totalLocal = Object.values(localProds).flat().length;
            if (totalLocal === 0) {
                issueLog.push('Productos locales vacíos');
                centLog('⚠️ No se encontraron productos locales en products.js', 'error');
            } else {
                centLog(`Productos locales: ${totalLocal} ítems detectados ✓`, 'ok');
            }

            // 4. Verificar productos en Firebase
            try {
                const prods = await window.kingDB.getProductsAsync();
                const total = Object.values(prods || {}).flat().length;
                if (total > 0) {
                    centLog(`Productos en Firebase: ${total} ítems sincronizados ✓`, 'ok');
                } else {
                    issueLog.push('Firebase products vacíos');
                    centLog('⚠️ Firebase sin productos. Se usarán los datos locales como respaldo.', 'warn');
                }
            } catch(e) {
                centLog('Firebase productos: Error al leer. Usando locales como respaldo.', 'warn');
            }

            // Resultado final
            if (issueLog.length === 0) {
                centLog('✅ ESCANEO COMPLETO: Todo en orden. Sin anomalías detectadas.', 'ok');
                setStatus('ok');
            } else {
                centLog(`⚡ Se detectaron ${issueLog.length} anomalía(s). Usa "Auto-Reparar" para intentar corrección.`, 'warn');
                setStatus('warn');
            }
        }

        async function runRepair() {
            centLog('Iniciando secuencia de auto-reparación...', 'action');

            // Reparación 1: Si Firebase de productos está vacío, subir los locales
            try {
                const prods = await window.kingDB.getProductsAsync();
                const total = Object.values(prods || {}).flat().length;
                if (total === 0 && typeof PRODUCTS !== 'undefined') {
                    await window.kingDB.saveProducts(PRODUCTS);
                    centLog('🔧 Auto-reparación: Productos locales subidos a Firebase ✓', 'action');
                } else {
                    centLog('Auto-reparación: Productos Firebase OK, sin acción necesaria.', 'ok');
                }
            } catch(e) {
                centLog('Auto-reparación: No se pudo reparar productos — ' + e.message, 'error');
            }

            // Reparación 2: Forzar re-carga de datos del admin
            await loadDashboardData();
            centLog('🔧 Auto-reparación: Dashboard recargado forzosamente ✓', 'action');

            centLog('✅ Secuencia de reparación finalizada.', 'ok');
            setStatus('ok');
        }

        function setStatus(type) {
            lastStatus = type;
            const config = {
                ok: { color: '#2ecc71', text: 'Vigilando' },
                warn: { color: '#ffb703', text: 'Anomalía' },
                error: { color: '#ef233c', text: 'Alerta' }
            };
            const c = config[type] || config.ok;
            statusEl.style.color = c.color;
            statusEl.style.borderColor = c.color.replace(')', ',0.3)').replace('rgb', 'rgba');
            statusEl.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:${c.color};display:inline-block;box-shadow:0 0 6px ${c.color};"></span> ${c.text}`;
        }

        // Escaneo automático cada 10 minutos
        setTimeout(() => runScan(), 3000); // Primera vez a los 3s de iniciar
        centinelaInterval = setInterval(() => runScan(), 10 * 60 * 1000);

        if (scanBtn) scanBtn.addEventListener('click', () => runScan());
        if (repairBtn) repairBtn.addEventListener('click', () => runRepair());
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

                // Soporte para productos con precio fijo (price) O por tamaño (sizes.doble/triple)
                let priceDisplay = '';
                if (product.price) {
                    priceDisplay = `$${product.price.toLocaleString('es-AR')}`;
                } else if (product.sizes) {
                    const parts = Object.entries(product.sizes).map(([k, v]) => `${k.charAt(0).toUpperCase()+k.slice(1)}: $${v.toLocaleString('es-AR')}`);
                    priceDisplay = parts.join(' / ');
                } else {
                    priceDisplay = 'Sin precio';
                }

                const image = document.createElement('img');
                image.src = sanitizeImgSrc(product.img);
                image.alt = String(product.name || '');
                image.className = 'admin-prod-img';
                image.addEventListener('error', () => {
                    image.src = 'img/pan-353---.jpg';
                }, { once: true });

                const info = document.createElement('div');
                info.className = 'admin-prod-info';
                const heading = document.createElement('div');
                heading.style.cssText = 'display:flex; align-items:center; gap:0.5rem;';
                const title = document.createElement('span');
                title.className = 'admin-prod-title';
                title.textContent = String(product.name || '');
                const category = document.createElement('span');
                category.style.cssText = 'font-size:0.75rem; background:rgba(255,255,255,0.1); padding:0.1rem 0.5rem; border-radius:6px; text-transform:uppercase;';
                category.textContent = catKey;
                heading.append(title, category);

                const description = document.createElement('p');
                description.className = 'admin-prod-desc';
                description.textContent = String(product.desc || '');
                const price = document.createElement('div');
                price.className = 'admin-prod-price';
                price.textContent = priceDisplay;
                info.append(heading, description, price);

                const actions = document.createElement('div');
                actions.style.cssText = 'display:flex; align-items:center; gap:0.8rem;';
                const stockButton = document.createElement('button');
                stockButton.type = 'button';
                stockButton.className = `stock-toggle-btn ${isAvailable ? 'available' : 'out-of-stock'}`;
                stockButton.dataset.cat = catKey;
                stockButton.dataset.index = index;
                const stockIcon = document.createElement('i');
                stockIcon.className = isAvailable ? 'ri-checkbox-circle-fill' : 'ri-close-circle-fill';
                stockButton.append(stockIcon, document.createTextNode(isAvailable ? 'Disponible' : 'AGOTADO'));

                const editButton = document.createElement('button');
                editButton.type = 'button';
                editButton.className = 'btn-action-icon edit-prod-btn';
                editButton.dataset.cat = catKey;
                editButton.dataset.index = index;
                editButton.title = 'Editar';
                const editIcon = document.createElement('i');
                editIcon.className = 'ri-pencil-fill';
                editButton.append(editIcon);

                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'btn-action-icon delete-prod-btn';
                deleteButton.dataset.cat = catKey;
                deleteButton.dataset.index = index;
                deleteButton.title = 'Eliminar';
                deleteButton.style.color = '#ef233c';
                const deleteIcon = document.createElement('i');
                deleteIcon.className = 'ri-delete-bin-line';
                deleteButton.append(deleteIcon);

                actions.append(stockButton, editButton, deleteButton);
                card.append(image, info, actions);
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
    async function loadBannersData() {
        const banners = await window.kingDB.getBannersAsync();
        bannerHeroTitle.value = banners.heroTitle;
        bannerHeroSubtitle.value = banners.heroSubtitle;
        bannerHeroSub.value = banners.heroSub;
        bannerPhone.value = banners.phone;
        bannerPhoneWa.value = banners.phoneWhatsApp;
        bannerInstagram.value = banners.instagram;
        bannerPromoActive.checked = banners.promoBarActive;
        bannerPromoText.value = banners.promoBarText;
    }

    bannersForm.addEventListener('submit', async (e) => {
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

        bannerData.phoneWhatsApp = bannerData.phoneWhatsApp.replace(/\D/g, '');
        if (!/^\d{8,15}$/.test(bannerData.phoneWhatsApp)) {
            showToast('Ingresá un número de WhatsApp válido, con código de país.');
            return;
        }

        const res = await window.kingDB.saveBannersAsync(bannerData);
        if (res.success) {
            showToast('✅ Banners actualizados en theking.sbs');
        } else {
            showToast('❌ Error al guardar banners');
        }
    });

    // --- 8. SEGURIDAD Y RESPALDOS ---
    changePassForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const oldP = passOld.value;
        const newP = passNew.value;

        try {
            await window.kingDB.changePassword(oldP, newP);
            showToast('✅ Contraseña cambiada con éxito');
            passOld.value = '';
            passNew.value = '';
        } catch (error) {
            console.error('[Admin] No se pudo cambiar la contraseña:', error);
            const message = ['auth/invalid-credential', 'auth/wrong-password'].includes(error.code)
                ? 'La contraseña actual no es correcta.'
                : getAuthErrorMessage(error);
            showToast('❌ ' + message);
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
    
    // Sanitiza el src de imagen: si es SVG/base64 o contiene comillas devuelve el fallback seguro
    function sanitizeImgSrc(imgValue) {
        if (!imgValue) return 'img/pan-353---.jpg';
        const s = String(imgValue).trim();
        if (s.includes('"') || s.includes("'") || s.length > 300) {
            return 'img/pan-353---.jpg';
        }

        try {
            const imageUrl = new URL(s, window.location.origin);
            return imageUrl.origin === window.location.origin || imageUrl.protocol === 'https:'
                ? s
                : 'img/pan-353---.jpg';
        } catch (error) {
            return 'img/pan-353---.jpg';
        }
    }

    async function saveAndUpdateState(message) {
        const result = await window.kingDB.saveProductsAsync(localProductsState);
        renderProductsList();
        if (result && result.success === false) {
            showToast('\u274c Firebase: ' + (result.error || 'Error al guardar. Verificá la conexión.'));
            console.error('[Admin] Firebase write failed:', result.error);
        } else {
            showToast('\u2705 ' + message);
        }
    }

    function showToast(msg) {
        toastNotify.textContent = msg;
        toastNotify.style.display = 'block';
        setTimeout(() => {
            toastNotify.style.display = 'none';
        }, 3000);
    }

    // --- LOGICA DE SORTEO ---
    function setupSorteoTab() {
        const activeSorteo = document.getElementById('sorteo-active');
        const premioSorteo = document.getElementById('sorteo-premio');
        const btnSaveConfig = document.getElementById('save-sorteo-config-btn');
        const btnSorteo = document.getElementById('realizar-sorteo-btn');
        const btnReset = document.getElementById('reset-sorteo-btn');
        const listParticipantes = document.getElementById('sorteo-participantes-list');
        const badgeWinner = document.getElementById('sorteo-winner-badge');
        const countSorteo = document.getElementById('sorteo-count');

        let currentParticipants = [];
        let sorteoConfig = {};

        // Cargar config inicial
        window.kingDB.getSorteoConfig().then(config => {
            sorteoConfig = config;
            activeSorteo.checked = config.active || false;
            premioSorteo.value = config.premio || '';
            if (config.ganador) {
                badgeWinner.style.display = 'block';
                badgeWinner.textContent = `🏆 Ganador: ${config.ganador.nombre}`;
            } else {
                badgeWinner.style.display = 'none';
            }
        });

        // Escuchar participantes en tiempo real
        window.kingDB.listenSorteoParticipantes((participantes) => {
            currentParticipants = participantes;
            countSorteo.textContent = participantes.length;
            listParticipantes.innerHTML = '';
            
            if (participantes.length === 0) {
                listParticipantes.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay participantes aún.</div>';
            } else {
                participantes.forEach(p => {
                    const el = document.createElement('div');
                    el.style = "padding: 1rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;";
                    const name = document.createElement('strong');
                    name.style.color = '#fff';
                    name.textContent = String(p.nombre || 'Sin nombre');

                    const phone = document.createElement('span');
                    phone.style.cssText = 'color:var(--text-muted); font-size:0.9rem;';
                    const phoneIcon = document.createElement('i');
                    phoneIcon.className = 'ri-whatsapp-line';
                    phone.append(phoneIcon, document.createTextNode(` ${String(p.telefono || '')}`));

                    el.append(name, phone);
                    listParticipantes.appendChild(el);
                });
            }
        });

        btnSaveConfig.addEventListener('click', async () => {
            const result = await window.kingDB.saveSorteoConfig({
                active: activeSorteo.checked,
                premio: premioSorteo.value
            });
            if (!result.success) {
                console.error('[Admin] No se pudo guardar la configuración del sorteo:', result.error);
                showToast('No se pudo guardar la configuración del sorteo.');
                return;
            }
            showToast('Configuración del sorteo guardada');
        });

        btnSorteo.addEventListener('click', async () => {
            if (currentParticipants.length === 0) {
                alert('No hay participantes para sortear.');
                return;
            }
            if (confirm('¿Estás seguro de elegir un ganador al azar ahora mismo?')) {
                const winnerIndex = Math.floor(Math.random() * currentParticipants.length);
                const winner = currentParticipants[winnerIndex];
                
                const result = await window.kingDB.saveSorteoConfig({
                    ganador: { nombre: String(winner.nombre || 'Sin nombre') },
                    active: true,
                    premio: premioSorteo.value
                });
                if (!result.success) {
                    console.error('[Admin] No se pudo guardar el ganador:', result.error);
                    showToast('No se pudo guardar el ganador.');
                    return;
                }

                badgeWinner.style.display = 'block';
                badgeWinner.textContent = `🏆 Ganador: ${winner.nombre}`;
                
                // Mostrar animación local (efecto de sorteo)
                showToast(`🎉 ¡Ganador elegido: ${winner.nombre}!`);
            }
        });

        btnReset.addEventListener('click', async () => {
            if (confirm('⚠️ Esto ELIMINARÁ todos los participantes actuales para iniciar un nuevo sorteo. ¿Proceder?')) {
                const result = await window.kingDB.clearSorteoParticipantes();
                if (!result.success) {
                    console.error('[Admin] No se pudieron limpiar los participantes:', result.error);
                    showToast('No se pudieron limpiar los participantes.');
                    return;
                }
                badgeWinner.style.display = 'none';
                showToast('Participantes eliminados. Nuevo sorteo listo.');
            }
        });
    }
});
