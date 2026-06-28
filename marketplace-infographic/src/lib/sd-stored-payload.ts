import { DEFAULT_STYLE, STYLE_KEYS, type InfographicStyle } from "@/lib/design-trends";
import type { CompositingHints, DesignBrief } from "@/lib/design-brief/schema";
import type { CompositionResult } from "@/lib/design/types";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { QualityValidationResult } from "@/lib/design/quality-validator";
import type { InfographicSdInput } from "@/lib/validations";
import type { FeedbackLearningSnapshot } from "@/lib/feedback/types";
import type { PromptCompilerMetadata } from "@/lib/design/prompt-compiler";
import type { ConstitutionReport } from "@/lib/design/design-constitution";
import type { StoredRenderReport, GenerationDiagnosticReport } from "@/lib/generation/diagnostic-report";
import { sanitizeSdInput } from "@/lib/sd-sanitize";

export type StoredSdPayload = {
  data: InfographicSdInput;
  style: InfographicStyle;
  brief?: DesignBrief;
  compositingHints?: CompositingHints;
  qualityScore?: number;
  composition?: Pick<CompositionResult, "dna" | "scenarioId" | "score" | "seed" | "attempts">;
  scenePlan?: ScenePlan;
  qualityValidation?: QualityValidationResult;
  feedbackLearning?: FeedbackLearningSnapshot;
  promptCompiler?: PromptCompilerMetadata;
  designConstitution?: ConstitutionReport[];
  renderEngine?: StoredRenderReport;
  generationDiagnostic?: GenerationDiagnosticReport;
};

export function packSdPayload(
  data: InfographicSdInput,
  style: InfographicStyle,
  extras?: {
    brief?: DesignBrief;
    compositingHints?: CompositingHints;
    qualityScore?: number;
    composition?: StoredSdPayload["composition"];
    scenePlan?: ScenePlan;
    qualityValidation?: QualityValidationResult;
    feedbackLearning?: FeedbackLearningSnapshot;
    promptCompiler?: PromptCompilerMetadata;
    designConstitution?: ConstitutionReport[];
    renderEngine?: StoredRenderReport;
    generationDiagnostic?: GenerationDiagnosticReport;
  },
): string {
  return JSON.stringify({
    data,
    style,
    brief: extras?.brief,
    compositingHints: extras?.compositingHints,
    qualityScore: extras?.qualityScore,
    composition: extras?.composition,
    scenePlan: extras?.scenePlan,
    qualityValidation: extras?.qualityValidation,
    feedbackLearning: extras?.feedbackLearning,
    promptCompiler: extras?.promptCompiler,
    designConstitution: extras?.designConstitution,
    renderEngine: extras?.renderEngine,
    generationDiagnostic: extras?.generationDiagnostic,
  } satisfies StoredSdPayload);
}

export function unpackSdPayload(json: string): StoredSdPayload {
  const parsed = JSON.parse(json) as unknown;
  if (
    parsed &&
    typeof parsed === "object" &&
    "data" in parsed &&
    "style" in parsed
  ) {
    const record = parsed as StoredSdPayload;
    const style = STYLE_KEYS.includes(record.style as InfographicStyle)
      ? (record.style as InfographicStyle)
      : DEFAULT_STYLE;
    return {
      data: sanitizeSdInput(record.data),
      style,
      brief: record.brief,
      compositingHints: record.compositingHints,
      qualityScore: record.qualityScore,
      composition: record.composition,
      scenePlan: record.scenePlan,
      qualityValidation: record.qualityValidation,
      feedbackLearning: record.feedbackLearning,
      promptCompiler: record.promptCompiler,
      designConstitution: record.designConstitution,
      renderEngine: record.renderEngine,
      generationDiagnostic: record.generationDiagnostic,
    };
  }
  return {
    data: sanitizeSdInput(parsed),
    style: DEFAULT_STYLE,
  };
}
