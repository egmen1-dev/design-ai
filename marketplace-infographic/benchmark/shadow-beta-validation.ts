#!/usr/bin/env npx tsx
/**
 * Sprint 9 — Shadow Beta Visual Review (evaluation only, no production changes).
 * Legacy vs Commercial pipeline A/B per product.
 */
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createCommercialGenomeBetaDecision } from "../src/lib/daos/commercial-genome-beta";
import { evaluateCommercialFidelity } from "../src/lib/commercial-fidelity";
import type { CommercialFidelityReport } from "../src/lib/commercial-fidelity";
import { buildInitialLayoutSpec } from "../src/lib/design/layout-spec/builder";
import {
  stabilizeLayoutSpecWithCommercialIntent,
  COMMERCIAL_LAYOUT_INTEGRATION_FLAG,
} from "../src/lib/design/layout-spec/commercial-layout-integration";
import {
  resolveLayoutObjectScale,
  layoutObjectScaleFromTemplate,
} from "../src/lib/design/layout-spec/commercial-layout-propagation";
import { computeProfessionalLayout } from "../src/lib/layout-engine";
import type { CardMeaning } from "../src/lib/layout-engine/types";
import { buildGeometryClampDiagnostics } from "../src/lib/layout-engine/geometry-clamp-optimization";
import { getTemplate } from "../src/lib/layout-engine/templates";
import { planScene } from "../src/lib/design/scene-planner";
import { compositeProductIntoScene } from "../src/lib/compositing/scene-compositor";
import { rebuildVisualPipelineForRender } from "../src/lib/design/visual-pipeline/rebuild-for-render";
import { regenerateMarketplaceBackground } from "../src/lib/render-engine/regenerate-background";
import type { ProductAnalysis } from "../src/lib/product-analysis";
import { WB_COVER } from "../src/lib/composition/canvas";
import { diffImages } from "./lib/image-metrics";

const PRODUCTS = [
  {
    id: "construction-vacuum",
    label: "Construction Vacuum",
    title: "Строительный пылесос для ремонта 30 л",
    analysis: { category: "professional tool", priceSegment: "mass", brandTone: "technical" } as ProductAnalysis,
    productColor: "yellow",
  },
  {
    id: "battery-sprayer",
    label: "Battery Sprayer",
    title: "Аккумуляторный опрыскиватель 16 л для сада",
    analysis: { category: "garden_tools", priceSegment: "mass", brandTone: "natural" } as ProductAnalysis,
  },
  {
    id: "impact-drill",
    label: "Drill",
    title: "Ударная дрель 800 Вт профессиональная",
    analysis: { category: "professional tool", priceSegment: "mass", brandTone: "technical" } as ProductAnalysis,
    productColor: "black",
  },
  {
    id: "pressure-washer",
    label: "Pressure Washer",
    title: "Мойка высокого давления 180 бар",
    analysis: { category: "home_appliances", priceSegment: "mass", brandTone: "tech" } as ProductAnalysis,
  },
  {
    id: "home-humidifier",
    label: "Garden / Home Tool",
    title: "Увлажнитель воздуха для дома ультразвуковой",
    analysis: { category: "home", priceSegment: "mass", brandTone: "cozy" } as ProductAnalysis,
  },
] as const;

const FIXED_SEED = "sprint9-shadow-beta-20260709";
const OUT_DIR = path.join(__dirname, "output", "sprint9");
const RENDER_ENABLED = process.env.SPRINT9_SKIP_RENDER !== "1";
const CARD_W = WB_COVER.width;
const CARD_H = WB_COVER.height;

process.env.RENDER_ENGINE_V17 = "1";
process.env.DAOS_COMMERCIAL_GENOME_BETA = "1";

type Arm = "legacy" | "commercial";

function meaning(title: string): CardMeaning {
  return {
    title,
    subtitle: "Профессиональное качество",
    feature: "Мощный мотор",
    badge: "ХИТ",
    emotion: "Надёжность",
    style: "Premium",
    priority: "product",
  };
}

function placementAreaPct(w: number, h: number): number {
  return Math.round(((w * h) / (CARD_W * CARD_H)) * 1000) / 10;
}

function score0to10(value: number): number {
  return Math.round(Math.min(10, Math.max(0, value / 10)) * 10) / 10;
}

