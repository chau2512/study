const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'database', 'machausilk.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('✅ SQLite database connected:', DB_PATH);

// MySQL-compatible wrapper so route files need minimal changes
// mysql2: const [rows] = await db.query(sql, params) → rows is an array
// This wrapper returns same format: [rows] for SELECT, [{ insertId, affectedRows }] for INSERT/UPDATE/DELETE
module.exports = {
    query(sql, params = []) {
        // Convert MySQL-style ? placeholders — SQLite also uses ? so no conversion needed
        const trimmed = sql.trim().toUpperCase();
        const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('SHOW') || trimmed.startsWith('PRAGMA');

        if (isSelect) {
            const stmt = db.prepare(sql);
            const rows = stmt.all(...params);
            return [rows];
        } else {
            const stmt = db.prepare(sql);
            const result = stmt.run(...params);
            return [{ insertId: result.lastInsertRowid, affectedRows: result.changes }];
        }
    },

    // Transaction support (mimics MySQL pool.getConnection())
    getConnection() {
        return {
            query: (sql, params = []) => module.exports.query(sql, params),
            beginTransaction: () => db.exec('BEGIN'),
            commit: () => db.exec('COMMIT'),
            rollback: () => db.exec('ROLLBACK'),
            release: () => { /* no-op for SQLite */ }
        };
    },

    // Direct access to the raw db instance
    raw: db
};
