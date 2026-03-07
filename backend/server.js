require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (images, frontend)
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== API ROUTES =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api', require('./routes/general'));

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

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Lỗi server, vui lòng thử lại sau' });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════╗
    ║     🧵 MachauSilk API Server              ║
    ║     Running on: http://localhost:${PORT}     ║
    ║     Environment: ${process.env.NODE_ENV || 'development'}          ║
    ╚═══════════════════════════════════════════╝
    `);
});

module.exports = app;
