/** Chapter 11.18 — Commercial Constitution Platform types */

export const CommercialConstitutionModule = {
  PRINCIPLES_CATALOG: "principles_catalog",
  LAW_VALIDATOR: "law_validator",
  DECISION_AUDITOR: "decision_auditor",
  EXPLAINABILITY_GATE: "explainability_gate",
  MEASURABILITY_CHECK: "measurability_check",
  CONSTITUTION_REPORT: "constitution_report",
  HANDOFF_BUILDER: "handoff_builder",
} as const;

export type CommercialConstitutionModuleId =
  (typeof CommercialConstitutionModule)[keyof typeof CommercialConstitutionModule];

export const COMMERCIAL_CONSTITUTION_COMPONENTS = [
  "Principles Registry",
  "Law Validator",
  "Decision Auditor",
  "Explainability Gate",
  "Measurability Checker",
  "Psychology Compliance",
  "Strategy Alignment",
  "Constitution Memory",
] as const;

export const COMMERCIAL_CONSTITUTION_PRINCIPLES = [
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

export type CommercialConstitutionPrincipleId =
  (typeof COMMERCIAL_CONSTITUTION_PRINCIPLES)[number];

export type CommercialConstitutionInput = {
  businessGoal: string;
  primaryMessage: string;
  strategySummary: string;
  measurableObjective?: string;
  explanation?: string;
  aestheticsPriorityOverBusiness?: boolean;
};

export type CommercialConstitutionPlatformReport = {
  valid: boolean;
  version: string;
  contractId: "design-commercial-constitution-platform";
  mediatorId: "design-commercial-constitution";
  modulesCompleted: CommercialConstitutionModuleId[];
  principlesUpheld: CommercialConstitutionPrincipleId[];
  violations: Array<{ code: string; message: string; severity: "critical" | "major" }>;
  pipelineEvent: "design_commercial_constitution_complete";
};
