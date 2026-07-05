import { mkdir, writeFile } from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";

export async function renderHtmlToImage(
  html: string,
  outputFilename: string,
): Promise<string> {
  const outputDir = path.join(process.cwd(), "public", "generated");
  await mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, outputFilename);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) {
                resolve();
                return;
              }
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(resolve, 5000);
            }),
        ),
      );
    });

    const screenshot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: 1200, height: 1200 },
    });
    await writeFile(outputPath, screenshot);

    return `/api/generated/${outputFilename}`;
  } finally {
    await browser.close();
  }
}
