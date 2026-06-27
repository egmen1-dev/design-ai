import type { EyeFlowScore, LayoutGeometry, LayoutGeometryPatch } from "./types";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function centerY(r: { y: number; height: number }) {
  return r.y + r.height / 2;
}

function centerX(r: { x: number; width: number }) {
  return r.x + r.width / 2;
}

/** Simulate reading order: Hero → Headline → Benefits → CTA */
export function scoreEyeFlow(geometry: LayoutGeometry): EyeFlowScore {
  const order = ["hero", "headline", "benefits", "cta"] as const;
  const yMap = {
    hero: centerY(geometry.hero),
    headline: centerY(geometry.headline),
    benefits: centerY(geometry.benefits),
    cta: centerY(geometry.cta),
  };
  const xMap = {
    hero: centerX(geometry.hero),
    headline: centerX(geometry.headline),
    benefits: centerX(geometry.benefits),
    cta: centerX(geometry.cta),
  };

  const penalties: string[] = [];
  const corrections: LayoutGeometryPatch[] = [];
  let validOrder = true;

  const splitLayout = geometry.hero.x > 0.45 && geometry.headline.x < 0.4;

  for (let i = 1; i < order.length; i++) {
    const prev = order[i - 1];
    const curr = order[i];
    if (splitLayout && prev === "hero" && curr === "headline") continue;
    if (yMap[curr] < yMap[prev] - 0.03) {
      validOrder = false;
      penalties.push(`Eye flow break: ${prev} → ${curr}`);
    }
  }

  if (Math.abs(xMap.headline - xMap.hero) < 0.08 && geometry.hero.width > 0.45) {
    penalties.push("Headline competes with hero on same vertical axis");
    corrections.push({
      headline: { x: geometry.headline.x - 0.04 },
    });
  }

  const score = clamp(100 - penalties.length * 14 - (validOrder ? 0 : 20));

  return {
    score,
    passed: score >= 72 && validOrder,
    order: [...order],
    validOrder,
    penalties,
    corrections,
  };
}
