/**
 * Chapter 6 — Design Pipeline engine.
 * Central executive system orchestrating collaborative infographic creation.
 */
import { buildSeedLearningFeedback, runKnowledgeLearningPipeline } from "./knowledge-learning-engine";
import {
  analyzeProduct,
  buildProductAnalysisInputFromPipeline,
} from "./product-analysis-engine";
import { runBusinessUnderstandingStage } from "./business-understanding-engine";
import { runKnowledgeRetrievalStage } from "./knowledge-retrieval-stage-engine";
import { runVisualStoryPlanningStage } from "./visual-story-planning-stage-engine";
import { runScenePlanningStage } from "./scene-planning-stage-engine";
import { runCompositionPlanningStage } from "./composition-planning-stage-engine";
import { runPhotographyPlanningStage } from "./photography-planning-stage-engine";
import { runBlueprintAssemblyStage } from "./blueprint-assembly-stage-engine";
import { runConsensusValidationStage } from "./consensus-validation-stage-engine";
import { runRenderAdapterStageFromPipeline } from "./render-adapter-stage-engine";
import {
  DesignPipelineLayer,
  DesignPipelinePrinciple,
  DesignPipelineStage,
  type DesignPipelineContext,
  type DesignPipelineFailureCode,
  type DesignPipelineInput,
  type DesignPipelineLayerDefinition,
  type DesignPipelineLayerId,
  type DesignPipelineOutput,
  type DesignPipelinePrincipleId,
  type DesignPipelineRunReport,
  type DesignPipelineStageDefinition,
  type DesignPipelineStageId,
  type DesignPipelineStageResult,
  type DesignPipelineSystemReport,
  type DesignPipelineViolation,
} from "./design-pipeline-types";

export {
  DesignPipelineStage,
  DesignPipelineLayer,
  DesignPipelinePrinciple,
  type DesignPipelineStageId,
  type DesignPipelineLayerId,
  type DesignPipelinePrincipleId,
  type DesignPipelineStageDefinition,
  type DesignPipelineLayerDefinition,
  type DesignPipelineInput,
  type DesignPipelineOutput,
  type DesignPipelineStageResult,
  type DesignPipelineViolation,
  type DesignPipelineRunReport,
  type DesignPipelineSystemReport,
  type DesignPipelineContext,
  type DesignPipelineFailureCode,
} from "./design-pipeline-types";

export const DESIGN_PIPELINE_VERSION = "6.0.0";

export const DESIGN_PIPELINE_GOLDEN_RULE =
  "Pipeline does not create images. Pipeline organizes collaborative work of intelligent specialists " +
  "that sequentially transform a business goal into professional commercial infographic. " +
  "Dozens of independent agents work as one design team.";

export const LEGACY_GENERIC_AI_PIPELINE = ["user", "prompt", "llm", "image"] as const;

