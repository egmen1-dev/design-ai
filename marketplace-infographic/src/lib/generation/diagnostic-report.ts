import type { ConstitutionReport } from "@/lib/design/design-constitution";
import type { PromptCompilerMetadata, PromptCompilerResult } from "@/lib/design/prompt-compiler/types";
import type { QualityValidationResult } from "@/lib/design/quality-validator";
import type { QualityGateResult } from "@/lib/design/quality-v165";
import type { FinalQualityScore } from "@/lib/design/final-quality-validator";
import type { FeedbackLearningSnapshot } from "@/lib/feedback/types";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { RenderQualityScores } from "@/lib/render-engine/quality/render-quality";
import type { RenderRequest } from "@/lib/render-engine/types";
import type { RenderEngineOrchestratorResult } from "@/lib/render-engine";
import { PIPELINE_VERSION } from "@/lib/pipeline-version";

export const DIAGNOSTIC_REPORT_VERSION = "1.0";

export type DiagnosticStepStatus = "ok" | "warn" | "fail" | "skip";

export type DiagnosticStep = {
  id: string;
  label: string;
  status: DiagnosticStepStatus;
  summary?: string;
  score?: number;
  data?: Record<string, unknown>;
};

export type StoredRenderAttemptReport = {
  attemptIndex: number;
  modelId: string;
  providerId: string;
  profileId: string;
  qualityScore?: number;
  qualityBreakdown?: RenderQualityScores;
  passed: boolean;
  error?: string;
  latencyMs?: number;
  seed?: number;
  backgroundUrl?: string;
  compiled?: {
    prompt: string;
    negativePrompt?: string;
    modulesUsed: string[];
    modulesIgnored: string[];
    width: number;
    height: number;
  };
};

export type StoredRenderReport = {
  request: RenderRequest;
  attempts: StoredRenderAttemptReport[];
  selectedModel: string;
  overallScore: number;
  variationSeed?: string;
  userModelOverride?: string;
  lockModel?: boolean;
};

export type GenerationArtifacts = {
  generationId: string;
  finalImage: string;
  background?: string | null;
  productCutout?: string | null;
};

export type GenerationDiagnosticReport = {
  version: typeof DIAGNOSTIC_REPORT_VERSION;
  pipelineVersion: string;
  createdAt: string;
  durationMs?: number;
  variationSeed: string;
  aiSource: string;
  backgroundSource: string;
  steps: DiagnosticStep[];
  artifacts: GenerationArtifacts;
  renderReport?: StoredRenderReport;
  constitution?: ConstitutionReport[];
  promptCompiler?: PromptCompilerMetadata;
  qualityValidation?: QualityValidationResult;
  qualityGate?: QualityGateResult;
  finalQuality?: FinalQualityScore;
  feedbackLearning?: FeedbackLearningSnapshot;
  scenePlan?: ScenePlan;
};

export function buildStoredRenderReport(input: {
  result: RenderEngineOrchestratorResult;
  variationSeed?: string;
  userModelOverride?: string;
  lockModel?: boolean;
}): StoredRenderReport {
  const { result } = input;
  return {
    request: result.request,
    attempts: result.attempts.map((a) => ({
      attemptIndex: a.attemptIndex,
      modelId: a.modelId,
      providerId: a.providerId,
      profileId: a.profileId,
      qualityScore: a.qualityScore,
      qualityBreakdown: a.qualityBreakdown,
      passed: a.passed,
      error: a.error,
      latencyMs: a.result?.latencyMs,
      seed: a.result?.seed,
      backgroundUrl: a.result?.imageUrl,
      compiled: a.result?.compiled
        ? {
            prompt: a.result.compiled.prompt,
            negativePrompt: a.result.compiled.negativePrompt,
            modulesUsed: a.result.compiled.modulesUsed,
            modulesIgnored: a.result.compiled.modulesIgnored,
            width: a.result.compiled.width,
            height: a.result.compiled.height,
          }
        : undefined,
    })),
    selectedModel: result.selectedAttempt.modelId,
    overallScore: result.overallScore,
    variationSeed: input.variationSeed,
    userModelOverride: input.userModelOverride,
    lockModel: input.lockModel,
  };
}

function stepStatus(passed?: boolean, warn?: boolean): DiagnosticStepStatus {
  if (passed === false) return "fail";
  if (warn) return "warn";
  if (passed === true || passed === undefined) return passed === undefined ? "skip" : "ok";
  return "ok";
}

