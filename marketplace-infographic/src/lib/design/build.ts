import { WB_COVER, clampPct, zoneAreaPct } from "@/lib/composition/canvas";
import { getCategoryRules } from "@/lib/composition/category-rules";
import type {
  CompositionInput,
  CompositionLayout,
  CompositionMetrics,
  CompositionZone,
} from "@/lib/composition/types";
import type { CompositionScenario, DesignDNA } from "./types";
import { applyJitter, createSeededRng, JITTER, pickRange, type Rng } from "./variability";

function zonesOverlap(a: CompositionZone, b: CompositionZone): boolean {
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

function resolveTextSide(
  scenario: CompositionScenario,
  dna: DesignDNA,
  rng: Rng,
): "left" | "right" {
  if (scenario.biases.textSide === "auto") {
    return dna.symmetry > 50 ? "left" : rng() > 0.5 ? "left" : "right";
  }
  return scenario.biases.textSide;
}

function estimateMetrics(
  layout: Omit<
    CompositionLayout,
    "metrics" | "valid" | "issues" | "adjustments" | "score" | "scenarioId" | "dna" | "seed"
  >,
): CompositionMetrics {
  const productAreaPct = zoneAreaPct(layout.product.width, layout.product.height);
  const textAreaPct =
    zoneAreaPct(layout.headline.width, layout.headline.height) +
    zoneAreaPct(layout.subtitle.width, layout.subtitle.height) +
    zoneAreaPct(layout.bullets.width, layout.bullets.height);
  const plaqueAreaPct =
    zoneAreaPct(layout.leftPanel.width, layout.leftPanel.height) +
    zoneAreaPct(layout.rightSidebar.width, layout.rightSidebar.height);

  let overlapPct = 0;
  const textZones = [
    layout.headline,
    layout.subtitle,
    layout.leftPanel,
    layout.rightSidebar,
    layout.bullets,
  ];
  for (const z of textZones) {
    if (z.width > 0 && zonesOverlap(layout.product, z)) {
      overlapPct += zoneAreaPct(
        Math.min(layout.product.left + layout.product.width, z.left + z.width) -
          Math.max(layout.product.left, z.left),
        Math.min(layout.product.top + layout.product.height, z.top + z.height) -
          Math.max(layout.product.top, z.top),
      );
    }
  }

  const usedArea = productAreaPct + textAreaPct + plaqueAreaPct - overlapPct;

  return {
    productAreaPct,
    textAreaPct,
    plaqueAreaPct,
    whitespacePct: Math.max(0, 100 - usedArea),
    overlapPct,
    visualCenterX:
      (layout.product.centerX * productAreaPct +
        (layout.headline.left + layout.headline.width / 2) *
          (textAreaPct + plaqueAreaPct)) /
      Math.max(1, productAreaPct + textAreaPct + plaqueAreaPct),
    visualCenterY:
      (layout.product.centerY * productAreaPct +
        layout.headline.top * (textAreaPct + plaqueAreaPct)) /
      Math.max(1, productAreaPct + textAreaPct + plaqueAreaPct),
    minEdgeInsetPct: Math.min(
      layout.product.left,
      layout.product.top,
      100 - (layout.product.left + layout.product.width),
      100 - (layout.product.top + layout.product.height),
      layout.headline.left,
      layout.headline.top,
    ),
  };
}

/** Построение макета из DNA + сценария — только диапазоны, без фиксированных координат */
export function buildLayoutFromDNA(
  input: CompositionInput,
  dna: DesignDNA,
  scenario: CompositionScenario,
  seed: string,
): CompositionLayout {
  const rng = createSeededRng(`layout:${seed}:${scenario.id}`);
  const catRules = getCategoryRules(input.category);
  const safeInsetPct = clampPct(5 + dna.minimalism / 50, 5, 8);
  const textSide = resolveTextSide(scenario, dna, rng);
  const spread = pickRange(rng, scenario.biases.panelSpread[0], scenario.biases.panelSpread[1]);

  const dominanceBias = (dna.productDominance - 50) / 100;
  const scaleBias = ((input.objectScale ?? 0.78) - 0.5) * 10;
  const widthPct = applyJitter(
    rng,
    pickRange(rng, scenario.biases.productWidth[0], scenario.biases.productWidth[1]) +
      dominanceBias * 6 +
      scaleBias * 0.5,
    JITTER.product,
  );
  const heightPct = applyJitter(
    rng,
    pickRange(rng, scenario.biases.productHeight[0], scenario.biases.productHeight[1]) +
      dominanceBias * 5 +
      scaleBias,
    JITTER.product,
  );

  const clampedW = clampPct(widthPct, catRules.widthPct[0], catRules.widthPct[1]);
  const clampedH = clampPct(heightPct, catRules.heightPct[0], catRules.heightPct[1]);

  let productWidth = clampedW;
  let productHeight = clampedH;
  let productArea = zoneAreaPct(productWidth, productHeight);
  if (productArea < 55) {
    const scale = Math.sqrt(55 / productArea);
    productWidth = clampPct(productWidth * scale, 42, 74);
    productHeight = clampPct(productHeight * scale, 68, 90);
    productArea = zoneAreaPct(productWidth, productHeight);
  }
  if (productArea > 72) {
    const scale = Math.sqrt(72 / productArea);
    productWidth = productWidth * scale;
    productHeight = productHeight * scale;
  }

  let centerX = applyJitter(
    rng,
    pickRange(rng, scenario.biases.productCenterX[0], scenario.biases.productCenterX[1]),
    JITTER.product,
  );
  if (textSide === "left") centerX = clampPct(centerX + 4, 52, 66);
  else centerX = clampPct(centerX - 2, 38, 55);

  const centerY = applyJitter(
    rng,
    pickRange(rng, scenario.biases.productCenterY[0], scenario.biases.productCenterY[1]),
    JITTER.product,
  );

  const rotationDeg = applyJitter(
    rng,
    pickRange(rng, scenario.biases.rotationDeg[0], scenario.biases.rotationDeg[1]),
    JITTER.product * 0.4,
  );

  const productLeft = clampPct(
    centerX - productWidth / 2,
    safeInsetPct,
    100 - safeInsetPct - productWidth,
  );
  const productTop = clampPct(
    centerY - productHeight / 2,
    input.hasLeftPanel ? 28 : safeInsetPct + 6,
    100 - safeInsetPct - productHeight,
  );

  const headlineWidth = applyJitter(
    rng,
    pickRange(rng, scenario.biases.headlineWidth[0], scenario.biases.headlineWidth[1]),
    JITTER.headline,
  );
  const headlineTop = applyJitter(
    rng,
    pickRange(rng, scenario.biases.headlineTop[0], scenario.biases.headlineTop[1]),
    JITTER.headline,
  );
  const headlineHeight = clampPct(10 + dna.textDensity / 12, 10, 18);
  const headlineFont = clampPct(4.2 + dna.typographyWeight / 28, 3.8, 5.8);

  const headlineLeft =
    textSide === "left"
      ? clampPct(safeInsetPct + rng() * 2, safeInsetPct, 12)
      : clampPct(100 - headlineWidth - safeInsetPct, 35, 100 - headlineWidth - 5);

  const headline = {
    left: headlineLeft,
    top: headlineTop,
    width: clampPct(headlineWidth, 35, 65),
    height: headlineHeight,
    fontSizePct: applyJitter(rng, headlineFont, JITTER.headline),
  };

  const subtitle = {
    left: headline.left,
    top: headline.top + headline.height + applyJitter(rng, 1.2, JITTER.headline),
    width: clampPct(headline.width * 0.92, 32, 60),
    height: clampPct(4.5 + dna.textDensity / 25, 4, 8),
    fontSizePct: headline.fontSizePct * (0.48 + dna.minimalism / 250),
  };

  const panelW = applyJitter(rng, 16 * spread, JITTER.plaque);
  const panelH = applyJitter(rng, 26 * spread, JITTER.plaque);

  const leftPanel: CompositionZone =
    input.hasLeftPanel && textSide === "left"
      ? {
          left: safeInsetPct,
          top: clampPct(headline.top + headline.height + 4, 14, 20),
          width: clampPct(panelW, 14, 20),
          height: clampPct(panelH, 16, 22),
        }
      : { left: 0, top: 0, width: 0, height: 0 };

  const rightSidebar: CompositionZone = input.hasRightSidebar
    ? {
        left: clampPct(
          100 - safeInsetPct - applyJitter(rng, 12 * spread, JITTER.plaque),
          84,
          90,
        ),
        top: clampPct(18 + rng() * 8, 16, 28),
        width: clampPct(applyJitter(rng, 11.5 * spread, JITTER.plaque), 10, 15),
        height: clampPct(applyJitter(rng, 30 * spread, JITTER.plaque), 26, 38),
      }
    : { left: 0, top: 0, width: 0, height: 0 };

  const bulletCount = Math.min(5, input.bulletCount);
  const bullets = {
    left: textSide === "left" ? leftPanel.left : 100 - 28,
    top: clampPct(50 + rng() * 6, 45, 58),
    width: clampPct(24 + dna.textDensity / 8, 20, 32),
    height: clampPct(Math.min(28, bulletCount * 5), 18, 30),
    itemHeightPct: applyJitter(rng, 4, JITTER.icon),
    gapPct: applyJitter(rng, 1.4, JITTER.icon),
    maxCount: 5,
  };

  const decorScale = 0.7 + dna.decorDensity / 200;
  const plaques = {
    smallWidthPct: applyJitter(rng, 7.5 * decorScale, JITTER.plaque),
    mediumWidthPct: applyJitter(rng, 11.5 * decorScale, JITTER.plaque),
    largeWidthPct: applyJitter(rng, 17 * decorScale, JITTER.plaque),
    heightPct: applyJitter(rng, 5.5 * decorScale, JITTER.plaque),
    maxTotalAreaPct: 12,
  };

  const icon = {
    sizePct: applyJitter(rng, 3.8 + dna.contrast / 40, JITTER.icon),
    textGapPct: applyJitter(rng, 1.4, JITTER.icon),
  };

  const draft = {
    canvas: { width: WB_COVER.width, height: WB_COVER.height },
    safeInsetPct,
    product: {
      left: productLeft,
      top: productTop,
      width: productWidth,
      height: productHeight,
      centerX,
      centerY,
      maxWidthPct: productWidth,
      maxHeightPct: productHeight,
      areaPct: zoneAreaPct(productWidth, productHeight),
      rotationDeg,
    },
    headline,
    subtitle,
    leftPanel,
    rightSidebar,
    bullets,
    plaques,
    icon,
    logo: input.hasLogo
      ? {
          left: 100 - safeInsetPct - 12,
          top: safeInsetPct,
          width: 12,
          height: 5.5,
        }
      : undefined,
    textSide,
    scenarioId: scenario.id,
    dna,
    seed,
  };

  const metrics = estimateMetrics(draft);

  return {
    ...draft,
    metrics,
    valid: true,
    issues: [],
    adjustments: [],
    score: 0,
  };
}
