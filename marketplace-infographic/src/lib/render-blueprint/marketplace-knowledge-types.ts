/**
 * Chapter 5.5 — Marketplace Knowledge types
 */
import type { MarketplaceId } from "./types";

export const MarketplaceKnowledgeId = {
  AMAZON: "amazon",
  OZON: "ozon",
  WILDBERRIES: "wildberries",
  SHOPIFY: "shopify",
  ETSY: "etsy",
  WALMART: "walmart",
  EBAY: "ebay",
  ALIEXPRESS: "aliexpress",
} as const;

export type MarketplaceKnowledgeIdValue =
  (typeof MarketplaceKnowledgeId)[keyof typeof MarketplaceKnowledgeId];

export const MarketplaceImageContext = {
  MAIN_IMAGE: "main_image",
  SECONDARY_IMAGE: "secondary_image",
  INFOGRAPHIC: "infographic",
  LIFESTYLE: "lifestyle",
} as const;

export type MarketplaceImageContextId =
  (typeof MarketplaceImageContext)[keyof typeof MarketplaceImageContext];

export const MarketplaceRegion = {
  US: "us",
  JP: "jp",
  DE: "de",
  RU: "ru",
  GLOBAL: "global",
} as const;

export type MarketplaceRegionId = (typeof MarketplaceRegion)[keyof typeof MarketplaceRegion];

export const ProductCategoryKnowledge = {
  KITCHEN: "kitchen",
  ELECTRONICS: "electronics",
  BEAUTY: "beauty",
  FURNITURE: "furniture",
  SPORTS: "sports",
} as const;

export type ProductCategoryKnowledgeId =
  (typeof ProductCategoryKnowledge)[keyof typeof ProductCategoryKnowledge];

export type MarketplaceFormat = {
  id: string;
  mime: string;
  minWidth: number;
  minHeight: number;
  maxFileSizeKb: number;
};

export type MarketplaceRequirement = {
  id: string;
  context: MarketplaceImageContextId;
  rule: string;
  mandatory: true;
  region?: MarketplaceRegionId;
};

export type MarketplaceRestriction = {
  id: string;
  context: MarketplaceImageContextId;
  rule: string;
  critical: boolean;
  region?: MarketplaceRegionId;
};

export type MarketplacePractice = {
  id: string;
  category?: ProductCategoryKnowledgeId;
  context?: MarketplaceImageContextId;
  rule: string;
  impact: "low" | "medium" | "high";
};

export type MarketplaceRankingFactor = {
  id: string;
  factor: string;
  weight: number;
  description: string;
};

export type MarketplaceProfile = {
  id: MarketplaceKnowledgeIdValue;
  name: string;
  version: string;
  region: MarketplaceRegionId;
  requirements: MarketplaceRequirement[];
  restrictions: MarketplaceRestriction[];
  bestPractices: MarketplacePractice[];
  rankingFactors: MarketplaceRankingFactor[];
  supportedFormats: MarketplaceFormat[];
};

export type CategoryVisualGuidance = {
  category: ProductCategoryKnowledgeId;
  visualDirection: string;
  lightingHint: string;
  backgroundHint: string;
};

export type MarketplaceBlueprintCheck = {
  marketplaceId: MarketplaceKnowledgeIdValue;
  context: MarketplaceImageContextId;
  region: MarketplaceRegionId;
  category?: ProductCategoryKnowledgeId;
  background?: string;
  hasPromotionalBadges?: boolean;
  hasAdditionalProducts?: boolean;
  hasTextOverlay?: boolean;
  formatId?: string;
  width?: number;
  height?: number;
};

export type MarketplaceValidationViolation = {
  code: MarketplaceKnowledgeFailureCode;
  message: string;
  requirementId?: string;
  restrictionId?: string;
};

export type MarketplaceBlueprintValidation = {
  valid: boolean;
  readyForRenderPipeline: boolean;
  violations: MarketplaceValidationViolation[];
  appliedPractices: MarketplacePractice[];
  rankingHints: string[];
};

export type MarketplaceKnowledgeContext = {
  identicalRulesAcrossPlatforms?: boolean;
  missingCategoryKnowledge?: boolean;
  staticKnowledgeBase?: boolean;
  mixedMandatoryAndRecommendations?: boolean;
  blueprintBypassesValidation?: boolean;
};

export type MarketplaceKnowledgeViolation = {
  code: MarketplaceKnowledgeFailureCode;
  message: string;
  marketplaceId?: MarketplaceKnowledgeIdValue;
};

export type MarketplaceKnowledgeReport = {
  valid: boolean;
  violations: MarketplaceKnowledgeViolation[];
  profiles: MarketplaceProfile[];
  supportedPlatforms: MarketplaceKnowledgeIdValue[];
  goldenRuleSatisfied: boolean;
  contextAware: boolean;
  regionalProfilesSupported: boolean;
  versioningIndependent: boolean;
};

export type MarketplaceKnowledgeFailureCode =
  | "IDENTICAL_RULES_ACROSS_PLATFORMS"
  | "MISSING_CATEGORY_KNOWLEDGE"
  | "STATIC_KNOWLEDGE_BASE"
  | "MANDATORY_MIXED_WITH_RECOMMENDATIONS"
  | "BLUEPRINT_BYPASSES_VALIDATION"
  | "CRITICAL_RESTRICTION_VIOLATED"
  | "REQUIREMENT_NOT_MET"
  | "UNKNOWN_MARKETPLACE"
  | "UNKNOWN_CONTEXT"
  | "REGION_PROFILE_MISSING";
