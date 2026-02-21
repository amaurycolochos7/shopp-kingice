/**
 * KING ICE GOLD — Dev Server (Hybrid Mode)
 * 
 * Serves frontend statics locally and proxies /api/* 
 * to the remote production backend at kingicegold.com.mx
 * 
 * Usage:  npm run dev:local
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.DEV_PORT || 3000;
const REMOTE_API = process.env.REMOTE_API_URL || 'https://kingicegold.com.mx';
const frontendPath = path.join(__dirname, 'frontend');

// MIME types for static files
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
};

function proxyToRemote(req, res) {
    const remoteUrl = `${REMOTE_API}${req.url}`;
    const parsedUrl = new URL(remoteUrl);
    const transport = parsedUrl.protocol === 'https:' ? https : http;

    console.log(`🔀 PROXY → ${req.method} ${remoteUrl}`);

    const proxyReq = transport.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: req.method,
        headers: {
            ...req.headers,
            host: parsedUrl.hostname,
            origin: REMOTE_API,
        },
    }, (proxyRes) => {
        console.log(`✅ PROXY ← ${proxyRes.statusCode} ${req.url}`);
        // Forward all headers from remote
        const headers = { ...proxyRes.headers };
        // Remove transfer-encoding to avoid issues
        delete headers['transfer-encoding'];
        res.writeHead(proxyRes.statusCode, headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        console.error(`❌ PROXY ERROR: ${err.message}`);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error conectando con el API remoto', details: err.message }));
    });

    // Forward request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        req.pipe(proxyReq, { end: true });
    } else {
        proxyReq.end();
    }
}

function serveStaticFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            return null; // File not found
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
        return true;
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname;

    // ===== /api/* → Proxy to remote backend =====
    if (pathname.startsWith('/api')) {
        return proxyToRemote(req, res);
    }

    // ===== Static files → Local frontend =====
    let filePath = path.join(frontendPath, pathname === '/' ? 'index.html' : pathname);

    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isFile()) {
            // Serve the file
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            const stream = fs.createReadStream(filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            stream.pipe(res);
        } else {
            // SPA fallback — serve index.html
            const indexPath = path.join(frontendPath, 'index.html');
            fs.readFile(indexPath, (err2, data) => {
                if (err2) {
                    res.writeHead(500);
                    res.end('Error loading index.html');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            });
        }
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║     🏆  KING ICE GOLD — Modo Híbrido           ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  🌐 Frontend Local:  http://localhost:${PORT}       ║`);
    console.log(`║  🔗 API Remota:      ${REMOTE_API}  ║`);
    console.log('║  📂 Archivos:        ./frontend/                ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
});
