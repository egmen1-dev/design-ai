export type GovernanceScoreDimension =
  | "technical"
  | "composition"
  | "typography"
  | "professional"
  | "product"
  | "background"
  | "lighting"
  | "brand"
  | "layout"
  | "readability"
  | "commercialAppeal"
  | "overall";

export type GovernanceScorecard = Record<GovernanceScoreDimension, number>;

export const PROFESSIONAL_SCORE_THRESHOLD = Number(
  process.env.GOVERNANCE_PROFESSIONAL_THRESHOLD ?? 75,
);

export type ScorecardInput = {
  compositionScore?: number;
  sceneScore?: number;
  luxuryScore?: number;
  photoScore?: number;
  ctrScore?: number;
  readabilityScore?: number;
  backgroundSource?: string;
  constitutionPassed?: boolean;
  renderDesignScore?: number;
};

export function buildGovernanceScorecard(input: ScorecardInput): GovernanceScorecard {
  const composition = input.compositionScore ?? 78;
  const scene = input.sceneScore ?? 80;
  const luxury = input.luxuryScore ?? 75;
  const photo = input.photoScore ?? 70;
  const ctr = input.ctrScore ?? 68;
  const readability = input.readabilityScore ?? 82;
  const render = input.renderDesignScore ?? 80;

  const background =
    input.backgroundSource === "provider" || input.backgroundSource === "sd"
      ? 88
      : input.backgroundSource === "fallback"
        ? 35
        : 50;

  const technical = Math.round((composition + scene + render) / 3);
  const typography = Math.round((readability + luxury) / 2);
  const product = Math.round((photo + composition) / 2);
  const lighting = Math.round((scene + luxury) / 2);
  const brand = Math.round((luxury + ctr) / 2);
  const layout = composition;
  const commercialAppeal = Math.round((ctr + photo + luxury) / 3);

  const professional = Math.round(
    technical * 0.15 +
      composition * 0.12 +
      typography * 0.08 +
      product * 0.12 +
      background * 0.15 +
      lighting * 0.1 +
      brand * 0.08 +
      layout * 0.1 +
      readability * 0.05 +
      commercialAppeal * 0.05,
  );

  const overall = Math.round(
    (technical +
      composition +
      typography +
      professional +
      product +
      background +
      lighting +
      brand +
      layout +
      readability +
      commercialAppeal) /
      11,
  );

  return {
    technical,
    composition,
    typography,
    professional,
    product,
    background,
    lighting,
    brand,
    layout,
    readability,
    commercialAppeal,
    overall,
  };
}
