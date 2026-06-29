import type { ScenePlan } from "@/lib/design/scene-planner";
import type { TargetEmotionId, VisualSceneBlueprint } from "./types";

const MOOD_FROM_SCENE: Array<[RegExp, TargetEmotionId]> = [
  [/\bluxury|premium|премиум/i, "luxury"],
  [/\btrust|надёж/i, "trust"],
  [/\benergy|динам/i, "energy"],
  [/\bcalm|спокой/i, "calm"],
  [/\bconfidence|уверен/i, "confidence"],
  [/\bprofessional|коммерч/i, "professional"],
];

function parseTemperatureK(value?: string): number | undefined {
  if (!value) return undefined;
  const match = value.match(/(\d{3,5})/);
  if (!match) return undefined;
  const k = Number(match[1]);
  return Number.isFinite(k) ? k : undefined;
}

function mapSceneMood(visualMood?: string): TargetEmotionId | undefined {
  if (!visualMood) return undefined;
  for (const [pattern, mood] of MOOD_FROM_SCENE) {
    if (pattern.test(visualMood)) return mood;
  }
  return undefined;
}

/** Синхронизирует патч commercial-photo-director (scenePlan) в visualBlueprint */
export function applyScenePlanPatchesToVisualBlueprint(
  blueprint: VisualSceneBlueprint,
  scenePlan: ScenePlan,
): VisualSceneBlueprint {
  const mood = mapSceneMood(scenePlan.visualMood);
  const temperatureK = parseTemperatureK(scenePlan.lightingTemperature);

  return {
    ...blueprint,
    mood: mood ?? blueprint.mood,
    story: mood ? { ...blueprint.story, targetEmotion: mood } : blueprint.story,
    lighting: {
      ...blueprint.lighting,
      ...(temperatureK ? { temperatureK } : {}),
    },
  };
}
