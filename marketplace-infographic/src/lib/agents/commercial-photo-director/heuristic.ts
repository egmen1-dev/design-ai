import type { CommercialPhotoDirectorInput, CommercialPhotoDirectorResult } from "./types";

/** Structured scene patch only — no backgroundNarrative for Pollinations pipeline */
export function evaluateCommercialPhotoDirectorHeuristic(
  input: CommercialPhotoDirectorInput,
): CommercialPhotoDirectorResult {
  const blueprint = input.genomeContext.photoBlueprint;
  const story = input.storyDirection.decision;

  let score = 76;
  if (blueprint.scenePatch.cameraAngle) score += 4;
  if (blueprint.colorTemperature) score += 3;
  if (input.scene.reflectionEnabled) score += 3;
  if (story?.targetEmotion === "luxury") score += 2;

  const scenePatch = {
    ...blueprint.scenePatch,
    cameraAngle: blueprint.scenePatch.cameraAngle ?? input.scene.cameraAngle,
    lightingDirection: blueprint.scenePatch.lightingDirection ?? input.scene.lightingDirection,
    lightingTemperature: blueprint.scenePatch.lightingTemperature ?? input.scene.lightingTemperature,
    depthOfField: blueprint.scenePatch.depthOfField ?? input.scene.depthOfField,
    visualMood: story?.targetEmotion ?? blueprint.scenePatch.visualMood ?? input.scene.visualMood,
    shadowProfile: blueprint.scenePatch.shadowProfile ?? input.scene.shadowProfile,
  };

  return {
    photoBlueprint: {
      ...blueprint,
      backgroundNarrative: "",
      scenePatch,
    },
    scenePatch,
    backgroundNarrative: "",
    approved: score >= 76,
    score: Math.min(100, score),
    agentSnippet: `Photo:${story?.storyType ?? "studio"} ${scenePatch.lightingDirection ?? ""}`,
  };
}
