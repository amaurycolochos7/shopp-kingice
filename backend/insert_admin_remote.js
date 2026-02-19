const { Client } = require('pg');
const bcrypt = require('bcryptjs');

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

        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash('kingice2026', salt);

        await client.query(`
      INSERT INTO admins (username, password_hash, email, role)
      VALUES ($1, $2, $3, $4)
    `, ['admin', hash, 'admin@kingicegold.com', 'superadmin']);

        console.log('✅ Admin user created successfully.');
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

run();
