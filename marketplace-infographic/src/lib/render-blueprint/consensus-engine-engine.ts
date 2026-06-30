/**
 * Chapter 4.23 — Consensus Engine.
 * Detects cross-agent semantic conflicts before render — never creates design decisions.
 */
import type { BlueprintMutation } from "./mutation-types";
import type { BlueprintSection, RenderBlueprint } from "./types";
import { CameraStyle } from "./camera-director-types";
import { LightingScheme, LightingStyle } from "./lighting-director-types";
import { SceneType, EnvironmentType } from "./scene-director-types";
import { StoryType } from "./visual-story-director-types";
import {
  ConflictSeverity,
  ConflictType,
  type AgreementMatrix,
  type AgreementPair,
  type BlueprintConflict,
  type BlueprintWarning,
  type ConsensusContext,
  type ConsensusExplainabilityReport,
  type ConsensusFailureCode,
  type ConsensusReport,
  type ConsensusValidationReport,
} from "./consensus-engine-types";

export {
  ConflictType,
  ConflictSeverity,
  type ConflictTypeId,
  type ConflictSeverityId,
  type BlueprintConflict,
  type BlueprintWarning,
  type AgreementPair,
  type AgreementMatrix,
  type ConsensusReport,
  type ConsensusContext,
  type ConsensusExplainabilityReport,
  type ConsensusValidationReport,
  type ConsensusFailureCode,
} from "./consensus-engine-types";

export const CONSENSUS_ENGINE_VERSION = "4.23.0";

export const CONSENSUS_ENGINE_GOLDEN_RULE =
  "Consensus Engine does not determine which agent is right — it determines whether all decisions " +
  "form one professional commercial photograph. Even perfect individual decisions have no value if they contradict each other.";

export const CONSENSUS_ENGINE_ID = "consensus-engine" as const;

export const CONSENSUS_ENGINE_PIPELINE_POSITION = [
  "creative-directors",
  "technical-directors",
  "blueprint-validation",
  CONSENSUS_ENGINE_ID,
  "approved-blueprint",
  "render-adapter",
] as const;

const CROSS_LINKS: [BlueprintSection, BlueprintSection][] = [
  ["story", "scene"],
  ["scene", "lighting"],
  ["lighting", "materials"],
  ["camera", "composition"],
  ["photography", "lighting"],
];

const AGENT_CONFIDENCE_KEYS: Partial<Record<BlueprintSection, string>> = {
  story: "visual-story-director",
  scene: "scene-director",
  lighting: "lighting-director",
  camera: "camera-director",
  materials: "material-director",
  photography: "commercial-photo-director",
  composition: "composition-director",
};

const TRACKED_SECTIONS: BlueprintSection[] = [
  "story",
  "scene",
  "lighting",
  "camera",
  "materials",
  "photography",
  "composition",
];

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isLuxuryStory(blueprint: Readonly<RenderBlueprint>): boolean {
  return (
    blueprint.story.storyType === StoryType.PREMIUM_LIFESTYLE ||
    blueprint.story.storyType === StoryType.MINIMAL_LUXURY ||
    blueprint.story.primaryEmotion === "luxury" ||
    blueprint.story.emotionalTone === "luxury"
  );
}

function isWarmComfortStory(blueprint: Readonly<RenderBlueprint>): boolean {
  return (
    blueprint.story.storyType === StoryType.COMFORT ||
    blueprint.story.storyType === StoryType.FAMILY ||
    blueprint.story.emotionalTone === "warm" ||
    blueprint.story.primaryEmotion === "comfort"
  );
}

function isColdLighting(blueprint: Readonly<RenderBlueprint>): boolean {
  return (
    blueprint.lighting.lightingStyle === LightingStyle.TECHNOLOGY_COOL ||
    blueprint.lighting.lightingScheme === LightingScheme.LOW_KEY
  );
}

function isWarmLighting(blueprint: Readonly<RenderBlueprint>): boolean {
  return (
    blueprint.lighting.lightingStyle === LightingStyle.LUXURY_WARM ||
    blueprint.lighting.lightingStyle === LightingStyle.NATURAL_WINDOW ||
    blueprint.lighting.lightingScheme === LightingScheme.LUXURY_SIDE_LIGHT
  );
}

function conflict(
  code: string,
  type: BlueprintConflict["type"],
  severity: BlueprintConflict["severity"],
  sections: BlueprintSection[],
  message: string,
  explanation: string,
): BlueprintConflict {
  return { code, type, severity, sections, message, explanation };
}

