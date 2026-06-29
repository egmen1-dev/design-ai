/**
 * Chapter 3.18 — Extract vision signals from image (no blueprint)
 */
import { createHash } from "crypto";
import type { VisionImageSignals } from "./vision-qa-types";

export function hashVisionImage(image: string): string {
  return createHash("sha256").update(image).digest("hex");
}

function decodeBase64Payload(image: string): Buffer {
  const raw = image.includes(",") ? image.split(",")[1]! : image;
  return Buffer.from(raw, "base64");
}

function parsePngDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24) return null;
  if (buf[0] !== 0x89 || buf.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function parseJpegDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      const height = buf.readUInt16BE(i + 5);
      const width = buf.readUInt16BE(i + 7);
      return { width, height };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}

export function parseImageDimensions(image: string): { width: number; height: number } {
  const buf = decodeBase64Payload(image);
  return parsePngDimensions(buf) ?? parseJpegDimensions(buf) ?? { width: 1080, height: 1080 };
}

export function productAreaFromMask(mask: string | undefined, width: number, height: number): number {
  if (!mask) return 0.35;
  const buf = decodeBase64Payload(mask);
  if (buf.length === 0) return 0.35;
  let white = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] > 200) white += 1;
  }
  const totalPixels = width * height;
  if (totalPixels <= 0) return 0.35;
  const sampledRatio = white / buf.length;
  return Math.min(1, Math.max(0, sampledRatio * (buf.length / totalPixels)));
}

export function deriveVisionSignals(image: string, productMask?: string): VisionImageSignals {
  const { width, height } = parseImageDimensions(image);
  const buf = decodeBase64Payload(image);
  const bytes = buf.length;
  const productAreaRatio = productAreaFromMask(productMask, width, height);

  let noiseLevel = 0.1;
  let jpegArtifactScore = 0.1;
  for (let i = 0; i < Math.min(buf.length, 4096); i++) {
    const v = buf[i];
    if (i > 0 && Math.abs(v - buf[i - 1]) > 64) noiseLevel += 0.0002;
    if (v === 0xff && buf[i + 1] === 0xd8) jpegArtifactScore += 0.05;
  }
  noiseLevel = Math.min(1, noiseLevel);
  jpegArtifactScore = Math.min(1, jpegArtifactScore);

  const minDim = Math.min(width, height);
  const blurScore = bytes < minDim * minDim * 0.05 ? 0.6 : 0.1;
  const overexposure = bytes > minDim * minDim * 2 ? 0.15 : 0.05;

  const hasContactShadow = productMask ? productAreaRatio > 0.2 && productAreaRatio < 0.75 : true;
  const lightingMismatch = productMask && productAreaRatio < 0.25 ? 0.5 : 0.15;
  const perspectiveMismatch = productAreaRatio < 0.2 ? 0.45 : 0.1;
  const backgroundClutter = productAreaRatio > 0.7 ? 0.5 : 0.2;
  const headlineWhitespaceRatio = productAreaRatio > 0.55 ? 0.25 : 0.7;

  return {
    width,
    height,
    productAreaRatio,
    hasContactShadow,
    lightingMismatch,
    perspectiveMismatch,
    backgroundClutter,
    headlineWhitespaceRatio,
    duplicateProduct: false,
    noiseLevel,
    jpegArtifactScore,
    overexposure,
    blurScore,
  };
}