export type BuildGenerationDiagnosticInput = {
  generationId: string;
  imagePath: string;
  backgroundUrl?: string | null;
  productCutout?: string | null;
  variationSeed: string;
  aiSource: string;
  backgroundSource: string;
  durationMs?: number;
  userModelOverride?: string;
  lockModel?: boolean;
  analysis?: { category?: string; brandTone?: string };
  knowledgePatternsUsed?: number;
  storyDirection?: { heroConcept?: string; customerIntent?: string };
  sceneDirection?: { sceneType?: string; quality?: { total?: number } };
  compositionDirection?: { templateId?: string; quality?: { total?: number } };
  scenePlan?: ScenePlan;
  constitutionReports?: ConstitutionReport[];
  compiledBackground?: PromptCompilerResult;
  renderEngineResult?: RenderEngineOrchestratorResult;
  qualityGate?: QualityGateResult;
  qualityRefinementPasses?: number;
  qualityValidation?: QualityValidationResult;
  seniorAdReview?: { score?: number; approved?: boolean };
  ctrReview?: { score?: number; wouldClick?: boolean; ctrPrediction?: number };
  photoReview?: { score?: number; realism?: number; looksLikePhoto?: boolean };
  chiefPlan?: { approved?: boolean; estimatedScoreAfterFix?: number };
  finalQuality?: FinalQualityScore;
  conceptRetries?: number;
  feedbackLearning?: FeedbackLearningSnapshot;
};

