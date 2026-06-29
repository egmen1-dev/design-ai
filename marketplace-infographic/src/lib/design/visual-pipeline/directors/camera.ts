import type { DirectorResult, CameraDecision, StoryDecision } from "../types";
import type { SceneEnvironmentDecision } from "../types";
import type { ProductAnalysis } from "@/lib/product-analysis";

export type CameraDirectorInput = {
  analysis: ProductAnalysis;
  story: StoryDecision;
  scene: SceneEnvironmentDecision;
};

export function runCameraDirector(input: CameraDirectorInput): DirectorResult<CameraDecision> {
  const isAuto = input.analysis.category === "auto";
  const isElectronics = input.analysis.category === "electronics";

  const decision: CameraDecision = {
    lensMm: isElectronics ? 65 : 70,
    angle: isAuto ? "low_hero" : "three_quarter",
    distance: input.story.storyType === "premium" ? "medium" : "medium",
    framing: "product_hero",
    perspective: input.story.storyType === "lifestyle" ? "natural" : "compressed",
  };

  return {
    decision,
    approved: true,
    score: 83,
    agentSnippet: `Cam:${decision.lensMm}mm ${decision.angle}`,
  };
}