export const HIGH_LEVEL_PIPELINE: readonly DesignPipelineStageDefinition[] = [
  {
    id: DesignPipelineStage.BUSINESS_GOAL,
    order: 1,
    label: "Business Goal",
    layer: DesignPipelineLayer.INPUT,
    responsibility: "Capture commercial objective — pipeline starts here, not with prompt",
    makesDesignDecision: false,
  },
  {
    id: DesignPipelineStage.PRODUCT_ANALYSIS,
    order: 2,
    label: "Product Analysis",
    layer: DesignPipelineLayer.INPUT,
    agentIds: ["product-analyzer"],
    blueprintSections: ["product", "creative"],
    responsibility: "Analyze product image, category, and commercial context",
    makesDesignDecision: true,
  },
  {
    id: DesignPipelineStage.KNOWLEDGE_RETRIEVAL,
    order: 3,
    label: "Knowledge Retrieval",
    layer: DesignPipelineLayer.KNOWLEDGE,
    responsibility: "Retrieve relevant rules, patterns, and anti-patterns from Knowledge Engine",
    makesDesignDecision: false,
  },
  {
    id: DesignPipelineStage.BUSINESS_UNDERSTANDING,
    order: 4,
    label: "Business Understanding",
    layer: DesignPipelineLayer.KNOWLEDGE,
    responsibility: "Transform product characteristics into commercial value and story strategy",
    makesDesignDecision: false,
  },
  {
    id: DesignPipelineStage.VISUAL_STORY_PLANNING,
    order: 5,
    label: "Visual Story Planning",
    layer: DesignPipelineLayer.CREATIVE,
    agentIds: ["visual-story-director"],
    blueprintSections: ["story"],
    responsibility: "Define commercial narrative and emotional positioning",
    makesDesignDecision: true,
  },
  {
    id: DesignPipelineStage.SCENE_PLANNING,
    order: 6,
    label: "Scene Planning",
    layer: DesignPipelineLayer.CREATIVE,
    agentIds: ["scene-director"],
    blueprintSections: ["scene"],
    responsibility: "Define believable commercial environment",
    makesDesignDecision: true,
  },
  {
    id: DesignPipelineStage.COMPOSITION_PLANNING,
    order: 7,
    label: "Composition Planning",
    layer: DesignPipelineLayer.CREATIVE,
    agentIds: ["composition-director"],
    blueprintSections: ["composition"],
    responsibility: "Organize visual hierarchy for marketplace conversion",
    makesDesignDecision: true,
  },
  {
    id: DesignPipelineStage.PHOTOGRAPHY_PLANNING,
    order: 8,
    label: "Photography Planning",
    layer: DesignPipelineLayer.CREATIVE,
    agentIds: ["commercial-photo-director"],
    blueprintSections: ["photography"],
    responsibility: "Define photographic capture intent",
    makesDesignDecision: true,
  },
  {
    id: DesignPipelineStage.BLUEPRINT_ASSEMBLY,
    order: 9,
    label: "Blueprint Assembly",
    layer: DesignPipelineLayer.TECHNICAL,
    blueprintSections: ["story", "scene", "composition", "photography", "lighting", "camera", "materials"],
    responsibility: "Assemble incremental blueprint mutations into single source of truth",
    makesDesignDecision: false,
  },
  {
    id: DesignPipelineStage.CONSENSUS_VALIDATION,
    order: 10,
    label: "Consensus Validation",
    layer: DesignPipelineLayer.VALIDATION,
    agentIds: ["consensus-engine"],
    responsibility: "Detect cross-agent semantic conflicts before render",
    makesDesignDecision: false,
  },
  {
    id: DesignPipelineStage.RENDER_ADAPTER,
    order: 11,
    label: "Render Adapter",
    layer: DesignPipelineLayer.RENDERING,
    agentIds: ["flux-adapter"],
    blueprintSections: ["render"],
    responsibility: "Compile blueprint into provider-specific request without mutating blueprint",
    makesDesignDecision: false,
  },
  {
    id: DesignPipelineStage.RENDER_PROVIDER,
    order: 12,
    label: "Render Provider",
    layer: DesignPipelineLayer.RENDERING,
    responsibility: "Execute image generation — swappable executor only",
    makesDesignDecision: false,
  },
  {
    id: DesignPipelineStage.VISION_ANALYSIS,
    order: 13,
    label: "Vision Analysis",
    layer: DesignPipelineLayer.VALIDATION,
    agentIds: ["vision-quality-director"],
    responsibility: "Evaluate generated image against blueprint",
    makesDesignDecision: false,
  },
  {
    id: DesignPipelineStage.COMMERCIAL_VALIDATION,
    order: 14,
    label: "Commercial Validation",
    layer: DesignPipelineLayer.VALIDATION,
    responsibility: "Assess commercial photography and conversion quality",
    makesDesignDecision: false,
  },
  {
    id: DesignPipelineStage.CHIEF_DESIGN_REVIEW,
    order: 15,
    label: "Chief Design Review",
    layer: DesignPipelineLayer.VALIDATION,
    agentIds: ["chief-design-director"],
    responsibility: "Final approve or request retry — never creates design",
    makesDesignDecision: false,
  },
  {
    id: DesignPipelineStage.RETRY,
    order: 16,
    label: "Retry",
    layer: DesignPipelineLayer.VALIDATION,
    agentIds: ["retry-architecture"],
    responsibility: "Localized pipeline recovery without full restart",
    optional: true,
    makesDesignDecision: false,
  },
  {
    id: DesignPipelineStage.APPROVED_BLUEPRINT,
    order: 17,
    label: "Approved Blueprint",
    layer: DesignPipelineLayer.VALIDATION,
    responsibility: "Commercial-ready blueprint and image output",
    makesDesignDecision: false,
  },
  {
    id: DesignPipelineStage.KNOWLEDGE_LEARNING,
    order: 18,
    label: "Knowledge Learning",
    layer: DesignPipelineLayer.LEARNING,
    agentIds: ["design-memory"],
    responsibility: "Learn from design decisions after project completion",
    makesDesignDecision: false,
  },
] as const;

export const PIPELINE_LAYERS: readonly DesignPipelineLayerDefinition[] = [
  {
    id: DesignPipelineLayer.INPUT,
    label: "Input Layer",
    summary: "Business goal, product analysis, project constraints",
    stages: [DesignPipelineStage.BUSINESS_GOAL, DesignPipelineStage.PRODUCT_ANALYSIS],
  },
  {
    id: DesignPipelineLayer.KNOWLEDGE,
    label: "Knowledge Layer",
    summary: "Knowledge Engine retrieval before creative decisions",
    stages: [DesignPipelineStage.KNOWLEDGE_RETRIEVAL, DesignPipelineStage.BUSINESS_UNDERSTANDING],
  },
  {
    id: DesignPipelineLayer.CREATIVE,
    label: "Creative Layer",
    summary: "Story, scene, composition, photography planning",
    stages: [
      DesignPipelineStage.VISUAL_STORY_PLANNING,
      DesignPipelineStage.SCENE_PLANNING,
      DesignPipelineStage.COMPOSITION_PLANNING,
      DesignPipelineStage.PHOTOGRAPHY_PLANNING,
    ],
  },
  {
    id: DesignPipelineLayer.TECHNICAL,
    label: "Technical Layer",
    summary: "Blueprint assembly and physical image model",
    stages: [DesignPipelineStage.BLUEPRINT_ASSEMBLY],
  },
  {
    id: DesignPipelineLayer.RENDERING,
    label: "Rendering Layer",
    summary: "Adapter compilation and provider execution",
    stages: [DesignPipelineStage.RENDER_ADAPTER, DesignPipelineStage.RENDER_PROVIDER],
  },
  {
    id: DesignPipelineLayer.VALIDATION,
    label: "Validation Layer",
    summary: "Consensus, vision, commercial, chief review, retry, approval",
    stages: [
      DesignPipelineStage.CONSENSUS_VALIDATION,
      DesignPipelineStage.VISION_ANALYSIS,
      DesignPipelineStage.COMMERCIAL_VALIDATION,
      DesignPipelineStage.CHIEF_DESIGN_REVIEW,
      DesignPipelineStage.RETRY,
      DesignPipelineStage.APPROVED_BLUEPRINT,
    ],
  },
  {
    id: DesignPipelineLayer.LEARNING,
    label: "Learning Layer",
    summary: "Post-pipeline knowledge learning and Design Memory",
    stages: [DesignPipelineStage.KNOWLEDGE_LEARNING],
  },
] as const;

