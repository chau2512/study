require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== SECURITY MIDDLEWARE =====

// Helmet: security headers (CSP, X-Frame-Options, HSTS, etc.)
app.use(helmet({
    contentSecurityPolicy: false, // Tắt CSP vì frontend dùng inline scripts
    crossOriginEmbedderPolicy: false
}));

// CORS — development: cho tất cả, production: chỉ domain chính thức
const isDev = (process.env.NODE_ENV || 'development') === 'development';

app.use(cors({
    origin: isDev ? true : (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(s => s.trim()),
    credentials: true
}));

// Rate limiting — chống brute-force & DDoS
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 phút
    max: 100,                 // 100 requests/phút
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 10,                   // 10 lần đăng nhập / 15 phút
    message: { error: 'Quá nhiều lần thử đăng nhập, vui lòng đợi 15 phút' }
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ===== BODY PARSERS =====
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve static files (images, frontend)
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== API ROUTES =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api', require('./routes/general'));
app.use('/api/admin', require('./routes/admin'));

// ===== API INFO =====
app.get('/api', (req, res) => {
    res.json({
        name: 'MachauSilk API',
        version: '1.0.0',
        endpoints: {
            auth: {
                'POST /api/auth/register': 'Đăng ký tài khoản',
                'POST /api/auth/login': 'Đăng nhập',
                'GET /api/auth/me': 'Thông tin user (auth required)'
            },
            products: {
                'GET /api/products': 'Danh sách SP (filter: category, badge, search, sort)',
                'GET /api/products/:slug': 'Chi tiết SP',
                'POST /api/products': 'Thêm SP (admin)',
                'PUT /api/products/:id': 'Sửa SP (admin)',
                'DELETE /api/products/:id': 'Xóa SP (admin)'
            },
            cart: {
                'GET /api/cart': 'Xem giỏ hàng (auth)',
                'POST /api/cart': 'Thêm vào giỏ (auth)',
                'PUT /api/cart/:id': 'Cập nhật SL (auth)',
                'DELETE /api/cart/:id': 'Xóa khỏi giỏ (auth)'
            },
            orders: {
                'GET /api/orders': 'Đơn hàng của tôi (auth)',
                'GET /api/orders/:id': 'Chi tiết đơn (auth)',
                'POST /api/orders': 'Đặt hàng (auth)'
            },
            general: {
                'GET /api/categories': 'Danh mục SP',
                'POST /api/contact': 'Gửi liên hệ',
                'POST /api/newsletter': 'Đăng ký nhận tin'
            }
        }
    });
});

// ===== 404 =====
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint không tồn tại' });
});

// ===== ERROR HANDLER — không lộ thông tin nội bộ =====
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({
        error: isDev ? err.message : 'Lỗi server, vui lòng thử lại sau'
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════╗
    ║     🧵 MachauSilk API Server              ║
    ║     Running on: http://localhost:${PORT}     ║
    ║     Environment: ${process.env.NODE_ENV || 'development'}          ║
    ║     Security: Helmet ✅ RateLimit ✅       ║
    ╚═══════════════════════════════════════════╝
    `);
});

module.exports = app;
