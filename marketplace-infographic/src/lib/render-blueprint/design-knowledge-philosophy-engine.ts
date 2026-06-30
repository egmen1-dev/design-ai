/**
 * Chapter 5.1 — Philosophy of Design Knowledge engine.
 * Design Knowledge is the intellectual foundation — decisions come from knowledge, not LLM intuition.
 */
import type { AgentContractId } from "./agent-contracts";
import { BANNED_AGENT_TOKENS } from "./constitution";
import {
  KnowledgeDomain,
  KnowledgeEvidenceSource,
  KnowledgeOrigin,
  type DesignKnowledgePhilosophyContext,
  type DesignKnowledgePhilosophyFailureCode,
  type DesignKnowledgePhilosophyReport,
  type DesignKnowledgeRule,
  type KnowledgePhilosophyViolation,
  type StructuredKnowledgeChain,
} from "./design-knowledge-philosophy-types";

export {
  KnowledgeEvidenceSource,
  KnowledgeDomain,
  KnowledgeOrigin,
  type KnowledgeEvidenceSourceId,
  type KnowledgeDomainId,
  type KnowledgeOriginId,
  type DesignKnowledgeRule,
  type StructuredKnowledgeChain,
  type KnowledgePhilosophyViolation,
  type DesignKnowledgePhilosophyContext,
  type DesignKnowledgePhilosophyReport,
  type DesignKnowledgePhilosophyFailureCode,
} from "./design-knowledge-philosophy-types";

export const DESIGN_KNOWLEDGE_PHILOSOPHY_VERSION = "5.1.0";

export const DESIGN_KNOWLEDGE_GOLDEN_RULE =
  "LLM can generate answers. Render Provider can generate images. " +
  "But only Design Knowledge Engine knows which design decision is truly correct. " +
  "Knowledge — not models — is the foundation of the entire Design AI Platform.";

export const DESIGN_KNOWLEDGE_CORE_PHILOSOPHY =
  "Design AI is not an image generator — it is a system that makes design decisions. " +
  "Every design decision must rely on accumulated knowledge, not intuition. " +
  "The platform's primary intellectual asset is Design Knowledge, not LLM models or Render Provider.";

export const GENERIC_AI_PIPELINE = [
  "user",
  "prompt",
  "llm",
  "image",
] as const;

export const DESIGN_AI_KNOWLEDGE_PIPELINE = [
  "user",
  "business-goal",
  "design-knowledge",
  "agent-decisions",
  "blueprint",
  "render",
  "image",
] as const;

export const KNOWLEDGE_PRIORITY_OVER_LLM = 100;

const LLM_DEPENDENCY_PATTERN =
  /\b(as an ai|language model|i think|probably|maybe|gpt|claude|llm)\b/i;

const PROVIDER_DEPENDENCY_PATTERN =
  /\b(flux|sdxl|midjourney|stable\s*diffusion|dall[\s-]?e|pollinations|gpt-image|imagen)\b/i;

const PROMPT_DEPENDENCY_PATTERN =
  /\b(prompt|negative\s*prompt|masterpiece|8k|hyper\s*realistic)\b/i;

function violation(
  code: KnowledgePhilosophyViolation["code"],
  message: string,
  ruleId?: string,
): KnowledgePhilosophyViolation {
  return { code, message, ruleId };
}

