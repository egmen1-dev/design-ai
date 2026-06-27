import type { ProductCategory } from "@/lib/product-analysis";
import type {
  DesignGenomeRecord,
  GenomeIntelligenceContext,
  StoryBlueprint,
  CommercialPhotographyBlueprint,
} from "./types";
import { buildDesignGenome, genomeToDnaOverride, resolveGenomeCategory } from "./GenomeBuilder";
import { loadTopGenomes, ensureSeedGenomes, persistGenome } from "./GenomeDatabase";
import { selectGenomeCandidates, pickBestGenome } from "./GenomeSelector";
import { mutateGenome } from "./GenomeMutator";
import { validateGenome } from "./GenomeValidator";
import { genomeCompositeScore } from "./GenomeRanking";

export function buildStoryBlueprintFromGenome(genome: DesignGenomeRecord): StoryBlueprint {
  return {
    customerIntent: genome.story.customerIntent,
    problem: genome.story.problem,
    solution: genome.story.solution,
    emotion: genome.story.emotion,
    marketingHook: genome.story.marketingHook,
    heroConcept: genome.story.heroConcept,
    sceneNarrative: genome.scene.narrative,
    buyerMotivation: genome.story.buyerMotivation,
    compositionScenarioId: genome.composition.compositionType,
    agentSnippet: `история: ${genome.story.heroConcept}; intent: ${genome.story.customerIntent}`,
  };
}

export function buildPhotoBlueprintFromGenome(genome: DesignGenomeRecord): CommercialPhotographyBlueprint {
  return {
    sceneType: genome.scene.indoorOutdoor,
    location: genome.scene.environment,
    floorMaterial: genome.scene.indoorOutdoor === "outdoor" ? "natural ground" : "polished studio floor",
    wallMaterial: genome.scene.indoorOutdoor === "outdoor" ? "open sky bokeh" : "seamless backdrop",
    lightSource: genome.light.keyLight,
    colorTemperature: genome.light.temperature,
    rimLight: genome.light.rimLight,
    contactShadow: genome.light.shadowSoftness === "defined" ? "defined contact" : "soft contact",
    reflections: genome.light.reflection ? "subtle product reflection" : "matte surface",
    depthOfField: genome.composition.backgroundDepth,
    atmosphere: genome.light.ambient,
    qualityTarget: "Behance commercial photography 95+",
    backgroundNarrative: genome.scene.narrative,
    scenePatch: {
      cameraAngle: genome.camera.cameraAngle,
      cameraHeight: genome.camera.cameraHeight,
      cameraDistance: genome.camera.distance,
      lightingDirection: genome.light.keyLight,
      lightingTemperature: genome.light.temperature,
      backgroundType: genome.scene.environment,
      depthOfField: genome.composition.backgroundDepth,
      visualMood: genome.light.ambient,
      colorHarmony: genome.palette.emotion,
      shadowProfile: genome.light.shadowSoftness === "defined" ? "contact" : "ambient",
    },
    agentSnippet: `камера ${genome.camera.lens} ${genome.camera.cameraAngle}, свет ${genome.light.temperature}`,
  };
}

export function buildGenomePromptBlock(genome: DesignGenomeRecord): string {
  return [
    "DESIGN GENOME — успешная комбинация элементов (не отдельные ассеты):",
    `Category: ${genome.knowledgeCategory}`,
    `Customer Intent: ${genome.story.customerIntent}`,
    `Hero Concept: ${genome.story.heroConcept}`,
    `Scene: ${genome.scene.narrative}`,
    `Camera: ${genome.camera.cameraAngle} / ${genome.camera.lens}`,
    `Lighting: ${genome.light.temperature} + ${genome.light.keyLight}`,
    `Composition: ${genome.composition.layoutTemplate} · product ${genome.composition.productScalePct}% · air ${genome.composition.negativeSpacePct}%`,
    `Typography: ${genome.typography.fontFamily} ${genome.typography.fontWeight}`,
    `Badge: ${genome.badge.style} r${genome.badge.radius}`,
    `Palette: ${genome.palette.name} (${genome.palette.primary} / ${genome.palette.accent})`,
    `Genome Score: ${Math.round(genomeCompositeScore(genome.rankings))}`,
    "",
    "Строй коммерческую историю, а не «фон + текст + товар».",
  ].join("\n");
}

export async function retrieveGenomeIntelligence(
  prompt: string,
  productCategory: ProductCategory,
  seed: string,
  hints?: {
    customerIntent?: string;
    heroConcept?: string;
    sceneNarrative?: string;
    marketSnippet?: string;
    assetsSnippet?: string;
  },
): Promise<GenomeIntelligenceContext> {
  const category = resolveGenomeCategory(prompt, productCategory);
  await ensureSeedGenomes(category).catch((e) =>
    console.warn("[design-genome] seed skipped:", e),
  );

  const pool = await loadTopGenomes(category);
  const fallback = buildDesignGenome({
    prompt,
    productCategory,
    knowledgeCategory: category,
    customerIntent: hints?.customerIntent,
    heroConcept: hints?.heroConcept,
    sceneNarrative: hints?.sceneNarrative,
  });

  const candidates = selectGenomeCandidates({
    category,
    customerIntent: fallback.story.customerIntent,
    heroConcept: fallback.story.heroConcept,
    indoorOutdoor: fallback.scene.indoorOutdoor,
    productScalePct: fallback.composition.productScalePct,
    pool: pool.length > 0 ? pool : [fallback],
    seed,
  });

  const selected = pickBestGenome(candidates) ?? fallback;
  const mutated = mutateGenome(selected, seed);
  const validation = validateGenome(mutated);
  if (!validation.valid) {
    console.warn("[design-genome] validation:", validation.issues);
  }

  const storyBlueprint = buildStoryBlueprintFromGenome(mutated);
  const photoBlueprint = buildPhotoBlueprintFromGenome(mutated);
  const promptBlock = [
    buildGenomePromptBlock(mutated),
    hints?.marketSnippet ? `\nMarket: ${hints.marketSnippet}` : "",
    hints?.assetsSnippet ? `\nAssets: ${hints.assetsSnippet}` : "",
  ].join("\n");

  return {
    category,
    promptBlock,
    agentSnippet: `${storyBlueprint.agentSnippet} | ${photoBlueprint.agentSnippet}`,
    selectedGenome: selected,
    mutatedGenome: mutated,
    storyBlueprint,
    photoBlueprint,
    mixSources: candidates.slice(0, 3).map((g) => g.genomeKey),
  };
}

export async function saveGenerationGenome(
  genome: DesignGenomeRecord,
  successful: boolean,
): Promise<void> {
  if (!successful) return;
  const v = validateGenome(genome);
  if (v.score < 60) return;
  await persistGenome(genome, "generated");
}

export { genomeToDnaOverride };
