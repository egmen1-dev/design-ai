import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { bufferToDataUrl } from "./background-removal";
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
