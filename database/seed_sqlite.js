const path = require('path');
const Database = require(path.join(__dirname, '..', 'backend', 'node_modules', 'better-sqlite3'));
const bcrypt = require(path.join(__dirname, '..', 'backend', 'node_modules', 'bcryptjs'));
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'machausilk.db');

// Delete existing db to start fresh
if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('🗑️  Removed old database');
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('📦 Creating SQLite database...');

// ===== CREATE TABLES =====
db.exec(`
-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_url TEXT DEFAULT NULL,
    role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
    is_active INTEGER DEFAULT 1,
    email_verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    description TEXT DEFAULT NULL,
    icon TEXT DEFAULT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    sku TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    short_desc TEXT DEFAULT NULL,
    price REAL NOT NULL,
    original_price REAL DEFAULT NULL,
    stock_qty INTEGER DEFAULT 0,
    material TEXT DEFAULT NULL,
    width_cm INTEGER DEFAULT NULL,
    weight_gsm INTEGER DEFAULT NULL,
    colors TEXT DEFAULT NULL,
    badge TEXT DEFAULT NULL CHECK(badge IN ('bestseller', 'new', 'exclusive', NULL)),
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,
    avg_rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    sold_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 4. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT DEFAULT NULL,
    is_primary INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 5. ADDRESSES
CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    province TEXT NOT NULL,
    district TEXT NOT NULL,
    ward TEXT NOT NULL,
    street_address TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. COUPONS
CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('percent', 'fixed')),
    value REAL NOT NULL,
    min_order REAL DEFAULT 0,
    max_discount REAL DEFAULT NULL,
    usage_limit INTEGER DEFAULT NULL,
    used_count INTEGER DEFAULT 0,
    starts_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    is_active INTEGER DEFAULT 1
);

-- 7. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT NOT NULL UNIQUE,
    user_id INTEGER,
    address_id INTEGER,
    coupon_id INTEGER DEFAULT NULL,
    subtotal REAL NOT NULL,
    discount_amount REAL DEFAULT 0,
    shipping_fee REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','shipping','delivered','cancelled','refunded')),
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cod','bank_transfer','momo','zalopay')),
    payment_status TEXT DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','paid','refunded')),
    note TEXT DEFAULT NULL,
    admin_note TEXT DEFAULT NULL,
    shipped_at DATETIME DEFAULT NULL,
    delivered_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
);

-- 8. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    total_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 9. CART ITEMS
CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 10. WISHLIST
CREATE TABLE IF NOT EXISTS wishlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 11. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    title TEXT DEFAULT NULL,
    comment TEXT DEFAULT NULL,
    is_approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 12. CONTACT MESSAGES
CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK(status IN ('new','read','replied')),
    admin_reply TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 13. NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    user_id INTEGER DEFAULT NULL,
    is_active INTEGER DEFAULT 1,
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 14. SITE SETTINGS
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    type TEXT DEFAULT 'string' CHECK(type IN ('string','number','boolean','json'))
);
`);

console.log('✅ Tables created');

// ===== SEED DATA =====

// Admin user (password: admin123)
const adminHash = bcrypt.hashSync('admin123', 10);
const userHash = bcrypt.hashSync('123456', 10);

const insertUser = db.prepare('INSERT INTO users (full_name, email, phone, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)');
insertUser.run('Admin MachauSilk', 'admin@machausilk.com', '0848543171', adminHash, 'admin', 1);
insertUser.run('Nguyễn Văn A', 'a@email.com', '0901234567', userHash, 'customer', 1);
insertUser.run('Trần Thị B', 'b@email.com', '0912345678', userHash, 'customer', 1);
insertUser.run('Lê Minh C', 'c@email.com', '0923456789', userHash, 'customer', 0);
insertUser.run('Phạm Hồng D', 'd@email.com', '0934567890', userHash, 'customer', 1);
console.log('✅ Users seeded (admin: admin@machausilk.com / admin123)');

