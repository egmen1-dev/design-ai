/**
 * Design Constitution v18 — Chapter 3 rules
 */
import type { RenderBlueprint } from "./types";
import type { BlueprintSection } from "./types";
import { agentMayWriteSection } from "./ownership";
import { ConstraintEngine } from "./constraint-engine";

export const CONSTITUTION_V18_VERSION = "18.0";

export const CONSTITUTION_V18_RULES = [
  "Rule 001: Each entity exists only once (e.g. camera.distance, not scene.cameraDistance).",
  "Rule 002: Each agent may change only its assigned section.",
  "Rule 003: All fields have concrete types — no quality:string.",
  "Rule 004: Prompt is forbidden in RenderBlueprint — adapter generates it.",
  "Golden rule: Blueprint must fully describe the photo before adapter runs.",
] as const;

/** Flux + marketing tokens forbidden in agent string outputs */
export const BANNED_AGENT_TOKENS =
  /\b(flux|sdxl|photorealistic|8k|4k|ultra\s*realistic|backdrop\s*only|negative\s*prompt|pollinations|gptimage|seedream|ctr|click.?through|whitespace\s*\d|typography|behance)\b/i;

/** Forbidden in photography.visualMood (Chapter 3) */
export const BANNED_PHOTOGRAPHY_MOOD =
  /\b(premium|luxury|ctr|minimal|marketplace|hierarchy)\b/i;

export type ConstitutionViolation = {
  code:
    | "CONSTITUTION_V18_SECTION_VIOLATION"
    | "CONSTITUTION_V18_BANNED_TOKEN"
    | "CONSTITUTION_V18_PROMPT_STORED"
    | "CONSTITUTION_V18_LOCKED"
    | "CONSTITUTION_V18_NOT_VALIDATED";
  message: string;
  section?: BlueprintSection;
  agentId?: string;
};

export class ConstitutionV18Error extends Error {
  readonly violations: ConstitutionViolation[];

  constructor(violations: ConstitutionViolation[]) {
    super(violations.map((v) => v.message).join("; "));
    this.name = "ConstitutionV18Error";
    this.violations = violations;
  }
}

export function assertAgentMayWriteSection(agentId: string, section: BlueprintSection): void {
  if (section === "render" && agentId !== "system") {
    throw new ConstitutionV18Error([
      {
        code: "CONSTITUTION_V18_SECTION_VIOLATION",
        message: `Only system may configure render settings; adapter reads only`,
        section: "render",
        agentId,
      },
    ]);
  }
  if (section === "meta" && agentId !== "system" && agentId !== "flux-adapter") {
    throw new ConstitutionV18Error([
      {
        code: "CONSTITUTION_V18_SECTION_VIOLATION",
        message: `Agent ${agentId} cannot write meta`,
        section: "meta",
        agentId,
      },
    ]);
  }
  if (agentId === "flux-adapter") {
    throw new ConstitutionV18Error([
      {
        code: "CONSTITUTION_V18_SECTION_VIOLATION",
        message: "flux-adapter is read-only on RenderBlueprint",
        agentId,
      },
    ]);
  }
  if (!agentMayWriteSection(agentId, section)) {
    throw new ConstitutionV18Error([
      {
        code: "CONSTITUTION_V18_SECTION_VIOLATION",
        message: `Agent ${agentId} cannot write section ${section}`,
        section,
        agentId,
      },
    ]);
  }
}

export function assertBlueprintUnlocked(blueprint: RenderBlueprint, agentId: string): void {
  if (blueprint.meta.locked) {
    throw new ConstitutionV18Error([
      {
        code: "CONSTITUTION_V18_LOCKED",
        message: `Blueprint locked — agent ${agentId} cannot mutate`,
        agentId,
      },
    ]);
  }
}

export function scanAgentTextForBannedTokens(
  text: string,
  agentId: string,
): ConstitutionViolation[] {
  const match = text.match(BANNED_AGENT_TOKENS);
  if (!match) return [];
  return [
    {
      code: "CONSTITUTION_V18_BANNED_TOKEN",
      message: `Agent ${agentId} emitted banned token "${match[0]}"`,
      agentId,
    },
  ];
}

export function assertAgentOutputsClean(values: string[], agentId: string): void {
  const violations = values.flatMap((v) => scanAgentTextForBannedTokens(v, agentId));
  if (violations.length) throw new ConstitutionV18Error(violations);
}

export function assertPhotographyMoodClean(mood: string, agentId: string): void {
  const match = mood.match(BANNED_PHOTOGRAPHY_MOOD);
  if (!match) return;
  throw new ConstitutionV18Error([
    {
      code: "CONSTITUTION_V18_BANNED_TOKEN",
      message: `photography.visualMood must not contain marketing term "${match[0]}"`,
      section: "photography",
      agentId,
    },
  ]);
}

/** Rule 004 — prompt не должен храниться в blueprint */
export function assertNoPromptStored(blueprint: RenderBlueprint): void {
  const serialized = JSON.stringify(blueprint);
  if (/"compiledPrompt"|"mergedPrompt"|"backgroundPrompt"/i.test(serialized)) {
    throw new ConstitutionV18Error([
      {
        code: "CONSTITUTION_V18_PROMPT_STORED",
        message: "RenderBlueprint must not store prompt strings",
      },
    ]);
  }
}

export function assertSingleEnvironmentSource(blueprint: RenderBlueprint): void {
  if (!blueprint.scene.environment) {
    throw new ConstitutionV18Error([
      {
        code: "CONSTITUTION_V18_SECTION_VIOLATION",
        message: "scene.environment is required",
        section: "scene",
      },
    ]);
  }
}

/** Золотое правило — prompt только после валидации всех секций и constraint check (Ch 3.7) */
export function assertReadyForAdapter(blueprint: RenderBlueprint): void {
  if (blueprint.lifecycle.stage !== "FROZEN" && blueprint.lifecycle.stage !== "RENDERING") {
    throw new ConstitutionV18Error([
      {
        code: "CONSTITUTION_V18_NOT_VALIDATED",
        message: `Adapter requires FROZEN lifecycle, current: ${blueprint.lifecycle.stage}`,
      },
    ]);
  }
  assertNoPromptStored(blueprint);
  assertSingleEnvironmentSource(blueprint);
  new ConstraintEngine().assertReady(blueprint);
}
