// ===== AUTH SYSTEM - MachauSilk =====
// Quản lý đăng nhập/đăng ký + OTP email verification
(function () {
    'use strict';

    const OTP_SERVER = 'http://localhost:3001';

    // ===== DOM ELEMENTS =====
    const authOverlay = document.getElementById('auth-overlay');
    const authModal = document.getElementById('auth-modal');
    const authClose = document.getElementById('auth-close');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    // OTP elements
    const otpStep = document.getElementById('otp-step');
    const otpDigits = document.querySelectorAll('.otp-digit');
    const otpEmailDisplay = document.getElementById('otp-email-display');
    const otpCountdown = document.getElementById('otp-countdown');
    const otpVerifyBtn = document.getElementById('otp-verify-btn');
    const otpResendBtn = document.getElementById('otp-resend-btn');
    const otpError = document.getElementById('otp-error');

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

    // ===== STATE =====
    let pendingUser = null; // Lưu thông tin user đang chờ OTP
    let otpTimer = null;

    // ===== USER STORAGE =====
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
        otpError.textContent = '';
        loginForm.reset();
        registerForm.reset();
        hideOtpStep();
        pendingUser = null;
        if (otpTimer) { clearInterval(otpTimer); otpTimer = null; }
    }

    function switchTab(tab) {
        authTabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
        hideOtpStep();
        if (tab === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    }

    // ===== OTP STEP =====
    function showOtpStep(email) {
        registerForm.style.display = 'none';
        loginForm.style.display = 'none';
        otpStep.style.display = 'block';
        otpEmailDisplay.textContent = email;
        // Hide tabs during OTP
        document.querySelector('.auth-tabs').style.display = 'none';
        // Clear OTP inputs
        otpDigits.forEach(d => { d.value = ''; });
        otpDigits[0].focus();
        otpError.textContent = '';
        startCountdown();
    }

    function hideOtpStep() {
        otpStep.style.display = 'none';
        document.querySelector('.auth-tabs').style.display = 'flex';
        if (otpTimer) { clearInterval(otpTimer); otpTimer = null; }
    }

    function startCountdown() {
        let seconds = 300; // 5 minutes
        if (otpTimer) clearInterval(otpTimer);
        otpResendBtn.disabled = true;
        otpResendBtn.style.opacity = '0.5';

        // Enable resend after 30s
        setTimeout(() => {
            otpResendBtn.disabled = false;
            otpResendBtn.style.opacity = '1';
        }, 30000);

        otpTimer = setInterval(() => {
            seconds--;
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            otpCountdown.textContent = `${m}:${s}`;
            if (seconds <= 60) otpCountdown.style.color = '#dc3545';
            if (seconds <= 0) {
                clearInterval(otpTimer);
                otpCountdown.textContent = 'Hết hạn!';
                otpError.textContent = 'Mã OTP đã hết hạn. Vui lòng gửi lại.';
            }
        }, 1000);
    }

    // OTP digit inputs — auto-focus next, handle paste
    otpDigits.forEach((input, idx) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value.replace(/\D/g, '');
            e.target.value = val;
            if (val && idx < 5) otpDigits[idx + 1].focus();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && idx > 0) {
                otpDigits[idx - 1].focus();
            }
        });
        // Handle paste
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
            paste.split('').forEach((ch, i) => {
                if (otpDigits[i]) otpDigits[i].value = ch;
            });
            if (paste.length > 0) otpDigits[Math.min(paste.length, 5)].focus();
        });
    });

    // ===== SEND OTP =====
    async function sendOtp(email, name) {
        try {
            const res = await fetch(`${OTP_SERVER}/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Lỗi gửi OTP');
            return { success: true, message: data.message };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    // ===== VERIFY OTP =====
    async function verifyOtp(email, otp) {
        try {
            const res = await fetch(`${OTP_SERVER}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Mã OTP không đúng');
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    // ===== AUTH GATE =====
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

    // ===== REGISTER (Step 1: Validate → Send OTP) =====
    registerForm.addEventListener('submit', async function (e) {
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

        // Store pending user data
        pendingUser = { name, email, phone, password };

        // Send OTP
        const submitBtn = registerForm.querySelector('.auth-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi mã OTP...';

        const result = await sendOtp(email, name);

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Tạo tài khoản';

        if (result.success) {
            showOtpStep(email);
            if (typeof showToast === 'function') {
                showToast('📧 Mã OTP đã gửi tới ' + email);
            }
        } else {
            registerError.textContent = result.message;
        }
    });

    // ===== VERIFY OTP (Step 2: Verify → Create Account) =====
    otpVerifyBtn.addEventListener('click', async function () {
        otpError.textContent = '';
        const otp = Array.from(otpDigits).map(d => d.value).join('');

        if (otp.length !== 6) {
            otpError.textContent = 'Vui lòng nhập đủ 6 số';
            return;
        }

        if (!pendingUser) {
            otpError.textContent = 'Lỗi hệ thống. Vui lòng thử lại.';
            return;
        }

        otpVerifyBtn.disabled = true;
        otpVerifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xác thực...';

        const result = await verifyOtp(pendingUser.email, otp);

        otpVerifyBtn.disabled = false;
        otpVerifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Xác thực';

        if (result.success) {
            // OTP verified — Create account
            const newUser = {
                id: Date.now(),
                full_name: pendingUser.name,
                email: pendingUser.email,
                phone: pendingUser.phone,
                password: pendingUser.password,
                role: 'customer',
                email_verified: true,
                created_at: new Date().toISOString()
            };
            const users = getUsers();
            users.push(newUser);
            saveUsers(users);

            // Auto login
            const { password: _, ...safeUser } = newUser;
            setCurrentUser(safeUser);
            updateUI();
            closeAuthModal();

            if (typeof showToast === 'function') {
                showToast('🎉 Tạo tài khoản thành công! Chào mừng ' + pendingUser.name);
            }
            pendingUser = null;
        } else {
            otpError.textContent = result.message;
            // Shake animation
            document.getElementById('otp-inputs').classList.add('shake');
            setTimeout(() => document.getElementById('otp-inputs').classList.remove('shake'), 500);
        }
    });

    // Resend OTP
    otpResendBtn.addEventListener('click', async function () {
        if (!pendingUser) return;
        otpError.textContent = '';
        otpResendBtn.disabled = true;
        otpResendBtn.textContent = 'Đang gửi...';

        const result = await sendOtp(pendingUser.email, pendingUser.name);

        otpResendBtn.textContent = 'Gửi lại';

        if (result.success) {
            otpDigits.forEach(d => { d.value = ''; });
            otpDigits[0].focus();
            otpCountdown.style.color = '';
            startCountdown();
            if (typeof showToast === 'function') {
                showToast('📧 Mã OTP mới đã gửi lại!');
            }
        } else {
            otpError.textContent = result.message;
            otpResendBtn.disabled = false;
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
    userToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });

    document.addEventListener('click', function (e) {
        if (!document.getElementById('user-account-wrap').contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });

    btnOpenLogin.addEventListener('click', () => { userDropdown.classList.remove('active'); openAuthModal('login'); });
    btnOpenRegister.addEventListener('click', () => { userDropdown.classList.remove('active'); openAuthModal('register'); });

    authClose.addEventListener('click', closeAuthModal);
    authOverlay.addEventListener('click', closeAuthModal);

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

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

    gateLogin.addEventListener('click', () => { closeAuthGate(); openAuthModal('login'); });
    gateRegister.addEventListener('click', () => { closeAuthGate(); openAuthModal('register'); });
    gateClose.addEventListener('click', closeAuthGate);
    authGateOverlay.addEventListener('click', closeAuthGate);

    window.openAuthModal = openAuthModal;
    updateUI();

})();
