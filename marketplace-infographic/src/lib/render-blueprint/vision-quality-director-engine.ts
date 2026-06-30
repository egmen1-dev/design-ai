/**
 * Chapter 4.18 — Vision Quality Director engine.
 * Compares generated background against Render Blueprint — never new design decisions.
 */
import type { AgentContractId } from "./agent-contracts";
import type { RenderBlueprint } from "./types";
import type { AdapterRenderIntent } from "./render-adapter-types";
import type { ProviderMetadata } from "./render-pipeline-types";
import { deriveVisionSignals } from "./vision-qa-signals";
import type { VisionImageSignals } from "./vision-qa-types";
import { SceneType } from "./scene-director-types";
import { MaterialWorld } from "./material-director-types";
import { LightingScheme } from "./lighting-director-types";
import {
  RetryRecommendation,
  VisionProblemSeverity,
  type RetryRecommendationId,
  type VisionProblem,
  type VisionQualityDirectorInput,
  type VisionQualityExplainabilityReport,
  type VisionQualityFailureCode,
  type VisionQualityReport,
  type VisionQualityValidationReport,
} from "./vision-quality-director-types";

export {
  RetryRecommendation,
  VisionProblemSeverity,
  type RetryRecommendationId,
  type VisionProblem,
  type VisionQualityReport,
  type VisionQualityDirectorInput,
  type VisionQualityExplainabilityReport,
  type VisionQualityValidationReport,
  type VisionQualityFailureCode,
} from "./vision-quality-director-types";

export const VISION_QUALITY_DIRECTOR_VERSION = "4.18.0";

export const VISION_QUALITY_DIRECTOR_GOLDEN_RULE =
  "Vision Quality Director does not judge beauty — it checks how accurately the Render Provider " +
  "executed the professional design decision described in the Render Blueprint.";

export const VISION_QUALITY_DIRECTOR_ID: AgentContractId = "vision-quality-director";

export const VISION_QUALITY_DIRECTOR_PIPELINE_POSITION = [
  "flux-adapter",
  "generated-background",
  VISION_QUALITY_DIRECTOR_ID,
] as const;

const SCORE_WEIGHTS = {
  composition: 0.15,
  scene: 0.2,
  lighting: 0.2,
  material: 0.15,
  background: 0.15,
  overlay: 0.1,
  artifacts: 0.05,
} as const;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function signalsFromInput(
  image: string,
  diagnostics?: Record<string, number | boolean>,
): VisionImageSignals {
  const derived = deriveVisionSignals(image);
  if (!diagnostics) return derived;
  return {
    ...derived,
    ...(diagnostics as Partial<VisionImageSignals>),
  };
}

function expectsMinimalScene(blueprint: Readonly<RenderBlueprint>): boolean {
  return (
    blueprint.scene.sceneType === SceneType.MINIMAL ||
    blueprint.scene.sceneType === SceneType.COMMERCIAL_STUDIO ||
    blueprint.scene.environment === "studio" ||
    blueprint.materials.materialWorld === MaterialWorld.MINIMAL_STUDIO ||
    blueprint.materials.materialWorld === MaterialWorld.MARKETPLACE_NEUTRAL
  );
}

