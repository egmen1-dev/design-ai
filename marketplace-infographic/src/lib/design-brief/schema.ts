import { z } from "zod";
import {
  filterConsistentBullets,
} from "@/lib/bullet-consistency";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import { normalizeMarketplacePalette } from "@/lib/accent-color";
import { extractProductSubtitle, extractProductTitle } from "@/lib/title-extract";
import type { InfographicSdInput } from "@/lib/validations";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const creativeConceptSchema = z.object({
  title: z.string().max(80),
  mainIdea: z.string().max(200),
  visualHook: z.string().max(300),
  emotion: z.string().max(80),
  marketingGoal: z.string().max(120),
  reason: z.string().max(300),
  targetAudience: z.string().max(120).optional(),
  toneOfVoice: z.string().max(80).optional(),
  styleKeywords: z.array(z.string().max(30)).max(8).optional(),
  whatToSayInOneSecond: z.string().max(80).optional(),
});

const oneThoughtSchema = z.object({
  question: z.string().max(100),
  answer: z.string().max(20),
  answerLabel: z.string().max(40),
  headline: z.string().max(60),
  badge: z.string().max(24).optional(),
  deferredSpecs: z.array(z.string().max(80)).max(6),
});

const visualHookSchema = z.object({
  type: z.string(),
  reason: z.string().max(300),
  confidence: z.number().min(0).max(100),
});

const designProcessSchema = z
  .object({
    stage1: z
      .object({
        category: z.string().optional(),
        dimensions: z.string().optional(),
        shape: z.string().optional(),
        materials: z.array(z.string()).optional(),
        color: z.string().optional(),
        purpose: z.string().optional(),
        priceSegment: z.string().optional(),
        emotionalPerception: z.string().optional(),
        targetAudience: z.string().optional(),
      })
      .optional(),
    visualHook: visualHookSchema.optional(),
    stage2: z
      .object({
        concept: z.string().optional(),
        creativeDirection: z.string().optional(),
        mood: z.string().optional(),
        references: z.array(z.string()).optional(),
        whyThisConcept: z.string().optional(),
      })
      .optional(),
    stage3: z
      .object({
        mainSubject: z.string().optional(),
        eyeFlow: z.string().optional(),
        textPlacement: z.string().optional(),
        plaquePlacement: z.string().optional(),
        negativeSpace: z.string().optional(),
        balance: z.string().optional(),
        depth: z.string().optional(),
        perspective: z.string().optional(),
      })
      .optional(),
    stage4: z
      .object({
        fontStyle: z.string().optional(),
        weight: z.string().optional(),
        sizeStrategy: z.string().optional(),
        spacing: z.string().optional(),
        textColor: z.string().optional(),
        contrastLevel: z.string().optional(),
        accents: z.string().optional(),
        rationale: z.string().optional(),
      })
      .optional(),
    stage5: z
      .object({
        primary: z.string().optional(),
        secondary: z.string().optional(),
        accent: z.string().optional(),
        background: z.string().optional(),
        textColor: z.string().optional(),
        plaqueColor: z.string().optional(),
        contrastLevel: z.string().optional(),
        systemRationale: z.string().optional(),
      })
      .optional(),
    stage6: z
      .object({
        useDecorations: z.boolean().optional(),
        elements: z.array(z.string()).optional(),
        rationale: z.string().optional(),
      })
      .optional(),
    stage7: z
      .object({
        visualBalance: z.number().optional(),
        readability: z.number().optional(),
        professionalism: z.number().optional(),
        categoryFit: z.number().optional(),
        premiumFeel: z.number().optional(),
        conversionPotential: z.number().optional(),
        overallScore: z.number().optional(),
        revisions: z.array(z.string()).optional(),
      })
      .optional(),
  })
  .optional();

