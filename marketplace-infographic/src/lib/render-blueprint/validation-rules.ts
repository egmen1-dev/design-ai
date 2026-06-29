/**
 * Chapter 3.6 — Validation rules VAL_001 … VAL_010
 */
import type { RenderBlueprint } from "./types";
import { SectionState } from "./lifecycle-types";
import { SECTION_VALIDATORS } from "./section-validators";
import { assertNoPromptStored } from "./constitution";
import {
  ValidationLevel,
  type ValidationError,
  type ValidationResult,
  type ValidationRule,
  type ValidationWarning,
} from "./validation-types";

function emptyResult(level: ValidationResult["level"]): ValidationResult {
  return { passed: true, score: 100, level, errors: [], warnings: [], recommendations: [] };
}

function mergeResults(
  level: ValidationResult["level"],
  parts: ValidationResult[],
): ValidationResult {
  const errors = parts.flatMap((p) => p.errors);
  const warnings = parts.flatMap((p) => p.warnings);
  const recommendations = parts.flatMap((p) => p.recommendations);
  const hasFatal = errors.some((e) => e.severity === "fatal");
  const hasError = errors.some((e) => e.severity === "error");
  const penalty = errors.length * 12 + warnings.length * 4;
  const score = Math.max(0, 100 - penalty);
  return {
    passed: !hasFatal && !hasError,
    score,
    level,
    errors,
    warnings,
    recommendations,
  };
}

function sectionAtLeast(
  blueprint: RenderBlueprint,
  section: keyof RenderBlueprint["lifecycle"]["sections"],
  min: SectionState,
): boolean {
  const order = [
    SectionState.EMPTY,
    SectionState.DIRTY,
    SectionState.READY,
    SectionState.VALIDATED,
    SectionState.LOCKED,
  ];
  const state = blueprint.lifecycle.sections[section];
  return order.indexOf(state) >= order.indexOf(min);
}

/** VAL_001 — Blueprint structure / schema */
export const VAL_001_BLUEPRINT_STRUCTURE: ValidationRule = {
  id: "VAL_001",
  name: "Blueprint Structure",
  priority: 1,
  level: ValidationLevel.SCHEMA,
  category: "Structural",
  validate(blueprint) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!blueprint.meta?.id) {
      errors.push({
        code: "VAL_001",
        section: "meta",
        severity: "fatal",
        message: "meta.id is required",
      });
    }
    if (!blueprint.product?.category?.trim()) {
      errors.push({
        code: "VAL_001",
        section: "product",
        severity: "fatal",
        message: "product.category is required",
      });
    }
    if (blueprint.meta.version !== 18) {
      warnings.push({
        code: "VAL_001",
        section: "meta",
        message: `Unexpected blueprint version ${blueprint.meta.version}`,
      });
    }

    for (const [section, validator] of Object.entries(SECTION_VALIDATORS)) {
      const result = validator(blueprint);
      if (!result.ok && section === "product") {
        for (const field of result.missing) {
          errors.push({
            code: "VAL_001",
            section: section as ValidationError["section"],
            severity: "error",
            message: `Missing required field: ${field}`,
          });
        }
      }
    }

    const passed = !errors.some((e) => e.severity === "fatal" || e.severity === "error");
    return mergeResults(ValidationLevel.SCHEMA, [
      { ...emptyResult(ValidationLevel.SCHEMA), errors, warnings, passed, score: passed ? 100 : 60 },
    ]);
  },
};

