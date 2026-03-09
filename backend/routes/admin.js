const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, isAdmin } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(authenticate, isAdmin);

// GET /api/admin/stats — Dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as totalUsers FROM users WHERE is_active = 1');
        const [[{ totalProducts }]] = await db.query('SELECT COUNT(*) as totalProducts FROM products WHERE is_active = 1');
        const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) as totalOrders FROM orders');
        const [[{ totalRevenue }]] = await db.query("SELECT COALESCE(SUM(total_amount), 0) as totalRevenue FROM orders WHERE status != 'cancelled' AND status != 'refunded'");
        const [[{ pendingOrders }]] = await db.query("SELECT COUNT(*) as pendingOrders FROM orders WHERE status = 'pending'");
        const [[{ newContacts }]] = await db.query("SELECT COUNT(*) as newContacts FROM contact_messages WHERE status = 'new'");

        // Recent orders
        const [recentOrders] = await db.query(`
            SELECT o.*, u.full_name, u.email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC LIMIT 10
        `);

        // Monthly revenue (last 6 months)
        const [monthlyRevenue] = await db.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
                   SUM(total_amount) as revenue,
                   COUNT(*) as orders
            FROM orders WHERE status != 'cancelled' AND status != 'refunded'
            GROUP BY month ORDER BY month DESC LIMIT 6
        `);

        res.json({
            totalUsers, totalProducts, totalOrders,
            totalRevenue, pendingOrders, newContacts,
            recentOrders, monthlyRevenue
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ error: 'Lỗi tải thống kê' });
    }
});

// GET /api/admin/orders — All orders
router.get('/orders', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        let sql = `
            SELECT o.*, u.full_name, u.email, u.phone,
                   COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
        `;
        const params = [];
        if (status) {
            sql += ' WHERE o.status = ?';
            params.push(status);
        }
        sql += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [orders] = await db.query(sql, params);

        // Count
        let countSql = 'SELECT COUNT(*) as total FROM orders';
        const countParams = [];
        if (status) { countSql += ' WHERE status = ?'; countParams.push(status); }
        const [[{ total }]] = await db.query(countSql, countParams);

        res.json({ orders, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi xử lý yêu cầu' });
    }
});

// GET /api/admin/orders/:id — Order detail
router.get('/orders/:id', async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.*, u.full_name, u.email, u.phone
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        `, [req.params.id]);
        if (orders.length === 0) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

        const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
        res.json({ ...orders[0], items });
    } catch (err) {
        console.error('Admin order detail error:', err);
        res.status(500).json({ error: 'Lỗi tải chi tiết đơn hàng' });
    }
});

// PUT /api/admin/orders/:id/status — Update order status
router.put('/orders/:id/status', async (req, res) => {
    try {
        const { status, admin_note } = req.body;
        const validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled', 'refunded'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
        }

        const updates = { status };
        if (admin_note) updates.admin_note = admin_note;
        if (status === 'shipping') updates.shipped_at = new Date();
        if (status === 'delivered') updates.delivered_at = new Date();

        const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        await db.query(`UPDATE orders SET ${sets} WHERE id = ?`, [...Object.values(updates), req.params.id]);

        res.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (err) {
        console.error('Admin update status error:', err);
        res.status(500).json({ error: 'Lỗi cập nhật trạng thái' });
    }
});

// GET /api/admin/users — All users
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const [users] = await db.query(`
            SELECT u.id, u.full_name, u.email, u.phone, u.role, u.is_active, u.email_verified, u.created_at,
                   (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count
            FROM users u ORDER BY u.created_at DESC LIMIT ? OFFSET ?
        `, [parseInt(limit), parseInt(offset)]);

        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM users');
        res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ error: 'Lỗi tải danh sách người dùng' });
    }
});

// PUT /api/admin/users/:id — Update user (whitelisted fields only)
const USER_UPDATABLE = ['role', 'is_active'];
router.put('/users/:id', async (req, res) => {
    try {
        const updates = {};
        if (req.body.role !== undefined && ['customer', 'admin'].includes(req.body.role)) updates.role = req.body.role;
        if (req.body.is_active !== undefined) updates.is_active = req.body.is_active ? 1 : 0;

        if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Không có gì để cập nhật' });

        const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        await db.query(`UPDATE users SET ${sets} WHERE id = ?`, [...Object.values(updates), req.params.id]);
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        console.error('Admin update user error:', err);
        res.status(500).json({ error: 'Lỗi cập nhật người dùng' });
    }
});

// GET /api/admin/contacts — Contact messages
router.get('/contacts', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        let sql = 'SELECT * FROM contact_messages';
        const params = [];
        if (status) { sql += ' WHERE status = ?'; params.push(status); }
        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [messages] = await db.query(sql, params);
        let countSql = 'SELECT COUNT(*) as total FROM contact_messages';
        const countParams = [];
        if (status) { countSql += ' WHERE status = ?'; countParams.push(status); }
        const [[{ total }]] = await db.query(countSql, countParams);

        res.json({ messages, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
    } catch (err) {
        console.error('Admin contacts error:', err);
        res.status(500).json({ error: 'Lỗi tải tin nhắn' });
    }
});

// PUT /api/admin/contacts/:id — Update contact
router.put('/contacts/:id', async (req, res) => {
    try {
        const { status, admin_reply } = req.body;
        const updates = {};
        if (status) updates.status = status;
        if (admin_reply) updates.admin_reply = admin_reply;

        const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        await db.query(`UPDATE contact_messages SET ${sets} WHERE id = ?`, [...Object.values(updates), req.params.id]);
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        console.error('Admin update contact error:', err);
        res.status(500).json({ error: 'Lỗi cập nhật tin nhắn' });
    }
});

// GET /api/admin/products — All products (including inactive)
router.get('/products', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const [products] = await db.query(`
            SELECT p.*, c.name as category_name,
                   pi.image_url as primary_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
            ORDER BY p.created_at DESC LIMIT ? OFFSET ?
        `, [parseInt(limit), parseInt(offset)]);

        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM products');
        res.json({ products, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
    } catch (err) {
        console.error('Admin products error:', err);
        res.status(500).json({ error: 'Lỗi tải sản phẩm' });
    }
});

module.exports = router;
