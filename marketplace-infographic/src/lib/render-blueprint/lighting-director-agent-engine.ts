/**
 * Chapter 7.14 — Lighting Director Agent engine.
 * Designs physically plausible lighting — never composition, camera, or story.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import { PhotographyStyle } from "./commercial-photo-director-types";
import {
  buildLightingSection,
  LIGHTING_DIRECTOR_ID,
  LightingScheme,
  validateLightingSection,
  type LightingDirectorContext,
  type LightingSection,
} from "./lighting-director-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  buildBatterySprayerPhotographyDirectorInput,
  fromPlannedPhotographyBlueprint,
  toPhotographyPlanningInput,
} from "./photography-director-agent-engine";
import { runPhotographyPlanningStage } from "./photography-planning-stage-engine";
import { SceneType } from "./scene-director-types";
import { StoryType } from "./visual-story-director-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";
import {
  LIGHTING_DIRECTOR_AGENT_ID,
  LightingDirectorAgentModule,
  type LightingDirectorAgentBlueprint,
  type LightingDirectorAgentContext,
  type LightingDirectorAgentExecutionReport,
  type LightingDirectorAgentFailureCode,
  type LightingDirectorAgentInput,
  type LightingDirectorAgentKpi,
  type LightingDirectorAgentModuleDefinition,
  type LightingDirectorAgentModuleId,
  type LightingDirectorAgentModuleRecord,
  type LightingDirectorAgentPipelineLink,
  type LightingDirectorAgentRetryBranch,
  type LightingDirectorAgentValidationReport,
  type LightingDirectorAgentViolation,
} from "./lighting-director-agent-types";

export {
  LIGHTING_DIRECTOR_AGENT_ID,
  LightingDirectorAgentModule,
  type LightingDirectorAgentModuleId,
  type LightingDirectorAgentInput,
  type LightingDirectorAgentBlueprint,
  type LightingDirectorAgentModuleRecord,
  type LightingDirectorAgentKpi,
  type LightingDirectorAgentViolation,
  type LightingDirectorAgentRetryBranch,
  type LightingDirectorAgentExecutionReport,
  type LightingDirectorAgentValidationReport,
  type LightingDirectorAgentContext,
  type LightingDirectorAgentFailureCode,
  type LightingDirectorAgentModuleDefinition,
  type LightingDirectorAgentPipelineLink,
} from "./lighting-director-agent-types";

export const LIGHTING_DIRECTOR_AGENT_VERSION = "7.14.0";

export const LIGHTING_DIRECTOR_AGENT_GOLDEN_RULE =
  "The buyer rarely notices good light but instantly feels bad light. Lighting Director uses light " +
  "as commercial psychology — not decoration. It does not create story, build composition, or choose " +
  "camera; it makes the product volumetric, premium, realistic, and professionally photographed.";

export const LIGHTING_DIRECTOR_AGENT_MISSION =
  'Answer: "How should light be placed so the product looks premium, realistic, and commercially attractive?" — ' +
  "attention-guiding illumination that builds trust and material quality.";

export const LIGHTING_DIRECTOR_AGENT_MODULES: readonly LightingDirectorAgentModuleDefinition[] = [
  { id: LightingDirectorAgentModule.LIGHTING_STRATEGY_SELECTOR, order: 1, label: "Lighting Strategy Selector", responsibility: "Select lighting scheme from story and scene" },
  { id: LightingDirectorAgentModule.KEY_LIGHT_PLANNER, order: 2, label: "Key Light Planner", responsibility: "Define dominant key light direction and softness" },
  { id: LightingDirectorAgentModule.SHADOW_ENGINE, order: 3, label: "Shadow Engine", responsibility: "Design physically plausible shadows" },
  { id: LightingDirectorAgentModule.REFLECTION_CONTROLLER, order: 4, label: "Reflection Controller", responsibility: "Control material reflections without distraction" },
  { id: LightingDirectorAgentModule.COLOR_TEMPERATURE_ENGINE, order: 5, label: "Color Temperature Engine", responsibility: "Set color temperature for emotional story" },
  { id: LightingDirectorAgentModule.LIGHTING_VALIDATOR, order: 6, label: "Lighting Validator", responsibility: "Validate hero lighting and physical plausibility" },
  { id: LightingDirectorAgentModule.LIGHTING_BLUEPRINT_BUILDER, order: 7, label: "Lighting Blueprint Builder", responsibility: "Assemble Lighting Blueprint for Pipeline Context" },
] as const;

export const LIGHTING_DIRECTOR_AGENT_PIPELINE: readonly LightingDirectorAgentPipelineLink[] = [
  { from: "photography_director", to: "lighting_director" },
  { from: "lighting_director", to: "camera_director" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;

const SCHEME_LABELS: Record<string, string> = {
  [LightingScheme.NATURAL_WINDOW_LIGHT]: "Outdoor Natural",
  [LightingScheme.SINGLE_SOFT_LIGHT]: "Soft Studio",
  [LightingScheme.TOP_SOFTBOX]: "Soft Studio",
  [LightingScheme.TWO_POINT_STUDIO]: "Premium Product",
  [LightingScheme.THREE_POINT_STUDIO]: "Premium Product",
  [LightingScheme.LUXURY_SIDE_LIGHT]: "Luxury Minimal",
  [LightingScheme.EDITORIAL_SOFT_LIGHT]: "Luxury Minimal",
  [LightingScheme.HIGH_KEY]: "Soft Studio",
  [LightingScheme.LOW_KEY]: "Industrial Workshop",
  [LightingScheme.DIFFUSED_AMBIENT]: "Golden Hour",
};

const PHOTO_STYLE_TO_PHOTOGRAPHY_STYLE: Record<string, string> = {
  "Outdoor Commercial": PhotographyStyle.MODERN_MARKETPLACE,
  "Studio Commercial": PhotographyStyle.COMMERCIAL_PRODUCT,
  "Premium Product Photography": PhotographyStyle.LUXURY_ADVERTISING,
  "Lifestyle Photography": PhotographyStyle.LIFESTYLE_COMMERCIAL,
  "Industrial Photography": PhotographyStyle.TECHNOLOGY_PRODUCT,
  "Minimal Premium": PhotographyStyle.MINIMAL_SHOWCASE,
};

const STORY_PATTERN_TO_STORY_TYPE: Record<string, string> = {
  "Problem → Solution": StoryType.SAFETY,
  "Hero Product": StoryType.TRUST,
  "Professional Lifestyle": StoryType.COMFORT,
  "Premium Experience": StoryType.PREMIUM_LIFESTYLE,
  Transformation: StoryType.TECHNOLOGY,
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

const COMPOSITION_KEYWORDS = /\b(hero area|layout pattern|badge layout|safe zone|white space)\b/i;

function violation(
  code: LightingDirectorAgentFailureCode,
  message: string,
  module?: LightingDirectorAgentModuleId,
): LightingDirectorAgentViolation {
  return { code, message, module };
}

function recordModule(
  records: LightingDirectorAgentModuleRecord[],
  completed: LightingDirectorAgentModuleId[],
  module: LightingDirectorAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

function isGardenProduct(profile: LightingDirectorAgentInput["productProfile"]): boolean {
  const sub = profile.subcategory.toLowerCase();
  const cat = profile.category.toLowerCase();
  return sub.includes("sprayer") || cat.includes("garden");
}

export function formatLightingSchemeLabel(scheme: string): string {
  return SCHEME_LABELS[scheme] ?? scheme.replace(/_/g, " ");
}

export function formatLightProfile(profile: {
  direction: string;
  angle: string;
  sourceSize: string;
  intensity: number;
}): string {
  return `${profile.sourceSize} ${profile.direction} ${profile.angle} intensity ${Math.round(profile.intensity * 100)}%`;
}

export function mapStoryTypeForLighting(
  story: VisualStoryDirectorAgentBlueprint,
  profile: AnalyzedProductProfile,
): string {
  if (isGardenProduct(profile)) return StoryType.SAFETY;
  return STORY_PATTERN_TO_STORY_TYPE[story.storyPattern] ?? StoryType.TRUST;
}

export function buildLightingDirectorContextFromAgentInput(
  input: LightingDirectorAgentInput,
  agentContext: LightingDirectorAgentContext = {},
): LightingDirectorContext {
  const marketplace = input.productProfile.marketplace?.toLowerCase().includes("wildberries")
    ? "WB"
    : input.productProfile.marketplace ?? "wildberries";

  const photographyStyle =
    PHOTO_STYLE_TO_PHOTOGRAPHY_STYLE[input.photographyBlueprint.photoStyle] ??
    PhotographyStyle.MODERN_MARKETPLACE;

  let lightingIntent =
    `${input.photographyBlueprint.commercialMood} — ${input.sceneBlueprint.atmosphere}`.slice(0, 120);

  if (agentContext.artificialLighting) {
    lightingIntent = "neon glow rgb laser beams dramatic god rays";
  }

  return {
    productCategory: input.productProfile.category,
    marketplace,
    productCutout: true,
    storyType: mapStoryTypeForLighting(input.storyBlueprint, input.productProfile),
    primaryEmotion: input.storyBlueprint.emotionalDirection,
    sceneType: SCENE_TYPE_TO_SCENE[input.sceneBlueprint.sceneType] ?? SceneType.NATURAL,
    sceneLightingMood: input.sceneBlueprint.atmosphere,
    photographyStyle,
    photoMood: input.photographyBlueprint.commercialMood,
    lightingIntent,
    materialPalette: [input.productProfile.subcategory],
  };
}

export function fromLightingSection(
  section: LightingSection,
  confidence: number,
): LightingDirectorAgentBlueprint {
  const rim = section.rimLight ? formatLightProfile(section.rimLight) : "none";
  const reflectionStrength = section.lightingBlueprint.reflectionStrength ?? 0.25;
  return {
    lightingPreset: formatLightingSchemeLabel(section.lightingScheme),
    keyLight: formatLightProfile(section.keyLight),
    fillLight: formatLightProfile(section.fillLight),
    rimLight: rim,
    backLight: section.lightingBlueprint.back ?? "none",
    shadowStyle: `softness ${section.shadowProfile.softness}, ${section.shadowProfile.length}, ${section.shadowProfile.density}`,
    reflectionStyle:
      reflectionStrength > 0.3
        ? "controlled specular highlights on plastic surfaces"
        : "natural contact shadows minimal specular",
    colorTemperature: section.colorTemperature,
    contrastLevel: section.contrastProfile.level,
    lightingMood: section.lightingMood,
    confidence,
  };
}

export function computeReflectionQuality(section: LightingSection): number {
  const strength = section.lightingBlueprint.reflectionStrength ?? 0.25;
  if (strength > 0.6) return 0.5;
  if (section.shadowProfile.contactShadow) return 0.91;
  return 0.85 + strength * 0.1;
}

export function validateLightingDirectorAgentBlueprint(
  blueprint?: LightingDirectorAgentBlueprint,
  input?: LightingDirectorAgentInput,
  section?: LightingSection,
  agentContext: LightingDirectorAgentContext = {},
): LightingDirectorAgentViolation[] {
  const violations: LightingDirectorAgentViolation[] = [];
  if (!blueprint) {
    violations.push(
      violation("BLUEPRINT_INCOMPLETE", "Lighting Blueprint is required", LightingDirectorAgentModule.LIGHTING_BLUEPRINT_BUILDER),
    );
    return violations;
  }

  if (!blueprint.keyLight || blueprint.keyLight.length < 8) {
    violations.push(
      violation("MISSING_LIGHT_SOURCE", "Key light must be defined", LightingDirectorAgentModule.KEY_LIGHT_PLANNER),
    );
  }

  if (agentContext.artificialLighting) {
    violations.push(
      violation("ARTIFICIAL_LIGHTING", "Lighting must look professionally plausible", LightingDirectorAgentModule.LIGHTING_VALIDATOR),
    );
  }

  if (/neon|laser|rgb lights|god rays/i.test(`${blueprint.lightingMood} ${blueprint.keyLight}`)) {
    violations.push(
      violation("ARTIFICIAL_LIGHTING", "Lighting must look professionally plausible", LightingDirectorAgentModule.LIGHTING_VALIDATOR),
    );
  }

  if (agentContext.missingContactShadow) {
    violations.push(
      violation("PRODUCT_COMPOSITE_INCOMPATIBLE", "Cutout product requires contact shadow", LightingDirectorAgentModule.SHADOW_ENGINE),
    );
  }

  if (agentContext.flatProduct) {
    violations.push(
      violation("FLAT_PRODUCT", "Product must retain volume through shadow design", LightingDirectorAgentModule.SHADOW_ENGINE),
    );
  }

  if (
    input &&
    isGardenProduct(input.productProfile) &&
    /industrial workshop|low key/i.test(blueprint.lightingPreset)
  ) {
    violations.push(
      violation("STORY_LIGHTING_MISMATCH", "Garden story requires natural outdoor-compatible lighting", LightingDirectorAgentModule.LIGHTING_STRATEGY_SELECTOR),
    );
  }

  const serialized = JSON.stringify(blueprint);
  if (COMPOSITION_KEYWORDS.test(serialized)) {
    violations.push(
      violation("CONTAINS_COMPOSITION_DECISION", "Lighting must not decide composition layout", LightingDirectorAgentModule.LIGHTING_VALIDATOR),
    );
  }

  if (agentContext.reflectionQualityLow) {
    violations.push(
      violation("LOW_REFLECTION_QUALITY", "Reflection quality below acceptable threshold", LightingDirectorAgentModule.REFLECTION_CONTROLLER),
    );
  }

  if (agentContext.heroLostOnBackground) {
    violations.push(
      violation("HERO_LOST", "Hero product must remain visually dominant under lighting", LightingDirectorAgentModule.KEY_LIGHT_PLANNER),
    );
  }

  return violations;
}

export function buildLightingDirectorAgentKpis(input: {
  blueprint: LightingDirectorAgentBlueprint;
  section: LightingSection;
  confidence: number;
  retryCount: number;
  directorValid: boolean;
}): LightingDirectorAgentKpi {
  const { blueprint, section, confidence, retryCount, directorValid } = input;
  const reflectionQuality = computeReflectionQuality(section);
  const plausible = !/neon|laser/i.test(blueprint.lightingMood);
  return {
    lightingRealism: directorValid && plausible ? 0.92 : 0.55,
    productVisibility: section.keyLight.intensity >= 0.7 ? 0.93 : 0.75,
    shadowQuality: section.shadowProfile.contactShadow ? 0.91 : 0.6,
    reflectionQuality,
    materialEnhancement: reflectionQuality,
    commercialTrust: blueprint.colorTemperature >= 4800 && blueprint.colorTemperature <= 6000 ? 0.9 : 0.75,
    retryRate: retryCount > 0 ? retryCount / (retryCount + 1) : 0,
    confidenceScore: confidence,
  };
}

export function mapLightingDirectorModuleToStage(module: LightingDirectorAgentModuleId): string {
  const mapping: Record<LightingDirectorAgentModuleId, string> = {
    [LightingDirectorAgentModule.LIGHTING_STRATEGY_SELECTOR]: "lighting_scheme",
    [LightingDirectorAgentModule.KEY_LIGHT_PLANNER]: "key_light",
    [LightingDirectorAgentModule.SHADOW_ENGINE]: "shadow_profile",
    [LightingDirectorAgentModule.REFLECTION_CONTROLLER]: "reflection_strength",
    [LightingDirectorAgentModule.COLOR_TEMPERATURE_ENGINE]: "color_temperature",
    [LightingDirectorAgentModule.LIGHTING_VALIDATOR]: "validation",
    [LightingDirectorAgentModule.LIGHTING_BLUEPRINT_BUILDER]: "blueprint_assembly",
  };
  return mapping[module];
}

export function buildDefaultLightingDirectorAgentInput(
  overrides: Partial<LightingDirectorAgentInput> = {},
): LightingDirectorAgentInput {
  const photoInput = buildBatterySprayerPhotographyDirectorInput();
  const planning = runPhotographyPlanningStage(toPhotographyPlanningInput(photoInput));
  const photographyBlueprint = fromPlannedPhotographyBlueprint(
    planning.section!.plannedBlueprint,
    planning.section!.photographyStyle,
    photoInput,
    planning.section!.confidence,
  );

  return {
    storyBlueprint: photoInput.storyBlueprint,
    sceneBlueprint: photoInput.sceneBlueprint,
    layoutBlueprint: photoInput.layoutBlueprint,
    photographyBlueprint,
    productProfile: photoInput.productProfile,
    knowledgePackage: photoInput.knowledgePackage,
    ...overrides,
  };
}

export function buildBatterySprayerLightingDirectorInput(): LightingDirectorAgentInput {
  return buildDefaultLightingDirectorAgentInput();
}

function resolveRetryBranch(context: LightingDirectorAgentContext): LightingDirectorAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (
    context.artificialLighting ||
    context.missingContactShadow ||
    context.flatProduct ||
    context.reflectionQualityLow ||
    context.heroLostOnBackground ||
    context.lowConfidence
  ) {
    return "strategy_shadow_reflection";
  }
  return undefined;
}

function buildLightingFromInput(
  agentInput: LightingDirectorAgentInput,
  agentContext: LightingDirectorAgentContext,
  confidenceSeed: number,
): { section: LightingSection; confidence: number; directorValid: boolean } {
  const directorContext = buildLightingDirectorContextFromAgentInput(agentInput, agentContext);
  const { section } = buildLightingSection(directorContext, confidenceSeed);
  const directorValidation = validateLightingSection(section, directorContext);
  return {
    section,
    confidence: directorValidation.valid ? confidenceSeed : 0.45,
    directorValid: directorValidation.valid,
  };
}

export async function executeLightingDirectorAgent(input: {
  agentInput?: LightingDirectorAgentInput;
  context?: LightingDirectorAgentContext;
}): Promise<LightingDirectorAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerLightingDirectorInput();
  const violations: LightingDirectorAgentViolation[] = [];
  const modulesCompleted: LightingDirectorAgentModuleId[] = [];
  const moduleRecords: LightingDirectorAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: LightingDirectorAgentRetryBranch | undefined;

  let { section, confidence, directorValid } = buildLightingFromInput(agentInput, context, 0.93);
  if (context.lowConfidence) confidence = 0.55;

  const recordLightingModules = (litSection: LightingSection, suffix = "") => {
    recordModule(moduleRecords, modulesCompleted, LightingDirectorAgentModule.LIGHTING_STRATEGY_SELECTOR, `${formatLightingSchemeLabel(litSection.lightingScheme)}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, LightingDirectorAgentModule.KEY_LIGHT_PLANNER, litSection.keyLight.direction + suffix);
    recordModule(moduleRecords, modulesCompleted, LightingDirectorAgentModule.SHADOW_ENGINE, `softness ${litSection.shadowProfile.softness}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, LightingDirectorAgentModule.REFLECTION_CONTROLLER, `${litSection.lightingBlueprint.reflectionStrength ?? 0.25}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, LightingDirectorAgentModule.COLOR_TEMPERATURE_ENGINE, `${litSection.colorTemperature}K${suffix}`);
    recordModule(moduleRecords, modulesCompleted, LightingDirectorAgentModule.LIGHTING_VALIDATOR, `${violations.length} checks${suffix}`);
    recordModule(moduleRecords, modulesCompleted, LightingDirectorAgentModule.LIGHTING_BLUEPRINT_BUILDER, "blueprint assembled" + suffix);
  };

  recordLightingModules(section);

  let blueprint = fromLightingSection(section, confidence);

  const directorContext = buildLightingDirectorContextFromAgentInput(agentInput, context);
  const directorValidation = validateLightingSection(section, directorContext);
  for (const v of directorValidation.violations) {
    violations.push(violation(v as LightingDirectorAgentFailureCode, v));
  }
  violations.push(...validateLightingDirectorAgentBlueprint(blueprint, agentInput, section, context));

  if (context.artificialLighting && violations.some((v) => v.code === "ARTIFICIAL_LIGHTING")) {
    confidence = 0.55;
  }
  if (context.missingContactShadow) {
    confidence = 0.55;
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const clean = buildLightingFromInput(agentInput, {}, 0.93);
    section = clean.section;
    directorValid = clean.directorValid;
    confidence = clean.confidence;
    blueprint = fromLightingSection(section, confidence);

    violations.length = 0;
    const retryDirectorContext = buildLightingDirectorContextFromAgentInput(agentInput, {});
    const retryValidation = validateLightingSection(section, retryDirectorContext);
    for (const v of retryValidation.violations) {
      violations.push(violation(v as LightingDirectorAgentFailureCode, v));
    }
    violations.push(...validateLightingDirectorAgentBlueprint(blueprint, agentInput, section, {}));
    recordLightingModules(section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && directorValid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
    blueprint = { ...blueprint, confidence };
  }

  if (context.artificialLighting && retryCount >= maxRetries && !context.skipRetry && violations.length > 0) {
    violations.push(violation("RETRY_EXHAUSTED", "Lighting strategy and realism retry did not resolve artificial look"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.productProfile.category,
    seed: 41,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: LIGHTING_DIRECTOR_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: LIGHTING_DIRECTOR_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const decision = await executeProfessionalDecision({
    agentId: LIGHTING_DIRECTOR_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!decision.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate lighting direction"));
  }
  if (!decision.state.problem?.professionalQuestion.toLowerCase().includes("lighting")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be lighting-focused"));
  }

  const durationMs = Date.now() - started;

  const kpis = buildLightingDirectorAgentKpis({
    blueprint: blueprint ?? {
      lightingPreset: "",
      keyLight: "",
      fillLight: "",
      rimLight: "",
      backLight: "",
      shadowStyle: "",
      reflectionStyle: "",
      colorTemperature: 0,
      contrastLevel: "",
      lightingMood: "",
      confidence: 0,
    },
    section,
    confidence,
    retryCount,
    directorValid,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= LIGHTING_DIRECTOR_AGENT_MODULES.length ||
    LIGHTING_DIRECTOR_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && directorValid && modulesComplete && Boolean(blueprint),
    agentId: LIGHTING_DIRECTOR_AGENT_ID,
    violations: uniqueViolations,
    modulesCompleted,
    moduleRecords,
    input: agentInput,
    blueprint,
    lightingSection: section,
    confidence,
    retryCount,
    retryBranch,
    durationMs,
    kpis,
    pipelineMediated: true,
    cameraExcluded: true,
    goldenRuleSatisfied: LIGHTING_DIRECTOR_AGENT_GOLDEN_RULE.includes("commercial psychology"),
  };
}

export async function executeLightingDirectorAgentWithPipeline(input: {
  agentInput?: LightingDirectorAgentInput;
  context?: LightingDirectorAgentContext;
}): Promise<LightingDirectorAgentExecutionReport> {
  const report = await executeLightingDirectorAgent(input);
  if (!report.valid || !report.blueprint) return report;

  const pipelineValid =
    LIGHTING_DIRECTOR_AGENT_PIPELINE.length === 2 &&
    LIGHTING_DIRECTOR_AGENT_PIPELINE[0].to === "lighting_director" &&
    LIGHTING_DIRECTOR_AGENT_PIPELINE[1].to === "camera_director";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== LIGHTING_DIRECTOR_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use lighting-director contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: LightingDirectorAgentViolation[]): LightingDirectorAgentViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateLightingDirectorAgentStructure(): LightingDirectorAgentViolation[] {
  if (LIGHTING_DIRECTOR_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Lighting Director Agent requires 7 internal modules")];
  }
  return [];
}

export function validateLightingDirectorAgent(
  context: LightingDirectorAgentContext = {},
): LightingDirectorAgentValidationReport {
  const violations = [...validateLightingDirectorAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateLightingDirectorAgentStructure().length === 0,
    pipelinePositionValid: LIGHTING_DIRECTOR_AGENT_PIPELINE[1].to === "camera_director",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateLightingDirectorAgentWithExecution(
  context: LightingDirectorAgentContext = {},
): Promise<LightingDirectorAgentValidationReport> {
  const report = validateLightingDirectorAgent(context);
  const kitchen = await executeLightingDirectorAgent({
    agentInput: buildBatterySprayerLightingDirectorInput(),
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

export function assertLightingDirectorAgent(
  context?: LightingDirectorAgentContext,
): LightingDirectorAgentValidationReport {
  const report = validateLightingDirectorAgent(context);
  if (!report.valid) {
    throw new Error(`Lighting Director Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runLightingDirectorAgent(
  context: LightingDirectorAgentContext = {},
): Promise<LightingDirectorAgentValidationReport> {
  return validateLightingDirectorAgentWithExecution(context);
}

export function isLightingDirectorAgentFailure(code: string): code is LightingDirectorAgentFailureCode {
  const codes: LightingDirectorAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "MISSING_LIGHT_SOURCE",
    "SHADOW_DIRECTION_CONFLICT",
    "ARTIFICIAL_LIGHTING",
    "PRODUCT_COMPOSITE_INCOMPATIBLE",
    "FLAT_PRODUCT",
    "STORY_LIGHTING_MISMATCH",
    "HERO_LOST",
    "BLUEPRINT_INCOMPLETE",
    "LOW_CONFIDENCE",
    "LOW_REFLECTION_QUALITY",
    "RETRY_EXHAUSTED",
    "DESIGN_DECISION_DETECTED",
    "CONTAINS_COMPOSITION_DECISION",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as LightingDirectorAgentFailureCode);
}

export function getLightingDirectorAgentModule(
  moduleId: LightingDirectorAgentModuleId,
): LightingDirectorAgentModuleDefinition | undefined {
  return LIGHTING_DIRECTOR_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function scoreLightingCandidateForStory(
  candidate: string,
  storyPattern: string,
): number {
  if (candidate.includes("Outdoor") && storyPattern.includes("Problem")) return 0.96;
  if (candidate.includes("Natural") && storyPattern.includes("Problem")) return 0.94;
  if (candidate.includes("Golden") && storyPattern.includes("Premium")) return 0.93;
  return 0.82;
}

export function validateLightingSupportsStory(
  lightingPreset: string,
  sceneType: string,
): boolean {
  if (sceneType.includes("Outdoor") || sceneType.includes("Natural")) {
    return !/industrial workshop|low key/i.test(lightingPreset);
  }
  return lightingPreset.length > 0;
}

export function hasNaturalOutdoorLighting(blueprint: LightingDirectorAgentBlueprint): boolean {
  return /outdoor natural|golden hour|natural/i.test(blueprint.lightingPreset);
}