export function detectSemanticConflicts(blueprint: Readonly<RenderBlueprint>): BlueprintConflict[] {
  const conflicts: BlueprintConflict[] = [];
  const story = blueprint.story.storyType;
  const lightingStyle = blueprint.lighting.lightingStyle;
  const sceneType = blueprint.scene.sceneType;

  if (isLuxuryStory(blueprint) && isColdLighting(blueprint)) {
    conflicts.push(
      conflict(
        "STORY_LIGHTING_SEMANTIC",
        ConflictType.SEMANTIC,
        ConflictSeverity.CRITICAL,
        ["story", "lighting"],
        "Luxury story conflicts with industrial cold lighting",
        "Lighting weakens the premium perception defined by Story — warm luxury mood requires aligned lighting semantics",
      ),
    );
  }

  if (isWarmComfortStory(blueprint) && isColdLighting(blueprint)) {
    conflicts.push(
      conflict(
        "COMFORT_LIGHTING_SEMANTIC",
        ConflictType.SEMANTIC,
        ConflictSeverity.CRITICAL,
        ["story", "lighting"],
        "Warm family comfort story conflicts with cold technology lighting",
        "Story promises warm family comfort but Lighting introduces cold blue technology mood",
      ),
    );
  }

  if (sceneType === SceneType.LUXURY && lightingStyle === LightingStyle.MARKETPLACE_HIGH_KEY) {
    conflicts.push(
      conflict(
        "SCENE_LIGHTING_SEMANTIC",
        ConflictType.SEMANTIC,
        ConflictSeverity.MAJOR,
        ["scene", "lighting"],
        "Luxury interior scene conflicts with flat marketplace high-key lighting",
        "Scene establishes luxury interior atmosphere but Lighting flattens depth with marketplace high-key treatment",
      ),
    );
  }

  if (story === StoryType.TECHNOLOGY && blueprint.lighting.lightingScheme === LightingScheme.LUXURY_SIDE_LIGHT) {
    conflicts.push(
      conflict(
        "STORY_LIGHTING_SEMANTIC",
        ConflictType.SEMANTIC,
        ConflictSeverity.MAJOR,
        ["story", "lighting"],
        "Technology story conflicts with luxury advertising lighting",
        "Technology narrative expects cool controlled lighting, not luxury side-light drama",
      ),
    );
  }

  return conflicts;
}

export function detectVisualConflicts(blueprint: Readonly<RenderBlueprint>): BlueprintConflict[] {
  const conflicts: BlueprintConflict[] = [];

  if (
    isLuxuryStory(blueprint) &&
    blueprint.camera.cameraStyle === CameraStyle.LIFESTYLE_CONTEXT &&
    blueprint.camera.distance === "far"
  ) {
    conflicts.push(
      conflict(
        "STORY_CAMERA_VISUAL",
        ConflictType.VISUAL,
        ConflictSeverity.MAJOR,
        ["story", "camera"],
        "Luxury story conflicts with wide documentary camera framing",
        "Premium luxury perception is weakened by wide documentary lens that reduces hero product presence",
      ),
    );
  }

  if (
    blueprint.scene.sceneType === SceneType.MINIMAL &&
    blueprint.photography.photographyStyle === "lifestyle_context" &&
    blueprint.scene.environment === EnvironmentType.OUTDOOR
  ) {
    conflicts.push(
      conflict(
        "SCENE_PHOTOGRAPHY_VISUAL",
        ConflictType.VISUAL,
        ConflictSeverity.MINOR,
        ["scene", "photography"],
        "Minimal studio scene conflicts with outdoor lifestyle photography intent",
        "Scene is minimal studio but Photography requests outdoor lifestyle context",
      ),
    );
  }

  return conflicts;
}

