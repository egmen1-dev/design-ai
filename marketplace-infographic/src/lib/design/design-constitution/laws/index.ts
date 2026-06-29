import { createLaw, fail, layoutPatch, pass, scenePatch } from "./helpers";

/** LAW_001 — Maximum one dominant visual object */
export const LAW_001 = createLaw({
  id: "LAW_001",
  name: "Single Focal Point",
  category: "composition",
  severity: "critical",
  description: "Maximum one dominant visual object on canvas",
  stages: ["layout_spec", "rendered_critique"],
  validate(ctx) {
    const spec = ctx.layoutSpec;
    if (!spec) return pass();
    const hero = spec.visualWeightMap.hero;
    const secondary =
      spec.visualWeightMap.headline +
      spec.visualWeightMap.benefits +
      spec.visualWeightMap.cta;
    if (hero < secondary * 1.2) {
      return fail("Hero visual weight does not dominate secondary elements", {
        heroWeight: hero,
        secondaryWeight: secondary,
      });
    }
    if ((spec.maxSecondaryObjects ?? 2) > 3) {
      return fail("More than 3 secondary elements configured", {
        maxSecondary: spec.maxSecondaryObjects ?? 2,
      });
    }
    return pass({ heroWeight: hero });
  },
  correct(_ctx, result) {
    return layoutPatch(
      {
        heroScaleDelta: 0.08,
        reduceObjectCount: 1,
        maxSecondaryObjects: 2,
      },
      "critical",
    );
  },
});

/** LAW_002 — Hero coverage 35–50% of canvas */
export const LAW_002 = createLaw({
  id: "LAW_002",
  name: "Hero Coverage",
  category: "composition",
  severity: "critical",
  description: "Hero must occupy between 35% and 50% of canvas",
  stages: ["layout_spec", "rendered_critique"],
  validate(ctx) {
    if (ctx.layout?.metrics?.productAreaPct != null) {
      const pct = ctx.layout.metrics.productAreaPct;
      if (pct < 35 || pct > 50) {
        return fail(`Hero area ${pct.toFixed(1)}% outside 35–50% band`, { heroAreaPct: pct });
      }
      return pass({ heroAreaPct: pct });
    }
    const geo = ctx.layoutSpec?.geometry?.hero;
    if (geo) {
      const area = geo.width * geo.height * 100;
      if (area < 35 || area > 52) {
        return fail(`Hero geometry area ${area.toFixed(1)}% outside 35–50% band`, {
          heroAreaPct: area,
        });
      }
      return pass({ heroAreaPct: area });
    }
    const scale = (ctx.layoutSpec?.heroScale ?? 0.68) * 100;
    if (scale < 55 || scale > 75) {
      return fail(`Hero scale target ${scale}% may violate coverage band`);
    }
    return pass({ heroScale: scale });
  },
  correct(_ctx, result) {
    const area = result.metrics?.heroAreaPct ?? result.metrics?.heroScale ?? 68;
    const delta = area < 35 ? 0.1 : area > 50 ? -0.08 : 0.05;
    return layoutPatch({ heroScaleDelta: delta }, "critical");
  },
});

/** LAW_003 — Whitespace 20–35% */
export const LAW_003 = createLaw({
  id: "LAW_003",
  name: "Whitespace",
  category: "whitespace",
  severity: "critical",
  description: "Whitespace must be between 20% and 35%",
  stages: ["layout_spec", "rendered_critique"],
  validate(ctx) {
    const ws =
      ctx.layout?.metrics?.whitespacePct ?? ctx.layoutSpec?.whitespaceTarget ?? 28;
    if (ws < 20) {
      return fail(`Whitespace ${ws.toFixed(1)}% below minimum 20%`, { whitespacePct: ws });
    }
    if (ws > 35) {
      return fail(`Whitespace ${ws.toFixed(1)}% above maximum 35%`, { whitespacePct: ws });
    }
    return pass({ whitespacePct: ws });
  },
  correct(_ctx, result) {
    const ws = result.metrics?.whitespacePct ?? 18;
    const target = ws < 20 ? 24 : 28;
    return layoutPatch(
      {
        whitespaceTarget: target,
        removeDecorations: true,
        reduceObjectCount: 2,
        heroScaleDelta: ws < 20 ? 0.05 : 0,
      },
      "critical",
    );
  },
});

