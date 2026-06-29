import type { LayoutGeometry, LayoutGeometryPatch, VisualBalanceScore } from "./types";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function rectWeight(r: { x: number; y: number; width: number; height: number }) {
  return r.width * r.height;
}

export function scoreVisualBalance(geometry: LayoutGeometry): VisualBalanceScore {
  const leftWeight =
    (geometry.headline.x < 0.5 ? rectWeight(geometry.headline) : 0) +
    (geometry.benefits.x < 0.5 ? rectWeight(geometry.benefits) : 0) +
    (geometry.hero.x < 0.5 ? rectWeight(geometry.hero) : 0);
  const rightWeight =
    (geometry.headline.x >= 0.5 ? rectWeight(geometry.headline) : 0) +
    (geometry.benefits.x >= 0.5 ? rectWeight(geometry.benefits) : 0) +
    (geometry.hero.x >= 0.5 ? rectWeight(geometry.hero) : 0);

  const topWeight =
    (geometry.headline.y < 0.5 ? rectWeight(geometry.headline) : 0) +
    (geometry.hero.y < 0.5 ? rectWeight(geometry.hero) * 0.5 : 0);
  const bottomWeight =
    (geometry.hero.y >= 0.4 ? rectWeight(geometry.hero) : 0) +
    (geometry.cta.y >= 0.5 ? rectWeight(geometry.cta) : 0);

  const leftRightDelta = Math.abs(leftWeight - rightWeight);
  const topBottomDelta = Math.abs(topWeight - bottomWeight);

  const cogX =
    (geometry.hero.x + geometry.hero.width / 2) * rectWeight(geometry.hero) +
    (geometry.headline.x + geometry.headline.width / 2) * rectWeight(geometry.headline);
  const cogY =
    (geometry.hero.y + geometry.hero.height / 2) * rectWeight(geometry.hero) +
    (geometry.headline.y + geometry.headline.height / 2) * rectWeight(geometry.headline);
  const totalW = rectWeight(geometry.hero) + rectWeight(geometry.headline) + 0.01;

  const negativeSpaceRatio =
    1 -
    (rectWeight(geometry.hero) +
      rectWeight(geometry.headline) +
      rectWeight(geometry.benefits) +
      rectWeight(geometry.cta));

  const corrections: LayoutGeometryPatch[] = [];
  if (leftRightDelta > 0.12) {
    if (leftWeight > rightWeight) {
      corrections.push({ hero: { x: geometry.hero.x + 0.04 } });
    } else {
      corrections.push({ headline: { x: Math.max(0.06, geometry.headline.x - 0.04) } });
    }
  }

  const score = clamp(
    100 - leftRightDelta * 120 - topBottomDelta * 80 - Math.abs(cogX / totalW - 0.52) * 40,
  );

  return {
    score,
    passed: score >= 70 && leftRightDelta < 0.18,
    leftRightDelta,
    topBottomDelta,
    centerOfGravity: { x: cogX / totalW, y: cogY / totalW },
    negativeSpaceRatio,
    corrections,
  };
}