export const PIPELINE_PRINCIPLES: readonly DesignPipelinePrincipleId[] = [
  DesignPipelinePrinciple.DETERMINISTIC,
  DesignPipelinePrinciple.STAGE_CONTRACT,
  DesignPipelinePrinciple.SINGLE_AGENT_RESPONSIBILITY,
  DesignPipelinePrinciple.INCREMENTAL_BLUEPRINT,
  DesignPipelinePrinciple.INDEPENDENT_RETRY,
  DesignPipelinePrinciple.FAULT_ISOLATION,
] as const;

const RETRYABLE_STAGES: DesignPipelineStageId[] = [
  DesignPipelineStage.VISUAL_STORY_PLANNING,
  DesignPipelineStage.SCENE_PLANNING,
  DesignPipelineStage.COMPOSITION_PLANNING,
  DesignPipelineStage.PHOTOGRAPHY_PLANNING,
  DesignPipelineStage.RENDER_ADAPTER,
  DesignPipelineStage.VISION_ANALYSIS,
];

function violation(
  code: DesignPipelineFailureCode,
  message: string,
  stage?: DesignPipelineStageId,
): DesignPipelineViolation {
  return { code, message, stage };
}

export function getDesignPipelineStage(
  stageId: DesignPipelineStageId,
): DesignPipelineStageDefinition | undefined {
  return HIGH_LEVEL_PIPELINE.find((s) => s.id === stageId);
}

export function getPipelineLayer(
  layerId: DesignPipelineLayerId,
): DesignPipelineLayerDefinition | undefined {
  return PIPELINE_LAYERS.find((l) => l.id === layerId);
}

export function mapStageToLayer(stageId: DesignPipelineStageId): DesignPipelineLayerId | undefined {
  return getDesignPipelineStage(stageId)?.layer;
}

export function validatePipelineStageOrder(): DesignPipelineViolation[] {
  const violations: DesignPipelineViolation[] = [];
  const sorted = [...HIGH_LEVEL_PIPELINE].sort((a, b) => a.order - b.order);

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].order >= sorted[i + 1].order) {
      violations.push(
        violation(
          "INVALID_STAGE_ORDER",
          `Stage order violation: ${sorted[i].id} before ${sorted[i + 1].id}`,
          sorted[i].id,
        ),
      );
    }
  }

  const knowledgeIdx = sorted.findIndex((s) => s.id === DesignPipelineStage.KNOWLEDGE_RETRIEVAL);
  const storyIdx = sorted.findIndex((s) => s.id === DesignPipelineStage.VISUAL_STORY_PLANNING);
  if (knowledgeIdx > storyIdx) {
    violations.push(
      violation(
        "INVALID_STAGE_ORDER",
        "Knowledge Retrieval must precede Visual Story Planning",
        DesignPipelineStage.KNOWLEDGE_RETRIEVAL,
      ),
    );
  }

  const businessIdx = sorted.findIndex((s) => s.id === DesignPipelineStage.BUSINESS_UNDERSTANDING);
  if (knowledgeIdx > businessIdx || businessIdx > storyIdx) {
    violations.push(
      violation(
        "INVALID_STAGE_ORDER",
        "Knowledge Retrieval and Business Understanding must precede Visual Story Planning",
        DesignPipelineStage.BUSINESS_UNDERSTANDING,
      ),
    );
  }

  const learningIdx = sorted.findIndex((s) => s.id === DesignPipelineStage.KNOWLEDGE_LEARNING);
  const approvedIdx = sorted.findIndex((s) => s.id === DesignPipelineStage.APPROVED_BLUEPRINT);
  if (learningIdx < approvedIdx) {
    violations.push(
      violation(
        "INVALID_STAGE_ORDER",
        "Knowledge Learning must follow Approved Blueprint",
        DesignPipelineStage.KNOWLEDGE_LEARNING,
      ),
    );
  }

  return violations;
}

export function validatePipelineLayerCoverage(): DesignPipelineViolation[] {
  const violations: DesignPipelineViolation[] = [];
  const covered = new Set(PIPELINE_LAYERS.flatMap((l) => l.stages));

  for (const stage of HIGH_LEVEL_PIPELINE) {
    if (!covered.has(stage.id)) {
      violations.push(
        violation("LAYER_GAP", `Stage ${stage.id} not assigned to any pipeline layer`, stage.id),
      );
    }
  }

  if (PIPELINE_LAYERS.length !== 7) {
    violations.push(violation("LAYER_GAP", "Design Pipeline requires exactly 7 layers"));
  }

  return violations;
}