/** LAW_004 — Max four primary colors */
export const LAW_004 = createLaw({
  id: "LAW_004",
  name: "Color Discipline",
  category: "color",
  severity: "major",
  description: "Maximum four primary colors",
  stages: ["layout_spec", "prompt"],
  validate(ctx) {
    const palette = ctx.layoutSpec?.palette ?? [];
    const max = ctx.layoutSpec?.maxColors ?? 4;
    if (palette.length > max) {
      return fail(`${palette.length} colors exceed limit of ${max}`, {
        colorCount: palette.length,
      });
    }
    if (ctx.promptMetadata && palette.length > 4) {
      return fail("Prompt metadata palette exceeds 4 colors");
    }
    return pass({ colorCount: palette.length });
  },
  correct() {
    return layoutPatch({ maxColors: 4 }, "major");
  },
});

/** LAW_005 — Background complexity LOW unless required */
export const LAW_005 = createLaw({
  id: "LAW_005",
  name: "Background Complexity",
  category: "visual_density",
  severity: "major",
  description: "Background complexity must remain LOW unless explicitly required",
  stages: ["scene_blueprint", "layout_spec"],
  validate(ctx) {
    const bp = ctx.sceneBlueprint;
    if (bp) {
      if (bp.decorative.backgroundComplexity === "medium") {
        return fail("Scene background complexity is MEDIUM (must stay LOW)");
      }
      if (bp.decorative.maxDensity > 0.18) {
        return fail(`Decorative density ${bp.decorative.maxDensity} too high`, {
          density: bp.decorative.maxDensity,
        });
      }
    }
    const bgWeight = ctx.layoutSpec?.visualWeightMap.background ?? 7;
    if (bgWeight > 12) {
      return fail(`Background visual weight ${bgWeight} exceeds low-complexity threshold`);
    }
    return pass();
  },
  correct() {
    return scenePatch(
      { reduceDecorativeDensity: 0.08, reduceBackgroundComplexity: true },
      "major",
    );
  },
});

/** LAW_006 — Decorative density below threshold */
export const LAW_006 = createLaw({
  id: "LAW_006",
  name: "Visual Noise",
  category: "visual_density",
  severity: "major",
  description: "Decorative density below defined threshold",
  stages: ["scene_blueprint", "layout_spec", "rendered_critique"],
  validate(ctx) {
    const bp = ctx.sceneBlueprint;
    if (bp?.accent.particles) {
      return fail("Random particles detected in scene accent");
    }
    const decorative = ctx.layoutSpec?.maxDecorativeObjects ?? 1;
    const secondary = ctx.layoutSpec?.maxSecondaryObjects ?? 2;
    if (decorative > 1 || secondary > 3) {
      return fail("Too many decorative or secondary objects configured", {
        decorative,
        secondary,
      });
    }
    if (bp && bp.decorative.maxDensity > 0.15) {
      return fail(`Decorative maxDensity ${bp.decorative.maxDensity} above threshold`);
    }
    return pass();
  },
  correct() {
    return {
      layoutSpecPatch: {
        maxDecorativeObjects: 0,
        maxSecondaryObjects: 2,
        removeDecorations: true,
        reduceObjectCount: 2,
      },
      sceneBlueprintPatch: { disableParticles: true, reduceDecorativeDensity: 0.1 },
      priority: 60,
    };
  },
});

/** LAW_007 — Exactly one primary headline */
export const LAW_007 = createLaw({
  id: "LAW_007",
  name: "Typography Hierarchy",
  category: "typography",
  severity: "critical",
  description: "Exactly one primary headline, no competing titles",
  stages: ["layout_spec", "rendered_critique"],
  validate(ctx) {
    const hierarchy = ctx.layoutSpec?.hierarchy;
    if (hierarchy) {
      const h1Count = Object.values(hierarchy).filter((l) => l === "H1").length;
      if (h1Count !== 1) {
        return fail(`${h1Count} H1 levels — exactly one primary headline required`, {
          h1Count,
        });
      }
      if (hierarchy.headline !== "H1") {
        return fail("Headline zone is not designated H1");
      }
    }
    const titleLen = ctx.meaning?.title.length ?? 0;
    if (titleLen > 58) {
      return fail(`Headline length ${titleLen} creates competing visual mass`);
    }
    if (ctx.meaning?.subtitle && ctx.meaning.subtitle.length > 40) {
      return fail("Subtitle competes with primary headline");
    }
    return pass();
  },
  correct() {
    return layoutPatch({ headlineContrastBoost: 0.12 }, "critical");
  },
});

