/**
 * Chapter 5.13 — Consumer Behavior Knowledge types
 */

import type { KnowledgeEvidenceSourceId } from "./design-knowledge-philosophy-types";

export const DecisionJourneyStage = {
  ATTENTION: "attention",
  INTEREST: "interest",
  EVALUATION: "evaluation",
  TRUST: "trust",
  CLICK: "click",
  PURCHASE: "purchase",
} as const;

export type DecisionJourneyStageId =
  (typeof DecisionJourneyStage)[keyof typeof DecisionJourneyStage];

export const PurchaseMotivation = {
  FUNCTIONAL: "functional",
  EMOTIONAL: "emotional",
} as const;

export type PurchaseMotivationId =
  (typeof PurchaseMotivation)[keyof typeof PurchaseMotivation];

export const BuyingMode = {
  IMPULSE: "impulse",
  RATIONAL: "rational",
} as const;

export type BuyingModeId = (typeof BuyingMode)[keyof typeof BuyingMode];

export const ConsumerSegmentFactor = {
  AGE: "age",
  PROFESSIONAL_LEVEL: "professional_level",
  USE_SCENARIO: "use_scenario",
  CATEGORY: "category",
  ENGAGEMENT: "engagement",
  EMOTIONAL_EXPECTATION: "emotional_expectation",
} as const;

export type ConsumerSegmentFactorId =
  (typeof ConsumerSegmentFactor)[keyof typeof ConsumerSegmentFactor];

export type ConsumerBehaviorCondition = {
  field: string;
  operator: "eq" | "in" | "gte" | "lte";
  value: string | number | string[];
};

/** Distinct from Ch 5.2 KnowledgeSource */
export type ConsumerBehaviorKnowledgeSource = {
  id: KnowledgeEvidenceSourceId;
  label: string;
  evidenceLevel: number;
};

export type ConsumerBehaviorRule = {
  id: string;
  behavior: string;
  trigger: string;
  expectedReaction: string;
  confidence: number;
  conditions: ConsumerBehaviorCondition[];
  references: ConsumerBehaviorKnowledgeSource[];
  stageId?: DecisionJourneyStageId;
  motivationId?: PurchaseMotivationId;
  buyingModeId?: BuyingModeId;
};

export type DecisionJourneyStep = {
  rank: number;
  stage: DecisionJourneyStageId;
  designFocus: string;
  buyerQuestion: string;
};

export type RiskReductionSignal = {
  id: string;
  name: string;
  description: string;
};

export type SocialProofSignal = {
  id: string;
  name: string;
  description: string;
};

export type ConsumerBehaviorSelectionContext = {
  category?: string;
  marketplace?: string;
  buyingMode?: BuyingModeId;
  purchaseMotivation?: PurchaseMotivationId;
  decisionStage?: DecisionJourneyStageId;
  engagementLevel?: "low" | "medium" | "high";
  ageGroup?: string;
  professionalLevel?: string;
  useScenario?: string;
};

export type ConsumerBlueprintCheck = {
  decisionStage?: DecisionJourneyStageId;
  heroProductPresent?: boolean;
  primaryBenefitPresent?: boolean;
  usageScenarioPresent?: boolean;
  trustScore?: number;
  perceivedValue?: number;
  riskReductionSignals?: string[];
  comparativeAdvantage?: boolean;
  decisionTimeMs?: number;
  purchaseMotivation?: PurchaseMotivationId;
  buyingMode?: BuyingModeId;
  socialProofSignals?: string[];
  visualCleanliness?: boolean;
  aestheticOnly?: boolean;
  segmentationMatched?: boolean;
  impulseOptimized?: boolean;
  clickIntentLikely?: boolean;
};

export type ConsumerValidationViolation = {
  code: ConsumerBehaviorKnowledgeFailureCode;
  aspect: string;
  message: string;
};

export type ConsumerBlueprintValidation = {
  valid: boolean;
  violations: ConsumerValidationViolation[];
  retryRecommended: boolean;
  explainable: boolean;
  estimatedTrustScore?: number;
  estimatedPerceivedValue?: number;
};

export type ConsumerBehaviorKnowledgeContext = {
  aestheticOnlyDesign?: boolean;
  ignoresDecisionJourney?: boolean;
  missingTrustMechanisms?: boolean;
  highPerceivedRisk?: boolean;
  noBuyerBehaviorModel?: boolean;
};

export type ConsumerBehaviorKnowledgeViolation = {
  code: ConsumerBehaviorKnowledgeFailureCode;
  message: string;
  ruleId?: string;
};

export type ConsumerBehaviorKnowledgeReport = {
  valid: boolean;
  violations: ConsumerBehaviorKnowledgeViolation[];
  rules: ConsumerBehaviorRule[];
  decisionJourney: DecisionJourneyStep[];
  goldenRuleSatisfied: boolean;
  journeyAware: boolean;
  trustMeasurable: boolean;
  evolutionReady: boolean;
};

export type ConsumerBehaviorKnowledgeFailureCode =
  | "MISSING_ATTENTION_HOOK"
  | "NO_INTEREST_SIGNAL"
  | "WEAK_EVALUATION_SUPPORT"
  | "INSUFFICIENT_TRUST"
  | "HIGH_PERCEIVED_RISK"
  | "WEAK_COMPARATIVE_ADVANTAGE"
  | "SLOW_DECISION_PATH"
  | "AESTHETIC_ONLY_DESIGN"
  | "SEGMENTATION_MISMATCH"
  | "MISSING_VALUE_PERCEPTION";
