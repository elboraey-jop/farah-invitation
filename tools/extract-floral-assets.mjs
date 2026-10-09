import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const sourceDir = path.join(projectRoot, 'زخارف');
const outputDir = path.join(projectRoot, 'public', 'assets', 'decor');

const jobs = [
  { source: 'download (20).jpg', output: 'details-floral-vine.webp', threshold: 42 },
  { source: 'download (10).jpg', output: 'venue-floral-branch.webp', threshold: 46 },
  { source: 'download (23).jpg', output: 'wishes-floral-cluster.webp', threshold: 44 },
  { source: 'ورد.jpg', output: 'promise-floral-branch.webp', threshold: 42 },
  { source: 'download (22).jpg', output: 'details-floral-corner.webp', threshold: 44 },
];

function colorDistance(a, b) {
  return Math.sqrt(
    ((a[0] - b[0]) ** 2) +
    ((a[1] - b[1]) ** 2) +
    ((a[2] - b[2]) ** 2),
  );
}

function isLightNeutral(pixel) {
  const spread = Math.max(pixel[0], pixel[1], pixel[2]) - Math.min(pixel[0], pixel[1], pixel[2]);
  return Math.min(pixel[0], pixel[1], pixel[2]) > 165 && spread < 34;
}

function sampleBackground(data, info) {
  const samples = [];
  const push = (x, y) => {
    const offset = (y * info.width + x) * 4;
    const pixel = [data[offset], data[offset + 1], data[offset + 2]];
    if (isLightNeutral(pixel)) samples.push(pixel);
  };

  for (let x = 0; x < info.width; x += 8) {
    push(x, 0);
    push(x, info.height - 1);
  }
  for (let y = 0; y < info.height; y += 8) {
    push(0, y);
    push(info.width - 1, y);
  }

  if (!samples.length) return [255, 255, 255];
  return samples
    .sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]))[Math.floor(samples.length / 2)];
}

function removeConnectedBackground(data, info, threshold) {
  const background = sampleBackground(data, info);
  const total = info.width * info.height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const enqueue = (x, y) => {
    const index = y * info.width + x;
    if (visited[index]) return;
    const offset = index * 4;
    const pixel = [data[offset], data[offset + 1], data[offset + 2]];
    if (!isLightNeutral(pixel) || colorDistance(pixel, background) > threshold) return;
    visited[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < info.width; x += 1) {
    enqueue(x, 0);
    enqueue(x, info.height - 1);
  }
  for (let y = 1; y < info.height - 1; y += 1) {
    enqueue(0, y);
    enqueue(info.width - 1, y);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % info.width;
    const y = Math.floor(index / info.width);
    if (x > 0) enqueue(x - 1, y);
    if (x < info.width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < info.height - 1) enqueue(x, y + 1);
  }

  for (let index = 0; index < total; index += 1) {
    if (!visited[index]) continue;
    data[(index * 4) + 3] = 0;
  }
  return background;
}

await fs.mkdir(outputDir, { recursive: true });

for (const job of jobs) {
  const inputPath = path.join(sourceDir, job.source);
  const input = await sharp(inputPath)
    .resize({ width: 1400, withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const background = removeConnectedBackground(input.data, input.info, job.threshold);
  const outputPath = path.join(outputDir, job.output);

  await sharp(input.data, {
    raw: {
      width: input.info.width,
      height: input.info.height,
      channels: 4,
    },
  })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toFile(outputPath);

  const metadata = await sharp(outputPath).metadata();
  console.log(`${job.source} -> ${job.output} (${metadata.width}x${metadata.height}), background ${background.join(',')}`);
}
