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
        const res = await client.query("SELECT * FROM admins WHERE username = 'admin'");
        if (res.rows.length > 0) {
            console.log('✅ Admin user exists.');
        } else {
            console.log('❌ Admin user DOES NOT exist.');
        }
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

run();
