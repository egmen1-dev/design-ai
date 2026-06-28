import type { SceneTypeId } from "@/lib/design/scene-blueprint/types";
import { resolveSceneType } from "@/lib/design/scene-blueprint/templates";
import type {
  DirectorResult,
  EnvironmentArchitectureId,
  SceneEnvironmentDecision,
  StoryDecision,
  TimeOfDayId,
  WeatherId,
} from "../types";
import { storyTypeToSceneType } from "../catalogs/story";
import type { ProductAnalysis } from "@/lib/product-analysis";

const SCENE_ARCHITECTURE: Record<SceneTypeId, EnvironmentArchitectureId> = {
  premium_studio: "studio",
  industrial_studio: "workshop",
  luxury_minimal: "studio",
  technical_presentation: "tech_stage",
  lifestyle: "home_interior",
  modern_dark: "studio",
  modern_white: "studio",
  technology: "tech_stage",
  construction: "workshop",
  medical: "corporate",
  kitchen: "kitchen",
  workshop: "workshop",
  nature: "nature",
  corporate: "corporate",
};


export type SceneEnvironmentDirectorInput = {
  analysis: ProductAnalysis;
  story: StoryDecision;
  sceneTypeHint?: SceneTypeId;
};

/** Scene Director — environment, depth, weather, time, architecture only */
export function runSceneEnvironmentDirector(
  input: SceneEnvironmentDirectorInput,
): DirectorResult<SceneEnvironmentDecision> {
  const sceneType =
    input.sceneTypeHint ??
    storyTypeToSceneType(input.story.storyType) ??
    resolveSceneType(input.analysis.category, input.analysis.priceSegment);

  const architecture =
    SCENE_ARCHITECTURE[sceneType] ??
    (input.story.usageContext === "outdoor" ? "outdoor" : "studio");

  const weather: WeatherId =
    input.story.usageContext === "outdoor" ? "clear" : "indoor_controlled";
  const time: TimeOfDayId =
    input.story.storyType === "lifestyle" ? "golden_hour" : "studio_neutral";

  const decision: SceneEnvironmentDecision = {
    sceneType,
    architecture,
    depth: input.story.storyType === "premium" ? "shallow" : "medium",
    weather,
    time,
    visualDensity: 0.1,
  };

  return {
    decision,
    approved: true,
    score: 82,
    agentSnippet: `Scene:${sceneType} arch:${architecture}`,
  };
}