export const designBriefSchema = z.object({
  designConcept: z.string().max(300).optional(),
  creativeConcept: creativeConceptSchema.optional(),
  oneThought: oneThoughtSchema.optional(),
  sceneNarrative: z.string().max(400).optional(),
  compositionScenarioId: z.string().max(40).optional(),
  deferredBullets: z.array(z.string().max(80)).max(6).optional(),
  designProcess: designProcessSchema.optional(),
  visualHook: visualHookSchema.optional(),
  audienceAnalysis: z
    .object({
      category: z.string().optional(),
      priceSegment: z.string().optional(),
      audienceGender: z.string().optional(),
      useCases: z.array(z.string()).optional(),
      painPoints: z.array(z.string()).optional(),
      emotionalTriggers: z.array(z.string()).optional(),
    })
    .optional(),
  marketingStrategy: z.string().max(400).optional(),
  composition: z
    .object({
      rule: z.string().optional(),
      focusPoint: z.string().optional(),
      visualFlow: z.string().optional(),
    })
    .optional(),
  layout: z.enum(["hero", "cards", "split", "minimal", "marketplace"]).default("marketplace"),
  grid: z.string().optional(),
  visualHierarchy: z.array(z.string()).max(6).optional(),
  cameraAngle: z.string().optional(),
  perspective: z.string().optional(),
  objectScale: z.number().min(0.3).max(0.9).optional(),
  lightDirection: z.string().optional(),
  lightTemperature: z.string().optional(),
  shadowType: z.string().optional(),
  reflection: z.boolean().optional(),
  backgroundStyle: z.string().optional(),
  backgroundPrompt: z.string().min(10).max(500),
  depthLayers: z.array(z.string()).max(5).optional(),
  colorPalette: z.array(hex).min(2).max(6).optional(),
  colors: z.array(hex).min(2).max(6).optional(),
  contrast: z.string().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.string().optional(),
  fontPair: z.string().optional(),
  fontReason: z.string().optional(),
  fontId: z.string().uuid().nullable().optional(),
  badgeStyle: z.string().optional(),
  badgeReason: z.string().optional(),
  badgeId: z.string().uuid().nullable().optional(),
  iconStyle: z.string().optional(),
  texture: z.string().optional(),
  material: z.string().optional(),
  glassEffects: z.boolean().optional(),
  gradients: z.boolean().optional(),
  decorations: z.array(z.string()).max(5).optional(),
  callToAction: z.string().max(80).optional(),
  headline: z.string().min(1).max(60).optional(),
  title: z.string().min(1).max(60).optional(),
  subHeadline: z.string().max(80).optional(),
  subtitle: z.string().max(80).optional(),
  benefits: z.array(z.string().max(80)).max(6).optional(),
  bullets: z.array(z.string().max(80)).max(6).optional(),
  blocks: z
    .array(
      z.object({
        zone: z.enum(["left", "right", "bottom", "gift"]).optional(),
        value: z.string().optional(),
        label: z.string().max(80),
      }),
    )
    .max(8)
    .optional(),
  badge: z.string().max(40).optional(),
  negativePrompt: z.string().max(300).optional(),
  qualityChecklist: z.array(z.string()).max(12).optional(),
  appliedStyle: z.string().optional(),
});

export type DesignBrief = z.infer<typeof designBriefSchema>;

export type CompositingHints = {
  lightDirection: string;
  lightTemperature: number;
  shadowType: string;
  reflection: boolean;
  objectScale: number;
};

export function briefToCompositingHints(brief: DesignBrief): CompositingHints {
  const tempMatch = brief.lightTemperature?.match(/(\d{4})/);
  return {
    lightDirection: brief.lightDirection ?? "top-left",
    lightTemperature: tempMatch ? Number(tempMatch[1]) : 5500,
    shadowType: brief.shadowType ?? "contact-soft",
    reflection: brief.reflection ?? false,
    objectScale: brief.objectScale ?? 0.58,
  };
}

export function briefToSdInput(brief: DesignBrief, productContext = ""): InfographicSdInput {
  const posterHeadline =
    brief.oneThought?.headline ?? brief.headline ?? brief.title ?? "Товар";
  const posterBadge = brief.oneThought?.badge ?? brief.subHeadline ?? brief.subtitle ?? "новинка";
  const heroBullet = brief.oneThought
    ? `${brief.oneThought.answer} ${brief.oneThought.answerLabel}`.trim()
    : undefined;

  const headline = extractProductTitle(productContext, posterHeadline);
  const sub = extractProductSubtitle(productContext, posterBadge);
  const rawBullets = heroBullet
    ? [heroBullet, ...(brief.deferredBullets ?? brief.oneThought?.deferredSpecs ?? [])]
    : (brief.bullets ??
      brief.benefits ??
      brief.blocks?.map((b) => (b.value ? `${b.value} ${b.label}` : b.label)) ??
      ["Премиум качество"]);

  const analysis = analyzeProductPrompt(`${productContext} ${headline} ${sub}`);
  const bullets = filterConsistentBullets(rawBullets, productContext, sub);

  const colors = normalizeMarketplacePalette(
    brief.colorPalette ?? brief.colors ?? ["#00a8b5", "#ffffff", "#0f172a"],
    analysis.category,
  );

  return {
    layout: brief.layout ?? "marketplace",
    title: headline,
    subtitle: sub,
    bullets: bullets.slice(0, 1),
    deferredBullets: bullets.slice(1, 6),
    colors: colors.slice(0, 5),
    badge: brief.badge ?? "Brand",
    backgroundPrompt: brief.backgroundPrompt,
    fontId: brief.fontId ?? null,
    badgeId: brief.badgeId ?? null,
    creativeHeadline: posterHeadline,
    heroMetric: brief.oneThought
      ? { value: brief.oneThought.answer, label: brief.oneThought.answerLabel }
      : undefined,
  };
}
