const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'machausilk',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// Test connection on startup
pool.getConnection()
    .then(conn => {
        console.log('✅ MySQL database connected:', process.env.DB_NAME || 'machausilk');
        conn.release();
    })
    .catch(err => {
        console.error('❌ MySQL connection error:', err.message);
    });

// Sanitize params: convert undefined to null (mysql2 rejects undefined)
function sanitize(params) {
    return params.map(p => p === undefined ? null : p);
}

module.exports = {
    async query(sql, params = []) {
        const [rows] = await pool.query(sql, sanitize(params));
        return [rows];
    },

    async getConnection() {
        const conn = await pool.getConnection();
        return {
            query: async (sql, params = []) => {
                const [rows] = await conn.query(sql, sanitize(params));
                return [rows];
            },
            beginTransaction: () => conn.beginTransaction(),
            commit: () => conn.commit(),
            rollback: () => conn.rollback(),
            release: () => conn.release()
        };
    },

    raw: pool
};