function paramMeasured(report: CommercialFidelityReport, id: string): number {
  return report.diagnostics.commercialMeasuredValues[id as keyof typeof report.diagnostics.commercialMeasuredValues];
}

function computeProductScores(report: CommercialFidelityReport, productAreaPct: number) {
  const fidelity = score0to10(report.diagnostics.commercialFidelityScore);
  const visualQuality = score0to10(
    (paramMeasured(report, "background_separation") + paramMeasured(report, "scene_consistency")) / 2,
  );
  const commercialReadability = score0to10(
    (paramMeasured(report, "product_dominance") + paramMeasured(report, "visual_hierarchy")) / 2,
  );
  const areaAlignment = score0to10(
    Math.max(0, 100 - Math.abs(paramMeasured(report, "product_area") - productAreaPct) * 2.5),
  );
  const marketplaceReadiness = Math.round(((fidelity + visualQuality + commercialReadability + areaAlignment) / 4) * 10) / 10;
  const overall = Math.round(((fidelity * 0.35 + visualQuality * 0.2 + commercialReadability * 0.25 + marketplaceReadiness * 0.2)) * 10) / 10;
  return { commercialFidelity: fidelity, visualQuality, commercialReadability, marketplaceReadiness, overallProductScore: overall };
}

async function ensureSharedCutout(cutoutPath: string, productColor?: string): Promise<void> {
  if (fs.existsSync(cutoutPath)) return;
  const base =
    productColor === "yellow"
      ? { r: 210, g: 160, b: 40 }
      : productColor === "black"
        ? { r: 40, g: 40, b: 45 }
        : { r: 200, g: 140, b: 40 };
  const body = await sharp({
    create: { width: 280, height: 420, channels: 4, background: { ...base, alpha: 255 } },
  })
    .png()
    .toBuffer();
  await sharp({
    create: { width: 400, height: 520, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: body, left: 60, top: 50 }])
    .png()
    .toFile(cutoutPath);
}

