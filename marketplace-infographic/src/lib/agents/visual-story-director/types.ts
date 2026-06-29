import type { DesignBrief } from "@/lib/design-brief/schema";
import type { GenomeIntelligenceContext } from "@/lib/design/design-genome";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type { ProductVisualProfile } from "@/lib/design/scene-planner";
import type { CompositionScenarioId } from "@/lib/design/types";
import type { CreativeDirectorResult } from "@/lib/design-process/creative-concept";
import type { VisualHook } from "@/lib/design-process/types";
import type { StoryDecision } from "@/lib/design/visual-pipeline/types";

export type VisualStoryDirectorInput = {
  prompt: string;
  analysis: ProductAnalysis;
  designBrief?: DesignBrief;
  activeCreative?: CreativeDirectorResult;
  productVisual?: ProductVisualProfile;
  genomeContext: GenomeIntelligenceContext;
  marketIntelligenceSnippet?: string;
};

/** @deprecated narrative fields — use `decision` for render pipeline */
export type VisualStoryDirectorResult = {
  /** Structured commercial narrative — sole output for Pollinations pipeline */
  decision: StoryDecision;
  storyBlueprint: GenomeIntelligenceContext["storyBlueprint"];
  /** @deprecated not used by Pollinations adapters */
  sceneNarrative: string;
  /** @deprecated not used by Pollinations adapters */
  heroConcept: string;
  customerIntent: string;
  visualHook?: VisualHook;
  compositionScenarioId?: CompositionScenarioId;
  approved: boolean;
  score: number;
  agentSnippet: string;
  source: "genome" | "creative" | "merged" | "structured";
};
