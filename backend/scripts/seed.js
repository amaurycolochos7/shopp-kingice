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
        // ─── Admin ───
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

        // ─── Categories (8) ───
        const { rows: existingCats } = await query('SELECT COUNT(*)::int AS count FROM categories');

        if (parseInt(existingCats[0].count) === 0) {
            console.log('📂 Creando categorías...');
            await query(`
        INSERT INTO categories (name, slug, image, display_order, active) VALUES
        ('Cadenas', 'cadenas', 'images/categories/cadenas.webp', 1, TRUE),
        ('Anillos', 'anillos', 'images/categories/anillos.webp', 2, TRUE),
        ('Aretes', 'aretes', 'images/categories/aretes.webp', 3, TRUE),
        ('Pulsos', 'pulsos', 'images/categories/pulsos.webp', 4, TRUE),
        ('Dijes', 'dijes', 'images/categories/dijes.webp', 5, TRUE),
        ('Relojes', 'relojes', 'images/categories/relojes.webp', 6, TRUE),
        ('Religiosos', 'religiosos', 'images/categories/religiosos.webp', 7, TRUE),
        ('Diamantes', 'diamantes', 'images/categories/diamantes.webp', 8, TRUE)
      `);
            console.log('   ✅ 8 categorías creadas\n');
        } else {
            console.log(`📂 Categorías ya existen (${existingCats[0].count})\n`);
        }

        // ─── Products (24) ───
        const { rows: existingProds } = await query('SELECT COUNT(*)::int AS count FROM products');

        if (parseInt(existingProds[0].count) === 0) {
            console.log('🏷️  Creando productos...');

            // Get category IDs
            const { rows: cats } = await query('SELECT id, slug FROM categories ORDER BY display_order');
            const catMap = {};
            cats.forEach(c => catMap[c.slug] = c.id);

            const products = [
                // Cadenas (4)
                { cat: 'cadenas', name: 'Cadena Torzal Pavé', slug: 'cadena-torzal-pave', desc: 'Elegante cadena de oro estilo torzal pavé. Acabado brillante premium.', price: 27838.20, img: 'images/products/cadena-torzal.webp' },
                { cat: 'cadenas', name: 'Cadena Hollow Box', slug: 'cadena-hollow-box', desc: 'Cadena de oro con tejido hollow box. Diseño moderno y versátil.', price: 10374.00, img: 'images/products/cadena-hollow.webp' },
                { cat: 'cadenas', name: 'Cadena Cubana', slug: 'cadena-cubana', desc: 'Cadena cubana de oro macizo. Estilo urbano y elegante.', price: 35990.00, img: 'images/products/cadena-cubana.webp' },
                { cat: 'cadenas', name: 'Cadena Cartier', slug: 'cadena-cartier', desc: 'Cadena estilo Cartier en oro. Look clásico y sofisticado.', price: 22500.00, img: 'images/products/cadena-cartier.webp' },

                // Anillos (3)
                { cat: 'anillos', name: 'Anillo Solitario Diamante', slug: 'anillo-solitario-diamante', desc: 'Anillo solitario con diamante central de alta calidad.', price: 15500.00, img: 'images/products/anillo-solitario.webp' },
                { cat: 'anillos', name: 'Anillo Banda Oro', slug: 'anillo-banda-oro', desc: 'Anillo banda en oro amarillo pulido. Perfecto como alianza.', price: 6200.00, img: 'images/products/anillo-banda.webp' },
                { cat: 'anillos', name: 'Anillo Signet', slug: 'anillo-signet', desc: 'Anillo tipo signet en oro con acabado mate. Estilo masculino.', price: 9800.00, img: 'images/products/anillo-signet.webp' },

                // Aretes (3)
                { cat: 'aretes', name: 'Aretes Huggie Oro', slug: 'aretes-huggie-oro', desc: 'Aretes estilo huggie en oro amarillo. Elegantes y cómodos.', price: 4500.00, img: 'images/products/aretes-huggie.webp' },
                { cat: 'aretes', name: 'Aretes Argolla', slug: 'aretes-argolla', desc: 'Aretes de argolla en oro. Clásicos y versátiles.', price: 5800.00, img: 'images/products/aretes-argolla.webp' },
                { cat: 'aretes', name: 'Aretes Diamante', slug: 'aretes-diamante', desc: 'Aretes con incrustación de diamante. Brillo excepcional.', price: 12900.00, img: 'images/products/aretes-diamante.webp' },

                // Pulsos (3)
                { cat: 'pulsos', name: 'Pulsera Cubana', slug: 'pulsera-cubana', desc: 'Pulsera cubana de oro. Look urbano y moderno.', price: 18900.00, img: 'images/products/pulso-cubano.webp' },
                { cat: 'pulsos', name: 'Pulsera Cartier', slug: 'pulsera-cartier', desc: 'Pulsera estilo Cartier Love en oro. Icónica y atemporal.', price: 24500.00, img: 'images/products/pulso-cartier.webp' },
                { cat: 'pulsos', name: 'Pulsera Tennis', slug: 'pulsera-tennis', desc: 'Pulsera tennis con zirconias. Elegancia pura.', price: 16800.00, img: 'images/products/pulso-tennis.webp' },

                // Dijes (3)
                { cat: 'dijes', name: 'Dije Cruz San Benito', slug: 'dije-cruz-san-benito', desc: 'Dije de cruz San Benito en oro. Símbolo de protección.', price: 3200.00, img: 'images/products/dije-san-benito.webp' },
                { cat: 'dijes', name: 'Dije Corazón', slug: 'dije-corazon', desc: 'Dije de corazón en oro con acabado brillante.', price: 2800.00, img: 'images/products/dije-corazon.webp' },
                { cat: 'dijes', name: 'Dije Inicial', slug: 'dije-inicial', desc: 'Dije con inicial personalizada en oro 14k.', price: 3500.00, img: 'images/products/dije-inicial.webp' },

                // Relojes (3)
                { cat: 'relojes', name: 'Reloj Presidencial', slug: 'reloj-presidencial', desc: 'Reloj estilo presidencial con acabado dorado premium.', price: 45000.00, img: 'images/products/reloj-presidencial.webp' },
                { cat: 'relojes', name: 'Reloj Day-Date', slug: 'reloj-day-date', desc: 'Reloj Day-Date con calendario. Look ejecutivo.', price: 38500.00, img: 'images/products/reloj-daydate.webp' },
                { cat: 'relojes', name: 'Reloj Submariner', slug: 'reloj-submariner', desc: 'Reloj estilo submariner. Deportivo y elegante.', price: 42000.00, img: 'images/products/reloj-submariner.webp' },

                // Religiosos (2)
                { cat: 'religiosos', name: 'Cristo de Oro', slug: 'cristo-de-oro', desc: 'Imagen de Cristo en oro con detalles grabados.', price: 8900.00, img: 'images/products/cristo-oro.webp' },
                { cat: 'religiosos', name: 'Virgen de Guadalupe', slug: 'virgen-guadalupe', desc: 'Medalla Virgen de Guadalupe en oro. Acabado detallado.', price: 5600.00, img: 'images/products/virgen-guadalupe.webp' },

                // Diamantes (3)
                { cat: 'diamantes', name: 'Solitario Princess', slug: 'solitario-princess', desc: 'Anillo solitario corte princess con diamante certificado.', price: 52000.00, img: 'images/products/diamante-princess.webp' },
                { cat: 'diamantes', name: 'Aretes Diamante Natural', slug: 'aretes-diamante-natural', desc: 'Aretes con diamantes naturales de alta pureza.', price: 35000.00, img: 'images/products/diamante-aretes.webp' },
                { cat: 'diamantes', name: 'Colgante Diamante', slug: 'colgante-diamante', desc: 'Colgante con diamante corte brillante en montura de oro.', price: 28000.00, img: 'images/products/diamante-colgante.webp' },
            ];

            for (const p of products) {
                const catId = catMap[p.cat];
                if (!catId) {
                    console.log(`   ⚠️ Categoría "${p.cat}" no encontrada, saltando ${p.name}`);
                    continue;
                }

                const { rows } = await query(`
                    INSERT INTO products (category_id, name, slug, description, base_price, images, active, featured)
                    VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)
                    RETURNING id
                `, [catId, p.name, p.slug, p.desc, p.price, JSON.stringify([p.img]), p.price > 20000]);

                // Add options
                const productId = rows[0].id;
                if (['cadenas'].includes(p.cat)) {
                    await query(`INSERT INTO product_options (product_id, option_name, option_values, display_order) VALUES ($1, 'medida', '["45cm", "50cm", "55cm", "60cm"]', 1), ($1, 'kilataje', '["10k", "14k"]', 2)`, [productId]);
                } else if (['anillos', 'diamantes'].includes(p.cat) && p.slug.includes('anillo') || p.slug.includes('solitario')) {
                    await query(`INSERT INTO product_options (product_id, option_name, option_values, display_order) VALUES ($1, 'talla', '["6", "7", "8", "9", "10"]', 1), ($1, 'kilataje', '["10k", "14k"]', 2)`, [productId]);
                } else if (['pulsos'].includes(p.cat)) {
                    await query(`INSERT INTO product_options (product_id, option_name, option_values, display_order) VALUES ($1, 'medida', '["18cm", "20cm", "22cm"]', 1), ($1, 'kilataje', '["10k", "14k"]', 2)`, [productId]);
                } else if (['aretes'].includes(p.cat)) {
                    await query(`INSERT INTO product_options (product_id, option_name, option_values, display_order) VALUES ($1, 'kilataje', '["10k", "14k"]', 1)`, [productId]);
                } else if (['dijes', 'religiosos'].includes(p.cat)) {
                    await query(`INSERT INTO product_options (product_id, option_name, option_values, display_order) VALUES ($1, 'tamaño', '["Pequeño", "Mediano", "Grande"]', 1), ($1, 'kilataje', '["10k", "14k"]', 2)`, [productId]);
                }
            }

            console.log(`   ✅ ${products.length} productos creados con opciones\n`);
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