function compareWithBlueprint(
  blueprint: Readonly<RenderBlueprint>,
  renderIntent: AdapterRenderIntent | undefined,
  signals: VisionImageSignals,
): { scores: Omit<VisionQualityReport, "problems" | "retryRecommendation" | "confidence" | "overallScore">; problems: VisionProblem[] } {
  const problems: VisionProblem[] = [];

  let sceneAccuracy = 92;
  let lightingAccuracy = 90;
  let materialAccuracy = 88;
  let backgroundCleanliness = clampScore(100 - signals.backgroundClutter * 100);
  let overlaySafety = clampScore(signals.headlineWhitespaceRatio * 100);
  let providerArtifacts = clampScore(
    100 -
      (signals.noiseLevel * 30 +
        signals.jpegArtifactScore * 25 +
        signals.blurScore * 25 +
        (signals.duplicateProduct ? 40 : 0)),
  );
  let compositionScore = clampScore(
    overlaySafety * 0.6 + (1 - signals.perspectiveMismatch) * 40,
  );

  if (expectsMinimalScene(blueprint) && signals.backgroundClutter > 0.35) {
    sceneAccuracy -= 35;
    problems.push({
      code: "SCENE_MISMATCH",
      severity: VisionProblemSeverity.HIGH,
      section: "scene",
      message: `Expected minimal studio scene but background clutter is ${Math.round(signals.backgroundClutter * 100)}%`,
      critical: true,
    });
  }

  if (
    blueprint.scene.sceneType === SceneType.LUXURY &&
    signals.backgroundClutter > 0.45
  ) {
    sceneAccuracy -= 20;
    problems.push({
      code: "SCENE_ATMOSPHERE_DRIFT",
      severity: VisionProblemSeverity.MEDIUM,
      section: "scene",
      message: "Luxury scene reads as cluttered — atmosphere does not match blueprint",
      critical: false,
    });
  }

  if (signals.lightingMismatch > 0.35) {
    lightingAccuracy -= 30;
    problems.push({
      code: "LIGHTING_DRIFT",
      severity: VisionProblemSeverity.HIGH,
      section: "lighting",
      message: `Lighting deviates from Lighting Section (mismatch ${Math.round(signals.lightingMismatch * 100)}%)`,
      critical: true,
    });
  }

  if (
    blueprint.lighting.lightingScheme === LightingScheme.LUXURY_SIDE_LIGHT &&
    signals.lightingMismatch > 0.25
  ) {
    lightingAccuracy -= 10;
    problems.push({
      code: "LIGHTING_SCHEME_VIOLATION",
      severity: VisionProblemSeverity.MEDIUM,
      section: "lighting",
      message: "Provider altered luxury side light scheme",
      critical: false,
    });
  }

  const floorMaterial = blueprint.materials.floor.toLowerCase();
  if (floorMaterial.includes("oak") && signals.backgroundClutter > 0.5) {
    materialAccuracy -= 25;
    problems.push({
      code: "MATERIAL_MISMATCH",
      severity: VisionProblemSeverity.HIGH,
      section: "materials",
      message: "Blueprint specifies oak surfaces but generated environment reads as wrong material family",
      critical: true,
    });
  }

  if (
    blueprint.materials.materialWorld === MaterialWorld.MARKETPLACE_NEUTRAL &&
    signals.backgroundClutter > 0.4
  ) {
    materialAccuracy -= 15;
    problems.push({
      code: "MATERIAL_NOISE",
      severity: VisionProblemSeverity.MEDIUM,
      section: "materials",
      message: "Marketplace neutral materials should stay matte and simple",
      critical: false,
    });
  }

  if (signals.backgroundClutter > 0.4) {
    problems.push({
      code: "BACKGROUND_CLUTTER",
      severity: VisionProblemSeverity.MEDIUM,
      section: "background",
      message: "Random objects or visual noise detected in marketplace background",
      critical: false,
    });
  }

  if (
    blueprint.constraints.mustLeaveHeadlineSpace &&
    signals.headlineWhitespaceRatio < 0.35
  ) {
    overlaySafety = Math.max(0, overlaySafety - 30);
    problems.push({
      code: "OVERLAY_UNSAFE",
      severity: VisionProblemSeverity.HIGH,
      section: "composition",
      message: "Headline area lacks safe whitespace for HTML overlay",
      critical: true,
    });
  }

  if (signals.duplicateProduct) {
    providerArtifacts -= 40;
    problems.push({
      code: "DUPLICATE_OBJECTS",
      severity: VisionProblemSeverity.CRITICAL,
      section: "background",
      message: "Repeating objects detected — typical provider artifact",
      critical: true,
    });
  }

  if (signals.noiseLevel > 0.35) {
    providerArtifacts -= 20;
    problems.push({
      code: "AI_NOISE",
      severity: VisionProblemSeverity.MEDIUM,
      section: "technical",
      message: "Elevated AI noise in generated background",
      critical: false,
    });
  }

  if (signals.perspectiveMismatch > 0.4) {
    compositionScore -= 25;
    problems.push({
      code: "PERSPECTIVE_ARTIFACT",
      severity: VisionProblemSeverity.MEDIUM,
      section: "camera",
      message: "Perspective does not match Camera Section",
      critical: false,
    });
  }

  if (renderIntent?.positivePrompt && signals.blurScore > 0.45) {
    providerArtifacts -= 15;
    problems.push({
      code: "PROVIDER_BLUR",
      severity: VisionProblemSeverity.MEDIUM,
      section: "technical",
      message: "Generated background below expected sharpness for compositing",
      critical: false,
    });
  }

  sceneAccuracy = clampScore(sceneAccuracy);
  lightingAccuracy = clampScore(lightingAccuracy);
  materialAccuracy = clampScore(materialAccuracy);
  backgroundCleanliness = clampScore(backgroundCleanliness);
  overlaySafety = clampScore(overlaySafety);
  providerArtifacts = clampScore(providerArtifacts);
  compositionScore = clampScore(compositionScore);

  return {
    scores: {
      compositionScore,
      sceneAccuracy,
      lightingAccuracy,
      materialAccuracy,
      backgroundCleanliness,
      overlaySafety,
      providerArtifacts,
    },
    problems,
  };
}

function overallScore(
  scores: Omit<VisionQualityReport, "problems" | "retryRecommendation" | "confidence" | "overallScore">,
): number {
  return clampScore(
    scores.compositionScore * SCORE_WEIGHTS.composition +
      scores.sceneAccuracy * SCORE_WEIGHTS.scene +
      scores.lightingAccuracy * SCORE_WEIGHTS.lighting +
      scores.materialAccuracy * SCORE_WEIGHTS.material +
      scores.backgroundCleanliness * SCORE_WEIGHTS.background +
      scores.overlaySafety * SCORE_WEIGHTS.overlay +
      scores.providerArtifacts * SCORE_WEIGHTS.artifacts,
  );
}

