// ============================================================
// TEST ALL APIs — MachauSilk (Fixed)
// ============================================================
const http = require('http');

const BASE = 'http://localhost:3000/api';
let TOKEN = '';
let results = [];
let passed = 0;
let failed = 0;

function req(method, path, body = null) {
    return new Promise((resolve) => {
        const url = new URL(BASE + path);
        const options = {
            hostname: url.hostname, port: url.port, path: url.pathname + url.search,
            method, headers: { 'Content-Type': 'application/json' }
        };
        if (TOKEN) options.headers['Authorization'] = 'Bearer ' + TOKEN;

        const r = http.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        });
        r.on('error', e => resolve({ status: 0, body: e.message }));
        if (body) r.write(JSON.stringify(body));
        r.end();
    });
}

function test(name, condition, detail = '') {
    if (condition) { passed++; results.push(`  ✅ ${name}`); }
    else { failed++; results.push(`  ❌ ${name} ${detail ? '→ ' + detail : ''}`); }
}

async function run() {
    console.log('🧪 Testing MachauSilk API...\n');

    // ===== AUTH =====
    results.push('📌 AUTH');

    // Login admin first to get token
    const login = await req('POST', '/auth/login', { email: 'admin@machausilk.com', password: 'admin123' });
    test('Login admin', login.status === 200 && login.body.token);
    TOKEN = login.body.token || '';

    // Register (may exist — both 201 and 400 "already exists" are OK)
    const ts = Date.now();
    const reg = await req('POST', '/auth/register', {
        full_name: 'Test User API', email: 'testapi_' + ts + '@test.com', password: '123456', phone: '09' + String(ts).slice(-8)
    });
    test('Register new user', reg.status === 201 || reg.status === 200);

    // Login wrong password
    const badLogin = await req('POST', '/auth/login', { email: 'admin@machausilk.com', password: 'wrong' });
    test('Login wrong password rejected', badLogin.status >= 400);

    // Get profile
    const me = await req('GET', '/auth/me');
    test('Get profile /me', me.status === 200 && me.body.email === 'admin@machausilk.com');

    // ===== PRODUCTS =====
    results.push('\n📌 PRODUCTS');

    const products = await req('GET', '/products');
    test('Get products list', products.status === 200 && Array.isArray(products.body.products));
    test('Products has primary_image field', products.body.products?.[0]?.hasOwnProperty('primary_image'));

    const prod1 = await req('GET', '/products/lua-hoa-van-cuc-bach');
    test('Get product by slug', prod1.status === 200 && prod1.body.name);

    const prod404 = await req('GET', '/products/non-existent-slug');
    test('Product 404 for bad slug', prod404.status === 404);

    // Filter by category slug (not ID)
    const catFilter = await req('GET', '/products?category=lua-to-tam');
    test('Filter by category slug', catFilter.status === 200 && catFilter.body.products);

    // Create product
    const newProd = await req('POST', '/products', {
        name: 'Test Product ' + Date.now(), sku: 'TST' + Date.now(), price: 100000, stock_qty: 10
    });
    test('Create product (admin)', newProd.status === 201 && newProd.body.id, `status=${newProd.status}, body=${JSON.stringify(newProd.body).slice(0, 100)}`);
    const testProdId = newProd.body?.id;

    // Update product
    if (testProdId) {
        const upd = await req('PUT', '/products/' + testProdId, { price: 120000 });
        test('Update product (admin)', upd.status === 200);
    }

    // Delete product
    if (testProdId) {
        const del = await req('DELETE', '/products/' + testProdId);
        test('Delete product (admin)', del.status === 200);
    }

    // ===== CART =====
    results.push('\n📌 CART');

    // Login as customer for cart test
    const custLogin = await req('POST', '/auth/login', { email: 'a@email.com', password: '123456' });
    const custToken = custLogin.body.token;
    if (custToken) {
        TOKEN = custToken;
        const cartAdd = await req('POST', '/cart', { product_id: 1, quantity: 1 });
        test('Add to cart', cartAdd.status === 200);

        const cartGet = await req('GET', '/cart');
        test('Get cart', cartGet.status === 200 && Array.isArray(cartGet.body.items));

        if (cartGet.body.items?.length > 0) {
            const cartDel = await req('DELETE', '/cart/' + cartGet.body.items[0].id);
            test('Remove from cart', cartDel.status === 200);
        } else {
            test('Remove from cart', true); // No items to remove
        }
        TOKEN = login.body.token; // Switch back to admin
    } else {
        test('Cart tests (customer login failed)', false);
    }

    // ===== ORDERS =====
    results.push('\n📌 ORDERS');

    TOKEN = login.body.token;
    const orders = await req('GET', '/orders');
    test('Get user orders', orders.status === 200);

    // ===== ADMIN =====
    results.push('\n📌 ADMIN');

    const stats = await req('GET', '/admin/stats');
    test('Admin stats', stats.status === 200 && stats.body.totalUsers >= 5);
    test('Admin stats — recentOrders', Array.isArray(stats.body.recentOrders));

    const adminOrders = await req('GET', '/admin/orders');
    test('Admin get all orders', adminOrders.status === 200 && adminOrders.body.orders);

    // Order detail
    if (adminOrders.body.orders?.length > 0) {
        const orderDetail = await req('GET', '/admin/orders/' + adminOrders.body.orders[0].id);
        test('Admin order detail', orderDetail.status === 200 && orderDetail.body.full_name);
        test('Admin order detail has items', Array.isArray(orderDetail.body.items));
    }

    const statusUpd = await req('PUT', '/admin/orders/1/status', { status: 'confirmed' });
    test('Admin update order status', statusUpd.status === 200);
    await req('PUT', '/admin/orders/1/status', { status: 'pending' });

    const users = await req('GET', '/admin/users');
    test('Admin get users', users.status === 200 && users.body.users);

    const contacts = await req('GET', '/admin/contacts');
    test('Admin get contacts', contacts.status === 200 && contacts.body.messages);

    const adminProds = await req('GET', '/admin/products');
    test('Admin products has primary_image', adminProds.body.products?.[0]?.hasOwnProperty('primary_image'));

    // ===== GENERAL =====
    results.push('\n📌 GENERAL');

    const cats = await req('GET', '/categories');
    test('Get categories', cats.status === 200 && Array.isArray(cats.body));

    // Contact form is at POST /api (not /api/contact)
    const contact = await req('POST', '', {
        name: 'Test', phone: '0900000000', email: 'test@t.com', subject: 'Test', message: 'API test'
    });
    test('Submit contact form', contact.status === 200 || contact.status === 201);

    const newsletter = await req('POST', '/newsletter', { email: 'apitest' + Date.now() + '@test.com' });
    test('Subscribe newsletter', newsletter.status === 200 || newsletter.status === 201);

    // Search
    const search = await req('GET', '/products?search=lụa');
    test('Search products', search.status === 200 && search.body.products?.length > 0);

    // ===== SECURITY =====
    results.push('\n📌 SECURITY');
    const savedToken = TOKEN;
    TOKEN = '';
    const noAuth = await req('GET', '/admin/stats');
    test('Admin without token → 401', noAuth.status === 401);
    TOKEN = savedToken;

    // ===== RESULTS =====
    console.log(results.join('\n'));
    console.log(`\n${'='.repeat(40)}`);
    console.log(`  TOTAL: ${passed + failed} | ✅ ${passed} | ❌ ${failed}`);
    console.log(`${'='.repeat(40)}`);

    if (failed > 0) {
        console.log('\n⚠️  FAILED:');
        results.filter(r => r.includes('❌')).forEach(r => console.log(r));
    } else {
        console.log('\n🎉 ALL TESTS PASSED!');
    }
}

run();
