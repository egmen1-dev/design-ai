#!/usr/bin/env npx tsx
/** Download WB card images for benchmark when local PNGs missing */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const CYCLE1 = path.join("benchmark", "output", "quality-cycle-1");

function wbImageUrl(productId: number): string {
  const vol = Math.floor(productId / 100000);
  const part = Math.floor(productId / 1000);
  const hosts = Array.from({ length: 18 }, (_, i) => String(i + 1).padStart(2, "0"));
  const host = hosts[vol % hosts.length]!;
  return `https://basket-${host}.wbbasket.ru/vol${vol}/part${part}/${productId}/images/big/1.webp`;
}

async function downloadProductImage(productId: number, category: string): Promise<boolean> {
  const dest = path.join(CYCLE1, "wb-cards", category, `${productId}.png`);
  if (fs.existsSync(dest)) return true;

  const urls = [
    wbImageUrl(productId),
    ...Array.from({ length: 18 }, (_, i) => {
      const vol = Math.floor(productId / 100000);
      const part = Math.floor(productId / 1000);
      const host = String(i + 1).padStart(2, "0");
      return `https://basket-${host}.wbbasket.ru/vol${vol}/part${part}/${productId}/images/big/1.webp`;
    }),
  ];

  for (const url of [...new Set(urls)]) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      await fs.promises.mkdir(path.dirname(dest), { recursive: true });
      await sharp(buf).resize(900, 1200, { fit: "cover" }).png().toFile(dest);
      console.log(`  saved ${dest}`);
      return true;
    } catch {
      /* try next host */
    }
  }
  return false;
}

async function main() {
  const category = process.argv[2] ?? "home";
  const index = JSON.parse(
    fs.readFileSync(path.join(CYCLE1, "wb-cards-index.json"), "utf8"),
  ) as Array<{ productId: number; category: string }>;

  const rows = index.filter((r) => r.category === category);
  console.log(`Downloading ${rows.length} ${category} images…`);
  let ok = 0;
  for (const row of rows) {
    if (await downloadProductImage(row.productId, row.category)) ok++;
  }
  console.log(`Done: ${ok}/${rows.length}`);
}

main();
