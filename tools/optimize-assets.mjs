import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const jobs = [
  ["public/assets/backgrounds/cover-paper.png", "public/assets/backgrounds/cover-paper.webp", 92],
  ["public/assets/backgrounds/opening-floral-frame.jpg", "public/assets/backgrounds/opening-floral-frame.webp", 90],
  ["public/assets/backgrounds/paper-texture.jpg", "public/assets/backgrounds/paper-texture.webp", 88],
  ["public/assets/backgrounds/venue-map.png", "public/assets/backgrounds/venue-map.webp", 92],
  ["public/assets/decor/floral-bouquet.png", "public/assets/decor/floral-bouquet.webp", 92],
  ["public/assets/decor/location-wishes-divider.png", "public/assets/decor/location-wishes-divider.webp", 92],
  ["public/assets/decor/frame-1-ribbon-cutout-hq.png", "public/assets/decor/frame-1-ribbon-cutout-hq.webp", 95],
  ["public/assets/decor/gallery-continuation-cutout.png", "public/assets/decor/gallery-continuation-cutout.webp", 92],
  ["public/assets/decor/vine-corner.png", "public/assets/decor/vine-corner.webp", 92],
  ["public/assets/decor/rose-corner.png", "public/assets/decor/rose-corner.webp", 92],
  ["public/assets/decor/wishes-floral-sprig.png", "public/assets/decor/wishes-floral-sprig.webp", 92],
  ["public/assets/decor/wishes-flower-branch.png", "public/assets/decor/wishes-flower-branch.webp", 92],
  ["public/assets/music/music-disc.png", "public/assets/music/music-disc.webp", 92],
];

for (const [inputPath, outputPath, quality] of jobs) {
  const input = path.join(root, inputPath);
  const output = path.join(root, outputPath);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await sharp(input)
    .webp({ quality, alphaQuality: 100, effort: 6 })
    .toFile(output);

  const [sourceStats, outputStats] = await Promise.all([fs.stat(input), fs.stat(output)]);
  const saved = Math.max(0, 100 - (outputStats.size / sourceStats.size) * 100);
  console.log(`${inputPath}: ${(sourceStats.size / 1024).toFixed(1)} KB -> ${(outputStats.size / 1024).toFixed(1)} KB (${saved.toFixed(1)}% smaller)`);
}
