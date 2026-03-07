const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, isAdmin } = require('../middleware/auth');

// GET /api/products — Danh sách sản phẩm (public)
router.get('/', async (req, res) => {
    try {
        const { category, badge, search, sort, page = 1, limit = 12 } = req.query;
        const offset = (page - 1) * limit;

        let sql = `
            SELECT p.*, c.name as category_name, c.slug as category_slug,
                   pi.image_url as primary_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
            WHERE p.is_active = TRUE
        `;
        const params = [];

        if (category) {
            sql += ' AND c.slug = ?';
            params.push(category);
        }
        if (badge) {
            sql += ' AND p.badge = ?';
            params.push(badge);
        }
        if (search) {
            sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // Count total
        const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
        const [countResult] = await db.query(countSql, params);
        const total = countResult[0].total;

        // Sort
        switch (sort) {
            case 'price_asc': sql += ' ORDER BY p.price ASC'; break;
            case 'price_desc': sql += ' ORDER BY p.price DESC'; break;
            case 'newest': sql += ' ORDER BY p.created_at DESC'; break;
            case 'bestseller': sql += ' ORDER BY p.sold_count DESC'; break;
            case 'rating': sql += ' ORDER BY p.avg_rating DESC'; break;
            default: sql += ' ORDER BY p.is_featured DESC, p.created_at DESC';
        }

        sql += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [products] = await db.query(sql, params);

        res.json({
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/products/:slug — Chi tiết sản phẩm (public)
router.get('/:slug', async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = ? AND p.is_active = TRUE
        `, [req.params.slug]);

        if (products.length === 0) {
            return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
        }

        const product = products[0];

        // Get images
        const [images] = await db.query(
            'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order',
            [product.id]
        );

        // Get reviews
        const [reviews] = await db.query(`
            SELECT r.*, u.full_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ? AND r.is_approved = TRUE
            ORDER BY r.created_at DESC
            LIMIT 10
        `, [product.id]);

        // Increment view count
        await db.query('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [product.id]);

        res.json({ ...product, images, reviews });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/products — Thêm sản phẩm (admin)
router.post('/', authenticate, isAdmin, async (req, res) => {
    try {
        const { name, category_id, sku, description, short_desc, price, original_price,
            stock_qty, material, width_cm, weight_gsm, badge } = req.body;

        const slug = name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D')
            .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const [result] = await db.query(
            `INSERT INTO products (name, slug, category_id, sku, description, short_desc,
             price, original_price, stock_qty, material, width_cm, weight_gsm, badge)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, slug, category_id, sku, description, short_desc,
                price, original_price, stock_qty, material, width_cm, weight_gsm, badge]
        );

        res.status(201).json({ message: 'Đã thêm sản phẩm', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/products/:id — Cập nhật sản phẩm (admin)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const fields = req.body;
        const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
        const values = Object.values(fields);

        await db.query(`UPDATE products SET ${sets} WHERE id = ?`, [...values, req.params.id]);
        res.json({ message: 'Đã cập nhật sản phẩm' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/products/:id — Xóa sản phẩm (admin)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
    try {
        await db.query('UPDATE products SET is_active = FALSE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Đã xóa sản phẩm' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
