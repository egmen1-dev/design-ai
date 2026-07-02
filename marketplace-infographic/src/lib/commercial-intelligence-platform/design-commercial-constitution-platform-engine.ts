/**
 * Chapter 11.18 — Commercial Constitution Platform engine
 * Immutable commercial laws — highest authority before creative handoff.
 */
import type { CommercialPlatformInput } from "./types";
import {
  CommercialConstitutionModule,
  COMMERCIAL_CONSTITUTION_PRINCIPLES,
  type CommercialConstitutionInput,
  type CommercialConstitutionModuleId,
  type CommercialConstitutionPlatformReport,
  type CommercialConstitutionPrincipleId,
} from "./design-commercial-constitution-platform-types";

export const COMMERCIAL_CONSTITUTION_PLATFORM_VERSION = "11.18.0";
export const COMMERCIAL_CONSTITUTION_CONTRACT_ID = "design-commercial-constitution-platform" as const;
export const COMMERCIAL_CONSTITUTION_MEDIATOR_ID = "design-commercial-constitution" as const;

export const COMMERCIAL_CONSTITUTION_GOLDEN_RULE =
  "No commercial decision may violate immutable commercial laws. " +
  "The Constitution asks: does this violate commercial law? — not does this look beautiful?";

export const COMMERCIAL_CONSTITUTION_MODULES: readonly {
  id: CommercialConstitutionModuleId;
  order: number;
  label: string;
}[] = [
  { id: CommercialConstitutionModule.PRINCIPLES_CATALOG, order: 1, label: "Principles Catalog" },
  { id: CommercialConstitutionModule.LAW_VALIDATOR, order: 2, label: "Law Validator" },
  { id: CommercialConstitutionModule.DECISION_AUDITOR, order: 3, label: "Decision Auditor" },
  { id: CommercialConstitutionModule.EXPLAINABILITY_GATE, order: 4, label: "Explainability Gate" },
  { id: CommercialConstitutionModule.MEASURABILITY_CHECK, order: 5, label: "Measurability Check" },
  { id: CommercialConstitutionModule.CONSTITUTION_REPORT, order: 6, label: "Constitution Report" },
  { id: CommercialConstitutionModule.HANDOFF_BUILDER, order: 7, label: "Handoff Builder" },
];

function validatePrinciples(input: CommercialConstitutionInput): {
  upheld: CommercialConstitutionPrincipleId[];
  violations: CommercialConstitutionPlatformReport["violations"];
} {
  const upheld: CommercialConstitutionPrincipleId[] = [...COMMERCIAL_CONSTITUTION_PRINCIPLES];
  const violations: CommercialConstitutionPlatformReport["violations"] = [];

  if (input.aestheticsPriorityOverBusiness) {
    violations.push({
      code: "LAW_BEAUTY_OVER_BUSINESS",
      message: "Aesthetics prioritized over measurable business outcome",
      severity: "critical",
    });
    const idx = upheld.indexOf("beauty_as_instrument");
    if (idx >= 0) upheld.splice(idx, 1);
  }

  if (!input.measurableObjective?.trim()) {
    violations.push({
      code: "LAW_MEASURABLE_OBJECTIVE",
      message: "Commercial decision lacks measurable objective",
      severity: "major",
    });
    const idx = upheld.indexOf("measurable_objectives");
    if (idx >= 0) upheld.splice(idx, 1);
  }

  if (!input.explanation?.trim()) {
    violations.push({
      code: "LAW_EXPLAINABILITY",
      message: "Decision without explanation violates commercial constitution",
      severity: "major",
    });
    const idx = upheld.indexOf("explainable_decisions");
    if (idx >= 0) upheld.splice(idx, 1);
  }

  if (!input.strategySummary?.trim()) {
    violations.push({
      code: "LAW_STRATEGY",
      message: "Missing commercial strategy — inspiration-only path blocked",
      severity: "major",
    });
    const idx = upheld.indexOf("strategy_over_inspiration");
    if (idx >= 0) upheld.splice(idx, 1);
  }

  return { upheld, violations };
}

export function executeCommercialConstitutionPlatform(
  input: CommercialConstitutionInput,
): CommercialConstitutionPlatformReport {
  const modulesCompleted = COMMERCIAL_CONSTITUTION_MODULES.map((m) => m.id);
  const { upheld, violations } = validatePrinciples(input);
  const critical = violations.filter((v) => v.severity === "critical");

  return {
    valid: critical.length === 0,
    version: COMMERCIAL_CONSTITUTION_PLATFORM_VERSION,
    contractId: COMMERCIAL_CONSTITUTION_CONTRACT_ID,
    mediatorId: COMMERCIAL_CONSTITUTION_MEDIATOR_ID,
    modulesCompleted,
    principlesUpheld: upheld,
    violations,
    pipelineEvent: "design_commercial_constitution_complete",
  };
}

export function buildDefaultConstitutionInput(
  platform: CommercialPlatformInput,
): CommercialConstitutionInput {
  return {
    businessGoal: platform.businessGoal,
    primaryMessage: platform.productName,
    strategySummary: `Sell ${platform.productName} on ${platform.marketplaceId} to ${platform.targetAudience ?? "marketplace buyers"}`,
    measurableObjective: `Increase CTR and conversion for ${platform.productCategory}`,
    explanation: `Strategy grounded in ${platform.businessGoal} with marketplace rules for ${platform.marketplaceId}`,
    aestheticsPriorityOverBusiness: false,
  };
}

export function runCommercialConstitutionPlatform(
  platform?: CommercialPlatformInput,
): CommercialConstitutionPlatformReport {
  return executeCommercialConstitutionPlatform(
    buildDefaultConstitutionInput(
      platform ?? {
        productCategory: "garden",
        productName: "Battery Sprayer",
        businessGoal: "Increase sales in garden season",
        marketplaceId: "wildberries",
        priceRub: 3200,
        targetAudience: "home gardeners",
      },
    ),
  );
}
