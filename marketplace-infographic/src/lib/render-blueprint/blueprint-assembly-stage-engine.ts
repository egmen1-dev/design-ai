/**
 * Chapter 6.10 — Blueprint Assembly Stage engine.
 * Merges agent decisions into one Render Blueprint — never alters design decisions.
 */
import { CURRENT_PIPELINE_VERSION } from "./blueprint-version";
import { DESIGN_RULES_ENGINE_VERSION } from "./design-rules-engine";
import { buildDefaultPipelineInput } from "./design-pipeline-engine";
import { runBusinessUnderstandingStage } from "./business-understanding-engine";
import { KNOWLEDGE_RETRIEVAL_STAGE_VERSION, runKnowledgeRetrievalStage } from "./knowledge-retrieval-stage-engine";
import { PATTERN_LIBRARY_VERSION } from "./pattern-library-engine";
import {
  applyContextPatch,
  PipelineContextSection,
  type GenerationPipelineContext,
} from "./pipeline-context-engine";
import {
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  buildProductAnalysisInputFromPipeline,
} from "./product-analysis-engine";
import { runCompositionPlanningStage } from "./composition-planning-stage-engine";
import { compositionPlanningToMutations } from "./composition-planning-stage-engine";
import { runPhotographyPlanningStage } from "./photography-planning-stage-engine";
import { photographyPlanningToMutations } from "./photography-planning-stage-engine";
import { COMMERCIAL_PHOTO_DIRECTOR_ID } from "./commercial-photo-director-engine";
import { runScenePlanningStage } from "./scene-planning-stage-engine";
import { scenePlanningToMutations } from "./scene-planning-stage-engine";
import { runVisualStoryPlanningStage } from "./visual-story-planning-stage-engine";
import { storyPlanningToMutations } from "./visual-story-planning-stage-engine";
import { StoryPattern } from "./visual-story-planning-stage-types";
import { SceneCategory, BackgroundStyle } from "./scene-planning-stage-types";
import { LayoutPattern } from "./composition-planning-stage-types";
import { PlannedPhotographyStyle } from "./photography-planning-stage-types";
import { MARKETPLACE_PROFILE_VERSIONS, MarketplaceKnowledgeId } from "./marketplace-knowledge-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import type { BlueprintMutation } from "./mutation-types";
import { hashValue } from "./section-hash";
import {
  ConstraintCategory,
  ConstraintPriority,
  ConstraintSource,
  type Constraint,
  type ConstraintSet,
} from "./constraint-types";
import { SectionState } from "./lifecycle-types";
import type { MarketplaceId, RenderBlueprint } from "./types";
import {
  AssemblyConflictSeverity,
  AssemblyStatus,
  BlueprintAssemblyStage,
  type AssemblyBlueprintSnapshot,
  type AssemblyConflict,
  type BlueprintAssemblyContext,
  type BlueprintAssemblyFailureCode,
  type BlueprintAssemblyInput,
  type BlueprintAssemblyReport,
  type BlueprintAssemblySection,
  type BlueprintAssemblyStageId,
  type BlueprintAssemblySystemReport,
  type BlueprintAssemblyViolation,
  type PipelineAssemblyMetadata,
} from "./blueprint-assembly-stage-types";

export {
  BlueprintAssemblyStage,
  AssemblyStatus,
  AssemblyConflictSeverity,
  type BlueprintAssemblyStageId,
  type AssemblyStatusId,
  type AssemblyConflictSeverityId,
  type AssemblyConflict,
  type PipelineAssemblyMetadata,
  type AssemblyBlueprintSnapshot,
  type BlueprintAssemblyInput,
  type BlueprintAssemblySection,
  type BlueprintAssemblyViolation,
  type BlueprintAssemblyReport,
  type BlueprintAssemblyContext,
  type BlueprintAssemblySystemReport,
  type BlueprintAssemblyFailureCode,
} from "./blueprint-assembly-stage-types";

export const BLUEPRINT_ASSEMBLY_VERSION = "6.10.0";

export const BLUEPRINT_ASSEMBLY_ACTOR = "design-pipeline";

export const BLUEPRINT_ASSEMBLY_GOLDEN_RULE =
  "No Design AI agent creates the final image alone — each designs only their part. " +
  "Blueprint Assembly is where dozens of independent professional decisions first unite into one " +
  "engineering document ready for collective validation, visualization, and evolution.";

