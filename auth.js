// ===== AUTH SYSTEM - MachauSilk =====
// Quản lý đăng nhập/đăng ký và kiểm tra quyền mua hàng
(function () {
    'use strict';

    // ===== DOM ELEMENTS =====
    const authOverlay = document.getElementById('auth-overlay');
    const authModal = document.getElementById('auth-modal');
    const authClose = document.getElementById('auth-close');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    // User dropdown
    const userToggle = document.getElementById('user-toggle');
    const userDropdown = document.getElementById('user-dropdown');
    const dropdownGuest = document.getElementById('dropdown-guest');
    const dropdownLogged = document.getElementById('dropdown-logged');
    const userIcon = document.getElementById('user-icon');
    const userAvatar = document.getElementById('user-avatar');
    const userDisplayName = document.getElementById('user-display-name');
    const userDisplayEmail = document.getElementById('user-display-email');

    // Auth gate
    const authGateOverlay = document.getElementById('auth-gate-overlay');
    const authGate = document.getElementById('auth-gate');
    const gateLogin = document.getElementById('gate-login');
    const gateRegister = document.getElementById('gate-register');
    const gateClose = document.getElementById('gate-close');

    // Buttons
    const btnOpenLogin = document.getElementById('btn-open-login');
    const btnOpenRegister = document.getElementById('btn-open-register');
    const btnLogout = document.getElementById('btn-logout');

    // ===== USER STORAGE =====
    // Lưu danh sách users vào localStorage (demo, production dùng backend API)
    function getUsers() {
        return JSON.parse(localStorage.getItem('machau_users') || '[]');
    }
    function saveUsers(users) {
        localStorage.setItem('machau_users', JSON.stringify(users));
    }
    function getCurrentUser() {
        return JSON.parse(localStorage.getItem('machau_current_user') || 'null');
    }
    function setCurrentUser(user) {
        localStorage.setItem('machau_current_user', JSON.stringify(user));
    }
    function clearCurrentUser() {
        localStorage.removeItem('machau_current_user');
    }

    // ===== CHECK LOGIN STATUS =====
    window.isLoggedIn = function () {
        return getCurrentUser() !== null;
    };

    // ===== OPEN/CLOSE AUTH MODAL =====
    function openAuthModal(tab = 'login') {
        authModal.classList.add('active');
        authOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        switchTab(tab);
    }

    function closeAuthModal() {
        authModal.classList.remove('active');
        authOverlay.classList.remove('active');
        document.body.style.overflow = '';
        loginError.textContent = '';
        registerError.textContent = '';
        loginForm.reset();
        registerForm.reset();
    }

    function switchTab(tab) {
        authTabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
        if (tab === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    }

    // ===== AUTH GATE (yêu cầu đăng nhập khi mua hàng) =====
    window.showAuthGate = function () {
        authGate.classList.add('active');
        authGateOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    function closeAuthGate() {
        authGate.classList.remove('active');
        authGateOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ===== UPDATE UI =====
    function updateUI() {
        const user = getCurrentUser();
        if (user) {
            dropdownGuest.style.display = 'none';
            dropdownLogged.style.display = 'block';
            userDisplayName.textContent = user.full_name;
            userDisplayEmail.textContent = user.email;
            userAvatar.textContent = user.full_name.charAt(0).toUpperCase();
            userIcon.className = 'fas fa-user-check';
            userIcon.style.color = 'var(--gold)';
        } else {
            dropdownGuest.style.display = 'block';
            dropdownLogged.style.display = 'none';
            userIcon.className = 'fas fa-user';
            userIcon.style.color = '';
        }
    }

    // ===== REGISTER =====
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        registerError.textContent = '';

        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;

        // Validate
        if (!name || !email || !phone || !password) {
            registerError.textContent = 'Vui lòng điền đầy đủ thông tin';
            return;
        }
        if (password.length < 6) {
            registerError.textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
            return;
        }
        if (password !== confirm) {
            registerError.textContent = 'Mật khẩu nhập lại không khớp';
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            registerError.textContent = 'Email không hợp lệ';
            return;
        }
        if (!/^[0-9]{9,11}$/.test(phone.replace(/\D/g, ''))) {
            registerError.textContent = 'Số điện thoại không hợp lệ';
            return;
        }

        // Check duplicate
        const users = getUsers();
        if (users.find(u => u.email === email)) {
            registerError.textContent = 'Email này đã được đăng ký';
            return;
        }

        // Save new user
        const newUser = {
            id: Date.now(),
            full_name: name,
            email: email,
            phone: phone,
            password: password, // Demo only, production dùng bcrypt
            role: 'customer',
            created_at: new Date().toISOString()
        };
        users.push(newUser);
        saveUsers(users);

        // Auto login
        const { password: _, ...safeUser } = newUser;
        setCurrentUser(safeUser);
        updateUI();
        closeAuthModal();

        // Show toast
        if (typeof showToast === 'function') {
            showToast('🎉 Tạo tài khoản thành công! Chào mừng ' + name);
        }
    });

    // ===== LOGIN =====
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        loginError.textContent = '';

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            loginError.textContent = 'Vui lòng nhập email và mật khẩu';
            return;
        }

        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            loginError.textContent = 'Email hoặc mật khẩu không đúng';
            return;
        }

        const { password: _, ...safeUser } = user;
        setCurrentUser(safeUser);
        updateUI();
        closeAuthModal();

        if (typeof showToast === 'function') {
            showToast('👋 Chào mừng ' + user.full_name + ' trở lại!');
        }
    });

    // ===== LOGOUT =====
    btnLogout.addEventListener('click', function () {
        clearCurrentUser();
        updateUI();
        userDropdown.classList.remove('active');
        if (typeof showToast === 'function') {
            showToast('Đã đăng xuất thành công');
        }
    });

    // ===== EVENT LISTENERS =====
    // Toggle user dropdown
    userToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });

    // Close dropdown on outside click
    document.addEventListener('click', function (e) {
        if (!document.getElementById('user-account-wrap').contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });

    // Open auth modal from dropdown
    btnOpenLogin.addEventListener('click', () => { userDropdown.classList.remove('active'); openAuthModal('login'); });
    btnOpenRegister.addEventListener('click', () => { userDropdown.classList.remove('active'); openAuthModal('register'); });

    // Auth modal close
    authClose.addEventListener('click', closeAuthModal);
    authOverlay.addEventListener('click', closeAuthModal);

    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Password toggle
    document.querySelectorAll('.pass-toggle').forEach(btn => {
        btn.addEventListener('click', function () {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    // Auth gate buttons
    gateLogin.addEventListener('click', () => { closeAuthGate(); openAuthModal('login'); });
    gateRegister.addEventListener('click', () => { closeAuthGate(); openAuthModal('register'); });
    gateClose.addEventListener('click', closeAuthGate);
    authGateOverlay.addEventListener('click', closeAuthGate);

    // Expose openAuthModal globally
    window.openAuthModal = openAuthModal;

    // Init UI on page load
    updateUI();

})();
