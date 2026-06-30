/**
 * Chapter 6.9 — Photography Planning Stage engine.
 * Designs commercial photography before generation — strategy only, not final lighting/camera math.
 */
import { buildDefaultPipelineInput } from "./design-pipeline-engine";
import { runBusinessUnderstandingStage } from "./business-understanding-engine";
import { runKnowledgeRetrievalStage } from "./knowledge-retrieval-stage-engine";
import {
  applyContextPatch,
  PipelineContextSection,
  type GenerationPipelineContext,
} from "./pipeline-context-engine";
import {
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  buildProductAnalysisInputFromPipeline,
} from "./product-analysis-engine";
import type { BlueprintMutation } from "./mutation-types";
import { updatesToMutations } from "./universal-agent-bridge";
import {
  buildPhotographySection,
  COMMERCIAL_PHOTO_DIRECTOR_ID,
  PhotographyStyle,
  validatePhotographySection,
} from "./commercial-photo-director-engine";
import type { CommercialPhotoDirectorContext } from "./commercial-photo-director-types";
import { runCompositionPlanningStage } from "./composition-planning-stage-engine";
import { LayoutPattern } from "./composition-planning-stage-types";
import { SceneCategory } from "./scene-planning-stage-types";
import { runScenePlanningStage } from "./scene-planning-stage-engine";
import { StoryPattern } from "./visual-story-planning-stage-types";
import { runVisualStoryPlanningStage } from "./visual-story-planning-stage-engine";
import {
  CameraPreset,
  ExposurePreset,
  LensPreset,
  LightingPreset,
  PhotographyObjective,
  PhotographyPlanningStage,
  PlannedPhotographyStyle,
  type CameraPresetId,
  type ExposurePresetId,
  type LensPresetId,
  type LightingPresetId,
  type PhotographyObjectiveId,
  type PhotographyPlanningContext,
  type PhotographyPlanningFailureCode,
  type PhotographyPlanningInput,
  type PhotographyPlanningReport,
  type PhotographyPlanningSection,
  type PhotographyPlanningStageId,
  type PhotographyPlanningSystemReport,
  type PhotographyPlanningViolation,
  type PlannedPhotographyBlueprint,
  type PlannedPhotographyStyleId,
} from "./photography-planning-stage-types";

export {
  PhotographyPlanningStage,
  CameraPreset,
  LensPreset,
  LightingPreset,
  ExposurePreset,
  PlannedPhotographyStyle,
  PhotographyObjective,
  type PhotographyPlanningStageId,
  type CameraPresetId,
  type LensPresetId,
  type LightingPresetId,
  type ExposurePresetId,
  type PlannedPhotographyStyleId,
  type PhotographyObjectiveId,
  type PlannedPhotographyBlueprint,
  type PhotographyPlanningInput,
  type PhotographyPlanningSection,
  type PhotographyPlanningViolation,
  type PhotographyPlanningReport,
  type PhotographyPlanningContext,
  type PhotographyPlanningSystemReport,
  type PhotographyPlanningFailureCode,
} from "./photography-planning-stage-types";

export const PHOTOGRAPHY_PLANNING_VERSION = "6.9.0";

export const PHOTOGRAPHY_PLANNING_GOLDEN_RULE =
  "The buyer does not think about lens choice, exposure, or light setup — they instantly feel whether " +
  "the image looks professional. Photography Planning turns an abstract scene into technically flawless " +
  "commercial photography that builds trust, highlights product value, and rivals top product photographers.";

export const PHOTOGRAPHY_PLANNING_PIPELINE: readonly PhotographyPlanningStageId[] = [
  PhotographyPlanningStage.INPUT_ASSEMBLY,
  PhotographyPlanningStage.PHOTOGRAPHY_OBJECTIVE,
  PhotographyPlanningStage.CAMERA_SELECTION,
  PhotographyPlanningStage.LENS_SELECTION,
  PhotographyPlanningStage.CAMERA_ANGLE,
  PhotographyPlanningStage.CAMERA_DISTANCE,
  PhotographyPlanningStage.DEPTH_OF_FIELD,
  PhotographyPlanningStage.LIGHTING_STRATEGY,
  PhotographyPlanningStage.EXPOSURE_PLANNING,
  PhotographyPlanningStage.REFLECTION_STRATEGY,
  PhotographyPlanningStage.PHOTOGRAPHY_STYLE,
  PhotographyPlanningStage.BLUEPRINT_ASSEMBLY,
  PhotographyPlanningStage.PHYSICAL_REALISM,
  PhotographyPlanningStage.VALIDATION,
  PhotographyPlanningStage.AGENT_HANDOFF,
] as const;

