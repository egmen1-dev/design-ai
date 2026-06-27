import type { QualityValidationResult } from "@/lib/design/quality-validator";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { SceneLightingProfile } from "@/lib/compositing/scene-analysis";

export type CommercialPhotographerDimensionScores = {
  lighting: number;
  shadows: number;
  perspective: number;
  integration: number;
  colorMatching: number;
  realism: number;
};

export type CommercialPhotographerReview = {
  score: number;
  realism: number;
  looksLikePhoto: boolean;
  problems: string[];
  recommendations: string[];
  scores: CommercialPhotographerDimensionScores;
  source: "heuristic" | "ollama" | "merged";
};

export type CommercialPhotographerInput = {
  scene: ScenePlan;
  lighting?: SceneLightingProfile;
  qualityValidation?: QualityValidationResult;
  hasComposite: boolean;
  hasReflection?: boolean;
  hasShadows?: boolean;
  backgroundSource: "sd" | "fallback";
  productPrompt: string;
  marketIntelligenceSnippet?: string;
};

/** Редко выше 90; PNG-оверлей — не выше 60 */
export const PHOTO_BEHANCE_SCORE = 90;
export const PHOTO_PNG_OVERLAY_CAP = 60;
