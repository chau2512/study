-- ============================================================
-- MACHAUSILK - SEED DATA
-- Dữ liệu mẫu cho development
-- ============================================================

USE machausilk;

-- ===== CATEGORIES =====
INSERT INTO categories (name, slug, description, sort_order) VALUES
('Siêu Satin Trơn Chống Rạn', 'sieu-satin', 'Chất liệu siêu satin cao cấp, chống rạn, bền màu', 1),
('Lụa 100% Tơ Tằm', 'lua-to-tam', 'Lụa tơ tằm thiên nhiên 100%, mềm mại, thoáng mát', 2),
('Hàng Độc Nhà Mã', 'hang-doc', 'Sản phẩm độc quyền, giới hạn, chỉ có tại Lụa Mã Châu', 3);

-- ===== PRODUCTS =====
INSERT INTO products (category_id, name, slug, sku, description, price, original_price, stock_qty, material, badge, is_featured) VALUES
(2, 'Lụa Hoa Văn Cúc Bạch', 'lua-cuc-bach', 'LHCB02',
 'Lụa tơ tằm thiên nhiên với họa tiết cúc bạch tinh tế trên nền xanh nhạt. Chất liệu mềm mại, thoáng mát, phù hợp may áo dài, khăn quàng cổ và phụ kiện thời trang cao cấp.',
 135000, 180000, 50, '100% Tơ tằm', 'bestseller', TRUE),

(2, 'Lụa Hoa Văn Cúc Cành Nhuộm Xanh Rêu', 'lua-cuc-canh-xanh-reu', 'LHCC01',
 'Lụa tơ tằm với họa tiết hoa cúc cành nhuộm xanh rêu đặc trưng. Chất liệu mềm mại, bền màu, thích hợp cho trang phục truyền thống và hiện đại.',
 135000, NULL, 30, '100% Tơ tằm', 'new', TRUE),

(1, 'Lụa Hoa Văn Cúc Xanh Lục', 'lua-cuc-xanh-luc', 'LHC33',
 'Siêu satin cao cấp với họa tiết cúc xanh lục rực rỡ. Chống rạn, bền màu, thích hợp cho trang phục truyền thống và hiện đại.',
 135000, 165000, 45, 'Siêu Satin', NULL, TRUE),

(3, 'Lụa Hoa Văn Hỉ Tre', 'lua-hi-tre', 'LHVHT05',
 'Mẫu lụa độc quyền với họa tiết hỉ tre tinh xảo - biểu tượng của sự phúc lộc. Sản phẩm giới hạn, chỉ có tại Lụa Mã Châu.',
 185000, NULL, 15, 'Lụa cao cấp', 'exclusive', TRUE),

(1, 'Lụa Hoa Văn Đuôi Công', 'lua-duoi-cong', 'LHDC05',
 'Siêu satin chống rạn với họa tiết đuôi công truyền thống. Biểu tượng của sự kiên cường và thanh cao.',
 135000, NULL, 40, 'Siêu Satin', NULL, TRUE),

(3, 'Lụa Hoa Văn Tròn', 'lua-hoa-van-tron', 'LHDC04',
 'Lụa cao cấp với họa tiết tròn độc đáo trên nền vàng cam sang trọng. Sản phẩm độc quyền phù hợp cho những người yêu thích sự khác biệt.',
 155000, 200000, 20, 'Lụa cao cấp', 'new', TRUE);

-- ===== PRODUCT IMAGES =====
INSERT INTO product_images (product_id, image_url, alt_text, is_primary) VALUES
(1, 'images/product1.jpg', 'Lụa Hoa Văn Cúc Bạch', TRUE),
(2, 'images/product2.jpg', 'Lụa Hoa Văn Cúc Cành Nhuộm Xanh Rêu', TRUE),
(3, 'images/product3.jpg', 'Lụa Hoa Văn Cúc Xanh Lục', TRUE),
(4, 'images/product4.jpg', 'Lụa Hoa Văn Hỉ Tre', TRUE),
(5, 'images/product5.jpg', 'Lụa Hoa Văn Đuôi Công', TRUE),
(6, 'images/product6.jpg', 'Lụa Hoa Văn Tròn', TRUE);

-- ===== ADMIN USER =====
-- Password: admin123 (bcrypt hash)
INSERT INTO users (full_name, email, phone, password_hash, role, is_active, email_verified) VALUES
('Admin Mã Châu', 'admin@machausilk.com', '0979003511',
 '$2b$10$YourBcryptHashHere', 'admin', TRUE, TRUE);

-- ===== SITE SETTINGS =====
INSERT INTO site_settings (`key`, value, type) VALUES
('site_name', 'Lụa Mã Châu', 'string'),
('site_tagline', 'Tinh Hoa Tơ Tằm Truyền Thống', 'string'),
('phone', '0979.003.511', 'string'),
('email', 'machausilk@gmail.com', 'string'),
('address', '211 Trương Chí Cương, Nam Phước, Duy Xuyên, Quảng Nam', 'string'),
('working_hours', 'Thứ 2 - Chủ nhật: 7:00 - 21:00', 'string'),
('free_shipping_min', '500000', 'number'),
('currency', 'VND', 'string'),
('facebook_url', 'https://facebook.com/machausilk', 'string'),
('instagram_url', 'https://instagram.com/machausilk', 'string');

-- ===== SAMPLE COUPON =====
INSERT INTO coupons (code, type, value, min_order, max_discount, usage_limit, starts_at, expires_at) VALUES
('MACHAU10', 'percent', 10, 300000, 50000, 100, '2026-01-01', '2026-12-31'),
('FREESHIP', 'fixed', 30000, 200000, NULL, 50, '2026-01-01', '2026-06-30');
