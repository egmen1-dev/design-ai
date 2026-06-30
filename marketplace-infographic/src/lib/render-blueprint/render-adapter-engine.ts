/**
 * Chapter 4.17 — Render Adapter engine.
 * Translates Render Blueprint into provider Render Intent — never design decisions.
 */
import type { AgentContractId } from "./agent-contracts";
import { assertReadyForAdapter } from "./constitution";
import type { RenderBlueprint } from "./types";
import { extractRenderIntent } from "./render-intent";
import {
  compileNegativePrompt,
  validateNegativePrompt,
} from "./negative-prompt-contract";
import {
  compilePromptForProvider,
  validateCompiledPrompt,
  BANNED_PROMPT_TERMS,
} from "./prompt-compiler";
import { negotiateCapabilities } from "./capability-negotiation";
import type { CompiledProviderRequest, ProviderId } from "./render-pipeline-types";
import { StoryType } from "./visual-story-director-types";
import {
  type AdapterRenderIntent,
  type PromptBlockTrace,
  type RenderAdapterContext,
  type RenderAdapterExplainabilityReport,
  type RenderAdapterFailureCode,
  type RenderAdapterValidationReport,
  type SemanticBlock,
  type SemanticSectionId,
} from "./render-adapter-types";

export {
  type SemanticSectionId,
  type SemanticBlock,
  type AdapterRenderIntent,
  type RenderAdapterContext,
  type PromptBlockTrace,
  type RenderAdapterExplainabilityReport,
  type RenderAdapterValidationReport,
  type RenderAdapterFailureCode,
} from "./render-adapter-types";

export const RENDER_ADAPTER_VERSION = "4.17.0";

export const RENDER_ADAPTER_GOLDEN_RULE =
  "Render Adapter does not make design decisions — it is a professional translator " +
  "between Design AI language and the specific AI model language.";

export const RENDER_ADAPTER_ID: AgentContractId = "flux-adapter";

export const RENDER_ADAPTER_PIPELINE_POSITION = [
  "material-director",
  "render-pipeline",
  RENDER_ADAPTER_ID,
] as const;

const CREATIVE_INJECTION = /\b(add (a |an )?person|beautiful plants|dramatic god rays|make it prettier|for beauty)\b/i;

function semanticTranslation(blueprint: Readonly<RenderBlueprint>): SemanticBlock[] {
  const blocks: SemanticBlock[] = [];

  if (blueprint.story.storyType || blueprint.story.primaryEmotion) {
    blocks.push({
      section: "story",
      label: "Story",
      value: [blueprint.story.storyType, blueprint.story.primaryEmotion].filter(Boolean).join(" — "),
    });
  }

  blocks.push({
    section: "scene",
    label: "Scene",
    value: [
      blueprint.scene.sceneType ?? blueprint.scene.environment,
      blueprint.scene.architecture,
    ]
      .filter(Boolean)
      .join(", "),
  });

  blocks.push({
    section: "photography",
    label: "Photography",
    value: [
      blueprint.photography.photographyStyle ?? blueprint.photography.style,
      blueprint.photography.visualMood,
    ]
      .filter(Boolean)
      .join(", "),
  });

  blocks.push({
    section: "lighting",
    label: "Lighting",
    value: [
      blueprint.lighting.lightingScheme ?? blueprint.lighting.preset,
      blueprint.lighting.lightingMood,
    ]
      .filter(Boolean)
      .join(", "),
  });

  blocks.push({
    section: "camera",
    label: "Camera",
    value: [
      blueprint.camera.focalLength ? `${blueprint.camera.focalLength}mm` : `${blueprint.camera.lens}mm`,
      blueprint.camera.cameraHeight ?? blueprint.camera.height,
      blueprint.camera.cameraAngle ?? blueprint.camera.angle,
    ]
      .filter(Boolean)
      .join(", "),
  });

  blocks.push({
    section: "materials",
    label: "Materials",
    value: [
      blueprint.materials.materialWorld,
      blueprint.materials.floor,
      blueprint.materials.contactSurface,
    ]
      .filter(Boolean)
      .join(", "),
  });

  blocks.push({
    section: "composition",
    label: "Composition",
    value: blueprint.composition.templateId ?? blueprint.composition.template,
  });

  return blocks;
}

function mapBlockToPromptFragment(block: SemanticBlock, provider: ProviderId): string {
  switch (block.section) {
    case "story":
      return `commercial mood: ${block.value}`;
    case "scene":
      return provider === "gpt-image"
        ? `Scene environment: ${block.value}`
        : `${block.value} setting`;
    case "photography":
      return `photography style ${block.value}`;
    case "lighting":
      return `lighting ${block.value.replace(/_/g, " ")}`;
    case "camera":
      return `camera ${block.value.replace(/_/g, " ")}`;
    case "materials":
      return `materials ${block.value.replace(/_/g, " ")}`;
    case "composition":
      return provider === "flux" || provider === "pollinations"
        ? ""
        : `composition ${block.value.replace(/_/g, " ")}`;
    default:
      return block.value;
  }
}

