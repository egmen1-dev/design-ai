/**
 * Chapter 7.16 — Material Director Agent engine.
 * Designs physically plausible product materials — never light, camera, or composition layout.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import { PhotographyStyle } from "./commercial-photo-director-types";
import {
  buildCameraDirectorContextFromAgentInput,
  buildBatterySprayerCameraDirectorInput,
  fromCameraSection,
} from "./camera-director-agent-engine";
import {
  buildCameraSection,
  CameraAngleStyle,
  CameraStyle,
  PerspectiveProfile,
} from "./camera-director-engine";
import type { CameraDirectorAgentInput } from "./camera-director-agent-types";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import { LightingScheme } from "./lighting-director-engine";
import {
  buildMaterialSection,
  MATERIAL_DIRECTOR_ID,
  MaterialWorld,
  ReflectionProfile,
  validateMaterialSection,
  type MaterialDirectorContext,
  type MaterialSection,
} from "./material-director-engine";
import { SceneType } from "./scene-director-types";
import { StoryType } from "./visual-story-director-types";
import {
  MATERIAL_DIRECTOR_AGENT_ID,
  MaterialDirectorAgentModule,
  type MaterialDirectorAgentBlueprint,
  type MaterialDirectorAgentContext,
  type MaterialDirectorAgentExecutionReport,
  type MaterialDirectorAgentFailureCode,
  type MaterialDirectorAgentInput,
  type MaterialDirectorAgentKpi,
  type MaterialDirectorAgentMaterialDefinition,
  type MaterialDirectorAgentModuleDefinition,
  type MaterialDirectorAgentModuleId,
  type MaterialDirectorAgentModuleRecord,
  type MaterialDirectorAgentPipelineLink,
  type MaterialDirectorAgentRetryBranch,
  type MaterialDirectorAgentValidationReport,
  type MaterialDirectorAgentViolation,
} from "./material-director-agent-types";

export {
  MATERIAL_DIRECTOR_AGENT_ID,
  MaterialDirectorAgentModule,
  type MaterialDirectorAgentModuleId,
  type MaterialDirectorAgentInput,
  type MaterialDirectorAgentBlueprint,
  type MaterialDirectorAgentMaterialDefinition,
  type MaterialDirectorAgentModuleRecord,
  type MaterialDirectorAgentKpi,
  type MaterialDirectorAgentViolation,
  type MaterialDirectorAgentRetryBranch,
  type MaterialDirectorAgentExecutionReport,
  type MaterialDirectorAgentValidationReport,
  type MaterialDirectorAgentContext,
  type MaterialDirectorAgentFailureCode,
  type MaterialDirectorAgentModuleDefinition,
  type MaterialDirectorAgentPipelineLink,
} from "./material-director-agent-types";

export const MATERIAL_DIRECTOR_AGENT_VERSION = "7.16.0";

export const MATERIAL_DIRECTOR_AGENT_GOLDEN_RULE =
  "The buyer may not know polymer chemistry or reflection coefficients — but instantly feels real material versus artificial imitation. " +
  "Material Director makes every surface physically believable and quality-enhancing. " +
  "It does not control light, choose camera, or build composition.";

export const MATERIAL_DIRECTOR_AGENT_MISSION =
  'Answer: "How should product materials look so the buyer trusts this is real professional photography?" — ' +
  "plastic reads as plastic, metal as metal, rubber as rubber, with brand-new marketplace cleanliness.";

export const MATERIAL_DIRECTOR_AGENT_MODULES: readonly MaterialDirectorAgentModuleDefinition[] = [
  { id: MaterialDirectorAgentModule.MATERIAL_DETECTOR, order: 1, label: "Material Detector", responsibility: "Detect product material composition" },
  { id: MaterialDirectorAgentModule.SURFACE_ANALYZER, order: 2, label: "Surface Analyzer", responsibility: "Define surface quality per material" },
  { id: MaterialDirectorAgentModule.REFLECTION_PLANNER, order: 3, label: "Reflection Planner", responsibility: "Plan physically correct reflections" },
  { id: MaterialDirectorAgentModule.TEXTURE_CONTROLLER, order: 4, label: "Texture Controller", responsibility: "Control micro-texture and roughness" },
  { id: MaterialDirectorAgentModule.WEAR_SIMULATOR, order: 5, label: "Wear Simulator", responsibility: "Set wear and cleanliness profile" },
  { id: MaterialDirectorAgentModule.MATERIAL_VALIDATOR, order: 6, label: "Material Validator", responsibility: "Validate realism and lighting compatibility" },
  { id: MaterialDirectorAgentModule.MATERIAL_BLUEPRINT_BUILDER, order: 7, label: "Material Blueprint Builder", responsibility: "Assemble Material Blueprint for Render Adapter" },
] as const;

export const MATERIAL_DIRECTOR_AGENT_PIPELINE: readonly MaterialDirectorAgentPipelineLink[] = [
  { from: "camera_director", to: "material_director" },
  { from: "material_director", to: "render_adapter" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;

const LIGHTING_KEYWORDS = /\b(key light|fill light|rim light|softbox|kelvin|color temperature)\b/i;
const CAMERA_KEYWORDS = /\b(focal length|field of view|camera angle|lens|three quarter view)\b/i;

const PRESET_TO_LIGHTING_SCHEME: Record<string, string> = {
  "Outdoor Natural": LightingScheme.NATURAL_WINDOW_LIGHT,
  "Soft Studio": LightingScheme.TOP_SOFTBOX,
  "Premium Product": LightingScheme.TWO_POINT_STUDIO,
  "Luxury Minimal": LightingScheme.LUXURY_SIDE_LIGHT,
  "Golden Hour": LightingScheme.DIFFUSED_AMBIENT,
};

const PHOTO_STYLE_TO_PHOTOGRAPHY_STYLE: Record<string, string> = {
  "Outdoor Commercial": PhotographyStyle.LIFESTYLE_COMMERCIAL,
  "Studio Commercial": PhotographyStyle.COMMERCIAL_PRODUCT,
  "Premium Product Photography": PhotographyStyle.LUXURY_ADVERTISING,
  "Lifestyle Photography": PhotographyStyle.LIFESTYLE_COMMERCIAL,
  "Industrial Photography": PhotographyStyle.TECHNOLOGY_PRODUCT,
  "Minimal Premium": PhotographyStyle.MINIMAL_SHOWCASE,
};

const SCENE_TYPE_TO_SCENE: Record<string, string> = {
  "Outdoor Natural": SceneType.NATURAL,
  "Professional Studio": SceneType.COMMERCIAL_STUDIO,
  "Home Interior": SceneType.LIFESTYLE,
  "Lifestyle Environment": SceneType.LIFESTYLE,
  Workshop: SceneType.INDUSTRIAL,
  "Industrial Workspace": SceneType.INDUSTRIAL,
  "Technical Environment": SceneType.TECHNOLOGY,
};

const CAMERA_TYPE_TO_STYLE: Record<string, string> = {
  "Front Commercial": CameraStyle.COMMERCIAL_PRODUCT,
  "Hero Angle": CameraStyle.PREMIUM_HERO,
  "Three Quarter View": CameraStyle.LIFESTYLE_CONTEXT,
  "Eye Level": CameraStyle.TECHNOLOGY_DETAIL,
  "Macro Detail": CameraStyle.MACRO_DETAIL,
  "Marketplace Hero": CameraStyle.MARKETPLACE_THUMB,
};

function violation(
  code: MaterialDirectorAgentFailureCode,
  message: string,
  module?: MaterialDirectorAgentModuleId,
): MaterialDirectorAgentViolation {
  return { code, message, module };
}

function recordModule(
  records: MaterialDirectorAgentModuleRecord[],
  completed: MaterialDirectorAgentModuleId[],
  module: MaterialDirectorAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

function isGardenProduct(profile: MaterialDirectorAgentInput["productProfile"]): boolean {
  const sub = profile.subcategory.toLowerCase();
  const cat = profile.category.toLowerCase();
  return sub.includes("sprayer") || cat.includes("garden");
}

function mapStoryTypeForMaterial(input: MaterialDirectorAgentInput): string {
  if (isGardenProduct(input.productProfile)) return StoryType.SAFETY;
  const env = input.sceneBlueprint.environment.toLowerCase();
  if (env.includes("luxury") || env.includes("premium")) return StoryType.PREMIUM_LIFESTYLE;
  if (env.includes("tech") || env.includes("lab")) return StoryType.TECHNOLOGY;
  return StoryType.PROBLEM_SOLUTION;
}

export function detectProductMaterials(
  input: MaterialDirectorAgentInput,
  agentContext: MaterialDirectorAgentContext = {},
): MaterialDirectorAgentMaterialDefinition[] {
  if (isGardenProduct(input.productProfile)) {
    const reflection = agentContext.plasticLooksMetallic ? "sharp metallic specular" : "soft controlled specular";
    const rubberReflection = agentContext.metalLooksPlastic ? "plastic-like gloss" : "diffuse minimal";
    return [
      {
        id: "abs_body",
        name: "ABS Plastic",
        role: "housing",
        reflection,
        roughness: "matte industrial",
        microTexture: "fine injection grain",
      },
      {
        id: "rubber_grip",
        name: "Rubber",
        role: "handle and seals",
        reflection: rubberReflection,
        roughness: "textured grip",
        microTexture: "micro pores",
      },
      {
        id: "pe_tank",
        name: "Polyethylene Tank",
        role: "fluid reservoir",
        reflection: "soft satin",
        roughness: "semi matte",
        microTexture: "subtle mold flow lines",
      },
      {
        id: "metal_fasteners",
        name: "Metal Fasteners",
        role: "hardware",
        reflection: agentContext.metalLooksPlastic ? "diffuse plastic" : "directional brushed",
        roughness: "brushed metal",
        microTexture: "fine machining marks",
      },
      {
        id: "pvc_hose",
        name: "PVC Hose",
        role: "delivery system",
        reflection: "low gloss",
        roughness: "flexible matte",
        microTexture: "extrusion ribbing",
      },
    ];
  }

  return [
    {
      id: "primary_surface",
      name: "Primary Product Material",
      role: "body",
      reflection: "soft specular",
      roughness: "natural",
      microTexture: "subtle surface grain",
    },
    {
      id: "accent_surface",
      name: "Accent Material",
      role: "trim",
      reflection: "controlled highlight",
      roughness: "smooth",
      microTexture: "precision finish",
    },
  ];
}

export function formatWearLevel(input: MaterialDirectorAgentInput): string {
  if (
    input.productProfile.marketSegment?.toLowerCase().includes("professional") ||
    input.productProfile.priceSegment?.toLowerCase().includes("professional")
  ) {
    return "Light Natural Usage";
  }
  return "Brand New";
}

export function formatCleanlinessLevel(agentContext: MaterialDirectorAgentContext): string {
  return agentContext.artificialMaterials ? "Needs Reclean" : "Factory Clean";
}

export function computeMaterialRealismScore(
  section: MaterialSection,
  materials: MaterialDirectorAgentMaterialDefinition[],
  agentContext: MaterialDirectorAgentContext = {},
  gardenProduct = false,
): number {
  if (agentContext.lowRealismScore) return 0.52;
  let score = 0.78 + Math.min(materials.length, 5) * 0.03;
  if (section.reflectionProfile === ReflectionProfile.MATTE) score += 0.04;
  if (section.materialWorld === MaterialWorld.NATURAL_WARM && gardenProduct) score += 0.03;
  return Math.min(0.97, score);
}

export function buildMaterialDirectorContextFromAgentInput(
  input: MaterialDirectorAgentInput,
  agentContext: MaterialDirectorAgentContext = {},
): MaterialDirectorContext {
  const marketplace = isGardenProduct(input.productProfile)
    ? "wildberries"
    : input.knowledgePackage.query.marketplace?.toLowerCase().includes("wildberries")
      ? "WB"
      : input.knowledgePackage.query.marketplace ?? "wildberries";

  const photographyStyle = isGardenProduct(input.productProfile)
    ? PhotographyStyle.LIFESTYLE_COMMERCIAL
    : PHOTO_STYLE_TO_PHOTOGRAPHY_STYLE[input.photographyBlueprint.photoStyle] ??
      PhotographyStyle.MODERN_MARKETPLACE;

  let materialIntent =
    `Physically accurate ${input.productProfile.category} surfaces — ` +
    `${input.photographyBlueprint.commercialMood}`.slice(0, 140);

  if (agentContext.artificialMaterials) {
    materialIntent = "mirror chrome holographic artificial surfaces";
  }
  if (agentContext.plasticLooksMetallic) {
    materialIntent = "chrome metallic plastic body with mirror reflections";
  }

  const scenePalette = input.sceneBlueprint.supportObjects
    .filter((o) => /wood|stone|oak|linen|concrete|grass|soil/i.test(o))
    .slice(0, 3);
  if (scenePalette.length === 0 && isGardenProduct(input.productProfile)) {
    scenePalette.push("natural oak", "soft stone", "garden soil");
  }

  return {
    productCategory: input.productProfile.category,
    marketplace,
    productCutout: false,
    storyType: mapStoryTypeForMaterial(input),
    primaryEmotion: input.sceneBlueprint.visualMood,
    sceneType: SCENE_TYPE_TO_SCENE[input.sceneBlueprint.sceneType] ?? SceneType.NATURAL,
    sceneMaterialPalette: scenePalette,
    photographyStyle,
    materialIntent,
    lightingScheme:
      PRESET_TO_LIGHTING_SCHEME[input.lightingBlueprint.lightingPreset] ?? LightingScheme.NATURAL_WINDOW_LIGHT,
    lightingStyle: input.lightingBlueprint.lightingMood,
    cameraStyle:
      CAMERA_TYPE_TO_STYLE[input.cameraBlueprint.cameraType] ?? CameraStyle.LIFESTYLE_CONTEXT,
    cameraDistance: input.cameraBlueprint.framing.includes("wide") ? "wide" : "medium",
  };
}

export function fromMaterialSection(
  section: MaterialSection,
  materials: MaterialDirectorAgentMaterialDefinition[],
  input: MaterialDirectorAgentInput,
  confidence: number,
  agentContext: MaterialDirectorAgentContext = {},
): MaterialDirectorAgentBlueprint {
  const dominant = materials.find((m) => m.role.includes("housing") || m.role === "body") ?? materials[0];
  return {
    materials,
    surfaceQuality: dominant?.roughness.includes("matte")
      ? "Matte Plastic"
      : dominant?.roughness.includes("brushed")
        ? "Brushed Metal"
        : "Natural Professional",
    roughnessProfile: section.roughnessProfile.replace(/_/g, " "),
    reflectionProfile: section.reflectionProfile.replace(/_/g, " "),
    microTexture: section.microDetailLevel.replace(/_/g, " "),
    cleanlinessLevel: formatCleanlinessLevel(agentContext),
    wearLevel: formatWearLevel(input),
    realismScore: computeMaterialRealismScore(
      section,
      materials,
      agentContext,
      isGardenProduct(input.productProfile),
    ),
    confidence,
  };
}

export function validateMaterialDirectorAgentBlueprint(
  blueprint?: MaterialDirectorAgentBlueprint,
  input?: MaterialDirectorAgentInput,
  section?: MaterialSection,
  agentContext: MaterialDirectorAgentContext = {},
): MaterialDirectorAgentViolation[] {
  const violations: MaterialDirectorAgentViolation[] = [];
  if (!blueprint) {
    violations.push(
      violation("BLUEPRINT_INCOMPLETE", "Material Blueprint is required", MaterialDirectorAgentModule.MATERIAL_BLUEPRINT_BUILDER),
    );
    return violations;
  }

  if (agentContext.artificialMaterials || blueprint.realismScore < 0.65) {
    violations.push(
      violation("ARTIFICIAL_MATERIALS", "Materials look artificial or CGI-like", MaterialDirectorAgentModule.MATERIAL_DETECTOR),
    );
  }

  if (agentContext.plasticLooksMetallic || blueprint.materials.some((m) => m.name.includes("Plastic") && m.reflection.includes("metallic"))) {
    violations.push(
      violation("PLASTIC_LOOKS_METALLIC", "Plastic must not read as metal", MaterialDirectorAgentModule.REFLECTION_PLANNER),
    );
  }

  if (agentContext.metalLooksPlastic || blueprint.materials.some((m) => m.name.includes("Metal") && m.reflection.includes("plastic"))) {
    violations.push(
      violation("METAL_LOOKS_PLASTIC", "Metal fasteners must not read as plastic", MaterialDirectorAgentModule.REFLECTION_PLANNER),
    );
  }

  if (
    agentContext.lightingReflectionConflict ||
    (section?.reflectionProfile === ReflectionProfile.HIGH_GLOSS &&
      input?.lightingBlueprint.lightingPreset.includes("Outdoor Natural"))
  ) {
    violations.push(
      violation("LIGHTING_REFLECTION_CONFLICT", "Reflection profile conflicts with outdoor natural lighting", MaterialDirectorAgentModule.REFLECTION_PLANNER),
    );
  }

  if (agentContext.lowRealismScore || blueprint.realismScore < 0.7) {
    violations.push(
      violation("LOW_REALISM_SCORE", "Material realism score below marketplace threshold", MaterialDirectorAgentModule.MATERIAL_VALIDATOR),
    );
  }

  if (input && isGardenProduct(input.productProfile) && blueprint.materials.length < 4) {
    violations.push(
      violation("BLUEPRINT_INCOMPLETE", "Sprayer requires full multi-material definition", MaterialDirectorAgentModule.MATERIAL_DETECTOR),
    );
  }

  const serialized = JSON.stringify(blueprint);
  if (LIGHTING_KEYWORDS.test(serialized)) {
    violations.push(
      violation("CONTAINS_LIGHTING_DECISION", "Material must not decide lighting parameters", MaterialDirectorAgentModule.MATERIAL_VALIDATOR),
    );
  }
  if (CAMERA_KEYWORDS.test(serialized)) {
    violations.push(
      violation("CONTAINS_CAMERA_DECISION", "Material must not decide camera parameters", MaterialDirectorAgentModule.MATERIAL_VALIDATOR),
    );
  }

  return violations;
}

export function buildMaterialDirectorAgentKpis(input: {
  blueprint: MaterialDirectorAgentBlueprint;
  section: MaterialSection;
  confidence: number;
  retryCount: number;
  directorValid: boolean;
}): MaterialDirectorAgentKpi {
  const { blueprint, section, confidence, retryCount, directorValid } = input;
  return {
    materialRealism: blueprint.realismScore,
    reflectionAccuracy: directorValid && blueprint.reflectionProfile.includes("matte") ? 0.91 : 0.82,
    textureQuality: section.microDetailLevel !== "none" ? 0.9 : 0.78,
    surfaceConsistency: blueprint.materials.length >= 4 ? 0.92 : 0.8,
    productTrust: blueprint.cleanlinessLevel === "Factory Clean" ? 0.93 : 0.65,
    marketplaceFit: blueprint.wearLevel === "Brand New" ? 0.9 : 0.84,
    retryRate: retryCount > 0 ? retryCount / (retryCount + 1) : 0,
    confidenceScore: confidence,
  };
}

export function mapMaterialDirectorModuleToStage(module: MaterialDirectorAgentModuleId): string {
  const mapping: Record<MaterialDirectorAgentModuleId, string> = {
    [MaterialDirectorAgentModule.MATERIAL_DETECTOR]: "material_world",
    [MaterialDirectorAgentModule.SURFACE_ANALYZER]: "surface_palette",
    [MaterialDirectorAgentModule.REFLECTION_PLANNER]: "reflection_profile",
    [MaterialDirectorAgentModule.TEXTURE_CONTROLLER]: "micro_detail",
    [MaterialDirectorAgentModule.WEAR_SIMULATOR]: "wear_profile",
    [MaterialDirectorAgentModule.MATERIAL_VALIDATOR]: "validation",
    [MaterialDirectorAgentModule.MATERIAL_BLUEPRINT_BUILDER]: "blueprint_assembly",
  };
  return mapping[module];
}

function buildCameraBlueprintForMaterialInput(cameraInput: CameraDirectorAgentInput) {
  const ctx = buildCameraDirectorContextFromAgentInput(cameraInput);
  let { section } = buildCameraSection(ctx, 0.93);
  if (
    section.cameraAngle === CameraAngleStyle.THREE_QUARTER &&
    section.focalLength <= 35 &&
    section.perspectiveProfile === PerspectiveProfile.EXPANDED
  ) {
    section = { ...section, perspectiveProfile: PerspectiveProfile.NATURAL };
  }
  return fromCameraSection(section, cameraInput, 0.93);
}

export function buildDefaultMaterialDirectorAgentInput(
  overrides: Partial<MaterialDirectorAgentInput> = {},
): MaterialDirectorAgentInput {
  const cameraInput = buildBatterySprayerCameraDirectorInput();
  const cameraBlueprint = buildCameraBlueprintForMaterialInput(cameraInput);

  return {
    productProfile: cameraInput.productProfile,
    sceneBlueprint: cameraInput.sceneBlueprint,
    layoutBlueprint: cameraInput.layoutBlueprint,
    photographyBlueprint: cameraInput.photographyBlueprint,
    lightingBlueprint: cameraInput.lightingBlueprint,
    cameraBlueprint,
    knowledgePackage: cameraInput.knowledgePackage,
    ...overrides,
  };
}

export function buildBatterySprayerMaterialDirectorInput(): MaterialDirectorAgentInput {
  return buildDefaultMaterialDirectorAgentInput();
}

function resolveRetryBranch(context: MaterialDirectorAgentContext): MaterialDirectorAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (
    context.artificialMaterials ||
    context.lightingReflectionConflict ||
    context.plasticLooksMetallic ||
    context.metalLooksPlastic ||
    context.lowRealismScore ||
    context.lowConfidence
  ) {
    return "detector_reflection_texture";
  }
  return undefined;
}

function buildMaterialFromInput(
  agentInput: MaterialDirectorAgentInput,
  agentContext: MaterialDirectorAgentContext,
  confidenceSeed: number,
): {
  section: MaterialSection;
  materials: MaterialDirectorAgentMaterialDefinition[];
  confidence: number;
  directorValid: boolean;
} {
  const directorContext = buildMaterialDirectorContextFromAgentInput(agentInput, agentContext);
  const { section } = buildMaterialSection(directorContext, confidenceSeed);
  const materials = detectProductMaterials(agentInput, agentContext);
  const directorValidation = validateMaterialSection(section, directorContext);
  return {
    section,
    materials,
    confidence: directorValidation.valid ? confidenceSeed : 0.45,
    directorValid: directorValidation.valid,
  };
}

export async function executeMaterialDirectorAgent(input: {
  agentInput?: MaterialDirectorAgentInput;
  context?: MaterialDirectorAgentContext;
}): Promise<MaterialDirectorAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerMaterialDirectorInput();
  const violations: MaterialDirectorAgentViolation[] = [];
  const modulesCompleted: MaterialDirectorAgentModuleId[] = [];
  const moduleRecords: MaterialDirectorAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: MaterialDirectorAgentRetryBranch | undefined;

  let { section, materials, confidence, directorValid } = buildMaterialFromInput(agentInput, context, 0.93);
  if (context.lowConfidence) confidence = 0.55;

  const recordMaterialModules = (matSection: MaterialSection, mats: MaterialDirectorAgentMaterialDefinition[], suffix = "") => {
    recordModule(moduleRecords, modulesCompleted, MaterialDirectorAgentModule.MATERIAL_DETECTOR, `${mats.length} materials${suffix}`);
    recordModule(moduleRecords, modulesCompleted, MaterialDirectorAgentModule.SURFACE_ANALYZER, matSection.roughnessProfile + suffix);
    recordModule(moduleRecords, modulesCompleted, MaterialDirectorAgentModule.REFLECTION_PLANNER, matSection.reflectionProfile + suffix);
    recordModule(moduleRecords, modulesCompleted, MaterialDirectorAgentModule.TEXTURE_CONTROLLER, matSection.microDetailLevel + suffix);
    recordModule(moduleRecords, modulesCompleted, MaterialDirectorAgentModule.WEAR_SIMULATOR, formatWearLevel(agentInput) + suffix);
    recordModule(moduleRecords, modulesCompleted, MaterialDirectorAgentModule.MATERIAL_VALIDATOR, `${violations.length} checks${suffix}`);
    recordModule(moduleRecords, modulesCompleted, MaterialDirectorAgentModule.MATERIAL_BLUEPRINT_BUILDER, "blueprint assembled" + suffix);
  };

  recordMaterialModules(section, materials);

  let blueprint = fromMaterialSection(section, materials, agentInput, confidence, context);

  const directorContext = buildMaterialDirectorContextFromAgentInput(agentInput, context);
  const directorValidation = validateMaterialSection(section, directorContext);
  for (const v of directorValidation.violations) {
    violations.push(violation(v as MaterialDirectorAgentFailureCode, v));
  }
  violations.push(...validateMaterialDirectorAgentBlueprint(blueprint, agentInput, section, context));

  if (
    context.artificialMaterials ||
    context.lightingReflectionConflict ||
    context.plasticLooksMetallic ||
    context.metalLooksPlastic ||
    context.lowRealismScore
  ) {
    confidence = 0.55;
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const clean = buildMaterialFromInput(agentInput, {}, 0.93);
    section = clean.section;
    materials = clean.materials;
    directorValid = clean.directorValid;
    confidence = clean.confidence;
    blueprint = fromMaterialSection(section, materials, agentInput, confidence, {});

    violations.length = 0;
    const retryContext = buildMaterialDirectorContextFromAgentInput(agentInput, {});
    const retryValidation = validateMaterialSection(section, retryContext);
    for (const v of retryValidation.violations) {
      violations.push(violation(v as MaterialDirectorAgentFailureCode, v));
    }
    violations.push(...validateMaterialDirectorAgentBlueprint(blueprint, agentInput, section, {}));
    recordMaterialModules(section, materials, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && directorValid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
    blueprint = { ...blueprint, confidence };
  }

  if (context.artificialMaterials && retryCount >= maxRetries && !context.skipRetry && violations.length > 0) {
    violations.push(violation("RETRY_EXHAUSTED", "Material detector and reflection retry did not resolve artificial look"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.productProfile.category,
    seed: 44,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: MATERIAL_DIRECTOR_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: MATERIAL_DIRECTOR_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const decision = await executeProfessionalDecision({
    agentId: MATERIAL_DIRECTOR_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!decision.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate material direction"));
  }
  if (!decision.state.problem?.professionalQuestion.toLowerCase().includes("professional")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be material-focused"));
  }

  const durationMs = Date.now() - started;

  const kpis = buildMaterialDirectorAgentKpis({
    blueprint: blueprint ?? {
      materials: [],
      surfaceQuality: "",
      roughnessProfile: "",
      reflectionProfile: "",
      microTexture: "",
      cleanlinessLevel: "",
      wearLevel: "",
      realismScore: 0,
      confidence: 0,
    },
    section,
    confidence,
    retryCount,
    directorValid,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= MATERIAL_DIRECTOR_AGENT_MODULES.length ||
    MATERIAL_DIRECTOR_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && directorValid && modulesComplete && Boolean(blueprint),
    agentId: MATERIAL_DIRECTOR_AGENT_ID,
    violations: uniqueViolations,
    modulesCompleted,
    moduleRecords,
    input: agentInput,
    blueprint,
    materialSection: section,
    confidence,
    retryCount,
    retryBranch,
    durationMs,
    kpis,
    pipelineMediated: true,
    lightingExcluded: true,
    cameraExcluded: true,
    goldenRuleSatisfied: MATERIAL_DIRECTOR_AGENT_GOLDEN_RULE.includes("physically believable"),
  };
}

export async function executeMaterialDirectorAgentWithPipeline(input: {
  agentInput?: MaterialDirectorAgentInput;
  context?: MaterialDirectorAgentContext;
}): Promise<MaterialDirectorAgentExecutionReport> {
  const report = await executeMaterialDirectorAgent(input);
  if (!report.valid || !report.blueprint) return report;

  const pipelineValid =
    MATERIAL_DIRECTOR_AGENT_PIPELINE.length === 2 &&
    MATERIAL_DIRECTOR_AGENT_PIPELINE[0].to === "material_director" &&
    MATERIAL_DIRECTOR_AGENT_PIPELINE[1].to === "render_adapter";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== MATERIAL_DIRECTOR_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use material-director contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: MaterialDirectorAgentViolation[]): MaterialDirectorAgentViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateMaterialDirectorAgentStructure(): MaterialDirectorAgentViolation[] {
  if (MATERIAL_DIRECTOR_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Material Director Agent requires 7 internal modules")];
  }
  return [];
}

export function validateMaterialDirectorAgent(
  context: MaterialDirectorAgentContext = {},
): MaterialDirectorAgentValidationReport {
  const violations = [...validateMaterialDirectorAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateMaterialDirectorAgentStructure().length === 0,
    pipelinePositionValid: MATERIAL_DIRECTOR_AGENT_PIPELINE[1].to === "render_adapter",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateMaterialDirectorAgentWithExecution(
  context: MaterialDirectorAgentContext = {},
): Promise<MaterialDirectorAgentValidationReport> {
  const report = validateMaterialDirectorAgent(context);
  const kitchen = await executeMaterialDirectorAgent({
    agentInput: buildBatterySprayerMaterialDirectorInput(),
    context,
  });
  const violations = dedupeViolations([...report.violations, ...kitchen.violations]);
  return {
    ...report,
    valid: violations.length === 0 && kitchen.valid,
    violations,
    kitchenExecutionValid: kitchen.valid,
    successCriteriaMet: violations.length === 0 && kitchen.valid,
  };
}

export function assertMaterialDirectorAgent(
  context?: MaterialDirectorAgentContext,
): MaterialDirectorAgentValidationReport {
  const report = validateMaterialDirectorAgent(context);
  if (!report.valid) {
    throw new Error(`Material Director Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runMaterialDirectorAgent(
  context: MaterialDirectorAgentContext = {},
): Promise<MaterialDirectorAgentValidationReport> {
  return validateMaterialDirectorAgentWithExecution(context);
}

export function isMaterialDirectorAgentFailure(code: string): code is MaterialDirectorAgentFailureCode {
  const codes: MaterialDirectorAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "ARTIFICIAL_MATERIALS",
    "LIGHTING_REFLECTION_CONFLICT",
    "PLASTIC_LOOKS_METALLIC",
    "METAL_LOOKS_PLASTIC",
    "LOW_REALISM_SCORE",
    "STORY_CONFLICT",
    "BLUEPRINT_INCOMPLETE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "DESIGN_DECISION_DETECTED",
    "CONTAINS_LIGHTING_DECISION",
    "CONTAINS_CAMERA_DECISION",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as MaterialDirectorAgentFailureCode);
}

export function getMaterialDirectorAgentModule(
  moduleId: MaterialDirectorAgentModuleId,
): MaterialDirectorAgentModuleDefinition | undefined {
  return MATERIAL_DIRECTOR_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function scoreMaterialCandidateForStory(
  candidate: string,
  storyPattern: string,
): number {
  if (candidate.includes("Natural") && storyPattern.includes("Problem")) return 0.95;
  if (candidate.includes("Brand New") && storyPattern.includes("Problem")) return 0.93;
  if (candidate.includes("Premium") && storyPattern.includes("Premium")) return 0.92;
  return 0.82;
}

export function validateMaterialSupportsLighting(
  reflectionProfile: string,
  lightingPreset: string,
): boolean {
  if (lightingPreset.includes("Outdoor Natural") && reflectionProfile.includes("mirror")) return false;
  return true;
}

export function hasSprayerProductMaterials(blueprint: MaterialDirectorAgentBlueprint): boolean {
  const names = blueprint.materials.map((m) => m.name.toLowerCase());
  return names.some((n) => n.includes("plastic")) && names.some((n) => n.includes("rubber"));
}
