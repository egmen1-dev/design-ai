/**
 * Chapter 3.7 — Constraint providers (extension point)
 */
import type { RenderBlueprint } from "./types";
import {
  ConstraintCategory,
  ConstraintPriority,
  ConstraintSource,
  type Constraint,
  type ConstraintProvider,
} from "./constraint-types";

const OUTDOOR_ENVIRONMENTS = new Set(["garden", "garage"]);
const INDOOR_ENVIRONMENTS = new Set([
  "kitchen",
  "bathroom",
  "living_room",
  "studio",
  "workshop",
]);

function c(
  partial: Omit<Constraint, "enabled"> & { enabled?: boolean },
): Constraint {
  return { enabled: true, ...partial };
}

/** Architecture invariants — always active */
export const SAFETY_CONSTRAINT_PROVIDER: ConstraintProvider = {
  id: "safety",
  source: ConstraintSource.SAFETY,
  provide() {
    return [
      c({
        id: "hard.no-text",
        canonicalId: "hard.no-text",
        category: ConstraintCategory.TYPOGRAPHY,
        priority: ConstraintPriority.CRITICAL,
        hard: true,
        source: ConstraintSource.SAFETY,
        payload: { enabled: true },
      }),
      c({
        id: "hard.no-logo",
        canonicalId: "hard.no-logo",
        category: ConstraintCategory.SAFETY,
        priority: ConstraintPriority.CRITICAL,
        hard: true,
        source: ConstraintSource.SAFETY,
        payload: { enabled: true },
      }),
      c({
        id: "hard.no-watermark",
        canonicalId: "hard.no-watermark",
        category: ConstraintCategory.SAFETY,
        priority: ConstraintPriority.CRITICAL,
        hard: true,
        source: ConstraintSource.SAFETY,
        payload: { enabled: true },
      }),
      c({
        id: "hard.single-hero",
        canonicalId: "hard.single-hero",
        category: ConstraintCategory.COMPOSITION,
        priority: ConstraintPriority.CRITICAL,
        hard: true,
        source: ConstraintSource.SAFETY,
        payload: { enabled: true },
      }),
      c({
        id: "hard.no-duplicate-product",
        canonicalId: "hard.no-duplicate-product",
        category: ConstraintCategory.COMPOSITION,
        priority: ConstraintPriority.CRITICAL,
        hard: true,
        source: ConstraintSource.SAFETY,
        payload: { enabled: true },
      }),
    ];
  },
};