/** VAL_002 — Lifecycle consistency */
export const VAL_002_LIFECYCLE: ValidationRule = {
  id: "VAL_002",
  name: "Lifecycle",
  priority: 2,
  level: ValidationLevel.SCHEMA,
  category: "Structural",
  validate(blueprint) {
    const errors: ValidationError[] = [];
    if (blueprint.meta.locked && blueprint.lifecycle.stage !== "FROZEN" && blueprint.lifecycle.stage !== "FINISHED") {
      errors.push({
        code: "VAL_002",
        section: "meta",
        severity: "fatal",
        message: `meta.locked but lifecycle is ${blueprint.lifecycle.stage}`,
      });
    }
    if (
      (blueprint.lifecycle.stage === "FROZEN" || blueprint.lifecycle.stage === "RENDERING") &&
      !blueprint.meta.locked
    ) {
      errors.push({
        code: "VAL_002",
        section: "meta",
        severity: "error",
        message: "FROZEN/RENDERING requires meta.locked",
      });
    }
    const passed = !errors.length;
    return { ...emptyResult(ValidationLevel.SCHEMA), errors, passed, score: passed ? 100 : 50 };
  },
};

/** VAL_003 — Decision / section dependencies */
export const VAL_003_DEPENDENCIES: ValidationRule = {
  id: "VAL_003",
  name: "Dependencies",
  priority: 3,
  level: ValidationLevel.ARCHITECTURE,
  category: "Architectural",
  parallelGroup: "arch-deps",
  validate(blueprint) {
    const errors: ValidationError[] = [];

    if (sectionAtLeast(blueprint, "scene", SectionState.READY)) {
      if (!sectionAtLeast(blueprint, "story", SectionState.READY)) {
        errors.push({
          code: "VAL_003",
          section: "scene",
          severity: "error",
          message: "Scene exists but Story is not READY",
        });
      }
    }

    if (sectionAtLeast(blueprint, "photography", SectionState.READY)) {
      if (!sectionAtLeast(blueprint, "scene", SectionState.READY)) {
        errors.push({
          code: "VAL_003",
          section: "photography",
          severity: "error",
          message: "Photography exists but Scene is not READY",
        });
      }
    }

    if (sectionAtLeast(blueprint, "composition", SectionState.READY)) {
      if (!sectionAtLeast(blueprint, "camera", SectionState.READY)) {
        errors.push({
          code: "VAL_003",
          section: "composition",
          severity: "error",
          message: "Composition exists but Camera is not READY",
        });
      }
    }

    const passed = !errors.some((e) => e.severity === "fatal" || e.severity === "error");
    return { ...emptyResult(ValidationLevel.ARCHITECTURE), errors, passed, score: passed ? 100 : 55 };
  },
};

/** VAL_004 — Camera */
export const VAL_004_CAMERA: ValidationRule = {
  id: "VAL_004",
  name: "Camera",
  priority: 4,
  level: ValidationLevel.ARCHITECTURE,
  category: "Architectural",
  parallelGroup: "arch-sections",
  validate(blueprint) {
    const errors: ValidationError[] = [];
    const result = SECTION_VALIDATORS.camera(blueprint);
    if (sectionAtLeast(blueprint, "camera", SectionState.DIRTY) && !result.ok) {
      for (const field of result.missing) {
        errors.push({
          code: "VAL_004",
          section: "camera",
          severity: "error",
          message: `Camera incomplete: ${field}`,
        });
      }
    }
    const passed = !errors.length;
    return { ...emptyResult(ValidationLevel.ARCHITECTURE), errors, passed, score: passed ? 100 : 70 };
  },
};

/** VAL_005 — Lighting + environment */
export const VAL_005_LIGHTING: ValidationRule = {
  id: "VAL_005",
  name: "Lighting",
  priority: 5,
  level: ValidationLevel.ARCHITECTURE,
  category: "Architectural",
  parallelGroup: "arch-sections",
  validate(blueprint) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (sectionAtLeast(blueprint, "lighting", SectionState.READY)) {
      if (!blueprint.scene?.environment) {
        errors.push({
          code: "VAL_005",
          section: "lighting",
          severity: "error",
          message: "Lighting exists but scene.environment is missing",
        });
      }
      const result = SECTION_VALIDATORS.lighting(blueprint);
      if (!result.ok) {
        for (const field of result.missing) {
          errors.push({
            code: "VAL_005",
            section: "lighting",
            severity: "error",
            message: `Lighting incomplete: ${field}`,
          });
        }
      }
      if (
        blueprint.scene.environment === "bathroom" &&
        blueprint.lighting.preset === "golden_hour"
      ) {
        warnings.push({
          code: "VAL_005",
          section: "lighting",
          message: "golden_hour lighting is atypical for bathroom",
        });
      }
    }

    const passed = !errors.length;
    return mergeResults(ValidationLevel.ARCHITECTURE, [
      { ...emptyResult(ValidationLevel.ARCHITECTURE), errors, warnings, passed, score: passed ? 100 : 65 },
    ]);
  },
};

