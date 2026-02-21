/**
 * Migration: Add password_hash column to customers table for customer auth
 */
const { Client } = require('pg');

const client = new Client({
    host: '187.77.11.79',
    port: 5432,
    user: 'kingice',
    password: 'kingice2026',
    database: 'kingicegold',
    ssl: false
});

async function run() {
    try {
        await client.connect();
        console.log('✅ Connected to remote DB');

        // Check current columns
        const { rows: cols } = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'customers' 
            ORDER BY ordinal_position
        `);
        console.log('📋 Current customers columns:', cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));

        // Add password_hash if not exists
        const hasPassword = cols.some(c => c.column_name === 'password_hash');
        if (!hasPassword) {
            await client.query('ALTER TABLE customers ADD COLUMN password_hash VARCHAR(255)');
            console.log('✅ Added password_hash column to customers table');
        } else {
            console.log('ℹ️  password_hash column already exists');
        }

        // Verify
        const { rows: verifyRows } = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'customers' AND column_name = 'password_hash'
        `);
        console.log('✅ Verification:', verifyRows);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

run();
