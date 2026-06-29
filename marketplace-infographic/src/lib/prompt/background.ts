import type { ProductCategory } from "@/lib/product-analysis";
import { stripProductFromBackgroundPrompt } from "@/lib/product-render-policy";

const CATEGORY_BG: Record<ProductCategory, string> = {
  garden_tools:
    "Premium outdoor lifestyle scene, manicured suburban lawn garden path, wooden fence softly blurred, golden hour natural daylight, cinematic depth of field, clear empty grass foreground, atmospheric perspective, ultra realistic commercial photography, no objects",
  electronics:
    "Luxury advertising studio, premium product photography backdrop, elegant soft gradient, cinematic volumetric lighting, sophisticated neutral atmosphere, clear empty center foreground, high-end commercial style, ultra realistic",
  cosmetics:
    "Soft beauty studio atmosphere, elegant pastel gradient, diffused window light, premium skincare advertising mood, clean empty foreground, sophisticated feminine atmosphere, ultra realistic",
  home_appliances:
    "Modern home interior bokeh, warm cozy living space blurred background, soft natural daylight through window, lifestyle advertising atmosphere, clear empty foreground, ultra realistic",
  fashion:
    "Editorial fashion studio, neutral textured backdrop, soft key light, premium lookbook atmosphere, clear empty foreground, ultra realistic commercial photography",
  food:
    "Rustic kitchen tabletop scene blurred, warm appetizing natural light, organic premium food photography atmosphere, clear empty foreground, ultra realistic",
  sport:
    "Dynamic athletic environment blur, energetic lighting, modern sport advertising atmosphere, clear empty foreground, ultra realistic",
  kids:
    "Bright playful room bokeh, soft cheerful daylight, family-friendly atmosphere, clear empty foreground, ultra realistic",
  auto:
    "Garage workshop atmosphere blur, industrial premium lighting, automotive commercial mood, clear empty foreground, ultra realistic",
  premium:
    "Luxury commercial studio, premium advertising background, elegant soft gradient, cinematic volumetric light, sophisticated high-end atmosphere, clear empty foreground, ultra realistic",
  generic:
    "Premium commercial studio background, elegant soft gradient, cinematic volumetric lighting, realistic depth, clear empty foreground, ultra realistic commercial photography",
};

export function buildBackgroundTemplate(category: ProductCategory): string {
  return CATEGORY_BG[category] ?? CATEGORY_BG.generic;
}

export function enrichBriefBackgroundPrompt(
  rawPrompt: string,
  category: ProductCategory,
): string {
  const stripped = stripProductFromBackgroundPrompt(rawPrompt);
  if (stripped.length < 40) {
    return buildBackgroundTemplate(category);
  }
  return `${stripped}, ${buildBackgroundTemplate(category).split(",").slice(-4).join(",")}`;
}

export function buildBackgroundPromptInstructions(): string {
  return `ФОН (backgroundPrompt) — только АНГЛИЙСКИЙ, уровня Midjourney:
- Premium commercial studio / lifestyle scene
- Cinematic volumetric lighting, depth of field
- clear empty foreground, no product, no tools, no text, no people
- ЗАПРЕЩЕНО: white background, blue background, упоминание товара`;
}