export function detectMarketplaceConflicts(blueprint: Readonly<RenderBlueprint>): BlueprintConflict[] {
  const conflicts: BlueprintConflict[] = [];
  const darkProduct =
    blueprint.product.dominantColor.some((c) => c.toLowerCase().includes("000")) ||
    blueprint.product.finish === "matte";
  const darkScene =
    blueprint.scene.sceneType === SceneType.INDUSTRIAL ||
    blueprint.scene.environment === EnvironmentType.OUTDOOR ||
    isColdLighting(blueprint);

  if (darkProduct && darkScene) {
    conflicts.push(
      conflict(
        "MARKETPLACE_VISIBILITY",
        ConflictType.MARKETPLACE,
        ConflictSeverity.CRITICAL,
        ["product", "scene", "lighting"],
        "Dark product on dark background reduces marketplace visibility",
        "Marketplace cards require product separation from background — current scene and lighting reduce thumbnail legibility",
      ),
    );
  }

  if (blueprint.creative.goal === "CTR" && blueprint.camera.cameraStyle === CameraStyle.MACRO_DETAIL) {
    conflicts.push(
      conflict(
        "MARKETPLACE_CTR_GOAL",
        ConflictType.MARKETPLACE,
        ConflictSeverity.MAJOR,
        ["creative", "camera"],
        "CTR goal conflicts with macro detail camera that hides full product",
        "Marketplace CTR optimization needs recognizable full-product framing, not macro detail isolation",
      ),
    );
  }

  return conflicts;
}

export function detectProviderConflicts(
  blueprint: Readonly<RenderBlueprint>,
  provider?: string,
): BlueprintConflict[] {
  const conflicts: BlueprintConflict[] = [];
  const resolvedProvider = provider ?? blueprint.meta.generator;

  if (resolvedProvider === "gpt-image" && blueprint.background.complexity === "rich") {
    conflicts.push(
      conflict(
        "PROVIDER_COMPOSITE_LIMIT",
        ConflictType.PROVIDER,
        ConflictSeverity.MAJOR,
        ["background", "render"],
        "Composite-rich background workflow increases artifact risk for GPT Image provider",
        "Selected provider struggles with rich composite backgrounds — simplify background complexity",
      ),
    );
  }

  if (
    resolvedProvider === "flux" &&
    blueprint.materials.reflectionProfile === "mirror" &&
    blueprint.lighting.lightingScheme === LightingScheme.LOW_KEY
  ) {
    conflicts.push(
      conflict(
        "PROVIDER_RENDER_COMPLEXITY",
        ConflictType.PROVIDER,
        ConflictSeverity.MINOR,
        ["materials", "lighting", "render"],
        "Mirror materials under low-key lighting increase provider artifact risk",
        "Provider may struggle with mirror reflections in low-key lighting — consider matte material fallback",
      ),
    );
  }

  return conflicts;
}

export function detectStructuralConflicts(blueprint: Readonly<RenderBlueprint>): BlueprintConflict[] {
  const conflicts: BlueprintConflict[] = [];

  if (blueprint.scene.environment === EnvironmentType.OUTDOOR && blueprint.lighting.lightingScheme === LightingScheme.TOP_SOFTBOX) {
    conflicts.push(
      conflict(
        "STRUCTURE_SCENE_LIGHTING",
        ConflictType.STRUCTURAL,
        ConflictSeverity.MAJOR,
        ["scene", "lighting"],
        "Outdoor scene cannot use studio top-softbox lighting scheme",
        "Spatial layer is outdoor environment but Lighting applies indoor studio-only scheme",
      ),
    );
  }

  return conflicts;
}

function pairAgreement(
  blueprint: Readonly<RenderBlueprint>,
  from: BlueprintSection,
  to: BlueprintSection,
  conflicts: BlueprintConflict[],
): number {
  let score = 92;
  const involved = conflicts.filter((c) => c.sections.includes(from) && c.sections.includes(to));

  for (const item of involved) {
    if (item.severity === ConflictSeverity.CRITICAL) score -= 35;
    else if (item.severity === ConflictSeverity.MAJOR) score -= 22;
    else if (item.severity === ConflictSeverity.MINOR) score -= 10;
    else score -= 4;
  }

  if (from === "story" && to === "scene") {
    if (isLuxuryStory(blueprint) && blueprint.scene.sceneType === SceneType.LUXURY) score += 4;
    if (isWarmComfortStory(blueprint) && blueprint.scene.environment === EnvironmentType.LIVING_ROOM) score += 3;
  }

  if (from === "scene" && to === "lighting") {
    if (blueprint.scene.sceneType === SceneType.LUXURY && isWarmLighting(blueprint)) score += 5;
    if (blueprint.scene.sceneType === SceneType.TECHNOLOGY && isColdLighting(blueprint)) score += 4;
  }

  if (from === "photography" && to === "lighting") {
    if (blueprint.photography.photographyStyle?.includes("premium") && isWarmLighting(blueprint)) score += 4;
  }

  return clampScore(score);
}

