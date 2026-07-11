/**
 * Benchmark-only product images for production handler runs.
 * Realistic silhouettes on transparent/neutral backgrounds — not Sprint 9 synthetic rects.
 */
import sharp from "sharp";

export type BenchmarkProductId =
  | "construction-vacuum"
  | "battery-sprayer"
  | "impact-drill"
  | "pressure-washer"
  | "home-humidifier";

const SVG_BY_PRODUCT: Record<BenchmarkProductId, string> = {
  "construction-vacuum": `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="800" fill="#f0f0f0"/>
    <rect x="220" y="180" width="360" height="420" rx="40" fill="#f4c430"/>
    <rect x="250" y="220" width="300" height="120" rx="16" fill="#333"/>
    <circle cx="400" cy="560" r="55" fill="#222"/>
    <rect x="120" y="300" width="90" height="50" rx="12" fill="#555"/>
  </svg>`,
  "battery-sprayer": `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="800" fill="#eef6ee"/>
    <rect x="300" y="120" width="200" height="520" rx="36" fill="#2d8f4e"/>
    <rect x="330" y="160" width="140" height="80" rx="12" fill="#1a1a1a"/>
    <ellipse cx="400" cy="680" rx="90" ry="24" fill="#1a1a1a"/>
  </svg>`,
  "impact-drill": `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="800" fill="#ececec"/>
    <rect x="180" y="320" width="420" height="140" rx="28" fill="#2a2a2a"/>
    <rect x="560" y="350" width="120" height="80" rx="12" fill="#444"/>
    <rect x="220" y="280" width="80" height="220" rx="20" fill="#1a1a1a"/>
    <circle cx="250" cy="390" r="18" fill="#c0392b"/>
  </svg>`,
  "pressure-washer": `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="800" fill="#f5f5f5"/>
    <rect x="240" y="200" width="320" height="380" rx="24" fill="#2563eb"/>
    <rect x="280" y="240" width="240" height="100" rx="12" fill="#111"/>
    <rect x="360" y="580" width="80" height="140" rx="10" fill="#333"/>
    <circle cx="400" cy="160" r="40" fill="#666"/>
  </svg>`,
  "home-humidifier": `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="800" fill="#f8fafc"/>
    <rect x="260" y="200" width="280" height="400" rx="48" fill="#e2e8f0"/>
    <rect x="300" y="260" width="200" height="120" rx="16" fill="#94a3b8"/>
    <ellipse cx="400" cy="640" rx="120" ry="30" fill="#cbd5e1"/>
  </svg>`,
};

export async function createProductionBenchmarkProductImage(
  productId: BenchmarkProductId,
): Promise<string> {
  const buf = await sharp(Buffer.from(SVG_BY_PRODUCT[productId])).png().toBuffer();
  return `data:image/png;base64,${buf.toString("base64")}`;
}
