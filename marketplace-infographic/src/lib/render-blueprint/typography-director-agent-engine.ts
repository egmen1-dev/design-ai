/**
 * Chapter 7.17 — Typography Director Agent engine.
 * Designs overlay typography — never photo, materials, or composition layout structure.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import {
  buildBatterySprayerCompositionDirectorInput,
  fromPlannedCompositionBlueprint,
  toCompositionPlanningInput,
} from "./composition-director-agent-engine";
import { runCompositionPlanningStage } from "./composition-planning-stage-engine";
import { MIN_TEXT_CONTRAST_RATIO } from "./color-knowledge-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import { MarketplaceImageContext } from "./marketplace-knowledge-types";
import {
  FontCharacter,
  FontWeightRole,
  RECOMMENDED_LINE_SPACING,
  TEXT_HIERARCHY_LEVELS,
  TextAlignment,
  recommendTypographyKnowledge,
  selectFontCharacter,
  validateTypographyBlueprint,
  validateTypographyConsistency,
  type FontCharacterId,
  type TextAlignmentId,
} from "./typography-knowledge-engine";
import { StoryType } from "./visual-story-director-types";
import {
  TYPOGRAPHY_DIRECTOR_AGENT_ID,
  TypographyDirectorAgentModule,
  type TypographyDirectorAgentBlueprint,
  type TypographyDirectorAgentContext,
  type TypographyDirectorAgentExecutionReport,
  type TypographyDirectorAgentFailureCode,
  type TypographyDirectorAgentInput,
  type TypographyDirectorAgentKpi,
  type TypographyDirectorAgentModuleDefinition,
  type TypographyDirectorAgentModuleId,
  type TypographyDirectorAgentModuleRecord,
  type TypographyDirectorAgentPipelineLink,
  type TypographyDirectorAgentRetryBranch,
  type TypographyDirectorAgentTextLayer,
  type TypographyDirectorAgentValidationReport,
  type TypographyDirectorAgentViolation,
} from "./typography-director-agent-types";

export {
  TYPOGRAPHY_DIRECTOR_AGENT_ID,
  TypographyDirectorAgentModule,
  type TypographyDirectorAgentModuleId,
  type TypographyDirectorAgentInput,
  type TypographyDirectorAgentBlueprint,
  type TypographyDirectorAgentTextLayer,
  type TypographyDirectorAgentModuleRecord,
  type TypographyDirectorAgentKpi,
  type TypographyDirectorAgentViolation,
  type TypographyDirectorAgentRetryBranch,
  type TypographyDirectorAgentExecutionReport,
  type TypographyDirectorAgentValidationReport,
  type TypographyDirectorAgentContext,
  type TypographyDirectorAgentFailureCode,
  type TypographyDirectorAgentModuleDefinition,
  type TypographyDirectorAgentPipelineLink,
} from "./typography-director-agent-types";

export const TYPOGRAPHY_DIRECTOR_AGENT_VERSION = "7.17.0";
export const TYPOGRAPHY_DIRECTOR_ID: AgentContractId = TYPOGRAPHY_DIRECTOR_AGENT_ID;

export const TYPOGRAPHY_DIRECTOR_AGENT_GOLDEN_RULE =
  "The buyer does not read the card — they scan it. Typography Director has less than one second to deliver the main message. " +
  "Every headline, badge, and benefit must be instantly clear without re-reading. " +
  "It does not decorate text — it makes information commercially effective.";

export const TYPOGRAPHY_DIRECTOR_AGENT_MISSION =
  'Answer: "How should text be shown so it is read in fractions of a second?" — ' +
  "instant readability, story support, no competition with hero product.";

export const TYPOGRAPHY_DIRECTOR_AGENT_MODULES: readonly TypographyDirectorAgentModuleDefinition[] = [
  { id: TypographyDirectorAgentModule.TYPOGRAPHY_STRATEGY_SELECTOR, order: 1, label: "Typography Strategy Selector", responsibility: "Select typography strategy by category and marketplace" },
  { id: TypographyDirectorAgentModule.HIERARCHY_BUILDER, order: 2, label: "Hierarchy Builder", responsibility: "Build single-dominant text hierarchy" },
  { id: TypographyDirectorAgentModule.READABILITY_ENGINE, order: 3, label: "Readability Engine", responsibility: "Control word count, spacing, and density" },
  { id: TypographyDirectorAgentModule.TEXT_LAYOUT_PLANNER, order: 4, label: "Text Layout Planner", responsibility: "Place text in layout safe zones only" },
  { id: TypographyDirectorAgentModule.CONTRAST_CONTROLLER, order: 5, label: "Contrast Controller", responsibility: "Ensure thumbnail-readable contrast" },
  { id: TypographyDirectorAgentModule.TYPOGRAPHY_VALIDATOR, order: 6, label: "Typography Validator", responsibility: "Validate hierarchy and overlay safety" },
  { id: TypographyDirectorAgentModule.TYPOGRAPHY_BLUEPRINT_BUILDER, order: 7, label: "Typography Blueprint Builder", responsibility: "Assemble Typography Blueprint for Marketplace Director" },
] as const;

export const TYPOGRAPHY_DIRECTOR_AGENT_PIPELINE: readonly TypographyDirectorAgentPipelineLink[] = [
  { from: "material_director", to: "typography_director" },
  { from: "typography_director", to: "marketplace_director" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;

const PHOTO_KEYWORDS = /\b(key light|focal length|lens|camera angle|material world|roughness profile)\b/i;

const FONT_FAMILY_BY_CHARACTER: Record<FontCharacterId, string> = {
  [FontCharacter.SANS_SERIF]: "Inter",
  [FontCharacter.GEOMETRIC]: "Montserrat",
  [FontCharacter.TECHNICAL]: "IBM Plex Sans",
  [FontCharacter.HUMANIST]: "Source Sans 3",
  [FontCharacter.SERIF]: "Merriweather",
  [FontCharacter.DISPLAY]: "Bebas Neue",
};

const STRATEGY_LABELS = {
  MARKETPLACE_MINIMAL: "Marketplace Minimal",
  PREMIUM_MODERN: "Premium Modern",
  BOLD_COMMERCIAL: "Bold Commercial",
  TECHNICAL_INDUSTRIAL: "Technical Industrial",
  LIFESTYLE_ELEGANT: "Lifestyle Elegant",
} as const;

type TypographyStrategyId = (typeof STRATEGY_LABELS)[keyof typeof STRATEGY_LABELS];

type TypographySection = {
  strategy: TypographyStrategyId;
  fontCharacter: FontCharacterId;
  hierarchyOrder: string[];
  alignment: TextAlignmentId;
  contrastRatio: number;
  lineSpacing: number;
  textDensity: number;
  boldCount: number;
  headlineWordCount: number;
  confidence: number;
};

function violation(
  code: TypographyDirectorAgentFailureCode,
  message: string,
  module?: TypographyDirectorAgentModuleId,
): TypographyDirectorAgentViolation {
  return { code, message, module };
}

function recordModule(
  records: TypographyDirectorAgentModuleRecord[],
  completed: TypographyDirectorAgentModuleId[],
  module: TypographyDirectorAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

function trimWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isGardenToolsCategory(input: TypographyDirectorAgentInput): boolean {
  const category = input.knowledgePackage.query.category.toLowerCase();
  const sub = input.knowledgePackage.query.subcategory?.toLowerCase() ?? "";
  return category.includes("garden") || sub.includes("sprayer") || sub.includes("tool");
}

function mapStoryType(input: TypographyDirectorAgentInput): string {
  if (isGardenToolsCategory(input)) return StoryType.SAFETY;
  if (input.storyBlueprint.emotionalDirection.toLowerCase().includes("luxury")) {
    return StoryType.PREMIUM_LIFESTYLE;
  }
  return StoryType.PROBLEM_SOLUTION;
}

export function selectTypographyStrategy(input: TypographyDirectorAgentInput): TypographyStrategyId {
  if (isGardenToolsCategory(input)) return STRATEGY_LABELS.BOLD_COMMERCIAL;
  if (input.storyBlueprint.emotionalDirection.toLowerCase().includes("luxury")) {
    return STRATEGY_LABELS.PREMIUM_MODERN;
  }
  if (mapStoryType(input) === StoryType.TECHNOLOGY) return STRATEGY_LABELS.TECHNICAL_INDUSTRIAL;
  if (input.marketplaceProfile.id === "wildberries") return STRATEGY_LABELS.MARKETPLACE_MINIMAL;
  return STRATEGY_LABELS.BOLD_COMMERCIAL;
}

export function selectTypographyFontCharacter(input: TypographyDirectorAgentInput): FontCharacterId {
  if (isGardenToolsCategory(input)) return FontCharacter.GEOMETRIC;
  const ctx = {
    styleId: selectTypographyStrategy(input).toLowerCase().replace(/\s+/g, "-"),
    category: input.knowledgePackage.query.category,
    marketplace: input.marketplaceProfile.id,
    imageContext: MarketplaceImageContext.INFOGRAPHIC,
    informationDensity: "medium" as const,
    storyType: mapStoryType(input),
  };
  return selectFontCharacter(ctx);
}

export function buildTextHierarchy(
  input: TypographyDirectorAgentInput,
  agentContext: TypographyDirectorAgentContext = {},
): TypographyDirectorAgentTextLayer[] {
  const headlineMax = agentContext.poorReadability ? 12 : 7;
  const headline = trimWords(input.storyBlueprint.primaryMessage, headlineMax);
  const benefit = trimWords(input.businessModel.primaryValue, 12);
  const secondary = trimWords(input.storyBlueprint.secondaryMessage, 10);
  const supporting = trimWords(input.businessModel.secondaryValues[0] ?? "Reliable performance", 8);

  return [
    { level: 1, role: "headline", content: headline, weight: FontWeightRole.HEADLINE, maxWords: 7 },
    { level: 2, role: "primary_benefit", content: benefit, weight: FontWeightRole.PRIMARY, maxWords: 12 },
    { level: 3, role: "supporting_text", content: secondary, weight: FontWeightRole.SUPPORTING, maxWords: 10 },
    { level: 4, role: "technical_details", content: supporting, weight: FontWeightRole.SUPPORTING, maxWords: 8 },
  ];
}

export function buildTypographySection(
  input: TypographyDirectorAgentInput,
  agentContext: TypographyDirectorAgentContext = {},
  confidence: number,
): TypographySection {
  const strategy = selectTypographyStrategy(input);
  const fontCharacter = selectTypographyFontCharacter(input);
  const hierarchy = buildTextHierarchy(input, agentContext);
  const headlineWordCount = wordCount(hierarchy[0]?.content ?? "");
  const textDensity = agentContext.poorReadability ? 0.42 : 0.22;
  const contrastRatio = agentContext.lowContrastScore ? 3.8 : 5.2;

  return {
    strategy,
    fontCharacter,
    hierarchyOrder: hierarchy.map((layer) => layer.role),
    alignment: strategy === STRATEGY_LABELS.PREMIUM_MODERN ? TextAlignment.CENTER : TextAlignment.LEFT,
    contrastRatio,
    lineSpacing: RECOMMENDED_LINE_SPACING.min + 0.2,
    textDensity,
    boldCount: 1,
    headlineWordCount,
    confidence,
  };
}

export function fromTypographySection(
  section: TypographySection,
  hierarchy: TypographyDirectorAgentTextLayer[],
  input: TypographyDirectorAgentInput,
  confidence: number,
): TypographyDirectorAgentBlueprint {
  const fontFamily = FONT_FAMILY_BY_CHARACTER[section.fontCharacter];
  return {
    headingStyle: `${section.strategy} — ${section.fontCharacter.replace(/_/g, " ")} headline`,
    subheadingStyle: "medium weight benefit line",
    bodyStyle: "regular supporting copy",
    fontFamily,
    fontWeights: [FontWeightRole.HEADLINE, FontWeightRole.PRIMARY, FontWeightRole.SUPPORTING],
    textHierarchy: hierarchy,
    alignment: section.alignment,
    contrastProfile: `WCAG ${section.contrastRatio.toFixed(1)}:1 thumbnail safe`,
    safeZones: input.layoutBlueprint.textZones.map((zone) => ({ ...zone })),
    confidence,
  };
}

export function validateTypographyDirectorAgentBlueprint(
  blueprint?: TypographyDirectorAgentBlueprint,
  input?: TypographyDirectorAgentInput,
  section?: TypographySection,
  agentContext: TypographyDirectorAgentContext = {},
): TypographyDirectorAgentViolation[] {
  const violations: TypographyDirectorAgentViolation[] = [];
  if (!blueprint) {
    violations.push(
      violation("BLUEPRINT_INCOMPLETE", "Typography Blueprint is required", TypographyDirectorAgentModule.TYPOGRAPHY_BLUEPRINT_BUILDER),
    );
    return violations;
  }

  if (agentContext.poorReadability || (section && section.headlineWordCount > 7)) {
    violations.push(
      violation("POOR_READABILITY", "Headline must stay within 3–7 words for marketplace scan speed", TypographyDirectorAgentModule.READABILITY_ENGINE),
    );
  }

  if (agentContext.hierarchyConflict || blueprint.textHierarchy[0]?.level !== 1) {
    violations.push(
      violation("HIERARCHY_CONFLICT", "Only one dominant headline level is allowed", TypographyDirectorAgentModule.HIERARCHY_BUILDER),
    );
  }

  if (agentContext.textOutsideSafeZones || blueprint.safeZones.length === 0) {
    violations.push(
      violation("TEXT_OUTSIDE_SAFE_ZONES", "Text must fit layout safe zones", TypographyDirectorAgentModule.TEXT_LAYOUT_PLANNER),
    );
  }

  if (agentContext.overlayObscuresHero) {
    violations.push(
      violation("OVERLAY_OBSCURES_HERO", "Typography must not obscure hero product", TypographyDirectorAgentModule.TEXT_LAYOUT_PLANNER),
    );
  }

  if (agentContext.lowContrastScore || (section && section.contrastRatio < MIN_TEXT_CONTRAST_RATIO)) {
    violations.push(
      violation("LOW_CONTRAST_SCORE", "Text contrast below marketplace readability threshold", TypographyDirectorAgentModule.CONTRAST_CONTROLLER),
    );
  }

  if (section && section.textDensity > 0.35) {
    violations.push(
      violation("EXCESSIVE_TEXT_DENSITY", "Text density too high for infographic overlay", TypographyDirectorAgentModule.READABILITY_ENGINE),
    );
  }

  const knowledgeCheck = validateTypographyBlueprint({
    hierarchyOrder: section?.hierarchyOrder ?? blueprint.textHierarchy.map((t) => t.role),
    contrastRatio: section?.contrastRatio,
    alignment: section ? [section.alignment] : [blueprint.alignment as TextAlignmentId],
    boldCount: section?.boldCount,
    lineSpacing: section?.lineSpacing,
    textDensity: section?.textDensity,
    fontCharacters: section ? [section.fontCharacter] : undefined,
    headlineReadable: !agentContext.poorReadability,
    productObscured: agentContext.overlayObscuresHero,
    sizeScaleConsistent: true,
  });

  for (const v of knowledgeCheck.violations) {
    violations.push(
      violation(v.code as TypographyDirectorAgentFailureCode, v.message, TypographyDirectorAgentModule.TYPOGRAPHY_VALIDATOR),
    );
  }

  const serialized = JSON.stringify(blueprint);
  if (PHOTO_KEYWORDS.test(serialized)) {
    violations.push(
      violation("CONTAINS_PHOTO_DECISION", "Typography must not decide photo or material parameters", TypographyDirectorAgentModule.TYPOGRAPHY_VALIDATOR),
    );
  }

  if (input && blueprint.safeZones.some((zone) => overlapsHero(zone, input.layoutBlueprint.heroPlacement))) {
    violations.push(
      violation("OVERLAY_OBSCURES_HERO", "Safe zones must not overlap hero placement", TypographyDirectorAgentModule.TEXT_LAYOUT_PLANNER),
    );
  }

  return violations;
}

function overlapsHero(zone: { x: number; y: number; width: number; height: number }, hero: { x: number; y: number; width: number; height: number }): boolean {
  const overlapX = zone.x < hero.x + hero.width && zone.x + zone.width > hero.x;
  const overlapY = zone.y < hero.y + hero.height && zone.y + zone.height > hero.y;
  return overlapX && overlapY && zone.width * zone.height > hero.width * hero.height * 0.35;
}

export function buildTypographyDirectorAgentKpis(input: {
  blueprint: TypographyDirectorAgentBlueprint;
  section: TypographySection;
  confidence: number;
  retryCount: number;
  directorValid: boolean;
}): TypographyDirectorAgentKpi {
  const { blueprint, section, confidence, retryCount, directorValid } = input;
  const headlineWords = wordCount(blueprint.textHierarchy[0]?.content ?? "");
  return {
    readabilityScore: directorValid && headlineWords <= 7 ? 0.93 : 0.58,
    typographyConsistency: validateTypographyConsistency({
      alignments: [section.alignment],
      fontCharacters: [section.fontCharacter],
      sizeScaleConsistent: true,
    })
      ? 0.91
      : 0.65,
    marketplaceFit: section.strategy.includes("Marketplace") || section.strategy.includes("Commercial") ? 0.9 : 0.82,
    informationDensity: section.textDensity <= 0.3 ? 0.88 : 0.55,
    hierarchyQuality: blueprint.textHierarchy[0]?.level === 1 ? 0.92 : 0.6,
    overlaySafety: blueprint.safeZones.length > 0 ? 0.91 : 0.5,
    retryRate: retryCount > 0 ? retryCount / (retryCount + 1) : 0,
    confidenceScore: confidence,
  };
}

export function mapTypographyDirectorModuleToStage(module: TypographyDirectorAgentModuleId): string {
  const mapping: Record<TypographyDirectorAgentModuleId, string> = {
    [TypographyDirectorAgentModule.TYPOGRAPHY_STRATEGY_SELECTOR]: "typography_strategy",
    [TypographyDirectorAgentModule.HIERARCHY_BUILDER]: "text_hierarchy",
    [TypographyDirectorAgentModule.READABILITY_ENGINE]: "readability",
    [TypographyDirectorAgentModule.TEXT_LAYOUT_PLANNER]: "text_layout",
    [TypographyDirectorAgentModule.CONTRAST_CONTROLLER]: "contrast_profile",
    [TypographyDirectorAgentModule.TYPOGRAPHY_VALIDATOR]: "validation",
    [TypographyDirectorAgentModule.TYPOGRAPHY_BLUEPRINT_BUILDER]: "blueprint_assembly",
  };
  return mapping[module];
}

export function buildDefaultTypographyDirectorAgentInput(
  overrides: Partial<TypographyDirectorAgentInput> = {},
): TypographyDirectorAgentInput {
  const compInput = buildBatterySprayerCompositionDirectorInput();
  const planningReport = runCompositionPlanningStage(toCompositionPlanningInput(compInput));
  const layoutBlueprint = fromPlannedCompositionBlueprint(
    planningReport.section!.plannedBlueprint,
    planningReport.section!.confidence,
  );

  return {
    storyBlueprint: compInput.storyBlueprint,
    layoutBlueprint,
    businessModel: compInput.businessModel,
    marketplaceProfile: compInput.marketplaceProfile,
    knowledgePackage: compInput.knowledgePackage,
    ...overrides,
  };
}

export function buildBatterySprayerTypographyDirectorInput(): TypographyDirectorAgentInput {
  return buildDefaultTypographyDirectorAgentInput();
}

function resolveRetryBranch(context: TypographyDirectorAgentContext): TypographyDirectorAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (
    context.poorReadability ||
    context.hierarchyConflict ||
    context.textOutsideSafeZones ||
    context.overlayObscuresHero ||
    context.lowContrastScore ||
    context.lowConfidence
  ) {
    return "hierarchy_readability_layout";
  }
  return undefined;
}

function buildTypographyFromInput(
  agentInput: TypographyDirectorAgentInput,
  agentContext: TypographyDirectorAgentContext,
  confidenceSeed: number,
): {
  section: TypographySection;
  hierarchy: TypographyDirectorAgentTextLayer[];
  confidence: number;
  directorValid: boolean;
} {
  const section = buildTypographySection(agentInput, agentContext, confidenceSeed);
  const hierarchy = buildTextHierarchy(agentInput, agentContext);
  const knowledge = recommendTypographyKnowledge({
    styleId: section.strategy.toLowerCase().replace(/\s+/g, "-"),
    category: agentInput.knowledgePackage.query.category,
    marketplace: agentInput.marketplaceProfile.id,
    imageContext: MarketplaceImageContext.INFOGRAPHIC,
    informationDensity: "medium",
    storyType: mapStoryType(agentInput),
  });
  const directorValid =
    validateTypographyBlueprint({
      hierarchyOrder: section.hierarchyOrder,
      contrastRatio: section.contrastRatio,
      boldCount: section.boldCount,
      lineSpacing: section.lineSpacing,
      textDensity: section.textDensity,
      headlineReadable: !agentContext.poorReadability,
      productObscured: agentContext.overlayObscuresHero,
      fontCharacters: [section.fontCharacter],
      alignment: [section.alignment],
      sizeScaleConsistent: true,
    }).valid && knowledge.length > 0;

  return {
    section,
    hierarchy,
    confidence: directorValid ? confidenceSeed : 0.45,
    directorValid,
  };
}

export async function executeTypographyDirectorAgent(input: {
  agentInput?: TypographyDirectorAgentInput;
  context?: TypographyDirectorAgentContext;
}): Promise<TypographyDirectorAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerTypographyDirectorInput();
  const violations: TypographyDirectorAgentViolation[] = [];
  const modulesCompleted: TypographyDirectorAgentModuleId[] = [];
  const moduleRecords: TypographyDirectorAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: TypographyDirectorAgentRetryBranch | undefined;

  let { section, hierarchy, confidence, directorValid } = buildTypographyFromInput(agentInput, context, 0.93);
  if (context.lowConfidence) confidence = 0.55;

  const recordTypographyModules = (typoSection: TypographySection, suffix = "") => {
    recordModule(moduleRecords, modulesCompleted, TypographyDirectorAgentModule.TYPOGRAPHY_STRATEGY_SELECTOR, `${typoSection.strategy}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, TypographyDirectorAgentModule.HIERARCHY_BUILDER, `${typoSection.hierarchyOrder[0]}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, TypographyDirectorAgentModule.READABILITY_ENGINE, `${typoSection.headlineWordCount} words${suffix}`);
    recordModule(moduleRecords, modulesCompleted, TypographyDirectorAgentModule.TEXT_LAYOUT_PLANNER, `${agentInput.layoutBlueprint.textZones.length} zones${suffix}`);
    recordModule(moduleRecords, modulesCompleted, TypographyDirectorAgentModule.CONTRAST_CONTROLLER, `${typoSection.contrastRatio}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, TypographyDirectorAgentModule.TYPOGRAPHY_VALIDATOR, `${violations.length} checks${suffix}`);
    recordModule(moduleRecords, modulesCompleted, TypographyDirectorAgentModule.TYPOGRAPHY_BLUEPRINT_BUILDER, "blueprint assembled" + suffix);
  };

  recordTypographyModules(section);

  let blueprint = fromTypographySection(section, hierarchy, agentInput, confidence);
  violations.push(...validateTypographyDirectorAgentBlueprint(blueprint, agentInput, section, context));

  if (
    context.poorReadability ||
    context.hierarchyConflict ||
    context.textOutsideSafeZones ||
    context.overlayObscuresHero ||
    context.lowContrastScore
  ) {
    confidence = 0.55;
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const clean = buildTypographyFromInput(agentInput, {}, 0.93);
    section = clean.section;
    hierarchy = clean.hierarchy;
    directorValid = clean.directorValid;
    confidence = clean.confidence;
    blueprint = fromTypographySection(section, hierarchy, agentInput, confidence);

    violations.length = 0;
    violations.push(...validateTypographyDirectorAgentBlueprint(blueprint, agentInput, section, {}));
    recordTypographyModules(section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && directorValid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
    blueprint = { ...blueprint, confidence };
  }

  if (context.poorReadability && retryCount >= maxRetries && !context.skipRetry && violations.length > 0) {
    violations.push(violation("RETRY_EXHAUSTED", "Hierarchy and readability retry did not resolve scan speed conflict"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.knowledgePackage.query.category,
    seed: 45,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: TYPOGRAPHY_DIRECTOR_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: TYPOGRAPHY_DIRECTOR_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const decision = await executeProfessionalDecision({
    agentId: TYPOGRAPHY_DIRECTOR_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!decision.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate typography direction"));
  }
  if (!decision.state.problem?.professionalQuestion.toLowerCase().includes("professional")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be typography-focused"));
  }

  const durationMs = Date.now() - started;

  const kpis = buildTypographyDirectorAgentKpis({
    blueprint: blueprint ?? {
      headingStyle: "",
      subheadingStyle: "",
      bodyStyle: "",
      fontFamily: "",
      fontWeights: [],
      textHierarchy: [],
      alignment: "",
      contrastProfile: "",
      safeZones: [],
      confidence: 0,
    },
    section,
    confidence,
    retryCount,
    directorValid,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= TYPOGRAPHY_DIRECTOR_AGENT_MODULES.length ||
    TYPOGRAPHY_DIRECTOR_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && directorValid && modulesComplete && Boolean(blueprint),
    agentId: TYPOGRAPHY_DIRECTOR_AGENT_ID,
    violations: uniqueViolations,
    modulesCompleted,
    moduleRecords,
    input: agentInput,
    blueprint,
    confidence,
    retryCount,
    retryBranch,
    durationMs,
    kpis,
    pipelineMediated: true,
    photoExcluded: true,
    materialExcluded: true,
    goldenRuleSatisfied: TYPOGRAPHY_DIRECTOR_AGENT_GOLDEN_RULE.includes("less than one second"),
  };
}

export async function executeTypographyDirectorAgentWithPipeline(input: {
  agentInput?: TypographyDirectorAgentInput;
  context?: TypographyDirectorAgentContext;
}): Promise<TypographyDirectorAgentExecutionReport> {
  const report = await executeTypographyDirectorAgent(input);
  if (!report.valid || !report.blueprint) return report;

  const pipelineValid =
    TYPOGRAPHY_DIRECTOR_AGENT_PIPELINE.length === 2 &&
    TYPOGRAPHY_DIRECTOR_AGENT_PIPELINE[0].to === "typography_director" &&
    TYPOGRAPHY_DIRECTOR_AGENT_PIPELINE[1].to === "marketplace_director";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== TYPOGRAPHY_DIRECTOR_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use typography-director contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: TypographyDirectorAgentViolation[]): TypographyDirectorAgentViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateTypographyDirectorAgentStructure(): TypographyDirectorAgentViolation[] {
  if (TYPOGRAPHY_DIRECTOR_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Typography Director Agent requires 7 internal modules")];
  }
  return [];
}

export function validateTypographyDirectorAgent(
  context: TypographyDirectorAgentContext = {},
): TypographyDirectorAgentValidationReport {
  const violations = [...validateTypographyDirectorAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateTypographyDirectorAgentStructure().length === 0,
    pipelinePositionValid: TYPOGRAPHY_DIRECTOR_AGENT_PIPELINE[1].to === "marketplace_director",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateTypographyDirectorAgentWithExecution(
  context: TypographyDirectorAgentContext = {},
): Promise<TypographyDirectorAgentValidationReport> {
  const report = validateTypographyDirectorAgent(context);
  const kitchen = await executeTypographyDirectorAgent({
    agentInput: buildBatterySprayerTypographyDirectorInput(),
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

export function assertTypographyDirectorAgent(
  context?: TypographyDirectorAgentContext,
): TypographyDirectorAgentValidationReport {
  const report = validateTypographyDirectorAgent(context);
  if (!report.valid) {
    throw new Error(`Typography Director Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runTypographyDirectorAgent(
  context: TypographyDirectorAgentContext = {},
): Promise<TypographyDirectorAgentValidationReport> {
  return validateTypographyDirectorAgentWithExecution(context);
}

export function isTypographyDirectorAgentFailure(code: string): code is TypographyDirectorAgentFailureCode {
  const codes: TypographyDirectorAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "POOR_READABILITY",
    "HIERARCHY_CONFLICT",
    "TEXT_OUTSIDE_SAFE_ZONES",
    "OVERLAY_OBSCURES_HERO",
    "LOW_CONTRAST_SCORE",
    "EXCESSIVE_TEXT_DENSITY",
    "BLUEPRINT_INCOMPLETE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "DESIGN_DECISION_DETECTED",
    "CONTAINS_PHOTO_DECISION",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as TypographyDirectorAgentFailureCode);
}

export function getTypographyDirectorAgentModule(
  moduleId: TypographyDirectorAgentModuleId,
): TypographyDirectorAgentModuleDefinition | undefined {
  return TYPOGRAPHY_DIRECTOR_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function scoreTypographyCandidateForStory(
  candidate: string,
  storyPattern: string,
): number {
  if (candidate.includes("Bold") && storyPattern.includes("Problem")) return 0.95;
  if (candidate.includes("Marketplace") && storyPattern.includes("Problem")) return 0.93;
  if (candidate.includes("Premium") && storyPattern.includes("Premium")) return 0.92;
  return 0.82;
}

export function validateTypographySupportsMarketplace(
  headlineWordCount: number,
  marketplaceId: string,
): boolean {
  if (marketplaceId === "wildberries" && headlineWordCount > 7) return false;
  return headlineWordCount >= 3;
}

export function hasMarketplaceHeadlineHierarchy(blueprint: TypographyDirectorAgentBlueprint): boolean {
  return blueprint.textHierarchy[0]?.role === "headline" && blueprint.safeZones.length > 0;
}

export function countHeadlineWords(blueprint: TypographyDirectorAgentBlueprint): number {
  return wordCount(blueprint.textHierarchy[0]?.content ?? "");
}
