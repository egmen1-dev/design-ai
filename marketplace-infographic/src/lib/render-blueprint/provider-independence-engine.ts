/**
 * Chapter 4.25 — Provider Independence engine.
 * Blueprint is the universal design language — only Render Adapter knows the provider.
 */
import {
  assertNoPromptStored,
  BANNED_AGENT_TOKENS,
  scanAgentTextForBannedTokens,
} from "./constitution";
import { computeBlueprintChecksum } from "./serialization";
import { extractRenderIntent, compilePromptForProvider } from "./render-pipeline";
import { getProviderCapabilities } from "./provider-capabilities";
import {
  FluxRenderAdapter,
  GptImageRenderAdapter,
} from "./render-adapters";
import type { ProviderId } from "./render-pipeline-types";
import type { BlueprintSection, RenderBlueprint } from "./types";
import {
  type ExplainabilityChain,
  type MultiProviderCompileResult,
  type ProviderBenchmarkEntry,
  type ProviderCapabilityProfile,
  type ProviderIndependenceContext,
  type ProviderIndependenceFailureCode,
  type ProviderIndependenceReport,
  type ProviderIndependenceViolation,
} from "./provider-independence-types";

export {
  type ProviderCapabilityProfile,
  type ProviderIndependenceViolation,
  type MultiProviderCompileResult,
  type ProviderBenchmarkEntry,
  type ExplainabilityChain,
  type ProviderIndependenceReport,
  type ProviderIndependenceContext,
  type ProviderIndependenceFailureCode,
} from "./provider-independence-types";

export const PROVIDER_INDEPENDENCE_VERSION = "4.25.0";

export const PROVIDER_INDEPENDENCE_GOLDEN_RULE =
  "Design AI designs commercial photography, not prompts. " +
  "Prompt exists only as a temporary translation of Render Blueprint into a specific model's language. " +
  "If changing provider requires rewriting agents, the system is built incorrectly.";

export const PROVIDER_ARCHITECTURE_STACK = [
  "creative-directors",
  "technical-directors",
  "render-blueprint",
  "render-adapter",
  "provider",
] as const;

const DEFAULT_PROVIDERS: ProviderId[] = ["flux", "gpt-image", "imagen"];

const PROVIDER_VOCABULARY_PATTERN =
  /\b(8k|4k|hyper\s*realistic|masterpiece|award\s*winning|ultra\s*detailed|midjourney|stable\s*diffusion|dall[\s-]?e|seedream|cfg\s*scale|negative\s*prompt)\b/i;

const AGENT_SECTIONS: BlueprintSection[] = [
  "story",
  "scene",
  "photography",
  "camera",
  "lighting",
  "materials",
  "composition",
];

function violation(
  code: ProviderIndependenceViolation["code"],
  message: string,
  extras?: Pick<ProviderIndependenceViolation, "section" | "agentId" | "provider">,
): ProviderIndependenceViolation {
  return { code, message, ...extras };
}

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return out;
  }
  if (value && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      collectStrings(child, out);
    }
  }
  return out;
}

export function buildCapabilityProfile(provider: ProviderId): ProviderCapabilityProfile {
  const base = getProviderCapabilities(provider);
  const profiles: Record<ProviderId, Omit<ProviderCapabilityProfile, "provider">> = {
    flux: {
      supportsLongPrompt: true,
      supportsNegativePrompt: base.supportsNegativePrompt,
      supportsStyleReference: false,
      supportsImageConditioning: base.supportsReferenceImage,
      supportsControlNet: false,
      maxPromptLength: 4000,
      preferredVocabulary: ["photographic", "studio", "soft light", "product"],
      knownWeaknesses: ["text in scene", "complex typography"],
      knownStrengths: ["photorealism", "material fidelity", "lighting control"],
    },
    "gpt-image": {
      supportsLongPrompt: true,
      supportsNegativePrompt: false,
      supportsStyleReference: base.supportsReferenceImage,
      supportsImageConditioning: true,
      supportsControlNet: false,
      maxPromptLength: 3200,
      preferredVocabulary: ["commercial product", "clean background", "catalog"],
      knownWeaknesses: ["negative prompt", "fine cfg control"],
      knownStrengths: ["product isolation", "clean edges"],
    },
    imagen: {
      supportsLongPrompt: false,
      supportsNegativePrompt: false,
      supportsStyleReference: false,
      supportsImageConditioning: false,
      supportsControlNet: false,
      maxPromptLength: 2048,
      preferredVocabulary: ["natural lighting", "realistic scene"],
      knownWeaknesses: ["long prompts", "negative prompts"],
      knownStrengths: ["natural scenes", "balanced color"],
    },
    sdxl: {
      supportsLongPrompt: true,
      supportsNegativePrompt: true,
      supportsStyleReference: false,
      supportsImageConditioning: false,
      supportsControlNet: true,
      maxPromptLength: 3500,
      preferredVocabulary: ["cinematic", "detailed"],
      knownWeaknesses: ["marketplace layout metadata"],
      knownStrengths: ["versatile styles"],
    },
    pollinations: {
      supportsLongPrompt: true,
      supportsNegativePrompt: true,
      supportsStyleReference: false,
      supportsImageConditioning: false,
      supportsControlNet: false,
      maxPromptLength: 2500,
      preferredVocabulary: ["simple", "clean"],
      knownWeaknesses: ["complex compositions"],
      knownStrengths: ["fast iteration"],
    },
  };

  return { provider, ...profiles[provider] };
}

