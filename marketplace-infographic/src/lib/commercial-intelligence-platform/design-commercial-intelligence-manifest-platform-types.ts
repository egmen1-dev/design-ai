/** Chapter 11.20 — Commercial Intelligence Manifest Platform types */

export const ManifestModule = {
  MANIFEST_CATALOG: "manifest_catalog",
  MISSION_REGISTRY: "mission_registry",
  PRINCIPLES_CODEX: "principles_codex",
  RESPONSIBILITY_BOUNDARY: "responsibility_boundary",
  IO_CATALOG: "io_catalog",
  FUTURE_VISION: "future_vision",
  REPORT_BUILDER: "report_builder",
} as const;

export type ManifestModuleId = (typeof ManifestModule)[keyof typeof ManifestModule];

export const MANIFEST_COMPONENTS = [
  "Mission Registry",
  "Principles Codex",
  "Responsibility Boundary Validator",
  "I/O Catalog",
  "Future Vision Planner",
  "Constraints Enforcer",
  "Success Criteria Evaluator",
  "Manifest Memory",
] as const;

export const MANIFEST_LAYERS = [
  "why_exists",
  "mission",
  "principles",
  "inputs_outputs",
  "relationships",
  "constraints",
  "declaration",
] as const;

export type ManifestLayerId = (typeof MANIFEST_LAYERS)[number];

export const MANIFEST_PRINCIPLES = [
  "psychology_over_assumptions",
  "strategy_over_inspiration",
  "measurable_objectives",
  "beauty_as_instrument",
  "functional_design_elements",
  "explainable_decisions",
  "improvable_hypotheses",
  "evidence_backed_knowledge",
  "continuous_evolution",
  "user_interest_priority",
] as const;

export const MANIFEST_CONSTRAINTS = [
  "no_decision_without_explanation",
  "no_constitution_violation",
  "no_ignoring_research",
  "no_architecture_contradiction",
  "no_context_loss_between_platforms",
  "no_image_generation_responsibility",
  "no_rendering_responsibility",
  "no_raw_user_query_handoff",
] as const;

export const FUTURE_VISION_CAPABILITIES = [
  "autonomous_market_research",
  "commercial_effect_forecast",
  "pattern_discovery",
  "strategy_construction",
  "buyer_modeling",
  "business_optimization",
  "continuous_learning",
  "decision_support",
] as const;

export type ManifestPlatformReport = {
  valid: boolean;
  version: string;
  contractId: "design-commercial-intelligence-manifest-platform";
  mediatorId: "design-commercial-intelligence-platform-summary";
  modulesCompleted: ManifestModuleId[];
  layersCompleted: ManifestLayerId[];
  principlesCount: number;
  constraintsCount: number;
  futureCapabilitiesCount: number;
  complianceFlags: import("./types").CommercialComplianceFlag[];
  pipelineEvents: [
    "design_commercial_intelligence_platform_summary_complete",
    "design_commercial_intelligence_manifest_platform",
    "design_commercial_intelligence_manifest_complete",
  ];
  goldenRuleUpheld: boolean;
};