/** Seed professional knowledge rules — structured, explainable, evidence-based */
export const SEED_DESIGN_KNOWLEDGE_RULES: readonly DesignKnowledgeRule[] = [
  {
    id: "luxury-cosmetics-soft-lighting",
    category: "cosmetics",
    subCategory: "luxury",
    domain: KnowledgeDomain.LIGHTING,
    preference: "soft_lighting",
    reason:
      "Luxury cosmetics perform better with soft lighting that conveys premium texture and skin-friendly appeal.",
    evidenceSources: [
      KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY,
      KnowledgeEvidenceSource.MARKETING,
      KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY,
    ],
    applicableAgents: ["lighting-director", "commercial-photo-director", "visual-story-director"],
    reusable: true,
    origin: KnowledgeOrigin.EXPERT,
    version: 1,
    priority: 90,
  },
  {
    id: "kitchen-soft-morning-light",
    category: "kitchen",
    domain: KnowledgeDomain.LIGHTING,
    preference: "soft_morning_light",
    reason: "Creates warmth and increases appetite perception for kitchen and food-adjacent products.",
    evidenceSources: [
      KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY,
      KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY,
      KnowledgeEvidenceSource.MARKETPLACE_RESEARCH,
    ],
    applicableAgents: ["lighting-director", "scene-director"],
    reusable: true,
    origin: KnowledgeOrigin.EXPERT,
    version: 1,
    priority: 85,
  },
  {
    id: "medical-white-background",
    category: "medical",
    domain: KnowledgeDomain.SCENE,
    preference: "white_background",
    reason: "Increases perceived cleanliness and trust for medical and hygiene products.",
    evidenceSources: [
      KnowledgeEvidenceSource.UX,
      KnowledgeEvidenceSource.MARKETING,
      KnowledgeEvidenceSource.MARKETPLACE_RESEARCH,
    ],
    applicableAgents: ["scene-director", "composition-director", "vision-quality-director"],
    reusable: true,
    origin: KnowledgeOrigin.EXPERT,
    version: 1,
    priority: 88,
  },
  {
    id: "premium-large-negative-space",
    category: "premium",
    domain: KnowledgeDomain.COMPOSITION,
    preference: "large_negative_space",
    reason: "Premium products require breathing room to signal quality and support overlay typography.",
    evidenceSources: [
      KnowledgeEvidenceSource.INDUSTRIAL_DESIGN,
      KnowledgeEvidenceSource.UX,
      KnowledgeEvidenceSource.SALES_STATISTICS,
    ],
    applicableAgents: [
      "composition-director",
      "vision-quality-director",
      "commercial-photo-director",
    ],
    reusable: true,
    origin: KnowledgeOrigin.HYBRID,
    version: 1,
    priority: 92,
  },
  {
    id: "marketplace-hero-product-scale",
    category: "marketplace",
    domain: KnowledgeDomain.COMPOSITION,
    preference: "hero_product_dominance",
    reason: "Marketplace cards with dominant product hero achieve higher CTR than decorative compositions.",
    evidenceSources: [
      KnowledgeEvidenceSource.MARKETPLACE_RESEARCH,
      KnowledgeEvidenceSource.SALES_STATISTICS,
      KnowledgeEvidenceSource.PLATFORM_DATA,
    ],
    applicableAgents: ["composition-director", "camera-director", "vision-quality-director"],
    reusable: true,
    origin: KnowledgeOrigin.PLATFORM_LEARNING,
    version: 1,
    priority: 95,
  },
] as const;

export function buildStructuredKnowledgeChain(rule: DesignKnowledgeRule): StructuredKnowledgeChain {
  return {
    category: rule.subCategory ? `${rule.category}/${rule.subCategory}` : rule.category,
    preference: rule.preference,
    reason: rule.reason,
    evidenceSources: rule.evidenceSources,
    domain: rule.domain,
  };
}

export function getSeedKnowledgeRules(): DesignKnowledgeRule[] {
  return SEED_DESIGN_KNOWLEDGE_RULES.map((r) => ({ ...r }));
}

export function queryKnowledgeForCategory(
  category: string,
  rules: DesignKnowledgeRule[] = getSeedKnowledgeRules(),
): DesignKnowledgeRule[] {
  const normalized = category.toLowerCase();
  return rules.filter(
    (r) =>
      r.category.toLowerCase() === normalized ||
      r.subCategory?.toLowerCase() === normalized ||
      `${r.category}/${r.subCategory}`.toLowerCase().includes(normalized),
  );
}

export function getRulesForAgent(
  agentId: AgentContractId,
  rules: DesignKnowledgeRule[] = getSeedKnowledgeRules(),
): DesignKnowledgeRule[] {
  return rules.filter((r) => r.applicableAgents.includes(agentId));
}

