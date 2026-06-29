import sharp from "sharp";
import { getAlphaBounds } from "./ground-detector";

/** Вписывает товар по силуэту cutout — рама не обрезается по краям кадра */
export async function fitProductByAlphaBounds(
  productBuffer: Buffer,
  maxAlphaW: number,
  maxAlphaH: number,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  let current = await sharp(productBuffer).ensureAlpha().png().toBuffer({ resolveWithObject: true });

  for (let attempt = 0; attempt < 6; attempt++) {
    const bounds = await getAlphaBounds(current.data);
    const w = current.info.width;
    const h = current.info.height;

    if (!bounds) {
      return { buffer: current.data, width: w, height: h };
    }

    if (bounds.width <= maxAlphaW && bounds.height <= maxAlphaH) {
      return { buffer: current.data, width: w, height: h };
    }

    const scale =
      Math.min(maxAlphaW / bounds.width, maxAlphaH / bounds.height, 1) * 0.9;

    const nextW = Math.max(64, Math.round(w * scale));
    const nextH = Math.max(64, Math.round(h * scale));

    current = await sharp(current.data)
      .resize(nextW, nextH, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer({ resolveWithObject: true });
  }

  return {
    buffer: current.data,
    width: current.info.width,
    height: current.info.height,
  };
}

export async function resolveAlphaCenteredLeft(
  productBuffer: Buffer,
  productWidth: number,
  sideMargin: number,
  canvasW: number,
  compositionLayout?: { product: { left: number; width: number } },
): Promise<number> {
  const bounds = await getAlphaBounds(productBuffer);
  const alphaCenterInImage = bounds
    ? bounds.left + bounds.width / 2
    : productWidth / 2;

  let targetCenter = canvasW / 2;
  if (compositionLayout) {
    const zoneLeft = (compositionLayout.product.left / 100) * canvasW;
    const zoneW = (compositionLayout.product.width / 100) * canvasW;
    targetCenter = zoneLeft + zoneW / 2;
  }

  let left = Math.round(targetCenter - alphaCenterInImage);
  const alphaW = bounds?.width ?? productWidth;
  const minLeft = sideMargin;
  const maxLeft = canvasW - sideMargin - (bounds ? bounds.right + 1 : productWidth);

  if (bounds) {
    left = Math.max(minLeft - bounds.left, Math.min(left, maxLeft));
  } else {
    left = Math.max(minLeft, Math.min(left, canvasW - sideMargin - productWidth));
  }

  if (left + (bounds?.right ?? productWidth) > canvasW - sideMargin) {
    left = canvasW - sideMargin - (bounds?.right ?? productWidth) - 4;
  }
  if (left + (bounds?.left ?? 0) < sideMargin) {
    left = sideMargin - (bounds?.left ?? 0) + 4;
  }

  return Math.round(left);
}

/** Уменьшает cutout пока силуэт не влезает в кадр с отступами */
export async function fitProductWithSafePlacement(
  productBuffer: Buffer,
  productWidth: number,
  productHeight: number,
  canvasW: number,
  sideMargin: number,
  maxAlphaW: number,
  maxAlphaH: number,
  compositionLayout?: { product: { left: number; width: number } },
): Promise<{ buffer: Buffer; width: number; height: number; left: number }> {
  let buffer = productBuffer;
  let width = productWidth;
  let height = productHeight;

  for (let attempt = 0; attempt < 8; attempt++) {
    const fitted = await fitProductByAlphaBounds(buffer, maxAlphaW, maxAlphaH);
    buffer = fitted.buffer;
    width = fitted.width;
    height = fitted.height;

    const bounds = await getAlphaBounds(buffer);
    let left = await resolveAlphaCenteredLeft(
      buffer,
      width,
      sideMargin,
      canvasW,
      compositionLayout,
    );

    if (bounds) {
      const rightEdge = left + bounds.right;
      const leftEdge = left + bounds.left;
      if (rightEdge <= canvasW - sideMargin && leftEdge >= sideMargin) {
        return { buffer, width, height, left };
      }
    } else if (left >= sideMargin && left + width <= canvasW - sideMargin) {
      return { buffer, width, height, left };
    }

    const scale = 0.88;
    const nextW = Math.max(64, Math.round(width * scale));
    const nextH = Math.max(64, Math.round(height * scale));
    const resized = await sharp(buffer)
      .resize(nextW, nextH, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer({ resolveWithObject: true });
    buffer = resized.data;
    width = resized.info.width;
    height = resized.info.height;
    maxAlphaW = Math.round(maxAlphaW * scale);
    maxAlphaH = Math.round(maxAlphaH * scale);
  }

  const left = await resolveAlphaCenteredLeft(
    buffer,
    width,
    sideMargin,
    canvasW,
    compositionLayout,
  );
  return { buffer, width, height, left };
}

/** Подтягивает нижнюю часть cutout к цвету пола */
export async function applyFloorColorSpill(
  productBuffer: Buffer,
  floorColor: { r: number; g: number; b: number },
  strength = 0.12,
): Promise<Buffer> {
  const meta = await sharp(productBuffer).metadata();
  const w = meta.width ?? 400;
  const h = meta.height ?? 400;

  const spillSvg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sp" x1="0.5" y1="0.55" x2="0.5" y2="1">
          <stop offset="0%" stop-color="rgb(${floorColor.r},${floorColor.g},${floorColor.b})" stop-opacity="0"/>
          <stop offset="100%" stop-color="rgb(${floorColor.r},${floorColor.g},${floorColor.b})" stop-opacity="${strength}"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#sp)"/>
    </svg>`;

  return sharp(productBuffer)
    .composite([{ input: Buffer.from(spillSvg), blend: "soft-light" }])
    .png()
    .toBuffer();
}