export const PHOTOGRAPHY_PLANNING_POSITION = [
  "composition-planning",
  "photography-planning",
  "blueprint-assembly",
] as const;

const DEFAULT_OBJECTIVES: PhotographyObjectiveId[] = [
  PhotographyObjective.SHOW_PRODUCT_QUALITY,
  PhotographyObjective.SUPPORT_STORY,
  PhotographyObjective.BUILD_TRUST,
];

function violation(
  code: PhotographyPlanningFailureCode,
  message: string,
  stage?: PhotographyPlanningStageId,
): PhotographyPlanningViolation {
  return { code, message, stage };
}

function isGardenProduct(input: PhotographyPlanningInput): boolean {
  const sub = input.profile.subcategory.toLowerCase();
  const cat = input.profile.category.toLowerCase();
  return sub.includes("sprayer") || cat.includes("garden");
}

export function selectCameraPreset(input: PhotographyPlanningInput): CameraPresetId {
  if (input.story.storyPattern === StoryPattern.FEATURE_SHOWCASE) {
    return CameraPreset.TECHNICAL_DOCUMENTATION;
  }
  if (input.scene.sceneType === SceneCategory.OUTDOOR || input.scene.sceneType === SceneCategory.LIFESTYLE) {
    return CameraPreset.COMMERCIAL_LIFESTYLE;
  }
  if (input.story.storyPattern === StoryPattern.PREMIUM_EXPERIENCE) {
    return CameraPreset.STUDIO_PRODUCT;
  }
  return CameraPreset.COMMERCIAL_LIFESTYLE;
}

export function selectLens(input: PhotographyPlanningInput): LensPresetId {
  if (input.story.storyPattern === StoryPattern.PREMIUM_EXPERIENCE) {
    return LensPreset.LENS_85MM;
  }
  if (input.story.storyPattern === StoryPattern.FEATURE_SHOWCASE) {
    return LensPreset.LENS_100MM_MACRO;
  }
  if (isGardenProduct(input) || input.scene.sceneType === SceneCategory.OUTDOOR) {
    return LensPreset.LENS_35MM;
  }
  return LensPreset.LENS_50MM;
}

export function selectCameraAngle(input: PhotographyPlanningInput): string {
  if (input.story.storyPattern === StoryPattern.FEATURE_SHOWCASE) return "front";
  if (input.composition.layoutPattern === LayoutPattern.MARKETPLACE_SPLIT) return "three_quarter";
  if (input.story.storyPattern === StoryPattern.PREMIUM_EXPERIENCE) return "three_quarter";
  return "eye_level_three_quarter";
}

export function selectCameraHeight(input: PhotographyPlanningInput): string {
  if (input.story.storyPattern === StoryPattern.FEATURE_SHOWCASE) return "high";
  if (isGardenProduct(input)) return "eye_level";
  if (input.story.storyPattern === StoryPattern.PREMIUM_EXPERIENCE) return "eye_level";
  return "eye_level";
}

export function selectDepthOfField(input: PhotographyPlanningInput): string {
  if (input.story.storyPattern === StoryPattern.FEATURE_SHOWCASE) return "deep_sharp_throughout";
  if (input.story.storyPattern === StoryPattern.PREMIUM_EXPERIENCE) return "moderate_background_blur";
  if (isGardenProduct(input)) return "medium_product_sharp";
  return "medium_product_sharp";
}

export function selectLightingPreset(input: PhotographyPlanningInput): LightingPresetId {
  if (input.scene.timeOfDay === "golden_hour") return LightingPreset.GOLDEN_HOUR;
  if (input.scene.timeOfDay === "morning" && isGardenProduct(input)) return LightingPreset.WINDOW_LIGHT;
  if (input.story.storyPattern === StoryPattern.PREMIUM_EXPERIENCE) return LightingPreset.SOFT_DIFFUSED;
  if (input.story.storyPattern === StoryPattern.FEATURE_SHOWCASE) return LightingPreset.THREE_POINT;
  if (input.marketplace.toLowerCase().includes("wildberries")) return LightingPreset.PRODUCT_RIM_LIGHT;
  return LightingPreset.STUDIO_SOFTBOX;
}