/** LAW_008 — Eye flow Hero → Headline → Benefits → CTA */
export const LAW_008 = createLaw({
  id: "LAW_008",
  name: "Reading Order",
  category: "eye_flow",
  severity: "critical",
  description: "Eye flow: Hero → Headline → Benefits → CTA",
  stages: ["layout_spec", "rendered_critique"],
  validate(ctx) {
    const geo = ctx.layoutSpec?.geometry;
    if (!geo) return pass();
    const heroCy = geo.hero.y + geo.hero.height / 2;
    const headCy = geo.headline.y + geo.headline.height / 2;
    const benefitsCy = geo.benefits.y + geo.benefits.height / 2;
    const ctaCy = geo.cta.y + geo.cta.height / 2;
    const orderValid =
      heroCy <= headCy + 0.15 ||
      (geo.hero.x > geo.headline.x && Math.abs(heroCy - headCy) < 0.25);
    if (!orderValid && headCy > benefitsCy + 0.1) {
      return fail("Headline appears below benefits — breaks reading order");
    }
    if (ctaCy < benefitsCy - 0.05 && ctx.meaning?.feature) {
      return fail("CTA above benefits — breaks eye flow");
    }
    return pass();
  },
  correct() {
    return layoutPatch({ headlineContrastBoost: 0.1, heroScaleDelta: 0.05 }, "critical");
  },
});

/** LAW_009 — No more than two light sources */
export const LAW_009 = createLaw({
  id: "LAW_009",
  name: "Lighting Consistency",
  category: "lighting",
  severity: "major",
  description: "No more than two active light sources",
  stages: ["scene_blueprint"],
  validate(ctx) {
    const bp = ctx.sceneBlueprint;
    if (!bp) return pass();
    let sources = 0;
    if (bp.lighting.key && bp.lighting.key !== "none") sources++;
    if (bp.lighting.fill && bp.lighting.fill !== "none" && !bp.lighting.fill.includes("ambient")) {
      sources++;
    }
    if (bp.lighting.rim && bp.lighting.rim !== "none") sources++;
    if (bp.lighting.back && bp.lighting.back !== "none") sources++;
    if (sources > 2) {
      return fail(`${sources} light sources exceed maximum of 2`, { lightSources: sources });
    }
    return pass({ lightSources: sources });
  },
  correct() {
    return scenePatch({ capLightSources: 2 }, "major");
  },
});

/** LAW_010 — Foreground / Hero / Background depth separation */
export const LAW_010 = createLaw({
  id: "LAW_010",
  name: "Depth",
  category: "depth",
  severity: "major",
  description: "Foreground, hero, and background must be visually separable",
  stages: ["scene_blueprint"],
  validate(ctx) {
    const bp = ctx.sceneBlueprint;
    if (!bp) return pass();
    if (!bp.productInteraction.groundPlane) {
      return fail("Missing ground plane — hero not separable from background");
    }
    if (bp.scene.depth === "shallow" && bp.productInteraction.depthSeparation === "low") {
      return fail("Shallow depth with low separation — layers not distinguishable");
    }
    if (!bp.productInteraction.softShadow) {
      return fail("Missing contact shadow — hero floats from surface");
    }
    return pass();
  },
  correct() {
    return scenePatch({ enforceGroundPlane: true }, "major");
  },
});

