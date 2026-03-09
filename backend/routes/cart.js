const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/cart — Xem giỏ hàng
router.get('/', authenticate, async (req, res) => {
    try {
        const [items] = await db.query(`
            SELECT ci.id, ci.quantity, ci.added_at,
                   p.id as product_id, p.name, p.sku, p.price, p.original_price,
                   p.stock_qty, p.slug,
                   pi.image_url
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
            WHERE ci.user_id = ? AND p.is_active = 1
            ORDER BY ci.added_at DESC
        `, [req.user.id]);

        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        res.json({ items, total, item_count: items.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/cart — Thêm vào giỏ
router.post('/', authenticate, async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;

        // Check product exists
        const [products] = await db.query(
            'SELECT stock_qty, name FROM products WHERE id = ? AND is_active = 1',
            [product_id]
        );
        if (products.length === 0) {
            return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
        }
        if (products[0].stock_qty < quantity) {
            return res.status(400).json({ error: `Chỉ còn ${products[0].stock_qty} sản phẩm` });
        }

        // Upsert
        await db.query(`
            INSERT INTO cart_items (user_id, product_id, quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + ?
        `, [req.user.id, product_id, quantity, quantity]);

        res.json({ message: `Đã thêm ${products[0].name} vào giỏ hàng` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/cart/:id — Cập nhật số lượng
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { quantity } = req.body;
        if (quantity <= 0) {
            await db.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?',
                [req.params.id, req.user.id]);
            return res.json({ message: 'Đã xóa khỏi giỏ hàng' });
        }
        await db.query(
            'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
            [quantity, req.params.id, req.user.id]
        );
        res.json({ message: 'Đã cập nhật giỏ hàng' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/cart/:id — Xóa khỏi giỏ
router.delete('/:id', authenticate, async (req, res) => {
    try {
        await db.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]);
        res.json({ message: 'Đã xóa khỏi giỏ hàng' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
