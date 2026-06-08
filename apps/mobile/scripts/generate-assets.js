/**
 * Generate placeholder assets for Punto Park U mobile app.
 * Run: node scripts/generate-assets.js
 *
 * In production, these should be replaced with designer-created assets.
 * This generates minimal valid PNG files for development/testing.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

// ── Minimal PNG Generator ─────────────────────────────────────────

function createPNG(width, height, r, g, b) {
  // Build raw pixel data (RGBA)
  const rawData = Buffer.alloc((width * height * 4) + height);
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 4 + 1)] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const offset = y * (width * 4 + 1) + 1 + x * 4;
      rawData[offset] = r;
      rawData[offset + 1] = g;
      rawData[offset + 2] = b;
      rawData[offset + 3] = 255;
    }
  }

  // Compress with zlib
  const compressed = zlib.deflateSync(rawData);

  // PNG chunks
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData));
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT
  const idat = compressed;

  // IEND
  const iend = Buffer.alloc(0);

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idat);
  const iendChunk = makeChunk('IEND', iend);

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// ── Create placeholder SVG for adaptive icon ──────────────────────

function createAdaptiveIconSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">
  <rect width="108" height="108" fill="#1a73e8" rx="18"/>
  <text x="54" y="68" text-anchor="middle" font-size="48" font-weight="bold" fill="white" font-family="sans-serif">P</text>
</svg>`;
}

// ── Main ──────────────────────────────────────────────────────────

function main() {
  console.log('Generating placeholder assets...\n');

  // Generate icon.png (1024x1024 iOS app icon, use smaller for placeholder)
  const icon = createPNG(256, 256, 0x1A, 0x73, 0xE8);
  fs.writeFileSync(path.join(ASSETS_DIR, 'icon.png'), icon);
  console.log('✓ icon.png (256x256)');

  // Generate adaptive-icon.png (Android adaptive icon foreground)
  const adaptiveIcon = createPNG(256, 256, 0x1A, 0x73, 0xE8);
  fs.writeFileSync(path.join(ASSETS_DIR, 'adaptive-icon.png'), adaptiveIcon);
  console.log('✓ adaptive-icon.png (256x256)');

  // Generate splash.png (splash screen image)
  const splash = createPNG(256, 256, 0x1A, 0x73, 0xE8);
  fs.writeFileSync(path.join(ASSETS_DIR, 'splash.png'), splash);
  console.log('✓ splash.png (256x256)');

  // Generate splash-icon.png (branded splash icon)
  const splashIcon = createPNG(200, 200, 0xFF, 0xFF, 0xFF);
  fs.writeFileSync(path.join(ASSETS_DIR, 'splash-icon.png'), splashIcon);
  console.log('✓ splash-icon.png (200x200)');

  // Generate favicon.png (web favicon)
  const favicon = createPNG(48, 48, 0x1A, 0x73, 0xE8);
  fs.writeFileSync(path.join(ASSETS_DIR, 'favicon.png'), favicon);
  console.log('✓ favicon.png (48x48)');

  // Generate notification-icon.png (push notification icon)
  const notifIcon = createPNG(96, 96, 0x1A, 0x73, 0xE8);
  fs.writeFileSync(path.join(ASSETS_DIR, 'notification-icon.png'), notifIcon);
  console.log('✓ notification-icon.png (96x96)');

  // Generate adaptive icon SVG foreground
  fs.writeFileSync(path.join(ASSETS_DIR, 'adaptive-icon.svg'), createAdaptiveIconSVG());
  console.log('✓ adaptive-icon.svg');

  // Generate locales
  const locales = {
    'es.json': JSON.stringify({
      CFBundleDisplayName: 'Punto Park U',
      NSCameraUsageDescription: 'Usa la cámara para escanear códigos QR de tus reservas.',
      NSLocationWhenInUseUsageDescription: 'Usa tu ubicación para encontrar estacionamientos cercanos.',
      NSPhotoLibraryAddUsageDescription: 'Guarda los comprobantes de pago en tu galería.',
      NSNotificationsUsageDescription: 'Recibe notificaciones sobre tus reservas y pagos.',
    }, null, 2),
  };

  Object.entries(locales).forEach(([filename, content]) => {
    fs.writeFileSync(path.join(ASSETS_DIR, 'locales', filename), content);
    console.log(`✓ locales/${filename}`);
  });

  console.log('\n✨ Placeholder assets generated successfully!');
  console.log('⚠  Replace these with designer-created assets before app store submission.');
}

main();
