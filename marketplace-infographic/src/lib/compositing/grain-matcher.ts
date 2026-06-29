import sharp from "sharp";

/** Единый film grain — товар и фон выглядят как одно фото */
export async function applyFilmGrain(
  imageBuffer: Buffer,
  intensity = 0.018,
): Promise<Buffer> {
  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width ?? 900;
  const h = meta.height ?? 1200;

  const noiseSvg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <filter id="n">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#n)" opacity="${intensity}"/>
    </svg>`;

  const noise = await sharp(Buffer.from(noiseSvg)).png().toBuffer();

  return sharp(imageBuffer)
    .composite([{ input: noise, blend: "overlay" }])
    .png()
    .toBuffer();
}