export function buildAgreementMatrix(
  blueprint: Readonly<RenderBlueprint>,
  conflicts: BlueprintConflict[],
  ctx: ConsensusContext = {},
): AgreementMatrix {
  const sections: Partial<Record<BlueprintSection, number>> = {};
  const pairs: AgreementPair[] = [];

  for (const [from, to] of CROSS_LINKS) {
    const agreement = pairAgreement(blueprint, from, to, conflicts);
    pairs.push({ from, to, agreement });
  }

  for (const section of TRACKED_SECTIONS) {
    const related = pairs.filter((p) => p.from === section || p.to === section);
    const avgPair = related.length
      ? related.reduce((sum, p) => sum + p.agreement, 0) / related.length
      : 90;
    const agentKey = AGENT_CONFIDENCE_KEYS[section];
    const confidence = (ctx.agentConfidences?.[agentKey ?? ""] ?? 0.85) * 100;
    const penalty = conflicts
      .filter((c) => c.sections.includes(section))
      .reduce((sum, c) => sum + (c.severity === ConflictSeverity.CRITICAL ? 30 : c.severity === ConflictSeverity.MAJOR ? 18 : 8), 0);

    sections[section] = clampScore(avgPair * 0.65 + confidence * 0.35 - penalty);
  }

  const weakestSection = TRACKED_SECTIONS
    .map((section) => ({ section, score: sections[section] ?? 0 }))
    .sort((a, b) => a.score - b.score)[0]?.section;

  return { sections: sections as Record<BlueprintSection, number>, pairs, weakestSection };
}

function recommendedMutationsFor(
  conflicts: BlueprintConflict[],
  blueprint: Readonly<RenderBlueprint>,
): BlueprintMutation[] {
  const revision = blueprint.meta.revision ?? 0;
  const now = Date.now();
  const mutations: BlueprintMutation[] = [];
  const lightingConflict = conflicts.find(
    (c) => c.sections.includes("lighting") && c.severity !== ConflictSeverity.INFO,
  );
  const cameraConflict = conflicts.find(
    (c) => c.sections.includes("camera") && c.severity !== ConflictSeverity.INFO,
  );
  const sceneConflict = conflicts.find(
    (c) => c.sections.includes("scene") && c.severity !== ConflictSeverity.INFO,
  );

  if (lightingConflict) {
    mutations.push({
      section: "lighting",
      producer: CONSENSUS_ENGINE_ID,
      expectedRevision: revision,
      payload: {
        lightingStyle: isLuxuryStory(blueprint) || isWarmComfortStory(blueprint)
          ? LightingStyle.LUXURY_WARM
          : LightingStyle.STUDIO_CONTROLLED,
        lightingScheme: isLuxuryStory(blueprint)
          ? LightingScheme.LUXURY_SIDE_LIGHT
          : LightingScheme.TWO_POINT_STUDIO,
      },
      reason: `Consensus: realign lighting with ${lightingConflict.sections.join(" + ")} — ${lightingConflict.explanation}`,
      timestamp: now,
    });
  }

  if (cameraConflict) {
    mutations.push({
      section: "camera",
      producer: CONSENSUS_ENGINE_ID,
      expectedRevision: revision,
      payload: {
        cameraStyle: CameraStyle.PREMIUM_HERO,
        distance: "medium",
      },
      reason: `Consensus: reduce wide documentary framing — ${cameraConflict.explanation}`,
      timestamp: now,
    });
  }

  if (sceneConflict) {
    mutations.push({
      section: "scene",
      producer: CONSENSUS_ENGINE_ID,
      expectedRevision: revision,
      payload: {
        sceneType: SceneType.LUXURY,
        environment: EnvironmentType.LUXURY_INTERIOR,
      },
      reason: `Consensus: switch environment to match story — ${sceneConflict.explanation}`,
      timestamp: now,
    });
  }

  return mutations;
}

function buildWarnings(conflicts: BlueprintConflict[]): BlueprintWarning[] {
  return conflicts
    .filter((c) => c.severity === ConflictSeverity.MINOR || c.severity === ConflictSeverity.INFO)
    .map((c) => ({
      code: c.code,
      section: c.sections[0] ?? "validation",
      message: c.message,
      severity: c.severity,
    }));
}

export function computeOverallConsistency(
  matrix: AgreementMatrix,
  conflicts: BlueprintConflict[],
): number {
  const sectionScores = Object.values(matrix.sections);
  const base = sectionScores.length
    ? sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length
    : 100;

  const criticalPenalty = conflicts.filter((c) => c.severity === ConflictSeverity.CRITICAL).length * 12;
  const majorPenalty = conflicts.filter((c) => c.severity === ConflictSeverity.MAJOR).length * 6;

  return clampScore(base - criticalPenalty - majorPenalty);
}