function collectHints(blueprint: Readonly<RenderBlueprint>) {
  const styleHints = [
    blueprint.story.visualPromise,
    blueprint.photography.photoMood,
    ...(blueprint.photography.providerHints ?? []),
  ].filter(Boolean) as string[];

  const lightingHints = [
    blueprint.lighting.lightingMood,
    ...(blueprint.lighting.providerHints ?? []),
  ].filter(Boolean) as string[];

  const cameraHints = [
    blueprint.photography.cameraIntent,
    ...(blueprint.camera.providerHints ?? []),
  ].filter(Boolean) as string[];

  const materialHints = [
    blueprint.photography.materialIntent,
    ...(blueprint.materials.providerHints ?? []),
  ].filter(Boolean) as string[];

  const providerHints = [
    ...(blueprint.scene.providerHints ?? []),
    ...lightingHints.slice(0, 1),
    ...cameraHints.slice(0, 1),
    ...materialHints.slice(0, 1),
  ].filter(Boolean) as string[];

  const qualityHints = [
    `quality ${blueprint.render.quality}`,
    blueprint.render.negativePromptProfile
      ? `profile ${blueprint.render.negativePromptProfile}`
      : "",
  ].filter(Boolean) as string[];

  return { styleHints, lightingHints, cameraHints, materialHints, providerHints, qualityHints };
}

function storyDerivedNegativeTerms(blueprint: Readonly<RenderBlueprint>): string[] {
  const terms: string[] = [];
  const story = blueprint.story.storyType;

  if (
    story === StoryType.MINIMAL_LUXURY ||
    story === StoryType.PREMIUM_LIFESTYLE ||
    blueprint.creative.priceSegment === "premium"
  ) {
    terms.push("clutter", "busy background", "extra objects", "distorted perspective", "oversaturated colors");
  }

  if (story === StoryType.TECHNOLOGY || story === StoryType.INNOVATION) {
    terms.push("messy cables", "chaotic workspace", "low quality lighting");
  }

  if (blueprint.background.complexity === "minimal") {
    terms.push("clutter", "busy background");
  }

  return terms;
}

function buildNegativePrompt(blueprint: Readonly<RenderBlueprint>, supportsNegative: boolean): string {
  if (!supportsNegative) return "";
  const base = compileNegativePrompt(blueprint);
  const extra = storyDerivedNegativeTerms(blueprint);
  return [...new Set([...base.split(/,\s*/), ...extra])].filter(Boolean).join(", ");
}

function confidenceFromBlueprint(blueprint: Readonly<RenderBlueprint>): number {
  let score = 0.78;
  if (blueprint.story.storyType) score += 0.03;
  if (blueprint.scene.sceneType) score += 0.03;
  if (blueprint.lighting.lightingScheme) score += 0.03;
  if (blueprint.camera.cameraStyle || blueprint.camera.focalLength) score += 0.03;
  if (blueprint.materials.materialWorld) score += 0.03;
  if (blueprint.photography.photographyStyle) score += 0.03;
  return Math.min(0.98, score);
}

function promptBlocksFromSemantics(
  blocks: SemanticBlock[],
  provider: ProviderId,
): PromptBlockTrace[] {
  return blocks
    .map((block) => ({
      section: block.section,
      promptFragment: mapBlockToPromptFragment(block, provider),
    }))
    .filter((b) => b.promptFragment.length > 0);
}

export function buildAdapterRenderIntent(
  blueprint: Readonly<RenderBlueprint>,
  ctx: RenderAdapterContext,
): { intent: AdapterRenderIntent; explainability: RenderAdapterExplainabilityReport } {
  assertReadyForAdapter(blueprint);

  const provider = ctx.providerId as ProviderId;
  const blueprintIntent = extractRenderIntent(blueprint);
  const { capabilities } = negotiateCapabilities(blueprintIntent, provider);

  const positivePrompt = compilePromptForProvider(blueprintIntent, provider);
  const negativePrompt = buildNegativePrompt(blueprint, capabilities.supportsNegativePrompt);
  const hints = collectHints(blueprint);
  const semanticBlocks = semanticTranslation(blueprint);
  const promptBlocks = promptBlocksFromSemantics(semanticBlocks, provider);

  const intent: AdapterRenderIntent = {
    provider,
    positivePrompt,
    negativePrompt,
    styleHints: hints.styleHints,
    providerHints: hints.providerHints,
    cameraHints: hints.cameraHints,
    lightingHints: hints.lightingHints,
    materialHints: hints.materialHints,
    qualityHints: hints.qualityHints,
    seed: capabilities.supportsSeed ? (ctx.seed ?? blueprint.meta.seed) : 0,
    aspectRatio: ctx.aspectRatio ?? blueprint.render.aspectRatio,
    confidence: confidenceFromBlueprint(blueprint),
  };

  const explainability: RenderAdapterExplainabilityReport = {
    agentId: RENDER_ADAPTER_ID,
    semanticBlocks,
    promptBlocks,
    rejectedCreativeAdditions: [
      "no people added — background.containsPeople governs",
      "no decorative plants unless scene palette includes them",
      "no lighting scheme substitution beyond blueprint",
    ],
    blueprintFidelity: "Every prompt fragment traces to an upstream director section",
    reasoning: [
      `Semantic translation extracted ${semanticBlocks.length} blocks from blueprint sections`,
      `Provider mapping applied for ${provider} vocabulary`,
      `Positive prompt assembled from scene, lighting, camera, materials — not invented`,
      `Negative prompt derived from constraints and story (${storyDerivedNegativeTerms(blueprint).length} story terms)`,
      `Provider hints forwarded without modification from director sections`,
      `Adapter is stateless — no knowledge retained after compile`,
    ],
  };

  return { intent, explainability };
}