export function validateKnowledgeRule(rule: DesignKnowledgeRule): KnowledgePhilosophyViolation[] {
  const violations: KnowledgePhilosophyViolation[] = [];

  if (!rule.reason?.trim()) {
    violations.push(
      violation("UNEXPLAINABLE_RULE", `Rule ${rule.id} has no explanation`, rule.id),
    );
  }
  if (!rule.evidenceSources.length) {
    violations.push(
      violation("MISSING_EVIDENCE_SOURCE", `Rule ${rule.id} lacks evidence sources`, rule.id),
    );
  }
  if (!rule.reusable) {
    violations.push(
      violation("NOT_REUSABLE", `Rule ${rule.id} is not marked reusable across agents`, rule.id),
    );
  }
  if (LLM_DEPENDENCY_PATTERN.test(rule.reason) || LLM_DEPENDENCY_PATTERN.test(rule.preference)) {
    violations.push(
      violation("LLM_DEPENDENCY", `Rule ${rule.id} references LLM instead of design knowledge`, rule.id),
    );
  }
  if (PROVIDER_DEPENDENCY_PATTERN.test(rule.preference) || PROVIDER_DEPENDENCY_PATTERN.test(rule.reason)) {
    violations.push(
      violation(
        "PROVIDER_DEPENDENCY",
        `Rule ${rule.id} depends on render provider vocabulary`,
        rule.id,
      ),
    );
  }
  if (PROMPT_DEPENDENCY_PATTERN.test(rule.preference)) {
    violations.push(
      violation("PROMPT_DEPENDENCY", `Rule ${rule.id} stores knowledge as prompt text`, rule.id),
    );
  }

  const banned = rule.preference.match(BANNED_AGENT_TOKENS);
  if (banned) {
    violations.push(
      violation("PROMPT_DEPENDENCY", `Rule ${rule.id} contains banned prompt vocabulary`, rule.id),
    );
  }

  return violations;
}

export function validateKnowledgeIndependence(
  rules: DesignKnowledgeRule[],
): KnowledgePhilosophyViolation[] {
  return rules.flatMap((rule) =>
    validateKnowledgeRule(rule).filter(
      (v) =>
        v.code === "LLM_DEPENDENCY" ||
        v.code === "PROVIDER_DEPENDENCY" ||
        v.code === "PROMPT_DEPENDENCY",
    ),
  );
}

export function validateExplainableKnowledge(
  rules: DesignKnowledgeRule[],
): KnowledgePhilosophyViolation[] {
  return rules.flatMap((rule) =>
    validateKnowledgeRule(rule).filter(
      (v) => v.code === "UNEXPLAINABLE_RULE" || v.code === "MISSING_EVIDENCE_SOURCE",
    ),
  );
}

export function validateKnowledgeReusability(
  rules: DesignKnowledgeRule[],
): KnowledgePhilosophyViolation[] {
  const violations: KnowledgePhilosophyViolation[] = [];

  for (const rule of rules) {
    if (!rule.reusable) {
      violations.push(
        violation("NOT_REUSABLE", `Rule ${rule.id} cannot be shared across agents`, rule.id),
      );
    }
    if (rule.applicableAgents.length < 2) {
      violations.push(
        violation(
          "NOT_REUSABLE",
          `Rule ${rule.id} applies to only one agent — knowledge should be ecosystem-wide`,
          rule.id,
        ),
      );
    }
  }

  return violations;
}

export function validateUnifiedKnowledgeBase(
  rules: DesignKnowledgeRule[],
): KnowledgePhilosophyViolation[] {
  const violations: KnowledgePhilosophyViolation[] = [];
  const domains = new Set(rules.map((r) => r.domain));

  const creativeAgents: AgentContractId[] = [
    "visual-story-director",
    "scene-director",
    "lighting-director",
    "camera-director",
    "composition-director",
  ];

  for (const agentId of creativeAgents) {
    const agentRules = getRulesForAgent(agentId, rules);
    if (agentRules.length === 0) {
      violations.push(
        violation(
          "FRAGMENTED_KNOWLEDGE_BASE",
          `Agent ${agentId} has no rules in unified knowledge base`,
        ),
      );
    }
  }

  if (domains.size < 3) {
    violations.push(
      violation(
        "FRAGMENTED_KNOWLEDGE_BASE",
        "Knowledge base must span multiple design domains for coherent decisions",
      ),
    );
  }

  return violations;
}