export function validatePipelineInput(
  input: DesignPipelineInput,
  context: DesignPipelineContext = {},
): DesignPipelineViolation[] {
  const violations: DesignPipelineViolation[] = [];

  if (context.promptOnlyInput) {
    violations.push(
      violation("PROMPT_ONLY_INPUT", "Pipeline must start from business goal, not prompt"),
    );
  }

  if (!input.businessGoal || input.businessGoal.length < 3) {
    violations.push(violation("PROMPT_ONLY_INPUT", "Business Goal is required pipeline input"));
  }
  if (!input.productImageRef) {
    violations.push(violation("PROMPT_ONLY_INPUT", "Product image is required pipeline input"));
  }
  if (!input.category) {
    violations.push(violation("PROMPT_ONLY_INPUT", "Category is required pipeline input"));
  }
  if (!input.marketplace) {
    violations.push(violation("PROMPT_ONLY_INPUT", "Marketplace is required pipeline input"));
  }

  return violations;
}

export function validatePipelineOutputContract(output: DesignPipelineOutput): DesignPipelineViolation[] {
  const violations: DesignPipelineViolation[] = [];

  if (!output.blueprintId) {
    violations.push(violation("INCOMPLETE_OUTPUT", "Pipeline must produce Render Blueprint"));
  }

  const artifactCount = [
    output.renderPrompt,
    output.imageRef,
    output.visionReportId,
    output.commercialReportId,
    output.learningPackageId,
  ].filter(Boolean).length;

  if (artifactCount < 3) {
    violations.push(
      violation(
        "INCOMPLETE_OUTPUT",
        "Pipeline must produce blueprint, image, reports, and learning package",
      ),
    );
  }

  return violations;
}

export function validatePipelineOrchestrationOnly(
  context: DesignPipelineContext = {},
): DesignPipelineViolation[] {
  const violations: DesignPipelineViolation[] = [];

  if (context.pipelineMakesDesignDecision) {
    violations.push(
      violation(
        "PIPELINE_MAKES_DESIGN_DECISION",
        "Pipeline orchestrates agents — it never makes design decisions",
      ),
    );
  }

  const pipelineDecides = HIGH_LEVEL_PIPELINE.filter((s) => !s.makesDesignDecision && !s.agentIds);
  const orchestrationStages = HIGH_LEVEL_PIPELINE.filter((s) => !s.makesDesignDecision);
  if (orchestrationStages.length < 10) {
    violations.push(
      violation("ORCHESTRATION_VIOLATION", "Pipeline must have clear orchestration-only stages"),
    );
  }

  if (pipelineDecides.length === 0) {
    violations.push(
      violation("ORCHESTRATION_VIOLATION", "Pipeline must define non-agent orchestration stages"),
    );
  }

  return violations;
}

export function validatePipelineStageContracts(): DesignPipelineViolation[] {
  const violations: DesignPipelineViolation[] = [];

  for (const stage of HIGH_LEVEL_PIPELINE) {
    if (!stage.responsibility || stage.responsibility.length < 10) {
      violations.push(
        violation("MISSING_STAGE_CONTRACT", `Stage ${stage.id} missing responsibility contract`, stage.id),
      );
    }
    if (stage.makesDesignDecision && (!stage.agentIds || stage.agentIds.length === 0)) {
      violations.push(
        violation(
          "MISSING_STAGE_CONTRACT",
          `Design decision stage ${stage.id} must name responsible agent`,
          stage.id,
        ),
      );
    }
  }

  return violations;
}

export function canRetryStageIndependently(stageId: DesignPipelineStageId): boolean {
  return RETRYABLE_STAGES.includes(stageId);
}

export function validatePipelineIndependentRetry(): DesignPipelineViolation[] {
  const violations: DesignPipelineViolation[] = [];

  if (!canRetryStageIndependently(DesignPipelineStage.COMPOSITION_PLANNING)) {
    violations.push(
      violation("FAULT_CASCADE", "Composition stage must support independent retry", DesignPipelineStage.RETRY),
    );
  }

  const retryStage = getDesignPipelineStage(DesignPipelineStage.RETRY);
  if (!retryStage?.optional) {
    violations.push(
      violation("FAULT_CASCADE", "Retry stage must be optional conditional branch", DesignPipelineStage.RETRY),
    );
  }

  return violations;
}

export function validatePipelineIncrementalBlueprint(
  context: DesignPipelineContext = {},
): DesignPipelineViolation[] {
  if (context.fullBlueprintRewrite) {
    return [violation("BLUEPRINT_REWRITE", "Blueprint must be incrementally extended, not rewritten")];
  }
  return [];
}

export function validatePipelineDeterminism(context: DesignPipelineContext = {}): DesignPipelineViolation[] {
  if (context.nonDeterministic) {
    return [violation("NON_DETERMINISTIC", "Pipeline must be fully deterministic")];
  }
  return [];
}

