import type { CommercialPhotoDirectorInput } from "./types";

export function buildCommercialPhotoDirectorPrompt(input: CommercialPhotoDirectorInput): string {
  return `Ты — Commercial Photo Director. Создай Commercial Photography Blueprint (не layout JSON).

Story: ${input.storyDirection.heroConcept}
Scene narrative: ${input.storyDirection.sceneNarrative}
Category: ${input.analysis.category}
Current camera: ${input.scene.cameraAngle}

Верни JSON:
{
  "backgroundNarrative": "детальное описание рекламной сцены для SD",
  "lightSource": "источник света",
  "colorTemperature": "например 5200K",
  "atmosphere": "атмосфера",
  "score": 0-100
}`;
}
