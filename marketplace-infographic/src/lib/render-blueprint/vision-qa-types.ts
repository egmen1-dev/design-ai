/**
 * Chapter 3.18 — Vision Quality Assurance types
 */
import type { ProviderMetadata } from "./render-pipeline-types";
import type { RecoveryStrategyId } from "./recovery-types";

export const VisionCategory = {
  COMPOSITION: "composition",
  LIGHTING: "lighting",
  REALISM: "realism",
  PRODUCT: "product",
  BACKGROUND: "background",
  TYPOGRAPHY: "typography",
  MARKETPLACE: "marketplace",
  TECHNICAL: "technical",
} as const;

export type VisionCategoryId = (typeof VisionCategory)[keyof typeof VisionCategory];

export const IssueSeverity = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export type IssueSeverityId = (typeof IssueSeverity)[keyof typeof IssueSeverity];

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Vision QA input — image only, no prompt/blueprint/decision graph */
export type VisionInput = {
  image: string;
  productMask?: string;
  provider: string;
  metadata: ProviderMetadata;
};

export type VisionMetrics = {
  composition: number;
  realism: number;
  lighting: number;
  integration: number;
  marketplace: number;
  technical: number;
  overall: number;
};

export type VisionQAIssue = {
  category: VisionCategoryId;
  severity: IssueSeverityId;
  reason: string;
  location?: BoundingBox;
  code: string;
};

export type VisionRecommendation = {
  strategy: RecoveryStrategyId;
  reason: string;
  confidence: number;
  problemId: string;
};

export type VisionReport = {
  approved: boolean;
  score: number;
  confidence: number;
  issues: VisionQAIssue[];
  metrics: VisionMetrics;
  recommendations: VisionRecommendation[];
  provider: string;
  analyzedAt: number;
};

export const VISION_THRESHOLDS = {
  composition: 80,
  realism: 80,
  lighting: 75,
  integration: 80,
  marketplace: 85,
  technical: 90,
} as const;

export const VISION_METRIC_WEIGHTS = {
  composition: 0.2,
  realism: 0.2,
  lighting: 0.15,
  integration: 0.2,
  marketplace: 0.15,
  technical: 0.1,
} as const;

/** Signals derived from image bytes — no blueprint access */
export type VisionImageSignals = {
  width: number;
  height: number;
  productAreaRatio: number;
  hasContactShadow: boolean;
  lightingMismatch: number;
  perspectiveMismatch: number;
  backgroundClutter: number;
  headlineWhitespaceRatio: number;
  duplicateProduct: boolean;
  noiseLevel: number;
  jpegArtifactScore: number;
  overexposure: number;
  blurScore: number;
};

export type VisionHistoryEntry = {
  id: string;
  report: VisionReport;
  imageHash: string;
  timestamp: number;
};
