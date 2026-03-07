const jwt = require('jsonwebtoken');

// Verify JWT token
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
};

// Check admin role
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Không có quyền truy cập' });
    }
    next();
};

module.exports = { authenticate, isAdmin };
