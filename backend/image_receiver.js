// Standalone image receiver server
// Receives base64 image data via POST and saves it to disk
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4050;
const IMAGES_DIR = path.join(__dirname, '..', 'frontend', 'images', 'products', 'anillos');

if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/save-image') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { filename, data } = JSON.parse(body);
                const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
                const filepath = path.join(IMAGES_DIR, filename);
                fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
                const size = fs.statSync(filepath).size;
                console.log(`✅ Saved: ${filename} (${(size / 1024).toFixed(0)}KB)`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, size }));
            } catch (err) {
                console.error(`❌ Error: ${err.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: err.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`📡 Image receiver running on http://localhost:${PORT}/save-image`);
    console.log(`📁 Saving to: ${IMAGES_DIR}`);
});
