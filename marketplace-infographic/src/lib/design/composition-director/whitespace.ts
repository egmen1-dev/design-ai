import type { LayoutGeometry, LayoutGeometryPatch, WhitespaceScore } from "./types";
import { computeWhitespaceRatio } from "./geometry";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Whitespace as designed element — not empty accident */
export function scoreWhitespace(
  geometry: LayoutGeometry,
  target: [number, number],
): WhitespaceScore {
  const occupied =
    geometry.hero.width * geometry.hero.height +
    geometry.headline.width * geometry.headline.height +
    geometry.benefits.width * geometry.benefits.height +
    geometry.cta.width * geometry.cta.height;

  const negativeArea = 1 - occupied;
  const density = occupied;
  const edgePressure =
    Math.max(0, 0.08 - geometry.headline.x) +
    Math.max(0, 0.08 - geometry.hero.x) +
    Math.max(0, geometry.hero.x + geometry.hero.width - 0.94) +
    Math.max(0, geometry.headline.y - 0.02);

  const crowded = negativeArea < target[0] || density > 0.72;
  const corrections: LayoutGeometryPatch[] = [];

  if (crowded) {
    corrections.push({
      whitespaceRatio: target[1],
      hero: {
        width: geometry.hero.width * 0.9,
        height: geometry.hero.height * 0.9,
      },
      benefits: { height: geometry.benefits.height * 0.8 },
    });
  }

  const score = clamp(
    100 -
      (negativeArea < target[0] ? (target[0] - negativeArea) * 200 : 0) -
      (negativeArea > target[1] ? (negativeArea - target[1]) * 80 : 0) -
      edgePressure * 150 -
      (density > 0.68 ? 15 : 0),
  );

  return {
    score,
    passed: score >= 72 && !crowded,
    occupiedArea: occupied,
    negativeArea,
    density,
    edgePressure,
    crowded,
    corrections,
  };
}

export { computeWhitespaceRatio };
