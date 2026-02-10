/**
 * Database Configuration — Direct PostgreSQL connection via pg
 */
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Fallback to individual vars if DATABASE_URL not set
    host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || 'localhost'),
    port: process.env.DATABASE_URL ? undefined : (process.env.DB_PORT || 5432),
    database: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME || 'kingicegold'),
    user: process.env.DATABASE_URL ? undefined : (process.env.DB_USER || 'postgres'),
    password: process.env.DATABASE_URL ? undefined : (process.env.DB_PASSWORD || 'postgres'),
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.query('SELECT NOW()')
    .then(() => console.log('✅ Conectado a PostgreSQL'))
    .catch(err => {
        console.error('❌ Error conectando a PostgreSQL:', err.message);
        // Don't exit — let the app start and retry on each request
    });

/**
 * Helper: Execute a query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<{rows: Array, rowCount: number}>}
 */
async function query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
        console.log('📊 Query:', { text: text.substring(0, 80), duration: `${duration}ms`, rows: res.rowCount });
    }
    return res;
}

/**
 * Helper: Get a client from pool (for transactions)
 */
async function getClient() {
    return await pool.connect();
}

module.exports = { pool, query, getClient };
