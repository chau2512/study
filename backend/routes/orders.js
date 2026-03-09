const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/orders — Đơn hàng của user
router.get('/', authenticate, async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.*, COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = ?
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `, [req.user.id]);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi xử lý yêu cầu' });
    }
});

// GET /api/orders/:id — Chi tiết đơn hàng
router.get('/:id', authenticate, async (req, res) => {
    try {
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
        }

        const [items] = await db.query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [req.params.id]
        );

        res.json({ ...orders[0], items });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi xử lý yêu cầu' });
    }
});

// POST /api/orders — Tạo đơn hàng mới
router.post('/', authenticate, async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { address_id, payment_method, coupon_code, note, items } = req.body;

        // Validate items & calculate total
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const [products] = await conn.query(
                'SELECT * FROM products WHERE id = ? AND is_active = 1',
                [item.product_id]
            );
            if (products.length === 0) {
                throw new Error(`Sản phẩm ID ${item.product_id} không tồn tại`);
            }
            const product = products[0];

            if (product.stock_qty < item.quantity) {
                throw new Error(`${product.name} chỉ còn ${product.stock_qty} sản phẩm`);
            }

            const total_price = product.price * item.quantity;
            subtotal += total_price;

            orderItems.push({
                product_id: product.id,
                product_name: product.name,
                product_sku: product.sku,
                unit_price: product.price,
                quantity: item.quantity,
                total_price
            });
        }

        // Apply coupon
        let discount_amount = 0;
        let coupon_id = null;
        if (coupon_code) {
            const [coupons] = await conn.query(
                `SELECT * FROM coupons WHERE code = ? AND is_active = 1
                 AND starts_at <= NOW() AND expires_at >= NOW()
                 AND (usage_limit IS NULL OR used_count < usage_limit)`,
                [coupon_code]
            );
            if (coupons.length > 0) {
                const coupon = coupons[0];
                if (subtotal >= coupon.min_order) {
                    coupon_id = coupon.id;
                    if (coupon.type === 'percent') {
                        discount_amount = Math.floor(subtotal * coupon.value / 100);
                        if (coupon.max_discount) {
                            discount_amount = Math.min(discount_amount, coupon.max_discount);
                        }
                    } else {
                        discount_amount = coupon.value;
                    }
                    await conn.query(
                        'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
                        [coupon.id]
                    );
                }
            }
        }

        // Shipping fee
        const shipping_fee = subtotal >= 500000 ? 0 : 30000;
        const total_amount = subtotal - discount_amount + shipping_fee;

        // Generate order code
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const [countToday] = await conn.query(
            "SELECT COUNT(*) as cnt FROM orders WHERE DATE(created_at) = CURDATE()"
        );
        const order_code = `MC-${date}-${String(countToday[0].cnt + 1).padStart(3, '0')}`;

        // Insert order
        const [orderResult] = await conn.query(
            `INSERT INTO orders (order_code, user_id, address_id, coupon_id,
             subtotal, discount_amount, shipping_fee, total_amount,
             payment_method, note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [order_code, req.user.id, address_id, coupon_id,
                subtotal, discount_amount, shipping_fee, total_amount,
                payment_method, note]
        );

        // Insert order items & update stock
        for (const item of orderItems) {
            await conn.query(
                `INSERT INTO order_items (order_id, product_id, product_name,
                 product_sku, unit_price, quantity, total_price)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [orderResult.insertId, item.product_id, item.product_name,
                item.product_sku, item.unit_price, item.quantity, item.total_price]
            );
            await conn.query(
                'UPDATE products SET stock_qty = stock_qty - ?, sold_count = sold_count + ? WHERE id = ?',
                [item.quantity, item.quantity, item.product_id]
            );
        }

        // Clear cart
        await conn.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

        await conn.commit();

        res.status(201).json({
            message: 'Đặt hàng thành công!',
            order_code,
            total_amount
        });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: 'Lỗi xử lý yêu cầu' });
    } finally {
        conn.release();
    }
});

module.exports = router;
