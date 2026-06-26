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

  return sections.join("\n\n");
}
