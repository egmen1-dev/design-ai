/** Chapter 11.19 — Commercial Intelligence Platform Summary types */

export const PlatformSummaryModule = {
  SUMMARY_CATALOG: "summary_catalog",
  ECOSYSTEM_CATALOG: "ecosystem_catalog",
  WORKFLOW_COORDINATOR: "workflow_coordinator",
  OUTPUT_SYNTHESIZER: "output_synthesizer",
  CROSS_PLATFORM_BRIDGE: "cross_platform_bridge",
  EVOLUTION_TRACKER: "evolution_tracker",
  REPORT_BUILDER: "report_builder",
} as const;

export type PlatformSummaryModuleId =
  (typeof PlatformSummaryModule)[keyof typeof PlatformSummaryModule];

export const PLATFORM_SUMMARY_COMPONENTS = [
  "Ecosystem Catalog",
  "Workflow Coordinator",
  "Output Synthesizer",
  "Cross-Platform Bridge",
  "Evolution Tracker",
  "Principles Registry",
  "Metrics Aggregator",
  "Summary Memory",
] as const;

export const PLATFORM_SUMMARY_LAYERS = [
  "business_goal",
  "market_intelligence",
  "strategy",
  "decision",
  "prediction",
  "validation",
  "creative_handoff",
] as const;

export type PlatformSummaryLayerId = (typeof PLATFORM_SUMMARY_LAYERS)[number];

export const PLATFORM_SUMMARY_PRINCIPLES = [
  "psychology_over_assumptions",
  "strategy_over_inspiration",
  "measurable_goals",
  "beauty_as_instrument",
  "functional_elements",
  "explainability_required",
  "continuous_improvement",
] as const;

export type PlatformSummaryInput = {
  constitutionReportValid: boolean;
  platform: import("./types").CommercialPlatformInput;
};

export type PlatformSummaryReport = {
  valid: boolean;
  version: string;
  contractId: "design-commercial-intelligence-platform-summary";
  mediatorId: "design-commercial-constitution";
  modulesCompleted: PlatformSummaryModuleId[];
  layersCompleted: PlatformSummaryLayerId[];
  ecosystemEngineCount: number;
  intelligenceOutputs: string[];
  complianceFlags: import("./types").CommercialComplianceFlag[];
  qualityScore: number;
  creativeHandoffReady: boolean;
  pipelineEvents: [
    "design_commercial_constitution_complete",
    "design_commercial_intelligence_platform_summary",
    "design_commercial_intelligence_platform_summary_complete",
  ];
};
