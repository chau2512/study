const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/contact — Gửi tin nhắn liên hệ
router.post('/', async (req, res) => {
    try {
        const { name, phone, email, subject, message } = req.body;

        if (!name || !phone || !subject || !message) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
        }

        await db.query(
            'INSERT INTO contact_messages (name, phone, email, subject, message) VALUES (?, ?, ?, ?, ?)',
            [name, phone, email, subject, message]
        );

        res.status(201).json({ message: 'Cảm ơn bạn! Chúng tôi sẽ phản hồi sớm nhất.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/newsletter — Đăng ký nhận tin
router.post('/newsletter', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Vui lòng nhập email' });
        }

        await db.query(
            `INSERT INTO newsletter_subscribers (email) VALUES (?)
             ON DUPLICATE KEY UPDATE is_active = 1, unsubscribed_at = NULL`,
            [email]
        );

        res.json({ message: 'Đăng ký nhận tin thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/categories — Danh mục sản phẩm
router.get('/categories', async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order'
        );
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
