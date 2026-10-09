import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "زخارف");
const decor = path.join(root, "public", "assets", "decor");
const backgrounds = path.join(root, "public", "assets", "backgrounds");
const music = path.join(root, "public", "assets", "music");

await Promise.all([decor, backgrounds, music].map((dir) => fs.mkdir(dir, { recursive: true })));

async function removeNearWhiteBackground(input, output) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const spread = max - min;
    if (min > 238 && spread < 22) data[i + 3] = 0;
    else if (min > 224 && spread < 18) data[i + 3] = 90;
  }
  let left = info.width;
  let top = info.height;
  let right = 0;
  let bottom = 0;
  for (let x = 0; x < info.width; x++) {
    for (let y = 0; y < info.height; y++) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha > 12) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }

  const outputImage = sharp(data, { raw: info });
  if (right > left && bottom > top) {
    outputImage.extract({ left, top, width: right - left + 1, height: bottom - top + 1 });
  }
  await outputImage.png().toFile(output);
}

async function removePureWhiteBackground(input, output) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (min > 248 && max - min < 10) data[i + 3] = 0;
  }
  await sharp(data, { raw: info }).png().toFile(output);
}

async function makeCircularAsset(input, output) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const centerX = (info.width - 1) / 2;
  const centerY = (info.height - 1) / 2;
  const radius = Math.min(info.width, info.height) / 2 - 2;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const distance = Math.hypot(x - centerX, y - centerY);
      if (distance > radius) data[(y * info.width + x) * info.channels + 3] = 0;
    }
  }
  await sharp(data, { raw: info }).png().toFile(output);
}

await removeNearWhiteBackground(path.join(source, "download (20).jpg"), path.join(decor, "vine-corner.png"));
await removeNearWhiteBackground(path.join(source, "download (17).jpg"), path.join(decor, "floral-divider.png"));
await removeNearWhiteBackground(path.join(source, "download (15).jpg"), path.join(decor, "floral-bouquet.png"));
await removeNearWhiteBackground(path.join(source, "download (22).jpg"), path.join(decor, "rose-corner.png"));

await sharp(path.join(source, "download (16).jpg")).jpeg({ quality: 86 }).toFile(path.join(backgrounds, "floral-frame.jpg"));
await sharp(path.join(source, "download (2).jpg")).jpeg({ quality: 86 }).toFile(path.join(backgrounds, "paper-texture.jpg"));
await removePureWhiteBackground(
  path.join(source, "RP PNG Edit 2026 – Transform Your Characters with Stunning Effects.jpg"),
  path.join(backgrounds, "cover-paper.png"),
);
const discSource = path.join(music, "music-disc-crop.jpg");
await sharp(path.join(source, "Decorative Floral Gramophone Record Design Metal Sign, Round Vintage 2D Printed Wall Art Decor, Suitable For Home, Kitchen, Garden, Office - Unique Christmas Gift, Retro Metal Poster (Not Real Record) Home Dec.jpg"))
  .extract({ left: 0, top: 65, width: 405, height: 405 })
  .jpeg({ quality: 88 })
  .toFile(discSource);
await makeCircularAsset(discSource, path.join(music, "music-disc.png"));
await fs.rm(discSource, { force: true });

console.log("Prepared selected invitation assets.");
