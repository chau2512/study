// ===== OTP EMAIL SERVER - MachauSilk =====
// Server nhẹ gửi mã OTP qua Gmail, chạy độc lập (không cần MySQL)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Lưu OTP tạm vào memory (production nên dùng Redis)
const otpStore = new Map();

// Gmail transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.OTP_EMAIL || 'chau25122005@gmail.com',
        pass: process.env.OTP_EMAIL_PASSWORD || '' // App Password từ Google
    }
});

// Tạo mã OTP 6 số
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /send-otp — Gửi mã OTP
app.post('/send-otp', async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Vui lòng nhập email' });
        }

        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

        // Lưu OTP
        otpStore.set(email, { otp, expiresAt, attempts: 0 });

        // Tự xóa sau 5 phút
        setTimeout(() => otpStore.delete(email), 5 * 60 * 1000);

        // Gửi email
        await transporter.sendMail({
            from: `"Lụa Mã Châu" <${process.env.OTP_EMAIL || 'chau25122005@gmail.com'}>`,
            to: email,
            subject: '🔐 Mã xác thực OTP - Lụa Mã Châu',
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #FFF9EE; border-radius: 16px; border: 1px solid #E4C580;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h2 style="color: #C6973F; font-size: 22px; margin: 0;">Lụa Mã Châu</h2>
                        <p style="color: #999; font-size: 13px; margin: 4px 0 0;">Tinh Hoa Tơ Tằm Truyền Thống</p>
                    </div>
                    <div style="background: white; padding: 24px; border-radius: 12px; text-align: center;">
                        <p style="color: #555; font-size: 15px; margin: 0 0 8px;">Xin chào <strong>${name || 'bạn'}</strong>,</p>
                        <p style="color: #555; font-size: 14px; margin: 0 0 20px;">Mã xác thực OTP của bạn là:</p>
                        <div style="background: linear-gradient(135deg, #C6973F, #A07830); color: white; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 32px; border-radius: 12px; display: inline-block;">
                            ${otp}
                        </div>
                        <p style="color: #999; font-size: 13px; margin: 20px 0 0;">Mã có hiệu lực trong <strong>5 phút</strong>.</p>
                        <p style="color: #999; font-size: 12px; margin: 8px 0 0;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
                    </div>
                    <p style="text-align: center; color: #bbb; font-size: 11px; margin-top: 20px;">© 2026 Lụa Mã Châu - 211 Trương Chí Cương, Duy Xuyên, Quảng Nam</p>
                </div>
            `
        });

        console.log(`✅ OTP ${otp} đã gửi tới ${email}`);
        res.json({ message: 'Mã OTP đã được gửi tới email của bạn!' });

    } catch (err) {
        console.error('❌ Lỗi gửi email:', err.message);

        if (err.message.includes('Invalid login') || err.message.includes('auth')) {
            return res.status(500).json({
                error: 'Lỗi xác thực Gmail. Vui lòng kiểm tra App Password.',
                hint: 'Xem hướng dẫn tại: https://support.google.com/accounts/answer/185833'
            });
        }
        res.status(500).json({ error: 'Không thể gửi email. Vui lòng thử lại.' });
    }
});

// POST /verify-otp — Xác thực mã OTP
app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Thiếu email hoặc mã OTP' });
    }

    const stored = otpStore.get(email);

    if (!stored) {
        return res.status(400).json({ error: 'Mã OTP đã hết hạn. Vui lòng gửi lại.' });
    }

    if (stored.attempts >= 5) {
        otpStore.delete(email);
        return res.status(429).json({ error: 'Quá nhiều lần thử. Vui lòng gửi lại mã mới.' });
    }

    stored.attempts++;

    if (Date.now() > stored.expiresAt) {
        otpStore.delete(email);
        return res.status(400).json({ error: 'Mã OTP đã hết hạn (5 phút). Vui lòng gửi lại.' });
    }

    if (stored.otp !== otp) {
        return res.status(400).json({ error: `Mã OTP không đúng. Còn ${5 - stored.attempts} lần thử.` });
    }

    // OTP đúng
    otpStore.delete(email);
    res.json({ message: 'Xác thực thành công!', verified: true });
});

// GET / — Health check
app.get('/', (req, res) => {
    res.json({ status: 'OTP Server running', port: PORT });
});

app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║   📧 MachauSilk OTP Server            ║
    ║   http://localhost:${PORT}               ║
    ╚═══════════════════════════════════════╝
    `);
});