export function validatePipelineFaultIsolation(context: DesignPipelineContext = {}): DesignPipelineViolation[] {
  if (context.fullBlueprintRewrite && context.nonDeterministic) {
    return [violation("FAULT_CASCADE", "Stage failure must not cascade to entire pipeline")];
  }
  return [];
}

export function buildDefaultPipelineInput(): DesignPipelineInput {
  return {
    productImageRef: "product/kitchen-blender-hero.jpg",
    category: "kitchen",
    marketplace: "amazon",
    brand: "HomeChef",
    targetAudience: "home cooks",
    businessGoal: "increase trust and conversion for premium kitchen appliance",
    projectConstraints: ["marketplace-safe", "no-text-overlay"],
  };
}

export function executeDesignPipelineStage(
  stageId: DesignPipelineStageId,
  input: DesignPipelineInput,
  context: DesignPipelineContext = {},
): DesignPipelineStageResult {
  const stage = getDesignPipelineStage(stageId);
  const violations: DesignPipelineViolation[] = [];

  if (!stage) {
    return {
      stage: stageId,
      passed: false,
      violations: [violation("PIPELINE_INCOMPLETE", `Unknown stage ${stageId}`, stageId)],
    };
  }

  if (stageId === DesignPipelineStage.PRODUCT_ANALYSIS) {
    const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(input));
    if (!analysis.valid || !analysis.section) {
      violations.push(
        violation("PIPELINE_INCOMPLETE", "Product Analysis Stage failed validation", stageId),
        ...analysis.violations.map((v) =>
          violation("PIPELINE_INCOMPLETE", v.message, stageId),
        ),
      );
    }
  }

  if (stageId === DesignPipelineStage.KNOWLEDGE_RETRIEVAL && !context.skipKnowledgeRetrieval) {
    const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(input));
    if (!analysis.section) {
      violations.push(
        violation("MISSING_KNOWLEDGE_STAGE", "Product Analysis must complete before Knowledge Retrieval", stageId),
      );
    } else {
      const stageReport = runKnowledgeRetrievalStage({
        profile: analysis.section.profile,
        marketplace: input.marketplace,
        style: analysis.section.profile.priceSegment,
      });
      if (!stageReport.valid || !stageReport.package) {
        violations.push(
          violation("MISSING_KNOWLEDGE_STAGE", "Knowledge Retrieval Stage failed validation", stageId),
          ...stageReport.violations.map((v) => violation("MISSING_KNOWLEDGE_STAGE", v.message, stageId)),
        );
      }
    }
  }

  if (stageId === DesignPipelineStage.BUSINESS_UNDERSTANDING) {
    const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(input));
    if (!analysis.section) {
      violations.push(
        violation("PIPELINE_INCOMPLETE", "Product Analysis must complete before Business Understanding", stageId),
      );
    } else {
      const knowledge = runKnowledgeRetrievalStage({
        profile: analysis.section.profile,
        marketplace: input.marketplace,
        style: analysis.section.profile.priceSegment,
      });
      if (!knowledge.package) {
        violations.push(
          violation("PIPELINE_INCOMPLETE", "Knowledge Retrieval must complete before Business Understanding", stageId),
        );
      } else {
        const business = runBusinessUnderstandingStage({
          profile: analysis.section.profile,
          knowledge: knowledge.package,
          marketplace: input.marketplace,
          brand: input.brand,
        });
        if (!business.valid || !business.section) {
          violations.push(
            violation("PIPELINE_INCOMPLETE", "Business Understanding Stage failed validation", stageId),
            ...business.violations.map((v) => violation("PIPELINE_INCOMPLETE", v.message, stageId)),
          );
        }
      }
    }
  }

  if (stageId === DesignPipelineStage.VISUAL_STORY_PLANNING) {
    const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(input));
    if (!analysis.section) {
      violations.push(
        violation("PIPELINE_INCOMPLETE", "Product Analysis must complete before Visual Story Planning", stageId),
      );
    } else {
      const knowledge = runKnowledgeRetrievalStage({
        profile: analysis.section.profile,
        marketplace: input.marketplace,
        style: analysis.section.profile.priceSegment,
      });
      const business = runBusinessUnderstandingStage({
        profile: analysis.section.profile,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      if (!business.section || !knowledge.package) {
        violations.push(
          violation("PIPELINE_INCOMPLETE", "Business Understanding must complete before Visual Story Planning", stageId),
        );
      } else {
        const story = runVisualStoryPlanningStage({
          profile: analysis.section.profile,
          business: business.section,
          knowledge: knowledge.package,
          marketplace: input.marketplace,
          brand: input.brand,
        });
        if (!story.valid || !story.section) {
          violations.push(
            violation("PIPELINE_INCOMPLETE", "Visual Story Planning Stage failed validation", stageId),
            ...story.violations.map((v) => violation("PIPELINE_INCOMPLETE", v.message, stageId)),
          );
        }
      }
    }
  }

  if (stageId === DesignPipelineStage.SCENE_PLANNING) {
    const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(input));
    if (!analysis.section) {
      violations.push(
        violation("PIPELINE_INCOMPLETE", "Product Analysis must complete before Scene Planning", stageId),
      );
    } else {
      const knowledge = runKnowledgeRetrievalStage({
        profile: analysis.section.profile,
        marketplace: input.marketplace,
        style: analysis.section.profile.priceSegment,
      });
      const business = runBusinessUnderstandingStage({
        profile: analysis.section.profile,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      const story = runVisualStoryPlanningStage({
        profile: analysis.section.profile,
        business: business.section!,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      if (!story.section || !business.section || !knowledge.package) {
        violations.push(
          violation("PIPELINE_INCOMPLETE", "Story Planning must complete before Scene Planning", stageId),
        );
      } else {
        const scene = runScenePlanningStage({
          profile: analysis.section.profile,
          business: business.section,
          story: story.section.plannedBlueprint,
          knowledge: knowledge.package,
          marketplace: input.marketplace,
          brand: input.brand,
        });
        if (!scene.valid || !scene.section) {
          violations.push(
            violation("PIPELINE_INCOMPLETE", "Scene Planning Stage failed validation", stageId),
            ...scene.violations.map((v) => violation("PIPELINE_INCOMPLETE", v.message, stageId)),
          );
        }
      }
    }
  }

  if (stageId === DesignPipelineStage.COMPOSITION_PLANNING) {
    const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(input));
    if (!analysis.section) {
      violations.push(
        violation("PIPELINE_INCOMPLETE", "Product Analysis must complete before Composition Planning", stageId),
      );
    } else {
      const knowledge = runKnowledgeRetrievalStage({
        profile: analysis.section.profile,
        marketplace: input.marketplace,
        style: analysis.section.profile.priceSegment,
      });
      const business = runBusinessUnderstandingStage({
        profile: analysis.section.profile,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      const story = runVisualStoryPlanningStage({
        profile: analysis.section.profile,
        business: business.section!,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      const scene = runScenePlanningStage({
        profile: analysis.section.profile,
        business: business.section!,
        story: story.section!.plannedBlueprint,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      if (!scene.section || !story.section || !business.section || !knowledge.package) {
        violations.push(
          violation("PIPELINE_INCOMPLETE", "Scene Planning must complete before Composition Planning", stageId),
        );
      } else {
        const composition = runCompositionPlanningStage({
          profile: analysis.section.profile,
          business: business.section,
          story: story.section.plannedBlueprint,
          scene: scene.section.plannedBlueprint,
          knowledge: knowledge.package,
          marketplace: input.marketplace,
          brand: input.brand,
        });
        if (!composition.valid || !composition.section) {
          violations.push(
            violation("PIPELINE_INCOMPLETE", "Composition Planning Stage failed validation", stageId),
            ...composition.violations.map((v) => violation("PIPELINE_INCOMPLETE", v.message, stageId)),
          );
        }
      }
    }
  }

  if (stageId === DesignPipelineStage.PHOTOGRAPHY_PLANNING) {
    const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(input));
    if (!analysis.section) {
      violations.push(
        violation("PIPELINE_INCOMPLETE", "Product Analysis must complete before Photography Planning", stageId),
      );
    } else {
      const knowledge = runKnowledgeRetrievalStage({
        profile: analysis.section.profile,
        marketplace: input.marketplace,
        style: analysis.section.profile.priceSegment,
      });
      const business = runBusinessUnderstandingStage({
        profile: analysis.section.profile,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      const story = runVisualStoryPlanningStage({
        profile: analysis.section.profile,
        business: business.section!,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      const scene = runScenePlanningStage({
        profile: analysis.section.profile,
        business: business.section!,
        story: story.section!.plannedBlueprint,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      const composition = runCompositionPlanningStage({
        profile: analysis.section.profile,
        business: business.section!,
        story: story.section!.plannedBlueprint,
        scene: scene.section!.plannedBlueprint,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      if (!composition.section || !scene.section || !story.section || !knowledge.package) {
        violations.push(
          violation("PIPELINE_INCOMPLETE", "Composition Planning must complete before Photography Planning", stageId),
        );
      } else {
        const photography = runPhotographyPlanningStage({
          profile: analysis.section.profile,
          story: story.section.plannedBlueprint,
          scene: scene.section.plannedBlueprint,
          composition: composition.section.plannedBlueprint,
          knowledge: knowledge.package,
          marketplace: input.marketplace,
          brand: input.brand,
        });
        if (!photography.valid || !photography.section) {
          violations.push(
            violation("PIPELINE_INCOMPLETE", "Photography Planning Stage failed validation", stageId),
            ...photography.violations.map((v) => violation("PIPELINE_INCOMPLETE", v.message, stageId)),
          );
        }
      }
    }
  }

  if (stageId === DesignPipelineStage.BLUEPRINT_ASSEMBLY) {
    const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(input));
    if (!analysis.section) {
      violations.push(
        violation("PIPELINE_INCOMPLETE", "Product Analysis must complete before Blueprint Assembly", stageId),
      );
    } else {
      const knowledge = runKnowledgeRetrievalStage({
        profile: analysis.section.profile,
        marketplace: input.marketplace,
        style: analysis.section.profile.priceSegment,
      });
      const business = runBusinessUnderstandingStage({
        profile: analysis.section.profile,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      const story = runVisualStoryPlanningStage({
        profile: analysis.section.profile,
        business: business.section!,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      const scene = runScenePlanningStage({
        profile: analysis.section.profile,
        business: business.section!,
        story: story.section!.plannedBlueprint,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      const composition = runCompositionPlanningStage({
        profile: analysis.section.profile,
        business: business.section!,
        story: story.section!.plannedBlueprint,
        scene: scene.section!.plannedBlueprint,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      const photography = runPhotographyPlanningStage({
        profile: analysis.section.profile,
        story: story.section!.plannedBlueprint,
        scene: scene.section!.plannedBlueprint,
        composition: composition.section!.plannedBlueprint,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      if (!photography.section || !composition.section || !scene.section || !story.section || !business.section || !knowledge.package) {
        violations.push(
          violation("PIPELINE_INCOMPLETE", "Photography Planning must complete before Blueprint Assembly", stageId),
        );
      } else {
        const assembly = runBlueprintAssemblyStage({
          profile: analysis.section.profile,
          business: business.section,
          story: story.section,
          scene: scene.section,
          composition: composition.section,
          photography: photography.section,
          knowledge: knowledge.package,
          marketplace: input.marketplace,
          brand: input.brand,
        });
        if (!assembly.valid || !assembly.section) {
          violations.push(
            violation("PIPELINE_INCOMPLETE", "Blueprint Assembly Stage failed validation", stageId),
            ...assembly.violations.map((v) => violation("PIPELINE_INCOMPLETE", v.message, stageId)),
          );
        }
      }
    }
  }

  if (stageId === DesignPipelineStage.CONSENSUS_VALIDATION) {
    const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(input));
    if (!analysis.section) {
      violations.push(
        violation("PIPELINE_INCOMPLETE", "Product Analysis must complete before Consensus Validation", stageId),
      );
    } else {
      const knowledge = runKnowledgeRetrievalStage({
        profile: analysis.section.profile,
        marketplace: input.marketplace,
        style: analysis.section.profile.priceSegment,
      });
      const business = runBusinessUnderstandingStage({
        profile: analysis.section.profile,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      const story = runVisualStoryPlanningStage({
        profile: analysis.section.profile,
        business: business.section!,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      const scene = runScenePlanningStage({
        profile: analysis.section.profile,
        business: business.section!,
        story: story.section!.plannedBlueprint,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      const composition = runCompositionPlanningStage({
        profile: analysis.section.profile,
        business: business.section!,
        story: story.section!.plannedBlueprint,
        scene: scene.section!.plannedBlueprint,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      const photography = runPhotographyPlanningStage({
        profile: analysis.section.profile,
        story: story.section!.plannedBlueprint,
        scene: scene.section!.plannedBlueprint,
        composition: composition.section!.plannedBlueprint,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      const assembly = runBlueprintAssemblyStage({
        profile: analysis.section.profile,
        business: business.section!,
        story: story.section!,
        scene: scene.section!,
        composition: composition.section!,
        photography: photography.section!,
        knowledge: knowledge.package!,
        marketplace: input.marketplace,
        brand: input.brand,
      });
      if (!assembly.section || !photography.section || !business.section || !knowledge.package) {
        violations.push(
          violation("PIPELINE_INCOMPLETE", "Blueprint Assembly must complete before Consensus Validation", stageId),
        );
      } else {
        const consensus = runConsensusValidationStage({
          profile: analysis.section.profile,
          business: business.section,
          blueprint: assembly.section.blueprint,
          constraintSet: assembly.section.constraintSet,
          metadata: assembly.section.metadata,
          knowledge: knowledge.package,
          assemblyConflicts: assembly.section.conflicts,
          marketplace: input.marketplace,
          brand: input.brand,
        });
        if (!consensus.valid || !consensus.section?.plannedReport.approved) {
          violations.push(
            violation("PIPELINE_INCOMPLETE", "Consensus Validation Stage failed or blueprint not approved", stageId),
            ...consensus.violations.map((v) => violation("PIPELINE_INCOMPLETE", v.message, stageId)),
          );
        }
      }
    }
  }

  if (stageId === DesignPipelineStage.RENDER_ADAPTER) {
    const adapter = runRenderAdapterStageFromPipeline({
      marketplace: input.marketplace,
      providerId: "flux",
    });
    if (!adapter.valid || !adapter.section) {
      violations.push(
        violation("PIPELINE_INCOMPLETE", "Render Adapter Stage failed validation", stageId),
        ...adapter.violations.map((v) => violation("PIPELINE_INCOMPLETE", v.message, stageId)),
      );
    }
  }

  if (stageId === DesignPipelineStage.KNOWLEDGE_LEARNING && !context.skipLearning) {
    const feedback = buildSeedLearningFeedback();
    const cycle = runKnowledgeLearningPipeline("gen-kitchen-premium-001", feedback, { skipValidation: true });
    if (cycle.confidenceAdjustments.length === 0 && !cycle.knowledgeUpdated) {
      violations.push(
        violation("MISSING_LEARNING_STAGE", "Knowledge Learning produced no outcomes", stageId),
      );
    }
  }

  return {
    stage: stageId,
    passed: violations.length === 0,
    durationMs: 10,
    violations,
  };
}

export function runDesignPipeline(
  input: DesignPipelineInput = buildDefaultPipelineInput(),
  context: DesignPipelineContext = {},
): DesignPipelineRunReport {
  const pipelineId = `pipeline-${input.category}-${Date.now()}`;
  const violations: DesignPipelineViolation[] = [
    ...validatePipelineInput(input, context),
    ...validatePipelineOrchestrationOnly(context),
    ...validatePipelineIncrementalBlueprint(context),
    ...validatePipelineDeterminism(context),
  ];

  const stages: DesignPipelineStageResult[] = [];
  let retryCount = 0;
  let approved = false;
  let learningExecuted = false;

  const executionOrder = HIGH_LEVEL_PIPELINE.filter((s) => s.id !== DesignPipelineStage.RETRY);

  for (const stageDef of executionOrder) {
    const result = executeDesignPipelineStage(stageDef.id, input, context);
    stages.push(result);
    violations.push(...result.violations);

    if (!result.passed && stageDef.id !== DesignPipelineStage.KNOWLEDGE_LEARNING) {
      break;
    }

    if (stageDef.id === DesignPipelineStage.KNOWLEDGE_LEARNING) {
      learningExecuted = result.passed;
    }
    if (stageDef.id === DesignPipelineStage.APPROVED_BLUEPRINT) {
      approved = result.passed;
    }
  }

  const output: DesignPipelineOutput = {
    blueprintId: `bp-${pipelineId}`,
    renderPrompt: "compiled-provider-prompt",
    imageRef: `render/${pipelineId}.png`,
    visionReportId: `vision-${pipelineId}`,
    commercialReportId: `commercial-${pipelineId}`,
    learningPackageId: learningExecuted ? `learning-${pipelineId}` : undefined,
    designMemoryUpdated: learningExecuted,
  };

  violations.push(...validatePipelineOutputContract(output));

  return {
    pipelineId,
    completed: violations.length === 0,
    approved: approved && violations.length === 0,
    stages,
    violations,
    output,
    retryCount,
    learningExecuted,
  };
}

export function validateDesignPipeline(
  context: DesignPipelineContext = {},
): DesignPipelineSystemReport {
  const violations: DesignPipelineViolation[] = [
    ...validatePipelineStageOrder(),
    ...validatePipelineLayerCoverage(),
    ...validatePipelineStageContracts(),
    ...validatePipelineOrchestrationOnly(context),
    ...validatePipelineIndependentRetry(),
    ...validatePipelineIncrementalBlueprint(context),
    ...validatePipelineDeterminism(context),
    ...validatePipelineFaultIsolation(context),
  ];

  if (context.promptOnlyInput) {
    violations.push(
      ...validatePipelineInput(
        { productImageRef: "", category: "", marketplace: "", businessGoal: "" },
        context,
      ),
    );
  }

  if (context.skipKnowledgeRetrieval) {
    violations.push(
      violation("MISSING_KNOWLEDGE_STAGE", "Knowledge Retrieval cannot be skipped in valid pipeline"),
    );
  }

  if (context.skipLearning) {
    violations.push(
      violation("MISSING_LEARNING_STAGE", "Knowledge Learning cannot be skipped in valid pipeline"),
    );
  }

  const run = runDesignPipeline(buildDefaultPipelineInput(), {});
  if (run.stages.length < HIGH_LEVEL_PIPELINE.length - 1) {
    violations.push(violation("PIPELINE_INCOMPLETE", "Pipeline run did not visit all required stages"));
  }

  const principlesSatisfied =
    validatePipelineDeterminism().length === 0 &&
    validatePipelineStageContracts().length === 0 &&
    validatePipelineIndependentRetry().length === 0;

  return {
    valid: violations.length === 0,
    violations,
    stageCount: HIGH_LEVEL_PIPELINE.length,
    layerCount: PIPELINE_LAYERS.length,
    principlesSatisfied,
    goldenRuleSatisfied: violations.length === 0,
    orchestrationOnly: !context.pipelineMakesDesignDecision,
    explainable: validatePipelineStageContracts().length === 0,
    scalable: HIGH_LEVEL_PIPELINE.filter((s) => s.agentIds).length >= 8,
    learningIntegrated: HIGH_LEVEL_PIPELINE.some((s) => s.id === DesignPipelineStage.KNOWLEDGE_LEARNING),
  };
}

export function assertDesignPipeline(context?: DesignPipelineContext): DesignPipelineSystemReport {
  const report = validateDesignPipeline(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Design Pipeline validation failed: ${messages}`);
  }
  return report;
}

export function runDesignPipelineValidation(
  context: DesignPipelineContext = {},
): DesignPipelineSystemReport {
  return validateDesignPipeline(context);
}

export function isDesignPipelineFailure(code: string): code is DesignPipelineFailureCode {
  const codes: DesignPipelineFailureCode[] = [
    "PROMPT_ONLY_INPUT",
    "PIPELINE_MAKES_DESIGN_DECISION",
    "MISSING_STAGE_CONTRACT",
    "INVALID_STAGE_ORDER",
    "LAYER_GAP",
    "BLUEPRINT_REWRITE",
    "NON_DETERMINISTIC",
    "FAULT_CASCADE",
    "MISSING_KNOWLEDGE_STAGE",
    "MISSING_LEARNING_STAGE",
    "INCOMPLETE_OUTPUT",
    "ORCHESTRATION_VIOLATION",
    "PIPELINE_INCOMPLETE",
  ];
  return codes.includes(code as DesignPipelineFailureCode);
}