/** LAW_011 — Marketplace safe zones reserved */
export const LAW_011 = createLaw({
  id: "LAW_011",
  name: "Marketplace Safe Zones",
  category: "marketplace",
  severity: "major",
  description: "Headline and product zones must remain clear for Wildberries cover",
  stages: ["layout_spec"],
  sets: ["core_v1", "marketplace_v1"],
  validate(ctx) {
    const geo = ctx.layoutSpec?.geometry;
    if (!geo) return pass();
    if (geo.headline.width > 0.42) {
      return fail("Headline zone too wide for marketplace safe area");
    }
    if (geo.hero.width * geo.hero.height > 0.52) {
      return fail("Hero zone exceeds marketplace compositing bounds");
    }
    return pass();
  },
  correct() {
    return layoutPatch({ heroScaleDelta: -0.05, whitespaceTarget: 26 }, "major");
  },
});

/** LAW_012 — No floating product */
export const LAW_012 = createLaw({
  id: "LAW_012",
  name: "No Floating Product",
  category: "photography",
  severity: "critical",
  description: "Product must anchor to ground plane with contact shadow",
  stages: ["scene_blueprint"],
  validate(ctx) {
    const bp = ctx.sceneBlueprint;
    if (!bp) return pass();
    if (!bp.productInteraction.groundPlane || !bp.productInteraction.softShadow) {
      return fail("Product may appear floating without ground plane and shadow");
    }
    return pass();
  },
  correct() {
    return scenePatch({ enforceGroundPlane: true }, "critical");
  },
});

/** LAW_013 — Grid alignment discipline */
export const LAW_013 = createLaw({
  id: "LAW_013",
  name: "Alignment",
  category: "alignment",
  severity: "minor",
  description: "Layout elements align to 12-column grid margins",
  stages: ["layout_spec"],
  validate(ctx) {
    const geo = ctx.layoutSpec?.geometry;
    if (!geo) return pass();
    const margin = geo.grid.margin / geo.canvas.width;
    if (geo.headline.x < margin * 0.5) {
      return fail("Headline violates left grid margin");
    }
    return pass();
  },
  correct() {
    return layoutPatch({ whitespaceTarget: 26 }, "minor");
  },
});

/** LAW_014 — Minimum contrast hierarchy */
export const LAW_014 = createLaw({
  id: "LAW_014",
  name: "Contrast",
  category: "contrast",
  severity: "major",
  description: "Hero-to-text contrast ratio supports readability",
  stages: ["rendered_critique"],
  validate(ctx) {
    const m = ctx.layout?.metrics;
    if (!m) return pass();
    const ratio = m.productAreaPct / Math.max(m.textAreaPct, 1);
    if (ratio < 2) {
      return fail(`Hero/text area ratio ${ratio.toFixed(2)} below contrast minimum`);
    }
    if (m.overlapPct > 2) {
      return fail(`Overlap ${m.overlapPct}% hurts contrast`);
    }
    return pass({ contrastRatio: ratio });
  },
  correct() {
    return layoutPatch(
      { headlineContrastBoost: 0.15, backgroundDarken: 0.08, heroScaleDelta: 0.06 },
      "major",
    );
  },
});

/** LAW_015 — Brand palette adherence */
export const LAW_015 = createLaw({
  id: "LAW_015",
  name: "Brand Palette",
  category: "brand",
  severity: "minor",
  description: "Palette must stay within brand color discipline",
  stages: ["layout_spec"],
  validate(ctx) {
    const palette = ctx.layoutSpec?.palette ?? [];
    if (palette.length === 0) {
      return fail("Empty brand palette");
    }
    if (palette.length > (ctx.layoutSpec?.maxColors ?? 4)) {
      return fail("Palette exceeds brand max colors");
    }
    return pass({ paletteSize: palette.length });
  },
  correct() {
    return layoutPatch({ maxColors: 4 }, "minor");
  },
});

export const ALL_LAWS = [
  LAW_001,
  LAW_002,
  LAW_003,
  LAW_004,
  LAW_005,
  LAW_006,
  LAW_007,
  LAW_008,
  LAW_009,
  LAW_010,
  LAW_011,
  LAW_012,
  LAW_013,
  LAW_014,
  LAW_015,
];

export const LAW_BY_ID = Object.fromEntries(ALL_LAWS.map((l) => [l.id, l])) as Record<
  string,
  (typeof ALL_LAWS)[number]
>;
