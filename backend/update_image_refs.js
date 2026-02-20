// Update all .png/.jpg references to .webp across frontend files
const fs = require('fs');
const path = require('path');

const FRONTEND = path.join(__dirname, '..', 'frontend');

// Find all HTML, JS, CSS files
function findFiles(dir, exts) {
    const results = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
            results.push(...findFiles(fullPath, exts));
        } else if (exts.some(ext => item.name.endsWith(ext))) {
            results.push(fullPath);
        }
    }
    return results;
}

const IMAGES_DIR = path.join(FRONTEND, 'images');

// Build a map of which .png/.jpg files were converted to .webp
function getConvertedFiles(dir) {
    const converted = new Set();
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            getConvertedFiles(fullPath).forEach(f => converted.add(f));
        } else if (item.name.endsWith('.webp')) {
            // Check if original .png or .jpg exists (it shouldn't since we deleted them)
            const baseName = item.name.replace('.webp', '');
            converted.add(baseName);
        }
    }
    return converted;
}

const files = findFiles(FRONTEND, ['.html', '.js', '.css']);
let totalReplacements = 0;

for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Replace image references - only if the .webp version exists
    // Pattern: images/.../*.png -> images/.../*.webp
    content = content.replace(/(images\/[^\s'"`)]+)\.(png|jpg|jpeg)/gi, (match, pathPart, ext) => {
        // Check if the webp file exists
        const webpPath = path.join(FRONTEND, `${pathPart}.webp`);
        const originalPath = path.join(FRONTEND, `${pathPart}.${ext}`);

        if (fs.existsSync(webpPath)) {
            return `${pathPart}.webp`;
        }
        // If original still exists (wasn't converted), keep as is
        return match;
    });

    if (content !== originalContent) {
        const count = (content.match(/\.webp/g) || []).length - (originalContent.match(/\.webp/g) || []).length;
        fs.writeFileSync(filePath, content, 'utf8');
        const rel = filePath.replace(FRONTEND + path.sep, '');
        console.log(`✅ ${rel}: ${count} references updated`);
        totalReplacements += count;
    }
}

console.log(`\n🎉 Total: ${totalReplacements} references updated to .webp`);
