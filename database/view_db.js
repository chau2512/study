const path = require('path');
const Database = require(path.join(__dirname, '..', 'backend', 'node_modules', 'better-sqlite3'));
const db = new Database(path.join(__dirname, 'machausilk.db'));

// List tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('========================================');
console.log('  MACHAUSILK DATABASE — SQLite');
console.log('========================================');
console.log('\n📋 TABLES:');
tables.forEach(t => {
    const count = db.prepare('SELECT COUNT(*) as c FROM ' + t.name).get();
    console.log('  ' + t.name + ': ' + count.c + ' rows');
});

console.log('\n👤 USERS:');
console.table(db.prepare('SELECT id, full_name, email, phone, role, is_active FROM users').all());

console.log('\n📁 CATEGORIES:');
console.table(db.prepare('SELECT id, name, slug, sort_order FROM categories').all());

console.log('\n📦 PRODUCTS:');
console.table(db.prepare('SELECT id, name, sku, price, original_price, stock_qty, sold_count, badge FROM products').all());

console.log('\n🛒 ORDERS:');
console.table(db.prepare('SELECT id, order_code, user_id, total_amount, status, payment_method, created_at FROM orders').all());

console.log('\n📧 CONTACT MESSAGES:');
console.table(db.prepare('SELECT id, name, subject, status, created_at FROM contact_messages').all());

console.log('\n⭐ REVIEWS:');
console.table(db.prepare('SELECT id, user_id, product_id, rating, title FROM reviews').all());

console.log('\n📰 NEWSLETTER SUBSCRIBERS:');
console.table(db.prepare('SELECT id, email, is_active FROM newsletter_subscribers').all());

db.close();
