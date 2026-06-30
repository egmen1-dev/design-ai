/**
 * Chapter 4.20 — Design Memory types
 */
import type { ChiefReview } from "./chief-design-director-types";
import type { CommercialPhotographerReviewSummary, GenerationDiagnosticsSummary, RetryHistorySummary } from "./chief-design-director-types";
import type { VisionQualityReport } from "./vision-quality-director-types";

export const UserFeedback = {
  LIKE: "like",
  DISLIKE: "dislike",
} as const;

export type UserFeedbackId = (typeof UserFeedback)[keyof typeof UserFeedback];

export type CommercialMetrics = {
  ctr?: number;
  conversion?: number;
  addToCart?: number;
  userRating?: number;
  timeOnCardMs?: number;
};

export type PatternDimensions = {
  story?: string;
  scene?: string;
  environment?: string;
  lighting?: string;
  lightingScheme?: string;
  materials?: string;
  camera?: string;
  photography?: string;
};

/** Statistical design pattern — no images stored */
export type Pattern = {
  id: string;
  dimensions: PatternDimensions;
  category: string;
  provider: string;
  successRate: number;
  sampleCount: number;
  avgScore: number;
  lastSeenAt: number;
  explanation: string;
};

export type WeightEntry = {
  weight: number;
  samples: number;
  avgScore: number;
  decayFactor: number;
};

export type WeightMap = Record<string, WeightEntry>;

export type KnowledgeDelta = {
  key: string;
  section: string;
  delta: number;
  reason: string;
};

/** Chapter 4.20 — knowledge update published after generation completes */
export type MemoryUpdate = {
  successfulPatterns: Pattern[];
  unsuccessfulPatterns: Pattern[];
  updatedWeights: WeightMap;
  avoidPatterns: Pattern[];
  recommendedPatterns: Pattern[];
  knowledgeChanges: KnowledgeDelta[];
  confidence: number;
};

export type DesignMemoryContext = {
  chiefReview: ChiefReview;
  visionReport: VisionQualityReport;
  photoReview?: CommercialPhotographerReviewSummary;
  retryHistory?: RetryHistorySummary;
  generationMetadata?: GenerationDiagnosticsSummary;
  userFeedback?: UserFeedbackId;
  commercialMetrics?: CommercialMetrics;
  completedAt?: number;
};

export type MemoryQuery = {
  category: string;
  provider: string;
  subCategory?: string;
};

export type MemoryQueryResult = {
  recommendedLighting: string[];
  preferredScene: string[];
  recommendedMaterials: string[];
  preferredCamera: string[];
  avoidPatterns: Pattern[];
  explanations: string[];
};

export type DesignKnowledgeStore = {
  version: string;
  patterns: Record<string, Pattern>;
  weightsByScope: Record<string, WeightMap>;
  avoidPatternIds: string[];
  totalSamples: number;
  updatedAt: number;
};

export type MemoryExplainabilityReport = {
  agentId: "design-memory";
  outcomeScore: number;
  category: string;
  provider: string;
  retryLearning?: string;
  marketplaceLearning?: string;
  userFeedbackImpact?: string;
  reasoning: string[];
};

export type MemoryValidationReport = {
  valid: boolean;
  violations: string[];
  update?: MemoryUpdate;
};

export type MemoryFailureCode =
  | "SINGLE_SAMPLE_OVERFIT"
  | "CATEGORY_MIXING"
  | "STALE_PATTERN_DOMINANCE"
  | "UNEXPLAINABLE_RECOMMENDATION"
  | "MISSING_CHIEF_REVIEW"
  | "BLUEPRINT_MUTATION_ATTEMPT";