export function selectExposure(input: PhotographyPlanningInput): ExposurePresetId {
  if (input.story.storyPattern === StoryPattern.PREMIUM_EXPERIENCE) return ExposurePreset.HIGH_KEY;
  if (input.story.storyPattern === StoryPattern.FEATURE_SHOWCASE) return ExposurePreset.BALANCED;
  return ExposurePreset.BALANCED;
}

export function selectReflectionStyle(input: PhotographyPlanningInput): string {
  const sub = input.profile.subcategory.toLowerCase();
  const cat = input.profile.category.toLowerCase();
  if (sub.includes("metal") || sub.includes("chrome") || cat.includes("appliance")) {
    return "controlled_specular_highlights";
  }
  if (sub.includes("glass") || sub.includes("blender")) return "subtle_glass_reflections";
  if (sub.includes("plastic") || sub.includes("sprayer")) return "soft_matte_plastic_highlights";
  if (input.story.storyPattern === StoryPattern.PREMIUM_EXPERIENCE) {
    return "premium_surface_gloss_with_soft_fill";
  }
  return "natural_contact_shadows_minimal_specular";
}

export function selectPhotographyStyle(input: PhotographyPlanningInput): PlannedPhotographyStyleId {
  if (isGardenProduct(input) || input.marketplace.toLowerCase().includes("wildberries")) {
    return PlannedPhotographyStyle.MODERN_MARKETPLACE;
  }
  if (input.story.storyPattern === StoryPattern.PREMIUM_EXPERIENCE) {
    return PlannedPhotographyStyle.PREMIUM_LIFESTYLE;
  }
  if (input.story.storyPattern === StoryPattern.FEATURE_SHOWCASE) {
    return PlannedPhotographyStyle.TECHNICAL_CATALOG;
  }
  if (input.story.storyPattern === StoryPattern.HERO_PRODUCT) {
    return PlannedPhotographyStyle.MINIMAL_PRODUCT;
  }
  return PlannedPhotographyStyle.STUDIO_COMMERCIAL;
}

export function buildPlannedPhotographyBlueprint(
  input: PhotographyPlanningInput,
  context: PhotographyPlanningContext = {},
): PlannedPhotographyBlueprint {
  if (context.randomCameraParams) {
    return {
      cameraPreset: "random_camera",
      lens: "unknown",
      cameraAngle: "random",
      cameraHeight: "random",
      depthOfField: "extreme_decorative_blur",
      lightingPreset: "",
      exposure: "random",
      whiteBalance: "random",
      shadowStyle: "harsh_artificial",
      reflectionStyle: "impossible_mirror",
    };
  }

  const lightingPreset = context.missingLightingStrategy ? "" : selectLightingPreset(input);

  return {
    cameraPreset: selectCameraPreset(input),
    lens: selectLens(input),
    cameraAngle: selectCameraAngle(input),
    cameraHeight: selectCameraHeight(input),
    depthOfField: context.heroLosesAdvantage ? "extreme_background_blur" : selectDepthOfField(input),
    lightingPreset,
    exposure: selectExposure(input),
    whiteBalance: input.scene.timeOfDay === "golden_hour" ? "warm_5500k" : "daylight_5600k",
    shadowStyle:
      input.story.storyPattern === StoryPattern.PREMIUM_EXPERIENCE
        ? "soft_contact_shadows"
        : "natural_soft_shadows",
    reflectionStyle: selectReflectionStyle(input),
  };
}

export function mapPlannedStyleToDirectorStoryType(storyPattern: string): string {
  switch (storyPattern) {
    case StoryPattern.PREMIUM_EXPERIENCE:
      return "premium_lifestyle";
    case StoryPattern.PROBLEM_SOLUTION:
      return "problem_solution";
    case StoryPattern.FEATURE_SHOWCASE:
      return "technology";
    case StoryPattern.HERO_PRODUCT:
      return "trust";
    default:
      return "lifestyle";
  }
}

