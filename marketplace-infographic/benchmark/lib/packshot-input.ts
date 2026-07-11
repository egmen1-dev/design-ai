/**
 * Benchmark-only — extract pseudo-packshot from WB leader card hero zone.
 * BV1 used full listing cards as product input (G1 gap); this crops the product region.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PACKSHOT_CACHE = path.join("benchmark", "output", "packshots");

/** Normalized crop — lower-center product zone typical for WB 3:4 cards */
const DEFAULT_CROP = { left: 0.1, top: 0.2, width: 0.8, height: 0.72 };

export function packshotInputEnabled(): boolean {
  return process.env.BV1_PACKSHOT_INPUT === "1";
}

function cachePath(productId: number): string {
  return path.join(PACKSHOT_CACHE, `${productId}.png`);
}

export async function ensurePackshotFromLeader(input: {
  leaderImagePath: string;
  productId: number;
}): Promise<string> {
  const cached = cachePath(input.productId);
  if (fs.existsSync(cached)) {
    const buf = await fs.promises.readFile(cached);
    return `data:image/png;base64,${buf.toString("base64")}`;
  }

  await fs.promises.mkdir(PACKSHOT_CACHE, { recursive: true });

  const metaPath = input.leaderImagePath.replace(/\.png$/i, ".json");
  let crop = { ...DEFAULT_CROP };
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as {
        heroZoneCanvasPct?: number;
      };
      if (meta.heroZoneCanvasPct != null && meta.heroZoneCanvasPct > 20) {
        const heroFrac = Math.min(0.85, meta.heroZoneCanvasPct / 100 + 0.15);
        crop = {
          left: 0.08,
          top: 0.18,
          width: 0.84,
          height: heroFrac,
        };
      }
    } catch {
      /* use default */
    }
  }

  const img = sharp(input.leaderImagePath);
  const dimensions = await img.metadata();
  const w = dimensions.width ?? 900;
  const h = dimensions.height ?? 1200;

  const extract = {
    left: Math.round(w * crop.left),
    top: Math.round(h * crop.top),
    width: Math.max(1, Math.round(w * crop.width)),
    height: Math.max(1, Math.round(h * crop.height)),
  };
  if (extract.left + extract.width > w) extract.width = w - extract.left;
  if (extract.top + extract.height > h) extract.height = h - extract.top;

  const buf = await img.extract(extract).png().toBuffer();
  await fs.promises.writeFile(cached, buf);
  return `data:image/png;base64,${buf.toString("base64")}`;
}
