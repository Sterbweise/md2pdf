/**
 * Generate favicon variants from public/icon.png
 * Run with: node scripts/generate-favicons.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../public");
const source = resolve(publicDir, "icon.png");

async function generateFavicons() {
  console.log("Generating favicons from", source);

  // icon-192.png (PWA icon)
  await sharp(source)
    .resize(192, 192, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(resolve(publicDir, "icon-192.png"));
  console.log("  -> icon-192.png");

  // icon-512.png (PWA icon)
  await sharp(source)
    .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(resolve(publicDir, "icon-512.png"));
  console.log("  -> icon-512.png");

  // apple-touch-icon.png (180x180)
  await sharp(source)
    .resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(resolve(publicDir, "apple-touch-icon.png"));
  console.log("  -> apple-touch-icon.png");

  // favicon.ico - generate a 32x32 PNG and save as .ico
  // Most modern browsers accept PNG as favicon, but we generate a proper small size
  const favicon32 = await sharp(source)
    .resize(32, 32, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  // Create a minimal ICO file with embedded PNG
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);     // Reserved
  icoHeader.writeUInt16LE(1, 2);     // ICO type
  icoHeader.writeUInt16LE(1, 4);     // Number of images

  const icoEntry = Buffer.alloc(16);
  icoEntry.writeUInt8(32, 0);        // Width
  icoEntry.writeUInt8(32, 1);        // Height
  icoEntry.writeUInt8(0, 2);         // Color palette
  icoEntry.writeUInt8(0, 3);         // Reserved
  icoEntry.writeUInt16LE(1, 4);      // Color planes
  icoEntry.writeUInt16LE(32, 6);     // Bits per pixel
  icoEntry.writeUInt32LE(favicon32.length, 8);  // Size of image data
  icoEntry.writeUInt32LE(22, 12);    // Offset to image data (6 + 16 = 22)

  const icoFile = Buffer.concat([icoHeader, icoEntry, favicon32]);
  writeFileSync(resolve(publicDir, "favicon.ico"), icoFile);
  console.log("  -> favicon.ico");

  console.log("\nAll favicons generated successfully!");
}

generateFavicons().catch(console.error);