export const BLUEPRINT_ASSEMBLY_PIPELINE: readonly BlueprintAssemblyStageId[] = [
  BlueprintAssemblyStage.INPUT_ASSEMBLY,
  BlueprintAssemblyStage.BLUEPRINT_INTEGRITY,
  BlueprintAssemblyStage.SECTION_MERGE,
  BlueprintAssemblyStage.CROSS_MODULE_CONSISTENCY,
  BlueprintAssemblyStage.DEPENDENCY_VALIDATION,
  BlueprintAssemblyStage.CONSTRAINT_MERGE,
  BlueprintAssemblyStage.METADATA_GENERATION,
  BlueprintAssemblyStage.NORMALIZATION,
  BlueprintAssemblyStage.CONFLICT_PREPARATION,
  BlueprintAssemblyStage.UNIFIED_BLUEPRINT,
  BlueprintAssemblyStage.SNAPSHOT_CREATION,
  BlueprintAssemblyStage.AUTHORSHIP_PRESERVATION,
  BlueprintAssemblyStage.VALIDATION,
  BlueprintAssemblyStage.CONSENSUS_HANDOFF,
  BlueprintAssemblyStage.STAGE_COMPLETE,
] as const;

export const BLUEPRINT_ASSEMBLY_POSITION = [
  "photography-planning",
  "blueprint-assembly",
  "consensus-validation",
] as const;

const AGENT_AUTHORSHIP: Record<string, string[]> = {
  "visual-story-director": ["story"],
  "scene-director": ["scene"],
  "composition-director": ["composition"],
  "commercial-photo-director": ["photography"],
};

function violation(
  code: BlueprintAssemblyFailureCode,
  message: string,
  stage?: BlueprintAssemblyStageId,
): BlueprintAssemblyViolation {
  return { code, message, stage };
}

function constraint(
  partial: Omit<Constraint, "enabled"> & { enabled?: boolean },
): Constraint {
  return { enabled: true, ...partial };
}

function mapMarketplace(marketplace: string): MarketplaceId {
  const lower = marketplace.toLowerCase();
  if (lower.includes("wildberries") || lower === "wb") return "WB";
  if (lower.includes("ozon")) return "Ozon";
  return "Amazon";
}

export function validateBlueprintIntegrity(
  input: BlueprintAssemblyInput,
  context: BlueprintAssemblyContext = {},
): BlueprintAssemblyViolation[] {
  const violations: BlueprintAssemblyViolation[] = [];

  if (!input.profile?.category) {
    violations.push(violation("MISSING_PROFILE", "Product Profile is required", BlueprintAssemblyStage.INPUT_ASSEMBLY));
  }
  if (!input.business?.model) {
    violations.push(
      violation("MISSING_BUSINESS_MODEL", "Business Model is required", BlueprintAssemblyStage.INPUT_ASSEMBLY),
    );
  }
  if (!input.story?.renderStory || context.missingStory) {
    violations.push(violation("MISSING_STORY", "Story Blueprint is required", BlueprintAssemblyStage.BLUEPRINT_INTEGRITY));
  }
  if (!input.scene?.renderScene || context.missingScene) {
    violations.push(violation("MISSING_SCENE", "Scene Blueprint is required", BlueprintAssemblyStage.BLUEPRINT_INTEGRITY));
  }
  if (!input.composition?.renderComposition || context.missingComposition) {
    violations.push(
      violation("MISSING_COMPOSITION", "Composition Blueprint is required", BlueprintAssemblyStage.BLUEPRINT_INTEGRITY),
    );
  }
  if (!input.photography?.renderPhotography || context.missingPhotography) {
    violations.push(
      violation("MISSING_PHOTOGRAPHY", "Photography Blueprint is required", BlueprintAssemblyStage.BLUEPRINT_INTEGRITY),
    );
  }

  if (context.damagedSection) {
    violations.push(violation("DAMAGED_SECTION", "Blueprint section is damaged or empty", BlueprintAssemblyStage.BLUEPRINT_INTEGRITY));
  }

  return violations;
}