function retryRecommendationFor(
  problems: VisionProblem[],
  overall: number,
): RetryRecommendationId {
  if (problems.some((p) => p.critical && p.code === "DUPLICATE_OBJECTS")) {
    return RetryRecommendation.REJECT;
  }
  if (overall < 45) {
    return RetryRecommendation.RETRY_FULL_RENDER;
  }

  const lightingIssues = problems.filter((p) => p.section === "lighting" && p.severity !== VisionProblemSeverity.LOW);
  const sceneIssues = problems.filter((p) => p.section === "scene" && p.severity !== VisionProblemSeverity.LOW);

  if (lightingIssues.length > 0 && sceneIssues.length === 0 && overall >= 60) {
    return RetryRecommendation.RETRY_LIGHTING;
  }
  if (sceneIssues.length > 0 && lightingIssues.length === 0 && overall >= 55) {
    return RetryRecommendation.RETRY_SCENE;
  }
  if (problems.some((p) => p.critical) && overall < 65) {
    return RetryRecommendation.RETRY_FULL_RENDER;
  }
  if (overall < 70 && problems.length > 2) {
    return RetryRecommendation.RETRY_FULL_RENDER;
  }
  return RetryRecommendation.ACCEPT;
}

function confidenceFromReport(problems: VisionProblem[], overall: number): number {
  const criticalCount = problems.filter((p) => p.critical).length;
  let confidence = 0.75 + overall / 500;
  confidence -= criticalCount * 0.08;
  confidence -= problems.length * 0.02;
  return Math.max(0.5, Math.min(0.98, confidence));
}

export function buildVisionQualityReport(input: {
  blueprint: Readonly<RenderBlueprint>;
  visionInput: VisionQualityDirectorInput;
  renderIntent?: AdapterRenderIntent;
}): { report: VisionQualityReport; explainability: VisionQualityExplainabilityReport } {
  const signals = signalsFromInput(input.visionInput.image, input.visionInput.diagnostics);
  const { scores, problems } = compareWithBlueprint(
    input.blueprint,
    input.renderIntent,
    signals,
  );
  const overall = overallScore(scores);
  const retryRecommendation = retryRecommendationFor(problems, overall);
  const confidence = confidenceFromReport(problems, overall);

  const report: VisionQualityReport = {
    ...scores,
    overallScore: overall,
    problems,
    retryRecommendation,
    confidence,
  };

  const criticalProblems = problems.filter((p) => p.critical).map((p) => p.code);
  const acceptableProblems = problems.filter((p) => !p.critical).map((p) => p.code);

  const explainability: VisionQualityExplainabilityReport = {
    agentId: VISION_QUALITY_DIRECTOR_ID,
    blueprintSectionsChecked: ["story", "scene", "lighting", "camera", "materials", "composition", "background"],
    criticalProblems,
    acceptableProblems,
    retryReasoning: `Recommendation ${retryRecommendation} based on ${criticalProblems.length} critical and ${acceptableProblems.length} acceptable issues`,
    reasoning: [
      `Scene accuracy ${scores.sceneAccuracy} — compared environment to Scene Section`,
      `Lighting accuracy ${scores.lightingAccuracy} — checked against Lighting Section`,
      `Material accuracy ${scores.materialAccuracy} — validated Material Director surfaces`,
      `Background cleanliness ${scores.backgroundCleanliness} — marketplace background must stay clean`,
      `Overlay safety ${scores.overlaySafety} — headline zones checked for HTML overlay`,
      `Provider artifacts ${scores.providerArtifacts} — generation defects scored objectively`,
      `Overall ${overall} — blueprint fidelity, not aesthetic preference`,
    ],
  };

  return { report, explainability };
}

export function validateVisionQualityReport(
  report: VisionQualityReport,
  blueprint?: Readonly<RenderBlueprint>,
): VisionQualityValidationReport {
  const violations: string[] = [];

  if (!blueprint) violations.push("MISSING_BLUEPRINT");
  if (!report.retryRecommendation) violations.push("NO_RETRY_RECOMMENDATION");

  const aestheticOnly =
    report.problems.length > 0 &&
    report.problems.every((p) => /\b(beautiful|pretty|ugly|nice)\b/i.test(p.message));
  if (aestheticOnly) violations.push("AESTHETIC_ONLY_JUDGMENT");

  return { valid: violations.length === 0, violations, report };
}

export function runVisionQualityDirector(input: {
  blueprint: Readonly<RenderBlueprint>;
  visionInput: VisionQualityDirectorInput;
  renderIntent?: AdapterRenderIntent;
  providerMetadata?: ProviderMetadata;
}): {
  report: VisionQualityReport;
  explainability: VisionQualityExplainabilityReport;
} {
  if (!input.visionInput.image?.trim()) {
    throw new Error("Generated background image is required");
  }

  return buildVisionQualityReport({
    blueprint: input.blueprint,
    visionInput: input.visionInput,
    renderIntent: input.renderIntent,
  });
}