export const MARKETPLACE_CONSTRAINT_PROVIDER: ConstraintProvider = {
  id: "marketplace",
  source: ConstraintSource.MARKETPLACE,
  provide(blueprint) {
    const { constraints, composition, render } = blueprint;
    const list: Constraint[] = [];

    if (constraints.mustLeaveHeadlineSpace) {
      list.push(
        c({
          id: "layout.headline-space",
          canonicalId: "layout.headline-space",
          category: ConstraintCategory.LAYOUT,
          priority: ConstraintPriority.REQUIRED,
          hard: true,
          source: ConstraintSource.MARKETPLACE,
          payload: { minimum: 0.22 },
          providerInternal: true,
        }),
      );
    }
    if (constraints.mustLeaveBadgeSpace) {
      list.push(
        c({
          id: "layout.badge-area",
          canonicalId: "layout.badge-area",
          category: ConstraintCategory.LAYOUT,
          priority: ConstraintPriority.REQUIRED,
          hard: true,
          source: ConstraintSource.MARKETPLACE,
          payload: { minimum: 0.12 },
          providerInternal: true,
        }),
      );
    }
    if (constraints.mustAvoidHeroOverlap) {
      list.push(
        c({
          id: "layout.hero-coverage-max",
          canonicalId: "layout.hero-coverage-max",
          category: ConstraintCategory.COMPOSITION,
          priority: ConstraintPriority.REQUIRED,
          hard: false,
          source: ConstraintSource.MARKETPLACE,
          payload: { maximum: 0.65 },
          providerInternal: true,
        }),
      );
    }
    if (composition.negativeSpace > 0) {
      list.push(
        c({
          id: "layout.negative-space-min",
          canonicalId: "layout.negative-space-min",
          category: ConstraintCategory.COMPOSITION,
          priority: ConstraintPriority.PREFERRED,
          hard: false,
          source: ConstraintSource.MARKETPLACE,
          payload: { minimum: composition.negativeSpace / 100 },
          providerInternal: true,
        }),
      );
    }
    list.push(
      c({
        id: "layout.aspect-ratio",
        canonicalId: "layout.aspect-ratio",
        category: ConstraintCategory.LAYOUT,
        priority: ConstraintPriority.REQUIRED,
        hard: true,
        source: ConstraintSource.MARKETPLACE,
        payload: { value: render.aspectRatio },
        providerInternal: true,
      }),
      c({
        id: "layout.safe-margins",
        canonicalId: "layout.safe-margins",
        category: ConstraintCategory.LAYOUT,
        priority: ConstraintPriority.REQUIRED,
        hard: true,
        source: ConstraintSource.MARKETPLACE,
        payload: { top: 0.06, right: 0.06, bottom: 0.06, left: 0.06 },
        providerInternal: true,
      }),
    );
    if (constraints.mustAvoidText) {
      list.push(
        c({
          id: "hard.no-typography",
          canonicalId: "hard.no-text",
          category: ConstraintCategory.TYPOGRAPHY,
          priority: ConstraintPriority.CRITICAL,
          hard: true,
          source: ConstraintSource.MARKETPLACE,
          payload: { enabled: true },
        }),
      );
    }
    if (constraints.mustAvoidDuplicateObjects) {
      list.push(
        c({
          id: "hard.no-duplicates",
          canonicalId: "hard.no-duplicate-product",
          category: ConstraintCategory.COMPOSITION,
          priority: ConstraintPriority.CRITICAL,
          hard: true,
          source: ConstraintSource.MARKETPLACE,
          payload: { enabled: true },
        }),
      );
    }
    return list;
  },
};

export const CREATIVE_CONSTRAINT_PROVIDER: ConstraintProvider = {
  id: "creative",
  source: ConstraintSource.CREATIVE,
  provide(blueprint) {
    const { creative } = blueprint;
    const list: Constraint[] = [];
    if (creative.goal === "Minimal") {
      list.push(
        c({
          id: "background.simplicity",
          canonicalId: "background.simplicity",
          category: ConstraintCategory.BACKGROUND,
          priority: ConstraintPriority.PREFERRED,
          hard: false,
          source: ConstraintSource.CREATIVE,
          payload: { maximum: 0.25 },
        }),
      );
    }
    if (creative.goal === "Luxury" || creative.goal === "Premium") {
      list.push(
        c({
          id: "lighting.warm-preferred",
          canonicalId: "lighting.warm-preferred",
          category: ConstraintCategory.LIGHTING,
          priority: ConstraintPriority.OPTIONAL,
          hard: false,
          source: ConstraintSource.CREATIVE,
          payload: { tone: "warm" },
        }),
      );
    }
    return list;
  },
};

export const STORY_CONSTRAINT_PROVIDER: ConstraintProvider = {
  id: "story",
  source: ConstraintSource.STORY,
  provide(blueprint) {
    const list: Constraint[] = [];
    if (blueprint.story.emotionalTone === "calm") {
      list.push(
        c({
          id: "lighting.soft-preferred",
          canonicalId: "lighting.soft-preferred",
          category: ConstraintCategory.LIGHTING,
          priority: ConstraintPriority.OPTIONAL,
          hard: false,
          source: ConstraintSource.STORY,
          payload: { tone: "neutral" },
        }),
      );
    }
    return list;
  },
};

