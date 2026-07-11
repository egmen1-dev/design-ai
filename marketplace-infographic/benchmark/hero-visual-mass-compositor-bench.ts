#!/usr/bin/env npx tsx
/**
 * Compositor isolation bench — Hero Visual Mass placement area (no DB).
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { compositeProductIntoScene } from "../src/lib/compositing/scene-compositor";
import { WB_COVER } from "../src/lib/composition/canvas";
import type { ScenePlan } from "../src/lib/design/scene-planner";

process.chdir(path.join(__dirname, ".."));

const OUT = path.join("benchmark", "output", "hero-visual-mass-sprint1", "compositor-bench");

const SCENE: ScenePlan = {
  seed: "hvm-bench",
  lightingDirection: "top-left",
  lightingTemperature: "5200K",
  shadowProfile: "contact",
  surfaceType: "studio",
  reflectionEnabled: false,
};

async function makeFlatCutout(): Promise<Buffer> {
  const w = 520;
  const h = 280;
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="40" width="480" height="200" rx="24" fill="#e8e4df"/>
      <rect x="40" y="60" width="440" height="24" rx="8" fill="#c9c4bc"/>
      <rect x="40" y="100" width="440" height="24" rx="8" fill="#c9c4bc"/>
      <rect x="40" y="140" width="440" height="24" rx="8" fill="#c9c4bc"/>
    </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function makeBackground(): Promise<Buffer> {
  const svg = `<svg width="${WB_COVER.width}" height="${WB_COVER.height}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f5f3ef"/><stop offset="100%" stop-color="#e8e6e2"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function runMode(flag: "0" | "1") {
  process.env.DAOS_HERO_VISUAL_MASS = flag;
  const bgBuf = await makeBackground();
  const cutBuf = await makeFlatCutout();
  const bgData = `data:image/png;base64,${bgBuf.toString("base64")}`;
  const cutData = `data:image/png;base64,${cutBuf.toString("base64")}`;

  const result = await compositeProductIntoScene(bgData, cutData, {
    layout: "marketplace",
    scene: SCENE,
    objectScale: 0.75,
    commercialCalibration: true,
  });

  const areaPct =
    ((result.productPlacement.width * result.productPlacement.height) /
      (WB_COVER.width * WB_COVER.height)) *
    100;

  fs.mkdirSync(OUT, { recursive: true });
  await sharp(result.mergedBuffer).toFile(path.join(OUT, `merged-${flag}.png`));

  return {
    flag,
    placement: result.productPlacement,
    areaPct: Number(areaPct.toFixed(1)),
    calibration: result.commercialCalibration,
  };
}

async function main() {
  const off = await runMode("0");
  const on = await runMode("1");
  const delta = Number((on.areaPct - off.areaPct).toFixed(1));

  const summary = {
    version: "hero-visual-mass-compositor-bench",
    timestamp: new Date().toISOString(),
    legacy: off,
    heroMass: on,
    areaDeltaPp: delta,
    pass: delta >= 8,
  };

  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));

  console.log("=== Compositor Bench ===");
  console.log(`Legacy area: ${off.areaPct}%`);
  console.log(`Hero mass area: ${on.areaPct}%`);
  console.log(`Delta: +${delta}pp`);
  console.log(`Placement ${off.placement.width}x${off.placement.height} → ${on.placement.width}x${on.placement.height}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
