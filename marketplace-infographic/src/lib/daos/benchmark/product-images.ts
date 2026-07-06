import type { BenchmarkProduct } from "./types";

const SHAPE_SVG: Record<string, string> = {
  drill: `<rect x="140" y="80" width="200" height="320" rx="24" fill="{accent}"/><rect x="60" y="200" width="100" height="40" rx="12" fill="#555"/>`,
  kettle: `<ellipse cx="240" cy="280" rx="120" ry="90" fill="{accent}"/><rect x="200" y="120" width="80" height="100" rx="20" fill="{accent}"/><line x1="280" y1="140" x2="320" y2="100" stroke="{accent}" stroke-width="12"/>`,
  chair: `<rect x="160" y="200" width="160" height="20" rx="4" fill="{accent}"/><rect x="180" y="80" width="120" height="120" rx="8" fill="{accent}"/><rect x="140" y="220" width="20" height="180" fill="#555"/><rect x="320" y="220" width="20" height="180" fill="#555"/>`,
  mattress: `<rect x="80" y="200" width="320" height="120" rx="16" fill="{accent}"/><rect x="80" y="180" width="320" height="30" rx="8" fill="#fff" opacity="0.3"/>`,
  toy: `<circle cx="240" cy="240" r="100" fill="{accent}"/><circle cx="200" cy="200" r="25" fill="#fff"/><circle cx="280" cy="200" r="25" fill="#fff"/><path d="M200 280 Q240 320 280 280" stroke="#fff" stroke-width="8" fill="none"/>`,
  speaker: `<rect x="140" y="140" width="200" height="200" rx="40" fill="{accent}"/><circle cx="240" cy="240" r="60" fill="#111"/>`,
  shoes: `<ellipse cx="200" cy="300" rx="80" ry="40" fill="{accent}"/><ellipse cx="280" cy="280" rx="90" ry="45" fill="{accent}"/>`,
  bottle: `<rect x="200" y="120" width="80" height="240" rx="20" fill="{accent}"/><rect x="215" y="80" width="50" height="50" rx="8" fill="{accent}"/>`,
  machine: `<rect x="120" y="160" width="240" height="200" rx="16" fill="{accent}"/><rect x="160" y="100" width="160" height="80" rx="8" fill="#333"/>`,
  lamp: `<rect x="220" y="280" width="40" height="120" fill="{accent}"/><ellipse cx="240" cy="200" rx="100" ry="30" fill="{accent}"/>`,
  mouse: `<ellipse cx="240" cy="280" rx="100" ry="140" fill="{accent}"/><line x1="240" y1="160" x2="240" y2="200" stroke="#fff" stroke-width="4"/>`,
  mat: `<rect x="80" y="180" width="320" height="120" rx="8" fill="{accent}"/>`,
  jacket: `<path d="M160 120 L120 400 L360 400 L320 120 Z" fill="{accent}"/><path d="M200 120 L240 80 L280 120" fill="{accent}"/>`,
  pot: `<path d="M180 320 L300 320 L280 160 L200 160 Z" fill="{accent}"/><ellipse cx="240" cy="160" rx="60" ry="20" fill="{accent}"/>`,
  earbuds: `<circle cx="180" cy="240" r="50" fill="{accent}"/><circle cx="300" cy="240" r="50" fill="{accent}"/>`,
  knives: `<rect x="100" y="200" width="280" height="20" fill="{accent}"/><rect x="120" y="160" width="15" height="80" fill="#999"/><rect x="200" y="150" width="15" height="90" fill="#999"/>`,
  bed: `<ellipse cx="240" cy="280" rx="140" ry="80" fill="{accent}"/><ellipse cx="240" cy="260" rx="100" ry="50" fill="#fff" opacity="0.2"/>`,
  watch: `<circle cx="240" cy="240" r="90" fill="{accent}"/><circle cx="240" cy="240" r="70" fill="#111"/><rect x="220" y="120" width="40" height="40" fill="{accent}"/>`,
  backpack: `<rect x="160" y="120" width="160" height="240" rx="20" fill="{accent}"/><rect x="200" y="80" width="80" height="50" rx="10" fill="{accent}"/>`,
  purifier: `<rect x="180" y="100" width="120" height="280" rx="16" fill="{accent}"/><circle cx="240" cy="200" r="40" fill="#fff" opacity="0.2"/>`,
  shaker: `<rect x="200" y="120" width="80" height="240" rx="30" fill="{accent}"/><rect x="210" y="80" width="60" height="50" rx="8" fill="{accent}"/>`,
  candle: `<rect x="210" y="200" width="60" height="120" rx="8" fill="{accent}"/><ellipse cx="240" cy="190" rx="30" ry="10" fill="#fff" opacity="0.4"/>`,
  toolbox: `<rect x="100" y="180" width="280" height="160" rx="12" fill="{accent}"/><rect x="180" y="140" width="120" height="40" rx="8" fill="#333"/>`,
  stroller: `<circle cx="160" cy="360" r="40" fill="#333"/><circle cx="320" cy="360" r="40" fill="#333"/><path d="M140 200 L340 200 L300 360 L180 360 Z" fill="{accent}"/>`,
  glasses: `<ellipse cx="180" cy="240" rx="60" ry="40" fill="none" stroke="{accent}" stroke-width="8"/><ellipse cx="300" cy="240" rx="60" ry="40" fill="none" stroke="{accent}" stroke-width="8"/>`,
  vacuum: `<rect x="160" y="160" width="160" height="200" rx="20" fill="{accent}"/><circle cx="240" cy="120" r="50" fill="{accent}"/>`,
  notebook: `<rect x="140" y="120" width="200" height="280" rx="4" fill="{accent}"/><line x1="200" y1="120" x2="200" y2="400" stroke="#fff" opacity="0.3"/>`,
  toothbrush: `<rect x="220" y="80" width="40" height="280" rx="16" fill="{accent}"/><rect x="210" y="60" width="60" height="40" rx="8" fill="{accent}"/>`,
  tent: `<polygon points="240,80 80,360 400,360" fill="{accent}"/><rect x="200" y="280" width="80" height="80" fill="#333"/>`,
  clock: `<circle cx="240" cy="240" r="100" fill="{accent}"/><circle cx="240" cy="240" r="80" fill="#fff"/><line x1="240" y1="240" x2="240" y2="180" stroke="#333" stroke-width="4"/>`,
};

export async function createBenchmarkProductImage(product: BenchmarkProduct): Promise<string> {
  const sharp = (await import("sharp")).default;
  const shape = SHAPE_SVG[product.image.shape] ?? SHAPE_SVG.toy;
  const svg = shape.replace(/\{accent\}/g, product.image.accent);
  const bg = product.image.background.replace("#", "");
  const r = parseInt(bg.slice(0, 2), 16);
  const g = parseInt(bg.slice(2, 4), 16);
  const b = parseInt(bg.slice(4, 6), 16);

  const buf = await sharp({
    create: { width: 480, height: 480, channels: 3, background: { r, g, b } },
  })
    .composite([
      {
        input: Buffer.from(`<svg width="480" height="480" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

  return `data:image/png;base64,${buf.toString("base64")}`;
}