/** VAL_006 — Composition */
export const VAL_006_COMPOSITION: ValidationRule = {
  id: "VAL_006",
  name: "Composition",
  priority: 6,
  level: ValidationLevel.ARCHITECTURE,
  category: "Architectural",
  parallelGroup: "arch-sections",
  validate(blueprint) {
    const errors: ValidationError[] = [];
    const result = SECTION_VALIDATORS.composition(blueprint);
    if (sectionAtLeast(blueprint, "composition", SectionState.DIRTY) && !result.ok) {
      for (const field of result.missing) {
        errors.push({
          code: "VAL_006",
          section: "composition",
          severity: "error",
          message: `Composition incomplete: ${field}`,
        });
      }
    }
    const passed = !errors.length;
    return { ...emptyResult(ValidationLevel.ARCHITECTURE), errors, passed, score: passed ? 100 : 70 };
  },
};

/** VAL_007 — Background */
export const VAL_007_BACKGROUND: ValidationRule = {
  id: "VAL_007",
  name: "Background",
  priority: 7,
  level: ValidationLevel.ARCHITECTURE,
  category: "Architectural",
  parallelGroup: "arch-sections",
  validate(blueprint) {
    const warnings: ValidationWarning[] = [];
    if (blueprint.background.decorDensity > 0.6) {
      warnings.push({
        code: "VAL_007",
        section: "background",
        message: "Background decor density is high — may clutter marketplace layout",
      });
    }
    return { ...emptyResult(ValidationLevel.ARCHITECTURE), warnings, passed: true, score: 95 };
  },
};

/** Business rules — environment + surface/material conflicts */
export const VAL_BUSINESS_SCENE_LOGIC: ValidationRule = {
  id: "VAL_BUSINESS",
  name: "Business Scene Logic",
  priority: 10,
  level: ValidationLevel.BUSINESS,
  category: "Business",
  validate(blueprint) {
    const errors: ValidationError[] = [];
    const { scene, materials } = blueprint;
    const surface = `${scene.surface} ${materials.floor} ${materials.walls}`.toLowerCase();

    if (scene.environment === "kitchen" && /snow|ice|frost/i.test(surface)) {
      errors.push({
        code: "VAL_BUSINESS",
        section: "scene",
        severity: "error",
        message: "Kitchen environment cannot include snow/ice surfaces",
      });
    }
    if (
      scene.environment === "bathroom" &&
      scene.timeOfDay === "sunset" &&
      /street|asphalt|road|outdoor/i.test(surface)
    ) {
      errors.push({
        code: "VAL_BUSINESS",
        section: "scene",
        severity: "error",
        message: "Bathroom cannot use sunset street outdoor surface",
      });
    }
    if (scene.environment === "studio" && /grass|lawn|meadow|outdoor/i.test(materials.floor)) {
      errors.push({
        code: "VAL_BUSINESS",
        section: "scene",
        severity: "error",
        message: "Studio environment cannot use outdoor grass floor",
      });
    }

    const passed = !errors.length;
    return { ...emptyResult(ValidationLevel.BUSINESS), errors, passed, score: passed ? 100 : 40 };
  },
};

