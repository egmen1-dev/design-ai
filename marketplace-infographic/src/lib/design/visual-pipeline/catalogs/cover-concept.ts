import type { CoverConceptId } from "@/lib/cover-concepts";
import { resolveCoverConcept } from "@/lib/cover-concepts";
import type { SceneTypeId } from "@/lib/design/scene-blueprint/types";
import type {
  EnvironmentArchitectureId,
  TimeOfDayId,
  WeatherId,
} from "../types";
import type { RenderProfileId } from "@/lib/render-engine/types";

export type CoverConceptVisualHints = {
  sceneType: SceneTypeId;
  architecture: EnvironmentArchitectureId;
  weather: WeatherId;
  time: TimeOfDayId;
  profileId: RenderProfileId;
  environmentPhrase: string;
};

const COVER_VISUAL: Record<CoverConceptId, Omit<CoverConceptVisualHints, "environmentPhrase">> = {
  garden_scene: {
    sceneType: "nature",
    architecture: "nature",
    weather: "clear",
    time: "golden_hour",
    profileId: "outdoor",
  },
  outdoor_lifestyle: {
    sceneType: "lifestyle",
    architecture: "outdoor",
    weather: "clear",
    time: "golden_hour",
    profileId: "outdoor",
  },
  home_interior: {
    sceneType: "lifestyle",
    architecture: "home_interior",
    weather: "indoor_controlled",
    time: "morning",
    profileId: "lifestyle",
  },
  commercial_studio: {
    sceneType: "premium_studio",
    architecture: "studio",
    weather: "indoor_controlled",
    time: "studio_neutral",
    profileId: "premium_product",
  },
  tech_showcase: {
    sceneType: "technology",
    architecture: "tech_stage",
    weather: "indoor_controlled",
    time: "studio_neutral",
    profileId: "electronics",
  },
  premium_minimal: {
    sceneType: "luxury_minimal",
    architecture: "studio",
    weather: "indoor_controlled",
    time: "studio_neutral",
    profileId: "minimal",
  },
};

/** Короткая фраза среды для Pollinations — приоритет над generic studio */
export function resolveCoverConceptVisualHints(
  coverConceptId?: CoverConceptId,
): CoverConceptVisualHints | null {
  if (!coverConceptId) return null;
  const base = COVER_VISUAL[coverConceptId];
  if (!base) return null;
  const concept = resolveCoverConcept(coverConceptId);
  const environmentPhrase = concept.backgroundPromptSuffix
    .replace(/\bultra realistic\b/gi, "")
    .replace(/\b8k\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 180);
  return { ...base, environmentPhrase };
}
