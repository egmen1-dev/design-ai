import type { ProductAnalysis } from "@/lib/product-analysis";

export function buildProductAnalysisPrompt(analysis: ProductAnalysis): string {
  return `АНАЛИЗ ТОВАРА (заполни в JSON)
audienceAnalysis:
  category: ${analysis.category}
  priceSegment: ${analysis.priceSegment}
  audienceGender: ${analysis.audienceGender}
  useCases: ${JSON.stringify(analysis.useCases)}
  painPoints: ${JSON.stringify(analysis.painPoints)}
  emotionalTriggers: ${JSON.stringify(analysis.emotionalTriggers)}

marketingStrategy: сформулируй УТП для WB/Ozon на основе описания
designConcept: одно предложение — художественная идея карточки`;
}

export function buildPhotographyPrompt(): string {
  return `ФОТОГРАФИЯ ТОВАРА (для композитинга)
cameraAngle: three-quarter / slight low angle
perspective: natural product photography
objectScale: 0.55-0.62 canvas height
lightDirection: top-left key light (совпадает с фоном)
lightTemperature: 5200-5800K daylight
shadowType: contact + soft ambient
reflection: subtle if surface is grass/floor
depthLayers: foreground product, midground lawn, background bokeh`;
}