export function buildConsensusReport(
  blueprint: Readonly<RenderBlueprint>,
  ctx: ConsensusContext = {},
): { report: ConsensusReport; explainability: ConsensusExplainabilityReport } {
  const conflicts = [
    ...detectSemanticConflicts(blueprint),
    ...detectVisualConflicts(blueprint),
    ...detectMarketplaceConflicts(blueprint),
    ...detectProviderConflicts(blueprint, ctx.provider),
    ...detectStructuralConflicts(blueprint),
  ];

  const agreementMatrix = buildAgreementMatrix(blueprint, conflicts, ctx);
  const overallConsistency = computeOverallConsistency(agreementMatrix, conflicts);
  const criticalCount = conflicts.filter((c) => c.severity === ConflictSeverity.CRITICAL).length;
  const majorCount = conflicts.filter((c) => c.severity === ConflictSeverity.MAJOR).length;

  const requiresRetry = criticalCount > 0 || majorCount > 0 || overallConsistency < 72;
  const recommendedMutations = requiresRetry ? recommendedMutationsFor(conflicts, blueprint) : [];
  const warnings = buildWarnings(conflicts);

  const explainability: ConsensusExplainabilityReport = {
    agentId: CONSENSUS_ENGINE_ID,
    crossLinksChecked: agreementMatrix.pairs,
    criticalConflicts: conflicts
      .filter((c) => c.severity === ConflictSeverity.CRITICAL)
      .map((c) => c.code),
    reasoning: [
      `Overall consistency ${overallConsistency}% across ${TRACKED_SECTIONS.length} tracked sections`,
      `Weakest link: ${agreementMatrix.weakestSection ?? "none"} at ${agreementMatrix.weakestSection ? agreementMatrix.sections[agreementMatrix.weakestSection] : "n/a"}% agreement`,
      conflicts.length
        ? `${conflicts.length} cross-agent conflicts detected via semantic analysis — not string matching`
        : "No cross-agent conflicts — blueprint forms coherent commercial system",
      criticalCount
        ? `${criticalCount} critical conflict(s) override high individual agent agreement — no voting`
        : "No critical conflicts — logical consistency check passed",
      requiresRetry
        ? `Retry recommended for ${agreementMatrix.weakestSection ?? "conflicted sections"}`
        : "Blueprint approved for render adapter handoff",
    ],
  };

  const report: ConsensusReport = {
    overallConsistency,
    conflicts,
    warnings,
    agreementMatrix,
    requiresRetry,
    recommendedMutations,
    confidence: Math.max(0.5, Math.min(0.98, 0.82 - criticalCount * 0.1 - majorCount * 0.04)),
  };

  return { report, explainability };
}

export function validateConsensusReport(report: ConsensusReport): ConsensusValidationReport {
  const violations: string[] = [];

  for (const conflict of report.conflicts) {
    if (!conflict.explanation) violations.push("UNEXPLAINABLE_CONFLICT");
    if (conflict.sections.length < 2 && conflict.type === ConflictType.SEMANTIC) {
      violations.push("SECTION_ONLY_ANALYSIS");
    }
  }

  const hasCritical = report.conflicts.some((c) => c.severity === ConflictSeverity.CRITICAL);
  if (hasCritical && !report.requiresRetry) {
    violations.push("CRITICAL_CONFLICT_SKIPPED");
  }

  if (report.conflicts.length === 0 && report.overallConsistency < 50) {
    violations.push("MISSING_SEMANTIC_CHECK");
  }

  return { valid: violations.length === 0, violations, report };
}

export function isConsensusFailure(code: string): code is ConsensusFailureCode {
  return [
    "SECTION_ONLY_ANALYSIS",
    "MISSING_SEMANTIC_CHECK",
    "CRITICAL_CONFLICT_SKIPPED",
    "UNEXPLAINABLE_CONFLICT",
    "VOTING_INSTEAD_OF_LOGIC",
  ].includes(code);
}

export function runConsensusEngine(input: {
  blueprint: Readonly<RenderBlueprint>;
  context?: ConsensusContext;
}): {
  report: ConsensusReport;
  explainability: ConsensusExplainabilityReport;
} {
  return buildConsensusReport(input.blueprint, input.context);
}
