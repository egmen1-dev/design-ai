import { z } from "zod";
import {
  filterConsistentBullets,
} from "@/lib/bullet-consistency";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import { normalizeMarketplacePalette } from "@/lib/accent-color";
import type { InfographicSdInput } from "@/lib/validations";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const designBriefSchema = z.object({
  designConcept: z.string().max(300).optional(),
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
  const headline = brief.headline ?? brief.title ?? "Товар";
  const sub = brief.subHeadline ?? brief.subtitle ?? "новинка";
  const rawBullets =
    brief.bullets ??
    brief.benefits ??
    brief.blocks?.map((b) => (b.value ? `${b.value} ${b.label}` : b.label)) ??
    ["Премиум качество", "Быстрая доставка"];

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
    bullets: bullets.slice(0, 5),
    colors: colors.slice(0, 5),
    badge: brief.badge ?? "Brand",
    backgroundPrompt: brief.backgroundPrompt,
    fontId: brief.fontId ?? null,
    badgeId: brief.badgeId ?? null,
  };
}
