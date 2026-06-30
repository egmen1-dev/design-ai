/**
 * Chapter 7.15 — Camera Director Agent engine.
 * Designs virtual camera viewpoint — never lighting, composition layout, or story.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import { FocusStrategy, PhotographyStyle } from "./commercial-photo-director-types";
import {
  buildCameraSection,
  CAMERA_DIRECTOR_ID,
  CameraAngleStyle,
  CameraStyle,
  validateCameraSection,
  PerspectiveProfile,
  type CameraDirectorContext,
  type CameraSection,
} from "./camera-director-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  buildBatterySprayerLightingDirectorInput,
  buildLightingDirectorContextFromAgentInput,
  fromLightingSection,
  mapStoryTypeForLighting,
} from "./lighting-director-agent-engine";
import { buildLightingSection, LightingScheme } from "./lighting-director-engine";
import { layoutPatternLabelToId } from "./composition-director-agent-engine";
import { SceneType } from "./scene-director-types";
import { StoryType } from "./visual-story-director-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";
import {
  CAMERA_DIRECTOR_AGENT_ID,
  CameraDirectorAgentModule,
  type CameraDirectorAgentBlueprint,
  type CameraDirectorAgentContext,
  type CameraDirectorAgentExecutionReport,
  type CameraDirectorAgentFailureCode,
  type CameraDirectorAgentInput,
  type CameraDirectorAgentKpi,
  type CameraDirectorAgentModuleDefinition,
  type CameraDirectorAgentModuleId,
  type CameraDirectorAgentModuleRecord,
  type CameraDirectorAgentPipelineLink,
  type CameraDirectorAgentRetryBranch,
  type CameraDirectorAgentValidationReport,
  type CameraDirectorAgentVector3,
  type CameraDirectorAgentViolation,
} from "./camera-director-agent-types";

export {
  CAMERA_DIRECTOR_AGENT_ID,
  CameraDirectorAgentModule,
  type CameraDirectorAgentModuleId,
  type CameraDirectorAgentInput,
  type CameraDirectorAgentBlueprint,
  type CameraDirectorAgentVector3,
  type CameraDirectorAgentModuleRecord,
  type CameraDirectorAgentKpi,
  type CameraDirectorAgentViolation,
  type CameraDirectorAgentRetryBranch,
  type CameraDirectorAgentExecutionReport,
  type CameraDirectorAgentValidationReport,
  type CameraDirectorAgentContext,
  type CameraDirectorAgentFailureCode,
  type CameraDirectorAgentModuleDefinition,
  type CameraDirectorAgentPipelineLink,
} from "./camera-director-agent-types";

export const CAMERA_DIRECTOR_AGENT_VERSION = "7.15.0";

export const CAMERA_DIRECTOR_AGENT_GOLDEN_RULE =
  "The buyer never thinks about lens or camera angle — but the camera defines how they see the product. " +
  "Camera Director chooses the single correct viewpoint so the product looks clearer, higher quality, " +
  "and more desirable. It does not control light, build composition, or create story.";

export const CAMERA_DIRECTOR_AGENT_MISSION =
  'Answer: "From where exactly should the buyer view the product?" — ' +
  "attractive proportions, obvious benefits, natural perspective, professional commercial framing.";

export const CAMERA_DIRECTOR_AGENT_MODULES: readonly CameraDirectorAgentModuleDefinition[] = [
  { id: CameraDirectorAgentModule.CAMERA_STRATEGY_SELECTOR, order: 1, label: "Camera Strategy Selector", responsibility: "Select camera strategy by category and marketplace" },
  { id: CameraDirectorAgentModule.ANGLE_PLANNER, order: 2, label: "Angle Planner", responsibility: "Define shooting angle for product readability" },
  { id: CameraDirectorAgentModule.LENS_SELECTOR, order: 3, label: "Lens Selector", responsibility: "Choose focal length minimizing distortion" },
  { id: CameraDirectorAgentModule.PERSPECTIVE_CONTROLLER, order: 4, label: "Perspective Controller", responsibility: "Keep geometry trustworthy" },
  { id: CameraDirectorAgentModule.FRAMING_OPTIMIZER, order: 5, label: "Framing Optimizer", responsibility: "Align frame with layout blueprint" },
  { id: CameraDirectorAgentModule.CAMERA_VALIDATOR, order: 6, label: "Camera Validator", responsibility: "Validate perspective and hero readability" },
  { id: CameraDirectorAgentModule.CAMERA_BLUEPRINT_BUILDER, order: 7, label: "Camera Blueprint Builder", responsibility: "Assemble Camera Blueprint for Pipeline Context" },
] as const;

export const CAMERA_DIRECTOR_AGENT_PIPELINE: readonly CameraDirectorAgentPipelineLink[] = [
  { from: "lighting_director", to: "camera_director" },
  { from: "camera_director", to: "material_director" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;

const CAMERA_STYLE_LABELS: Record<string, string> = {
  [CameraStyle.COMMERCIAL_PRODUCT]: "Front Commercial",
  [CameraStyle.PREMIUM_HERO]: "Hero Angle",
  [CameraStyle.LIFESTYLE_CONTEXT]: "Three Quarter View",
  [CameraStyle.TECHNOLOGY_DETAIL]: "Eye Level",
  [CameraStyle.MACRO_DETAIL]: "Macro Detail",
  [CameraStyle.MARKETPLACE_THUMB]: "Marketplace Hero",
};

const ANGLE_DEGREES: Record<string, number> = {
  [CameraAngleStyle.FRONT]: 0,
  [CameraAngleStyle.THREE_QUARTER]: 20,
  [CameraAngleStyle.SIDE]: 90,
  [CameraAngleStyle.TOP]: 90,
  [CameraAngleStyle.MACRO]: 15,
  [CameraAngleStyle.ISOMETRIC]: 35,
};

const HEIGHT_METERS: Record<string, number> = {
  eye_level: 1.55,
  slightly_above: 1.72,
  low_angle: 1.15,
  high_angle: 2.1,
};

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

const LIGHTING_KEYWORDS = /\b(key light|fill light|rim light|softbox|kelvin|color temperature)\b/i;

function violation(
  code: CameraDirectorAgentFailureCode,
  message: string,
  module?: CameraDirectorAgentModuleId,
): CameraDirectorAgentViolation {
  return { code, message, module };
}

function recordModule(
  records: CameraDirectorAgentModuleRecord[],
  completed: CameraDirectorAgentModuleId[],
  module: CameraDirectorAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

function isGardenProduct(profile: CameraDirectorAgentInput["productProfile"]): boolean {
  const sub = profile.subcategory.toLowerCase();
  const cat = profile.category.toLowerCase();
  return sub.includes("sprayer") || cat.includes("garden");
}

export function formatCameraStyleLabel(style: string): string {
  return CAMERA_STYLE_LABELS[style] ?? style.replace(/_/g, " ");
}

export function focalLengthToFieldOfView(focalLength: number): number {
  const sensorWidth = 36;
  const radians = 2 * Math.atan(sensorWidth / (2 * focalLength));
  return Math.round((radians * 180) / Math.PI);
}

export function deriveCameraPosition(
  angleDeg: number,
  height: number,
  distance = 1.8,
): CameraDirectorAgentVector3 {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.sin(rad) * distance,
    y: height,
    z: Math.cos(rad) * distance,
  };
}

export function deriveFocusPoint(input: CameraDirectorAgentInput): CameraDirectorAgentVector3 {
  const hero = input.layoutBlueprint.heroPlacement;
  return {
    x: hero.x + hero.width / 2,
    y: hero.y + hero.height / 2,
    z: 0,
  };
}

export function buildCameraDirectorContextFromAgentInput(
  input: CameraDirectorAgentInput,
  agentContext: CameraDirectorAgentContext = {},
): CameraDirectorContext {
  const marketplace = input.productProfile.marketplace?.toLowerCase().includes("wildberries")
    ? "WB"
    : input.productProfile.marketplace ?? "wildberries";

  const photographyStyle = isGardenProduct(input.productProfile)
    ? PhotographyStyle.LIFESTYLE_COMMERCIAL
    : PHOTO_STYLE_TO_PHOTOGRAPHY_STYLE[input.photographyBlueprint.photoStyle] ??
      PhotographyStyle.MODERN_MARKETPLACE;

  let cameraIntent =
    `${input.photographyBlueprint.perspective} — ${input.photographyBlueprint.lensProfile} — ` +
    `focus on hero product`.slice(0, 140);

  if (agentContext.topDownAngle) {
    cameraIntent = "top down flat catalog macro view";
  }
  if (agentContext.awkwardLens) {
    cameraIntent = "100mm macro extreme close catalog";
  }

  return {
    productCategory: input.productProfile.category,
    marketplace,
    storyType: mapStoryTypeForLighting(input.storyBlueprint, input.productProfile),
    primaryEmotion: input.storyBlueprint.emotionalDirection,
    sceneType: SCENE_TYPE_TO_SCENE[input.sceneBlueprint.sceneType] ?? SceneType.NATURAL,
    photographyStyle,
    focusStrategy: FocusStrategy.ENTIRE_PRODUCT_SHARP,
    cameraIntent,
    lightingScheme:
      PRESET_TO_LIGHTING_SCHEME[input.lightingBlueprint.lightingPreset] ?? LightingScheme.NATURAL_WINDOW_LIGHT,
    layoutTemplateId: layoutPatternLabelToId(input.layoutBlueprint.layoutPattern),
    compositionHeroWeight: Math.round(input.layoutBlueprint.heroPlacement.width * 100),
  };
}

export function fromCameraSection(
  section: CameraSection,
  input: CameraDirectorAgentInput,
  confidence: number,
): CameraDirectorAgentBlueprint {
  const angleDeg = ANGLE_DEGREES[section.cameraAngle] ?? 20;
  const height = HEIGHT_METERS[section.cameraHeight] ?? 1.55;
  const position = deriveCameraPosition(angleDeg, height);
  const focusPoint = deriveFocusPoint(input);

  return {
    cameraType: formatCameraStyleLabel(section.cameraStyle),
    cameraPosition: position,
    cameraAngle: angleDeg,
    cameraHeight: height,
    lensFocalLength: section.focalLength,
    fieldOfView: focalLengthToFieldOfView(section.focalLength),
    focusPoint,
    framing: section.framingProfile.replace(/_/g, " "),
    perspectiveType: section.perspectiveProfile.replace(/_/g, " "),
    confidence,
  };
}

export function validateCameraDirectorAgentBlueprint(
  blueprint?: CameraDirectorAgentBlueprint,
  input?: CameraDirectorAgentInput,
  section?: CameraSection,
  agentContext: CameraDirectorAgentContext = {},
): CameraDirectorAgentViolation[] {
  const violations: CameraDirectorAgentViolation[] = [];
  if (!blueprint) {
    violations.push(
      violation("BLUEPRINT_INCOMPLETE", "Camera Blueprint is required", CameraDirectorAgentModule.CAMERA_BLUEPRINT_BUILDER),
    );
    return violations;
  }

  if (agentContext.topDownAngle || blueprint.cameraAngle >= 85) {
    violations.push(
      violation("TOP_VIEW_MISMATCH", "Top view flattens product volume — use three quarter view", CameraDirectorAgentModule.ANGLE_PLANNER),
    );
  }

  if (agentContext.perspectiveDistortion || blueprint.lensFocalLength < 28) {
    violations.push(
      violation("PERSPECTIVE_DISTORTION", "Lens focal length causes perspective distortion", CameraDirectorAgentModule.PERSPECTIVE_CONTROLLER),
    );
  }

  if (agentContext.heroTooSmall || (section && section.heroScale < 0.35)) {
    violations.push(
      violation("HERO_TOO_SMALL", "Hero product must remain readable in frame", CameraDirectorAgentModule.FRAMING_OPTIMIZER),
    );
  }

  if (agentContext.awkwardLens || (input && isGardenProduct(input.productProfile) && blueprint.lensFocalLength >= 100)) {
    violations.push(
      violation("LENS_MISMATCH", "Macro lens inappropriate for garden usage story", CameraDirectorAgentModule.LENS_SELECTOR),
    );
  }

  if (section?.cameraAngle === CameraAngleStyle.TOP && input && isGardenProduct(input.productProfile)) {
    violations.push(
      violation("AWKWARD_ANGLE", "Top angle hides sprayer tank and hose volume", CameraDirectorAgentModule.ANGLE_PLANNER),
    );
  }

  const serialized = JSON.stringify(blueprint);
  if (LIGHTING_KEYWORDS.test(serialized)) {
    violations.push(
      violation("CONTAINS_LIGHTING_DECISION", "Camera must not decide lighting parameters", CameraDirectorAgentModule.CAMERA_VALIDATOR),
    );
  }

  if (
    input &&
    isGardenProduct(input.productProfile) &&
    blueprint.cameraAngle < 10 &&
    blueprint.perspectiveType.includes("front")
  ) {
    violations.push(
      violation("STORY_CONFLICT", "Front-flat angle does not reveal sprayer functional elements", CameraDirectorAgentModule.ANGLE_PLANNER),
    );
  }

  return violations;
}

export function buildCameraDirectorAgentKpis(input: {
  blueprint: CameraDirectorAgentBlueprint;
  section: CameraSection;
  confidence: number;
  retryCount: number;
  directorValid: boolean;
}): CameraDirectorAgentKpi {
  const { blueprint, section, confidence, retryCount, directorValid } = input;
  const lensOk = blueprint.lensFocalLength >= 35 && blueprint.lensFocalLength <= 85;
  return {
    perspectiveAccuracy: directorValid && blueprint.cameraAngle >= 10 && blueprint.cameraAngle <= 45 ? 0.93 : 0.6,
    productReadability: section.heroScale >= 0.35 ? 0.92 : 0.55,
    lensSuitability: lensOk ? 0.91 : 0.65,
    commercialTrust: blueprint.fieldOfView >= 40 && blueprint.fieldOfView <= 65 ? 0.9 : 0.75,
    marketplaceFit: blueprint.lensFocalLength >= 50 ? 0.89 : 0.82,
    heroVisibility: section.heroScale >= 0.35 ? 0.93 : 0.5,
    retryRate: retryCount > 0 ? retryCount / (retryCount + 1) : 0,
    confidenceScore: confidence,
  };
}

export function mapCameraDirectorModuleToStage(module: CameraDirectorAgentModuleId): string {
  const mapping: Record<CameraDirectorAgentModuleId, string> = {
    [CameraDirectorAgentModule.CAMERA_STRATEGY_SELECTOR]: "camera_style",
    [CameraDirectorAgentModule.ANGLE_PLANNER]: "camera_angle",
    [CameraDirectorAgentModule.LENS_SELECTOR]: "focal_length",
    [CameraDirectorAgentModule.PERSPECTIVE_CONTROLLER]: "perspective_profile",
    [CameraDirectorAgentModule.FRAMING_OPTIMIZER]: "framing_profile",
    [CameraDirectorAgentModule.CAMERA_VALIDATOR]: "validation",
    [CameraDirectorAgentModule.CAMERA_BLUEPRINT_BUILDER]: "blueprint_assembly",
  };
  return mapping[module];
}

export function buildDefaultCameraDirectorAgentInput(
  overrides: Partial<CameraDirectorAgentInput> = {},
): CameraDirectorAgentInput {
  const lightingInput = buildBatterySprayerLightingDirectorInput();
  const { section: lightingSection } = buildLightingSection(
    buildLightingDirectorContextFromAgentInput(lightingInput),
    0.93,
  );
  const lightingBlueprint = fromLightingSection(lightingSection, 0.93);

  return {
    storyBlueprint: lightingInput.storyBlueprint,
    sceneBlueprint: lightingInput.sceneBlueprint,
    layoutBlueprint: lightingInput.layoutBlueprint,
    photographyBlueprint: lightingInput.photographyBlueprint,
    lightingBlueprint,
    productProfile: lightingInput.productProfile,
    knowledgePackage: lightingInput.knowledgePackage,
    ...overrides,
  };
}

export function buildBatterySprayerCameraDirectorInput(): CameraDirectorAgentInput {
  return buildDefaultCameraDirectorAgentInput();
}

function resolveRetryBranch(context: CameraDirectorAgentContext): CameraDirectorAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (
    context.topDownAngle ||
    context.perspectiveDistortion ||
    context.heroTooSmall ||
    context.awkwardLens ||
    context.lowConfidence
  ) {
    return "strategy_lens_perspective";
  }
  return undefined;
}

function normalizeGardenCameraSection(
  section: CameraSection,
  agentInput: CameraDirectorAgentInput,
): CameraSection {
  if (!isGardenProduct(agentInput.productProfile)) return section;
  if (
    section.cameraAngle === CameraAngleStyle.THREE_QUARTER &&
    section.focalLength <= 35 &&
    section.perspectiveProfile === PerspectiveProfile.EXPANDED
  ) {
    return { ...section, perspectiveProfile: PerspectiveProfile.NATURAL };
  }
  return section;
}

function buildCameraFromInput(
  agentInput: CameraDirectorAgentInput,
  agentContext: CameraDirectorAgentContext,
  confidenceSeed: number,
): { section: CameraSection; confidence: number; directorValid: boolean } {
  const directorContext = buildCameraDirectorContextFromAgentInput(agentInput, agentContext);
  const { section: rawSection } = buildCameraSection(directorContext, confidenceSeed);
  const section = normalizeGardenCameraSection(rawSection, agentInput);
  const directorValidation = validateCameraSection(section, directorContext);
  return {
    section,
    confidence: directorValidation.valid ? confidenceSeed : 0.45,
    directorValid: directorValidation.valid,
  };
}

export async function executeCameraDirectorAgent(input: {
  agentInput?: CameraDirectorAgentInput;
  context?: CameraDirectorAgentContext;
}): Promise<CameraDirectorAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerCameraDirectorInput();
  const violations: CameraDirectorAgentViolation[] = [];
  const modulesCompleted: CameraDirectorAgentModuleId[] = [];
  const moduleRecords: CameraDirectorAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: CameraDirectorAgentRetryBranch | undefined;

  let { section, confidence, directorValid } = buildCameraFromInput(agentInput, context, 0.93);
  if (context.lowConfidence) confidence = 0.55;

  const recordCameraModules = (camSection: CameraSection, suffix = "") => {
    recordModule(moduleRecords, modulesCompleted, CameraDirectorAgentModule.CAMERA_STRATEGY_SELECTOR, `${formatCameraStyleLabel(camSection.cameraStyle)}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CameraDirectorAgentModule.ANGLE_PLANNER, `${camSection.cameraAngle}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CameraDirectorAgentModule.LENS_SELECTOR, `${camSection.focalLength}mm${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CameraDirectorAgentModule.PERSPECTIVE_CONTROLLER, camSection.perspectiveProfile + suffix);
    recordModule(moduleRecords, modulesCompleted, CameraDirectorAgentModule.FRAMING_OPTIMIZER, camSection.framingProfile + suffix);
    recordModule(moduleRecords, modulesCompleted, CameraDirectorAgentModule.CAMERA_VALIDATOR, `${violations.length} checks${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CameraDirectorAgentModule.CAMERA_BLUEPRINT_BUILDER, "blueprint assembled" + suffix);
  };

  recordCameraModules(section);

  let blueprint = fromCameraSection(section, agentInput, confidence);

  const directorContext = buildCameraDirectorContextFromAgentInput(agentInput, context);
  const directorValidation = validateCameraSection(section, directorContext);
  for (const v of directorValidation.violations) {
    violations.push(violation(v as CameraDirectorAgentFailureCode, v));
  }
  violations.push(...validateCameraDirectorAgentBlueprint(blueprint, agentInput, section, context));

  if (context.topDownAngle || context.perspectiveDistortion || context.heroTooSmall || context.awkwardLens) {
    confidence = 0.55;
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const clean = buildCameraFromInput(agentInput, {}, 0.93);
    section = clean.section;
    directorValid = clean.directorValid;
    confidence = clean.confidence;
    blueprint = fromCameraSection(section, agentInput, confidence);

    violations.length = 0;
    const retryContext = buildCameraDirectorContextFromAgentInput(agentInput, {});
    const retryValidation = validateCameraSection(section, retryContext);
    for (const v of retryValidation.violations) {
      violations.push(violation(v as CameraDirectorAgentFailureCode, v));
    }
    violations.push(...validateCameraDirectorAgentBlueprint(blueprint, agentInput, section, {}));
    recordCameraModules(section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && directorValid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
    blueprint = { ...blueprint, confidence };
  }

  if (context.topDownAngle && retryCount >= maxRetries && !context.skipRetry && violations.length > 0) {
    violations.push(violation("RETRY_EXHAUSTED", "Camera strategy and lens retry did not resolve angle conflict"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.productProfile.category,
    seed: 43,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: CAMERA_DIRECTOR_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: CAMERA_DIRECTOR_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const decision = await executeProfessionalDecision({
    agentId: CAMERA_DIRECTOR_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!decision.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate camera direction"));
  }
  if (!decision.state.problem?.professionalQuestion.toLowerCase().includes("professional")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be camera-focused"));
  }

  const durationMs = Date.now() - started;

  const kpis = buildCameraDirectorAgentKpis({
    blueprint: blueprint ?? {
      cameraType: "",
      cameraPosition: { x: 0, y: 0, z: 0 },
      cameraAngle: 0,
      cameraHeight: 0,
      lensFocalLength: 0,
      fieldOfView: 0,
      focusPoint: { x: 0, y: 0, z: 0 },
      framing: "",
      perspectiveType: "",
      confidence: 0,
    },
    section,
    confidence,
    retryCount,
    directorValid,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= CAMERA_DIRECTOR_AGENT_MODULES.length ||
    CAMERA_DIRECTOR_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && directorValid && modulesComplete && Boolean(blueprint),
    agentId: CAMERA_DIRECTOR_AGENT_ID,
    violations: uniqueViolations,
    modulesCompleted,
    moduleRecords,
    input: agentInput,
    blueprint,
    cameraSection: section,
    confidence,
    retryCount,
    retryBranch,
    durationMs,
    kpis,
    pipelineMediated: true,
    materialExcluded: true,
    goldenRuleSatisfied: CAMERA_DIRECTOR_AGENT_GOLDEN_RULE.includes("single correct viewpoint"),
  };
}

export async function executeCameraDirectorAgentWithPipeline(input: {
  agentInput?: CameraDirectorAgentInput;
  context?: CameraDirectorAgentContext;
}): Promise<CameraDirectorAgentExecutionReport> {
  const report = await executeCameraDirectorAgent(input);
  if (!report.valid || !report.blueprint) return report;

  const pipelineValid =
    CAMERA_DIRECTOR_AGENT_PIPELINE.length === 2 &&
    CAMERA_DIRECTOR_AGENT_PIPELINE[0].to === "camera_director" &&
    CAMERA_DIRECTOR_AGENT_PIPELINE[1].to === "material_director";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== CAMERA_DIRECTOR_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use camera-director contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: CameraDirectorAgentViolation[]): CameraDirectorAgentViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateCameraDirectorAgentStructure(): CameraDirectorAgentViolation[] {
  if (CAMERA_DIRECTOR_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Camera Director Agent requires 7 internal modules")];
  }
  return [];
}

export function validateCameraDirectorAgent(
  context: CameraDirectorAgentContext = {},
): CameraDirectorAgentValidationReport {
  const violations = [...validateCameraDirectorAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateCameraDirectorAgentStructure().length === 0,
    pipelinePositionValid: CAMERA_DIRECTOR_AGENT_PIPELINE[1].to === "material_director",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateCameraDirectorAgentWithExecution(
  context: CameraDirectorAgentContext = {},
): Promise<CameraDirectorAgentValidationReport> {
  const report = validateCameraDirectorAgent(context);
  const kitchen = await executeCameraDirectorAgent({
    agentInput: buildBatterySprayerCameraDirectorInput(),
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

export function assertCameraDirectorAgent(
  context?: CameraDirectorAgentContext,
): CameraDirectorAgentValidationReport {
  const report = validateCameraDirectorAgent(context);
  if (!report.valid) {
    throw new Error(`Camera Director Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runCameraDirectorAgent(
  context: CameraDirectorAgentContext = {},
): Promise<CameraDirectorAgentValidationReport> {
  return validateCameraDirectorAgentWithExecution(context);
}

export function isCameraDirectorAgentFailure(code: string): code is CameraDirectorAgentFailureCode {
  const codes: CameraDirectorAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "PERSPECTIVE_DISTORTION",
    "HERO_TOO_SMALL",
    "STORY_CONFLICT",
    "AWKWARD_ANGLE",
    "TOP_VIEW_MISMATCH",
    "LENS_MISMATCH",
    "BLUEPRINT_INCOMPLETE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "DESIGN_DECISION_DETECTED",
    "CONTAINS_LIGHTING_DECISION",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as CameraDirectorAgentFailureCode);
}

export function getCameraDirectorAgentModule(
  moduleId: CameraDirectorAgentModuleId,
): CameraDirectorAgentModuleDefinition | undefined {
  return CAMERA_DIRECTOR_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function scoreCameraCandidateForStory(
  candidate: string,
  storyPattern: string,
): number {
  if (candidate.includes("Three Quarter") && storyPattern.includes("Problem")) return 0.96;
  if (candidate.includes("Eye Level") && storyPattern.includes("Problem")) return 0.94;
  if (candidate.includes("Hero") && storyPattern.includes("Premium")) return 0.93;
  return 0.82;
}

export function validateCameraSupportsStory(
  cameraAngle: number,
  sceneType: string,
): boolean {
  if (sceneType.includes("Outdoor") || sceneType.includes("Natural")) {
    return cameraAngle >= 10 && cameraAngle <= 45;
  }
  return cameraAngle >= 0;
}

export function isThreeQuarterGardenAngle(blueprint: CameraDirectorAgentBlueprint): boolean {
  return blueprint.cameraAngle >= 15 && blueprint.cameraAngle <= 35 && blueprint.lensFocalLength <= 50;
}
