/**
 * Seed Script — Initialize database with default data
 * Run: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query } = require('../config/database');

async function seed() {
    console.log('🌱 Iniciando seed de la base de datos...\n');

    try {
        // Check if admin already exists
        const { rows: existingAdmins } = await query(
            'SELECT id FROM admins WHERE username = $1', ['admin']
        );

        if (existingAdmins.length > 0) {
            console.log('⚠️  Admin ya existe, actualizando contraseña...');
            const salt = await bcrypt.genSalt(12);
            const hash = await bcrypt.hash('kingice2026', salt);
            await query('UPDATE admins SET password_hash = $1 WHERE username = $2', [hash, 'admin']);
        } else {
            console.log('👤 Creando admin por defecto...');
            const salt = await bcrypt.genSalt(12);
            const hash = await bcrypt.hash('kingice2026', salt);
            await query(`
        INSERT INTO admins (username, password_hash, email, role)
        VALUES ($1, $2, $3, $4)
      `, ['admin', hash, 'admin@kingicegold.com', 'superadmin']);
        }

        console.log('   ✅ Admin: admin / kingice2026\n');

        // Check if categories exist
        const { rows: existingCats } = await query('SELECT COUNT(*)::int AS count FROM categories');

        if (parseInt(existingCats[0].count) === 0) {
            console.log('📂 Creando categorías...');
            await query(`
        INSERT INTO categories (name, slug, display_order, active) VALUES
        ('Cadenas', 'cadenas', 1, TRUE),
        ('Anillos', 'anillos', 2, TRUE),
        ('Aretes', 'aretes', 3, TRUE),
        ('Pulsos', 'pulsos', 4, TRUE),
        ('Dijes', 'dijes', 5, TRUE),
        ('Relojes', 'relojes', 6, TRUE)
      `);
            console.log('   ✅ 6 categorías creadas\n');
        } else {
            console.log(`📂 Categorías ya existen (${existingCats[0].count})\n`);
        }

        // Check if products exist
        const { rows: existingProds } = await query('SELECT COUNT(*)::int AS count FROM products');

        if (parseInt(existingProds[0].count) === 0) {
            console.log('🏷️  Creando productos de ejemplo...');
            await query(`
        INSERT INTO products (category_id, name, slug, description, base_price, active, featured) VALUES
        (1, 'Cadena de Oro Torzal Pavé', 'cadena-oro-torzal-pave', 'Elegante cadena de oro amarillo estilo torzal pavé. Acabado brillante de alta calidad.', 27838.20, TRUE, TRUE),
        (1, 'Cadena Tejido Hollow Box', 'cadena-tejido-hollow-box', 'Cadena de oro con tejido hollow box. Diseño moderno y versátil.', 10374.00, TRUE, TRUE),
        (2, 'Anillo Solitario Diamante', 'anillo-solitario-diamante', 'Anillo solitario con diamante central de alta calidad.', 15500.00, TRUE, TRUE),
        (3, 'Aretes de Oro Huggie', 'aretes-oro-huggie', 'Aretes estilo huggie en oro amarillo. Elegantes y cómodos.', 4500.00, TRUE, TRUE),
        (4, 'Pulsera Cubana', 'pulsera-cubana', 'Pulsera estilo cubano en oro. Look urbano y moderno.', 18900.00, TRUE, TRUE),
        (5, 'Dije Cruz San Benito', 'dije-cruz-san-benito', 'Dije de cruz San Benito en oro. Símbolo de protección.', 3200.00, TRUE, TRUE)
      `);

            // Add product options
            await query(`
        INSERT INTO product_options (product_id, option_name, option_values, display_order) VALUES
        (1, 'medida', '["45cm", "50cm", "55cm", "60cm"]', 1),
        (1, 'kilataje', '["10k", "14k"]', 2),
        (2, 'medida', '["45cm", "50cm", "55cm", "60cm"]', 1),
        (2, 'kilataje', '["10k", "14k"]', 2),
        (3, 'talla', '["6", "7", "8", "9", "10"]', 1),
        (3, 'kilataje', '["10k", "14k"]', 2),
        (4, 'kilataje', '["10k", "14k"]', 1),
        (5, 'medida', '["18cm", "20cm", "22cm"]', 1),
        (5, 'kilataje', '["10k", "14k"]', 2),
        (6, 'tamaño', '["Pequeño", "Mediano", "Grande"]', 1),
        (6, 'kilataje', '["10k", "14k"]', 2)
      `);

            console.log('   ✅ 6 productos con opciones creados\n');
        } else {
            console.log(`🏷️  Productos ya existen (${existingProds[0].count})\n`);
        }

        console.log('🎉 Seed completado exitosamente!');
    } catch (err) {
        console.error('❌ Error en seed:', err.message);
        throw err;
    } finally {
        await pool.end();
    }
}

seed().catch(() => process.exit(1));
