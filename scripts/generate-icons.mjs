import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = join(root, "public/icons/favicon.svg");
const svg = readFileSync(svgPath);

const BG = "#f5efe8";

async function rasterize(size, outName) {
  await sharp(svg)
    .resize(size, size)
    .flatten({ background: BG })
    .png()
    .toFile(join(root, "public/icons", outName));
}

await rasterize(192, "icon-192.png");
await rasterize(512, "icon-512.png");
await rasterize(180, "apple-touch-icon.png");

console.log("Wrote icon-192.png, icon-512.png, apple-touch-icon.png from favicon.svg");