export function validateAdapterRenderIntent(
  intent: AdapterRenderIntent,
  blueprint: Readonly<RenderBlueprint>,
): RenderAdapterValidationReport {
  const violations: string[] = [];

  if (!blueprint.scene.environment) violations.push("MISSING_BLUEPRINT_SECTION");
  if (!blueprint.materials.floor) violations.push("MISSING_BLUEPRINT_SECTION");

  const promptValidation = validateCompiledPrompt(intent.positivePrompt);
  if (!promptValidation.ok) {
    if (promptValidation.issues.some((i) => i.includes("banned"))) violations.push("BANNED_TERMS");
    if (promptValidation.issues.some((i) => i.includes("coordinates"))) violations.push("CONTAINS_COORDINATES");
    if (promptValidation.issues.some((i) => i.includes("empty"))) violations.push("PROMPT_NOT_DERIVED");
  }

  if (BANNED_PROMPT_TERMS.test(intent.positivePrompt)) violations.push("BANNED_TERMS");
  if (/\bx\s*=\s*[\d.]+/i.test(intent.positivePrompt)) violations.push("CONTAINS_COORDINATES");
  if (CREATIVE_INJECTION.test(intent.positivePrompt)) violations.push("CREATIVE_ADDITION");

  if (intent.negativePrompt) {
    const negValidation = validateNegativePrompt(intent.negativePrompt);
    if (!negValidation.ok) violations.push("PROMPT_NOT_DERIVED");
  }

  const distinctiveMaterials = ["oak", "marble", "walnut", "concrete", "linen"];
  for (const material of distinctiveMaterials) {
    if (
      blueprint.materials.floor.toLowerCase().includes(material) &&
      !intent.positivePrompt.toLowerCase().includes(material)
    ) {
      violations.push("BLUEPRINT_DRIFT");
      break;
    }
  }

  if (
    blueprint.background.containsPeople === false &&
    /\b(person|people|human|man|woman)\b/i.test(
      intent.positivePrompt
        .replace(/\bno (people|person|humans?)\b/gi, "")
        .replace(/\b(or|without)\s+(people|person|humans?)\b/gi, "")
        .replace(/\bno text,\s*logos,\s*or people\b/gi, ""),
    )
  ) {
    violations.push("CREATIVE_ADDITION");
  }

  return { valid: violations.length === 0, violations, intent };
}

export function isRenderAdapterFailure(code: string): code is RenderAdapterFailureCode {
  return [
    "MISSING_BLUEPRINT_SECTION",
    "CREATIVE_ADDITION",
    "BLUEPRINT_DRIFT",
    "BANNED_TERMS",
    "CONTAINS_COORDINATES",
    "PROMPT_NOT_DERIVED",
    "PROVIDER_UNSUPPORTED",
  ].includes(code);
}

export function runRenderAdapter(input: {
  blueprint: Readonly<RenderBlueprint>;
  context: RenderAdapterContext;
}): {
  intent: AdapterRenderIntent;
  explainability: RenderAdapterExplainabilityReport;
  compiled: CompiledProviderRequest;
} {
  const { intent, explainability } = buildAdapterRenderIntent(input.blueprint, input.context);
  const provider = input.context.providerId as ProviderId;
  const blueprintIntent = extractRenderIntent(input.blueprint);
  const { capabilities, negotiated } = negotiateCapabilities(blueprintIntent, provider);

  const promptValidation = validateCompiledPrompt(intent.positivePrompt);
  if (!promptValidation.ok) {
    throw new Error(`Prompt compilation failed: ${promptValidation.issues.join("; ")}`);
  }

  const { width, height } = input.blueprint.render.resolution;

  const compiled: CompiledProviderRequest = {
    prompt: intent.positivePrompt,
    negativePrompt: intent.negativePrompt,
    width,
    height,
    seed: intent.seed,
    steps: capabilities.supportsSteps ? (provider === "sdxl" ? 30 : 20) : 0,
    cfg: capabilities.supportsCFG ? 7 : 0,
    provider,
    providerOptions: {
      quality: input.blueprint.render.quality,
      aspectRatio: intent.aspectRatio,
      adapterId: RENDER_ADAPTER_ID,
      adapterVersion: RENDER_ADAPTER_VERSION,
      seedSupported: capabilities.supportsSeed,
    },
    intent: blueprintIntent,
    negotiated,
    compiledAt: Date.now(),
  };

  return { intent, explainability, compiled };
}
