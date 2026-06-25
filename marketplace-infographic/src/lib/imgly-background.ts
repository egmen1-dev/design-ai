import { removeBackground } from "@imgly/background-removal-node";
import { prepareProductImageForRender } from "./background-removal";

/** Вырезка фона: imgly (качество) → sharp fallback */
export async function removeProductBackgroundImgly(input: Buffer): Promise<{
  buffer: Buffer;
  cutout: boolean;
  method: "imgly" | "sharp";
}> {
  try {
    const blob = await removeBackground(input, {
      model: "medium",
      output: { format: "image/png", quality: 0.9 },
    });
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length > 500) {
      return { buffer, cutout: true, method: "imgly" };
    }
  } catch (error) {
    console.warn("imgly background removal failed, using sharp:", error);
  }

  const fallback = await prepareProductImageForRender(input);
  return { buffer: fallback.buffer, cutout: fallback.cutout, method: "sharp" };
}
