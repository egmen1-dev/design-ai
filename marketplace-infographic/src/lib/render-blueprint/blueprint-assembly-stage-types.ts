/**
 * Chapter 6.10 — Blueprint Assembly Stage types
 * Distinct from Ch 3 RenderBlueprint assembly via MutationEngine and Ch 3.8 SnapshotManager.
 */
import type { BusinessUnderstandingSection } from "./business-understanding-types";
import type { CompositionPlanningSection } from "./composition-planning-stage-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { PhotographyPlanningSection } from "./photography-planning-stage-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";
import type { ScenePlanningSection } from "./scene-planning-stage-types";
import type { ConstraintSet } from "./constraint-types";
import type { RenderBlueprint } from "./types";
import type { VisualStoryPlanningSection } from "./visual-story-planning-stage-types";

export const BlueprintAssemblyStage = {
  INPUT_ASSEMBLY: "input_assembly",
  BLUEPRINT_INTEGRITY: "blueprint_integrity",
  SECTION_MERGE: "section_merge",
  CROSS_MODULE_CONSISTENCY: "cross_module_consistency",
  DEPENDENCY_VALIDATION: "dependency_validation",
  CONSTRAINT_MERGE: "constraint_merge",
  METADATA_GENERATION: "metadata_generation",
  NORMALIZATION: "normalization",
  CONFLICT_PREPARATION: "conflict_preparation",
  UNIFIED_BLUEPRINT: "unified_blueprint",
  SNAPSHOT_CREATION: "snapshot_creation",
  AUTHORSHIP_PRESERVATION: "authorship_preservation",
  VALIDATION: "validation",
  CONSENSUS_HANDOFF: "consensus_handoff",
  STAGE_COMPLETE: "stage_complete",
} as const;

export type BlueprintAssemblyStageId =
  (typeof BlueprintAssemblyStage)[keyof typeof BlueprintAssemblyStage];

export const AssemblyStatus = {
  CONSISTENT: "consistent",
  INCONSISTENT: "inconsistent",
} as const;

export type AssemblyStatusId = (typeof AssemblyStatus)[keyof typeof AssemblyStatus];

export const AssemblyConflictSeverity = {
  MAJOR: "major",
  CRITICAL: "critical",
} as const;

export type AssemblyConflictSeverityId =
  (typeof AssemblyConflictSeverity)[keyof typeof AssemblyConflictSeverity];

export type AssemblyConflict = {
  id: string;
  modules: [string, string];
  description: string;
  severity: AssemblyConflictSeverityId;
};

export type PipelineAssemblyMetadata = {
  pipelineVersion: string;
  knowledgeEngineVersion: string;
  patternLibraryVersion: string;
  designRulesVersion: string;
  marketplaceProfileVersion: string;
  agentsUsed: string[];
  assemblyHistory: string[];
};

export type AssemblyBlueprintSnapshot = {
  id: string;
  blueprintId: string;
  createdAt: number;
  pipelineVersion: string;
  checksum: string;
  status: AssemblyStatusId;
  conflictCount: number;
};

export type BlueprintAssemblyInput = {
  profile: AnalyzedProductProfile;
  business: BusinessUnderstandingSection;
  story: VisualStoryPlanningSection;
  scene: ScenePlanningSection;
  composition: CompositionPlanningSection;
  photography: PhotographyPlanningSection;
  knowledge: StagedKnowledgePackage;
  marketplace: string;
  brand?: string;
};

export type BlueprintAssemblySection = {
  blueprint: RenderBlueprint;
  metadata: PipelineAssemblyMetadata;
  constraintSet: ConstraintSet;
  conflicts: AssemblyConflict[];
  snapshot: AssemblyBlueprintSnapshot;
  status: AssemblyStatusId;
  agentAuthorship: Record<string, string[]>;
  sources: BlueprintAssemblyInput;
  stagesCompleted: BlueprintAssemblyStageId[];
  confidence: number;
};

export type BlueprintAssemblyViolation = {
  code: BlueprintAssemblyFailureCode;
  message: string;
  stage?: BlueprintAssemblyStageId;
};

export type BlueprintAssemblyReport = {
  valid: boolean;
  violations: BlueprintAssemblyViolation[];
  section?: BlueprintAssemblySection;
  stagesCompleted: BlueprintAssemblyStageId[];
  durationMs: number;
};

export type BlueprintAssemblyContext = {
  missingStory?: boolean;
  missingScene?: boolean;
  missingComposition?: boolean;
  missingPhotography?: boolean;
  damagedSection?: boolean;
  injectLuxuryIndustrialConflict?: boolean;
  alterDesignDecision?: boolean;
};

export type BlueprintAssemblySystemReport = {
  valid: boolean;
  violations: BlueprintAssemblyViolation[];
  goldenRuleSatisfied: boolean;
  allSectionsMerged: boolean;
  authorshipPreserved: boolean;
  constraintSetReady: boolean;
  snapshotCreated: boolean;
  downstreamReady: boolean;
};

export type BlueprintAssemblyFailureCode =
  | "MISSING_PROFILE"
  | "MISSING_BUSINESS_MODEL"
  | "MISSING_STORY"
  | "MISSING_SCENE"
  | "MISSING_COMPOSITION"
  | "MISSING_PHOTOGRAPHY"
  | "INCOMPLETE_BLUEPRINT"
  | "DAMAGED_SECTION"
  | "DEPENDENCY_VIOLATION"
  | "MISSING_CONSTRAINT_SET"
  | "MISSING_SNAPSHOT"
  | "DESIGN_DECISION_ALTERED"
  | "AGENT_AUTHORSHIP_LOST";