export function detectCrossModuleConflicts(
  input: BlueprintAssemblyInput,
  context: BlueprintAssemblyContext = {},
): AssemblyConflict[] {
  const conflicts: AssemblyConflict[] = [];
  const storyPattern = input.story.plannedBlueprint.storyPattern;
  const sceneType = input.scene.plannedBlueprint.sceneType;
  const photoStyle = input.photography.photographyStyle;
  const layoutPattern = input.composition.plannedBlueprint.layoutPattern;

  if (
    context.injectLuxuryIndustrialConflict ||
    (storyPattern === StoryPattern.PREMIUM_EXPERIENCE && sceneType === SceneCategory.INDUSTRIAL)
  ) {
    conflicts.push({
      id: "story-scene-luxury-industrial",
      modules: ["story", "scene"],
      description: "Premium experience story conflicts with industrial scene environment",
      severity: AssemblyConflictSeverity.CRITICAL,
    });
  }

  if (storyPattern === StoryPattern.PREMIUM_EXPERIENCE && photoStyle === PlannedPhotographyStyle.TECHNICAL_CATALOG) {
    conflicts.push({
      id: "story-photography-luxury-technical",
      modules: ["story", "photography"],
      description: "Premium story conflicts with technical catalog photography style",
      severity: AssemblyConflictSeverity.MAJOR,
    });
  }

  if (
    layoutPattern === LayoutPattern.CENTERED_HERO &&
    input.scene.plannedBlueprint.backgroundStyle === BackgroundStyle.DETAILED &&
    input.scene.plannedBlueprint.supportObjects.length > 6
  ) {
    conflicts.push({
      id: "composition-scene-crowded-centered",
      modules: ["composition", "scene"],
      description: "Centered hero composition conflicts with crowded lifestyle scene",
      severity: AssemblyConflictSeverity.MAJOR,
    });
  }

  if (
    storyPattern === StoryPattern.HERO_PRODUCT &&
    input.scene.plannedBlueprint.backgroundStyle === BackgroundStyle.ATMOSPHERIC &&
    layoutPattern === LayoutPattern.FEATURE_GRID
  ) {
    conflicts.push({
      id: "story-composition-hero-feature-grid",
      modules: ["story", "composition"],
      description: "Hero product story conflicts with feature grid layout emphasis",
      severity: AssemblyConflictSeverity.MAJOR,
    });
  }

  return conflicts;
}

export function validateBlueprintDependencies(
  input: BlueprintAssemblyInput,
): BlueprintAssemblyViolation[] {
  const violations: BlueprintAssemblyViolation[] = [];

  if (input.scene.plannedBlueprint.location && !input.story.plannedBlueprint.primaryMessage) {
    violations.push(
      violation("DEPENDENCY_VIOLATION", "Scene must depend on completed Story", BlueprintAssemblyStage.DEPENDENCY_VALIDATION),
    );
  }

  if (input.photography.plannedBlueprint.lightingPreset && !input.scene.plannedBlueprint.timeOfDay) {
    violations.push(
      violation("DEPENDENCY_VIOLATION", "Photography must depend on Scene time of day", BlueprintAssemblyStage.DEPENDENCY_VALIDATION),
    );
  }

  if (
    input.composition.plannedBlueprint.heroPlacement.width > 0 &&
    !input.story.plannedBlueprint.visualFocus
  ) {
    violations.push(
      violation(
        "DEPENDENCY_VIOLATION",
        "Composition must depend on Story visual focus",
        BlueprintAssemblyStage.DEPENDENCY_VALIDATION,
      ),
    );
  }

  const marketplace = input.marketplace.toLowerCase();
  if (marketplace.includes("wildberries") && input.composition.plannedBlueprint.safeZones.length === 0) {
    violations.push(
      violation(
        "DEPENDENCY_VIOLATION",
        "Marketplace rules require composition safe zones",
        BlueprintAssemblyStage.DEPENDENCY_VALIDATION,
      ),
    );
  }

  return violations;
}

