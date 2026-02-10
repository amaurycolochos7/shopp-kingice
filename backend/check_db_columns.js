const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'kingice',
    password: 'kingice2026',
    database: 'kingicegold',
    ssl: false
});

async function run() {
    await client.connect();
    const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'orders'
  `);
    console.log('Columns in orders table:', res.rows.map(r => r.column_name));
    await client.end();
}

run();
