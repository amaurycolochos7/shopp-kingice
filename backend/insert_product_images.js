/**
 * Insert product images into the database for all existing products.
 * Each product gets 2 product photos + 1 branded packaging mockup.
 */
require('dotenv').config();
const { pool } = require('./config/database');

const MOCKUP_PATH = 'images/products/mockup-kig.png';

// Map product IDs to their category image paths
const productImages = [
    // ===== CADENAS =====
    {
        productId: 1, // Cadena de Oro Torzal Pavé
        images: [
            { url: 'images/products/cadenas/cadena-1.jpg', alt: 'Cadena de Oro Torzal Pavé - Vista principal', primary: true },
            { url: 'images/products/cadenas/cadena-2.jpg', alt: 'Cadena de Oro Torzal Pavé - Vista detalle' },
            { url: MOCKUP_PATH, alt: 'Empaque premium King Ice Gold' }
        ]
    },
    {
        productId: 2, // Cadena Tejido Hollow Box
        images: [
            { url: 'images/products/cadenas/cadena-3.jpg', alt: 'Cadena Tejido Hollow Box - Vista principal', primary: true },
            { url: 'images/products/cadenas/cadena-4.webp', alt: 'Cadena Tejido Hollow Box - Vista detalle' },
            { url: MOCKUP_PATH, alt: 'Empaque premium King Ice Gold' }
        ]
    },
    // ===== ANILLOS =====
    {
        productId: 3, // Anillo Solitario Diamante
        images: [
            { url: 'images/products/anillos/anillo-2.jpg', alt: 'Anillo Solitario Diamante - Vista principal', primary: true },
            { url: 'images/products/anillos/anillo-3.jpg', alt: 'Anillo Solitario Diamante - Vista detalle' },
            { url: MOCKUP_PATH, alt: 'Empaque premium King Ice Gold' }
        ]
    },
    // ===== ARETES =====
    {
        productId: 4, // Aretes de Oro Huggie
        images: [
            { url: 'images/products/aretes/aretes-1.png', alt: 'Aretes de Oro Huggie - Vista principal', primary: true },
            { url: 'images/products/aretes/aretes-2.png', alt: 'Aretes de Oro Huggie - Vista detalle' },
            { url: MOCKUP_PATH, alt: 'Empaque premium King Ice Gold' }
        ]
    },
    // ===== PULSOS =====
    {
        productId: 5, // Pulsera Cubana
        images: [
            { url: 'images/products/pulsos/pulso-1.jpg', alt: 'Pulsera Cubana - Vista principal', primary: true },
            { url: 'images/products/pulsos/pulso-2.jpg', alt: 'Pulsera Cubana - Vista detalle' },
            { url: MOCKUP_PATH, alt: 'Empaque premium King Ice Gold' }
        ]
    },
    // ===== DIJES =====
    {
        productId: 6, // Dije Cruz San Benito
        images: [
            { url: 'images/products/dijes/dije-1.png', alt: 'Dije Cruz San Benito - Vista principal', primary: true },
            { url: 'images/products/dijes/dije-2.png', alt: 'Dije Cruz San Benito - Vista detalle' },
            { url: MOCKUP_PATH, alt: 'Empaque premium King Ice Gold' }
        ]
    }
];

async function insertImages() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Clear existing product images first
        await client.query('DELETE FROM product_images');
        console.log('🗑️  Cleared existing product images');

        let totalInserted = 0;

        for (const product of productImages) {
            for (let i = 0; i < product.images.length; i++) {
                const img = product.images[i];
                await client.query(
                    `INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary) 
           VALUES ($1, $2, $3, $4, $5)`,
                    [product.productId, img.url, img.alt, i, img.primary || false]
                );
                totalInserted++;
            }
            console.log(`✅ Product ${product.productId}: ${product.images.length} images inserted`);
        }

        await client.query('COMMIT');
        console.log(`\n🎉 Done! Inserted ${totalInserted} images for ${productImages.length} products.`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', err.message);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

insertImages().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