export function mergeAssemblyConstraints(input: BlueprintAssemblyInput): ConstraintSet {
  const constraints: Constraint[] = [
    constraint({
      id: "story.no-technical-style",
      canonicalId: "story.no-technical-style",
      category: ConstraintCategory.STORY,
      priority: ConstraintPriority.PREFERRED,
      hard: false,
      source: ConstraintSource.STORY,
      payload: { enabled: true },
    }),
    constraint({
      id: "composition.hero-minimum-45",
      canonicalId: "composition.hero-minimum-45",
      category: ConstraintCategory.COMPOSITION,
      priority: ConstraintPriority.REQUIRED,
      hard: true,
      source: ConstraintSource.COMPOSITION,
      payload: { minimum: 0.45 },
    }),
    constraint({
      id: "marketplace.no-text-safe-zone",
      canonicalId: "marketplace.no-text-safe-zone",
      category: ConstraintCategory.MARKETPLACE,
      priority: ConstraintPriority.REQUIRED,
      hard: true,
      source: ConstraintSource.MARKETPLACE,
      payload: { enabled: true },
    }),
    constraint({
      id: "hard.no-text",
      canonicalId: "hard.no-text",
      category: ConstraintCategory.TYPOGRAPHY,
      priority: ConstraintPriority.CRITICAL,
      hard: true,
      source: ConstraintSource.SAFETY,
      payload: { enabled: true },
    }),
  ];

  for (const avoid of input.story.constraints.avoid) {
    constraints.push(
      constraint({
        id: `story.avoid.${avoid}`,
        canonicalId: `story.avoid.${avoid}`,
        category: ConstraintCategory.STORY,
        priority: ConstraintPriority.PREFERRED,
        hard: false,
        source: ConstraintSource.STORY,
        payload: { enabled: true },
      }),
    );
  }

  return { constraints, revision: 1 };
}

export function generateAssemblyMetadata(input: BlueprintAssemblyInput): PipelineAssemblyMetadata {
  const marketplaceKey = input.marketplace.toLowerCase().includes("wildberries")
    ? MarketplaceKnowledgeId.WILDBERRIES
    : input.marketplace.toLowerCase().includes("ozon")
      ? MarketplaceKnowledgeId.OZON
      : MarketplaceKnowledgeId.AMAZON;

  return {
    pipelineVersion: CURRENT_PIPELINE_VERSION,
    knowledgeEngineVersion: KNOWLEDGE_RETRIEVAL_STAGE_VERSION,
    patternLibraryVersion: PATTERN_LIBRARY_VERSION,
    designRulesVersion: DESIGN_RULES_ENGINE_VERSION,
    marketplaceProfileVersion: MARKETPLACE_PROFILE_VERSIONS[marketplaceKey],
    agentsUsed: Object.keys(AGENT_AUTHORSHIP),
    assemblyHistory: [
      "product-analysis",
      "business-understanding",
      "visual-story-planning",
      "scene-planning",
      "composition-planning",
      "photography-planning",
      "blueprint-assembly",
    ],
  };
}

export function normalizeAssembledBlueprint(blueprint: RenderBlueprint): RenderBlueprint {
  const heroArea = blueprint.composition.heroArea;
  const normalizedHero = heroArea
    ? {
        x: Math.max(0, Math.min(1, heroArea.x)),
        y: Math.max(0, Math.min(1, heroArea.y)),
        width: Math.max(0, Math.min(1, heroArea.width)),
        height: Math.max(0, Math.min(1, heroArea.height)),
      }
    : heroArea;

  return {
    ...blueprint,
    composition: {
      ...blueprint.composition,
      heroArea: normalizedHero,
      negativeSpace: Math.max(0, Math.min(100, blueprint.composition.negativeSpace ?? 0)),
      heroWeight: Math.max(0, Math.min(100, blueprint.composition.heroWeight ?? 0)),
    },
    photography: {
      ...blueprint.photography,
      backgroundBlur: Math.max(0, Math.min(1, blueprint.photography.backgroundBlur ?? 0)),
      realism: Math.max(0, Math.min(1, blueprint.photography.realism ?? 0.85)),
    },
  };
}

