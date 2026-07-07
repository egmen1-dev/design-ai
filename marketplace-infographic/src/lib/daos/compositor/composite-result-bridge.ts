import { WB_COVER } from "@/lib/composition/canvas";

export type CompositePlacementBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type NormalizedCompositePlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
  areaRatio: number;
  widthRatio: number;
  heightRatio: number;
  source: string;
  confidence: number;
};

function asRecord(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return {};
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function readAxis(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = asNumber(record[key]);
    if (value != null) return value;
  }
  return undefined;
}

function readBounds(record: Record<string, unknown>): CompositePlacementBounds | undefined {
  const left = readAxis(record, ["left", "x"]);
  const top = readAxis(record, ["top", "y"]);
  const width = readAxis(record, ["width", "w"]);
  const height = readAxis(record, ["height", "h"]);
  if (left == null || top == null || width == null || height == null) return undefined;
  if (width <= 0 || height <= 0) return undefined;
  return { left, top, width, height };
}

function resolveCanvas(canvas?: { width: number; height: number }): { width: number; height: number } {
  if (canvas?.width && canvas?.height) return canvas;
  return { width: WB_COVER.width, height: WB_COVER.height };
}

/** Extract product placement bbox from composite result or unknown payload without throwing. */
export function extractCompositeProductPlacement(
  input: unknown,
): { bounds: CompositePlacementBounds; source: string; confidence: number } | undefined {
  if (input == null) return undefined;

  const root = asRecord(input);

  const direct = readBounds(root);
  if (direct) {
    return { bounds: direct, source: "root_bbox", confidence: 0.55 };
  }

  const productPlacement = readBounds(asRecord(root.productPlacement));
  if (productPlacement) {
    return { bounds: productPlacement, source: "productPlacement", confidence: 0.95 };
  }

  const placement = readBounds(asRecord(root.placement));
  if (placement) {
    return { bounds: placement, source: "placement", confidence: 0.9 };
  }

  const product = readBounds(asRecord(root.product));
  if (product) {
    return { bounds: product, source: "product", confidence: 0.85 };
  }

  const bbox = readBounds(asRecord(root.bbox));
  if (bbox) {
    return { bounds: bbox, source: "bbox", confidence: 0.8 };
  }

  const extractArea = asRecord(root.extractArea);
  const extractBounds = readBounds(extractArea);
  if (extractBounds) {
    return { bounds: extractBounds, source: "extractArea", confidence: 0.75 };
  }

  const dimensions = asRecord(root.dimensions);
  const dimWidth = readAxis(dimensions, ["width", "w"]);
  const dimHeight = readAxis(dimensions, ["height", "h"]);
  const dimLeft = readAxis(dimensions, ["left", "x"]) ?? readAxis(root, ["left", "x"]) ?? 0;
  const dimTop = readAxis(dimensions, ["top", "y"]) ?? readAxis(root, ["top", "y"]) ?? 0;
  if (dimWidth != null && dimHeight != null && dimWidth > 0 && dimHeight > 0) {
    return {
      bounds: { left: dimLeft, top: dimTop, width: dimWidth, height: dimHeight },
      source: "dimensions",
      confidence: 0.7,
    };
  }

  return undefined;
}

/** Normalize composite placement into canvas ratios. */
export function normalizeCompositePlacement(input: {
  placement?: CompositePlacementBounds;
  compositeResult?: unknown;
  canvas?: { width: number; height: number };
}): NormalizedCompositePlacement | undefined {
  const extracted =
    input.placement != null
      ? {
          bounds: input.placement,
          source: "placement_input",
          confidence: 0.98,
        }
      : extractCompositeProductPlacement(input.compositeResult);

  if (!extracted) return undefined;

  const canvas = resolveCanvas(input.canvas);
  const canvasArea = canvas.width * canvas.height;
  if (canvasArea <= 0) return undefined;

  const { bounds, source, confidence } = extracted;
  const areaRatio = clamp01((bounds.width * bounds.height) / canvasArea);
  const widthRatio = clamp01(bounds.width / canvas.width);
  const heightRatio = clamp01(bounds.height / canvas.height);

  return {
    x: bounds.left,
    y: bounds.top,
    width: bounds.width,
    height: bounds.height,
    areaRatio,
    widthRatio,
    heightRatio,
    source,
    confidence,
  };
}
