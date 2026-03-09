const mysql = require('../backend/node_modules/mysql2/promise');
const bcrypt = require('../backend/node_modules/bcryptjs');

const DB_NAME = 'machausilk';

async function seed() {
    // Connect without database first
    const conn = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        charset: 'utf8mb4',
        multipleStatements: true
    });

    console.log('📦 Creating MySQL database...');

    // Drop & create database
    await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    await conn.query(`CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${DB_NAME}\``);

    console.log(`✅ Database '${DB_NAME}' created`);

    // ===== CREATE TABLES =====
    await conn.query(`
    -- 1. USERS
    CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500) DEFAULT NULL,
        role ENUM('customer', 'admin') DEFAULT 'customer',
        is_active TINYINT DEFAULT 1,
        email_verified TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;

    -- 2. CATEGORIES
    CREATE TABLE categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255) UNIQUE,
        description TEXT DEFAULT NULL,
        icon VARCHAR(100) DEFAULT NULL,
        sort_order INT DEFAULT 0,
        is_active TINYINT DEFAULT 1
    ) ENGINE=InnoDB;

    -- 3. PRODUCTS
    CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        sku VARCHAR(50) NOT NULL UNIQUE,
        description TEXT DEFAULT NULL,
        short_desc VARCHAR(500) DEFAULT NULL,
        price DECIMAL(12,0) NOT NULL,
        original_price DECIMAL(12,0) DEFAULT NULL,
        stock_qty INT DEFAULT 0,
        material VARCHAR(255) DEFAULT NULL,
        width_cm INT DEFAULT NULL,
        weight_gsm INT DEFAULT NULL,
        colors TEXT DEFAULT NULL,
        badge ENUM('bestseller', 'new', 'exclusive') DEFAULT NULL,
        is_active TINYINT DEFAULT 1,
        is_featured TINYINT DEFAULT 0,
        avg_rating DECIMAL(2,1) DEFAULT 0.0,
        review_count INT DEFAULT 0,
        view_count INT DEFAULT 0,
        sold_count INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_category (category_id),
        INDEX idx_badge (badge),
        INDEX idx_active (is_active),
        INDEX idx_featured (is_featured, created_at),
        INDEX idx_slug (slug)
    ) ENGINE=InnoDB;

    -- 4. PRODUCT IMAGES
    CREATE TABLE product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        alt_text VARCHAR(255) DEFAULT NULL,
        is_primary TINYINT DEFAULT 0,
        sort_order INT DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product_primary (product_id, is_primary)
    ) ENGINE=InnoDB;

    -- 5. ADDRESSES
    CREATE TABLE addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        province VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        ward VARCHAR(100) NOT NULL,
        street_address VARCHAR(500) NOT NULL,
        is_default TINYINT DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id)
    ) ENGINE=InnoDB;

    -- 6. COUPONS
    CREATE TABLE coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        type ENUM('percent', 'fixed') NOT NULL,
        value DECIMAL(12,0) NOT NULL,
        min_order DECIMAL(12,0) DEFAULT 0,
        max_discount DECIMAL(12,0) DEFAULT NULL,
        usage_limit INT DEFAULT NULL,
        used_count INT DEFAULT 0,
        starts_at DATETIME NOT NULL,
        expires_at DATETIME NOT NULL,
        is_active TINYINT DEFAULT 1
    ) ENGINE=InnoDB;

    -- 7. ORDERS
    CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_code VARCHAR(50) NOT NULL UNIQUE,
        user_id INT,
        address_id INT,
        coupon_id INT DEFAULT NULL,
        subtotal DECIMAL(12,0) NOT NULL,
        discount_amount DECIMAL(12,0) DEFAULT 0,
        shipping_fee DECIMAL(12,0) DEFAULT 0,
        total_amount DECIMAL(12,0) NOT NULL,
        status ENUM('pending','confirmed','shipping','delivered','cancelled','refunded') DEFAULT 'pending',
        payment_method ENUM('cod','bank_transfer','momo','zalopay') NOT NULL,
        payment_status ENUM('unpaid','paid','refunded') DEFAULT 'unpaid',
        note TEXT DEFAULT NULL,
        admin_note TEXT DEFAULT NULL,
        shipped_at DATETIME DEFAULT NULL,
        delivered_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL,
        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
        INDEX idx_user (user_id),
        INDEX idx_status (status),
        INDEX idx_created (created_at)
    ) ENGINE=InnoDB;

    -- 8. ORDER ITEMS
    CREATE TABLE order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT,
        product_name VARCHAR(255) NOT NULL,
        product_sku VARCHAR(50) NOT NULL,
        unit_price DECIMAL(12,0) NOT NULL,
        quantity INT NOT NULL,
        total_price DECIMAL(12,0) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
        INDEX idx_order (order_id)
    ) ENGINE=InnoDB;

    -- 9. CART ITEMS
    CREATE TABLE cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_product (user_id, product_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    -- 10. WISHLIST
    CREATE TABLE wishlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_product (user_id, product_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    -- 11. REVIEWS
    CREATE TABLE reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        product_id INT NOT NULL,
        rating TINYINT NOT NULL CHECK(rating BETWEEN 1 AND 5),
        title VARCHAR(255) DEFAULT NULL,
        comment TEXT DEFAULT NULL,
        is_approved TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product_approved (product_id, is_approved)
    ) ENGINE=InnoDB;

    -- 12. CONTACT MESSAGES
    CREATE TABLE contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) DEFAULT NULL,
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('new','read','replied') DEFAULT 'new',
        admin_reply TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_status (status)
    ) ENGINE=InnoDB;

    -- 13. NEWSLETTER SUBSCRIBERS
    CREATE TABLE newsletter_subscribers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        user_id INT DEFAULT NULL,
        is_active TINYINT DEFAULT 1,
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        unsubscribed_at DATETIME DEFAULT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;

    -- 14. SITE SETTINGS
    CREATE TABLE site_settings (
        \`key\` VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        type ENUM('string','number','boolean','json') DEFAULT 'string'
    ) ENGINE=InnoDB;
    `);

    console.log('✅ Tables created (14 tables with indexes)');

    // ===== SEED DATA =====

    // Admin user (password: admin123)
    const adminHash = bcrypt.hashSync('admin123', 10);
    const userHash = bcrypt.hashSync('123456', 10);

    await conn.query(
        'INSERT INTO users (full_name, email, phone, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
        ['Admin MachauSilk', 'admin@machausilk.com', '0848543171', adminHash, 'admin', 1]
    );
    await conn.query(
        'INSERT INTO users (full_name, email, phone, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
        ['Nguyễn Văn A', 'a@email.com', '0901234567', userHash, 'customer', 1]
    );
    await conn.query(
        'INSERT INTO users (full_name, email, phone, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
        ['Trần Thị B', 'b@email.com', '0912345678', userHash, 'customer', 1]
    );
    await conn.query(
        'INSERT INTO users (full_name, email, phone, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
        ['Lê Minh C', 'c@email.com', '0923456789', userHash, 'customer', 0]
    );
    await conn.query(
        'INSERT INTO users (full_name, email, phone, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
        ['Phạm Hồng D', 'd@email.com', '0934567890', userHash, 'customer', 1]
    );
    console.log('✅ Users seeded (admin: admin@machausilk.com / admin123)');

    // Categories
    await conn.query("INSERT INTO categories (name, slug, sort_order) VALUES ('Lụa Tơ Tằm', 'lua-to-tam', 1)");
    await conn.query("INSERT INTO categories (name, slug, sort_order) VALUES ('Siêu Satin', 'sieu-satin', 2)");
    await conn.query("INSERT INTO categories (name, slug, sort_order) VALUES ('Hàng Độc Nhà Mã', 'hang-doc-nha-ma', 3)");
    console.log('✅ Categories seeded');

    // Products
    const insertProd = `INSERT INTO products
        (name, slug, sku, category_id, description, short_desc, price, original_price, stock_qty, material, badge, is_featured, sold_count, avg_rating, review_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await conn.query(insertProd, ['Lụa Hoa Văn Cúc Bạch', 'lua-hoa-van-cuc-bach', 'LHCB02', 1,
        'Lụa tơ tằm thiên nhiên với họa tiết cúc bạch tinh tế trên nền xanh nhạt. Chất liệu mềm mại, thoáng mát.',
        'Lụa tơ tằm họa tiết cúc bạch', 135000, 180000, 50, 'Tơ tằm 100%', 'bestseller', 1, 24, 4.5, 24]);

    await conn.query(insertProd, ['Lụa Hoa Văn Cúc Cành Nhuộm Xanh Rêu', 'lua-hoa-van-cuc-canh-nhuom-xanh-reu', 'LHCC01', 1,
        'Lụa tơ tằm với họa tiết hoa cúc cành nhuộm xanh rêu đặc trưng.',
        'Lụa tơ tằm cúc cành xanh rêu', 135000, null, 35, 'Tơ tằm 100%', null, 0, 18, 4.0, 18]);

    await conn.query(insertProd, ['Lụa Hoa Văn Cúc Xanh Lục', 'lua-hoa-van-cuc-xanh-luc', 'LHC33', 2,
        'Siêu satin cao cấp với họa tiết cúc xanh lục rực rỡ. Chống rạn, bền màu.',
        'Siêu satin cúc xanh lục', 135000, 165000, 40, 'Satin cao cấp', 'new', 1, 31, 5.0, 31]);

    await conn.query(insertProd, ['Lụa Hoa Văn Hỉ Tre', 'lua-hoa-van-hi-tre', 'LHVHT05', 3,
        'Mẫu lụa độc quyền với họa tiết hỉ tre tinh xảo - biểu tượng của sự phúc lộc.',
        'Lụa độc quyền hỉ tre', 185000, null, 20, 'Tơ tằm pha', 'exclusive', 1, 12, 4.5, 12]);

    await conn.query(insertProd, ['Lụa Hoa Văn Đuôi Công', 'lua-hoa-van-duoi-cong', 'LHDC05', 2,
        'Siêu satin chống rạn với họa tiết đuôi công truyền thống.',
        'Satin đuôi công truyền thống', 135000, null, 45, 'Satin cao cấp', null, 0, 9, 4.0, 9]);

    await conn.query(insertProd, ['Lụa Hoa Văn Tròn', 'lua-hoa-van-tron', 'LHDC04', 3,
        'Lụa cao cấp với họa tiết tròn độc đáo trên nền vàng cam sang trọng.',
        'Lụa họa tiết tròn độc đáo', 155000, 200000, 30, 'Tơ tằm pha', 'bestseller', 1, 27, 5.0, 27]);

    console.log('✅ Products seeded');

    // Product images
    for (let i = 1; i <= 6; i++) {
        await conn.query('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)', [i, `images/product${i}.jpg`]);
    }
    console.log('✅ Product images seeded');

    // Sample orders
    await conn.query(
        `INSERT INTO orders (order_code, user_id, subtotal, discount_amount, shipping_fee, total_amount, status, payment_method, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['MC-20260308-001', 2, 540000, 0, 0, 540000, 'pending', 'cod', 'unpaid', '2026-03-08 01:00:00']
    );
    await conn.query('INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, quantity, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [1, 1, 'Lụa Hoa Văn Cúc Bạch', 'LHCB02', 135000, 4, 540000]);

    await conn.query(
        `INSERT INTO orders (order_code, user_id, subtotal, discount_amount, shipping_fee, total_amount, status, payment_method, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['MC-20260307-003', 3, 370000, 0, 30000, 370000, 'confirmed', 'bank_transfer', 'paid', '2026-03-07 14:30:00']
    );
    await conn.query('INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, quantity, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [2, 3, 'Lụa Hoa Văn Cúc Xanh Lục', 'LHC33', 135000, 2, 270000]);
    await conn.query('INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, quantity, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [2, 5, 'Lụa Hoa Văn Đuôi Công', 'LHDC05', 135000, 1, 135000]);

    await conn.query(
        `INSERT INTO orders (order_code, user_id, subtotal, discount_amount, shipping_fee, total_amount, status, payment_method, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['MC-20260307-002', 4, 810000, 0, 0, 810000, 'shipping', 'momo', 'paid', '2026-03-07 10:15:00']
    );
    await conn.query('INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, quantity, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [3, 4, 'Lụa Hoa Văn Hỉ Tre', 'LHVHT05', 185000, 2, 370000]);
    await conn.query('INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, quantity, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [3, 6, 'Lụa Hoa Văn Tròn', 'LHDC04', 155000, 2, 310000]);
    await conn.query('INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, quantity, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [3, 1, 'Lụa Hoa Văn Cúc Bạch', 'LHCB02', 135000, 1, 135000]);

    await conn.query(
        `INSERT INTO orders (order_code, user_id, subtotal, discount_amount, shipping_fee, total_amount, status, payment_method, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['MC-20260306-001', 5, 270000, 0, 30000, 270000, 'delivered', 'cod', 'paid', '2026-03-06 08:00:00']
    );
    await conn.query('INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, quantity, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [4, 1, 'Lụa Hoa Văn Cúc Bạch', 'LHCB02', 135000, 2, 270000]);

    await conn.query(
        `INSERT INTO orders (order_code, user_id, subtotal, discount_amount, shipping_fee, total_amount, status, payment_method, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['MC-20260305-002', 2, 450000, 0, 30000, 450000, 'delivered', 'zalopay', 'paid', '2026-03-05 16:45:00']
    );
    await conn.query('INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, quantity, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [5, 6, 'Lụa Hoa Văn Tròn', 'LHDC04', 155000, 2, 310000]);
    await conn.query('INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, quantity, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [5, 5, 'Lụa Hoa Văn Đuôi Công', 'LHDC05', 135000, 1, 135000]);

    console.log('✅ Orders seeded');

    // Contact messages
    await conn.query("INSERT INTO contact_messages (name, phone, email, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ['Nguyễn Văn A', '0901234567', 'a@email.com', 'Tư vấn sản phẩm', 'Tôi muốn hỏi về lụa tơ tằm cho áo dài cưới.', 'new', '2026-03-08 00:30:00']);
    await conn.query("INSERT INTO contact_messages (name, phone, email, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ['Trần Thị B', '0912345678', 'b@email.com', 'Đơn hàng', 'Đơn hàng MC-20260307-003 khi nào giao?', 'new', '2026-03-07 15:00:00']);
    await conn.query("INSERT INTO contact_messages (name, phone, email, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ['Lê Minh C', '0923456789', 'c@email.com', 'Hợp tác', 'Tôi muốn hợp tác phân phối lụa Mã Châu tại Hà Nội.', 'read', '2026-03-06 11:00:00']);
    await conn.query("INSERT INTO contact_messages (name, phone, email, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ['Phạm Hồng D', '0934567890', 'd@email.com', 'Khiếu nại', 'Sản phẩm nhận được bị khác màu so với hình.', 'replied', '2026-03-05 08:30:00']);
    console.log('✅ Contact messages seeded');

    // Newsletter
    await conn.query("INSERT INTO newsletter_subscribers (email) VALUES (?)", ['a@email.com']);
    await conn.query("INSERT INTO newsletter_subscribers (email) VALUES (?)", ['b@email.com']);
    await conn.query("INSERT INTO newsletter_subscribers (email) VALUES (?)", ['test@example.com']);
    console.log('✅ Newsletter subscribers seeded');

    // Reviews
    await conn.query('INSERT INTO reviews (user_id, product_id, rating, title, comment, is_approved) VALUES (?, ?, ?, ?, ?, ?)',
        [2, 1, 5, 'Rất đẹp!', 'Lụa mềm mại, mịn màng. Rất hài lòng.', 1]);
    await conn.query('INSERT INTO reviews (user_id, product_id, rating, title, comment, is_approved) VALUES (?, ?, ?, ?, ?, ?)',
        [3, 1, 4, 'Chất lượng tốt', 'Hoa văn tinh xảo, giá hợp lý.', 1]);
    await conn.query('INSERT INTO reviews (user_id, product_id, rating, title, comment, is_approved) VALUES (?, ?, ?, ?, ?, ?)',
        [4, 3, 5, 'Tuyệt vời', 'Satin chống rạn thật sự bền, màu đẹp lắm.', 1]);
    await conn.query('INSERT INTO reviews (user_id, product_id, rating, title, comment, is_approved) VALUES (?, ?, ?, ?, ?, ?)',
        [5, 6, 5, 'Độc đáo', 'Mẫu rất đặc biệt, ai cũng khen.', 1]);
    console.log('✅ Reviews seeded');

    await conn.end();
    console.log('\n🎉 MySQL database seeded successfully!');
}

seed().catch(err => {
    console.error('❌ Seed error:', err);
    process.exit(1);
});
