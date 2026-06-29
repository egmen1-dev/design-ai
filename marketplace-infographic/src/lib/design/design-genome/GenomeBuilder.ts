import type { DesignDNA } from "@/lib/design/types";
import { generateDesignDNA } from "@/lib/design/dna";
import type { InfographicStyle } from "@/lib/design-trends";
import { resolveKnowledgeCategory } from "@/lib/design/knowledge-engine";
import type {
  DesignGenomeRecord,
  GenomeBadgeSection,
  GenomeBuildInput,
  GenomePaletteSection,
  GenomeRankings,
} from "./types";
import { GENOME_VERSION } from "./types";

function genomeKey(input: {
  category: string;
  customerIntent: string;
  heroConcept: string;
  layoutTemplate: string;
}): string {
  const raw = [input.category, input.customerIntent, input.heroConcept, input.layoutTemplate]
    .join("|")
    .toLowerCase()
    .replace(/[^a-z0-9|]+/g, "_")
    .slice(0, 180);
  return `genome_${raw}`;
}

function inferCustomerIntent(prompt: string, category: string): string {
  if (/резерв|backup|автоном|без света/i.test(prompt)) return "backup_electricity";
  if (/сад|огород|участ/i.test(prompt)) return "garden_productivity";
  if (/дом|квартир|уют/i.test(prompt)) return "home_comfort";
  if (/премиум|luxury|элит/i.test(prompt)) return "premium_lifestyle";
  return `${category}_purchase`;
}

function inferHeroConcept(prompt: string, narrative?: string): string {
  if (narrative && narrative.length > 12) return narrative.slice(0, 120);
  if (/генератор|generator/i.test(prompt)) return "House remains with electricity";
  if (/крем|cosmetic/i.test(prompt)) return "Confidence through daily ritual";
  return "Product solves the buyer problem instantly";
}

