#!/usr/bin/env npx tsx
/** One-off: compositor placement on real home packshot (product-001). */
import fs from "node:fs";
import { ensurePackshotFromLeader } from "./lib/packshot-input";
import { compositeProductIntoScene } from "../src/lib/compositing/scene-compositor";
import { WB_COVER } from "../src/lib/composition/canvas";
import type { ScenePlan } from "../src/lib/design/scene-planner";

const SCENE: ScenePlan = {
  seed: "diag",
  lightingDirection: "top-left",
  lightingTemperature: "5200K",
  shadowProfile: "contact",
  surfaceType: "studio",
  reflectionEnabled: false,
};

async function run(flag: "0" | "1") {
  process.env.DAOS_HERO_VISUAL_MASS = flag;
  const leader = "benchmark/output/quality-cycle-1/wb-cards/home/10392457.png";
  const packshot = await ensurePackshotFromLeader({
    leaderImagePath: leader,
    productId: 10392457,
  });
  const bgBuf = fs.readFileSync(leader);
  const bg = `data:image/png;base64,${bgBuf.toString("base64")}`;
  const r = await compositeProductIntoScene(bg, packshot, {
    layout: "marketplace",
    scene: SCENE,
    objectScale: 0.75,
    commercialCalibration: true,
  });
  const area =
    ((r.productPlacement.width * r.productPlacement.height) /
      (WB_COVER.width * WB_COVER.height)) *
    100;
  console.log(
    `flag=${flag}`,
    `placement=${r.productPlacement.width}x${r.productPlacement.height}`,
    `area=${area.toFixed(1)}%`,
    `measured=${r.commercialCalibration?.commercialMeasuredArea}`,
  );
}

async function main() {
  await run("0");
  await run("1");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