export function assembleRenderBlueprint(
  input: BlueprintAssemblyInput,
  constraintSet: ConstraintSet,
  context: BlueprintAssemblyContext = {},
): RenderBlueprint {
  const marketplace = mapMarketplace(input.marketplace);
  const base = createEmptyRenderBlueprint({
    seed: 42,
    category: input.profile.category,
    subCategory: input.profile.subcategory,
    marketplace,
  });

  const story = context.damagedSection
    ? { ...input.story.renderStory, narrative: "" }
    : input.story.renderStory;

  const blueprint: RenderBlueprint = {
    ...base,
    creative: {
      marketplace,
      goal: input.business.model.businessPriority.includes("premium") ? "Premium" : "CTR",
      priceSegment: (input.profile.priceSegment as RenderBlueprint["creative"]["priceSegment"]) ?? "middle",
      audience: input.profile.targetAudience.segment,
      emotion: input.story.plannedBlueprint.emotionalTone,
    },
    product: {
      ...base.product,
      category: input.profile.category,
      subCategory: input.profile.subcategory,
    },
    story,
    scene: input.scene.renderScene,
    composition: input.composition.renderComposition,
    photography: input.photography.renderPhotography,
    constraints: {
      mustLeaveHeadlineSpace: true,
      mustLeaveBadgeSpace: true,
      mustLeaveBenefitsSpace: true,
      mustAvoidText: true,
      mustAvoidDuplicateObjects: true,
      mustAvoidHeroOverlap: true,
      set: constraintSet,
    },
    lifecycle: {
      ...base.lifecycle,
      sections: {
        ...base.lifecycle.sections,
        story: SectionState.READY,
        scene: SectionState.READY,
        composition: SectionState.READY,
        photography: SectionState.READY,
        product: SectionState.READY,
        creative: SectionState.READY,
        constraints: SectionState.READY,
      },
    },
    meta: {
      ...base.meta,
      audit: [
        ...(base.meta.audit ?? []),
        { agentId: "visual-story-director", section: "story", action: "set", at: Date.now() },
        { agentId: "scene-director", section: "scene", action: "set", at: Date.now() },
        { agentId: "composition-director", section: "composition", action: "set", at: Date.now() },
        { agentId: "commercial-photo-director", section: "photography", action: "set", at: Date.now() },
        { agentId: BLUEPRINT_ASSEMBLY_ACTOR, section: "meta", action: "patch", at: Date.now() },
      ],
    },
  };

  if (context.alterDesignDecision) {
    return {
      ...blueprint,
      story: { ...blueprint.story, narrative: "Assembly altered story — forbidden" },
    };
  }

  return normalizeAssembledBlueprint(blueprint);
}

export function createAssemblySnapshot(
  blueprint: RenderBlueprint,
  status: typeof AssemblyStatus.CONSISTENT | typeof AssemblyStatus.INCONSISTENT,
  conflictCount: number,
): AssemblyBlueprintSnapshot {
  return {
    id: `assembly-snapshot-${blueprint.meta.id}`,
    blueprintId: blueprint.meta.id,
    createdAt: Date.now(),
    pipelineVersion: CURRENT_PIPELINE_VERSION,
    checksum: hashValue({ blueprintId: blueprint.meta.id, revision: blueprint.meta.revision }),
    status,
    conflictCount,
  };
}

export function validateAssemblySection(
  section: BlueprintAssemblySection,
  context: BlueprintAssemblyContext = {},
): BlueprintAssemblyViolation[] {
  const violations: BlueprintAssemblyViolation[] = [];

  violations.push(...validateBlueprintIntegrity(section.sources, context));
  violations.push(...validateBlueprintDependencies(section.sources));

  if (!section.constraintSet?.constraints?.length) {
    violations.push(
      violation("MISSING_CONSTRAINT_SET", "Constraint set must be merged", BlueprintAssemblyStage.CONSTRAINT_MERGE),
    );
  }

  if (!section.snapshot?.id) {
    violations.push(violation("MISSING_SNAPSHOT", "Assembly snapshot must be created", BlueprintAssemblyStage.SNAPSHOT_CREATION));
  }

  if (!section.blueprint.story?.narrative && !context.damagedSection) {
    violations.push(violation("INCOMPLETE_BLUEPRINT", "Unified blueprint is incomplete", BlueprintAssemblyStage.UNIFIED_BLUEPRINT));
  }

  if (context.alterDesignDecision) {
    violations.push(
      violation("DESIGN_DECISION_ALTERED", "Assembly must not alter agent design decisions", BlueprintAssemblyStage.AUTHORSHIP_PRESERVATION),
    );
  }

  const authorshipAgents = Object.keys(section.agentAuthorship);
  if (authorshipAgents.length < 4) {
    violations.push(
      violation("AGENT_AUTHORSHIP_LOST", "Agent authorship must be preserved per section", BlueprintAssemblyStage.AUTHORSHIP_PRESERVATION),
    );
  }

  return violations;
}

