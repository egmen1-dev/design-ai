export type ExtractRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Clamp extract region to image bounds — prevents sharp extract_area failures. */
export function clampExtractRect(
  imageWidth: number,
  imageHeight: number,
  rect: ExtractRect,
  minSize = 4,
): ExtractRect | null {
  const left = Math.max(0, Math.min(rect.left, imageWidth - 1));
  const top = Math.max(0, Math.min(rect.top, imageHeight - 1));
  const width = Math.min(rect.width, imageWidth - left);
  const height = Math.min(rect.height, imageHeight - top);
  if (width < minSize || height < minSize) return null;
  return { left, top, width, height };
}
