/**
 * clone-site.js — Robust Playwright Site Cloner (CommonJS)
 * 
 * Captures ALL responses from a target site to disk:
 * HTML, CSS, JS, images, fonts, videos, API JSON.
 * Rewrites URLs for local serving.
 * 
 * Usage: node clone-site.js [url] [--pages=about,productos]
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');

// ─── Configuration ───────────────────────────────────────────────────────────
const TARGET_URL = process.argv[2] || 'https://www.reyesjoyeros.com/';
const CLONE_DIR = path.join(__dirname, 'clone');
const EXTRA_PAGES = [
    '/productos/',
    '/about/',
    '/product-category/cadenas/',
    '/product-category/anillos/',
];

// Content type → subfolder mapping
const TYPE_MAP = {
    'text/html': 'html',
    'text/css': 'css',
    'application/javascript': 'js',
    'text/javascript': 'js',
    'application/x-javascript': 'js',
    'application/json': 'api',
    'image/jpeg': 'images',
    'image/jpg': 'images',
    'image/png': 'images',
    'image/webp': 'images',
    'image/svg+xml': 'images',
    'image/gif': 'images',
    'image/avif': 'images',
    'image/x-icon': 'images',
    'font/woff': 'fonts',
    'font/woff2': 'fonts',
    'application/font-woff': 'fonts',
    'application/font-woff2': 'fonts',
    'font/ttf': 'fonts',
    'font/otf': 'fonts',
    'application/x-font-ttf': 'fonts',
    'application/x-font-otf': 'fonts',
    'video/mp4': 'video',
    'video/webm': 'video',
    'video/ogg': 'video',
};

// Stats
const stats = { total: 0, saved: 0, errors: 0, skipped: 0, byType: {} };
const savedUrls = new Map(); // url → local path

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getSubfolder(contentType) {
    if (!contentType) return 'other';
    const base = contentType.split(';')[0].trim().toLowerCase();
    return TYPE_MAP[base] || 'other';
}

function urlToFilename(urlStr, contentType) {
    try {
        const parsed = new URL(urlStr);
        let pathname = parsed.pathname;

        // Remove query params for filename, but use hash for uniqueness
        const queryHash = parsed.search ? '-' + crypto.createHash('md5').update(parsed.search).digest('hex').slice(0, 8) : '';

        // Get basename
        let basename = path.basename(pathname) || 'index';

        // Add extension if missing
        const ext = path.extname(basename);
        if (!ext) {
            const extMap = {
                'text/html': '.html',
                'text/css': '.css',
                'application/javascript': '.js',
                'text/javascript': '.js',
                'application/json': '.json',
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'image/webp': '.webp',
                'image/svg+xml': '.svg',
                'image/gif': '.gif',
                'image/avif': '.avif',
                'font/woff': '.woff',
                'font/woff2': '.woff2',
                'video/mp4': '.mp4',
                'video/webm': '.webm',
            };
            const baseType = contentType ? contentType.split(';')[0].trim().toLowerCase() : '';
            basename += extMap[baseType] || '.bin';
        }

        // Add query hash to avoid collisions
        if (queryHash) {
            const extPart = path.extname(basename);
            const namePart = path.basename(basename, extPart);
            basename = namePart + queryHash + extPart;
        }

        // Preserve directory structure from path
        const dirParts = path.dirname(pathname).split('/').filter(Boolean);
        return { dirs: dirParts, filename: basename };
    } catch (e) {
        return { dirs: [], filename: crypto.createHash('md5').update(urlStr).digest('hex').slice(0, 16) + '.bin' };
    }
}

function isTargetDomain(urlStr) {
    try {
        const parsed = new URL(urlStr);
        const target = new URL(TARGET_URL);
        // Accept same domain + common CDNs
        return parsed.hostname === target.hostname ||
            parsed.hostname.includes('reyesjoyeros') ||
            parsed.hostname.includes('wp-content') ||
            parsed.hostname.includes('googleapis') ||
            parsed.hostname.includes('gstatic') ||
            parsed.hostname.includes('cloudflare') ||
            parsed.hostname.includes('cdnjs') ||
            parsed.hostname.includes('jsdelivr') ||
            parsed.hostname.includes('fontawesome') ||
            parsed.hostname.includes('woocommerce') ||
            parsed.hostname.includes('elementor') ||
            parsed.hostname.includes('wpmucdn') ||
            parsed.hostname.includes('wp.com') ||
            parsed.hostname.includes('gravatar');
    } catch (e) {
        return false;
    }
}

async function saveResponse(response) {
    const url = response.url();
    stats.total++;

    // Skip data URLs, about:blank, etc.
    if (url.startsWith('data:') || url.startsWith('about:') || url.startsWith('blob:')) {
        stats.skipped++;
        return;
    }

    // Skip tracking/analytics
    if (url.includes('google-analytics') || url.includes('googletagmanager') ||
        url.includes('facebook') || url.includes('hotjar') || url.includes('clarity') ||
        url.includes('pixel') || url.includes('analytics') || url.includes('doubleclick')) {
        stats.skipped++;
        return;
    }

    try {
        const status = response.status();
        if (status >= 400) {
            stats.errors++;
            return;
        }

        const headers = response.headers();
        const contentType = headers['content-type'] || '';
        const subfolder = getSubfolder(contentType);

        // Get response body
        let body;
        try {
            body = await response.body();
        } catch (e) {
            // Some responses can't be read (redirects, etc.)
            stats.errors++;
            return;
        }

        if (!body || body.length === 0) {
            stats.skipped++;
            return;
        }

        // Build file path
        const { dirs, filename } = urlToFilename(url, contentType);
        const subDir = path.join(CLONE_DIR, subfolder, ...dirs);
        ensureDir(subDir);
        const filePath = path.join(subDir, filename);

        // Save to disk
        fs.writeFileSync(filePath, body);

        // Track for URL rewriting
        const relativePath = path.relative(CLONE_DIR, filePath).replace(/\\/g, '/');
        savedUrls.set(url, relativePath);

        stats.saved++;
        stats.byType[subfolder] = (stats.byType[subfolder] || 0) + 1;

        // Progress indicator
        if (stats.saved % 25 === 0) {
            console.log(`  💾 ${stats.saved} files saved...`);
        }
    } catch (e) {
        stats.errors++;
    }
}

function rewriteUrls(html) {
    let result = html;

    // Sort URLs by length (longest first) to avoid partial replacements
    const sortedUrls = [...savedUrls.entries()].sort((a, b) => b[0].length - a[0].length);

    for (const [originalUrl, localPath] of sortedUrls) {
        // Replace all occurrences of the URL
        result = result.split(originalUrl).join(localPath);

        // Also replace URL-encoded versions
        const encoded = originalUrl.replace(/&/g, '&amp;');
        if (encoded !== originalUrl) {
            result = result.split(encoded).join(localPath);
        }
    }

    return result;
}

async function scrollFullPage(page) {
    console.log('  📜 Scrolling page to trigger lazy loading...');
    await page.evaluate(async () => {
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        const scrollStep = window.innerHeight;
        let scrollTop = 0;
        const maxScroll = document.body.scrollHeight;

        while (scrollTop < maxScroll) {
            window.scrollBy(0, scrollStep);
            scrollTop += scrollStep;
            await delay(300);
        }

        // Scroll back to top
        window.scrollTo(0, 0);
        await delay(500);
    });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function clonePage(browser, pageUrl, pageName) {
    console.log(`\n🌐 Cloning: ${pageUrl}`);

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'es-MX',
        recordHar: {
            path: path.join(CLONE_DIR, 'har', `${pageName}.har`),
            mode: 'full',
        }
    });

    const page = await context.newPage();

    // Intercept ALL responses
    page.on('response', async (response) => {
        await saveResponse(response);
    });

    // Navigate with extended timeout
    try {
        await page.goto(pageUrl, {
            waitUntil: 'networkidle',
            timeout: 60000
        });
    } catch (e) {
        console.log(`  ⚠️ Navigation timeout (continuing anyway): ${e.message}`);
    }

    // Wait for dynamic content
    await page.waitForTimeout(3000);

    // Scroll to trigger lazy-loaded images/content
    await scrollFullPage(page);
    await page.waitForTimeout(2000);

    // Capture full rendered HTML (after JS execution)
    const renderedHtml = await page.content();
    const htmlPath = path.join(CLONE_DIR, 'html', `${pageName}.html`);
    ensureDir(path.dirname(htmlPath));
    fs.writeFileSync(htmlPath, renderedHtml, 'utf-8');
    console.log(`  📄 Saved rendered HTML: ${pageName}.html`);

    // Screenshot for reference
    const screenshotPath = path.join(CLONE_DIR, `screenshot-${pageName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`  📸 Screenshot: screenshot-${pageName}.png`);

    await context.close();
}

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  🕷️  PLAYWRIGHT SITE CLONER — Opción 3 (Robusta)');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Target: ${TARGET_URL}`);
    console.log(`  Output: ${CLONE_DIR}`);
    console.log('');

    // Clean and create output structure
    if (fs.existsSync(CLONE_DIR)) {
        console.log('  🧹 Cleaning previous clone...');
        fs.rmSync(CLONE_DIR, { recursive: true, force: true });
    }

    const dirs = ['html', 'css', 'js', 'images', 'fonts', 'api', 'video', 'har', 'other'];
    dirs.forEach(d => ensureDir(path.join(CLONE_DIR, d)));

    // Launch browser
    console.log('  🚀 Launching browser...');
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        // Clone main page
        await clonePage(browser, TARGET_URL, 'index');

        // Clone extra pages
        const baseUrl = new URL(TARGET_URL);
        for (const pagePath of EXTRA_PAGES) {
            const fullUrl = new URL(pagePath, baseUrl).href;
            const name = pagePath.replace(/\//g, '-').replace(/^-|-$/g, '') || 'index';
            await clonePage(browser, fullUrl, name);
        }

    } catch (e) {
        console.error(`\n❌ Error: ${e.message}`);
    } finally {
        await browser.close();
    }

    // ─── Post-processing: URL rewriting ───────────────────────────────────────
    console.log('\n🔄 Rewriting URLs in HTML files...');
    const htmlDir = path.join(CLONE_DIR, 'html');
    if (fs.existsSync(htmlDir)) {
        const htmlFiles = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));
        for (const file of htmlFiles) {
            const filePath = path.join(htmlDir, file);
            let content = fs.readFileSync(filePath, 'utf-8');
            content = rewriteUrls(content);
            fs.writeFileSync(filePath, content, 'utf-8');
            console.log(`  ✅ Rewrote: ${file}`);
        }
    }

    // Rewrite CSS files too
    console.log('🔄 Rewriting URLs in CSS files...');
    const cssDir = path.join(CLONE_DIR, 'css');
    if (fs.existsSync(cssDir)) {
        const processDir = (dir) => {
            const items = fs.readdirSync(dir, { withFileTypes: true });
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                if (item.isDirectory()) {
                    processDir(fullPath);
                } else if (item.name.endsWith('.css')) {
                    let content = fs.readFileSync(fullPath, 'utf-8');
                    content = rewriteUrls(content);
                    fs.writeFileSync(fullPath, content, 'utf-8');
                }
            }
        };
        processDir(cssDir);
        console.log('  ✅ CSS URLs rewritten');
    }

    // ─── Save URL map for debugging ───────────────────────────────────────────
    const urlMap = {};
    for (const [url, local] of savedUrls.entries()) {
        urlMap[url] = local;
    }
    fs.writeFileSync(
        path.join(CLONE_DIR, 'url-map.json'),
        JSON.stringify(urlMap, null, 2),
        'utf-8'
    );

    // ─── Summary ──────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  📊 CLONE SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Total responses:  ${stats.total}`);
    console.log(`  Saved to disk:    ${stats.saved}`);
    console.log(`  Errors:           ${stats.errors}`);
    console.log(`  Skipped:          ${stats.skipped}`);
    console.log('  By type:');
    for (const [type, count] of Object.entries(stats.byType).sort((a, b) => b[1] - a[1])) {
        console.log(`    ${type}: ${count}`);
    }
    console.log(`\n  Output: ${CLONE_DIR}`);
    console.log('  Run: node serve-clone.js');
    console.log('═══════════════════════════════════════════════════\n');
}

main().catch(console.error);
