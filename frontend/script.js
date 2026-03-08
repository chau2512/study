/* ============================================================
   MACHAUSILK - Modern JavaScript
   Full functionality: Cart, Modal, Filters, Dark Mode, Forms
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ===== PRODUCT DATA =====
    const productData = {
        1: {
            name: 'Lụa Hoa Văn Cúc Bạch',
            code: 'LHCB02',
            cat: 'Lụa Tơ Tằm',
            price: 135000,
            oldPrice: 180000,
            img: 'images/product1.jpg',
            desc: 'Lụa tơ tằm thiên nhiên với họa tiết cúc bạch tinh tế trên nền xanh nhạt. Chất liệu mềm mại, thoáng mát, phù hợp may áo dài, khăn quàng cổ và phụ kiện thời trang cao cấp.',
            rating: '4.5/5 (24 đánh giá)'
        },
        2: {
            name: 'Lụa Hoa Văn Cúc Cành Nhuộm Xanh Rêu',
            code: 'LHCC01',
            cat: 'Lụa Tơ Tằm',
            price: 135000,
            img: 'images/product2.jpg',
            desc: 'Lụa tơ tằm với họa tiết hoa cúc cành nhuộm xanh rêu đặc trưng. Chất liệu mềm mại, bền màu, thích hợp cho trang phục truyền thống và hiện đại.',
            rating: '4/5 (18 đánh giá)'
        },
        3: {
            name: 'Lụa Hoa Văn Cúc Xanh Lục',
            code: 'LHC33',
            cat: 'Siêu Satin',
            price: 135000,
            oldPrice: 165000,
            img: 'images/product3.jpg',
            desc: 'Siêu satin cao cấp với họa tiết cúc xanh lục rực rỡ. Chống rạn, bền màu, thích hợp cho trang phục truyền thống và hiện đại.',
            rating: '5/5 (31 đánh giá)'
        },
        4: {
            name: 'Lụa Hoa Văn Hỉ Tre',
            code: 'LHVHT05',
            cat: 'Hàng Độc Nhà Mã',
            price: 185000,
            img: 'images/product4.jpg',
            desc: 'Mẫu lụa độc quyền với họa tiết hỉ tre tinh xảo - biểu tượng của sự phúc lộc. Sản phẩm giới hạn, chỉ có tại Lụa Mã Châu.',
            rating: '4.5/5 (12 đánh giá)'
        },
        5: {
            name: 'Lụa Hoa Văn Đuôi Công',
            code: 'LHĐC05',
            cat: 'Siêu Satin',
            price: 135000,
            img: 'images/product5.jpg',
            desc: 'Siêu satin chống rạn với họa tiết đuôi công truyền thống. Biểu tượng của sự kiên cường và thanh cao.',
            rating: '4/5 (9 đánh giá)'
        },
        6: {
            name: 'Lụa Hoa Văn Tròn',
            code: 'LHĐC04',
            cat: 'Hàng Độc Nhà Mã',
            price: 155000,
            oldPrice: 200000,
            img: 'images/product6.jpg',
            desc: 'Lụa cao cấp với họa tiết tròn độc đáo trên nền vàng cam sang trọng. Sản phẩm độc quyền phù hợp cho những người yêu thích sự khác biệt.',
            rating: '5/5 (27 đánh giá)'
        }
    };

    // ===== LOADER =====
    const loader = document.getElementById('loader');
    window.addEventListener('load', () => {
        setTimeout(() => loader.classList.add('hidden'), 800);
    });
    // Fallback
    setTimeout(() => loader.classList.add('hidden'), 3000);

    // ===== HERO SLIDER =====
    const heroSlides = document.querySelectorAll('.hero-slide');
    const heroPrev = document.getElementById('hero-prev');
    const heroNext = document.getElementById('hero-next');
    const heroCurrent = document.getElementById('hero-current');
    let currentHero = 0;
    let heroInterval;

    // Set background images
    heroSlides.forEach(slide => {
        const bg = slide.dataset.bg;
        if (bg) slide.style.backgroundImage = `url('${bg}')`;
    });

    function goHero(idx) {
        heroSlides.forEach(s => s.classList.remove('active'));
        currentHero = ((idx % heroSlides.length) + heroSlides.length) % heroSlides.length;
        heroSlides[currentHero].classList.add('active');
        if (heroCurrent) heroCurrent.textContent = String(currentHero + 1).padStart(2, '0');
    }

    function startHeroAuto() {
        heroInterval = setInterval(() => goHero(currentHero + 1), 6000);
    }
    function resetHeroAuto() {
        clearInterval(heroInterval);
        startHeroAuto();
    }

    if (heroPrev) heroPrev.addEventListener('click', () => { goHero(currentHero - 1); resetHeroAuto(); });
    if (heroNext) heroNext.addEventListener('click', () => { goHero(currentHero + 1); resetHeroAuto(); });

    // Touch swipe
    let touchX = 0;
    const sliderEl = document.getElementById('hero-slider');
    if (sliderEl) {
        sliderEl.addEventListener('touchstart', e => { touchX = e.changedTouches[0].screenX; }, { passive: true });
        sliderEl.addEventListener('touchend', e => {
            const diff = touchX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) {
                goHero(diff > 0 ? currentHero + 1 : currentHero - 1);
                resetHeroAuto();
            }
        }, { passive: true });
    }
    startHeroAuto();

    // ===== HEADER SCROLL =====
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    // ===== DARK MODE =====
    const themeToggle = document.getElementById('theme-toggle');
    // One-time reset to ensure light mode shows gold background
    if (!localStorage.getItem('machau-theme-v2')) {
        localStorage.setItem('machau-theme', 'light');
        localStorage.setItem('machau-theme-v2', 'true');
    }
    const savedTheme = localStorage.getItem('machau-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('machau-theme', next);
        updateThemeIcon(next);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // ===== SEARCH =====
    const searchToggle = document.getElementById('search-toggle');
    const searchOverlay = document.getElementById('search-overlay');
    const searchClose = document.getElementById('search-close');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    let searchTimeout;

    searchToggle.addEventListener('click', () => {
        searchOverlay.classList.add('active');
        setTimeout(() => searchInput.focus(), 300);
    });
    searchClose.addEventListener('click', () => {
        searchOverlay.classList.remove('active');
        searchResults.innerHTML = '';
    });

    async function doSearch(query) {
        if (!query || query.length < 2) { searchResults.innerHTML = ''; return; }
        try {
            const res = await fetch(`http://localhost:3000/api/products?search=${encodeURIComponent(query)}&limit=6`);
            const data = await res.json();
            if (data.products && data.products.length > 0) {
                searchResults.innerHTML = data.products.map(p => `
                    <a href="#san-pham" class="search-result-item" onclick="document.getElementById('search-overlay').classList.remove('active')">
                        <img src="${p.primary_image || 'images/logo.png'}" alt="${p.name}">
                        <div>
                            <strong>${p.name}</strong>
                            <span>${p.price.toLocaleString('vi-VN')}đ</span>
                        </div>
                    </a>
                `).join('');
            } else {
                searchResults.innerHTML = '<p class="search-no-result">Không tìm thấy sản phẩm nào</p>';
            }
        } catch { searchResults.innerHTML = ''; }
    }

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => doSearch(searchInput.value.trim()), 300);
    });
    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
            doSearch(searchInput.value.trim());
        }
    });

    // ===== MOBILE NAV =====
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileNav.classList.toggle('active');
        document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    });

    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // ===== ACTIVE NAV =====
    const sections = document.querySelectorAll('section[id], footer');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function updateActiveNav() {
        let current = 'home';
        sections.forEach(sec => {
            if (sec.id && window.scrollY >= sec.offsetTop - 200) {
                current = sec.id;
            }
        });
        navLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === '#' + current);
        });
        mobileLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === '#' + current);
        });
    }
    window.addEventListener('scroll', updateActiveNav);

    // ===== SMOOTH SCROLL =====
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function (e) {
            const id = this.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (target) {
                e.preventDefault();
                const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
                window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
                // Close overlays
                searchOverlay.classList.remove('active');
                closeCart();
            }
        });
    });

    // ===== PRODUCT FILTERS =====
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;

            productCards.forEach((card, i) => {
                const cat = card.dataset.category;
                const match = filter === 'all' || cat === filter;
                card.classList.toggle('hidden', !match);
                if (match) {
                    card.style.animationDelay = `${i * 0.05}s`;
                }
            });
        });
    });

    // ===== CART SYSTEM =====
    let cart = JSON.parse(localStorage.getItem('machau-cart') || '[]');
    const CART_API = 'http://localhost:3000/api/cart';

    // API sync helpers (background — don't block UI)
    function cartApiHeaders() {
        const t = typeof getAuthToken === 'function' ? getAuthToken() : null;
        if (!t) return null;
        return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t };
    }
    async function apiCartSync(productId, qty) {
        const h = cartApiHeaders();
        if (!h) return;
        try { await fetch(CART_API, { method: 'POST', headers: h, body: JSON.stringify({ product_id: productId, quantity: qty }) }); } catch { }
    }

    const cartToggle = document.getElementById('cart-toggle');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartClose = document.getElementById('cart-close');
    const cartBadge = document.getElementById('cart-badge');
    const cartBody = document.getElementById('cart-items');
    const cartEmpty = document.getElementById('cart-empty');
    const cartFooter = document.getElementById('cart-footer');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartCountText = document.getElementById('cart-count-text');
    const checkoutBtn = document.getElementById('checkout-btn');
    const continueBtn = document.getElementById('continue-shopping');
    const cartShopNow = document.getElementById('cart-shop-now');

    function openCart() {
        cartOverlay.classList.add('active');
        cartSidebar.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeCart() {
        cartOverlay.classList.remove('active');
        cartSidebar.classList.remove('active');
        document.body.style.overflow = '';
    }

    cartToggle.addEventListener('click', openCart);
    cartOverlay.addEventListener('click', closeCart);
    cartClose.addEventListener('click', closeCart);
    if (continueBtn) continueBtn.addEventListener('click', (e) => { e.preventDefault(); closeCart(); });
    if (cartShopNow) cartShopNow.addEventListener('click', (e) => { e.preventDefault(); closeCart(); });

    function formatPrice(num) {
        return num.toLocaleString('vi-VN') + 'đ';
    }

    function updateCartUI() {
        const total = cart.reduce((s, item) => s + item.qty, 0);
        cartBadge.textContent = total;
        cartCountText.textContent = total;

        if (total > 0) {
            cartBadge.classList.add('pulse');
            setTimeout(() => cartBadge.classList.remove('pulse'), 400);
        }

        if (cart.length === 0) {
            cartEmpty.style.display = 'block';
            cartBody.innerHTML = '';
            cartFooter.style.display = 'none';
        } else {
            cartEmpty.style.display = 'none';
            cartFooter.style.display = 'block';
            const totalPrice = cart.reduce((s, item) => s + item.price * item.qty, 0);
            cartTotalPrice.textContent = formatPrice(totalPrice);

            cartBody.innerHTML = cart.map((item, idx) => `
                <div class="cart-item">
                    <div class="cart-item-img"><img src="${item.img}" alt="${item.name}"></div>
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p class="item-price">${formatPrice(item.price)}</p>
                        <div class="cart-item-qty">
                            <button onclick="window.changeQty(${idx}, -1)">−</button>
                            <span>${item.qty}</span>
                            <button onclick="window.changeQty(${idx}, 1)">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove" onclick="window.removeFromCart(${idx})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `).join('');
        }
        localStorage.setItem('machau-cart', JSON.stringify(cart));
    }

    function addToCart(name, price, img, productId) {
        // Kiểm tra đăng nhập trước khi thêm giỏ hàng
        if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
            if (typeof showAuthGate === 'function') showAuthGate();
            return;
        }
        const existing = cart.find(item => item.name === name);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ name, price, img, qty: 1, productId: productId || null });
        }
        updateCartUI();
        openCart();
        showToast(`Đã thêm "${name}" vào giỏ hàng!`);
        // Sync to API
        if (productId) apiCartSync(productId, 1);
    }

    window.changeQty = (idx, delta) => {
        if (cart[idx]) {
            cart[idx].qty += delta;
            if (cart[idx].qty <= 0) cart.splice(idx, 1);
            updateCartUI();
        }
    };

    window.removeFromCart = (idx) => {
        const name = cart[idx]?.name;
        cart.splice(idx, 1);
        updateCartUI();
        showToast(`Đã xóa "${name}" khỏi giỏ hàng`, 'error');
    };

    // Add to cart buttons
    document.querySelectorAll('.add-cart').forEach(btn => {
        btn.addEventListener('click', () => {
            addToCart(btn.dataset.name, parseInt(btn.dataset.price), btn.dataset.img, btn.dataset.id || null);
        });
    });

    // Checkout
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            // Kiểm tra đăng nhập trước khi thanh toán
            if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
                if (typeof showAuthGate === 'function') showAuthGate();
                return;
            }
            if (cart.length > 0) {
                const total = cart.reduce((s, item) => s + item.price * item.qty, 0);
                showToast(`Đơn hàng ${formatPrice(total)} đã được ghi nhận! Cảm ơn bạn.`);
                cart = [];
                updateCartUI();
                closeCart();
            }
        });
    }

    updateCartUI();

    // ===== WISHLIST =====
    document.querySelectorAll('.wishlist').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('wishlisted');
            const icon = btn.querySelector('i');
            if (btn.classList.contains('wishlisted')) {
                icon.className = 'fas fa-heart';
                showToast('Đã thêm vào danh sách yêu thích ❤️');
            } else {
                icon.className = 'far fa-heart';
                showToast('Đã xóa khỏi danh sách yêu thích');
            }
        });
    });

    // ===== QUICK VIEW MODAL =====
    const modalOverlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('product-modal');
    const modalClose = document.getElementById('modal-close');
    const modalImage = document.getElementById('modal-image');
    const modalCat = document.getElementById('modal-cat');
    const modalTitle = document.getElementById('modal-title');
    const modalRating = document.getElementById('modal-rating');
    const modalPrice = document.getElementById('modal-price');
    const modalDesc = document.getElementById('modal-desc');
    const qtyInput = document.getElementById('qty-input');
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const modalAddCart = document.getElementById('modal-add-cart');
    let currentProduct = null;

    document.querySelectorAll('.quick-view').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.product;
            const p = productData[id];
            if (!p) return;
            currentProduct = p;

            modalImage.src = p.img;
            modalImage.alt = p.name;
            modalCat.textContent = p.cat;
            modalTitle.textContent = p.name;
            modalRating.textContent = p.rating;
            modalPrice.textContent = formatPrice(p.price) + (p.oldPrice ? ` (${formatPrice(p.oldPrice)})` : '');
            modalDesc.textContent = p.desc;
            qtyInput.value = 1;

            modalOverlay.classList.add('active');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeModal() {
        modalOverlay.classList.remove('active');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    qtyMinus.addEventListener('click', () => {
        const v = parseInt(qtyInput.value);
        if (v > 1) qtyInput.value = v - 1;
    });
    qtyPlus.addEventListener('click', () => {
        qtyInput.value = parseInt(qtyInput.value) + 1;
    });

    modalAddCart.addEventListener('click', () => {
        if (currentProduct) {
            const qty = parseInt(qtyInput.value) || 1;
            for (let i = 0; i < qty; i++) {
                const existing = cart.find(item => item.name === currentProduct.name);
                if (existing) {
                    existing.qty += 1;
                } else {
                    cart.push({
                        name: currentProduct.name,
                        price: currentProduct.price,
                        img: currentProduct.img,
                        qty: 1
                    });
                }
            }
            updateCartUI();
            closeModal();
            setTimeout(openCart, 300);
            showToast(`Đã thêm ${qty}x "${currentProduct.name}" vào giỏ hàng!`);
        }
    });

    // ===== CONTACT FORM =====
    const contactForm = document.getElementById('contact-form');
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('form-name').value.trim();
        const phone = document.getElementById('form-phone').value.trim();
        const email = document.getElementById('form-email').value.trim();
        const subject = document.getElementById('form-subject').value;
        const message = document.getElementById('form-message').value.trim();

        if (!name || !phone || !subject || !message) {
            showToast('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
            return;
        }

        // Simulate sending
        const btn = contactForm.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
        btn.disabled = true;

        setTimeout(() => {
            showToast(`Cảm ơn ${name}! Tin nhắn của bạn đã được gửi thành công.`);
            contactForm.reset();
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1500);
    });

    // ===== NEWSLETTER =====
    const newsletterForm = document.getElementById('newsletter-form');
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input').value.trim();
        if (email) {
            showToast(`Email ${email} đã được đăng ký nhận tin thành công!`);
            newsletterForm.reset();
        }
    });

    // ===== COUNT UP ANIMATION =====
    const counters = document.querySelectorAll('.stat-num');
    const countObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count);
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;
                const timer = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        el.textContent = target.toLocaleString();
                        clearInterval(timer);
                    } else {
                        el.textContent = Math.floor(current).toLocaleString();
                    }
                }, 16);
                countObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(c => countObserver.observe(c));

    // ===== SCROLL ANIMATIONS =====
    const aosObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                aosObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-aos]').forEach((el, i) => {
        el.style.transitionDelay = `${(i % 6) * 0.08}s`;
        aosObserver.observe(el);
    });

    // ===== BACK TO TOP =====
    const backTop = document.getElementById('back-top');
    window.addEventListener('scroll', () => {
        backTop.classList.toggle('visible', window.scrollY > 500);
    });
    backTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ===== TOAST SYSTEM =====
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3200);
    }

    // ===== KEYBOARD SHORTCUTS =====
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeCart();
            searchOverlay.classList.remove('active');
            hamburger.classList.remove('active');
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

});
