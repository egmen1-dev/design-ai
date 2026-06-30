/**
 * Chapter 4.21 — Agent Communication Protocol engine.
 * Blueprint is the sole message bus — agents never communicate directly.
 */
import type { AgentContractId } from "./agent-contracts";
import { AGENT_READ_MATRIX, AGENT_WRITE_MATRIX } from "./agent-matrix";
import { getSectionOwner } from "./agent-dependency-engine";
import { BANNED_AGENT_TOKENS } from "./constitution";
import { SectionState } from "./lifecycle-types";
import type { BlueprintSection, RenderBlueprint } from "./types";
import {
  CommunicationPrinciple,
  type AgentPublication,
  type CommunicationPrincipleId,
  type CommunicationProtocolReport,
  type CommunicationValidationContext,
  type CommunicationViolation,
  type DirectCallAttempt,
  type SectionOwnership,
  type SectionVersionRecord,
} from "./agent-communication-protocol-types";

export {
  CommunicationPrinciple,
  type CommunicationPrincipleId,
  type SectionOwnership,
  type SectionVersionRecord,
  type AgentPublication,
  type DirectCallAttempt,
  type CommunicationViolation,
  type CommunicationProtocolReport,
  type CommunicationValidationContext,
  type CommunicationFailureCode,
} from "./agent-communication-protocol-types";

export const AGENT_COMMUNICATION_PROTOCOL_VERSION = "4.21.0";

export const AGENT_COMMUNICATION_GOLDEN_RULE =
  "Agents never communicate with each other — they communicate through Blueprint. " +
  "Blueprint is the only language the entire Design AI ecosystem understands.";

export const COMMUNICATION_MODEL = "agent-section-blueprint-next-agent" as const;

const PROMPT_LIKE_PATTERN =
  /\b(beautiful|stunning|amazing|gorgeous|breathtaking)\b.+\b(photo|image|picture|shot)\b/i;

const MANAGED_SECTIONS: BlueprintSection[] = [
  "product",
  "creative",
  "story",
  "scene",
  "photography",
  "camera",
  "lighting",
  "materials",
  "composition",
  "constraints",
  "validation",
];

const SEMANTIC_REQUIRED_FIELDS: Partial<Record<BlueprintSection, string[]>> = {
  story: ["storyType", "emotionalTone"],
  scene: ["sceneType", "environment"],
  lighting: ["lightingStyle", "lightingScheme"],
  camera: ["cameraStyle"],
  materials: ["materialWorld"],
  photography: ["photographyStyle"],
};

function violation(
  code: CommunicationViolation["code"],
  principle: CommunicationPrincipleId,
  message: string,
  extras?: Pick<CommunicationViolation, "agentId" | "section">,
): CommunicationViolation {
  return { code, principle, message, ...extras };
}

export function buildSectionOwnershipMap(): SectionOwnership[] {
  const ownership: SectionOwnership[] = [];

  for (const section of MANAGED_SECTIONS) {
    const owner = getSectionOwner(section);
    if (!owner) continue;

    const readers = (Object.keys(AGENT_READ_MATRIX) as AgentContractId[]).filter((agentId) =>
      AGENT_READ_MATRIX[agentId]?.includes(section),
    );

    ownership.push({ section, owner, readers });
  }

  return ownership;
}

export function buildSectionVersionHistory(
  blueprint: Readonly<RenderBlueprint>,
): SectionVersionRecord[] {
  const versions = new Map<BlueprintSection, SectionVersionRecord>();

  for (const entry of blueprint.meta.audit ?? []) {
    const section = entry.section as BlueprintSection;
    const managed = blueprint.lifecycle.sections[section as keyof typeof blueprint.lifecycle.sections];
    const current = versions.get(section);
    versions.set(section, {
      section,
      owner: entry.agentId as AgentContractId,
      version: (current?.version ?? 0) + 1,
      publishedAt: entry.at,
      immutable:
        managed === SectionState.LOCKED || managed === SectionState.VALIDATED,
    });
  }

  return Array.from(versions.values());
}

export function validateNoDirectAgentCalls(
  calls: DirectCallAttempt[] = [],
): CommunicationViolation[] {
  return calls.map((call) =>
    violation(
      "DIRECT_AGENT_CALL",
      CommunicationPrinciple.INDEPENDENT,
      `Agent ${call.from} directly invoked agent ${call.to}${call.method ? ` via ${call.method}` : ""}`,
      { agentId: call.from },
    ),
  );
}

export function validateWritePermissions(
  agentId: AgentContractId,
  sections: BlueprintSection[] = [],
): CommunicationViolation[] {
  const allowed = new Set(AGENT_WRITE_MATRIX[agentId] ?? []);
  const violations: CommunicationViolation[] = [];

  for (const section of sections) {
    if (!allowed.has(section)) {
      const owner = getSectionOwner(section);
      violations.push(
        violation(
          "FOREIGN_SECTION_WRITE",
          CommunicationPrinciple.INDEPENDENT,
          `Agent ${agentId} cannot write section ${section}${owner ? ` — owned by ${owner}` : ""}`,
          { agentId, section },
        ),
      );
    }
  }

  return violations;
}

