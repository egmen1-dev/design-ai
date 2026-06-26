import type { InfographicStyle } from "@/lib/design-trends";
import type { DesignLibrary } from "@/lib/design-library";
import type { DesignExampleRecord } from "@/lib/select-relevant-examples";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type { ResolvedReferenceContext } from "@/lib/reference-style-resolver";
import { buildSystemPrompt } from "./system";
import { buildStylePrompt } from "./style";
import { buildLayoutPrompt, buildCompositionRules } from "./layout";
import { buildTypographyPrompt } from "./typography";
import { buildColorsPrompt } from "./colors";
import { buildBadgesPrompt } from "./badges";
import { buildExamplesPrompt } from "./examples";
import { buildBackgroundPromptInstructions } from "./background";
import { buildProductAnalysisPrompt, buildPhotographyPrompt } from "./product-analysis";
import { buildQualityChecklistPrompt } from "./quality";
import { buildJsonSchemaPrompt } from "./json-schema";

export function buildDesignProcessOverview(): string {
  return `# 11. МНОГОЭТАПНЫЙ ПРОЦЕСС ПРОЕКТИРОВАНИЯ

Не заполняй шаблон. Работай как арт-директор:
1. Анализ товара → 2. Художественная концепция → 3. visualHook (почему остановят взгляд)
→ 4. Композиция → 5. Типографика → 6. Цвета → 7. Декор → 8. Самопроверка ≥90.

visualHook — одна сильная идея, вокруг которой строится весь макет.`;
}

export type AssemblePromptInput = {
  productPrompt: string;
  style: InfographicStyle;
  analysis: ProductAnalysis;
  library: DesignLibrary;
  examples: DesignExampleRecord[];
  referenceContext: ResolvedReferenceContext;
  retryHint?: string;
};

export function assembleDesignBriefPrompt(input: AssemblePromptInput): string {
  const refColors = input.referenceContext.colors ?? undefined;
  const accent = refColors?.[0] ?? "#00a8b5";

  const sections = [
    buildSystemPrompt(),
    buildDesignProcessOverview(),
    buildProductAnalysisPrompt(input.analysis),
    buildStylePrompt(input.style, input.analysis),
    buildCompositionRules(),
    buildLayoutPrompt(refColors),
    buildColorsPrompt(input.analysis, refColors),
    buildPhotographyPrompt(),
    buildBackgroundPromptInstructions(),
    buildTypographyPrompt(input.library, input.analysis, input.style),
    buildBadgesPrompt(input.library, input.analysis, input.style, accent),
    buildExamplesPrompt(input.examples),
    buildQualityChecklistPrompt(),
    buildJsonSchemaPrompt(),
  ];

  if (input.referenceContext.compositionHint) {
    sections.push(`РЕФЕРЕНС КОМПОЗИЦИИ: ${input.referenceContext.compositionHint}`);
  }

  if (input.retryHint) {
    sections.push(input.retryHint);
  }

  sections.push(`ОПИСАНИЕ ТОВАРА:\n"${input.productPrompt}"`);

  sections.push(`КОМПОЗИЦИЯ (Design Composition Engine)
Холст Wildberries: 900×1200 (3:4). Все размеры — в % от ширины/высоты.
Товар: 55–72% площади (категория уточняет), высота 68–88%, отступ от краёв ≥5%.
Плашки: ≤12% площади кадра. Safe area 5%. Белое пространство 20–35%.`);

  return sections.join("\n\n");
}
