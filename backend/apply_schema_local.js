const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'kingice',
    password: 'kingice2026',
    database: 'kingicegold',
    ssl: false
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to local database successfully.');

        // Read schema file
        const sqlPath = path.join(__dirname, '../database/schema_updates.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Reading schema updates...');

        // Execute multiple statements
        await client.query(sql);

        console.log('✅ Local schema updates applied successfully.');
    } catch (err) {
        console.error('❌ Error applying local schema:', err);
    } finally {
        await client.end();
    }
}

run();