/** VAL_008 — Professional layout */
export const VAL_008_PROFESSIONAL_LAYOUT: ValidationRule = {
  id: "VAL_008",
  name: "Professional Layout",
  priority: 20,
  level: ValidationLevel.PROFESSIONAL,
  category: "Professional",
  parallelGroup: "professional",
  validate(blueprint) {
    const warnings: ValidationWarning[] = [];
    const recommendations: string[] = [];
    const { composition, lighting } = blueprint;

    if (composition.negativeSpace < 0.2) {
      warnings.push({
        code: "VAL_008",
        section: "composition",
        message: "Negative space is below recommended threshold",
      });
      recommendations.push("Increase negativeSpace for headline/badge zones");
    }
    if (composition.heroWeight > 0.65) {
      warnings.push({
        code: "VAL_008",
        section: "composition",
        message: "Hero coverage is above recommended norm",
      });
    }
    if (composition.eyeFlow.length > 5) {
      warnings.push({
        code: "VAL_008",
        section: "composition",
        message: "Composition eye flow is overloaded",
      });
    }
    if (lighting.reflectionStrength > 0.7) {
      warnings.push({
        code: "VAL_008",
        section: "lighting",
        message: "Lighting is highly contrastive for marketplace cards",
      });
    }

    const penalty = warnings.length * 5;
    return {
      passed: true,
      score: Math.max(60, 100 - penalty),
      level: ValidationLevel.PROFESSIONAL,
      errors: [],
      warnings,
      recommendations,
    };
  },
};

/** VAL_009 — Marketplace constraints */
export const VAL_009_MARKETPLACE: ValidationRule = {
  id: "VAL_009",
  name: "Marketplace Constraints",
  priority: 21,
  level: ValidationLevel.PROFESSIONAL,
  category: "Professional",
  parallelGroup: "professional",
  validate(blueprint) {
    const warnings: ValidationWarning[] = [];
    const c = blueprint.constraints;
    if (!c.mustLeaveHeadlineSpace) {
      warnings.push({
        code: "VAL_009",
        section: "constraints",
        message: "Headline space not reserved",
      });
    }
    if (!c.mustAvoidText) {
      warnings.push({
        code: "VAL_009",
        section: "constraints",
        message: "mustAvoidText should be enabled for marketplace",
      });
    }
    return {
      passed: true,
      score: warnings.length ? 85 : 100,
      level: ValidationLevel.PROFESSIONAL,
      errors: [],
      warnings,
      recommendations: [],
    };
  },
};

/** VAL_010 — Architecture invariants (constitution) */
export const VAL_010_ARCHITECTURE_INVARIANTS: ValidationRule = {
  id: "VAL_010",
  name: "Architecture Invariants",
  priority: 30,
  level: ValidationLevel.ARCHITECTURE,
  category: "Architectural",
  validate(blueprint) {
    const errors: ValidationError[] = [];
    try {
      assertNoPromptStored(blueprint);
    } catch (e) {
      errors.push({
        code: "VAL_010",
        section: "render",
        severity: "fatal",
        message: e instanceof Error ? e.message : "Prompt stored in blueprint",
      });
    }
    if (!blueprint.scene.environment) {
      errors.push({
        code: "VAL_010",
        section: "scene",
        severity: "fatal",
        message: "scene.environment is the single environment source (Rule 001)",
      });
    }
    const passed = !errors.some((e) => e.severity === "fatal" || e.severity === "error");
    return { ...emptyResult(ValidationLevel.ARCHITECTURE), errors, passed, score: passed ? 100 : 0 };
  },
};

export const DEFAULT_VALIDATION_RULES: ValidationRule[] = [
  VAL_001_BLUEPRINT_STRUCTURE,
  VAL_002_LIFECYCLE,
  VAL_BUSINESS_SCENE_LOGIC,
  VAL_003_DEPENDENCIES,
  VAL_004_CAMERA,
  VAL_005_LIGHTING,
  VAL_006_COMPOSITION,
  VAL_007_BACKGROUND,
  VAL_010_ARCHITECTURE_INVARIANTS,
  VAL_008_PROFESSIONAL_LAYOUT,
  VAL_009_MARKETPLACE,
];
