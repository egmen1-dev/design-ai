import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  bufferToDataUrl,
  prepareProductImageFast,
} from "./background-removal";
import { removeProductBackgroundImgly } from "./imgly-background";

const MAX_BYTES = 4 * 1024 * 1024;
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i;

export function parseProductImageDataUrl(dataUrl: string): {
  buffer: Buffer;
  mime: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
} {
  const normalized = dataUrl.trim();
  const match = normalized.match(DATA_URL_RE);
  if (!match) throw new Error("INVALID_IMAGE_FORMAT");

  const mime = match[1].toLowerCase() as "image/jpeg" | "image/png" | "image/webp";
  const base64 = match[2].replace(/\s/g, "");
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  return { buffer, mime, ext };
}

export async function saveProductCutout(
  buffer: Buffer,
  userId: string,
): Promise<{ absPath: string; webPath: string }> {
  const dir = path.join(process.cwd(), "public", "uploads", "cutouts");
  await mkdir(dir, { recursive: true });
  const filename = `${userId}-${Date.now()}-cutout.png`;
  const absPath = path.join(dir, filename);
  await writeFile(absPath, buffer);
  return { absPath, webPath: `/uploads/cutouts/${filename}` };
}

export async function processProductImageWithImgly(
  buffer: Buffer,
  userId: string,
): Promise<{
  renderSrc: string;
  absPath: string;
  webPath: string;
  cutout: boolean;
  method: string;
}> {
  const { buffer: cutoutBuffer, cutout, method } =
    await removeProductBackgroundImgly(buffer);
  const { absPath, webPath } = await saveProductCutout(cutoutBuffer, userId);
  return {
    renderSrc: bufferToDataUrl(cutoutBuffer),
    absPath,
    webPath,
    cutout,
    method,
  };
}

/** Imgly cutout с fallback на sharp — для фотореалистичной обложки */
export async function processProductImageForCover(
  buffer: Buffer,
  userId: string,
): Promise<{
  renderSrc: string;
  absPath: string;
  webPath: string;
  cutout: boolean;
  method: string;
}> {
  if (process.env.DISABLE_IMGLY === "1") {
    const fast = await processProductImageForGeneration(buffer, userId);
    return { ...fast, method: "sharp-fast" };
  }
  try {
    return await processProductImageWithImgly(buffer, userId);
  } catch (error) {
    console.warn("Imgly cutout failed, sharp fallback:", error);
    const fast = await processProductImageForGeneration(buffer, userId);
    return { ...fast, method: "sharp-fallback" };
  }
}

/** Быстрая вырезка sharp-only — без imgly/onnx, стабильно при генерации. */
export async function processProductImageForGeneration(
  buffer: Buffer,
  userId: string,
): Promise<{
  renderSrc: string;
  absPath: string;
  webPath: string;
  cutout: boolean;
}> {
  const { buffer: cutoutBuffer, cutout } = await prepareProductImageFast(buffer);
  const { absPath, webPath } = await saveProductCutout(cutoutBuffer, userId);
  return {
    renderSrc: bufferToDataUrl(cutoutBuffer),
    absPath,
    webPath,
    cutout,
  };
}