export const COMPOSITION_CONSTRAINT_PROVIDER: ConstraintProvider = {
  id: "composition",
  source: ConstraintSource.COMPOSITION,
  provide(blueprint) {
    const { composition } = blueprint;
    return [
      c({
        id: "composition.hero-weight",
        canonicalId: "layout.hero-coverage-max",
        category: ConstraintCategory.COMPOSITION,
        priority: ConstraintPriority.PREFERRED,
        hard: false,
        source: ConstraintSource.COMPOSITION,
        payload: { maximum: composition.heroWeight / 100 },
        providerInternal: true,
      }),
      c({
        id: "composition.negative-space",
        canonicalId: "layout.negative-space-min",
        category: ConstraintCategory.COMPOSITION,
        priority: ConstraintPriority.PREFERRED,
        hard: false,
        source: ConstraintSource.COMPOSITION,
        payload: { minimum: composition.negativeSpace / 100 },
        providerInternal: true,
      }),
    ];
  },
};

export const GOVERNANCE_CONSTRAINT_PROVIDER: ConstraintProvider = {
  id: "governance",
  source: ConstraintSource.GOVERNANCE,
  provide(blueprint) {
    return blueprint.constraints.set?.constraints ?? [];
  },
};

export const PROVIDER_FLUX_CONSTRAINT_PROVIDER: ConstraintProvider = {
  id: "provider-flux",
  source: ConstraintSource.PROVIDER,
  provide(blueprint) {
    const exclusions = [
      "ctr",
      "professionalScore",
      "html",
      "coordinates",
      "badgePriority",
      "headlineSpace",
      "safeZones",
    ];
    return [
      c({
        id: "provider.flux-exclusions",
        canonicalId: "provider.flux-exclusions",
        category: ConstraintCategory.PROVIDER,
        priority: ConstraintPriority.REQUIRED,
        hard: true,
        source: ConstraintSource.PROVIDER,
        payload: { fields: exclusions },
      }),
      c({
        id: "provider.generator",
        canonicalId: "provider.generator",
        category: ConstraintCategory.PROVIDER,
        priority: ConstraintPriority.REQUIRED,
        hard: true,
        source: ConstraintSource.PROVIDER,
        payload: { enabled: blueprint.meta.generator === "flux" },
      }),
    ];
  },
};

/** Derives scene/camera environment constraints from blueprint decisions */
export const ARCHITECTURE_CONSTRAINT_PROVIDER: ConstraintProvider = {
  id: "architecture",
  source: ConstraintSource.ARCHITECTURE,
  provide(blueprint) {
    const list: Constraint[] = [];
    const env = blueprint.scene.environment;
    if (OUTDOOR_ENVIRONMENTS.has(env)) {
      list.push(
        c({
          id: "scene.environment-outdoor",
          canonicalId: "scene.environment-outdoor",
          category: ConstraintCategory.BACKGROUND,
          priority: ConstraintPriority.REQUIRED,
          hard: true,
          source: ConstraintSource.ARCHITECTURE,
          payload: { mode: "outdoor" },
        }),
      );
    }
    if (INDOOR_ENVIRONMENTS.has(env)) {
      list.push(
        c({
          id: "scene.environment-indoor",
          canonicalId: "scene.environment-indoor",
          category: ConstraintCategory.BACKGROUND,
          priority: ConstraintPriority.REQUIRED,
          hard: true,
          source: ConstraintSource.ARCHITECTURE,
          payload: { mode: "indoor" },
        }),
      );
    }
    list.push(
      c({
        id: `camera.distance-${blueprint.camera.distance}`,
        canonicalId: `camera.distance-${blueprint.camera.distance}`,
        category: ConstraintCategory.CAMERA,
        priority: ConstraintPriority.PREFERRED,
        hard: false,
        source: ConstraintSource.ARCHITECTURE,
        payload: { distance: blueprint.camera.distance },
      }),
    );
  if (blueprint.background.containsPeople === false) {
      list.push(
        c({
          id: "safety.no-people",
          canonicalId: "safety.no-people",
          category: ConstraintCategory.SAFETY,
          priority: ConstraintPriority.REQUIRED,
          hard: true,
          source: ConstraintSource.ARCHITECTURE,
          payload: { enabled: true },
        }),
      );
    }
    if (blueprint.background.containsAnimals === false) {
      list.push(
        c({
          id: "safety.no-animals",
          canonicalId: "safety.no-animals",
          category: ConstraintCategory.SAFETY,
          priority: ConstraintPriority.REQUIRED,
          hard: true,
          source: ConstraintSource.ARCHITECTURE,
          payload: { enabled: true },
        }),
      );
    }
    if (
      blueprint.background.decorDensity < 0.2 &&
      !blueprint.background.secondaryObjects.length
    ) {
      list.push(
        c({
          id: "safety.no-plants",
          canonicalId: "safety.no-plants",
          category: ConstraintCategory.BACKGROUND,
          priority: ConstraintPriority.OPTIONAL,
          hard: false,
          source: ConstraintSource.ARCHITECTURE,
          payload: { enabled: true },
        }),
      );
    }
    return list;
  },
};

