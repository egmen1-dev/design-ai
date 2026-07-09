import type {
  BackgroundContrastDirection,
  BuildCommercialDecisionInput,
  CommercialDecisionBeta,
  EnvironmentDirection,
  VisualHierarchyOrder,
} from "./types";
import {
  isProfessionalProduct,
  isYellowProductColor,
} from "./resolve-commercial-rules";
import {
  ASPIRATIONAL_PRODUCT_AREA_TARGET,
  REACHABLE_PRODUCT_AREA_TARGET,
} from "./product-area-targets";

function normalize(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function isGarden(category?: string, productType?: string): boolean {
  const combined = `${normalize(category)} ${normalize(productType)}`;
  return combined.includes("garden") || combined.includes("сад") || combined.includes("огород");
}

function isLifestyle(category?: string, productType?: string): boolean {
  const combined = `${normalize(category)} ${normalize(productType)}`;
  return (
    combined.includes("lifestyle") ||
    combined.includes("home") ||
    combined.includes("дом") ||
    combined.includes("быт") ||
    combined.includes("уют")
  );
}

function isDarkProduct(productColor?: string): boolean {
  const color = normalize(productColor);
  return color.includes("black") || color.includes("dark") || color.includes("чёрн") || color.includes("черн");
}

function isLightProduct(productColor?: string): boolean {
  const color = normalize(productColor);
  return color.includes("white") || color.includes("light") || color.includes("бел") || color.includes("светл");
}

function deriveMainMessage(input: BuildCommercialDecisionInput): string {
  const title = input.resolveInput.productTitle?.trim();
  if (title && title.length > 0) {
    return `Результат с ${title}: выгода для покупателя, не категория товара`;
  }
  return "Продавай результат и обещание, не категорию товара";
}

function deriveEnvironmentDirection(input: BuildCommercialDecisionInput): EnvironmentDirection {
  const { category, productType } = input.resolveInput;
  if (isProfessionalProduct(category, productType)) {
    return "clean_industrial_technical";
  }
  if (isGarden(category, productType)) {
    return "outdoor_fresh_natural";
  }
  if (isLifestyle(category, productType)) {
    return "light_modern_clean";
  }
  return "clean_commercial_studio";
}

function deriveBackgroundContrast(input: BuildCommercialDecisionInput): BackgroundContrastDirection {
  const { productColor, productTitle } = input.resolveInput;
  if (isYellowProductColor(productColor, productTitle)) {
    return "cool_neutral_separation";
  }
  if (isDarkProduct(productColor)) {
    return "light_background";
  }
  if (isLightProduct(productColor)) {
    return "medium_contrast_background";
  }
  return "medium_contrast_background";
}

const DEFAULT_HIERARCHY: VisualHierarchyOrder[] = [
  "product",
  "headline",
  "characteristics",
  "logo",
];

export function buildCommercialDecisionBeta(
  input: BuildCommercialDecisionInput,
): CommercialDecisionBeta {
  const environmentDirection = deriveEnvironmentDirection(input);
  const backgroundContrastDirection = deriveBackgroundContrast(input);
  const reachable = REACHABLE_PRODUCT_AREA_TARGET;
  const aspirational = ASPIRATIONAL_PRODUCT_AREA_TARGET;
  const decisionTrace = [
    ...input.decisionTrace,
    `buildCommercialDecisionBeta: environment=${environmentDirection}`,
    `buildCommercialDecisionBeta: contrast=${backgroundContrastDirection}`,
    "heroDominance=product_first",
    `productAreaTarget=${reachable} (reachable, current layout)`,
    `productAreaAspirationalTarget=${aspirational} (future ultra-dominant, not applied)`,
    "maxCharacteristics=4",
    "badgeLimit=2",
  ];

  return {
    mainMessage: deriveMainMessage(input),
    heroDominance: "product_first",
    productAreaTarget: reachable,
    productAreaAspirationalTarget: aspirational,
    maxCharacteristics: 4,
    badgeLimit: 2,
    environmentDirection,
    backgroundContrastDirection,
    typographyDirection: "one main message, strong result-oriented headline",
    visualHierarchy: [...DEFAULT_HIERARCHY],
    antiRules: input.antiRules.map((r) => r.rule),
    selectedRules: input.selectedRules.map((r) => r.id),
    decisionTrace,
  };
}
