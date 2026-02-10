const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    host: '187.77.11.79', // Remote IP
    port: 5432,           // Exposed port
    user: 'kingice',
    password: 'kingice2026', // From dokploy_projects.json or known credentials
    database: 'kingicegold',
    ssl: false // Usually local dev setup might not enforce SSL, or if it does, it might be self-signed. Dokploy default often doesn't enforce strict SSL for direct port access unless configured.
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to remote database successfully.');

        const sqlPath = path.join(__dirname, '../database/schema_updates.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Reading schema updates...');
        console.log(sql);

        console.log('Executing schema updates...');
        await client.query(sql);

        console.log('✅ Schema updates applied successfully.');
    } catch (err) {
        console.error('❌ Error applying schema:', err);
    } finally {
        await client.end();
    }
}

run();
