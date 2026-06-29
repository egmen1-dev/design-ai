import type { CommercialPhotoDirectorInput } from "./types";

/** Structured photo decisions only — no SD prompt text */
export function buildCommercialPhotoDirectorPrompt(input: CommercialPhotoDirectorInput): string {
  const story = input.storyDirection.decision;
  return `Ты — Commercial Photo Director. Верни ТОЛЬКО структурированные решения по съёмке (не описание сцены для SD).

Story type: ${story?.storyType ?? "premium"}
Emotion: ${story?.targetEmotion ?? "professional"}
Category: ${input.analysis.category}
Camera: ${input.scene.cameraAngle}

JSON:
{
  "lightSource": "soft_key | directional | overhead",
  "colorTemperature": "5200K",
  "atmosphere": "neutral_premium | warm_domestic | cold_technical",
  "score": 0-100
}`;
}
