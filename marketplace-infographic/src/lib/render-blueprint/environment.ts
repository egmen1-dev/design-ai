import type { CoverConceptId } from "@/lib/cover-concepts";
import type { SceneEnvironmentId } from "./types";

/** v17 coverConcept → v18 scene.environment (Chapter 3) */
export const COVER_CONCEPT_TO_ENVIRONMENT: Record<CoverConceptId, SceneEnvironmentId> = {
  commercial_studio: "studio",
  outdoor_lifestyle: "garden",
  home_interior: "living_room",
  garden_scene: "garden",
  tech_showcase: "studio",
  premium_minimal: "studio",
};

export const ENVIRONMENT_TO_COVER_CONCEPT: Partial<Record<SceneEnvironmentId, CoverConceptId>> = {
  studio: "commercial_studio",
  garden: "garden_scene",
  living_room: "home_interior",
  kitchen: "home_interior",
  workshop: "commercial_studio",
  garage: "commercial_studio",
  bathroom: "home_interior",
};

export function environmentFromCoverConcept(id: CoverConceptId): SceneEnvironmentId {
  return COVER_CONCEPT_TO_ENVIRONMENT[id];
}

export function coverConceptFromEnvironment(env: SceneEnvironmentId): CoverConceptId | undefined {
  return ENVIRONMENT_TO_COVER_CONCEPT[env];
}