export function validateReadPermissions(
  agentId: AgentContractId,
  requestedSections: BlueprintSection[],
): CommunicationViolation[] {
  const allowed = new Set(AGENT_READ_MATRIX[agentId] ?? []);
  const violations: CommunicationViolation[] = [];

  for (const section of requestedSections) {
    if (!allowed.has(section)) {
      violations.push(
        violation(
          "UNAUTHORIZED_READ",
          CommunicationPrinciple.INDEPENDENT,
          `Agent ${agentId} is not permitted to read section ${section}`,
          { agentId, section },
        ),
      );
    }
  }

  return violations;
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

export function validateStructuredCommunication(
  blueprint: Readonly<RenderBlueprint>,
  sections: BlueprintSection[] = MANAGED_SECTIONS,
): CommunicationViolation[] {
  const violations: CommunicationViolation[] = [];

  for (const section of sections) {
    const payload = (blueprint as Record<string, unknown>)[section];
    if (!payload || typeof payload !== "object") continue;

    const required = SEMANTIC_REQUIRED_FIELDS[section];
    if (required) {
      for (const field of required) {
        const value = (payload as Record<string, unknown>)[field];
        if (value === undefined || value === null || value === "") {
          violations.push(
            violation(
              "UNSTRUCTURED_TEXT",
              CommunicationPrinciple.STRUCTURED,
              `Section ${section} missing structured field ${field}`,
              { section },
            ),
          );
        }
      }
    }

    for (const text of collectStrings(payload)) {
      if (PROMPT_LIKE_PATTERN.test(text)) {
        violations.push(
          violation(
            "PROMPT_SEMANTICS",
            CommunicationPrinciple.STRUCTURED,
            `Section ${section} contains prompt-like free text instead of semantic contract fields`,
            { section },
          ),
        );
      }
      if (BANNED_AGENT_TOKENS.test(text)) {
        violations.push(
          violation(
            "PROMPT_SEMANTICS",
            CommunicationPrinciple.STRUCTURED,
            `Section ${section} contains provider or marketing tokens — semantic communication required`,
            { section },
          ),
        );
      }
    }
  }

  return violations;
}

export function validateSectionVersioning(
  blueprint: Readonly<RenderBlueprint>,
): CommunicationViolation[] {
  const history = buildSectionVersionHistory(blueprint);
  const violations: CommunicationViolation[] = [];

  for (const section of MANAGED_SECTIONS) {
    const managed = blueprint.lifecycle.sections[section as keyof typeof blueprint.lifecycle.sections];
    const isReady =
      managed === SectionState.READY ||
      managed === SectionState.LOCKED ||
      managed === SectionState.VALIDATED;

    if (!isReady) continue;

    const hasVersion = history.some((record) => record.section === section);
    if (!hasVersion && (blueprint as Record<string, unknown>)[section]) {
      violations.push(
        violation(
          "MISSING_VERSION",
          CommunicationPrinciple.VERSIONED,
          `Section ${section} is published but has no version history in blueprint audit`,
          { section },
        ),
      );
    }
  }

  return violations;
}

export function validateImmutability(
  blueprint: Readonly<RenderBlueprint>,
  agentId: AgentContractId,
  sections: BlueprintSection[] = [],
): CommunicationViolation[] {
  const violations: CommunicationViolation[] = [];

  for (const section of sections) {
    const state = blueprint.lifecycle.sections[section as keyof typeof blueprint.lifecycle.sections];
    if (state === SectionState.LOCKED || state === SectionState.VALIDATED) {
      violations.push(
        violation(
          "IMMUTABLE_SECTION_MUTATION",
          CommunicationPrinciple.IMMUTABLE,
          `Agent ${agentId} attempted to mutate immutable section ${section} — create new version instead`,
          { agentId, section },
        ),
      );
    }
  }

  return violations;
}

export function validatePublicationExplainability(
  ctx: CommunicationValidationContext,
): CommunicationViolation[] {
  if (!ctx.result) return [];

  const trace = ctx.result.decisionTrace ?? [];
  if (trace.length === 0) {
    return [
      violation(
        "MISSING_EXPLANATION",
        CommunicationPrinciple.EXPLAINABLE,
        `Agent ${ctx.agentId} published section without decisionTrace explanation`,
        { agentId: ctx.agentId },
      ),
    ];
  }

  return [];
}

export function validateOwnershipUniqueness(): CommunicationViolation[] {
  const violations: CommunicationViolation[] = [];
  const owners = new Map<BlueprintSection, AgentContractId[]>();

  for (const [agentId, writes] of Object.entries(AGENT_WRITE_MATRIX) as [
    AgentContractId,
    BlueprintSection[],
  ][]) {
    for (const section of writes) {
      const list = owners.get(section) ?? [];
      list.push(agentId);
      owners.set(section, list);
    }
  }

  for (const [section, agentIds] of owners) {
    const sharedSections: BlueprintSection[] = ["photography", "camera", "lighting", "materials"];
    if (agentIds.length > 1 && !sharedSections.includes(section)) {
      violations.push(
        violation(
          "OWNERSHIP_CONFLICT",
          CommunicationPrinciple.INDEPENDENT,
          `Section ${section} has multiple writers: ${agentIds.join(", ")}`,
          { section },
        ),
      );
    }
  }

  return violations;
}

export function validateErrorIsolation(
  ctx: CommunicationValidationContext,
): CommunicationViolation[] {
  if (!ctx.failedSection || !ctx.corruptedSections?.length) return [];

  const foreignDamage = ctx.corruptedSections.filter((section) => section !== ctx.failedSection);
  if (foreignDamage.length === 0) return [];

  return foreignDamage.map((section) =>
    violation(
      "ERROR_NOT_ISOLATED",
      CommunicationPrinciple.INDEPENDENT,
      `Error in ${ctx.failedSection} corrupted unrelated section ${section}`,
      { agentId: ctx.agentId, section },
    ),
  );
}

function evaluatePrinciples(violations: CommunicationViolation[]): Record<CommunicationPrincipleId, boolean> {
  const failed = new Set(violations.map((v) => v.principle));
  return {
    [CommunicationPrinciple.IMMUTABLE]: !failed.has(CommunicationPrinciple.IMMUTABLE),
    [CommunicationPrinciple.STRUCTURED]: !failed.has(CommunicationPrinciple.STRUCTURED),
    [CommunicationPrinciple.VERSIONED]: !failed.has(CommunicationPrinciple.VERSIONED),
    [CommunicationPrinciple.EXPLAINABLE]: !failed.has(CommunicationPrinciple.EXPLAINABLE),
    [CommunicationPrinciple.INDEPENDENT]: !failed.has(CommunicationPrinciple.INDEPENDENT),
  };
}

export function validateCommunicationProtocol(
  blueprint: Readonly<RenderBlueprint>,
  ctx: CommunicationValidationContext = { agentId: "visual-story-director" },
): CommunicationProtocolReport {
  const violations: CommunicationViolation[] = [
    ...validateNoDirectAgentCalls(ctx.directCalls),
    ...validateWritePermissions(ctx.agentId, ctx.mutationSections),
    ...validatePublicationExplainability(ctx),
    ...validateImmutability(blueprint, ctx.agentId, ctx.mutationSections),
    ...validateStructuredCommunication(blueprint),
    ...validateSectionVersioning(blueprint),
    ...validateOwnershipUniqueness(),
    ...validateErrorIsolation(ctx),
  ];

  return {
    valid: violations.length === 0,
    violations,
    principles: evaluatePrinciples(violations),
    ownership: buildSectionOwnershipMap(),
    versionHistory: buildSectionVersionHistory(blueprint),
    model: COMMUNICATION_MODEL,
  };
}

export function assertCommunicationProtocol(
  blueprint: Readonly<RenderBlueprint>,
  ctx?: CommunicationValidationContext,
): CommunicationProtocolReport {
  const report = validateCommunicationProtocol(blueprint, ctx);
  if (!report.valid) {
    throw new Error(
      `Communication protocol violation: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export function buildAgentPublication(
  agentId: AgentContractId,
  result: { decisionTrace: string[]; confidence: number },
  sections: BlueprintSection[],
  publishedAt: number = Date.now(),
): AgentPublication {
  return {
    agentId,
    sections,
    version: sections.length,
    publishedAt,
    decisionTrace: result.decisionTrace,
    confidence: result.confidence,
  };
}

export function agentReadsOnlyRequiredSections(agentId: AgentContractId): BlueprintSection[] {
  return [...(AGENT_READ_MATRIX[agentId] ?? [])];
}

export function agentWritesOnlyOwnedSections(agentId: AgentContractId): BlueprintSection[] {
  return [...(AGENT_WRITE_MATRIX[agentId] ?? [])];
}

export function isCommunicationFailure(code: string): code is CommunicationViolation["code"] {
  return [
    "DIRECT_AGENT_CALL",
    "FOREIGN_SECTION_WRITE",
    "UNAUTHORIZED_READ",
    "UNSTRUCTURED_TEXT",
    "PROMPT_SEMANTICS",
    "MISSING_VERSION",
    "IMMUTABLE_SECTION_MUTATION",
    "MISSING_EXPLANATION",
    "OWNERSHIP_CONFLICT",
    "ERROR_NOT_ISOLATED",
    "PRINCIPLE_VIOLATION",
  ].includes(code);
}

export function supportsLooseCoupling(newAgent: {
  id: AgentContractId;
  reads: BlueprintSection[];
  writes: BlueprintSection[];
}): boolean {
  const sharedSections: BlueprintSection[] = ["photography", "camera", "lighting", "materials"];

  for (const section of newAgent.writes) {
    const existingOwner = getSectionOwner(section);
    if (existingOwner && existingOwner !== newAgent.id && !sharedSections.includes(section)) {
      return false;
    }
  }

  return newAgent.reads.every(
    (section) =>
      MANAGED_SECTIONS.includes(section) ||
      section === "meta" ||
      section === "creative" ||
      section === "product" ||
      section === "background" ||
      section === "render" ||
      section === "constraints",
  );
}