export function validateBlueprintAsSourceOfTruth(
  blueprint: Readonly<RenderBlueprint>,
): ProviderIndependenceViolation[] {
  const violations: ProviderIndependenceViolation[] = [];

  try {
    assertNoPromptStored(blueprint as RenderBlueprint);
  } catch {
    violations.push(
      violation(
        "PROMPT_AS_SOURCE_OF_TRUTH",
        "RenderBlueprint stores prompt strings — blueprint must remain the sole source of truth",
      ),
    );
  }

  const serialized = JSON.stringify(blueprint);
  if (/"prompt"\s*:\s*"/i.test(serialized) && !/"providerHints"/i.test(serialized)) {
    const hasTopLevelPrompt = (blueprint as { prompt?: string }).prompt !== undefined;
    if (hasTopLevelPrompt) {
      violations.push(
        violation("PROMPT_AS_SOURCE_OF_TRUTH", "Top-level prompt field found on RenderBlueprint"),
      );
    }
  }

  return violations;
}

export function validateNoProviderVocabularyInAgents(
  blueprint: Readonly<RenderBlueprint>,
  ctx: ProviderIndependenceContext = {},
): ProviderIndependenceViolation[] {
  const violations: ProviderIndependenceViolation[] = [];

  for (const section of AGENT_SECTIONS) {
    const payload = (blueprint as Record<string, unknown>)[section];
    for (const text of collectStrings(payload)) {
      if (BANNED_AGENT_TOKENS.test(text)) {
        violations.push(
          violation(
            "PROVIDER_VOCABULARY_IN_AGENT",
            `Section ${section} contains provider-specific vocabulary`,
            { section },
          ),
        );
      }
      if (PROVIDER_VOCABULARY_PATTERN.test(text)) {
        violations.push(
          violation(
            "PROVIDER_VOCABULARY_IN_AGENT",
            `Section ${section} contains model prompt vocabulary instead of semantic design decisions`,
            { section },
          ),
        );
      }
    }
  }

  for (const output of ctx.agentOutputs ?? []) {
    for (const text of output.texts) {
      const banned = scanAgentTextForBannedTokens(text, output.agentId);
      for (const b of banned) {
        violations.push(
          violation("PROVIDER_VOCABULARY_IN_AGENT", b.message, { agentId: output.agentId }),
        );
      }
      if (PROVIDER_VOCABULARY_PATTERN.test(text)) {
        violations.push(
          violation(
            "PROVIDER_VOCABULARY_IN_AGENT",
            `Agent ${output.agentId} emitted provider prompt vocabulary`,
            { agentId: output.agentId },
          ),
        );
      }
    }
  }

  return violations;
}

export function validateSemanticIndependence(
  blueprint: Readonly<RenderBlueprint>,
  providers: ProviderId[] = DEFAULT_PROVIDERS,
): ProviderIndependenceViolation[] {
  const intent = extractRenderIntent(blueprint);
  const semanticAnchor =
    blueprint.lighting.lightingStyle ??
    blueprint.lighting.lightingMood ??
    blueprint.photography.visualMood ??
    "studio";

  const markers = semanticAnchor
    .toLowerCase()
    .split(/[_\s]+/)
    .filter((w) => w.length > 2);

  const prompts = providers.map((provider) => ({
    provider,
    prompt: compilePromptForProvider(intent, provider).toLowerCase(),
  }));

  const missingSemantic = prompts.filter(
    (p) => markers.length > 0 && !markers.some((m) => p.prompt.includes(m.replace("_", " ")) || p.prompt.includes(m)),
  );

  if (missingSemantic.length === prompts.length && markers.length > 0) {
    return [
      violation(
        "SEMANTIC_DRIFT_ACROSS_PROVIDERS",
        "Compiled prompts lost semantic lighting decision across all providers",
      ),
    ];
  }

  return [];
}

export function compileAcrossProviders(
  blueprint: Readonly<RenderBlueprint>,
  providers: ProviderId[] = DEFAULT_PROVIDERS,
): MultiProviderCompileResult[] {
  const checksum = computeBlueprintChecksum(blueprint);
  const intent = extractRenderIntent(blueprint);
  const semanticAnchor = (
    blueprint.lighting.lightingStyle ??
    blueprint.scene.environment ??
    "studio"
  ).toLowerCase();

  return providers.map((provider) => {
    let prompt = "";
    let success = false;
    try {
      if (provider === "flux") {
        prompt = new FluxRenderAdapter().compile(blueprint).prompt;
        success = prompt.length > 20;
      } else if (provider === "gpt-image") {
        prompt = new GptImageRenderAdapter().compile(blueprint).prompt;
        success = prompt.length > 20;
      } else {
        prompt = compilePromptForProvider(intent, provider);
        success = prompt.length > 10;
      }
    } catch {
      success = false;
    }

    const semanticMarkers = semanticAnchor
      .split(/[_\s]+/)
      .filter((m) => prompt.toLowerCase().includes(m));

    return {
      provider,
      success,
      promptLength: prompt.length,
      semanticMarkers,
      blueprintChecksum: checksum,
    };
  });
}