export function buildDesignGenome(input: GenomeBuildInput): DesignGenomeRecord {
  const customerIntent = input.customerIntent ?? input.story?.customerIntent ?? inferCustomerIntent(input.prompt, input.productCategory);
  const heroConcept = input.heroConcept ?? input.story?.heroConcept ?? inferHeroConcept(input.prompt, input.sceneNarrative);
  const layoutTemplate = input.compositionTemplate ?? "hero_right";
  const dna = input.dna ?? generateDesignDNA(input.productCategory, `genome-${input.prompt.slice(0, 24)}`);
  const scene = input.scenePlan;
  const productScale = input.productScalePct ?? (scene ? 68 : 65);
  const negativeSpace = input.negativeSpacePct ?? 21;

  const palette: GenomePaletteSection = input.palette ?? {
    name: "marketplace_default",
    primary: "#1e3a5f",
    secondary: "#f97316",
    accent: "#2563eb",
    background: "#f8fafc",
    contrast: 4.5,
    emotion: input.story?.emotion ?? "trust",
  };

  const badge: GenomeBadgeSection = input.badge ?? {
    style: "glass",
    radius: 18,
    paddingX: 24,
    paddingY: 14,
    border: "soft",
    gradient: "blue",
    opacity: 92,
    shadow: "soft",
    icon: "star",
  };

  const rankings: GenomeRankings = {
    marketplaceScore: input.ctrScore ?? 75,
    professionalScore: input.seniorAdScore ?? input.designScore ?? 72,
    commercialScore: input.photoScore ?? 70,
    readability: input.ctrScore ?? 78,
    ctrPrediction: input.ctrPrediction ?? 0.12,
    visualImpact: dna.visualEnergy,
    originality: Math.min(100, 55 + dna.contrast * 0.3),
    trendScore: 68,
    reuseScore: 0.5,
  };

  const key = genomeKey({
    category: input.knowledgeCategory,
    customerIntent,
    heroConcept,
    layoutTemplate,
  });

  return {
    version: GENOME_VERSION,
    genomeKey: key,
    knowledgeCategory: input.knowledgeCategory,
    product: {
      category: input.productCategory,
      subcategory: input.productCategory,
      weight: "medium",
      shape: input.productVisual?.shape ?? "standard",
      aspectRatio: input.productVisual?.aspectRatio ?? 1,
      visualComplexity: Math.round((dna.decorDensity + dna.textDensity) / 2),
      dominantColor: input.productVisual?.dominantColors?.[0] ?? palette.primary,
    },
    story: {
      problem: input.story?.problem ?? "Buyer needs a reliable solution",
      solution: input.story?.solution ?? heroConcept,
      emotion: input.story?.emotion ?? "confidence",
      marketingHook: input.story?.marketingHook ?? input.prompt.slice(0, 80),
      customerIntent,
      buyerMotivation: input.story?.buyerMotivation ?? "solve problem quickly",
      heroConcept,
    },
    scene: {
      environment: scene?.backgroundType ?? "studio",
      timeOfDay: /evening|закат/i.test(input.sceneNarrative ?? "") ? "evening" : "day",
      weather: "clear",
      season: "all",
      indoorOutdoor:
        scene?.coverConceptId === "garden_scene" ||
        scene?.coverConceptId === "outdoor_lifestyle"
          ? "outdoor"
          : scene?.coverConceptId === "home_interior"
            ? "indoor"
            : "studio",
      premiumScore: dna.luxury,
      narrative: input.sceneNarrative ?? heroConcept,
    },
    camera: {
      cameraAngle: scene?.cameraAngle ?? "low-angle hero",
      cameraHeight: scene?.cameraHeight ?? "waist-level",
      lens: "35mm",
      distance: scene?.cameraDistance ?? "medium-close",
      perspective: "natural",
      heroAngle: scene?.cameraAngle ?? "three-quarter",
    },
    light: {
      keyLight: scene?.lightingDirection ?? "front-left 45°",
      fillLight: "soft ambient",
      rimLight: dna.lightingDrama > 60 ? "subtle rim" : "minimal",
      ambient: scene?.visualMood ?? "commercial",
      temperature: scene?.lightingTemperature ?? "5200K neutral-warm",
      shadowSoftness: scene?.shadowProfile === "contact" ? "defined" : "soft",
      reflection: scene?.reflectionEnabled ?? true,
      volumetricLight: dna.depth > 65,
    },
    composition: {
      compositionType: scene?.compositionScenario ?? "hero_product",
      layoutTemplate,
      heroPosition: layoutTemplate.includes("right") ? "right" : "left",
      negativeSpacePct: negativeSpace,
      readingFlow: "Z-pattern",
      visualHierarchy: "product-first",
      ruleOfThirds: true,
      goldenRatio: dna.symmetry > 55,
      foregroundDepth: "shallow",
      backgroundDepth: scene?.depthOfField ?? "bokeh",
      focus: "product sharp",
      productScalePct: productScale,
    },
    typography: {
      fontFamily: input.fontFamily ?? "Montserrat",
      fontWeight: dna.typographyWeight > 60 ? "Bold" : "SemiBold",
      fontScale: 1,
      tracking: "normal",
      lineHeight: 1.15,
      contrast: dna.contrast,
    },
    badge,
    palette,
    marketplace: {
      ctrPrediction: input.ctrPrediction ?? 0.12,
      readability: rankings.readability,
      attentionScore: rankings.visualImpact,
      visualBalance: dna.symmetry,
      professionalScore: rankings.professionalScore,
    },
    dna,
    rankings,
  };
}

export function genomeToDnaOverride(genome: DesignGenomeRecord): Partial<DesignDNA> {
  return {
    productDominance: genome.composition.productScalePct,
    negativeSpace: genome.composition.negativeSpacePct,
    visualEnergy: genome.rankings.visualImpact,
    luxury: genome.scene.premiumScore,
    contrast: genome.typography.contrast,
    typographyWeight: genome.typography.fontWeight.includes("Bold") ? 75 : 55,
    depth: genome.light.volumetricLight ? 78 : 55,
    lightingDrama: genome.light.rimLight.includes("rim") ? 70 : 45,
    colorMood: 62,
    minimalism: 100 - genome.product.visualComplexity,
    decorDensity: genome.product.visualComplexity,
    textDensity: 28,
    symmetry: genome.marketplace.visualBalance,
  };
}

export function resolveGenomeCategory(prompt: string, productCategory: import("@/lib/product-analysis").ProductCategory) {
  return resolveKnowledgeCategory(prompt, productCategory);
}
