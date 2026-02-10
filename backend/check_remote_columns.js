const { Client } = require('pg');

const client = new Client({
    host: '187.77.11.79', // Remote IP
    port: 5432,
    user: 'kingice',
    password: 'kingice2026',
    database: 'kingicegold',
    ssl: false
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to remote DB.');
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `);
        const columns = res.rows.map(r => r.column_name);
        console.log('Columns in REMOTE orders table:', columns);

        const required = ['source', 'whatsapp_message', 'intent_confirmed_at'];
        const missing = required.filter(c => !columns.includes(c));

        if (missing.length > 0) {
            console.error('❌ MISSING COLUMNS:', missing);
            process.exit(1);
        } else {
            console.log('✅ All required columns present.');
        }
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

run();
