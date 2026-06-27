import type { CommercialPhotoDirectorInput, CommercialPhotoDirectorResult } from "./types";

export function evaluateCommercialPhotoDirectorHeuristic(
  input: CommercialPhotoDirectorInput,
): CommercialPhotoDirectorResult {
  const blueprint = input.genomeContext.photoBlueprint;
  const story = input.storyDirection;

  const backgroundNarrative = [
    story.sceneNarrative,
    blueprint.backgroundNarrative,
    input.activeCreative?.sceneNarrative,
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 400);

  let score = 74;
  if (blueprint.scenePatch.cameraAngle) score += 5;
  if (blueprint.colorTemperature) score += 4;
  if (input.scene.reflectionEnabled) score += 3;
  if (backgroundNarrative.length > 40) score += 6;

  const scenePatch = {
    ...blueprint.scenePatch,
    cameraAngle: blueprint.scenePatch.cameraAngle ?? input.scene.cameraAngle,
    lightingDirection: blueprint.scenePatch.lightingDirection ?? input.scene.lightingDirection,
    lightingTemperature: blueprint.scenePatch.lightingTemperature ?? input.scene.lightingTemperature,
    depthOfField: blueprint.scenePatch.depthOfField ?? input.scene.depthOfField,
    visualMood: blueprint.scenePatch.visualMood ?? input.scene.visualMood,
    shadowProfile: blueprint.scenePatch.shadowProfile ?? input.scene.shadowProfile,
  };

  return {
    photoBlueprint: { ...blueprint, backgroundNarrative },
    scenePatch,
    backgroundNarrative,
    approved: score >= 76,
    score: Math.min(100, score),
    agentSnippet: blueprint.agentSnippet,
  };
}
