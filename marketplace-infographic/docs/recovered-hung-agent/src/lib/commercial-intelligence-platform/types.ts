/** Design AI OS — Chapter 11 Commercial Intelligence Platform — shared types */

export const COMMERCIAL_INTELLIGENCE_PLATFORM_ID = "commercial-intelligence-platform" as const;

export type CommercialContractId =
  | "design-commercial-constitution"
  | "design-commercial-constitution-platform"
  | "design-commercial-intelligence-platform-summary"
  | "design-commercial-intelligence-manifest-platform"
  | "design-revenue-prediction"
  | typeof COMMERCIAL_INTELLIGENCE_PLATFORM_ID;

export type CommercialPipelineEvent =
  | "design_commercial_constitution_complete"
  | "design_commercial_intelligence_platform_summary"
  | "design_commercial_intelligence_platform_summary_complete"
  | "design_commercial_intelligence_manifest_platform"
  | "design_commercial_intelligence_manifest_complete";

export type CommercialComplianceFlag =
  | "aestheticsOverBusiness"
  | "designGenerationOverCommercialAdvantage"
  | "rawQueryHandoff"
  | "unexplainedDecision";

export type CommercialIntelligenceOutput =
  | "designIntent"
  | "designSpecification"
  | "priorities"
  | "constraints"
  | "ctrForecast"
  | "conversionForecast"
  | "revenueForecast"
  | "readiness"
  | "qualityScore"
  | "constitutionReport";

export type CommercialPlatformInput = {
  productCategory: string;
  productName: string;
  businessGoal: string;
  marketplaceId: string;
  priceRub?: number;
  targetAudience?: string;
  userSegment?: string;
};

export type CommercialDesignIntent = {
  primaryMessage: string;
  commercialGoal: string;
  emotionalTrigger: string;
  measurableObjective: string;
  confidence: number;
};

export type CommercialDesignSpecification = {
  intent: CommercialDesignIntent;
  priorities: string[];
  constraints: string[];
  psychologyFactors: string[];
  strategyId: string;
};

export type CommercialForecastBundle = {
  ctrForecast: number;
  conversionForecast: number;
  revenueForecast: number;
  confidence: number;
};

export type CommercialQualityScore = {
  overall: number;
  psychologyAlignment: number;
  strategyCoherence: number;
  measurability: number;
  explainability: number;
};

export type CommercialConstitutionReport = {
  passed: boolean;
  violations: CommercialViolation[];
  principlesUpheld: number;
  principlesTotal: number;
};

export type CommercialViolation = {
  code: string;
  principle?: string;
  message: string;
  severity: "critical" | "major" | "minor";
};

export type CommercialModuleRecord = {
  module: string;
  at: number;
  detail?: string;
};

export type CommercialExecutionReport = {
  valid: boolean;
  contractId: CommercialContractId;
  version: string;
  violations: CommercialViolation[];
  modulesCompleted: string[];
  complianceFlags: CommercialComplianceFlag[];
  outputs: Partial<Record<CommercialIntelligenceOutput, unknown>>;
};
