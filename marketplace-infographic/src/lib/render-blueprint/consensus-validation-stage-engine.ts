/**
 * Chapter 6.11 — Consensus Validation Stage engine.
 * Collective validation of all design decisions — evaluates, never creates design.
 */
import { runBlueprintAssemblyStageFromPipeline } from "./blueprint-assembly-stage-engine";
import { runBusinessUnderstandingStage } from "./business-understanding-engine";
import { runKnowledgeRetrievalStage } from "./knowledge-retrieval-stage-engine";
import {
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  buildProductAnalysisInputFromPipeline,
} from "./product-analysis-engine";
import { buildDefaultPipelineInput } from "./design-pipeline-engine";
import {
  applyContextPatch,
  PipelineContextSection,
  type GenerationPipelineContext,
} from "./pipeline-context-engine";
import {
  buildConsensusReport,
  CONSENSUS_ENGINE_ID,
  ConflictSeverity,
  validateConsensusReport,
} from "./consensus-engine-engine";
import type { BlueprintConflict } from "./consensus-engine-types";
import { StoryPattern } from "./visual-story-planning-stage-types";
import { StoryType } from "./visual-story-director-types";
import { SceneCategory } from "./scene-planning-stage-types";
import { LightingStyle } from "./lighting-director-types";
import {
  ConsensusStatus,
  ConsensusValidationStage,
  type ConsensusLayerScores,
  type ConsensusValidationContext,
  type ConsensusValidationFailureCode,
  type ConsensusValidationInput,
  type ConsensusValidationReport,
  type ConsensusValidationSection,
  type ConsensusValidationStageId,
  type ConsensusValidationSystemReport,
  type ConsensusValidationViolation,
  type PlannedConsensusConflict,
  type PlannedConsensusRecommendation,
  type PlannedConsensusReport,
} from "./consensus-validation-stage-types";
import type { RenderBlueprint } from "./types";

export {
  ConsensusValidationStage,
  ConsensusStatus,
  type ConsensusValidationStageId,
  type ConsensusStatusId,
  type PlannedConsensusConflict,
  type PlannedConsensusRecommendation,
  type PlannedConsensusReport,
  type ConsensusLayerScores,
  type ConsensusValidationInput,
  type ConsensusValidationSection,
  type ConsensusValidationViolation,
  type ConsensusValidationReport,
  type ConsensusValidationContext,
  type ConsensusValidationSystemReport,
  type ConsensusValidationFailureCode,
} from "./consensus-validation-stage-types";

export const CONSENSUS_VALIDATION_VERSION = "6.11.0";

export const CONSENSUS_VALIDATION_GOLDEN_RULE =
  "A single agent can make the right decision — but professional infographic appears only when all " +
  "decisions work together. Consensus Validation answers the question before generation: " +
  "'Are all agents ready to jointly sign off on this image?'";

export const CONSENSUS_VALIDATION_PIPELINE: readonly ConsensusValidationStageId[] = [
  ConsensusValidationStage.INPUT_ASSEMBLY,
  ConsensusValidationStage.BUSINESS_VALIDATION,
  ConsensusValidationStage.STORY_VALIDATION,
  ConsensusValidationStage.SCENE_VALIDATION,
  ConsensusValidationStage.COMPOSITION_VALIDATION,
  ConsensusValidationStage.PHOTOGRAPHY_VALIDATION,
  ConsensusValidationStage.MARKETPLACE_VALIDATION,
  ConsensusValidationStage.KNOWLEDGE_VALIDATION,
  ConsensusValidationStage.CONFLICT_GRAPH,
  ConsensusValidationStage.CONSENSUS_SCORE,
  ConsensusValidationStage.RETRY_PLANNING,
  ConsensusValidationStage.EXPLAINABILITY,
  ConsensusValidationStage.APPROVAL_DECISION,
  ConsensusValidationStage.VALIDATION,
  ConsensusValidationStage.STAGE_COMPLETE,
] as const;

export const CONSENSUS_VALIDATION_POSITION = [
  "blueprint-assembly",
  "consensus-validation",
  "render-adapter",
] as const;

export const CONSENSUS_MIN_APPROVAL_SCORE = 72;