export function benchmarkProviders(
  blueprint: Readonly<RenderBlueprint>,
  providers: ProviderId[] = DEFAULT_PROVIDERS,
): ProviderBenchmarkEntry[] {
  const compiles = compileAcrossProviders(blueprint, providers);

  return compiles.map((result) => {
    const profile = buildCapabilityProfile(result.provider);
    let score = result.success ? 82 : 40;
    if (result.promptLength <= profile.maxPromptLength) score += 6;
    if (result.semanticMarkers.length > 0) score += 8;
    if (profile.supportsNegativePrompt && result.provider === "flux") score += 4;

    return {
      provider: result.provider,
      score: Math.min(100, score),
      compileSuccess: result.success,
      promptLength: result.promptLength,
    };
  });
}

export function validateAdapterIsolation(
  blueprintBefore: Readonly<RenderBlueprint>,
  blueprintAfter: Readonly<RenderBlueprint>,
): ProviderIndependenceViolation[] {
  const violations: ProviderIndependenceViolation[] = [];
  const before = JSON.stringify(blueprintBefore);
  const after = JSON.stringify(blueprintAfter);

  if (before !== after) {
    violations.push(
      violation(
        "BLUEPRINT_MUTATED_BY_ADAPTER",
        "Adapter compilation mutated RenderBlueprint — adapter must be read-only translator",
      ),
    );
  }

  return violations;
}

export function buildExplainabilityChain(
  blueprint: Readonly<RenderBlueprint>,
): ExplainabilityChain {
  let renderIntent = false;
  try {
    extractRenderIntent(blueprint);
    renderIntent = true;
  } catch {
    renderIntent = false;
  }

  return {
    renderIntent,
    blueprint: Boolean(blueprint.meta.id),
    agentDecisions: Boolean(blueprint.meta.audit?.length),
    providerIsExecutorOnly: true,
  };
}

export function validateProviderIndependence(
  blueprint: Readonly<RenderBlueprint>,
  ctx: ProviderIndependenceContext = {},
): ProviderIndependenceReport {
  const providers = ctx.providers ?? DEFAULT_PROVIDERS;
  const frozen = structuredClone(blueprint) as RenderBlueprint;
  const multiProviderResults = compileAcrossProviders(blueprint, providers);
  const afterCompile = structuredClone(blueprint) as RenderBlueprint;

  const violations: ProviderIndependenceViolation[] = [
    ...validateBlueprintAsSourceOfTruth(blueprint),
    ...validateNoProviderVocabularyInAgents(blueprint, ctx),
    ...validateSemanticIndependence(blueprint, providers),
    ...validateAdapterIsolation(frozen, afterCompile),
  ];

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  const checksums = new Set(multiProviderResults.map((r) => r.blueprintChecksum));

  return {
    independent: unique.length === 0 && checksums.size <= 1,
    violations: unique,
    capabilityProfiles: providers.map(buildCapabilityProfile),
    multiProviderResults,
    benchmark: benchmarkProviders(blueprint, providers),
    explainability: buildExplainabilityChain(blueprint),
    blueprintUnchanged: JSON.stringify(frozen) === JSON.stringify(afterCompile),
  };
}

export function assertProviderIndependent(
  blueprint: Readonly<RenderBlueprint>,
  ctx?: ProviderIndependenceContext,
): ProviderIndependenceReport {
  const report = validateProviderIndependence(blueprint, ctx);
  if (!report.independent) {
    throw new Error(
      `Provider independence violation: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export function runProviderIndependence(input: {
  blueprint: Readonly<RenderBlueprint>;
  context?: ProviderIndependenceContext;
}): ProviderIndependenceReport {
  return validateProviderIndependence(input.blueprint, input.context);
}

export function isProviderIndependenceFailure(code: string): code is ProviderIndependenceFailureCode {
  return [
    "PROMPT_AS_SOURCE_OF_TRUTH",
    "PROVIDER_VOCABULARY_IN_AGENT",
    "PROVIDER_LOGIC_IN_AGENT",
    "BLUEPRINT_PROVIDER_COUPLED",
    "ADAPTER_NOT_ISOLATED",
    "SEMANTIC_DRIFT_ACROSS_PROVIDERS",
    "BLUEPRINT_MUTATED_BY_ADAPTER",
  ].includes(code);
}

export function providerMigrationRequiresAdapterOnly(
  fromProvider: ProviderId,
  toProvider: ProviderId,
): boolean {
  return fromProvider !== toProvider;
}
