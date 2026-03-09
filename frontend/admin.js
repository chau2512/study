// ============================================================
// ADMIN PANEL — MachauSilk
// ============================================================
(function () {
    'use strict';

    const API_BASE = 'http://localhost:3000/api';
    let token = localStorage.getItem('machau_admin_token');
    let isDemo = false;

    // ===== MOCK DATA =====
    const MOCK = {
        stats: {
            totalRevenue: 12850000, totalOrders: 24, totalProducts: 6,
            totalUsers: 15, pendingOrders: 3, newContacts: 5,
            recentOrders: [
                { order_code: 'MC-20260308-001', full_name: 'Nguyễn Văn A', total_amount: 540000, status: 'pending', created_at: '2026-03-08T01:00:00Z' },
                { order_code: 'MC-20260307-003', full_name: 'Trần Thị B', total_amount: 370000, status: 'confirmed', created_at: '2026-03-07T14:30:00Z' },
                { order_code: 'MC-20260307-002', full_name: 'Lê Minh C', total_amount: 810000, status: 'shipping', created_at: '2026-03-07T10:15:00Z' },
                { order_code: 'MC-20260306-001', full_name: 'Phạm Hồng D', total_amount: 270000, status: 'delivered', created_at: '2026-03-06T08:00:00Z' },
                { order_code: 'MC-20260305-002', full_name: 'Hoàng Lan E', total_amount: 450000, status: 'delivered', created_at: '2026-03-05T16:45:00Z' },
            ]
        },
        products: [
            { id: 1, name: 'Lụa Hoa Văn Cúc Bạch', sku: 'LHCB02', category_name: 'Lụa Tơ Tằm', price: 135000, original_price: 180000, stock_qty: 50, sold_count: 24, is_active: true, badge: 'bestseller' },
            { id: 2, name: 'Lụa Hoa Văn Cúc Cành Nhuộm Xanh Rêu', sku: 'LHCC01', category_name: 'Lụa Tơ Tằm', price: 135000, original_price: null, stock_qty: 35, sold_count: 18, is_active: true, badge: null },
            { id: 3, name: 'Lụa Hoa Văn Cúc Xanh Lục', sku: 'LHC33', category_name: 'Siêu Satin', price: 135000, original_price: 165000, stock_qty: 40, sold_count: 31, is_active: true, badge: 'new' },
            { id: 4, name: 'Lụa Hoa Văn Hỉ Tre', sku: 'LHVHT05', category_name: 'Hàng Độc Nhà Mã', price: 185000, original_price: null, stock_qty: 20, sold_count: 12, is_active: true, badge: 'exclusive' },
            { id: 5, name: 'Lụa Hoa Văn Đuôi Công', sku: 'LHDC05', category_name: 'Siêu Satin', price: 135000, original_price: null, stock_qty: 45, sold_count: 9, is_active: true, badge: null },
            { id: 6, name: 'Lụa Hoa Văn Tròn', sku: 'LHDC04', category_name: 'Hàng Độc Nhà Mã', price: 155000, original_price: 200000, stock_qty: 30, sold_count: 27, is_active: true, badge: 'bestseller' },
        ],
        orders: [
            { id: 1, order_code: 'MC-20260308-001', full_name: 'Nguyễn Văn A', email: 'a@email.com', phone: '0901234567', total_amount: 540000, status: 'pending', payment_method: 'cod', created_at: '2026-03-08T01:00:00Z', item_count: 3 },
            { id: 2, order_code: 'MC-20260307-003', full_name: 'Trần Thị B', email: 'b@email.com', phone: '0912345678', total_amount: 370000, status: 'confirmed', payment_method: 'bank_transfer', created_at: '2026-03-07T14:30:00Z', item_count: 2 },
            { id: 3, order_code: 'MC-20260307-002', full_name: 'Lê Minh C', email: 'c@email.com', phone: '0923456789', total_amount: 810000, status: 'shipping', payment_method: 'momo', created_at: '2026-03-07T10:15:00Z', item_count: 4 },
            { id: 4, order_code: 'MC-20260306-001', full_name: 'Phạm Hồng D', email: 'd@email.com', phone: '0934567890', total_amount: 270000, status: 'delivered', payment_method: 'cod', created_at: '2026-03-06T08:00:00Z', item_count: 2 },
            { id: 5, order_code: 'MC-20260305-002', full_name: 'Hoàng Lan E', email: 'e@email.com', phone: '0945678901', total_amount: 450000, status: 'delivered', payment_method: 'zalopay', created_at: '2026-03-05T16:45:00Z', item_count: 3 },
            { id: 6, order_code: 'MC-20260304-001', full_name: 'Vũ Thu F', email: 'f@email.com', phone: '0956789012', total_amount: 185000, status: 'cancelled', payment_method: 'cod', created_at: '2026-03-04T12:00:00Z', item_count: 1 },
        ],
        users: [
            { id: 1, full_name: 'Admin', email: 'admin@machausilk.com', phone: '0848543171', role: 'admin', is_active: true, order_count: 0, created_at: '2026-01-01T00:00:00Z' },
            { id: 2, full_name: 'Nguyễn Văn A', email: 'a@email.com', phone: '0901234567', role: 'customer', is_active: true, order_count: 3, created_at: '2026-02-15T10:00:00Z' },
            { id: 3, full_name: 'Trần Thị B', email: 'b@email.com', phone: '0912345678', role: 'customer', is_active: true, order_count: 2, created_at: '2026-02-20T08:00:00Z' },
            { id: 4, full_name: 'Lê Minh C', email: 'c@email.com', phone: '0923456789', role: 'customer', is_active: true, order_count: 4, created_at: '2026-03-01T14:00:00Z' },
            { id: 5, full_name: 'Phạm Hồng D', email: 'd@email.com', phone: '0934567890', role: 'customer', is_active: false, order_count: 1, created_at: '2026-03-02T09:00:00Z' },
        ],
        contacts: [
            { id: 1, name: 'Nguyễn Văn A', email: 'a@email.com', phone: '0901234567', subject: 'Tư vấn sản phẩm', message: 'Tôi muốn hỏi về lụa tơ tằm cho áo dài cưới.', status: 'new', created_at: '2026-03-08T00:30:00Z' },
            { id: 2, name: 'Trần Thị B', email: 'b@email.com', phone: '0912345678', subject: 'Đơn hàng', message: 'Đơn hàng MC-20260307-003 khi nào giao?', status: 'new', created_at: '2026-03-07T15:00:00Z' },
            { id: 3, name: 'Lê Minh C', email: 'c@email.com', phone: '0923456789', subject: 'Hợp tác', message: 'Tôi muốn hợp tác phân phối lụa Mã Châu tại Hà Nội.', status: 'read', created_at: '2026-03-06T11:00:00Z' },
            { id: 4, name: 'Phạm Hồng D', email: 'd@email.com', phone: '0934567890', subject: 'Khiếu nại', message: 'Sản phẩm nhận được bị khác màu so với hình.', status: 'replied', created_at: '2026-03-05T08:30:00Z' },
        ]
    };

    // ===== UTILITIES =====
    function formatPrice(n) { return Number(n).toLocaleString('vi-VN') + 'đ'; }
    function formatDate(d) {
        if (!d) return '—';
        const dt = new Date(d);
        return dt.toLocaleDateString('vi-VN') + ' ' + dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    function formatDateShort(d) {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('vi-VN');
    }

    const statusMap = {
        pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipping: 'Đang giao',
        delivered: 'Đã giao', cancelled: 'Đã hủy', refunded: 'Hoàn tiền'
    };
    const paymentMap = { cod: 'COD', bank_transfer: 'Chuyển khoản', momo: 'MoMo', zalopay: 'ZaloPay' };
    const contactStatusMap = { new: 'Mới', read: 'Đã đọc', replied: 'Đã phản hồi' };

    function badge(type, text) { return `<span class="badge badge-${type}">${text}</span>`; }

    function showToast(msg, type = 'success') {
        const c = document.getElementById('admin-toast');
        const t = document.createElement('div');
        t.className = `admin-toast ${type}`;
        t.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i><span>${msg}</span>`;
        c.appendChild(t);
        setTimeout(() => t.remove(), 3500);
    }

    // ===== API HELPER =====
    async function api(endpoint, options = {}) {
        if (isDemo) return null; // Demo mode returns mock data
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Lỗi server');
            return data;
        } catch (err) {
            if (err.message !== 'Failed to fetch') showToast(err.message, 'error');
            return null;
        }
    }

    // ===== DOM =====
    const loginScreen = document.getElementById('admin-login');
    const appScreen = document.getElementById('admin-app');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const demoBtn = document.getElementById('demo-login');

    // ===== LOGIN =====
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;

        const loginBtn = loginForm.querySelector('.login-btn');
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';
        loginBtn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            if (data.user.role !== 'admin') throw new Error('Tài khoản không có quyền admin');

            token = data.token;
            localStorage.setItem('machau_admin_token', token);
            isDemo = false;
            enterApp(data.user);
        } catch (err) {
            loginError.textContent = err.message || 'Không thể kết nối server';
        } finally {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Đăng nhập';
            loginBtn.disabled = false;
        }
    });

    // Demo login
    demoBtn.addEventListener('click', () => {
        isDemo = true;
        enterApp({ full_name: 'Admin Demo', email: 'admin@demo.com', role: 'admin' });
    });

    // Password toggle
    document.querySelector('.login-pass-toggle').addEventListener('click', function () {
        const input = document.getElementById('admin-password');
        const icon = this.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });

    // ===== ENTER APP =====
    function enterApp(user) {
        loginScreen.style.display = 'none';
        appScreen.style.display = 'flex';
        document.getElementById('admin-name').textContent = user.full_name;
        document.getElementById('admin-avatar').textContent = user.full_name.charAt(0).toUpperCase();
        loadDashboard();
        updateClock();
    }

    // Clock
    function updateClock() {
        const el = document.getElementById('topbar-time');
        const now = new Date();
        el.textContent = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) +
            ' — ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        setTimeout(updateClock, 30000);
    }

    // ===== SIDEBAR NAVIGATION =====
    const navItems = document.querySelectorAll('.nav-item');
    const pageTitles = { dashboard: 'Dashboard', products: 'Sản phẩm', orders: 'Đơn hàng', customers: 'Khách hàng', messages: 'Tin nhắn' };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sec = item.dataset.section;
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById('sec-' + sec).classList.add('active');
            document.getElementById('page-title').textContent = pageTitles[sec] || sec;

            // Load data
            if (sec === 'dashboard') loadDashboard();
            else if (sec === 'products') loadProducts();
            else if (sec === 'orders') loadOrders();
            else if (sec === 'customers') loadCustomers();
            else if (sec === 'messages') loadMessages();

            // Close sidebar on mobile
            document.querySelector('.sidebar').classList.remove('open');
        });
    });

    // Sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('open');
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        token = null;
        isDemo = false;
        localStorage.removeItem('machau_admin_token');
        appScreen.style.display = 'none';
        loginScreen.style.display = 'flex';
        loginError.textContent = '';
        loginForm.reset();
    });

    // ===== LOAD DASHBOARD =====
    async function loadDashboard() {
        let data;
        if (isDemo) {
            data = MOCK.stats;
        } else {
            data = await api('/admin/stats');
            if (!data) data = MOCK.stats; // Fallback
        }

        document.getElementById('stat-revenue').textContent = formatPrice(data.totalRevenue);
        document.getElementById('stat-orders').textContent = data.totalOrders;
        document.getElementById('stat-products').textContent = data.totalProducts;
        document.getElementById('stat-users').textContent = data.totalUsers;

        // Pending badges
        if (data.pendingOrders > 0) {
            const b = document.getElementById('pending-badge');
            b.textContent = data.pendingOrders;
            b.style.display = 'flex';
        }
        if (data.newContacts > 0) {
            const b = document.getElementById('msg-badge');
            b.textContent = data.newContacts;
            b.style.display = 'flex';
        }

        // Recent orders table
        const tbody = document.getElementById('recent-orders-body');
        if (data.recentOrders && data.recentOrders.length > 0) {
            tbody.innerHTML = data.recentOrders.map(o => `
                <tr>
                    <td><strong>${o.order_code}</strong></td>
                    <td>${o.full_name || '—'}</td>
                    <td><strong>${formatPrice(o.total_amount)}</strong></td>
                    <td>${badge(o.status, statusMap[o.status] || o.status)}</td>
                    <td>${formatDateShort(o.created_at)}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-row">Chưa có đơn hàng</td></tr>';
        }
    }

    // ===== LOAD PRODUCTS =====
    async function loadProducts() {
        let products;
        if (isDemo) {
            products = MOCK.products;
        } else {
            const data = await api('/admin/products');
            products = data ? data.products : MOCK.products;
        }

        const tbody = document.getElementById('products-body');
        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:10px">
                        <img src="${p.primary_image || 'images/logo.jpg'}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--border)">
                        <strong>${p.name}</strong>
                    </div>
                </td>
                <td><code>${p.sku}</code></td>
                <td>${p.category_name || '—'}</td>
                <td><strong>${formatPrice(p.price)}</strong>${p.original_price ? `<br><s style="color:var(--text-light);font-size:11px">${formatPrice(p.original_price)}</s>` : ''}</td>
                <td>${p.stock_qty}</td>
                <td>${p.sold_count}</td>
                <td>${p.is_active ? badge('active', 'Hoạt động') : badge('inactive', 'Ẩn')}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-sm edit" onclick="editProduct(${p.id})" title="Sửa"><i class="fas fa-pen"></i></button>
                        <button class="btn-sm delete" onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')"
 title="Xóa"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // ===== LOAD ORDERS =====
    async function loadOrders(filterStatus = '') {
        let orders;
        if (isDemo) {
            orders = filterStatus ? MOCK.orders.filter(o => o.status === filterStatus) : MOCK.orders;
        } else {
            const query = filterStatus ? `?status=${filterStatus}` : '';
            const data = await api('/admin/orders' + query);
            orders = data ? data.orders : MOCK.orders;
        }

        const tbody = document.getElementById('orders-body');
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-row">Không có đơn hàng</td></tr>';
            return;
        }
        tbody.innerHTML = orders.map(o => `
            <tr>
                <td><strong>${o.order_code}</strong></td>
                <td>${o.full_name || '—'}</td>
                <td>${o.phone || '—'}</td>
                <td><strong>${formatPrice(o.total_amount)}</strong></td>
                <td>${badge(o.payment_method, paymentMap[o.payment_method] || o.payment_method)}</td>
                <td>
                    <select class="status-select" onchange="updateOrderStatus(${o.id}, this.value)" ${isDemo ? '' : ''}>
                        ${['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].map(s =>
            `<option value="${s}" ${o.status === s ? 'selected' : ''}>${statusMap[s]}</option>`
        ).join('')}
                    </select>
                </td>
                <td>${formatDateShort(o.created_at)}</td>
                <td>
                    <button class="btn-sm view" onclick="viewOrder(${o.id})" title="Chi tiết"><i class="fas fa-eye"></i></button>
                </td>
            </tr>
        `).join('');
    }

    document.getElementById('order-status-filter').addEventListener('change', (e) => {
        loadOrders(e.target.value);
    });

    // ===== LOAD CUSTOMERS =====
    async function loadCustomers() {
        let users;
        if (isDemo) {
            users = MOCK.users;
        } else {
            const data = await api('/admin/users');
            users = data ? data.users : MOCK.users;
        }

        const tbody = document.getElementById('customers-body');
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td><strong>${u.full_name}</strong></td>
                <td>${u.email}</td>
                <td>${u.phone || '—'}</td>
                <td>${u.order_count || 0}</td>
                <td>${badge(u.role, u.role === 'admin' ? 'Admin' : 'Khách hàng')}</td>
                <td>${u.is_active ? badge('active', 'Hoạt động') : badge('inactive', 'Vô hiệu')}</td>
                <td>${formatDateShort(u.created_at)}</td>
            </tr>
        `).join('');
    }

    // ===== LOAD MESSAGES =====
    async function loadMessages(filterStatus = '') {
        let messages;
        if (isDemo) {
            messages = filterStatus ? MOCK.contacts.filter(m => m.status === filterStatus) : MOCK.contacts;
        } else {
            const query = filterStatus ? `?status=${filterStatus}` : '';
            const data = await api('/admin/contacts' + query);
            messages = data ? data.messages : MOCK.contacts;
        }

        const tbody = document.getElementById('messages-body');
        if (messages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-row">Không có tin nhắn</td></tr>';
            return;
        }
        tbody.innerHTML = messages.map(m => `
            <tr>
                <td>${m.id}</td>
                <td><strong>${m.name}</strong></td>
                <td>${m.email || '—'}</td>
                <td>${m.subject}</td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${m.message}">${m.message}</td>
                <td>${badge(m.status, contactStatusMap[m.status] || m.status)}</td>
                <td>${formatDateShort(m.created_at)}</td>
                <td>
                    <div class="action-btns">
                        ${m.status === 'new' ? `<button class="btn-sm mark" onclick="markContact(${m.id}, 'read')" title="Đánh dấu đã đọc"><i class="fas fa-check"></i></button>` : ''}
                        ${m.status !== 'replied' ? `<button class="btn-sm edit" onclick="markContact(${m.id}, 'replied')" title="Đánh dấu đã phản hồi"><i class="fas fa-reply"></i></button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    document.getElementById('msg-status-filter').addEventListener('change', (e) => {
        loadMessages(e.target.value);
    });

    // ===== PRODUCT MODAL =====
    const productModalOverlay = document.getElementById('product-modal-overlay');
    const productForm = document.getElementById('product-form');
    let editingProductId = null;
    let selectedFiles = []; // Store selected image files

    // Image upload elements
    const uploadZone = document.getElementById('image-upload-zone');
    const fileInput = document.getElementById('prod-images');
    const previewGrid = document.getElementById('image-preview-grid');
    const placeholder = document.getElementById('upload-placeholder');

    function clearImagePreviews() {
        selectedFiles = [];
        previewGrid.innerHTML = '';
        placeholder.style.display = '';
        fileInput.value = '';
    }

    function addFilesToPreview(files) {
        for (const file of files) {
            if (selectedFiles.length >= 5) { showToast('Tối đa 5 ảnh', 'error'); break; }
            if (!file.type.startsWith('image/')) continue;
            selectedFiles.push(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                const idx = selectedFiles.indexOf(file);
                const thumb = document.createElement('div');
                thumb.className = `img-thumb${idx === 0 ? ' primary' : ''}`;
                thumb.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-img" data-idx="${idx}" title="Xóa">&times;</button>
                `;
                previewGrid.appendChild(thumb);
                placeholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    }

    // Click to select files
    uploadZone.addEventListener('click', (e) => {
        if (e.target.closest('.remove-img')) return;
        fileInput.click();
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) addFilesToPreview(fileInput.files);
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) addFilesToPreview(e.dataTransfer.files);
    });

    // Remove image
    previewGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-img');
        if (!btn) return;
        const idx = parseInt(btn.dataset.idx);
        selectedFiles.splice(idx, 1);
        // Re-render
        previewGrid.innerHTML = '';
        if (selectedFiles.length === 0) { placeholder.style.display = ''; return; }
        selectedFiles.forEach((f, i) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const thumb = document.createElement('div');
                thumb.className = `img-thumb${i === 0 ? ' primary' : ''}`;
                thumb.innerHTML = `<img src="${ev.target.result}" alt="Preview"><button type="button" class="remove-img" data-idx="${i}" title="Xóa">&times;</button>`;
                previewGrid.appendChild(thumb);
            };
            reader.readAsDataURL(f);
        });
    });

    document.getElementById('btn-add-product').addEventListener('click', () => {
        editingProductId = null;
        document.getElementById('product-modal-title').textContent = 'Thêm sản phẩm';
        productForm.reset();
        clearImagePreviews();
        productModalOverlay.classList.add('active');
    });

    document.getElementById('product-modal-close').addEventListener('click', () => productModalOverlay.classList.remove('active'));
    document.getElementById('product-modal-cancel').addEventListener('click', () => productModalOverlay.classList.remove('active'));
    productModalOverlay.addEventListener('click', (e) => { if (e.target === productModalOverlay) productModalOverlay.classList.remove('active'); });

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            name: document.getElementById('prod-name').value,
            sku: document.getElementById('prod-sku').value,
            category_id: document.getElementById('prod-category').value || null,
            badge: document.getElementById('prod-badge').value || null,
            price: parseInt(document.getElementById('prod-price').value),
            original_price: parseInt(document.getElementById('prod-original-price').value) || null,
            stock_qty: parseInt(document.getElementById('prod-stock').value) || 0,
            material: document.getElementById('prod-material').value || null,
            short_desc: document.getElementById('prod-short-desc').value || null,
            description: document.getElementById('prod-desc').value || null,
        };

        if (isDemo) {
            if (editingProductId) {
                const p = MOCK.products.find(x => x.id === editingProductId);
                if (p) Object.assign(p, body);
                showToast('Đã cập nhật sản phẩm (Demo)');
            } else {
                MOCK.products.push({ id: MOCK.products.length + 7, ...body, sold_count: 0, is_active: true, category_name: body.category_id || '—' });
                showToast('Đã thêm sản phẩm (Demo)');
            }
            productModalOverlay.classList.remove('active');
            loadProducts();
            return;
        }

        let productId = editingProductId;
        if (editingProductId) {
            await api(`/products/${editingProductId}`, { method: 'PUT', body: JSON.stringify(body) });
            showToast('Đã cập nhật sản phẩm');
        } else {
            const result = await api('/products', { method: 'POST', body: JSON.stringify(body) });
            if (result && result.id) productId = result.id;
            showToast('Đã thêm sản phẩm');
        }

        // Upload images if any selected
        if (selectedFiles.length > 0 && productId && !isDemo) {
            const formData = new FormData();
            selectedFiles.forEach(f => formData.append('images', f));
            try {
                const res = await fetch(`${API_BASE}/products/${productId}/images`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const data = await res.json();
                if (res.ok) showToast(`Đã upload ${data.images.length} ảnh`);
            } catch (err) { /* ignore upload errors */ }
        }

        clearImagePreviews();
        productModalOverlay.classList.remove('active');
        loadProducts();
    });

    // ===== GLOBAL ACTIONS =====
    window.editProduct = function (id) {
        editingProductId = id;
        const p = isDemo ? MOCK.products.find(x => x.id === id) : null;
        if (p) {
            document.getElementById('product-modal-title').textContent = 'Sửa sản phẩm';
            document.getElementById('prod-name').value = p.name || '';
            document.getElementById('prod-sku').value = p.sku || '';
            document.getElementById('prod-badge').value = p.badge || '';
            document.getElementById('prod-price').value = p.price || '';
            document.getElementById('prod-original-price').value = p.original_price || '';
            document.getElementById('prod-stock').value = p.stock_qty || 0;
            document.getElementById('prod-material').value = p.material || '';
            document.getElementById('prod-short-desc').value = p.short_desc || '';
            document.getElementById('prod-desc').value = p.description || '';
            productModalOverlay.classList.add('active');
        }
    };

    window.deleteProduct = async function (id, name) {
        if (!confirm(`Bạn có chắc muốn xóa "${name}"?`)) return;
        if (isDemo) {
            const idx = MOCK.products.findIndex(x => x.id === id);
            if (idx >= 0) MOCK.products.splice(idx, 1);
            showToast(`Đã xóa "${name}" (Demo)`);
            loadProducts();
            return;
        }
        await api(`/products/${id}`, { method: 'DELETE' });
        showToast(`Đã xóa "${name}"`);
        loadProducts();
    };

    window.updateOrderStatus = async function (id, status) {
        if (isDemo) {
            const o = MOCK.orders.find(x => x.id === id);
            if (o) o.status = status;
            showToast(`Đã cập nhật trạng thái → ${statusMap[status]} (Demo)`);
            return;
        }
        await api(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
        showToast(`Đã cập nhật trạng thái → ${statusMap[status]}`);
    };

    window.viewOrder = async function (id) {
        const overlay = document.getElementById('order-modal-overlay');
        const body = document.getElementById('order-detail-body');
        body.innerHTML = '<p style="text-align:center;color:var(--text-light)">Đang tải...</p>';
        overlay.classList.add('active');

        let o = isDemo ? MOCK.orders.find(x => x.id === id) : null;
        if (!isDemo) {
            const data = await api(`/admin/orders/${id}`);
            if (data) o = data;
        }
        if (!o) return;

        document.getElementById('order-modal-title').textContent = 'Đơn hàng ' + (o.order_code || '#' + id);

        // Fetch order items
        let itemsHtml = '';
        if (o.items && o.items.length > 0) {
            itemsHtml = `<h4 style="margin:16px 0 8px">Sản phẩm trong đơn</h4>
            <table style="width:100%;font-size:13px">
                <thead><tr><th>Tên</th><th>SKU</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                <tbody>${o.items.map(i => `<tr>
                    <td>${i.product_name}</td><td><code>${i.product_sku}</code></td>
                    <td>${i.quantity}</td><td>${formatPrice(i.unit_price)}</td>
                    <td><strong>${formatPrice(i.total_price)}</strong></td>
                </tr>`).join('')}</tbody>
            </table>`;
        }

        body.innerHTML = `
            <div class="order-detail-grid">
                <div class="detail-item"><label>Khách hàng</label><span>${o.full_name || '—'}</span></div>
                <div class="detail-item"><label>Email</label><span>${o.email || '—'}</span></div>
                <div class="detail-item"><label>SĐT</label><span>${o.phone || '—'}</span></div>
                <div class="detail-item"><label>Thanh toán</label><span>${paymentMap[o.payment_method] || o.payment_method}</span></div>
                <div class="detail-item"><label>Trạng thái</label>${badge(o.status, statusMap[o.status])}</div>
                <div class="detail-item"><label>Tổng tiền</label><span style="font-size:18px;font-weight:700;color:var(--gold)">${formatPrice(o.total_amount)}</span></div>
                <div class="detail-item"><label>Ngày đặt</label><span>${formatDate(o.created_at)}</span></div>
            </div>
            ${itemsHtml}
        `;
    };

    document.getElementById('order-modal-close').addEventListener('click', () => {
        document.getElementById('order-modal-overlay').classList.remove('active');
    });
    document.getElementById('order-modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'order-modal-overlay') e.target.classList.remove('active');
    });

    window.markContact = async function (id, status) {
        if (isDemo) {
            const m = MOCK.contacts.find(x => x.id === id);
            if (m) m.status = status;
            showToast(`Đã cập nhật: ${contactStatusMap[status]} (Demo)`);
            loadMessages(document.getElementById('msg-status-filter').value);
            return;
        }
        await api(`/admin/contacts/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
        showToast(`Đã cập nhật: ${contactStatusMap[status]}`);
        loadMessages(document.getElementById('msg-status-filter').value);
    };

    // ===== AUTO LOGIN CHECK =====
    if (token && !isDemo) {
        // Try to verify token
        fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(user => {
            if (user && user.role === 'admin') enterApp(user);
        }).catch(() => { /* remain on login */ });
    }

    // ===== KEYBOARD SHORTCUTS =====
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            productModalOverlay.classList.remove('active');
            document.getElementById('order-modal-overlay').classList.remove('active');
        }
    });

})();