export function buildCommercialPhotoDirectorContextFromPlanning(
  input: PhotographyPlanningInput,
): CommercialPhotoDirectorContext {
  const marketplace =
    input.marketplace.toLowerCase().includes("wildberries") ? "WB" : input.marketplace;

  return {
    productCategory: input.profile.category,
    subCategory: input.profile.subcategory,
    marketplace,
    creativeGoal: input.marketplace.toLowerCase().includes("wildberries") ? "CTR" : "Premium",
    priceSegment: input.profile.priceSegment,
    productCutout: true,
    storyType: mapPlannedStyleToDirectorStoryType(input.story.storyPattern),
    primaryEmotion: input.story.emotionalTone,
    commercialGoal: input.story.primaryMessage,
    storyHook: input.story.heroMoment,
    sceneType: input.scene.sceneType,
    environment: input.scene.environment,
    sceneLightingMood: input.scene.timeOfDay,
    layoutTemplateId: input.composition.layoutPattern,
    compositionTemplate: input.composition.layoutPattern,
  };
}

export function validatePlannedPhotographyBlueprint(
  planned: PlannedPhotographyBlueprint,
  input: PhotographyPlanningInput,
  context: PhotographyPlanningContext = {},
): PhotographyPlanningViolation[] {
  const violations: PhotographyPlanningViolation[] = [];

  if (context.randomCameraParams || planned.lens === "unknown" || planned.cameraPreset === "random_camera") {
    violations.push(
      violation("RANDOM_CAMERA_PARAMS", "Camera parameters must be story-driven", PhotographyPlanningStage.CAMERA_SELECTION),
    );
  }

  if (context.missingLightingStrategy || !planned.lightingPreset) {
    violations.push(
      violation(
        "MISSING_LIGHTING_STRATEGY",
        "Lighting strategy must be defined before handoff",
        PhotographyPlanningStage.LIGHTING_STRATEGY,
      ),
    );
  }

  if (context.artificialPhotography || planned.shadowStyle === "harsh_artificial") {
    violations.push(
      violation("ARTIFICIAL_PHOTOGRAPHY", "Photography must look professionally plausible", PhotographyPlanningStage.PHYSICAL_REALISM),
    );
  }

  if (context.heroLosesAdvantage || planned.depthOfField === "extreme_background_blur") {
    violations.push(
      violation(
        "HERO_LOSES_ADVANTAGE",
        "Depth of field must keep hero product visually dominant",
        PhotographyPlanningStage.DEPTH_OF_FIELD,
      ),
    );
  }

  if (context.perspectiveCompositionConflict) {
    violations.push(
      violation(
        "PERSPECTIVE_COMPOSITION_CONFLICT",
        "Camera perspective must align with composition blueprint",
        PhotographyPlanningStage.CAMERA_ANGLE,
      ),
    );
  }

  if (!planned.lens || !planned.cameraPreset) {
    violations.push(
      violation("RANDOM_CAMERA_PARAMS", "Lens and camera preset are required", PhotographyPlanningStage.LENS_SELECTION),
    );
  }

  if (!planned.cameraAngle || !planned.cameraHeight) {
    violations.push(
      violation("RANDOM_CAMERA_PARAMS", "Camera angle and height must be defined", PhotographyPlanningStage.CAMERA_ANGLE),
    );
  }

  const layoutWords = /\b(hero area|headline area|badge layout|safe zone|white space)\b/i;
  const serialized = JSON.stringify(planned);
  if (layoutWords.test(serialized)) {
    violations.push(
      violation(
        "DESIGN_DECISION_DETECTED",
        "Photography planning must not decide composition layout",
        PhotographyPlanningStage.BLUEPRINT_ASSEMBLY,
      ),
    );
  }

  if (
    input.composition.layoutPattern === LayoutPattern.MARKETPLACE_SPLIT &&
    planned.cameraAngle === "top_down" &&
    !context.perspectiveCompositionConflict
  ) {
    violations.push(
      violation(
        "PERSPECTIVE_COMPOSITION_CONFLICT",
        "Top-down angle conflicts with marketplace split hero composition",
        PhotographyPlanningStage.CAMERA_ANGLE,
      ),
    );
  }

  if (isGardenProduct(input) && planned.lens === LensPreset.LENS_100MM_MACRO) {
    violations.push(
      violation(
        "PERSPECTIVE_COMPOSITION_CONFLICT",
        "Macro lens is inappropriate for outdoor garden usage story",
        PhotographyPlanningStage.LENS_SELECTION,
      ),
    );
  }

  return violations;
}

