# 🧵 MachauSilk — Website Lụa Mã Châu

## Cấu trúc dự án

```
machauweb/
├── frontend/              ← Giao diện website
│   ├── index.html         ← Trang chủ khách hàng
│   ├── style.css          ← CSS trang chủ
│   ├── script.js          ← JS trang chủ (giỏ hàng, filter, search...)
│   ├── auth.js            ← JS đăng nhập/đăng ký + OTP
│   ├── admin.html         ← Trang quản trị
│   ├── admin.css          ← CSS trang quản trị
│   ├── admin.js           ← JS trang quản trị
│   └── images/            ← Ảnh sản phẩm & logo
│
├── backend/               ← Server API
│   ├── server.js          ← File khởi động server
│   ├── otp-server.js      ← Server gửi OTP email
│   ├── config/
│   │   └── db.js          ← Kết nối SQLite database
│   ├── middleware/
│   │   └── auth.js        ← Xác thực JWT token
│   ├── routes/
│   │   ├── auth.js        ← API đăng nhập/đăng ký
│   │   ├── products.js    ← API sản phẩm + upload ảnh
│   │   ├── cart.js        ← API giỏ hàng
│   │   ├── orders.js      ← API đơn hàng
│   │   ├── admin.js       ← API quản trị
│   │   └── general.js     ← API liên hệ, bản tin, danh mục
│   ├── .env               ← Cấu hình (DB, JWT, Email)
│   └── package.json       ← Dependencies
│
├── database/              ← Cơ sở dữ liệu
│   ├── machausilk.db      ← Database SQLite (chính)
│   ├── seed_sqlite.js     ← Script tạo data mẫu
│   ├── test_api.js        ← Script test API (30 tests)
│   ├── view_db.js         ← Script xem database
│   └── mysql_backup/      ← Backup schema MySQL cũ
│
├── .gitignore
└── README.md              ← File này
```

## Cách chạy

```bash
# 1. Khởi động server
cd backend
node server.js

# 2. Mở trình duyệt
# Trang chủ:  http://localhost:3000
# Admin:      http://localhost:3000/admin.html

# 3. Tài khoản admin
# Email: admin@machausilk.com
# Mật khẩu: admin123
```

## Tạo lại database (nếu cần)

```bash
node database/seed_sqlite.js
```

## Chạy test

```bash
node database/test_api.js
```
