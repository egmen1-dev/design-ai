/**
 * v18 — единое поле локации.
 * Заменяет: coverConceptId, sceneType, backgroundType, sceneCategory, architecture (как отдельный источник).
 */
export type SceneEnvironmentId =
  | "studio_commercial"
  | "studio_premium"
  | "outdoor_lifestyle"
  | "residential_backyard"
  | "garden_lawn"
  | "home_interior"
  | "kitchen"
  | "workshop"
  | "tech_showcase"
  | "nature"
  | "industrial_floor"
  | "retail_shelf";

import type { CoverConceptId } from "@/lib/cover-concepts";

/** v17 coverConcept → v18 environment */
export const COVER_CONCEPT_TO_ENVIRONMENT: Record<CoverConceptId, SceneEnvironmentId> = {
  commercial_studio: "studio_commercial",
  outdoor_lifestyle: "outdoor_lifestyle",
  home_interior: "home_interior",
  garden_scene: "garden_lawn",
  tech_showcase: "tech_showcase",
  premium_minimal: "studio_premium",
};

/** Обратный маппинг (для UI, пока coverConcept в форме) */
export const ENVIRONMENT_TO_COVER_CONCEPT: Partial<Record<SceneEnvironmentId, CoverConceptId>> = {
  studio_commercial: "commercial_studio",
  outdoor_lifestyle: "outdoor_lifestyle",
  home_interior: "home_interior",
  garden_lawn: "garden_scene",
  tech_showcase: "tech_showcase",
  studio_premium: "premium_minimal",
  residential_backyard: "garden_scene",
  kitchen: "home_interior",
  nature: "outdoor_lifestyle",
};

export function environmentFromCoverConcept(id: CoverConceptId): SceneEnvironmentId {
  return COVER_CONCEPT_TO_ENVIRONMENT[id];
}

export function coverConceptFromEnvironment(env: SceneEnvironmentId): CoverConceptId | undefined {
  return ENVIRONMENT_TO_COVER_CONCEPT[env];
}