// Categories
const insertCat = db.prepare('INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)');
insertCat.run('Lụa Tơ Tằm', 'lua-to-tam', 1);
insertCat.run('Siêu Satin', 'sieu-satin', 2);
insertCat.run('Hàng Độc Nhà Mã', 'hang-doc-nha-ma', 3);
console.log('✅ Categories seeded');

// Products
const insertProd = db.prepare(`INSERT INTO products
    (name, slug, sku, category_id, description, short_desc, price, original_price, stock_qty, material, badge, is_featured, sold_count, avg_rating, review_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

insertProd.run('Lụa Hoa Văn Cúc Bạch', 'lua-hoa-van-cuc-bach', 'LHCB02', 1,
    'Lụa tơ tằm thiên nhiên với họa tiết cúc bạch tinh tế trên nền xanh nhạt. Chất liệu mềm mại, thoáng mát.',
    'Lụa tơ tằm họa tiết cúc bạch', 135000, 180000, 50, 'Tơ tằm 100%', 'bestseller', 1, 24, 4.5, 24);

insertProd.run('Lụa Hoa Văn Cúc Cành Nhuộm Xanh Rêu', 'lua-hoa-van-cuc-canh-nhuom-xanh-reu', 'LHCC01', 1,
    'Lụa tơ tằm với họa tiết hoa cúc cành nhuộm xanh rêu đặc trưng.',
    'Lụa tơ tằm cúc cành xanh rêu', 135000, null, 35, 'Tơ tằm 100%', null, 0, 18, 4.0, 18);

insertProd.run('Lụa Hoa Văn Cúc Xanh Lục', 'lua-hoa-van-cuc-xanh-luc', 'LHC33', 2,
    'Siêu satin cao cấp với họa tiết cúc xanh lục rực rỡ. Chống rạn, bền màu.',
    'Siêu satin cúc xanh lục', 135000, 165000, 40, 'Satin cao cấp', 'new', 1, 31, 5.0, 31);

insertProd.run('Lụa Hoa Văn Hỉ Tre', 'lua-hoa-van-hi-tre', 'LHVHT05', 3,
    'Mẫu lụa độc quyền với họa tiết hỉ tre tinh xảo - biểu tượng của sự phúc lộc.',
    'Lụa độc quyền hỉ tre', 185000, null, 20, 'Tơ tằm pha', 'exclusive', 1, 12, 4.5, 12);

insertProd.run('Lụa Hoa Văn Đuôi Công', 'lua-hoa-van-duoi-cong', 'LHDC05', 2,
    'Siêu satin chống rạn với họa tiết đuôi công truyền thống.',
    'Satin đuôi công truyền thống', 135000, null, 45, 'Satin cao cấp', null, 0, 9, 4.0, 9);

insertProd.run('Lụa Hoa Văn Tròn', 'lua-hoa-van-tron', 'LHDC04', 3,
    'Lụa cao cấp với họa tiết tròn độc đáo trên nền vàng cam sang trọng.',
    'Lụa họa tiết tròn độc đáo', 155000, 200000, 30, 'Tơ tằm pha', 'bestseller', 1, 27, 5.0, 27);

console.log('✅ Products seeded');

// Product images
const insertImg = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)');
for (let i = 1; i <= 6; i++) {
    insertImg.run(i, `images/product${i}.jpg`);
}
console.log('✅ Product images seeded');

// Sample orders
const insertOrder = db.prepare(`INSERT INTO orders
    (order_code, user_id, subtotal, discount_amount, shipping_fee, total_amount, status, payment_method, payment_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const insertOrderItem = db.prepare(`INSERT INTO order_items
    (order_id, product_id, product_name, product_sku, unit_price, quantity, total_price)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);

insertOrder.run('MC-20260308-001', 2, 540000, 0, 0, 540000, 'pending', 'cod', 'unpaid', '2026-03-08 01:00:00');
insertOrderItem.run(1, 1, 'Lụa Hoa Văn Cúc Bạch', 'LHCB02', 135000, 4, 540000);

insertOrder.run('MC-20260307-003', 3, 370000, 0, 30000, 370000, 'confirmed', 'bank_transfer', 'paid', '2026-03-07 14:30:00');
insertOrderItem.run(2, 3, 'Lụa Hoa Văn Cúc Xanh Lục', 'LHC33', 135000, 2, 270000);
insertOrderItem.run(2, 5, 'Lụa Hoa Văn Đuôi Công', 'LHDC05', 135000, 1, 135000);

insertOrder.run('MC-20260307-002', 4, 810000, 0, 0, 810000, 'shipping', 'momo', 'paid', '2026-03-07 10:15:00');
insertOrderItem.run(3, 4, 'Lụa Hoa Văn Hỉ Tre', 'LHVHT05', 185000, 2, 370000);
insertOrderItem.run(3, 6, 'Lụa Hoa Văn Tròn', 'LHDC04', 155000, 2, 310000);
insertOrderItem.run(3, 1, 'Lụa Hoa Văn Cúc Bạch', 'LHCB02', 135000, 1, 135000);

insertOrder.run('MC-20260306-001', 5, 270000, 0, 30000, 270000, 'delivered', 'cod', 'paid', '2026-03-06 08:00:00');
insertOrderItem.run(4, 1, 'Lụa Hoa Văn Cúc Bạch', 'LHCB02', 135000, 2, 270000);

insertOrder.run('MC-20260305-002', 2, 450000, 0, 30000, 450000, 'delivered', 'zalopay', 'paid', '2026-03-05 16:45:00');
insertOrderItem.run(5, 6, 'Lụa Hoa Văn Tròn', 'LHDC04', 155000, 2, 310000);
insertOrderItem.run(5, 5, 'Lụa Hoa Văn Đuôi Công', 'LHDC05', 135000, 1, 135000);

console.log('✅ Orders seeded');

// Contact messages
const insertMsg = db.prepare('INSERT INTO contact_messages (name, phone, email, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
insertMsg.run('Nguyễn Văn A', '0901234567', 'a@email.com', 'Tư vấn sản phẩm', 'Tôi muốn hỏi về lụa tơ tằm cho áo dài cưới.', 'new', '2026-03-08 00:30:00');
insertMsg.run('Trần Thị B', '0912345678', 'b@email.com', 'Đơn hàng', 'Đơn hàng MC-20260307-003 khi nào giao?', 'new', '2026-03-07 15:00:00');
insertMsg.run('Lê Minh C', '0923456789', 'c@email.com', 'Hợp tác', 'Tôi muốn hợp tác phân phối lụa Mã Châu tại Hà Nội.', 'read', '2026-03-06 11:00:00');
insertMsg.run('Phạm Hồng D', '0934567890', 'd@email.com', 'Khiếu nại', 'Sản phẩm nhận được bị khác màu so với hình.', 'replied', '2026-03-05 08:30:00');
console.log('✅ Contact messages seeded');

// Newsletter
const insertNL = db.prepare('INSERT INTO newsletter_subscribers (email) VALUES (?)');
insertNL.run('a@email.com');
insertNL.run('b@email.com');
insertNL.run('test@example.com');
console.log('✅ Newsletter subscribers seeded');

// Reviews
const insertReview = db.prepare('INSERT INTO reviews (user_id, product_id, rating, title, comment, is_approved) VALUES (?, ?, ?, ?, ?, ?)');
insertReview.run(2, 1, 5, 'Rất đẹp!', 'Lụa mềm mại, mịn màng. Rất hài lòng.', 1);
insertReview.run(3, 1, 4, 'Chất lượng tốt', 'Hoa văn tinh xảo, giá hợp lý.', 1);
insertReview.run(4, 3, 5, 'Tuyệt vời', 'Satin chống rạn thật sự bền, màu đẹp lắm.', 1);
insertReview.run(5, 6, 5, 'Độc đáo', 'Mẫu rất đặc biệt, ai cũng khen.', 1);
console.log('✅ Reviews seeded');

db.close();
console.log('\n🎉 Database seeded successfully! File: database/machausilk.db');
