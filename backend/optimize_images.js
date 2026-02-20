// Image optimization script - converts large PNGs to compressed JPEGs
// Uses Node.js canvas to resize and compress images
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND = path.join(__dirname, '..', 'frontend');
const IMAGES_DIR = path.join(FRONTEND, 'images');

// Find all PNG/JPG files and their sizes
function getAllImages(dir) {
    const results = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            results.push(...getAllImages(fullPath));
        } else if (/\.(png|jpg|jpeg)$/i.test(item.name)) {
            const stats = fs.statSync(fullPath);
            results.push({ path: fullPath, size: stats.size, name: item.name });
        }
    }
    return results;
}

const images = getAllImages(IMAGES_DIR);
const totalBefore = images.reduce((sum, img) => sum + img.size, 0);

console.log(`\n📊 Image Analysis:`);
console.log(`   Total images: ${images.length}`);
console.log(`   Total size: ${(totalBefore / 1024 / 1024).toFixed(1)}MB`);
console.log(`\n   Largest files:`);

images
    .sort((a, b) => b.size - a.size)
    .slice(0, 15)
    .forEach(img => {
        const rel = img.path.replace(IMAGES_DIR + path.sep, '');
        console.log(`   ${(img.size / 1024).toFixed(0)}KB - ${rel}`);
    });

// Check if sharp is available for compression
try {
    require.resolve('sharp');
    console.log('\n✅ sharp is available - will compress images');
} catch {
    console.log('\n⚠️  sharp not installed. Installing...');
    try {
        execSync('npm install sharp --save-dev', { cwd: path.join(__dirname), stdio: 'inherit' });
        console.log('✅ sharp installed successfully');
    } catch (err) {
        console.log('❌ Could not install sharp. Skipping image compression.');
        console.log('   You can manually install: npm install sharp');
        process.exit(0);
    }
}

const sharp = require('sharp');

async function optimizeImage(imgPath) {
    const ext = path.extname(imgPath).toLowerCase();
    const stats = fs.statSync(imgPath);

    // Skip small files (< 50KB)
    if (stats.size < 50 * 1024) return { skipped: true, path: imgPath };

    try {
        const img = sharp(imgPath);
        const metadata = await img.metadata();

        // Resize if very large (> 1600px wide)
        let pipeline = sharp(imgPath);
        if (metadata.width > 1600) {
            pipeline = pipeline.resize(1600, null, { withoutEnlargement: true });
        }

        // For hero/banner images, keep wider but compress
        const isHeroOrBanner = imgPath.includes('hero') || imgPath.includes('banner');
        if (isHeroOrBanner && metadata.width > 1920) {
            pipeline = pipeline.resize(1920, null, { withoutEnlargement: true });
        }

        // Compress based on format
        const outputPath = imgPath.replace(/\.png$/i, '.webp').replace(/\.jpe?g$/i, '.webp');

        await pipeline
            .webp({ quality: 80, effort: 4 })
            .toFile(outputPath);

        const newStats = fs.statSync(outputPath);
        const savings = ((1 - newStats.size / stats.size) * 100).toFixed(0);

        // If WebP is smaller, keep it and delete original
        if (newStats.size < stats.size && outputPath !== imgPath) {
            fs.unlinkSync(imgPath);
            return {
                original: imgPath,
                optimized: outputPath,
                before: stats.size,
                after: newStats.size,
                savings
            };
        } else {
            // WebP wasn't smaller, keep original
            if (outputPath !== imgPath) fs.unlinkSync(outputPath);
            return { skipped: true, path: imgPath, reason: 'webp not smaller' };
        }
    } catch (err) {
        return { error: true, path: imgPath, message: err.message };
    }
}

async function main() {
    console.log('\n🔄 Compressing images to WebP...\n');

    let totalSaved = 0;
    let converted = 0;
    let errors = 0;

    for (const img of images) {
        const result = await optimizeImage(img.path);
        if (result.error) {
            console.log(`  ❌ ${path.basename(img.path)}: ${result.message}`);
            errors++;
        } else if (result.skipped) {
            // silent skip
        } else {
            const rel = result.optimized.replace(IMAGES_DIR + path.sep, '');
            console.log(`  ✅ ${rel}: ${(result.before / 1024).toFixed(0)}KB → ${(result.after / 1024).toFixed(0)}KB (-${result.savings}%)`);
            totalSaved += (result.before - result.after);
            converted++;
        }
    }

    console.log(`\n🎉 Done!`);
    console.log(`   Converted: ${converted} images`);
    console.log(`   Saved: ${(totalSaved / 1024 / 1024).toFixed(1)}MB`);
    if (errors) console.log(`   Errors: ${errors}`);
}

main().catch(console.error);