export function validateNoPromptKnowledge(ctx: DesignKnowledgePhilosophyContext): KnowledgePhilosophyViolation[] {
  const violations: KnowledgePhilosophyViolation[] = [];

  if (ctx.promptEmbeddedRules?.length) {
    for (const promptRule of ctx.promptEmbeddedRules) {
      violations.push(
        violation(
          "PROMPT_ONLY_KNOWLEDGE",
          `Knowledge exists only inside prompt: ${promptRule.slice(0, 80)}`,
        ),
      );
    }
  }

  if (ctx.llmOnlyDecision) {
    violations.push(
      violation(
        "LLM_RANDOM_KNOWLEDGE",
        "Agent decision relied on unstructured LLM knowledge instead of Design Knowledge",
        ctx.agentId,
      ),
    );
  }

  return violations;
}

export function knowledgeSupportsDecision(input: {
  category: string;
  domain: import("./design-knowledge-philosophy-types").KnowledgeDomainId;
  preference: string;
  rules?: DesignKnowledgeRule[];
}): { supported: boolean; rule?: DesignKnowledgeRule; chain?: StructuredKnowledgeChain } {
  const rules = input.rules ?? getSeedKnowledgeRules();
  const match = rules.find(
    (r) =>
      r.domain === input.domain &&
      r.preference === input.preference &&
      (r.category === input.category ||
        r.subCategory === input.category ||
        input.category.includes(r.category)),
  );

  if (!match) {
    return { supported: false };
  }

  return {
    supported: true,
    rule: match,
    chain: buildStructuredKnowledgeChain(match),
  };
}

export function validateDesignKnowledgePhilosophy(
  ctx: DesignKnowledgePhilosophyContext = {},
): DesignKnowledgePhilosophyReport {
  const rules = ctx.rules ?? getSeedKnowledgeRules();

  const violations: KnowledgePhilosophyViolation[] = [
    ...rules.flatMap(validateKnowledgeRule),
    ...validateUnifiedKnowledgeBase(rules),
    ...validateNoPromptKnowledge(ctx),
  ];

  const unique = violations.filter(
    (v, i, arr) =>
      arr.findIndex((x) => x.code === v.code && x.message === v.message && x.ruleId === v.ruleId) ===
      i,
  );

  const explainableViolations = validateExplainableKnowledge(rules);
  const independentViolations = validateKnowledgeIndependence(rules);

  return {
    valid: unique.length === 0,
    violations: unique,
    rules,
    pipeline: [...DESIGN_AI_KNOWLEDGE_PIPELINE],
    goldenRuleSatisfied: unique.length === 0,
    knowledgeBeforeGeneration: true,
    unifiedBase: !unique.some((v) => v.code === "FRAGMENTED_KNOWLEDGE_BASE"),
    explainable: explainableViolations.length === 0,
    independent: independentViolations.length === 0,
  };
}

export function assertDesignKnowledgePhilosophy(
  ctx?: DesignKnowledgePhilosophyContext,
): DesignKnowledgePhilosophyReport {
  const report = validateDesignKnowledgePhilosophy(ctx);
  if (!report.valid) {
    throw new Error(
      `Design Knowledge philosophy violation: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export function runDesignKnowledgePhilosophy(input: {
  ctx?: DesignKnowledgePhilosophyContext;
}): DesignKnowledgePhilosophyReport {
  return validateDesignKnowledgePhilosophy(input.ctx);
}

export function isDesignKnowledgePhilosophyFailure(
  code: string,
): code is DesignKnowledgePhilosophyFailureCode {
  return [
    "PROMPT_ONLY_KNOWLEDGE",
    "LLM_RANDOM_KNOWLEDGE",
    "MISSING_EVIDENCE_SOURCE",
    "UNEXPLAINABLE_RULE",
    "NOT_REUSABLE",
    "LLM_DEPENDENCY",
    "PROVIDER_DEPENDENCY",
    "PROMPT_DEPENDENCY",
    "FRAGMENTED_KNOWLEDGE_BASE",
    "KNOWLEDGE_MIXED_WITH_PIPELINE",
  ].includes(code);
}
