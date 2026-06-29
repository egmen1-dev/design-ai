import type { ProductAnalysis } from "@/lib/product-analysis";

export function buildColorsPrompt(
  analysis: ProductAnalysis,
  referenceColors?: string[],
): string {
  const defaults =
    analysis.category === "garden_tools"
      ? ["#00a8b5", "#ffffff", "#0f172a"]
      : analysis.category === "cosmetics"
        ? ["#d946ef", "#fdf4ff", "#1f2937"]
        : analysis.category === "electronics"
          ? ["#2563eb", "#e0e7ff", "#0f172a"]
          : ["#e31e24", "#ffffff", "#0f172a"];

  const palette = referenceColors?.length ? referenceColors : defaults;

  return `ЦВЕТ
colorPalette: [accent, secondary, dark] — accent НИКОГДА не белый (#fff) и не светло-серый
Первый цвет — насыщенный брендовый акцент для текста на белых карточках: [${palette.join(", ")}]
contrast: высокий для читаемости на фоне
Учитывай категорию ${analysis.category} и сегмент ${analysis.priceSegment}`;
}
