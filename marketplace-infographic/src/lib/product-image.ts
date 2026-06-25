import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  bufferToDataUrl,
  prepareProductImageForRender,
} from "./background-removal";

const MAX_BYTES = 4 * 1024 * 1024;
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i;

export function parseProductImageDataUrl(dataUrl: string): {
  buffer: Buffer;
  mime: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
} {
  const normalized = dataUrl.trim();
  const match = normalized.match(DATA_URL_RE);
  if (!match) {
    throw new Error("INVALID_IMAGE_FORMAT");
  }

  const mime = match[1].toLowerCase() as "image/jpeg" | "image/png" | "image/webp";
  const base64 = match[2].replace(/\s/g, "");
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  return { buffer, mime, ext };
}

export async function saveProductImage(
  buffer: Buffer,
  userId: string,
  ext: "jpg" | "png" | "webp",
): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  const filename = `${userId}-${Date.now()}.${ext}`;
  const fullPath = path.join(dir, filename);
  await writeFile(fullPath, buffer);
  return fullPath;
}

export type ProcessedProductImage = {
  /** data: URL — Puppeteer надёжно грузит inline, не file:// */
  renderSrc: string;
  absPath: string;
  cutout: boolean;
};

/** Сохраняет cutout на диск и возвращает data URL для рендера */
export async function processProductImage(
  buffer: Buffer,
  userId: string,
): Promise<ProcessedProductImage> {
  const { buffer: renderBuffer, cutout } = await prepareProductImageForRender(buffer);
  const dir = path.join(process.cwd(), "public", "uploads", "cutouts");
  await mkdir(dir, { recursive: true });
  const filename = `${userId}-${Date.now()}-cutout.png`;
  const absPath = path.join(dir, filename);
  await writeFile(absPath, renderBuffer);

  return {
    renderSrc: bufferToDataUrl(renderBuffer),
    absPath,
    cutout,
  };
}

export function stripProductImageFromHtml(html: string, renderSrc: string): string {
  return html.split(renderSrc).join("[PRODUCT_IMAGE_CUTOUT]");
}
