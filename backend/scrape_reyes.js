/**
 * Scraper para descargar todas las imágenes y assets de reyesjoyeros.com
 * Usa headers de navegador real para evitar bloqueo 403
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const SAVE_DIR = path.join(__dirname, '..', 'frontend', 'images', 'reyes');
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'identity',
    'Referer': 'https://reyesjoyeros.com/',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
};

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const proto = url.startsWith('https') ? https : http;
        const req = proto.get(url, { headers: HEADERS }, (res) => {
            // Follow redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                let redirect = res.headers.location;
                if (redirect.startsWith('/')) redirect = new URL(redirect, url).href;
                return fetchUrl(redirect).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        });
        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

async function fetchHTML(url) {
    const buf = await fetchUrl(url);
    return buf.toString('utf-8');
}

function extractImageUrls(html, baseUrl) {
    const urls = new Set();

    // img src
    const imgSrc = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
    for (const m of imgSrc) urls.add(m[1]);

    // img srcset
    const srcset = html.matchAll(/srcset=["']([^"']+)["']/gi);
    for (const m of srcset) {
        m[1].split(',').forEach(s => {
            const u = s.trim().split(/\s+/)[0];
            if (u) urls.add(u);
        });
    }

    // CSS background-image
    const bgImg = html.matchAll(/background(?:-image)?\s*:\s*url\(["']?([^"')]+)["']?\)/gi);
    for (const m of bgImg) urls.add(m[1]);

    // data-src (lazy loading)
    const dataSrc = html.matchAll(/data-src=["']([^"']+)["']/gi);
    for (const m of dataSrc) urls.add(m[1]);

    // data-bg
    const dataBg = html.matchAll(/data-bg=["']([^"']+)["']/gi);
    for (const m of dataBg) urls.add(m[1]);

    // video poster
    const poster = html.matchAll(/poster=["']([^"']+)["']/gi);
    for (const m of poster) urls.add(m[1]);

    // video source src
    const videoSrc = html.matchAll(/<source[^>]+src=["']([^"']+)["']/gi);
    for (const m of videoSrc) urls.add(m[1]);

    // Resolve relative URLs and filter to images/media only
    const resolved = new Set();
    for (const u of urls) {
        try {
            const full = new URL(u, baseUrl).href;
            if (/\.(jpg|jpeg|png|gif|webp|svg|avif|mp4|mov|ico)/i.test(full) ||
                full.includes('wp-content/uploads') ||
                full.includes('woocommerce')) {
                resolved.add(full);
            }
        } catch { }
    }
    return [...resolved];
}

function extractProductLinks(html, baseUrl) {
    const links = new Set();
    const regex = /href=["'](https?:\/\/(?:www\.)?reyesjoyeros\.com\/producto\/[^"']+)["']/gi;
    for (const m of html.matchAll(regex)) {
        links.add(m[1]);
    }
    // Also category pages
    const catRegex = /href=["'](https?:\/\/(?:www\.)?reyesjoyeros\.com\/product-category\/[^"']+)["']/gi;
    for (const m of html.matchAll(catRegex)) {
        links.add(m[1]);
    }
    return [...links];
}

async function downloadFile(url, dir, prefix) {
    try {
        const parsed = new URL(url);
        let filename = path.basename(parsed.pathname);
        if (!filename || filename === '/') filename = 'index.html';

        // Clean filename
        filename = filename.replace(/[?&#]/g, '_').substring(0, 100);
        if (prefix) filename = prefix + '_' + filename;

        const filepath = path.join(dir, filename);

        // Skip if already exists
        if (fs.existsSync(filepath)) {
            console.log(`  ⏭ SKIP: ${filename}`);
            return filename;
        }

        const data = await fetchUrl(url);
        fs.writeFileSync(filepath, data);
        console.log(`  ✅ ${filename} (${(data.length / 1024).toFixed(1)}KB)`);
        return filename;
    } catch (err) {
        console.log(`  ❌ FAIL: ${url} — ${err.message}`);
        return null;
    }
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function main() {
    console.log('🔧 Creando directorios...');
    const dirs = {
        home: path.join(SAVE_DIR, 'home'),
        products: path.join(SAVE_DIR, 'products'),
        categories: path.join(SAVE_DIR, 'categories'),
        about: path.join(SAVE_DIR, 'about'),
        general: path.join(SAVE_DIR, 'general'),
        videos: path.join(SAVE_DIR, 'videos'),
    };

    for (const d of Object.values(dirs)) {
        fs.mkdirSync(d, { recursive: true });
    }

    const allImages = new Set();
    const productData = [];

    // 1. Homepage
    console.log('\n📄 Descargando Homepage...');
    try {
        const homeHTML = await fetchHTML('https://reyesjoyeros.com');
        fs.writeFileSync(path.join(SAVE_DIR, 'home.html'), homeHTML);

        const homeImgs = extractImageUrls(homeHTML, 'https://reyesjoyeros.com');
        console.log(`  Encontradas ${homeImgs.length} imágenes en homepage`);

        for (const url of homeImgs) {
            allImages.add(url);
            await downloadFile(url, dirs.home, '');
            await sleep(200);
        }

        // Extract product links
        const prodLinks = extractProductLinks(homeHTML, 'https://reyesjoyeros.com');
        console.log(`  Encontrados ${prodLinks.length} links de productos/categorías`);

    } catch (err) {
        console.log(`  ❌ Error homepage: ${err.message}`);
    }

    // 2. Products page
    console.log('\n📄 Descargando Productos...');
    try {
        const prodHTML = await fetchHTML('https://www.reyesjoyeros.com/productos/');
        fs.writeFileSync(path.join(SAVE_DIR, 'productos.html'), prodHTML);

        const prodImgs = extractImageUrls(prodHTML, 'https://www.reyesjoyeros.com/productos/');
        console.log(`  Encontradas ${prodImgs.length} imágenes en productos`);

        for (const url of prodImgs) {
            if (!allImages.has(url)) {
                allImages.add(url);
                await downloadFile(url, dirs.products, '');
                await sleep(200);
            }
        }
    } catch (err) {
        console.log(`  ❌ Error productos: ${err.message}`);
    }

    // 3. Category pages
    const categories = [
        'anillos', 'aretes', 'cadenas', 'relojes', 'diamantes',
        'dijes', 'pulsos', 'accesorios', 'religiosos', 'personalizados'
    ];

    for (const cat of categories) {
        console.log(`\n📂 Categoría: ${cat}...`);
        try {
            const catHTML = await fetchHTML(`https://www.reyesjoyeros.com/product-category/${cat}/`);
            fs.writeFileSync(path.join(SAVE_DIR, `category_${cat}.html`), catHTML);

            const catImgs = extractImageUrls(catHTML, `https://www.reyesjoyeros.com/product-category/${cat}/`);
            console.log(`  Encontradas ${catImgs.length} imágenes`);

            // Extract product info
            const productRegex = /<a[^>]+href=["'](https?:\/\/[^"']*?\/producto\/[^"']+)["'][^>]*>.*?<img[^>]+src=["']([^"']+)["']/gis;
            for (const m of catHTML.matchAll(productRegex)) {
                productData.push({ url: m[1], img: m[2], category: cat });
            }

            let newCount = 0;
            for (const url of catImgs) {
                if (!allImages.has(url)) {
                    allImages.add(url);
                    await downloadFile(url, dirs.categories, cat);
                    newCount++;
                    await sleep(200);
                }
            }
            console.log(`  ${newCount} nuevas imágenes descargadas`);
        } catch (err) {
            console.log(`  ❌ Error ${cat}: ${err.message}`);
        }
        await sleep(500);
    }

    // 4. About page
    console.log('\n📄 Descargando About...');
    try {
        const aboutHTML = await fetchHTML('https://www.reyesjoyeros.com/about/');
        fs.writeFileSync(path.join(SAVE_DIR, 'about.html'), aboutHTML);

        const aboutImgs = extractImageUrls(aboutHTML, 'https://www.reyesjoyeros.com/about/');
        console.log(`  Encontradas ${aboutImgs.length} imágenes en about`);

        for (const url of aboutImgs) {
            if (!allImages.has(url)) {
                allImages.add(url);
                await downloadFile(url, dirs.about, '');
                await sleep(200);
            }
        }
    } catch (err) {
        console.log(`  ❌ Error about: ${err.message}`);
    }

    // 5. Individual product pages (first 10)
    console.log('\n📄 Descargando productos individuales...');
    const uniqueProducts = [...new Set(productData.map(p => p.url))].slice(0, 15);

    for (let i = 0; i < uniqueProducts.length; i++) {
        const prodUrl = uniqueProducts[i];
        const slug = prodUrl.split('/producto/')[1]?.replace(/\/$/, '') || `product_${i}`;
        console.log(`  [${i + 1}/${uniqueProducts.length}] ${slug}...`);

        try {
            const html = await fetchHTML(prodUrl);
            fs.writeFileSync(path.join(SAVE_DIR, `product_${slug}.html`), html);

            const imgs = extractImageUrls(html, prodUrl);
            for (const url of imgs) {
                if (!allImages.has(url)) {
                    allImages.add(url);
                    await downloadFile(url, dirs.products, slug.substring(0, 20));
                    await sleep(150);
                }
            }
        } catch (err) {
            console.log(`    ❌ ${err.message}`);
        }
        await sleep(500);
    }

    // Summary
    console.log('\n\n========================================');
    console.log(`📊 RESUMEN`);
    console.log(`========================================`);
    console.log(`Total imágenes únicas: ${allImages.size}`);
    console.log(`Productos encontrados: ${productData.length}`);
    console.log(`Guardado en: ${SAVE_DIR}`);

    // Save image manifest
    const manifest = {
        totalImages: allImages.size,
        totalProducts: productData.length,
        images: [...allImages],
        products: productData,
        scrapedAt: new Date().toISOString()
    };
    fs.writeFileSync(
        path.join(SAVE_DIR, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
    console.log('📝 Manifest guardado en manifest.json');
}

main().catch(console.error);