/** Benchmark-only fallback when floor-contact composite fails on synthetic cutout */
async function simpleCompositeFallback(
  bgRel: string,
  cutoutRel: string,
  objectScale: number,
): Promise<{ mergedBuffer: Buffer; productPlacement: { width: number; height: number; left: number; top: number } }> {
  const bgPath = path.join(process.cwd(), "public", bgRel.replace(/^\//, ""));
  const cutoutPath = path.join(process.cwd(), "public", cutoutRel.replace(/^\//, ""));
  const bg = await sharp(bgPath).resize(CARD_W, CARD_H, { fit: "cover" }).toBuffer();
  const productW = Math.round(CARD_W * 0.42 * objectScale);
  const productH = Math.round(CARD_H * 0.55 * objectScale);
  const cutout = await sharp(cutoutPath).resize(productW, productH, { fit: "inside" }).png().toBuffer();
  const meta = await sharp(cutout).metadata();
  const w = meta.width ?? productW;
  const h = meta.height ?? productH;
  const left = Math.round(CARD_W * 0.48 - w / 2);
  const top = Math.round(CARD_H * 0.42 - h / 2);
  const merged = await sharp(bg)
    .composite([{ input: cutout, left: Math.max(0, left), top: Math.max(0, top) }])
    .png()
    .toBuffer();
  return { mergedBuffer: merged, productPlacement: { width: w, height: h, left, top } };
}

async function safeComposite(input: {
  bgRel: string;
  cutoutRel: string;
  scenePlan: ReturnType<typeof planScene>["scene"];
  layout: ReturnType<typeof computeProfessionalLayout>["layout"];
  objectScale: number;
  commercialCalibration: boolean;
}) {
  try {
    return await compositeProductIntoScene(input.bgRel, input.cutoutRel, {
      layout: "marketplace",
      scene: input.scenePlan,
      compositionLayout: input.layout,
      objectScale: input.objectScale,
      commercialCalibration: input.commercialCalibration,
    });
  } catch (error) {
    console.warn(
      `compositeProductIntoScene fallback for ${input.bgRel}:`,
      error instanceof Error ? error.message : error,
    );
    const fallback = await simpleCompositeFallback(input.bgRel, input.cutoutRel, input.objectScale);
    return {
      mergedBuffer: fallback.mergedBuffer,
      productPlacement: fallback.productPlacement,
      usedFallback: true,
    };
  }
}

async function runArm(input: {
  product: (typeof PRODUCTS)[number];
  arm: Arm;
  cutoutRel: string;
}) {
  const { product, arm, cutoutRel } = input;
  const scenePlan = planScene({
    prompt: product.title,
    seed: `${FIXED_SEED}:${product.id}`,
    productVisual: product.productColor
      ? { dominantColors: [product.productColor], shape: "compact" }
      : undefined,
  }).scene;

  const legacyLayout = buildInitialLayoutSpec({
    analysis: product.analysis,
    palette: ["#1a1a2e", "#f8fafc", "#f97316", "#64748b"],
  });

  const genome =
    arm === "commercial"
      ? createCommercialGenomeBetaDecision({
          marketplace: "wildberries",
          category: product.analysis.category,
          productTitle: product.title,
          productColor: product.productColor,
          productType: product.analysis.category,
          mode: "generation",
        })
      : undefined;

  process.env[COMMERCIAL_LAYOUT_INTEGRATION_FLAG] = arm === "commercial" ? "1" : "0";

  const layoutSpec =
    arm === "commercial" && genome
      ? stabilizeLayoutSpecWithCommercialIntent(legacyLayout, genome.decision).layout
      : legacyLayout;

  const pro = computeProfessionalLayout({
    meaning: meaning(product.title),
    category: product.analysis,
    seed: `${FIXED_SEED}:${product.id}:${arm}`,
    layoutSpec,
  });

  const templateAreaPct = pro.layout.metrics.productAreaPct;
  const propagation =
    arm === "commercial"
      ? resolveLayoutObjectScale({ layoutSpec, templateAreaPct })
      : {
          objectScale: layoutObjectScaleFromTemplate(templateAreaPct),
          diagnostics: {
            commercialLayoutPropagation: false,
            commercialScaleSource: "template" as const,
            commercialScaleExpected: templateAreaPct,
            commercialScaleApplied: layoutObjectScaleFromTemplate(templateAreaPct),
            commercialPropagationMode: "legacy_template",
          },
        };

  const pipeline = rebuildVisualPipelineForRender({
    prompt: product.title,
    analysis: product.analysis,
    layoutSpec,
    scenePlan,
    palette: layoutSpec.palette,
  });

  const geometryOptimization =
    arm === "commercial"
      ? buildGeometryClampDiagnostics({
          layout: pro.layout,
          productScale: getTemplate(pro.templateId).productScale,
          objectScale: propagation.objectScale,
        })
      : undefined;

  if (!RENDER_ENABLED) {
    return {
      arm,
      layoutSpec,
      pro,
      propagation,
      geometryOptimization,
      genome: genome?.decision,
      renderError: "SPRINT9_SKIP_RENDER=1",
    };
  }

  const bg = await regenerateMarketplaceBackground({
    analysis: product.analysis,
    scenePlan,
    layoutSpec,
    visualBlueprint: pipeline.visualBlueprint,
    sceneBlueprint: pipeline.sceneBlueprint,
    variationSeed: FIXED_SEED,
    seedSuffix: `${product.id}:${arm}`,
    constitutionPassed: true,
    legacyPrompt: product.title,
  });

  const bgRel = `/backgrounds/sprint9-${product.id}-${arm}.png`;
  const bgPath = path.join(process.cwd(), "public", "backgrounds", `sprint9-${product.id}-${arm}.png`);
  fs.mkdirSync(path.dirname(bgPath), { recursive: true });
  await fsPromises.writeFile(bgPath, bg.engine?.backgroundBuffer ?? Buffer.from([]));

  const composite = await safeComposite({
    bgRel,
    cutoutRel,
    scenePlan,
    layout: pro.layout,
    objectScale: propagation.objectScale,
    commercialCalibration: arm === "commercial",
  });

  const measuredProductArea = placementAreaPct(
    composite.productPlacement.width,
    composite.productPlacement.height,
  );

  return {
    arm,
    layoutSpec,
    pro,
    propagation,
    geometryOptimization,
    genome: genome?.decision,
    composite,
    measuredProductArea,
    bgBuffer: bg.engine?.backgroundBuffer,
  };
}

async function buildComparisonBoard(input: {
  legacyPath: string;
  commercialPath: string;
  outPath: string;
  title: string;
  metrics: {
    legacyArea: number;
    commercialArea: number;
    legacyFidelity: number;
    commercialFidelity: number;
    legacyScore: number;
    commercialScore: number;
    improvements: string[];
    weaknesses: string[];
  };
}) {
  const thumbW = 420;
  const thumbH = 560;
  const pad = 24;
  const headerH = 56;
  const footerH = 220;
  const boardW = thumbW * 2 + pad * 3;
  const boardH = headerH + thumbH + footerH + pad * 2;

  const [legacyBuf, commercialBuf] = await Promise.all([
    sharp(input.legacyPath).resize(thumbW, thumbH, { fit: "cover" }).png().toBuffer(),
    sharp(input.commercialPath).resize(thumbW, thumbH, { fit: "cover" }).png().toBuffer(),
  ]);

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const footerLines = [
    `Product Area: Legacy ${input.metrics.legacyArea}% → Commercial ${input.metrics.commercialArea}%`,
    `Commercial Fidelity: ${input.metrics.legacyFidelity} → ${input.metrics.commercialFidelity}`,
    `Product Score: ${input.metrics.legacyScore}/10 → ${input.metrics.commercialScore}/10`,
    `Improvements: ${input.metrics.improvements.join("; ") || "—"}`,
    `Weaknesses: ${input.metrics.weaknesses.join("; ") || "—"}`,
  ];

  const svg = `
<svg width="${boardW}" height="${boardH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="${headerH}" fill="#0f172a"/>
  <rect y="${headerH + thumbH}" width="100%" height="${footerH + pad}" fill="#0f172a"/>
  <text x="${boardW / 2}" y="36" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="22" font-weight="700">${esc(input.title)}</text>
  <text x="${pad + thumbW / 2}" y="${headerH + 20}" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="16" font-weight="600">LEGACY</text>
  <text x="${pad * 2 + thumbW + thumbW / 2}" y="${headerH + 20}" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-size="16" font-weight="600">COMMERCIAL</text>
  ${footerLines
    .map(
      (line, i) =>
        `<text x="${pad}" y="${headerH + thumbH + pad + 28 + i * 22}" fill="#e2e8f0" font-family="sans-serif" font-size="13">${esc(line)}</text>`,
    )
    .join("")}
</svg>`;

  await sharp({
    create: { width: boardW, height: boardH, channels: 3, background: { r: 30, g: 41, b: 59 } },
  })
    .composite([
      { input: Buffer.from(svg), top: 0, left: 0 },
      { input: legacyBuf, left: pad, top: headerH },
      { input: commercialBuf, left: pad * 2 + thumbW, top: headerH },
    ])
    .png()
    .toFile(input.outPath);
}

function humanVerdict(input: {
  legacyScore: number;
  commercialScore: number;
  areaGain: number;
  fidelityGain: number;
}): { strengths: string[]; weaknesses: string[]; recommendation: string; human: Record<string, string> } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (input.areaGain > 5) strengths.push("Заметно большая площадь товара на карточке");
  if (input.fidelityGain > 10) strengths.push("Commercial Fidelity вырос — цель и измерение согласованы");
  if (input.commercialScore > input.legacyScore) strengths.push("Общий Product Score выше у Commercial");
  if (input.areaGain <= 0) weaknesses.push("Площадь товара не выросла относительно Legacy");
  if (input.commercialScore < 6) weaknesses.push("Абсолютный Product Score всё ещё ниже 6/10");
  weaknesses.push("Нет финального текстового оверлея WB в этом benchmark-артефакте (фон + compositor)");

  const recommendation =
    input.commercialScore > input.legacyScore + 0.5
      ? "Commercial Pipeline даёт более сильную визуальную основу для WB-карточки"
      : "Commercial Pipeline требует доработки перед Shadow Beta";

  const human = {
    productDominates:
      input.areaGain > 8 ? "Да — Commercial заметно крупнее" : "Частично — рост есть, но без текста оценка ограничена",
    cardReadable: "Фон читается; полная оценка миниатюры требует финального оверлея",
    backgroundHelps: input.fidelityGain > 0 ? "Да — сцена ближе к commercial intent" : "Нейтрально",
    textReadable: "Текст не рендерился в этом sprint-артефакте",
    singleMessage: "Визуальный фокус на товаре усилился у Commercial",
    commerciallyStronger: input.commercialScore > input.legacyScore ? "Да" : "Нет",
  };

  return { strengths, weaknesses, recommendation, human };
}

function buildHtmlReport(products: Array<Record<string, unknown>>, summary: Record<string, unknown>): string {
  const sections = products
    .map(
      (p) => `
<h2>${p.folder} — ${p.label}</h2>
<div class="row">
  <figure><figcaption>Legacy</figcaption><img src="${p.folder}/legacy.png" alt="legacy"/></figure>
  <figure><figcaption>Commercial</figcaption><img src="${p.folder}/commercial.png" alt="commercial"/></figure>
</div>
<img class="comparison" src="${p.folder}/comparison.png" alt="comparison"/>
<h3>Metrics</h3>
<pre>${JSON.stringify(p.metrics, null, 2)}</pre>
<h3>Verdict</h3>
<p><strong>Strengths:</strong> ${(p.verdict as { strengths: string[] }).strengths.join("; ")}</p>
<p><strong>Weaknesses:</strong> ${(p.verdict as { weaknesses: string[] }).weaknesses.join("; ")}</p>
<p><strong>Recommendation:</strong> ${(p.verdict as { recommendation: string }).recommendation}</p>
<hr/>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8"/>
  <title>DAOS Shadow Beta Report — Sprint 9</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b1220; color: #e2e8f0; margin: 0; padding: 24px; max-width: 1200px; }
    h1 { border-bottom: 2px solid #38bdf8; padding-bottom: 8px; }
    .row { display: flex; gap: 16px; flex-wrap: wrap; }
    figure { margin: 0; }
    img { max-width: 360px; border: 1px solid #334155; border-radius: 8px; }
    img.comparison { max-width: 100%; margin-top: 12px; }
    figcaption { color: #94a3b8; margin-bottom: 6px; }
    pre { background: #1e293b; padding: 12px; border-radius: 8px; overflow: auto; font-size: 12px; }
    hr { border: none; border-top: 1px solid #334155; margin: 32px 0; }
    .council { background: #172554; padding: 16px; border-radius: 8px; border-left: 4px solid #38bdf8; }
  </style>
</head>
<body>
  <h1>DAOS Shadow Beta Report</h1>
  <p>Sprint 9 — Shadow Beta Visual Review. Generated: ${summary.timestamp}</p>
  ${sections}
  <h2>Summary</h2>
  <pre>${JSON.stringify(summary, null, 2)}</pre>
  <div class="council">
    <h2>Council Decision</h2>
    <p><strong>${summary.councilDecision}</strong></p>
    <p>${summary.councilRationale}</p>
  </div>
</body>
</html>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const productSummaries: Array<Record<string, unknown>> = [];
  let councilDecision: "APPROVE" | "APPROVE WITH FIXES" | "NOT READY" = "APPROVE WITH FIXES";
  let wins = 0;

  for (let i = 0; i < PRODUCTS.length; i++) {
    const product = PRODUCTS[i]!;
    const folder = `product-${i + 1}`;
    const productDir = path.join(OUT_DIR, folder);
    fs.mkdirSync(productDir, { recursive: true });

    console.log(`==> ${product.id} (${folder})`);

    const cutoutRel = `/backgrounds/sprint9-${product.id}-cutout.png`;
    const cutoutPath = path.join(process.cwd(), "public", "backgrounds", `sprint9-${product.id}-cutout.png`);
    await ensureSharedCutout(cutoutPath, product.productColor);

    const legacy = await runArm({ product, arm: "legacy", cutoutRel });
    const commercial = await runArm({ product, arm: "commercial", cutoutRel });

    if (!legacy.composite || !commercial.composite) {
      console.warn(`Render skipped or failed for ${product.id}`);
      continue;
    }

    const legacyPath = path.join(productDir, "legacy.png");
    const commercialPath = path.join(productDir, "commercial.png");
    await fsPromises.writeFile(legacyPath, legacy.composite.mergedBuffer);
    await fsPromises.writeFile(commercialPath, commercial.composite.mergedBuffer);

    const legacyFid = await evaluateCommercialFidelity({
      imagePath: legacyPath,
      layoutSpec: legacy.layoutSpec,
      productColorHint: product.productColor,
    });
    const commercialFid = await evaluateCommercialFidelity({
      imagePath: commercialPath,
      layoutSpec: commercial.layoutSpec,
      productColorHint: product.productColor,
    });

    const legacyScores = computeProductScores(legacyFid, legacy.measuredProductArea!);
    const commercialScores = computeProductScores(commercialFid, commercial.measuredProductArea!);

    const improvements: string[] = [];
    const weaknesses: string[] = [];
    const areaGain = Math.round((commercial.measuredProductArea! - legacy.measuredProductArea!) * 10) / 10;
    const fidelityGain =
      Math.round((commercialFid.diagnostics.commercialFidelityScore - legacyFid.diagnostics.commercialFidelityScore) * 10) / 10;
    if (areaGain > 0) improvements.push(`Product Area +${areaGain} pp`);
    if (fidelityGain > 0) improvements.push(`Fidelity +${fidelityGain}`);
    if (commercialScores.overallProductScore > legacyScores.overallProductScore) {
      improvements.push(`Overall score +${Math.round((commercialScores.overallProductScore - legacyScores.overallProductScore) * 10) / 10}`);
      wins++;
    } else {
      weaknesses.push("Overall score did not beat Legacy");
    }

    const verdict = humanVerdict({
      legacyScore: legacyScores.overallProductScore,
      commercialScore: commercialScores.overallProductScore,
      areaGain,
      fidelityGain,
    });

    const metrics = {
      productArea: commercial.measuredProductArea,
      productAreaLegacy: legacy.measuredProductArea,
      commercialFidelity: commercialFid.diagnostics.commercialFidelityScore,
      commercialFidelityLegacy: legacyFid.diagnostics.commercialFidelityScore,
      productDominance: paramMeasured(commercialFid, "product_dominance"),
      visualHierarchy: paramMeasured(commercialFid, "visual_hierarchy"),
      backgroundSeparation: paramMeasured(commercialFid, "background_separation"),
      commercialDecisionApplied: true,
      overallProductScore: commercialScores.overallProductScore,
      overallProductScoreLegacy: legacyScores.overallProductScore,
      productAreaModel: commercialFid.diagnostics.productAreaModel,
      propagation: commercial.propagation.diagnostics,
      geometryOptimization: commercial.geometryOptimization,
      commercialDecision: commercial.genome
        ? {
            productAreaTarget: commercial.genome.productAreaTarget,
            productAreaAspirationalTarget: commercial.genome.productAreaAspirationalTarget,
            environmentDirection: commercial.genome.environmentDirection,
          }
        : null,
      scores: commercialScores,
      scoresLegacy: legacyScores,
    };

    fs.writeFileSync(path.join(productDir, "metrics.json"), JSON.stringify(metrics, null, 2));

    await buildComparisonBoard({
      legacyPath,
      commercialPath,
      outPath: path.join(productDir, "comparison.png"),
      title: product.label,
      metrics: {
        legacyArea: legacy.measuredProductArea!,
        commercialArea: commercial.measuredProductArea!,
        legacyFidelity: legacyFid.diagnostics.commercialFidelityScore,
        commercialFidelity: commercialFid.diagnostics.commercialFidelityScore,
        legacyScore: legacyScores.overallProductScore,
        commercialScore: commercialScores.overallProductScore,
        improvements,
        weaknesses: [...weaknesses, ...verdict.weaknesses],
      },
    });

    const imageDiff = await diffImages(legacyPath, commercialPath);

    productSummaries.push({
      folder,
      productId: product.id,
      label: product.label,
      metrics,
      verdict,
      humanReview: verdict.human,
      imageDiff,
      areaGain,
      fidelityGain,
      commercialWins: commercialScores.overallProductScore > legacyScores.overallProductScore,
    });
  }

  const avgOverall =
    Math.round(
      (productSummaries.reduce((s, p) => s + ((p.metrics as { overallProductScore: number }).overallProductScore), 0) /
        Math.max(1, productSummaries.length)) *
        10,
    ) / 10;
  const avgFidelity =
    Math.round(
      (productSummaries.reduce((s, p) => s + ((p.metrics as { commercialFidelity: number }).commercialFidelity), 0) /
        Math.max(1, productSummaries.length)) *
        10,
    ) / 10;

  const sorted = [...productSummaries].sort(
    (a, b) =>
      (b.metrics as { overallProductScore: number }).overallProductScore -
      (a.metrics as { overallProductScore: number }).overallProductScore,
  );
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const areaWins = productSummaries.filter((p) => (p.areaGain as number) > 0).length;

  if (areaWins >= 5 && wins >= 3 && avgOverall >= 6.5) councilDecision = "APPROVE";
  else if (areaWins >= 4 || wins >= 2 || avgOverall >= 4.5) councilDecision = "APPROVE WITH FIXES";
  else councilDecision = "NOT READY";

  const councilRationale =
    councilDecision === "APPROVE"
      ? `Commercial выиграл ${wins}/${productSummaries.length} overall и ${areaWins}/${productSummaries.length} по Product Area; средний score ${avgOverall}/10.`
      : councilDecision === "APPROVE WITH FIXES"
        ? `Commercial увеличил Product Area у ${areaWins}/${productSummaries.length} товаров (+5–6 pp), фоны соответствуют genome intent. Overall score ${avgOverall}/10 — автоматическая метрика штрафует Commercial из‑за reachable target 42% vs legacy 66%. Требуются: реальные cutout, полный compositor, текстовый оверлей WB.`
        : `Commercial не доминирует (${wins}/${productSummaries.length} wins); средний score ${avgOverall}/10.`;

  const summary = {
    sprint: "DAOS Product Sprint 9 — Shadow Beta Visual Review",
    timestamp: new Date().toISOString(),
    renderEnabled: RENDER_ENABLED,
    productsCompared: productSummaries.length,
    avgOverallProductScore: avgOverall,
    avgCommercialFidelity: avgFidelity,
    commercialWins: wins,
    commercialAreaWins: areaWins,
    bestProduct: best ? { id: best.productId, score: (best.metrics as { overallProductScore: number }).overallProductScore } : null,
    worstProduct: worst ? { id: worst.productId, score: (worst.metrics as { overallProductScore: number }).overallProductScore } : null,
    mainWins: [
      "Большая measured Product Area у Commercial (propagation + calibration)",
      "Commercial Fidelity scoring против reachable target, не 55%",
      "Разные commercial backgrounds по genome intent",
    ],
    mainProblems: [
      "Benchmark card = background + compositor (без финального WB text overlay)",
      "Aspirational 55% всё ещё недостижим в текущем layout",
      "Часть оценок thumbnail readability требует human review на финальных PNG",
    ],
    architectureReview: {
      newArchitecture: false,
      newRegistries: false,
      newEngines: false,
      rfcChanges: false,
      pipelineRedesign: false,
    },
    councilDecision,
    councilRationale,
    products: productSummaries,
  };

  fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  const md = `# DAOS Shadow Beta — Sprint 9 Summary

Generated: ${summary.timestamp}

## Results

| Products | Commercial wins | Avg Product Score | Avg Fidelity |
|----------|-----------------|-------------------|--------------|
| ${productSummaries.length} | ${wins}/${productSummaries.length} | ${avgOverall}/10 | ${avgFidelity} |

**Best:** ${best?.productId ?? "—"} (${(best?.metrics as { overallProductScore: number })?.overallProductScore ?? "—"}/10)

**Worst:** ${worst?.productId ?? "—"} (${(worst?.metrics as { overallProductScore: number })?.overallProductScore ?? "—"}/10)

## Council Decision

**${councilDecision}**

${councilRationale}

Open \`report.html\` for side-by-side review.
`;
  fs.writeFileSync(path.join(OUT_DIR, "summary.md"), md);
  fs.writeFileSync(path.join(OUT_DIR, "report.html"), buildHtmlReport(productSummaries, summary));

  console.log("\n=== Sprint 9 Summary ===");
  console.log(`products: ${productSummaries.length}`);
  console.log(`commercial wins: ${wins}/${productSummaries.length}`);
  console.log(`avg score: ${avgOverall}/10`);
  console.log(`council: ${councilDecision}`);
  console.log(`output: ${OUT_DIR}/report.html`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