export function buildGenerationDiagnostic(
  input: BuildGenerationDiagnosticInput,
): GenerationDiagnosticReport {
  const steps: DiagnosticStep[] = [];

  steps.push({
    id: "product_analysis",
    label: "Анализ товара",
    status: input.analysis?.category ? "ok" : "skip",
    summary: input.analysis?.category
      ? `${input.analysis.category}${input.analysis.brandTone ? ` · ${input.analysis.brandTone}` : ""}`
      : undefined,
  });

  steps.push({
    id: "intelligence",
    label: "Knowledge / Market / Assets",
    status: (input.knowledgePatternsUsed ?? 0) > 0 ? "ok" : "warn",
    summary: `паттернов: ${input.knowledgePatternsUsed ?? 0}`,
  });

  steps.push({
    id: "visual_story",
    label: "Visual Story Director",
    status: input.storyDirection ? "ok" : "skip",
    summary: input.storyDirection?.heroConcept,
    data: input.storyDirection?.customerIntent
      ? { customerIntent: input.storyDirection.customerIntent }
      : undefined,
  });

  steps.push({
    id: "scene_director",
    label: "Scene Director",
    status: input.sceneDirection ? "ok" : "skip",
    score: input.sceneDirection?.quality?.total,
    summary: input.sceneDirection?.sceneType,
  });

  steps.push({
    id: "composition_director",
    label: "Composition Director",
    status: input.compositionDirection ? "ok" : "skip",
    score: input.compositionDirection?.quality?.total,
    summary: input.compositionDirection?.templateId,
  });

  steps.push({
    id: "scene_planner",
    label: "Scene Planner",
    status: input.scenePlan ? "ok" : "fail",
    summary: input.scenePlan?.coverConceptId,
    data: input.scenePlan
      ? {
          backgroundType: input.scenePlan.backgroundType,
          surfaceType: input.scenePlan.surfaceType,
          visualMood: input.scenePlan.visualMood,
        }
      : undefined,
  });

  const constitution = input.constitutionReports ?? [];
  for (const report of constitution) {
    steps.push({
      id: `constitution_${report.stage}`,
      label: `Constitution · ${report.stage}`,
      status: report.passed ? "ok" : "warn",
      score: report.overallDesignScore,
      summary: report.violations?.length
        ? `${report.violations.length} нарушений`
        : "passed",
      data: {
        attempts: report.attempts,
        patchesApplied: report.patchesApplied?.length ?? 0,
      },
    });
  }

  if (input.renderEngineResult) {
    const selected = input.renderEngineResult.selectedAttempt;
    steps.push({
      id: "render_engine",
      label: "Render Engine v17",
      status:
        input.backgroundSource === "fallback"
          ? "fail"
          : selected.passed
            ? "ok"
            : "warn",
      score: input.renderEngineResult.overallScore,
      summary: `${selected.modelId} @ ${selected.providerId} · ${input.renderEngineResult.attempts.length} попыток`,
      data: {
        profileId: selected.profileId,
        userModelOverride: input.userModelOverride,
        lockModel: input.lockModel,
        attempts: input.renderEngineResult.attempts.map((a) => ({
          model: a.modelId,
          passed: a.passed,
          score: a.qualityScore,
          error: a.error,
        })),
      },
    });
  } else if (input.compiledBackground) {
    steps.push({
      id: "prompt_compiler",
      label: "Prompt Compiler v16.8",
      status: input.compiledBackground.metadata.validation.passed ? "ok" : "warn",
      score: input.compiledBackground.metadata.readabilityScore,
      summary: input.compiledBackground.metadata.profile,
      data: {
        attempts: input.compiledBackground.metadata.attempts,
        sections: input.compiledBackground.metadata.sections.length,
      },
    });
  }

  steps.push({
    id: "background",
    label: "Генерация фона",
    status:
      input.backgroundSource === "fallback"
        ? "fail"
        : input.backgroundSource === "provider" || input.backgroundSource === "sd"
          ? "ok"
          : "warn",
    summary: input.backgroundSource,
    data: { backgroundUrl: input.backgroundUrl ?? null },
  });

  steps.push({
    id: "cutout",
    label: "Вырезка товара",
    status: input.productCutout ? "ok" : "warn",
    summary: input.productCutout ? "готово" : "нет cutout",
    data: { productCutout: input.productCutout ?? null },
  });

  if (input.qualityValidation) {
    steps.push({
      id: "compositing",
      label: "Композитинг + quality validation",
      status: (input.qualityValidation.total ?? 0) >= 70 ? "ok" : "warn",
      score: input.qualityValidation.total,
      summary: input.qualityValidation.issues?.slice(0, 2).join("; "),
    });
  }

  if (input.qualityGate) {
    steps.push({
      id: "quality_gate",
      label: "Quality Gate v16.5",
      status: input.qualityGate.passed ? "ok" : "warn",
      score: input.qualityGate.luxuryScore.total,
      summary: `${input.qualityRefinementPasses ?? 0} refinement passes`,
    });
  }

  if (input.seniorAdReview || input.ctrReview || input.photoReview) {
    steps.push({
      id: "agent_reviews",
      label: "Агенты (арт-директор, CTR, фото)",
      status:
        input.seniorAdReview?.approved && input.ctrReview?.wouldClick
          ? "ok"
          : "warn",
      data: {
        seniorAd: input.seniorAdReview,
        ctr: input.ctrReview,
        photo: input.photoReview,
      },
    });
  }

  if (input.chiefPlan) {
    steps.push({
      id: "chief_director",
      label: "Chief Design Director",
      status: input.chiefPlan.approved ? "ok" : "warn",
      summary: input.chiefPlan.approved ? "approved" : "needs fix",
      data: { estimatedScoreAfterFix: input.chiefPlan.estimatedScoreAfterFix },
    });
  }

  if (input.finalQuality) {
    steps.push({
      id: "final_quality",
      label: "Финальная проверка",
      status: input.finalQuality.passed ? "ok" : "warn",
      score: input.finalQuality.total,
      summary: input.finalQuality.issues?.slice(0, 3).join("; "),
    });
  }

  if ((input.conceptRetries ?? 0) > 0) {
    steps.push({
      id: "concept_retries",
      label: "Повторы концепции",
      status: "warn",
      summary: `${input.conceptRetries} retry`,
    });
  }

  steps.push({
    id: "html_render",
    label: "HTML → PNG",
    status: input.imagePath ? "ok" : "fail",
    summary: input.imagePath,
  });

  const renderReport = input.renderEngineResult
    ? buildStoredRenderReport({
        result: input.renderEngineResult,
        variationSeed: input.variationSeed,
        userModelOverride: input.userModelOverride,
        lockModel: input.lockModel,
      })
    : undefined;

  return {
    version: DIAGNOSTIC_REPORT_VERSION,
    pipelineVersion: PIPELINE_VERSION,
    createdAt: new Date().toISOString(),
    durationMs: input.durationMs,
    variationSeed: input.variationSeed,
    aiSource: input.aiSource,
    backgroundSource: input.backgroundSource,
    steps,
    artifacts: {
      generationId: input.generationId,
      finalImage: input.imagePath,
      background: input.backgroundUrl,
      productCutout: input.productCutout,
    },
    renderReport,
    constitution: constitution.length ? constitution : undefined,
    promptCompiler: input.compiledBackground?.metadata,
    qualityValidation: input.qualityValidation,
    qualityGate: input.qualityGate,
    finalQuality: input.finalQuality,
    feedbackLearning: input.feedbackLearning,
    scenePlan: input.scenePlan,
  };
}