export const DEFAULT_CONSTRAINT_PROVIDERS: ConstraintProvider[] = [
  SAFETY_CONSTRAINT_PROVIDER,
  ARCHITECTURE_CONSTRAINT_PROVIDER,
  MARKETPLACE_CONSTRAINT_PROVIDER,
  PROVIDER_FLUX_CONSTRAINT_PROVIDER,
  CREATIVE_CONSTRAINT_PROVIDER,
  STORY_CONSTRAINT_PROVIDER,
  COMPOSITION_CONSTRAINT_PROVIDER,
  GOVERNANCE_CONSTRAINT_PROVIDER,
];

/** User preference constraints — typed only */
export function userConstraintsFromFlags(flags: {
  lightInteriorOnly?: boolean;
  noPeople?: boolean;
  noPlants?: boolean;
  noAnimals?: boolean;
  minimalism?: boolean;
}): Constraint[] {
  const list: Constraint[] = [];
  if (flags.lightInteriorOnly) {
    list.push(
      c({
        id: "user.light-interior",
        canonicalId: "scene.environment-indoor",
        category: ConstraintCategory.USER,
        priority: ConstraintPriority.PREFERRED,
        hard: false,
        source: ConstraintSource.USER,
        payload: { mode: "indoor" },
      }),
    );
  }
  if (flags.noPeople) {
    list.push(
      c({
        id: "user.no-people",
        canonicalId: "safety.no-people",
        category: ConstraintCategory.USER,
        priority: ConstraintPriority.PREFERRED,
        hard: false,
        source: ConstraintSource.USER,
        payload: { enabled: true },
      }),
    );
  }
  if (flags.noPlants) {
    list.push(
      c({
        id: "user.no-plants",
        canonicalId: "safety.no-plants",
        category: ConstraintCategory.BACKGROUND,
        priority: ConstraintPriority.PREFERRED,
        hard: false,
        source: ConstraintSource.USER,
        payload: { enabled: true },
      }),
    );
  }
  if (flags.noAnimals) {
    list.push(
      c({
        id: "user.no-animals",
        canonicalId: "safety.no-animals",
        category: ConstraintCategory.USER,
        priority: ConstraintPriority.PREFERRED,
        hard: false,
        source: ConstraintSource.USER,
        payload: { enabled: true },
      }),
    );
  }
  if (flags.minimalism) {
    list.push(
      c({
        id: "user.minimalism",
        canonicalId: "background.simplicity",
        category: ConstraintCategory.BACKGROUND,
        priority: ConstraintPriority.PREFERRED,
        hard: false,
        source: ConstraintSource.USER,
        payload: { maximum: 0.2 },
      }),
    );
  }
  return list;
}
