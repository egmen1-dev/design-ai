import type {
  CommercialRuleBeta,
  ResolveCommercialRulesInput,
  ResolveCommercialRulesResult,
  RuleCategory,
} from "./types";
import { WILDBERRIES_HERO_RULES } from "./wildberries-hero-rules";

const ALWAYS_HIGH_CATEGORIES: RuleCategory[] = [
  "hero",
  "hierarchy",
  "typography",
  "psychology",
];

const PROFESSIONAL_TYPES = new Set([
  "tool",
  "professional",
  "industrial",
  "equipment",
  "instrument",
  "профессиональный",
  "инструмент",
  "оборудование",
]);

const LIFESTYLE_TYPES = new Set([
  "lifestyle",
  "home",
  "garden",
  "дом",
  "сад",
  "быт",
  "уют",
]);

const GARDEN_TYPES = new Set(["garden", "сад", "огород", "gardening"]);

function normalize(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function isWildberries(marketplace: string): boolean {
  const m = normalize(marketplace);
  return m === "wildberries" || m === "wb" || m.includes("wildberries");
}

function matchesCategory(rule: CommercialRuleBeta, category?: string, productType?: string): boolean {
  const cat = normalize(category);
  const type = normalize(productType);
  if (!cat && !type) return true;

  const targets = rule.appliesTo.map(normalize);
  if (targets.includes("wildberries") && targets.length <= 2) return true;

  return targets.some((t) => cat.includes(t) || type.includes(t) || t.includes(cat) || t.includes(type));
}

function isProfessional(category?: string, productType?: string): boolean {
  const combined = `${normalize(category)} ${normalize(productType)}`;
  return [...PROFESSIONAL_TYPES].some((t) => combined.includes(t));
}

function isLifestyle(category?: string, productType?: string): boolean {
  const combined = `${normalize(category)} ${normalize(productType)}`;
  return [...LIFESTYLE_TYPES].some((t) => combined.includes(t));
}

function isGarden(category?: string, productType?: string): boolean {
  const combined = `${normalize(category)} ${normalize(productType)}`;
  return [...GARDEN_TYPES].some((t) => combined.includes(t));
}

function isYellowProduct(productColor?: string, productTitle?: string): boolean {
  const color = normalize(productColor);
  const title = normalize(productTitle);
  return (
    color.includes("yellow") ||
    color.includes("жёлт") ||
    color.includes("желт") ||
    title.includes("жёлт") ||
    title.includes("желт")
  );
}

function isDarkProduct(productColor?: string): boolean {
  const color = normalize(productColor);
  return (
    color.includes("black") ||
    color.includes("dark") ||
    color.includes("чёрн") ||
    color.includes("черн")
  );
}

function isLightProduct(productColor?: string): boolean {
  const color = normalize(productColor);
  return (
    color.includes("white") ||
    color.includes("light") ||
    color.includes("бел") ||
    color.includes("светл")
  );
}

function shouldSelectRule(
  rule: CommercialRuleBeta,
  input: ResolveCommercialRulesInput,
): { selected: boolean; reason: string } {
  if (rule.category === "anti_rule") {
    return { selected: true, reason: "anti_rules always selected" };
  }

  if (!isWildberries(input.marketplace)) {
    return { selected: false, reason: "non-wildberries marketplace" };
  }

  if (ALWAYS_HIGH_CATEGORIES.includes(rule.category)) {
    return { selected: true, reason: `${rule.category} always high priority for WB` };
  }

  if (rule.category === "refinement") {
    const mode = normalize(input.mode);
    if (mode === "refinement") {
      return { selected: true, reason: "refinement mode active" };
    }
    return { selected: false, reason: "refinement rules only in refinement mode" };
  }

  if (rule.category === "environment") {
    if (!matchesCategory(rule, input.category, input.productType)) {
      if (rule.id === "WB-ENV-005" && isLifestyle(input.category, input.productType)) {
        return { selected: true, reason: "lifestyle/home environment" };
      }
      if (rule.id === "WB-ENV-006" && isProfessional(input.category, input.productType)) {
        return { selected: true, reason: "professional tool environment" };
      }
      if (isGarden(input.category, input.productType) && rule.id === "WB-ENV-004") {
        return { selected: true, reason: "garden usage scenario" };
      }
    }
    if (
      rule.id === "WB-ENV-005" &&
      isLifestyle(input.category, input.productType)
    ) {
      return { selected: true, reason: "lifestyle category" };
    }
    if (
      rule.id === "WB-ENV-006" &&
      isProfessional(input.category, input.productType)
    ) {
      return { selected: true, reason: "professional tool category" };
    }
    const genericEnv = ["WB-ENV-001", "WB-ENV-002", "WB-ENV-003", "WB-ENV-004", "WB-ENV-007"];
    if (genericEnv.includes(rule.id)) {
      return { selected: true, reason: "generic environment rule for WB" };
    }
    return { selected: matchesCategory(rule, input.category, input.productType), reason: "category match" };
  }

  if (rule.category === "differentiation" || rule.category === "brand" || rule.category === "research") {
    return { selected: true, reason: `${rule.category} selected for WB beta` };
  }

  return { selected: matchesCategory(rule, input.category, input.productType), reason: "default category match" };
}

export function resolveCommercialRulesBeta(
  input: ResolveCommercialRulesInput,
): ResolveCommercialRulesResult {
  const decisionTrace: string[] = [
    `resolveCommercialRulesBeta: marketplace=${input.marketplace}`,
    `category=${input.category ?? "unknown"}`,
    `productType=${input.productType ?? "unknown"}`,
    `mode=${input.mode ?? "generation"}`,
  ];

  const selectedRules: CommercialRuleBeta[] = [];
  const ignoredRules: CommercialRuleBeta[] = [];
  const antiRules: CommercialRuleBeta[] = [];

  for (const rule of WILDBERRIES_HERO_RULES) {
    const { selected, reason } = shouldSelectRule(rule, input);
    if (rule.category === "anti_rule") {
      antiRules.push(rule);
      selectedRules.push(rule);
      decisionTrace.push(`SELECT anti ${rule.id}: ${reason}`);
      continue;
    }

    if (selected) {
      selectedRules.push(rule);
      decisionTrace.push(`SELECT ${rule.id} [${rule.category}]: ${reason}`);
    } else {
      ignoredRules.push(rule);
      decisionTrace.push(`IGNORE ${rule.id} [${rule.category}]: ${reason}`);
    }
  }

  if (isYellowProduct(input.productColor, input.productTitle)) {
    decisionTrace.push("CONTRAST: yellow product → prefer cool/neutral background separation");
  }
  if (isProfessional(input.category, input.productType)) {
    decisionTrace.push("ENVIRONMENT: professional tool → industrial/technical allowed");
  }
  if (isGarden(input.category, input.productType)) {
    decisionTrace.push("ENVIRONMENT: garden equipment → outdoor/fresh natural preferred");
  }
  if (isLifestyle(input.category, input.productType)) {
    decisionTrace.push("ENVIRONMENT: lifestyle/home → light modern clean preferred");
  }

  return {
    selectedRules,
    ignoredRules,
    antiRules,
    decisionTrace,
  };
}

export function isYellowProductColor(productColor?: string, productTitle?: string): boolean {
  return isYellowProduct(productColor, productTitle);
}

export function isProfessionalProduct(category?: string, productType?: string): boolean {
  return isProfessional(category, productType);
}

export function isRefinementMode(mode?: string): boolean {
  return normalize(mode) === "refinement";
}