export function runBlueprintAssemblyStage(
  input: BlueprintAssemblyInput,
  context: BlueprintAssemblyContext = {},
): BlueprintAssemblyReport {
  const started = Date.now();
  const stagesCompleted: BlueprintAssemblyStageId[] = [];

  const integrityViolations = validateBlueprintIntegrity(input, context);
  if (integrityViolations.length > 0) {
    return {
      valid: false,
      violations: integrityViolations,
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }

  stagesCompleted.push(BlueprintAssemblyStage.INPUT_ASSEMBLY, BlueprintAssemblyStage.BLUEPRINT_INTEGRITY);

  const constraintSet = mergeAssemblyConstraints(input);
  const conflicts = detectCrossModuleConflicts(input, context);
  const metadata = generateAssemblyMetadata(input);

  stagesCompleted.push(
    BlueprintAssemblyStage.SECTION_MERGE,
    BlueprintAssemblyStage.CROSS_MODULE_CONSISTENCY,
    BlueprintAssemblyStage.DEPENDENCY_VALIDATION,
    BlueprintAssemblyStage.CONSTRAINT_MERGE,
    BlueprintAssemblyStage.METADATA_GENERATION,
    BlueprintAssemblyStage.CONFLICT_PREPARATION,
  );

  const blueprint = assembleRenderBlueprint(input, constraintSet, context);
  stagesCompleted.push(BlueprintAssemblyStage.NORMALIZATION, BlueprintAssemblyStage.UNIFIED_BLUEPRINT);

  const status = conflicts.length > 0 ? AssemblyStatus.INCONSISTENT : AssemblyStatus.CONSISTENT;
  const snapshot = createAssemblySnapshot(blueprint, status, conflicts.length);
  stagesCompleted.push(BlueprintAssemblyStage.SNAPSHOT_CREATION, BlueprintAssemblyStage.AUTHORSHIP_PRESERVATION);

  const section: BlueprintAssemblySection = {
    blueprint,
    metadata,
    constraintSet,
    conflicts,
    snapshot,
    status,
    agentAuthorship: { ...AGENT_AUTHORSHIP },
    sources: input,
    stagesCompleted: [...stagesCompleted],
    confidence: integrityViolations.length === 0 ? 0.95 : 0.35,
  };

  const violations = validateAssemblySection(section, context);
  stagesCompleted.push(BlueprintAssemblyStage.VALIDATION, BlueprintAssemblyStage.CONSENSUS_HANDOFF, BlueprintAssemblyStage.STAGE_COMPLETE);
  section.stagesCompleted = stagesCompleted;

  return {
    valid: violations.length === 0,
    violations,
    section,
    stagesCompleted,
    durationMs: Date.now() - started,
  };
}

export function blueprintAssemblyToMutations(
  section: BlueprintAssemblySection,
  revision = 0,
): BlueprintMutation[] {
  return [
    ...storyPlanningToMutations(section.sources.story, revision, "Blueprint Assembly preserved story authorship"),
    ...scenePlanningToMutations(section.sources.scene, revision, "Blueprint Assembly preserved scene authorship"),
    ...compositionPlanningToMutations(
      section.sources.composition,
      revision,
      "Blueprint Assembly preserved composition authorship",
    ),
    ...photographyPlanningToMutations(
      section.sources.photography,
      revision,
      "Blueprint Assembly preserved photography authorship",
    ),
  ];
}

export function enrichPipelineContextWithBlueprintAssembly(
  ctx: GenerationPipelineContext,
  section: BlueprintAssemblySection,
): { context: GenerationPipelineContext; violations: BlueprintAssemblyViolation[] } {
  const patch = applyContextPatch(ctx, {
    agentId: COMMERCIAL_PHOTO_DIRECTOR_ID,
    section: PipelineContextSection.TECHNICAL,
    changes: {
      composition: section.blueprint.composition as unknown as Record<string, unknown>,
      photography: section.blueprint.photography as unknown as Record<string, unknown>,
    },
    reason: "Blueprint Assembly Stage unified technical blueprint sections",
  });

  return {
    context: {
      ...patch.context,
      blueprint: section.blueprint,
    },
    violations: patch.violations as BlueprintAssemblyViolation[],
  };
}

function buildFullAssemblyInputFromPipeline(context: BlueprintAssemblyContext = {}) {
  const pipelineInput = buildDefaultPipelineInput();
  const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(pipelineInput));
  if (!analysis.section) return { error: "MISSING_PROFILE" as const };

  const knowledge = runKnowledgeRetrievalStage({
    profile: analysis.section.profile,
    marketplace: pipelineInput.marketplace,
    style: analysis.section.profile.priceSegment,
  });
  const business = runBusinessUnderstandingStage({
    profile: analysis.section.profile,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
    brand: pipelineInput.brand,
  });
  const story = runVisualStoryPlanningStage({
    profile: analysis.section.profile,
    business: business.section!,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
    brand: pipelineInput.brand,
  });
  const scene = runScenePlanningStage({
    profile: analysis.section.profile,
    business: business.section!,
    story: story.section!.plannedBlueprint,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
    brand: pipelineInput.brand,
  });
  const composition = runCompositionPlanningStage({
    profile: analysis.section.profile,
    business: business.section!,
    story: story.section!.plannedBlueprint,
    scene: scene.section!.plannedBlueprint,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
    brand: pipelineInput.brand,
  });
  const photography = runPhotographyPlanningStage({
    profile: analysis.section.profile,
    story: story.section!.plannedBlueprint,
    scene: scene.section!.plannedBlueprint,
    composition: composition.section!.plannedBlueprint,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
    brand: pipelineInput.brand,
  });

  if (!photography.section || !composition.section || !scene.section || !story.section || !business.section || !knowledge.package) {
    return { error: "MISSING_COMPOSITION" as const };
  }

  return {
    input: {
      profile: analysis.section.profile,
      business: business.section,
      story: story.section,
      scene: scene.section,
      composition: composition.section,
      photography: photography.section,
      knowledge: knowledge.package,
      marketplace: pipelineInput.marketplace,
      brand: pipelineInput.brand,
    } satisfies BlueprintAssemblyInput,
    context,
  };
}

