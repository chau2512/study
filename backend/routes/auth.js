const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { full_name, email, phone, password } = req.body;

        // Check existing
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ? OR phone = ?',
            [email, phone]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email hoặc SĐT đã được sử dụng' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Insert
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
            [full_name, email, phone, password_hash]
        );

        // Generate token
        const token = jwt.sign(
            { id: result.insertId, email, role: 'customer' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: 'Đăng ký thành công',
            token,
            user: { id: result.insertId, full_name, email, phone }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ? AND is_active = 1',
            [email]
        );
        if (users.length === 0) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, full_name, email, phone, avatar_url, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        res.json(users[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
