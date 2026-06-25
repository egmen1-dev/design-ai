import { mkdir, writeFile } from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";

const WATERMARK_TEXT = process.env.WATERMARK_TEXT ?? "design-ai";
export const GENERATED_IMAGES_DIR =
  process.env.GENERATED_IMAGES_DIR ?? path.join(process.cwd(), "generated");

export async function renderHtmlToImage(
  html: string,
  outputFilename: string,
): Promise<string> {
  const outputDir = GENERATED_IMAGES_DIR;
  await mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, outputFilename);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const screenshot = await page.screenshot({ type: "png", fullPage: true });
    const watermarked = await applyWatermark(screenshot);
    await writeFile(outputPath, watermarked);

    return `/api/generated/${encodeURIComponent(outputFilename)}`;
  } finally {
    await browser.close();
  }
}

async function applyWatermark(imageBuffer: Uint8Array): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    const base64 = Buffer.from(imageBuffer).toString("base64");

    await page.setContent(
      `<!DOCTYPE html>
<html>
<head><style>
  * { margin: 0; padding: 0; }
  body { position: relative; display: inline-block; }
  img { display: block; max-width: 100%; }
  .watermark {
    position: absolute; bottom: 24px; right: 24px;
    font-family: system-ui, sans-serif; font-size: 18px; font-weight: 600;
    color: rgba(255,255,255,0.85); text-shadow: 0 1px 4px rgba(0,0,0,0.6);
    background: rgba(0,0,0,0.35); padding: 8px 14px; border-radius: 6px;
    letter-spacing: 0.05em;
  }
</style></head>
<body>
  <img src="data:image/png;base64,${base64}" />
  <div class="watermark">${WATERMARK_TEXT}</div>
</body>
</html>`,
      { waitUntil: "networkidle0" },
    );

    const element = await page.$("body");
    if (!element) {
      return Buffer.from(imageBuffer);
    }

    const boxed = await element.screenshot({ type: "png" });
    return Buffer.from(boxed);
  } finally {
    await browser.close();
  }
}