export function runBlueprintAssemblyStageFromPipeline(
  context: BlueprintAssemblyContext = {},
): BlueprintAssemblyReport {
  const chain = buildFullAssemblyInputFromPipeline(context);
  if ("error" in chain) {
    return {
      valid: false,
      violations: [
        violation(
          chain.error === "MISSING_PROFILE" ? "MISSING_PROFILE" : "MISSING_COMPOSITION",
          "Upstream pipeline stages must complete before Blueprint Assembly",
        ),
      ],
      stagesCompleted: [],
      durationMs: 0,
    };
  }
  return runBlueprintAssemblyStage(chain.input, chain.context);
}

export function validateBlueprintAssembly(
  context: BlueprintAssemblyContext = {},
): BlueprintAssemblySystemReport {
  const violations: BlueprintAssemblyViolation[] = [];

  const kitchen = runBlueprintAssemblyStageFromPipeline(context);
  if (!kitchen.valid || !kitchen.section) {
    violations.push(...kitchen.violations);
  } else {
    if (!kitchen.section.blueprint.story.narrative) {
      violations.push(violation("INCOMPLETE_BLUEPRINT", "Kitchen assembly must include story narrative"));
    }
    if (kitchen.section.constraintSet.constraints.length < 3) {
      violations.push(violation("MISSING_CONSTRAINT_SET", "Kitchen assembly must merge constraints"));
    }
    if (!kitchen.section.snapshot.id) {
      violations.push(violation("MISSING_SNAPSHOT", "Kitchen assembly must create snapshot"));
    }
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
  const gardenStory = runVisualStoryPlanningStage({
    profile: gardenAnalysis.section!.profile,
    business: gardenBusiness.section!,
    knowledge: gardenKnowledge.package!,
    marketplace: "wildberries",
  });
  const gardenScene = runScenePlanningStage({
    profile: gardenAnalysis.section!.profile,
    business: gardenBusiness.section!,
    story: gardenStory.section!.plannedBlueprint,
    knowledge: gardenKnowledge.package!,
    marketplace: "wildberries",
  });
  const gardenComposition = runCompositionPlanningStage({
    profile: gardenAnalysis.section!.profile,
    business: gardenBusiness.section!,
    story: gardenStory.section!.plannedBlueprint,
    scene: gardenScene.section!.plannedBlueprint,
    knowledge: gardenKnowledge.package!,
    marketplace: "wildberries",
  });
  const gardenPhotography = runPhotographyPlanningStage({
    profile: gardenAnalysis.section!.profile,
    story: gardenStory.section!.plannedBlueprint,
    scene: gardenScene.section!.plannedBlueprint,
    composition: gardenComposition.section!.plannedBlueprint,
    knowledge: gardenKnowledge.package!,
    marketplace: "wildberries",
  });
  const garden = runBlueprintAssemblyStage({
    profile: gardenAnalysis.section!.profile,
    business: gardenBusiness.section!,
    story: gardenStory.section!,
    scene: gardenScene.section!,
    composition: gardenComposition.section!,
    photography: gardenPhotography.section!,
    knowledge: gardenKnowledge.package!,
    marketplace: "wildberries",
  });
  if (!garden.valid || !garden.section) {
    violations.push(...garden.violations);
  } else {
    if (garden.section.status !== AssemblyStatus.CONSISTENT) {
      violations.push(violation("INCOMPLETE_BLUEPRINT", "Garden assembly should be consistent"));
    }
    if (Object.keys(garden.section.agentAuthorship).length < 4) {
      violations.push(violation("AGENT_AUTHORSHIP_LOST", "Garden assembly must preserve agent authorship"));
    }
  }

  const conflictInput = buildFullAssemblyInputFromPipeline();
  if (!("error" in conflictInput)) {
    const conflicted = runBlueprintAssemblyStage(conflictInput.input, { injectLuxuryIndustrialConflict: true });
    if (!conflicted.section || conflicted.section.conflicts.length === 0) {
      violations.push(violation("INCOMPLETE_BLUEPRINT", "Injected conflict must be detected"));
    } else if (conflicted.section.status !== AssemblyStatus.INCONSISTENT) {
      violations.push(violation("INCOMPLETE_BLUEPRINT", "Conflicted blueprint must be inconsistent"));
    }
  }

  const missing = runBlueprintAssemblyStageFromPipeline({ missingPhotography: true });
  if (missing.valid) {
    violations.push(violation("MISSING_PHOTOGRAPHY", "Missing photography section must fail assembly"));
  }

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    allSectionsMerged: !!garden.section?.blueprint.composition && !!garden.section?.blueprint.photography,
    authorshipPreserved: !!garden.section && Object.keys(garden.section.agentAuthorship).length >= 4,
    constraintSetReady: !!garden.section && garden.section.constraintSet.constraints.length > 0,
    snapshotCreated: !!garden.section?.snapshot.id,
    downstreamReady: !!garden.section?.blueprint.meta.id,
  };
}

export function assertBlueprintAssembly(
  context: BlueprintAssemblyContext = {},
): BlueprintAssemblySystemReport {
  const report = validateBlueprintAssembly(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Blueprint Assembly validation failed: ${messages}`);
  }
  return report;
}

export function runBlueprintAssembly(
  context: BlueprintAssemblyContext = {},
): BlueprintAssemblySystemReport {
  return validateBlueprintAssembly(context);
}

export function isBlueprintAssemblyFailure(code: string): code is BlueprintAssemblyFailureCode {
  const codes: BlueprintAssemblyFailureCode[] = [
    "MISSING_PROFILE",
    "MISSING_BUSINESS_MODEL",
    "MISSING_STORY",
    "MISSING_SCENE",
    "MISSING_COMPOSITION",
    "MISSING_PHOTOGRAPHY",
    "INCOMPLETE_BLUEPRINT",
    "DAMAGED_SECTION",
    "DEPENDENCY_VIOLATION",
    "MISSING_CONSTRAINT_SET",
    "MISSING_SNAPSHOT",
    "DESIGN_DECISION_ALTERED",
    "AGENT_AUTHORSHIP_LOST",
  ];
  return codes.includes(code as BlueprintAssemblyFailureCode);
}
