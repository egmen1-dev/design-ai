/**
 * Design Constitution v18 — runtime rules for RenderBlueprint
 */
import type { BlueprintSection, RenderBlueprint } from "./types";

export const CONSTITUTION_V18_VERSION = "18.0";

/** Токены, которые агенты не могут возвращать (только Flux Adapter) */
export const BANNED_AGENT_TOKENS =
  /\b(flux|sdxl|photorealistic|8k|4k|ultra\s*realistic|backdrop\s*only|negative\s*prompt|pollinations|gptimage|seedream|ctr|click.?through|whitespace\s*\d|typography|behance|marketplace\s*fit)\b/i;

export type ConstitutionViolation = {
  code:
    | "CONSTITUTION_V18_SECTION_VIOLATION"
    | "CONSTITUTION_V18_BANNED_TOKEN"
    | "CONSTITUTION_V18_RENDER_WRITE"
    | "CONSTITUTION_V18_LOCKED";
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

/** Агенты не могут писать в render.* */
export function assertAgentMayWriteSection(
  agentId: string,
  section: BlueprintSection,
): void {
  if (section === "render") {
    throw new ConstitutionV18Error([
      {
        code: "CONSTITUTION_V18_RENDER_WRITE",
        message: `Agent ${agentId} cannot write render section — Flux Adapter only`,
        section: "render",
        agentId,
      },
    ]);
  }
  if (section === "constraints" || section === "palette") {
    throw new ConstitutionV18Error([
      {
        code: "CONSTITUTION_V18_SECTION_VIOLATION",
        message: `Agent ${agentId} cannot write system section ${section}`,
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

/** Проверка строковых полей агента на Flux/marketing язык */
export function scanAgentTextForBannedTokens(
  text: string,
  agentId: string,
): ConstitutionViolation[] {
  const match = text.match(BANNED_AGENT_TOKENS);
  if (!match) return [];
  return [
    {
      code: "CONSTITUTION_V18_BANNED_TOKEN",
      message: `Agent ${agentId} emitted banned token "${match[0]}" — use structured fields only`,
      agentId,
    },
  ];
}

export function assertAgentOutputsClean(
  values: string[],
  agentId: string,
): void {
  const violations = values.flatMap((v) => scanAgentTextForBannedTokens(v, agentId));
  if (violations.length) throw new ConstitutionV18Error(violations);
}

/** §8–9: environment — единственное поле локации */
export function assertSingleEnvironmentSource(blueprint: RenderBlueprint): void {
  if (!blueprint.scene.environment) {
    throw new ConstitutionV18Error([
      {
        code: "CONSTITUTION_V18_SECTION_VIOLATION",
        message: "scene.environment is required — single source of location truth",
        section: "scene",
      },
    ]);
  }
}

export const CONSTITUTION_V18_RULES = [
  "§1 Agents emit structured decisions only — no model-specific tokens.",
  "§2 RenderBlueprint is the single source of truth.",
  "§3 Each agent writes only its assigned section.",
  "§4 Prompt compilation is exclusive to Flux Adapter (render section).",
  "§5 scene.environment is the sole location field.",
  "§6 Each semantic fact exists exactly once.",
] as const;
