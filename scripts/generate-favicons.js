import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const possiblePaths = [
  './src/assets/images/favicon_source_1782727971214.jpg',
  '../src/assets/images/favicon_source_1782727971214.jpg',
  '/src/assets/images/favicon_source_1782727971214.jpg',
  './assets/images/favicon_source_1782727971214.jpg',
  './src/assets/favicon_source_1782727971214.jpg',
  './src/favicon_source_1782727971214.jpg'
];

const publicDir = './public';

async function generate() {
  try {
    let sourceImage = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        sourceImage = p;
        break;
      }
    }
    
    if (!sourceImage) {
      throw new Error(`Source image not found in any of these paths: ${possiblePaths.join(', ')}`);
    }
    
    console.log('Found source image at:', sourceImage);
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // 1. Generate favicon-16x16.png
    console.log('Generating favicon-16x16.png...');
    await sharp(sourceImage)
      .resize(16, 16)
      .png()
      .toFile(path.join(publicDir, 'favicon-16x16.png'));

    // 2. Generate favicon-32x32.png
    console.log('Generating favicon-32x32.png...');
    await sharp(sourceImage)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon-32x32.png'));

    // 3. Generate favicon-48x48.png
    console.log('Generating favicon-48x48.png...');
    await sharp(sourceImage)
      .resize(48, 48)
      .png()
      .toFile(path.join(publicDir, 'favicon-48x48.png'));

    // 4. Generate apple-touch-icon.png (180x180)
    console.log('Generating apple-touch-icon.png...');
    await sharp(sourceImage)
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    // 5. Generate favicon-192x192.png
    console.log('Generating favicon-192x192.png...');
    await sharp(sourceImage)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'favicon-192x192.png'));

    // 6. Generate favicon-512x512.png
    console.log('Generating favicon-512x512.png...');
    const p512Buffer = await sharp(sourceImage)
      .resize(512, 512)
      .png()
      .toBuffer();
    
    fs.writeFileSync(path.join(publicDir, 'favicon-512x512.png'), p512Buffer);

    // 7. Generate favicon.ico
    console.log('Generating favicon.ico...');
    await sharp(sourceImage)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));

    // 8. Generate SVG embedding the 512x512 PNG
    console.log('Generating favicon.svg...');
    const base64Png = p512Buffer.toString('base64');
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,${base64Png}" width="512" height="512" />
</svg>`;
    
    fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

    console.log('✅ Favicons generated successfully in /public!');
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  }
}

generate();
