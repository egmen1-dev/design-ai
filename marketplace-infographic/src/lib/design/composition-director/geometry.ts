import { createSeededRng, pickRange } from "@/lib/design/variability";
import type {
  CompositionConstraints,
  LayoutGeometry,
  LayoutGeometryPatch,
  NormalizedVisualWeight,
} from "./types";
import { WB_CANVAS } from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function buildGeometryFromTemplate(
  template: CompositionConstraints,
  seed: string,
): LayoutGeometry {
  const rng = createSeededRng(`comp:${seed}:${template.id}`);
  const t = rng();

  const heroW = lerp(template.heroWidth[0], template.heroWidth[1], t);
  const heroH = lerp(template.heroHeight[0], template.heroHeight[1], 1 - t * 0.3);
  const headW = lerp(template.headlineWidth[0], template.headlineWidth[1], rng());
  const headH = lerp(template.headlineHeight[0], template.headlineHeight[1], rng());

  let heroX = 0.52;
  let heroY = 0.38;
  if (template.heroSide === "left") {
    heroX = 0.06;
    heroY = 0.32;
  } else if (template.heroSide === "right") {
    heroX = 0.5;
    heroY = 0.32;
  } else if (template.heroSide === "bottom") {
    heroX = 0.24;
    heroY = 0.48;
  } else {
    heroX = 0.42;
    heroY = 0.36;
  }

  const headlineX = template.heroSide === "right" || template.heroSide === "bottom" ? 0.08 : 0.48;
  const headlineY = 0.09;

  return {
    canvas: { ...WB_CANVAS },
    grid: { columns: 12, margin: 48, gutter: 16 },
    hero: {
      x: heroX,
      y: heroY,
      width: heroW,
      height: heroH,
      rotation: template.id === "diagonal" ? -4 : template.heroSide === "right" ? -3 : 2,
    },
    headline: {
      x: headlineX,
      y: headlineY,
      width: headW,
      height: headH,
    },
    benefits: {
      x: headlineX,
      y: headlineY + headH + 0.06,
      width: headW + 0.02,
      height: 0.12,
    },
    cta: {
      x: headlineX,
      y: 0.83,
      width: 0.22,
      height: 0.06,
    },
  };
}

export function computeVisualWeight(geometry: LayoutGeometry): NormalizedVisualWeight {
  const heroArea = geometry.hero.width * geometry.hero.height;
  const headArea = geometry.headline.width * geometry.headline.height;
  const benArea = geometry.benefits.width * geometry.benefits.height;
  const ctaArea = geometry.cta.width * geometry.cta.height;
  const total = heroArea + headArea + benArea + ctaArea + 0.15;
  return {
    hero: clamp(heroArea / total, 0.35, 0.55),
    headline: clamp(headArea / total, 0.12, 0.28),
    benefits: clamp(benArea / total, 0.08, 0.18),
    cta: clamp(ctaArea / total, 0.04, 0.12),
    background: clamp(0.15, 0.06, 0.2),
  };
}

export function computeWhitespaceRatio(geometry: LayoutGeometry): number {
  const occupied =
    geometry.hero.width * geometry.hero.height +
    geometry.headline.width * geometry.headline.height +
    geometry.benefits.width * geometry.benefits.height +
    geometry.cta.width * geometry.cta.height;
  return clamp(1 - occupied, 0.18, 0.42);
}

export function applyGeometryPatch(
  geometry: LayoutGeometry,
  patch: LayoutGeometryPatch,
): LayoutGeometry {
  const next = {
    ...geometry,
    hero: { ...geometry.hero, ...patch.hero },
    headline: { ...geometry.headline, ...patch.headline },
    benefits: { ...geometry.benefits, ...patch.benefits },
    cta: { ...geometry.cta, ...patch.cta },
  };
  if (patch.whitespaceRatio != null && patch.whitespaceRatio > computeWhitespaceRatio(next)) {
    next.hero = { ...next.hero, width: next.hero.width * 0.92, height: next.hero.height * 0.92 };
    next.benefits = { ...next.benefits, height: next.benefits.height * 0.85 };
  }
  return next;
}

/** Rule: hero 35–50% canvas, never dead center */
export function enforceCompositionRules(geometry: LayoutGeometry): LayoutGeometry {
  const heroArea = geometry.hero.width * geometry.hero.height;
  let g = { ...geometry, hero: { ...geometry.hero } };

  if (heroArea > 0.5) {
    const scale = Math.sqrt(0.48 / heroArea);
    g.hero.width *= scale;
    g.hero.height *= scale;
  }
  if (heroArea < 0.35) {
    const scale = Math.sqrt(0.38 / heroArea);
    g.hero.width *= scale;
    g.hero.height *= scale;
  }

  const cx = g.hero.x + g.hero.width / 2;
  const cy = g.hero.y + g.hero.height / 2;
  if (Math.abs(cx - 0.5) < 0.04 && Math.abs(cy - 0.5) < 0.04) {
    g.hero.x += 0.06;
  }

  const headArea = g.headline.width * g.headline.height;
  if (headArea > 0.18) {
    g.headline = { ...g.headline, height: g.headline.height * 0.85 };
  }
  if (headArea < 0.12) {
    g.headline = { ...g.headline, height: g.headline.height * 1.1 };
  }

  return g;
}
