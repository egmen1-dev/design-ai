import { readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

/** Лёгкая финальная полировка обложки — единый тон, контраст, резкость */
export async function polishCoverImage(imagePath: string): Promise<string> {
  const rel = imagePath.replace(/^\/api\/generated\//, "");
  const abs = path.join(process.cwd(), "public", "generated", rel);
  const buffer = await readFile(abs);

  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? 900;
  const h = meta.height ?? 1200;

  const vignetteSvg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="v" cx="50%" cy="58%" r="68%">
          <stop offset="55%" stop-color="black" stop-opacity="0"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.07"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#v)"/>
    </svg>`;

  const polished = await sharp(buffer)
    .modulate({ brightness: 1.02, saturation: 1.06 })
    .linear(1.04, -6)
    .composite([{ input: Buffer.from(vignetteSvg), blend: "multiply" }])
    .sharpen({ sigma: 0.45, m1: 0.6, m2: 0.3 })
    .png()
    .toBuffer();

  await writeFile(abs, polished);
  return imagePath;
}
