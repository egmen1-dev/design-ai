import type { GenomeIntelligenceContext } from "@/lib/design/design-genome";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type { ProductVisualProfile } from "@/lib/design/scene-planner";
import type { CreativeDirectorResult } from "@/lib/design-process/creative-concept";
import type { VisualStoryDirectorResult } from "../visual-story-director/types";

export type CommercialPhotoDirectorInput = {
  genomeContext: GenomeIntelligenceContext;
  storyDirection: VisualStoryDirectorResult;
  scene: ScenePlan;
  analysis: ProductAnalysis;
  productVisual?: ProductVisualProfile;
  activeCreative?: CreativeDirectorResult;
};

export type CommercialPhotoDirectorResult = {
  photoBlueprint: GenomeIntelligenceContext["photoBlueprint"];
  scenePatch: Partial<Pick<
    ScenePlan,
    | "cameraAngle"
    | "cameraHeight"
    | "cameraDistance"
    | "lightingDirection"
    | "lightingTemperature"
    | "backgroundType"
    | "depthOfField"
    | "visualMood"
    | "colorHarmony"
    | "shadowProfile"
  >>;
  backgroundNarrative: string;
  approved: boolean;
  score: number;
  agentSnippet: string;
};
