import path from "path";
import type { CanvasComposeInput, CanvasComposeResult } from "../types";
import { compositeProductIntoScene } from "@/lib/compositing/scene-compositor";

/**
 * Canvas Composer v17
 *
 * Image models generate ONLY: background, environment, lighting, depth, atmosphere.
 * Product, headline, badges, CTA, icons — composed afterwards.
 *
 * Product PNG is NEVER regenerated — always original cutout.
 */
export async function composeCanvas(input: CanvasComposeInput): Promise<CanvasComposeResult> {
  if (!input.preserveProductPixels) {
    throw new Error("v17 requires preserveProductPixels: true");
  }

  const bgSource =
    input.backgroundBuffer.length > 0
      ? `data:image/png;base64,${input.backgroundBuffer.toString("base64")}`
      : "";

  const composite = await compositeProductIntoScene(bgSource, input.productCutoutPath, {
    layout: "marketplace",
    scene: input.scenePlan,
    compositionLayout: input.compositionLayout,
    objectScale: input.objectScale,
  });

  return {
    mergedBuffer: composite.mergedBuffer,
    mergedPath: composite.mergedPath,
    lighting: composite.lighting,
    productPlacement: composite.productPlacement,
  };
}

export function mergedBufferToDataUrl(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

export function resolveCutoutWebPath(cutoutPath: string): string {
  return cutoutPath.startsWith("/") ? cutoutPath : `/${cutoutPath.replace(/^\/+/, "")}`;
}
