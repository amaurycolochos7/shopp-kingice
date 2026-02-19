/**
 * serve-clone.js — Local server for the cloned site
 * Serves the clone/ directory at http://localhost:3333/
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const PORT = 3333;
const CLONE_DIR = path.join(__dirname, 'clone');

const app = express();

// Serve static files from clone directory
app.use(express.static(CLONE_DIR, {
    setHeaders: (res, filePath) => {
        // Set correct MIME types
        const ext = path.extname(filePath).toLowerCase();
        const mimeMap = {
            '.woff2': 'font/woff2',
            '.woff': 'font/woff',
            '.ttf': 'font/ttf',
            '.otf': 'font/otf',
            '.svg': 'image/svg+xml',
            '.webp': 'image/webp',
            '.avif': 'image/avif',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
        };
        if (mimeMap[ext]) {
            res.setHeader('Content-Type', mimeMap[ext]);
        }
        // Allow CORS for fonts
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
}));

// Serve index HTML by default
app.get('/', (req, res) => {
    const indexPath = path.join(CLONE_DIR, 'html', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send('<h1>Clone not found. Run: node clone-site.js</h1>');
    }
});

// Serve other cloned pages
app.get('/:page', (req, res) => {
    const pagePath = path.join(CLONE_DIR, 'html', `${req.params.page}.html`);
    if (fs.existsSync(pagePath)) {
        res.sendFile(pagePath);
    } else {
        res.status(404).send('Page not found');
    }
});

app.listen(PORT, () => {
    console.log(`\n🌐 Clone server running at http://localhost:${PORT}/`);
    console.log(`   Serving from: ${CLONE_DIR}`);
    console.log(`\n   Pages:`);

    const htmlDir = path.join(CLONE_DIR, 'html');
    if (fs.existsSync(htmlDir)) {
        fs.readdirSync(htmlDir).filter(f => f.endsWith('.html')).forEach(f => {
            const name = path.basename(f, '.html');
            console.log(`   - http://localhost:${PORT}/${name === 'index' ? '' : name}`);
        });
    }
    console.log('');
});
