const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'frontend', 'images', 'products', 'anillos');

// Ensure directory exists
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// All 18 ring products from reyesjoyeros.com
const rings = [
    { name: 'Domo Baguette — Anillo Pavé de Diamantes', slug: 'domo-baguette', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/AN10B04A50_1_50bd8a68-f635-46af-a86b-e69a37934e0c_700x.webp' },
    { name: 'Cruz Boreal — Anillo Cruz Baguette con Diamantes', slug: 'cruz-boreal', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/hhjewellersoficial_469911801_445287521772477_1263865290979239306_n.jpg' },
    { name: 'Éternel Amour Pavé — Alianza en Oro Rosa', slug: 'eternel-amour', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/S.jpg' },
    { name: 'Loro Boreal — Anillo Ave Pavé en Oro Blanco', slug: 'loro-boreal', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/hhjewellersoficial_358760486_671709284774774_428050513088498951_n.jpg' },
    { name: 'Octavia Royale — Anillo Pavé Octagonal', slug: 'octavia-royale', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/hhjewellersoficial_351444600_952774582704347_8082096704879047735_n.jpg' },
    { name: 'Panthera Verde — Anillo Pantera Pavé', slug: 'panthera-verde', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/hhjewellersoficial_347620559_946045643256596_3566589564694349183_n.jpg' },
    { name: 'Laberinto Memento — Anillo Sello Calavera', slug: 'laberinto-memento', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_469005686_17941842548924493_8520008712159195333_n.jpg' },
    { name: 'Medusa Áurea — Anillo Sello Bicolor con Pavé', slug: 'medusa-aurea', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_469000185_17941834469924493_7856627065934140081_n.jpg' },
    { name: 'Relicario Solar — Anillo Sello Bicolor', slug: 'relicario-solar', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_474997026_17948480453924493_1513421740489888807_n.jpg' },
    { name: 'Astra Blanco — Anillo Clavo Pavé Doble', slug: 'astra-blanco', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/01/2023-05-11_3100589182817136497.jpg' },
    { name: 'Doble Calavera Esmeralda — Anillo Calaveras', slug: 'doble-calavera', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/hhjewellersoficial_276986385_2509718419158944_6973571085491986685_n.jpg' },
    { name: 'Pantera Glaciar — Anillo Pantera Pavé', slug: 'pantera-glaciar', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_491441224_17957945324924493_7153200962233526720_n.jpg' },
    { name: 'Gorgona Eterna — Anillo Medusa', slug: 'gorgona-eterna', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_474563833_17948055803924493_5683500236331435502_n.jpg' },
    { name: 'Fauces Escarlatas — Anillo de Tigres', slug: 'fauces-escarlatas', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_468954024_17941833761924493_4329436721271677712_n.jpg' },
    { name: 'Anillo Sello Calaveras', slug: 'sello-calaveras', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_468944569_17941842167924493_9348270889869932_n.jpg' },
    { name: 'Aegis Obsidiana — Anillo Sello Octagonal', slug: 'aegis-obsidiana', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_469006071_17941842584924493_621022765870932808_n.jpg' },
    { name: 'Aquila Rex — Anillo Águila en Oro', slug: 'aquila-rex', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_474431224_17948055324924493_7143200962233526720_n.jpg' },
    { name: 'Panthera — Anillo Pantera en Oro Blanco', slug: 'panthera', url: 'https://www.reyesjoyeros.com/wp-content/uploads/2025/09/fractivajoyeros_474991224_17948485324924493_7153200962233526720_n.jpg' },
];

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const request = protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.reyesjoyeros.com/'
            }
        }, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode} for ${url}`));
                return;
            }

            const fileStream = fs.createWriteStream(filepath);
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                resolve(filepath);
            });
            fileStream.on('error', reject);
        });

        request.on('error', reject);
        request.setTimeout(15000, () => {
            request.destroy();
            reject(new Error(`Timeout downloading ${url}`));
        });
    });
}

async function main() {
    console.log(`📥 Downloading ${rings.length} ring product images...`);
    console.log(`📁 Saving to: ${IMAGES_DIR}\n`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < rings.length; i++) {
        const ring = rings[i];
        const ext = ring.url.endsWith('.webp') ? '.webp' : '.jpg';
        const filename = `anillo-${ring.slug}-1${ext}`;
        const filepath = path.join(IMAGES_DIR, filename);

        try {
            await downloadImage(ring.url, filepath);
            const stats = fs.statSync(filepath);
            console.log(`✅ [${i + 1}/${rings.length}] ${ring.name} → ${filename} (${(stats.size / 1024).toFixed(0)}KB)`);
            success++;
        } catch (err) {
            console.log(`❌ [${i + 1}/${rings.length}] ${ring.name} → ${err.message}`);
            failed++;
        }
    }

    console.log(`\n🎉 Done! ${success} downloaded, ${failed} failed.`);
    console.log('\nFiles saved:');
    const files = fs.readdirSync(IMAGES_DIR).filter(f => f.startsWith('anillo-'));
    files.forEach(f => console.log(`  - ${f}`));
}

main().catch(console.error);