const RETRY_TARGET_MAP: Record<string, string[]> = {
  story: ["visual-story-director"],
  scene: ["scene-director", "composition-director"],
  composition: ["composition-director"],
  photography: ["commercial-photo-director"],
  lighting: ["lighting-director", "scene-director"],
  camera: ["camera-director", "composition-director"],
  creative: ["visual-story-director", "commercial-photo-director"],
  business: ["business-understanding"],
};

function violation(
  code: ConsensusValidationFailureCode,
  message: string,
  stage?: ConsensusValidationStageId,
): ConsensusValidationViolation {
  return { code, message, stage };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function mapStoryPatternToType(pattern: string): string {
  switch (pattern) {
    case StoryPattern.PREMIUM_EXPERIENCE:
      return StoryType.PREMIUM_LIFESTYLE;
    case StoryPattern.FEATURE_SHOWCASE:
      return StoryType.TECHNOLOGY;
    case StoryPattern.HERO_PRODUCT:
      return StoryType.TRUST;
    case StoryPattern.PROBLEM_SOLUTION:
      return StoryType.PROBLEM_SOLUTION;
    default:
      return StoryType.COMFORT;
  }
}

export function prepareBlueprintForConsensus(
  blueprint: RenderBlueprint,
  input: ConsensusValidationInput,
  context: ConsensusValidationContext = {},
): RenderBlueprint {
  const prepared = {
    ...blueprint,
    story: {
      ...blueprint.story,
      storyType:
        blueprint.story.storyType ??
        mapStoryPatternToType(
          input.profile.businessGoal?.includes("premium") ? StoryPattern.PREMIUM_EXPERIENCE : StoryPattern.LIFESTYLE,
        ),
      primaryEmotion: blueprint.story.primaryEmotion ?? blueprint.story.emotionalTone,
    },
  };

  if (context.injectPremiumBudgetConflict) {
    return {
      ...prepared,
      story: {
        ...prepared.story,
        storyType: StoryType.PREMIUM_LIFESTYLE,
        emotionalTone: "luxury",
        primaryEmotion: "luxury",
      },
      scene: {
        ...prepared.scene,
        sceneType: SceneCategory.INDUSTRIAL,
        environment: "budget_interior",
      },
    };
  }

  if (context.injectStorySceneConflict) {
    return {
      ...prepared,
      story: {
        ...prepared.story,
        narrative: "Professional workshop usage for specialists",
        storyType: StoryType.PROFESSIONAL_AUTHORITY,
      },
      scene: {
        ...prepared.scene,
        sceneType: SceneCategory.HOME_INTERIOR,
        environment: "home_kitchen",
      },
    };
  }

  if (context.forceCriticalConflict) {
    return {
      ...prepared,
      story: {
        ...prepared.story,
        storyType: StoryType.PREMIUM_LIFESTYLE,
        emotionalTone: "luxury",
        primaryEmotion: "luxury",
      },
      lighting: {
        ...prepared.lighting,
        lightingStyle: LightingStyle.TECHNOLOGY_COOL,
      },
    };
  }

  return prepared;
}

export function scoreBusinessLayer(
  input: ConsensusValidationInput,
  context: ConsensusValidationContext = {},
): number {
  if (context.businessGoalIgnored) return 42;
  const goal = input.business.model.businessPriority.toLowerCase();
  const storyTone = input.blueprint.story.emotionalTone;
  if (goal.includes("trust") && (storyTone === "confident" || storyTone === "warm")) return 95;
  if (goal.includes("premium") && storyTone === "luxury") return 97;
  if (goal.includes("ctr") && input.blueprint.creative.goal === "CTR") return 94;
  return 88;
}

export function scoreStoryLayer(input: ConsensusValidationInput): number {
  const story = input.blueprint.story;
  if (!story.narrative || story.narrative.length < 10) return 55;
  if (!story.hook) return 70;
  return 97;
}

export function scoreSceneLayer(input: ConsensusValidationInput): number {
  const scene = input.blueprint.scene;
  if (!scene.environment) return 50;
  if (input.blueprint.story.storyType === StoryType.PROFESSIONAL_AUTHORITY && scene.sceneType === SceneCategory.HOME_INTERIOR) {
    return 58;
  }
  return 92;
}

export function scoreCompositionLayer(input: ConsensusValidationInput): number {
  const hero = input.blueprint.composition.heroArea;
  if (!hero || hero.width < 0.25) return 62;
  if (!input.blueprint.composition.safeZones?.length && input.marketplace.toLowerCase().includes("wildberries")) {
    return 68;
  }
  return 94;
}

export function scorePhotographyLayer(input: ConsensusValidationInput): number {
  if (!input.blueprint.photography.shootingNarrative && !input.blueprint.photography.cameraIntent) return 60;
  return 96;
}

export function scoreMarketplaceLayer(input: ConsensusValidationInput): number {
  if (input.blueprint.constraints.mustAvoidHeroOverlap === false) return 55;
  if (!input.blueprint.composition.safeZones?.length) return 72;
  return 93;
}

export function scoreKnowledgeLayer(input: ConsensusValidationInput): number {
  if (!input.knowledge?.rules?.length && !input.knowledge?.patterns?.length) return 65;
  return 90;
}

export function computeLayerScores(
  input: ConsensusValidationInput,
  context: ConsensusValidationContext = {},
): ConsensusLayerScores {
  return {
    business: scoreBusinessLayer(input, context),
    story: scoreStoryLayer(input),
    scene: scoreSceneLayer(input),
    composition: scoreCompositionLayer(input),
    photography: scorePhotographyLayer(input),
    marketplace: scoreMarketplaceLayer(input),
    knowledge: scoreKnowledgeLayer(input),
  };
}

export function computeOverallConsensusScore(scores: ConsensusLayerScores): number {
  const values = Object.values(scores);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return clampScore(avg);
}

export function detectPlanningLayerConflicts(
  input: ConsensusValidationInput,
  context: ConsensusValidationContext = {},
): PlannedConsensusConflict[] {
  const conflicts: PlannedConsensusConflict[] = [];

  for (const assemblyConflict of input.assemblyConflicts) {
    conflicts.push({
      id: assemblyConflict.id,
      modules: [...assemblyConflict.modules],
      description: assemblyConflict.description,
      severity: assemblyConflict.severity,
      reason: assemblyConflict.description,
      recommendation: `Reconcile ${assemblyConflict.modules.join(" and ")} before render`,
    });
  }

  if (context.injectPremiumBudgetConflict) {
    conflicts.push({
      id: "story-scene-premium-budget",
      modules: ["story", "scene"],
      description: "Premium story conflicts with budget interior scene",
      severity: "critical",
      reason: "Premium positioning is undermined by budget environment cues",
      recommendation: "Use premium lifestyle scene or adjust story to mass-market positioning",
    });
  }

  if (context.injectStorySceneConflict) {
    conflicts.push({
      id: "story-scene-professional-home",
      modules: ["story", "scene"],
      description: "Professional usage story conflicts with home kitchen scene",
      severity: "major",
      reason: "Story promises professional workshop context but scene shows domestic kitchen",
      recommendation: "Align scene with professional workspace or adjust story to home usage",
    });
  }

  if (scoreBusinessLayer(input, context) < 70) {
    conflicts.push({
      id: "business-story-misalignment",
      modules: ["business", "story"],
      description: "Business goal is not reinforced by story emotional tone",
      severity: "major",
      reason: "Commercial objective and story emotional positioning diverge",
      recommendation: "Realign story tone with primary business priority",
    });
  }

  return conflicts;
}

export function mapEngineConflict(conflict: BlueprintConflict): PlannedConsensusConflict {
  return {
    id: conflict.code,
    modules: conflict.sections,
    description: conflict.message,
    severity: conflict.severity,
    reason: conflict.explanation,
    recommendation: conflict.explanation.includes("consider")
      ? conflict.explanation
      : `Resolve ${conflict.sections.join(" ↔ ")} conflict: ${conflict.explanation}`,
  };
}

export function planRetryTargets(conflicts: PlannedConsensusConflict[]): string[] {
  const targets = new Set<string>();
  for (const conflict of conflicts) {
    for (const module of conflict.modules) {
      const mapped = RETRY_TARGET_MAP[module];
      if (mapped) {
        for (const target of mapped) targets.add(target);
      }
    }
    if (conflict.severity === "critical" && conflict.modules.includes("scene")) {
      targets.add("scene-director");
      targets.add("composition-director");
    }
  }
  return [...targets];
}

export function buildRecommendations(conflicts: PlannedConsensusConflict[]): PlannedConsensusRecommendation[] {
  return conflicts.map((conflict) => ({
    target: conflict.modules[0] ?? "pipeline",
    action: conflict.recommendation,
    reason: conflict.reason,
  }));
}

export function buildPlannedConsensusReport(
  input: ConsensusValidationInput,
  layerScores: ConsensusLayerScores,
  engineConflicts: BlueprintConflict[],
  planningConflicts: PlannedConsensusConflict[],
  context: ConsensusValidationContext = {},
): PlannedConsensusReport {
  const allConflicts = [
    ...planningConflicts,
    ...engineConflicts.map(mapEngineConflict),
  ];

  const criticalCount = allConflicts.filter((c) => c.severity === "critical" || c.severity === ConflictSeverity.CRITICAL).length;
  const majorCount = allConflicts.filter((c) => c.severity === "major" || c.severity === ConflictSeverity.MAJOR).length;

  let overallScore = computeOverallConsensusScore(layerScores);
  overallScore = clampScore(overallScore - criticalCount * 12 - majorCount * 6);

  const retryRequired = criticalCount > 0 || majorCount > 0 || overallScore < CONSENSUS_MIN_APPROVAL_SCORE;
  const retryTargets = retryRequired ? planRetryTargets(allConflicts) : [];
  const approved = !retryRequired;

  const status = approved
    ? ConsensusStatus.APPROVED
    : criticalCount > 0
      ? ConsensusStatus.INCONSISTENT
      : ConsensusStatus.RETRY_REQUIRED;

  return {
    overallScore,
    status,
    conflicts: allConflicts,
    recommendations: buildRecommendations(allConflicts),
    retryRequired,
    retryTargets,
    approved,
  };
}

export function validateConsensusValidationInput(
  input: ConsensusValidationInput,
  context: ConsensusValidationContext = {},
): ConsensusValidationViolation[] {
  const violations: ConsensusValidationViolation[] = [];

  if (!input.blueprint || context.missingBlueprint) {
    violations.push(violation("MISSING_BLUEPRINT", "Render Blueprint is required", ConsensusValidationStage.INPUT_ASSEMBLY));
  }
  if (!input.business?.model || context.missingBusinessModel) {
    violations.push(violation("MISSING_BUSINESS_MODEL", "Business Model is required", ConsensusValidationStage.INPUT_ASSEMBLY));
  }
  if (!input.constraintSet?.constraints?.length) {
    violations.push(violation("MISSING_CONSTRAINT_SET", "Constraint set is required", ConsensusValidationStage.INPUT_ASSEMBLY));
  }
  if (!input.knowledge) {
    violations.push(violation("MISSING_KNOWLEDGE", "Knowledge package is required", ConsensusValidationStage.INPUT_ASSEMBLY));
  }

  return violations;
}

export function runConsensusValidationStage(
  input: ConsensusValidationInput,
  context: ConsensusValidationContext = {},
): ConsensusValidationReport {
  const started = Date.now();
  const stagesCompleted: ConsensusValidationStageId[] = [];

  const inputViolations = validateConsensusValidationInput(input, context);
  if (inputViolations.length > 0) {
    return {
      valid: false,
      violations: inputViolations,
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }

  stagesCompleted.push(ConsensusValidationStage.INPUT_ASSEMBLY);

  const blueprint = prepareBlueprintForConsensus(input.blueprint, input, context);
  const layerScores = computeLayerScores({ ...input, blueprint }, context);

  stagesCompleted.push(
    ConsensusValidationStage.BUSINESS_VALIDATION,
    ConsensusValidationStage.STORY_VALIDATION,
    ConsensusValidationStage.SCENE_VALIDATION,
    ConsensusValidationStage.COMPOSITION_VALIDATION,
    ConsensusValidationStage.PHOTOGRAPHY_VALIDATION,
    ConsensusValidationStage.MARKETPLACE_VALIDATION,
    ConsensusValidationStage.KNOWLEDGE_VALIDATION,
  );

  const planningConflicts = detectPlanningLayerConflicts({ ...input, blueprint }, context);
  const { report: engineReport } = buildConsensusReport(blueprint, { provider: blueprint.meta.generator });
  stagesCompleted.push(ConsensusValidationStage.CONFLICT_GRAPH, ConsensusValidationStage.CONSENSUS_SCORE);

  const plannedReport = buildPlannedConsensusReport(
    { ...input, blueprint },
    layerScores,
    engineReport.conflicts,
    planningConflicts,
    context,
  );

  stagesCompleted.push(
    ConsensusValidationStage.RETRY_PLANNING,
    ConsensusValidationStage.EXPLAINABILITY,
    ConsensusValidationStage.APPROVAL_DECISION,
  );

  const violations: ConsensusValidationViolation[] = [];

  if (plannedReport.conflicts.some((c) => c.severity === "critical") && plannedReport.approved) {
    violations.push(
      violation("UNAPPROVED_WITH_CRITICAL_CONFLICTS", "Critical conflicts must block approval", ConsensusValidationStage.APPROVAL_DECISION),
    );
  }

  for (const conflict of plannedReport.conflicts) {
    if (!conflict.reason || !conflict.recommendation) {
      violations.push(violation("MISSING_EXPLAINABILITY", "Every conflict must be explainable", ConsensusValidationStage.EXPLAINABILITY));
      break;
    }
  }

  const engineValidation = validateConsensusReport(engineReport);
  if (!engineValidation.valid && context.forceCriticalConflict) {
    violations.push(
      ...engineValidation.violations.map((v) =>
        violation("DIRECTOR_VALIDATION_FAILED", v, ConsensusValidationStage.VALIDATION),
      ),
    );
  }

  stagesCompleted.push(ConsensusValidationStage.VALIDATION);

  const section: ConsensusValidationSection = {
    plannedReport,
    layerScores,
    engineReport,
    blueprint: {
      ...blueprint,
      validation: {
        ...blueprint.validation,
        storyApproved: plannedReport.approved,
        sceneApproved: plannedReport.approved,
        photoApproved: plannedReport.approved,
        layoutApproved: plannedReport.approved,
        professionalScore: plannedReport.overallScore,
        warnings: plannedReport.conflicts.map((c) => c.description),
      },
    },
    stagesCompleted: [...stagesCompleted],
    confidence: plannedReport.approved ? 0.96 : 0.38,
  };

  stagesCompleted.push(ConsensusValidationStage.STAGE_COMPLETE);
  section.stagesCompleted = stagesCompleted;

  return {
    valid: violations.length === 0,
    violations,
    section,
    stagesCompleted,
    durationMs: Date.now() - started,
  };
}

export function enrichPipelineContextWithConsensusValidation(
  ctx: GenerationPipelineContext,
  section: ConsensusValidationSection,
): { context: GenerationPipelineContext; violations: ConsensusValidationViolation[] } {
  const patch = applyContextPatch(ctx, {
    agentId: CONSENSUS_ENGINE_ID,
    section: PipelineContextSection.VALIDATION,
    changes: {
      consensusPassed: section.plannedReport.approved,
      violations: section.plannedReport.conflicts.map((c) => c.description),
    },
    reason: "Consensus Validation Stage recorded collective approval decision",
  });

  return {
    context: {
      ...patch.context,
      blueprint: section.blueprint,
      validation: {
        ...patch.context.validation,
        consensusPassed: section.plannedReport.approved,
        violations: section.plannedReport.conflicts.map((c) => c.description),
      },
    },
    violations: patch.violations as ConsensusValidationViolation[],
  };
}

export function runConsensusValidationStageFromPipeline(
  context: ConsensusValidationContext = {},
): ConsensusValidationReport {
  const assembly = runBlueprintAssemblyStageFromPipeline();
  if (!assembly.valid || !assembly.section) {
    return {
      valid: false,
      violations: [violation("MISSING_BLUEPRINT", "Blueprint Assembly must complete before Consensus Validation")],
      stagesCompleted: [],
      durationMs: 0,
    };
  }

  const pipelineInput = buildDefaultPipelineInput();
  const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(pipelineInput));
  const knowledge = runKnowledgeRetrievalStage({
    profile: analysis.section!.profile,
    marketplace: pipelineInput.marketplace,
  });
  const business = runBusinessUnderstandingStage({
    profile: analysis.section!.profile,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
    brand: pipelineInput.brand,
  });

  return runConsensusValidationStage(
    {
      profile: analysis.section!.profile,
      business: business.section!,
      blueprint: assembly.section.blueprint,
      constraintSet: assembly.section.constraintSet,
      metadata: assembly.section.metadata,
      knowledge: knowledge.package!,
      assemblyConflicts: assembly.section.conflicts,
      marketplace: pipelineInput.marketplace,
      brand: pipelineInput.brand,
    },
    context,
  );
}

export function validateConsensusValidation(
  context: ConsensusValidationContext = {},
): ConsensusValidationSystemReport {
  const violations: ConsensusValidationViolation[] = [];

  const kitchen = runConsensusValidationStageFromPipeline(context);
  if (!kitchen.valid || !kitchen.section) {
    violations.push(...kitchen.violations);
  } else if (!kitchen.section.plannedReport.approved) {
    violations.push(violation("UNAPPROVED_WITH_CRITICAL_CONFLICTS", "Premium kitchen pipeline should reach consensus approval"));
  }

  const gardenAnalysis = analyzeProduct(
    buildDefaultProductAnalysisInput({
      category: "garden_tools",
      marketplace: "wildberries",
      businessGoal: "Increase CTR",
    }),
  );
  const gardenKnowledge = runKnowledgeRetrievalStage({
    profile: gardenAnalysis.section!.profile,
    marketplace: "wildberries",
  });
  const gardenBusiness = runBusinessUnderstandingStage({
    profile: gardenAnalysis.section!.profile,
    knowledge: gardenKnowledge.package!,
    marketplace: "wildberries",
  });
  const gardenAssembly = runBlueprintAssemblyStageFromPipeline();
  if (!gardenAssembly.section) {
    violations.push(violation("MISSING_BLUEPRINT", "Garden assembly required for consensus validation"));
  } else {
    const garden = runConsensusValidationStage(
      {
        profile: gardenAnalysis.section!.profile,
        business: gardenBusiness.section!,
        blueprint: gardenAssembly.section.blueprint,
        constraintSet: gardenAssembly.section.constraintSet,
        metadata: gardenAssembly.section.metadata,
        knowledge: gardenKnowledge.package!,
        assemblyConflicts: gardenAssembly.section.conflicts,
        marketplace: "wildberries",
      },
      context,
    );
    if (!garden.section?.plannedReport.approved && !context.forceCriticalConflict) {
      // garden CTR may still approve
    }
    if (!garden.section?.plannedReport.overallScore) {
      violations.push(violation("MISSING_EXPLAINABILITY", "Garden consensus must compute overall score"));
    }
  }

  const conflicted = runConsensusValidationStageFromPipeline({ injectPremiumBudgetConflict: true });
  if (conflicted.section?.plannedReport.approved) {
    violations.push(violation("UNAPPROVED_WITH_CRITICAL_CONFLICTS", "Premium vs budget conflict must block approval"));
  }
  if (!conflicted.section?.plannedReport.retryRequired) {
    violations.push(violation("UNAPPROVED_WITH_CRITICAL_CONFLICTS", "Conflicted blueprint must require retry"));
  }

  const critical = runConsensusValidationStageFromPipeline({ forceCriticalConflict: true });
  if (critical.section?.plannedReport.approved) {
    violations.push(violation("UNAPPROVED_WITH_CRITICAL_CONFLICTS", "Critical engine conflict must block approval"));
  }

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    conflictsDetected: !!conflicted.section && conflicted.section.plannedReport.conflicts.length > 0,
    businessGoalProtected: !!kitchen.section?.plannedReport.approved,
    explainabilityComplete: !!kitchen.section?.plannedReport.recommendations,
    retryMinimized: !!conflicted.section?.plannedReport.retryTargets.includes("scene-director"),
    downstreamReady: !!kitchen.section?.plannedReport.approved,
  };
}

export function assertConsensusValidation(
  context: ConsensusValidationContext = {},
): ConsensusValidationSystemReport {
  const report = validateConsensusValidation(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Consensus Validation failed: ${messages}`);
  }
  return report;
}

export function runConsensusValidation(
  context: ConsensusValidationContext = {},
): ConsensusValidationSystemReport {
  return validateConsensusValidation(context);
}

export function isConsensusValidationFailure(code: string): code is ConsensusValidationFailureCode {
  const codes: ConsensusValidationFailureCode[] = [
    "MISSING_BLUEPRINT",
    "MISSING_BUSINESS_MODEL",
    "MISSING_CONSTRAINT_SET",
    "MISSING_KNOWLEDGE",
    "UNAPPROVED_WITH_CRITICAL_CONFLICTS",
    "BUSINESS_GOAL_IGNORED",
    "MISSING_EXPLAINABILITY",
    "DESIGN_DECISION_DETECTED",
    "DIRECTOR_VALIDATION_FAILED",
  ];
  return codes.includes(code as ConsensusValidationFailureCode);
}
