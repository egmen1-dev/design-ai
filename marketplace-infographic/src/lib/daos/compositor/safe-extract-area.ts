export type ExtractArea = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ImageSize = {
  width: number;
  height: number;
};

export type SafeExtractAreaResult = {
  area: ExtractArea;
  warnings: string[];
  corrected: boolean;
};

export type ExtractAreaGuard = {
  warnings: string[];
  corrected: boolean;
};

function roundPx(value: number): number {
  return Math.round(value);
}

function normalizedImageSize(imageSize: ImageSize): ImageSize {
  return {
    width: Math.max(1, roundPx(imageSize.width)),
    height: Math.max(1, roundPx(imageSize.height)),
  };
}

function isCompletelyOutside(area: ExtractArea, imageSize: ImageSize): boolean {
  const { width: iw, height: ih } = normalizedImageSize(imageSize);
  return (
    area.left >= iw ||
    area.top >= ih ||
    area.left + area.width <= 0 ||
    area.top + area.height <= 0
  );
}

function centeredFallback(imageSize: ImageSize): ExtractArea {
  const { width: iw, height: ih } = normalizedImageSize(imageSize);
  const width = Math.max(1, Math.min(iw, Math.round(iw * 0.4)));
  const height = Math.max(1, Math.min(ih, Math.round(ih * 0.4)));
  return {
    left: Math.floor((iw - width) / 2),
    top: Math.floor((ih - height) / 2),
    width,
    height,
  };
}

/** Validate extract bbox against image bounds without mutating. */
export function validateExtractArea(area: ExtractArea, imageSize: ImageSize): string[] {
  const warnings: string[] = [];
  const { width: iw, height: ih } = normalizedImageSize(imageSize);

  if (area.left < 0) warnings.push("LEFT_NEGATIVE");
  if (area.top < 0) warnings.push("TOP_NEGATIVE");
  if (area.width <= 0) warnings.push("WIDTH_NON_POSITIVE");
  if (area.height <= 0) warnings.push("HEIGHT_NON_POSITIVE");
  if (area.left + area.width > iw) warnings.push("WIDTH_OVERFLOW");
  if (area.top + area.height > ih) warnings.push("HEIGHT_OVERFLOW");
  if (isCompletelyOutside(area, { width: iw, height: ih })) {
    warnings.push("AREA_OUTSIDE_CANVAS");
  }

  return warnings;
}

/** Clamp extract bbox into image bounds (minimum 1×1 px). */
export function clampExtractArea(area: ExtractArea, imageSize: ImageSize): ExtractArea {
  const { width: iw, height: ih } = normalizedImageSize(imageSize);

  if (isCompletelyOutside(area, { width: iw, height: ih })) {
    return centeredFallback({ width: iw, height: ih });
  }

  let left = Math.max(0, roundPx(area.left));
  let top = Math.max(0, roundPx(area.top));
  let width = Math.max(1, roundPx(area.width));
  let height = Math.max(1, roundPx(area.height));

  if (left >= iw) left = Math.max(0, iw - 1);
  if (top >= ih) top = Math.max(0, ih - 1);

  width = Math.min(width, iw - left);
  height = Math.min(height, ih - top);
  width = Math.max(1, width);
  height = Math.max(1, height);

  if (left + width > iw) width = Math.max(1, iw - left);
  if (top + height > ih) height = Math.max(1, ih - top);

  return { left, top, width, height };
}

/** Create a sharp-safe extract area with warnings instead of throwing. */
export function createSafeExtractArea(
  area: ExtractArea,
  imageSize: ImageSize,
): SafeExtractAreaResult {
  const validationWarnings = validateExtractArea(area, imageSize);
  const outside = isCompletelyOutside(area, imageSize);
  const clamped = clampExtractArea(area, imageSize);
  const warnings = [...validationWarnings];

  if (outside) {
    warnings.push("FALLBACK_CENTERED_AREA");
  }

  const corrected =
    validationWarnings.length > 0 ||
    clamped.left !== roundPx(area.left) ||
    clamped.top !== roundPx(area.top) ||
    clamped.width !== roundPx(area.width) ||
    clamped.height !== roundPx(area.height);

  return { area: clamped, warnings, corrected };
}

/** Merge safe-extract warnings into an optional accumulator (used by compositor). */
export function mergeExtractGuard(
  guard: ExtractAreaGuard | undefined,
  result: SafeExtractAreaResult,
): void {
  if (!guard) return;
  guard.warnings.push(...result.warnings);
  if (result.corrected) guard.corrected = true;
}