export function runPhotographyPlanningStage(
  input: PhotographyPlanningInput,
  context: PhotographyPlanningContext = {},
): PhotographyPlanningReport {
  const started = Date.now();
  const stagesCompleted: PhotographyPlanningStageId[] = [];

  if (!input.profile?.category) {
    return {
      valid: false,
      violations: [violation("MISSING_PROFILE", "Product Profile is required", PhotographyPlanningStage.INPUT_ASSEMBLY)],
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }
  if (!input.story?.primaryMessage) {
    return {
      valid: false,
      violations: [violation("MISSING_STORY", "Story Blueprint is required", PhotographyPlanningStage.INPUT_ASSEMBLY)],
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }
  if (!input.scene?.location) {
    return {
      valid: false,
      violations: [violation("MISSING_SCENE", "Scene Blueprint is required", PhotographyPlanningStage.INPUT_ASSEMBLY)],
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }
  if (!input.composition?.layoutPattern) {
    return {
      valid: false,
      violations: [
        violation("MISSING_COMPOSITION", "Composition Blueprint is required", PhotographyPlanningStage.INPUT_ASSEMBLY),
      ],
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }

  stagesCompleted.push(PhotographyPlanningStage.INPUT_ASSEMBLY, PhotographyPlanningStage.PHOTOGRAPHY_OBJECTIVE);

  const planned = buildPlannedPhotographyBlueprint(input, context);
  const photographyStyle = selectPhotographyStyle(input);
  const cameraPreset = selectCameraPreset(input);

  stagesCompleted.push(
    PhotographyPlanningStage.CAMERA_SELECTION,
    PhotographyPlanningStage.LENS_SELECTION,
    PhotographyPlanningStage.CAMERA_ANGLE,
    PhotographyPlanningStage.CAMERA_DISTANCE,
    PhotographyPlanningStage.DEPTH_OF_FIELD,
    PhotographyPlanningStage.LIGHTING_STRATEGY,
    PhotographyPlanningStage.EXPOSURE_PLANNING,
    PhotographyPlanningStage.REFLECTION_STRATEGY,
    PhotographyPlanningStage.PHOTOGRAPHY_STYLE,
  );

  const directorCtx = buildCommercialPhotoDirectorContextFromPlanning(input);
  const { section: directorSection } = buildPhotographySection(directorCtx, 0.91);
  stagesCompleted.push(PhotographyPlanningStage.BLUEPRINT_ASSEMBLY);

  const renderPhotography = {
    ...directorSection.photographyBlueprint,
    cameraIntent: `${planned.lens} ${planned.cameraAngle} at ${planned.cameraHeight} — ${planned.depthOfField}`,
    lightingIntent: `${planned.lightingPreset} with ${planned.exposure} exposure`,
    materialIntent: planned.reflectionStyle,
    shootingNarrative: directorSection.shootingNarrative,
  };

  const violations = validatePlannedPhotographyBlueprint(planned, input, context);
  const directorValidation = validatePhotographySection(directorSection, directorCtx);
  if (!directorValidation.valid) {
    violations.push(
      ...directorValidation.violations.map((v) =>
        violation("DIRECTOR_VALIDATION_FAILED", v, PhotographyPlanningStage.VALIDATION),
      ),
    );
  }

  stagesCompleted.push(PhotographyPlanningStage.PHYSICAL_REALISM, PhotographyPlanningStage.VALIDATION);

  const section: PhotographyPlanningSection = {
    plannedBlueprint: planned,
    photographyStyle,
    cameraPreset,
    objectives: [...DEFAULT_OBJECTIVES],
    directorSection: { ...directorSection, photographyBlueprint: renderPhotography },
    renderPhotography,
    stagesCompleted,
    confidence: violations.length === 0 ? 0.94 : 0.4,
  };

  stagesCompleted.push(PhotographyPlanningStage.AGENT_HANDOFF);

  return {
    valid: violations.length === 0,
    violations,
    section,
    stagesCompleted,
    durationMs: Date.now() - started,
  };
}

export function photographyPlanningToMutations(
  section: PhotographyPlanningSection,
  revision = 0,
  reason = "Photography Planning Stage",
): BlueprintMutation[] {
  return updatesToMutations(
    { photography: section.renderPhotography },
    COMMERCIAL_PHOTO_DIRECTOR_ID,
    revision,
    reason,
  );
}

export function enrichPipelineContextWithPhotographyPlanning(
  ctx: GenerationPipelineContext,
  section: PhotographyPlanningSection,
): { context: GenerationPipelineContext; violations: PhotographyPlanningViolation[] } {
  const patch = applyContextPatch(ctx, {
    agentId: COMMERCIAL_PHOTO_DIRECTOR_ID,
    section: PipelineContextSection.TECHNICAL,
    blueprintSection: "photography",
    changes: {
      photography: {
        ...section.renderPhotography,
        cameraPreset: section.plannedBlueprint.cameraPreset,
        lens: section.plannedBlueprint.lens,
        lightingPreset: section.plannedBlueprint.lightingPreset,
      },
    },
    reason: "Photography Planning Stage enriched technical photography context",
  });

  return {
    context: {
      ...patch.context,
      blueprint: { ...patch.context.blueprint, photography: section.renderPhotography },
    },
    violations: patch.violations as PhotographyPlanningViolation[],
  };
}

function buildFullPlanningChainFromPipeline(context: PhotographyPlanningContext = {}) {
  const pipelineInput = buildDefaultPipelineInput();
  const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(pipelineInput));
  if (!analysis.section) return { error: "MISSING_PROFILE" as const };

  const knowledge = runKnowledgeRetrievalStage({
    profile: analysis.section.profile,
    marketplace: pipelineInput.marketplace,
    style: analysis.section.profile.priceSegment,
  });
  const business = runBusinessUnderstandingStage({
    profile: analysis.section.profile,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
    brand: pipelineInput.brand,
  });
  const story = runVisualStoryPlanningStage({
    profile: analysis.section.profile,
    business: business.section!,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
    brand: pipelineInput.brand,
  });
  const scene = runScenePlanningStage({
    profile: analysis.section.profile,
    business: business.section!,
    story: story.section!.plannedBlueprint,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
    brand: pipelineInput.brand,
  });
  const composition = runCompositionPlanningStage({
    profile: analysis.section.profile,
    business: business.section!,
    story: story.section!.plannedBlueprint,
    scene: scene.section!.plannedBlueprint,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
    brand: pipelineInput.brand,
  });

  if (!composition.section || !scene.section || !story.section || !knowledge.package) {
    return { error: "MISSING_COMPOSITION" as const };
  }

  return {
    input: {
      profile: analysis.section.profile,
      story: story.section.plannedBlueprint,
      scene: scene.section.plannedBlueprint,
      composition: composition.section.plannedBlueprint,
      knowledge: knowledge.package,
      marketplace: pipelineInput.marketplace,
      brand: pipelineInput.brand,
    } satisfies PhotographyPlanningInput,
    context,
  };
}

export function runPhotographyPlanningStageFromPipeline(
  context: PhotographyPlanningContext = {},
): PhotographyPlanningReport {
  const chain = buildFullPlanningChainFromPipeline(context);
  if ("error" in chain) {
    return {
      valid: false,
      violations: [
        violation(
          chain.error === "MISSING_PROFILE" ? "MISSING_PROFILE" : "MISSING_COMPOSITION",
          "Upstream pipeline stages must complete before Photography Planning",
        ),
      ],
      stagesCompleted: [],
      durationMs: 0,
    };
  }
  return runPhotographyPlanningStage(chain.input, chain.context);
}

export function validatePhotographyPlanning(
  context: PhotographyPlanningContext = {},
): PhotographyPlanningSystemReport {
  const violations: PhotographyPlanningViolation[] = [];

  const kitchen = runPhotographyPlanningStageFromPipeline(context);
  if (!kitchen.valid || !kitchen.section) {
    violations.push(...kitchen.violations);
  } else {
    if (kitchen.section.plannedBlueprint.lens !== LensPreset.LENS_85MM) {
      violations.push(violation("RANDOM_CAMERA_PARAMS", "Premium kitchen must use 85mm lens"));
    }
    if (kitchen.section.photographyStyle !== PlannedPhotographyStyle.PREMIUM_LIFESTYLE) {
      violations.push(violation("ARTIFICIAL_PHOTOGRAPHY", "Premium kitchen must use premium lifestyle style"));
    }
  }

  const gardenAnalysis = analyzeProduct(
    buildDefaultProductAnalysisInput({
      category: "garden_tools",
      marketplace: "wildberries",
      businessGoal: "Increase CTR",
    }),
  );
  const gardenKnowledge = runKnowledgeRetrievalStage({
    profile: gardenAnalysis.section!.profile,
    marketplace: "wildberries",
  });
  const gardenBusiness = runBusinessUnderstandingStage({
    profile: gardenAnalysis.section!.profile,
    knowledge: gardenKnowledge.package!,
    marketplace: "wildberries",
  });
  const gardenStory = runVisualStoryPlanningStage({
    profile: gardenAnalysis.section!.profile,
    business: gardenBusiness.section!,
    knowledge: gardenKnowledge.package!,
    marketplace: "wildberries",
  });
  const gardenScene = runScenePlanningStage({
    profile: gardenAnalysis.section!.profile,
    business: gardenBusiness.section!,
    story: gardenStory.section!.plannedBlueprint,
    knowledge: gardenKnowledge.package!,
    marketplace: "wildberries",
  });
  const gardenComposition = runCompositionPlanningStage({
    profile: gardenAnalysis.section!.profile,
    business: gardenBusiness.section!,
    story: gardenStory.section!.plannedBlueprint,
    scene: gardenScene.section!.plannedBlueprint,
    knowledge: gardenKnowledge.package!,
    marketplace: "wildberries",
  });
  const garden = runPhotographyPlanningStage(
    {
      profile: gardenAnalysis.section!.profile,
      story: gardenStory.section!.plannedBlueprint,
      scene: gardenScene.section!.plannedBlueprint,
      composition: gardenComposition.section!.plannedBlueprint,
      knowledge: gardenKnowledge.package!,
      marketplace: "wildberries",
    },
    context,
  );
  if (!garden.valid || !garden.section) {
    violations.push(...garden.violations);
  } else {
    if (garden.section.photographyStyle !== PlannedPhotographyStyle.MODERN_MARKETPLACE) {
      violations.push(violation("ARTIFICIAL_PHOTOGRAPHY", "Garden wildberries must use modern marketplace photography"));
    }
    if (garden.section.plannedBlueprint.lens !== LensPreset.LENS_35MM) {
      violations.push(violation("RANDOM_CAMERA_PARAMS", "Garden lifestyle must use 35mm lens"));
    }
    if (!garden.section.plannedBlueprint.lightingPreset) {
      violations.push(violation("MISSING_LIGHTING_STRATEGY", "Garden photography must define lighting strategy"));
    }
    if (garden.section.directorSection.photographyStyle !== PhotographyStyle.MODERN_MARKETPLACE) {
      violations.push(violation("DIRECTOR_VALIDATION_FAILED", "Director must align with marketplace photography"));
    }
  }

  const random = runPhotographyPlanningStage(
    {
      profile: gardenAnalysis.section!.profile,
      story: gardenStory.section!.plannedBlueprint,
      scene: gardenScene.section!.plannedBlueprint,
      composition: gardenComposition.section!.plannedBlueprint,
      knowledge: gardenKnowledge.package!,
      marketplace: "wildberries",
    },
    { randomCameraParams: true },
  );
  if (random.valid) {
    violations.push(violation("RANDOM_CAMERA_PARAMS", "Random camera parameters must fail validation"));
  }

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    storySupported: !!garden.section && !!kitchen.section,
    physicallyPlausible: !!garden.section?.plannedBlueprint.shadowStyle,
    lightingStrategyDefined: !!garden.section?.plannedBlueprint.lightingPreset,
    heroAdvantageMaintained: garden.section?.plannedBlueprint.depthOfField !== "extreme_background_blur",
    downstreamReady: !!garden.section?.renderPhotography.shootingNarrative,
  };
}

export function assertPhotographyPlanning(
  context: PhotographyPlanningContext = {},
): PhotographyPlanningSystemReport {
  const report = validatePhotographyPlanning(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Photography Planning validation failed: ${messages}`);
  }
  return report;
}

export function runPhotographyPlanning(
  context: PhotographyPlanningContext = {},
): PhotographyPlanningSystemReport {
  return validatePhotographyPlanning(context);
}

export function isPhotographyPlanningFailure(code: string): code is PhotographyPlanningFailureCode {
  const codes: PhotographyPlanningFailureCode[] = [
    "MISSING_PROFILE",
    "MISSING_STORY",
    "MISSING_SCENE",
    "MISSING_COMPOSITION",
    "RANDOM_CAMERA_PARAMS",
    "PERSPECTIVE_COMPOSITION_CONFLICT",
    "ARTIFICIAL_PHOTOGRAPHY",
    "MISSING_LIGHTING_STRATEGY",
    "HERO_LOSES_ADVANTAGE",
    "DESIGN_DECISION_DETECTED",
    "DIRECTOR_VALIDATION_FAILED",
  ];
  return codes.includes(code as PhotographyPlanningFailureCode);
}
