import type { CoverConceptId } from "@/lib/cover-concepts";
import { resolveCoverConcept } from "@/lib/cover-concepts";
import type { ArtDirectorModeId } from "@/lib/design-process/art-director-modes";
import type { ProductCategory } from "@/lib/product-analysis";
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

/** Governance scene value when пользователь явно выбрал концепт */
export const COVER_GOVERNANCE_SCENE: Record<CoverConceptId, string> = {
  garden_scene: "outdoor",
  outdoor_lifestyle: "outdoor",
  home_interior: "interior",
  commercial_studio: "studio",
  tech_showcase: "commercial",
  premium_minimal: "commercial",
};

export const USER_COVER_CONCEPT_CONFIDENCE = 0.92;

export const OUTDOOR_COVER_CONCEPT_IDS: CoverConceptId[] = [
  "garden_scene",
  "outdoor_lifestyle",
];

export function isOutdoorCoverConcept(coverConceptId?: CoverConceptId): boolean {
  return !!coverConceptId && OUTDOOR_COVER_CONCEPT_IDS.includes(coverConceptId);
}

/** Маппинг режима арт-директора → coverConcept при auto в форме */
export function resolveCoverConceptFromArtDirectorMode(
  modeId?: ArtDirectorModeId,
  category?: ProductCategory,
): CoverConceptId | undefined {
  switch (modeId) {
    case "emotional_lifestyle":
      return category === "garden_tools" ? "garden_scene" : "outdoor_lifestyle";
    case "premium_brand":
    case "luxury_poster":
      return "premium_minimal";
    case "technical_catalog":
      return category === "electronics" ? "tech_showcase" : "commercial_studio";
    default:
      return undefined;
  }
}

/** Chief retry / environment hint → coverConcept */
export function resolveCoverConceptFromEnvironment(
  env: string,
  category?: ProductCategory,
): CoverConceptId | undefined {
  const lower = env.toLowerCase();
  if (/garden|lawn|grass|suburban|backyard|yard|газон|сад/.test(lower)) {
    return "garden_scene";
  }
  if (/outdoor|street|park|terrace|patio|улиц/.test(lower)) {
    return category === "garden_tools" ? "garden_scene" : "outdoor_lifestyle";
  }
  if (/interior|home|kitchen|living|cozy|wooden floor|интерьер|дом/.test(lower)) {
    return "home_interior";
  }
  if (/tech|futuristic|electronics|neon|гаджет/.test(lower)) {
    return "tech_showcase";
  }
  if (/minimal|luxury|premium/.test(lower)) {
    return "premium_minimal";
  }
  if (/studio|cyclorama|commercial/.test(lower)) {
    return "commercial_studio";
  }
  return undefined;
}

export function coverConceptEnvironmentPhrase(
  coverConceptId?: CoverConceptId,
): string | undefined {
  return resolveCoverConceptVisualHints(coverConceptId)?.environmentPhrase;
}

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
