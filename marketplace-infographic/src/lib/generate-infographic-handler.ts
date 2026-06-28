import { readFile } from "fs/promises";
import path from "path";
import { consumeGenerationSlot } from "@/lib/credits";
import { resolveLibraryAssets } from "@/lib/design-library";
import { generateSdInfographicData, type OllamaSdContext } from "@/lib/ollama-sd";
import {
  backgroundToDataUrl,
  buildFallbackGradient,
  generateBackground,
} from "@/lib/stable-diffusion";
import { renderInfographicHtml } from "@/lib/infographic-template";
import { sdDataToInfographic } from "@/lib/sd-to-infographic";
import { packSdPayload, unpackSdPayload } from "@/lib/sd-stored-payload";
import { DEFAULT_STYLE, TRENDS, type InfographicStyle } from "@/lib/design-trends";
import { renderHtmlToImage } from "@/lib/puppeteer";
import { bufferToDataUrl } from "@/lib/background-removal";
import {
  parseProductImageDataUrl,
  processProductImageForCover,
  processProductImageForGeneration,
} from "@/lib/product-image-sd";
import type { CompositingHints, DesignBrief } from "@/lib/design-brief/schema";
import { briefToSdInput } from "@/lib/design-brief/schema";
import type { InfographicSdInput } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import {
  resolveReferenceContext,
  type ResolvedReferenceContext,
} from "@/lib/reference-style-resolver";
import { mergedToDataUrl } from "@/lib/image-compositor";
import { compositeProductIntoScene } from "@/lib/compositing/scene-compositor";
import { analyzeProductVisual } from "@/lib/compositing/product-visual-analysis";
import { resolveMarketplaceAccent } from "@/lib/accent-color";
import {
  planScene,
  compileSceneRenderingPrompt,
  validateQuality,
  QUALITY_PASS_THRESHOLD,
  retrieveKnowledgeContext,
  collectGenerationPattern,
  preloadKnowledgeAnalysis,
  retrieveMarketIntelligence,
  buildCombinedMarketPromptBlock,
  computeNoveltyScore,
  retrieveAssetsIntelligence,
  renderIntelligentBadge,
  recordAssetSuccess,
  paletteColorsForSd,
  retrieveGenomeIntelligence,
  saveGenerationGenome,
  extractGenomeFromGeneration,
  genomeToDnaOverride,
  retrieveTrendIntelligence,
  runSceneDirector,
  runCompositionDirector,
  validateSceneBlueprint,
  validateLayoutSpec,
  validateCompiledPromptStage,
  validateRenderedCritique,
  applyConstitutionLayoutPatch,
  formatConstitutionReport,
  type ConstitutionReport,
} from "@/lib/design";
import type { SceneDirectorResult } from "@/lib/design/scene-blueprint";
import type { CompositionDirectorResult } from "@/lib/design/composition-director";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type { KnowledgeCategory } from "@/lib/design/knowledge-engine";
import type { MarketIntelligenceContext } from "@/lib/design/market-intelligence";
import type { AssetsIntelligenceContext } from "@/lib/design/design-assets-intelligence";
import type { GenomeIntelligenceContext } from "@/lib/design/design-genome";
import type { TrendIntelligenceContext } from "@/lib/design/trend-intelligence";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import type { CompositionResult } from "@/lib/design/types";
import {
  computeProfessionalLayout,
  toCompositionResult,
} from "@/lib/layout-engine";
import type { CardMeaning, LayoutTemplateId, ProductShapeHint } from "@/lib/layout-engine/types";
import { runSeniorArtDirector, runMarketplaceCtrExpert, runCommercialPhotographer, runChiefDesignDirector, runDesignMemory, loadDesignMemoryStore, deriveFixApplicationHints, computeOutcomeScore, runVisualStoryDirector, runCommercialPhotoDirector, runArtDirector, type SeniorArtDirectorReview, type MarketplaceCtrReview, type CommercialPhotographerReview, type ChiefDesignDirectorPlan, type DesignMemoryUpdateResult, type VisualStoryDirectorResult, type CommercialPhotoDirectorResult, type ArtDirectorReview } from "@/lib/agents";
import { creativeConceptToCardMeaning } from "@/lib/design-process/card-meaning";
import type { ProductVisualProfile } from "@/lib/design/scene-planner";
import type { CreativeDirectorResult } from "@/lib/design-process/creative-concept";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { QualityValidationResult } from "@/lib/design/quality-validator";
import type { ArtDirectorModeId } from "@/lib/design-process/art-director-modes";
import type { FeedbackLearningSnapshot } from "@/lib/feedback/types";
import { PIPELINE_VERSION } from "@/lib/pipeline-version";
import {
  USE_RENDER_ENGINE_V17,
  runRenderEngine,
  type RenderEngineOrchestratorResult,
} from "@/lib/render-engine";
import { USE_FAST_CUTOUT, MAX_CONCEPT_RENDER_RETRIES, MAX_QUALITY_REFINEMENT_PASSES, MAX_PHOTO_BG_RETRIES, MAX_CHIEF_FIX_RETRIES } from "@/lib/pipeline-config";
import {
  buildInitialLayoutSpec,
  layoutSpecToTemplatePreference,
  simplifyCardMeaningForSpec,
  type LayoutSpec,
} from "@/lib/design/layout-spec";
import { runQualityGate, applyRefinementPatch, type QualityGateResult } from "@/lib/design/quality-v165";
import type { CoverConceptId } from "@/lib/cover-concepts";
import { evaluateFinalQuality } from "@/lib/design/final-quality-validator";
import { applyPosterRules } from "@/lib/design-process/pipeline";

export type GenerateInfographicInput = {
  userId: string;
  prompt: string;
  productImage?: string;
  style?: InfographicStyle;
  regenerateBackgroundOnly?: boolean;
  existingImageId?: string;
  backgroundSeed?: string;
  ollamaContext?: OllamaSdContext;
  coverConcept?: CoverConceptId;
  artDirectorMode?: ArtDirectorModeId;
};

export type GenerateInfographicResult = {
  id: string;
  imagePath: string;
  backgroundUrl: string | null;
  freeRemaining: number;
  credits: number;
  unlimited: boolean;
  aiSource: string;
  backgroundSource: "sd" | "fallback" | "provider";
  appliedStyle?: InfographicStyle;
  designConcept?: string;
  creativeMainIdea?: string;
  oneThoughtHeadline?: string;
  visualHook?: { type: string; reason: string; confidence?: number };
  pipelineVersion: string;
  qualityScore?: number;
  selectedArchetypeId?: string;
  conceptCandidates?: number;
  layoutTemplateId?: string;
  designScore?: number;
  seniorAdScore?: number;
  seniorAdApproved?: boolean;
  ctrScore?: number;
  ctrPrediction?: number;
  wouldClick?: boolean;
  photoScore?: number;
  photoRealism?: number;
  looksLikePhoto?: boolean;
  chiefApproved?: boolean;
  estimatedScoreAfterFix?: number;
  designMemoryUpdate?: boolean;
  designMemoryAdvice?: string[];
  knowledgeCategory?: string;
  knowledgePatternsUsed?: number;
  knowledgeAnalysisTriggered?: boolean;
  marketIntelligenceVersion?: number;
  marketProductsAnalyzed?: number;
  marketNoveltyScore?: number;
  assetsIntelligenceActive?: boolean;
  parametricBadgeStyle?: string;
  designGenomeKey?: string;
  storyHeroConcept?: string;
  trendIntelligenceScore?: number;
  luxuryScore?: number;
  qualityRefinementPasses?: number;
  sceneQualityScore?: number;
  sceneType?: string;
  compositionQualityScore?: number;
  compositionTemplate?: string;
  renderingProfile?: string;
  negativePrompt?: string;
  readabilityScore?: number;
  promptComplexityScore?: number;
  promptCompilerApproved?: boolean;
  promptCompilerAttempts?: number;
  overallDesignScore?: number;
  constitutionPassed?: boolean;
  constitutionVersion?: string;
  renderEngineVersion?: string;
  renderProvider?: string;
  renderModel?: string;
  renderAttempts?: number;
  renderDesignScore?: number;
};

function briefMeta(brief?: DesignBrief) {
  const hook = brief?.designProcess?.visualHook ?? brief?.visualHook;
  return {
    designConcept: brief?.creativeConcept?.title ?? brief?.designConcept ?? brief?.designProcess?.stage2?.concept,
    creativeMainIdea: brief?.creativeConcept?.mainIdea,
    oneThoughtHeadline: brief?.oneThought?.headline,
    selectedArchetypeId: brief?.selectedArchetypeId,
    conceptCandidates: brief?.conceptRenderQueue?.length,
    visualHook: hook
      ? { type: hook.type, reason: brief?.creativeConcept?.visualHook ?? hook.reason, confidence: hook.confidence }
      : brief?.creativeConcept
        ? { type: "creative_story", reason: brief.creativeConcept.visualHook, confidence: 92 }
        : undefined,
  };
}

function creativeFromBrief(brief?: DesignBrief): CreativeDirectorResult | undefined {
  if (!brief?.creativeConcept || !brief.oneThought) return undefined;
  const cc = brief.creativeConcept;
  return {
    creativeConcept: {
      title: cc.title,
      mainIdea: cc.mainIdea,
      visualHook: cc.visualHook,
      emotion: cc.emotion,
      marketingGoal: cc.marketingGoal,
      reason: cc.reason,
      targetAudience: cc.targetAudience ?? "покупатели маркетплейса",
      toneOfVoice: cc.toneOfVoice ?? "уверенный",
      styleKeywords: cc.styleKeywords ?? [],
      whatToSayInOneSecond: cc.whatToSayInOneSecond ?? cc.title,
    },
    oneThought: brief.oneThought,
    sceneNarrative: brief.sceneNarrative ?? brief.backgroundPrompt?.slice(0, 400) ?? "",
    compositionScenarioId: brief.compositionScenarioId as CreativeDirectorResult["compositionScenarioId"],
    archetypeId: brief.selectedArchetypeId as CreativeDirectorResult["archetypeId"],
  };
}

function sceneToCompositingHints(scene: ScenePlan, objectScale: number): CompositingHints {
  return {
    lightDirection: scene.lightingDirection,
    lightTemperature: Number(scene.lightingTemperature.replace(/\D/g, "")) || 5500,
    shadowType:
      scene.shadowProfile === "ambient"
        ? "ambient-soft"
        : scene.shadowProfile === "contact"
          ? "contact-hard"
          : "contact-soft",
    reflection: scene.reflectionEnabled,
    objectScale,
  };
}

function toProductShapeHint(visual?: ProductVisualProfile): ProductShapeHint {
  if (!visual) return "standard";
  if (visual.shape === "wide") return "wide";
  if (visual.shape === "tall") return "tall";
  return "standard";
}

function layoutObjectScale(areaPct?: number): number {
  const pct = areaPct ?? 65;
  return Math.min(0.75, Math.max(0.55, pct / 100));
}

function normalizeCardMeaning(
  partial: DesignBrief["cardMeaning"] | CardMeaning,
): CardMeaning {
  return {
    title: partial?.title ?? "Товар",
    subtitle: partial?.subtitle ?? "",
    feature: partial?.feature ?? "",
    badge: partial?.badge ?? "",
    emotion: partial?.emotion ?? "Надёжность",
    style: partial?.style ?? "Premium Lifestyle",
    priority: partial?.priority ?? "product",
  };
}

function buildProfessionalComposition(input: {
  designBrief?: DesignBrief;
  activeCreative?: CreativeDirectorResult;
  category: import("@/lib/product-analysis").ProductCategory;
  productVisual?: ProductVisualProfile;
  seed: string;
  excludeTemplateIds?: LayoutTemplateId[];
  templateId?: LayoutTemplateId;
  knowledgeCategory?: KnowledgeCategory;
  genomeTemplateId?: LayoutTemplateId;
  genomeDnaOverride?: Partial<import("@/lib/design/types").DesignDNA>;
  layoutSpec?: LayoutSpec;
}): {
  compositionResult: CompositionResult;
  cardMeaning: CardMeaning;
  headlineFontPx: number;
  templateId: LayoutTemplateId;
} {
  const rawMeaning = normalizeCardMeaning(
    input.designBrief?.cardMeaning ??
      (input.activeCreative && input.designBrief
        ? creativeConceptToCardMeaning(input.activeCreative, input.designBrief)
        : {
            title: input.designBrief?.headline ?? "Товар",
            subtitle: input.designBrief?.subtitle ?? "",
            feature: input.designBrief?.subHeadline ?? "",
            badge: input.designBrief?.badge ?? "",
            emotion: "Надёжность",
            style: "Premium Lifestyle",
            priority: "product" as const,
          }),
  );
  const cardMeaning = input.layoutSpec
    ? simplifyCardMeaningForSpec(rawMeaning, input.layoutSpec)
    : rawMeaning;

  const preferredTemplate =
    input.genomeTemplateId ??
    input.templateId ??
    (input.layoutSpec ? layoutSpecToTemplatePreference(input.layoutSpec) : undefined);

  const pro = computeProfessionalLayout({
    meaning: cardMeaning,
    category: input.category,
    productShape: toProductShapeHint(input.productVisual),
    seed: input.seed,
    backgroundHint: input.designBrief?.backgroundPrompt,
    excludeTemplateIds: input.excludeTemplateIds,
    templateId: preferredTemplate,
    knowledgeCategory: input.knowledgeCategory,
    layoutSpec: input.layoutSpec,
  });

  const dnaOverride = input.genomeDnaOverride ?? input.designBrief?.designDnaOverride;
  return {
    compositionResult: toCompositionResult(pro, input.category, dnaOverride as Partial<import("@/lib/design/types").DesignDNA> | undefined),
    cardMeaning,
    headlineFontPx: pro.headlineFontPx,
    templateId: pro.templateId,
  };
}

function agentKnowledgeSnippet(
  market?: MarketIntelligenceContext,
  assets?: AssetsIntelligenceContext,
  genome?: GenomeIntelligenceContext,
  story?: VisualStoryDirectorResult,
  trend?: TrendIntelligenceContext,
): string | undefined {
  const parts = [
    market?.agentSnippet,
    assets?.agentSnippet,
    genome?.agentSnippet,
    story?.agentSnippet,
    trend?.agentSnippet,
  ].filter(Boolean);
  return parts.length ? parts.join(" | ") : undefined;
}

function compileBackgroundPrompt(input: {
  prompt: string;
  analysis: ProductAnalysis;
  scenePlan: ScenePlan;
  layoutSpec?: LayoutSpec;
  sceneBlueprint?: SceneDirectorResult["blueprint"];
  designBrief?: DesignBrief;
  productVisual?: ProductVisualProfile;
  storyDirection?: VisualStoryDirectorResult;
  marketIntelligence?: MarketIntelligenceContext;
  assetsIntelligence?: AssetsIntelligenceContext;
  genomeIntelligence?: GenomeIntelligenceContext;
  trendIntelligence?: TrendIntelligenceContext;
  luxuryScore?: number;
  compositionScore?: number;
  sceneScore?: number;
}) {
  return compileSceneRenderingPrompt(input.scenePlan, input.analysis, {
    prompt: input.prompt,
    dominantColors: input.productVisual?.dominantColors,
    shape: input.productVisual?.shape,
    storyHeroConcept: input.storyDirection?.heroConcept,
    layoutSpec: input.layoutSpec,
    sceneBlueprint: input.sceneBlueprint,
    designBrief: input.designBrief,
    marketSnippet: agentKnowledgeSnippet(
      input.marketIntelligence,
      input.assetsIntelligence,
      input.genomeIntelligence,
      input.storyDirection,
      input.trendIntelligence,
    ),
    genomeSnippet: input.genomeIntelligence?.agentSnippet,
    luxuryScore: input.luxuryScore,
    compositionScore: input.compositionScore,
    sceneScore: input.sceneScore,
  });
}

function constitutionResponseFields(reports?: ConstitutionReport[]) {
  if (!reports?.length) return {};
  const latest = reports[reports.length - 1];
  return {
    overallDesignScore: latest.overallDesignScore,
    constitutionPassed: reports.every((r) => r.passed),
    constitutionVersion: latest.constitutionVersion,
  };
}

function promptCompilerResponseFields(
  compiled?: ReturnType<typeof compileBackgroundPrompt>,
) {
  if (!compiled) return {};
  return {
    renderingProfile: compiled.metadata.profile,
    negativePrompt: compiled.negativePrompt,
    readabilityScore: compiled.metadata.readabilityScore,
    promptComplexityScore: compiled.metadata.promptComplexityScore,
    promptCompilerApproved: compiled.metadata.validation.passed,
    promptCompilerAttempts: compiled.metadata.attempts,
  };
}

function renderEngineResponseFields(result?: RenderEngineOrchestratorResult) {
  if (!result) return {};
  return {
    renderEngineVersion: result.request.version,
    renderProvider: result.selectedAttempt.providerId,
    renderModel: result.selectedAttempt.modelId,
    renderAttempts: result.attempts.length,
    renderDesignScore: result.overallScore,
  };
}

function storyBlueprintSnippet(story?: VisualStoryDirectorResult): string | undefined {
  if (!story) return undefined;
  return `Story: ${story.heroConcept}`;
}

async function buildLayoutWithAgentReview(input: {
  designBrief?: DesignBrief;
  activeCreative?: CreativeDirectorResult;
  analysis: import("@/lib/product-analysis").ProductAnalysis;
  productVisual?: ProductVisualProfile;
  productPrompt: string;
  seed: string;
  knowledgeCategory?: KnowledgeCategory;
  marketIntelligenceSnippet?: string;
  storyBlueprintSnippet?: string;
  genomeTemplateId?: LayoutTemplateId;
  genomeDnaOverride?: Partial<import("@/lib/design/types").DesignDNA>;
  trendIntelligence?: TrendIntelligenceContext;
  initialLayoutSpec?: LayoutSpec;
  palette?: string[];
  sceneBlueprint?: SceneDirectorResult["blueprint"];
  compositionScore?: number;
  constitutionReports?: ConstitutionReport[];
}): Promise<{
  compositionResult: CompositionResult;
  cardMeaning: CardMeaning;
  seniorAdReview: SeniorArtDirectorReview;
  ctrReview: MarketplaceCtrReview;
  artDirectorReview: ArtDirectorReview;
  headlineFontPx: number;
  templateId: LayoutTemplateId;
  layoutSpec: LayoutSpec;
  qualityGate: QualityGateResult;
  refinementPasses: number;
}> {
  const excluded: LayoutTemplateId[] = [];
  let layoutSpec =
    input.initialLayoutSpec ??
    buildInitialLayoutSpec({
      creative: input.activeCreative,
      analysis: input.analysis,
      genomeTemplateId: input.genomeTemplateId,
      palette: input.palette,
    });

  let last:
    | {
        compositionResult: CompositionResult;
        cardMeaning: CardMeaning;
        seniorAdReview: SeniorArtDirectorReview;
        ctrReview: MarketplaceCtrReview;
        artDirectorReview: ArtDirectorReview;
        headlineFontPx: number;
        templateId: LayoutTemplateId;
        layoutSpec: LayoutSpec;
        qualityGate: QualityGateResult;
        refinementPasses: number;
      }
    | undefined;

  for (let pass = 0; pass < MAX_QUALITY_REFINEMENT_PASSES; pass++) {
    const built = buildProfessionalComposition({
      designBrief: input.designBrief,
      activeCreative: input.activeCreative,
      category: input.analysis.category,
      productVisual: input.productVisual,
      seed: pass === 0 ? input.seed : `${input.seed}:refine-${pass}`,
      excludeTemplateIds: excluded,
      knowledgeCategory: input.knowledgeCategory,
      genomeTemplateId: input.genomeTemplateId,
      genomeDnaOverride: input.genomeDnaOverride,
      layoutSpec,
    });

    const elementCount =
      (built.cardMeaning.feature ? 1 : 0) +
      (built.cardMeaning.badge ? 1 : 0) +
      (built.cardMeaning.subtitle ? 1 : 0) +
      1;

    const agentBase = {
      meaning: built.cardMeaning,
      layout: built.compositionResult.layout,
      templateId: built.templateId,
      creative: input.activeCreative,
      analysis: input.analysis,
      productPrompt: input.productPrompt,
      elementCount,
      marketIntelligenceSnippet: input.marketIntelligenceSnippet,
      storyBlueprintSnippet: input.storyBlueprintSnippet,
    };

    const [seniorAdReview, ctrReview, artDirectorReview] = await Promise.all([
      runSeniorArtDirector({ ...agentBase, headlineFontPx: built.headlineFontPx }),
      runMarketplaceCtrExpert(agentBase),
      runArtDirector({
        ...agentBase,
        trendIntelligence: input.trendIntelligence,
      }),
    ]);

    const qualityGate = runQualityGate({
      layout: built.compositionResult.layout,
      meaning: built.cardMeaning,
      layoutSpec,
      seniorAd: seniorAdReview,
      ctr: ctrReview,
      artDirector: artDirectorReview,
      decorationCount: input.designBrief?.decorations?.length ?? 0,
    });

    const constitutionCritique = validateRenderedCritique({
      analysis: input.analysis,
      layoutSpec,
      layout: built.compositionResult.layout,
      meaning: built.cardMeaning,
      sceneBlueprint: input.sceneBlueprint,
      luxuryScore: qualityGate.luxuryScore.total,
      compositionScore: input.compositionScore,
    });
    input.constitutionReports?.push(constitutionCritique.report);

    const constitutionOk = constitutionCritique.validation.passed;
    if (!constitutionOk) {
      console.warn(
        `[design-constitution] rendered_critique score=${constitutionCritique.report.overallDesignScore}`,
        formatConstitutionReport(constitutionCritique.report),
      );
    }

    const gatePassed = qualityGate.passed && constitutionOk;
    const combinedPatch = {
      ...qualityGate.combinedPatch,
      ...(constitutionCritique.validation.combinedPatch.layoutSpecPatch ?? {}),
    };

    last = {
      ...built,
      seniorAdReview,
      ctrReview,
      artDirectorReview,
      layoutSpec,
      qualityGate: { ...qualityGate, passed: gatePassed, combinedPatch },
      refinementPasses: pass + 1,
    };

    if (gatePassed) {
      if (pass > 0) {
        console.info(
          `[quality-v16.5] approved pass ${pass + 1}: luxury=${qualityGate.luxuryScore.total} template=${built.templateId}`,
        );
      }
      return last;
    }

    console.warn(
      `[quality-v16.5] pass ${pass + 1} rejected luxury=${qualityGate.luxuryScore.total} ad=${seniorAdReview.score} ctr=${ctrReview.score}`,
      qualityGate.luxuryScore.issues,
    );

    excluded.push(built.templateId);
    layoutSpec = applyRefinementPatch(
      applyConstitutionLayoutPatch(
        layoutSpec,
        constitutionCritique.validation.combinedPatch.layoutSpecPatch,
      ),
      combinedPatch,
    );
  }

  return last!;
}

async function loadProductCutout(
  productImage: string | undefined,
  userId: string,
  existingPath?: string | null,
): Promise<{ renderSrc: string; absPath: string; webPath: string; cutout: boolean }> {
  if (existingPath) {
    const webPath = existingPath.startsWith("/")
      ? existingPath
      : `/${existingPath.replace(/^\/+/, "")}`;
    const absPath = path.isAbsolute(existingPath)
      ? existingPath
      : path.join(process.cwd(), "public", webPath.replace(/^\//, ""));
    try {
      const buffer = await readFile(absPath);
      return {
        renderSrc: bufferToDataUrl(buffer),
        absPath,
        webPath,
        cutout: true,
      };
    } catch {
      // fall through
    }
  }

  if (!productImage) {
    throw new Error("PRODUCT_IMAGE_REQUIRED");
  }

  const { buffer } = parseProductImageDataUrl(productImage);
  if (USE_FAST_CUTOUT) {
    return processProductImageForGeneration(buffer, userId);
  }
  return processProductImageForCover(buffer, userId);
}

async function cutoutFromBuffer(
  buffer: Buffer,
  userId: string,
): Promise<{ renderSrc: string; absPath: string; webPath: string; cutout: boolean }> {
  if (USE_FAST_CUTOUT) {
    return processProductImageForGeneration(buffer, userId);
  }
  return processProductImageForCover(buffer, userId);
}

export async function handleGenerateInfographic(
  input: GenerateInfographicInput,
): Promise<GenerateInfographicResult> {
  const slot = await consumeGenerationSlot(input.userId);

  try {
    await loadDesignMemoryStore().catch((error) => {
      console.warn("[design-memory] preload failed:", error);
    });
    await preloadKnowledgeAnalysis().catch((error) => {
      console.warn("[knowledge-engine] preload failed:", error);
    });

    let sdData: InfographicSdInput;
    let appliedStyle: InfographicStyle = input.style ?? DEFAULT_STYLE;
    let aiSource = "mock";
    let productCutoutPath: string | null = null;
    let compositingHints: CompositingHints | undefined;
    let qualityScore: number | undefined;
    let designBrief: DesignBrief | undefined;
    let referenceContext: ResolvedReferenceContext | undefined;
    let storedScenePlan: ScenePlan | undefined;
    let preloadedProductVisual: Awaited<ReturnType<typeof analyzeProductVisual>> | undefined;
    let preloadedCutout: Awaited<ReturnType<typeof loadProductCutout>> | undefined;
    let conceptRenderQueue: CreativeDirectorResult[] = [];
    let knowledgeCategory: KnowledgeCategory | undefined;
    let knowledgePatternsUsed = 0;
    let marketIntelligence: MarketIntelligenceContext | undefined;
    let marketNoveltyScore: number | undefined;
    let assetsIntelligence: AssetsIntelligenceContext | undefined;
    let genomeIntelligence: GenomeIntelligenceContext | undefined;
    let trendIntelligence: TrendIntelligenceContext | undefined;
    let storyDirection: VisualStoryDirectorResult | undefined;
    let photoDirection: CommercialPhotoDirectorResult | undefined;
    let sceneDirection: SceneDirectorResult | undefined;
    let compositionDirection: CompositionDirectorResult | undefined;

    const variationSeed =
      input.backgroundSeed ??
      `gen-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    if (input.regenerateBackgroundOnly && input.existingImageId) {
      const existing = await prisma.generatedImage.findUnique({
        where: { id: input.existingImageId },
      });
      if (!existing || existing.userId !== input.userId) {
        throw new Error("IMAGE_NOT_FOUND");
      }

      appliedStyle = input.style ?? DEFAULT_STYLE;

      if (existing.generatedJson) {
        const stored = unpackSdPayload(existing.generatedJson);
        sdData = stored.data;
        appliedStyle = input.style ?? stored.style ?? DEFAULT_STYLE;
        compositingHints = stored.compositingHints;
        qualityScore = stored.qualityScore;
        designBrief = stored.brief;
        storedScenePlan = stored.scenePlan;
        productCutoutPath = existing.productCutout;
        aiSource = "regen";
      } else {
        const ollama = await generateSdInfographicData(
          existing.prompt,
          appliedStyle,
          input.ollamaContext,
        );
        sdData = ollama.data;
        compositingHints = ollama.compositingHints;
        qualityScore = ollama.qualityScore;
        designBrief = ollama.brief;
        aiSource = "regen-rebuild";
      }
    } else {
      if (!input.productImage) {
        throw new Error("PRODUCT_IMAGE_REQUIRED");
      }

      appliedStyle = input.style ?? DEFAULT_STYLE;
      referenceContext = resolveReferenceContext(
        input.prompt,
        appliedStyle,
        input.ollamaContext?.examples ?? [],
      );
      const styleHint =
        input.style ??
        (referenceContext.hasStrongReference ? referenceContext.style : undefined);
      if (referenceContext.hasStrongReference && !input.style) {
        appliedStyle = referenceContext.style;
      }

      const { buffer: productBuffer } = parseProductImageDataUrl(input.productImage);
      const earlyAnalysis = analyzeProductPrompt(input.prompt);
      const [knowledge, market, assets, trend] = await Promise.all([
        retrieveKnowledgeContext(input.prompt, earlyAnalysis.category),
        retrieveMarketIntelligence(input.prompt, earlyAnalysis.category),
        retrieveAssetsIntelligence(input.prompt, earlyAnalysis.category, [
          appliedStyle,
          earlyAnalysis.brandTone,
        ]),
        retrieveTrendIntelligence(input.prompt, earlyAnalysis.category),
      ]);
      knowledgeCategory = knowledge.category;
      knowledgePatternsUsed = knowledge.patterns.length;
      marketIntelligence = market;
      assetsIntelligence = assets;
      trendIntelligence = trend;

      const marketBlock = buildCombinedMarketPromptBlock(market);
      const assetsBlock = assets.promptBlock;

      genomeIntelligence = await retrieveGenomeIntelligence(
        input.prompt,
        earlyAnalysis.category,
        variationSeed,
        {
          marketSnippet: market.agentSnippet,
          assetsSnippet: assets.agentSnippet,
          trendSnippet: trend.agentSnippet,
          trendScore: trend.trendScore,
        },
      );

      // Ollama + анализ фото + вырезка товара — параллельно (~2–3 мин экономии)
      const [ollama, productVisual, earlyCutout] = await Promise.all([
        generateSdInfographicData(input.prompt, styleHint, {
          ...input.ollamaContext,
          referenceContext,
          userId: input.userId,
          artDirectorMode: input.artDirectorMode,
          knowledgeBlock: knowledge.promptBlock || undefined,
          marketIntelligenceBlock: marketBlock || undefined,
          assetsIntelligenceBlock: assetsBlock || undefined,
          genomeBlock: genomeIntelligence.promptBlock || undefined,
          trendIntelligenceBlock: trend.promptBlock || undefined,
        }),
        analyzeProductVisual(productBuffer),
        cutoutFromBuffer(productBuffer, input.userId),
      ]);

      sdData = ollama.data;
      const paletteColors = paletteColorsForSd(assets.palette);
      if (paletteColors?.length) {
        sdData = { ...sdData, colors: paletteColors };
      }
      compositingHints = ollama.compositingHints;
      qualityScore = ollama.qualityScore;
      designBrief = ollama.brief;
      conceptRenderQueue = ollama.conceptRenderQueue ?? [];
      aiSource = ollama.source;

      preloadedProductVisual = productVisual;
      preloadedCutout = earlyCutout;
    }

    // ── 0. Visual Story Director → Story Blueprint ───────────────────
    let productVisual = preloadedProductVisual;
    if (!productVisual && input.productImage) {
      const { buffer } = parseProductImageDataUrl(input.productImage);
      productVisual = await analyzeProductVisual(buffer);
    }

    let activeCreative = creativeFromBrief(designBrief);
    const productAnalysis = analyzeProductPrompt(input.prompt);

    if (sdData.layout === "marketplace" && genomeIntelligence) {
      storyDirection = await runVisualStoryDirector({
        prompt: input.prompt,
        analysis: productAnalysis,
        designBrief,
        activeCreative,
        productVisual,
        genomeContext: genomeIntelligence,
        marketIntelligenceSnippet: marketIntelligence?.agentSnippet,
      });
    }

    const visualHook =
      storyDirection?.visualHook ??
      designBrief?.designProcess?.visualHook ??
      designBrief?.visualHook;
    const sceneNarrative =
      storyDirection?.sceneNarrative ?? activeCreative?.sceneNarrative;

    // ── 0b. Scene Director → Scene Blueprint (v16.6) ─────────────────
    const constitutionReports: ConstitutionReport[] = [];
    let activeSceneBlueprint: SceneDirectorResult["blueprint"] | undefined;

    if (sdData.layout === "marketplace") {
      sceneDirection = await runSceneDirector({
        prompt: input.prompt,
        analysis: productAnalysis,
        storyDirection,
        genomeContext: genomeIntelligence,
        marketSnippet: marketIntelligence?.agentSnippet,
        knowledgeCategory,
        knowledgeSnippet: knowledgeCategory,
        trendSnippet: trendIntelligence?.agentSnippet,
        productVisual,
        seed: variationSeed,
      });

      if (sceneDirection?.blueprint) {
        const sceneConstitution = validateSceneBlueprint(sceneDirection.blueprint, {
          analysis: productAnalysis,
          sceneScore: sceneDirection.quality.total,
        });
        constitutionReports.push(sceneConstitution.report);
        activeSceneBlueprint = sceneConstitution.sceneBlueprint ?? sceneDirection.blueprint;
        if (!sceneConstitution.validation.passed) {
          console.warn(
            "[design-constitution] scene_blueprint",
            formatConstitutionReport(sceneConstitution.report),
          );
        }
      }
    }

    // ── 0c. Composition Director → LayoutSpec geometry (v16.7) ─────
    const earlyGenomeTemplateId = genomeIntelligence?.mutatedGenome.composition
      .layoutTemplate as LayoutTemplateId | undefined;

    let activeLayoutSpec: LayoutSpec | undefined;

    if (sdData.layout === "marketplace") {
      compositionDirection = await runCompositionDirector({
        prompt: input.prompt,
        analysis: productAnalysis,
        storyDirection,
        sceneBlueprint: activeSceneBlueprint ?? sceneDirection?.blueprint,
        genomeTemplateId: earlyGenomeTemplateId,
        palette: paletteColorsForSd(assetsIntelligence?.palette),
        seed: variationSeed,
        knowledgeCategory,
      });

      const specCandidate =
        compositionDirection?.layoutSpec ??
        buildInitialLayoutSpec({
          creative: activeCreative,
          analysis: productAnalysis,
          genomeTemplateId: earlyGenomeTemplateId,
          palette: paletteColorsForSd(assetsIntelligence?.palette),
          storyDirection,
        });

      const layoutConstitution = validateLayoutSpec(specCandidate, {
        analysis: productAnalysis,
        sceneBlueprint: activeSceneBlueprint ?? sceneDirection?.blueprint,
        compositionScore: compositionDirection?.quality.total,
      });
      constitutionReports.push(layoutConstitution.report);
      activeLayoutSpec = layoutConstitution.layoutSpec ?? specCandidate;
      if (!layoutConstitution.validation.passed) {
        console.warn(
          "[design-constitution] layout_spec",
          formatConstitutionReport(layoutConstitution.report),
        );
      }
    }

    // ── 1. Scene Planner (адаптирует Blueprint + Genome) ─────────────
    const { analysis, scene: plannedScene } = planScene({
      prompt: input.prompt,
      coverConceptId: input.coverConcept ?? storedScenePlan?.coverConceptId,
      visualHook,
      styleHint: input.style ?? (referenceContext?.hasStrongReference ? referenceContext.style : undefined),
      seed: variationSeed,
      productVisual,
      sceneNarrative,
      sceneBlueprint: activeSceneBlueprint ?? sceneDirection?.blueprint,
      compositionScenarioId:
        storyDirection?.compositionScenarioId ??
        (designBrief?.compositionScenarioId as
          | import("@/lib/design/types").CompositionScenarioId
          | undefined),
    });

    let scenePlan = storedScenePlan ?? plannedScene;

    if (sdData.layout === "marketplace" && genomeIntelligence && storyDirection) {
      photoDirection = await runCommercialPhotoDirector({
        genomeContext: genomeIntelligence,
        storyDirection,
        scene: scenePlan,
        analysis,
        productVisual,
        activeCreative,
      });
      scenePlan = { ...scenePlan, ...photoDirection.scenePatch };
    }

    const genomeDnaOverride = genomeIntelligence
      ? genomeToDnaOverride(genomeIntelligence.mutatedGenome)
      : undefined;
    const genomeTemplateId = genomeIntelligence?.mutatedGenome.composition
      .layoutTemplate as LayoutTemplateId | undefined;
    const storySnippet = storyBlueprintSnippet(storyDirection);

    // ── 2. Layout Engine + Senior Art Director ───────────────────────
    let compositionResult: CompositionResult | null = null;
    let cardMeaning: CardMeaning | undefined;
    let seniorAdReview: SeniorArtDirectorReview | undefined;
    let ctrReview: MarketplaceCtrReview | undefined;
    let headlineFontPx = 18;
    let layoutSpec: LayoutSpec | undefined;
    let qualityGateV165: QualityGateResult | undefined;
    let qualityRefinementPasses = 0;
    let luxuryScoreValue: number | undefined;
    let compiledBackground: ReturnType<typeof compileBackgroundPrompt> | undefined;
    let renderEngineResult: RenderEngineOrchestratorResult | undefined;
    const useRenderEngineV17 = USE_RENDER_ENGINE_V17 && sdData.layout === "marketplace";

    if (sdData.layout === "marketplace") {
      const palette = paletteColorsForSd(assetsIntelligence?.palette);
      const built = await buildLayoutWithAgentReview({
        designBrief,
        activeCreative,
        analysis,
        productVisual,
        productPrompt: input.prompt,
        seed: variationSeed,
        knowledgeCategory,
        marketIntelligenceSnippet: agentKnowledgeSnippet(
          marketIntelligence,
          assetsIntelligence,
          genomeIntelligence,
          storyDirection,
          trendIntelligence,
        ),
        storyBlueprintSnippet: storySnippet,
        genomeTemplateId,
        genomeDnaOverride,
        trendIntelligence,
        palette,
        initialLayoutSpec:
          activeLayoutSpec ??
          compositionDirection?.layoutSpec ??
          buildInitialLayoutSpec({
            creative: activeCreative,
            analysis,
            genomeTemplateId,
            palette,
            storyDirection,
          }),
        sceneBlueprint: activeSceneBlueprint ?? sceneDirection?.blueprint,
        compositionScore: compositionDirection?.quality.total,
        constitutionReports,
      });
      compositionResult = built.compositionResult;
      cardMeaning = built.cardMeaning;
      seniorAdReview = built.seniorAdReview;
      ctrReview = built.ctrReview;
      headlineFontPx = built.headlineFontPx;
      layoutSpec = built.layoutSpec;
      qualityGateV165 = built.qualityGate;
      qualityRefinementPasses = built.refinementPasses;
      luxuryScoreValue = built.qualityGate.luxuryScore.total;
      if (designBrief && !designBrief.cardMeaning) {
        designBrief = { ...designBrief, cardMeaning };
      }
    }

    let compositionLayout = compositionResult?.layout;
    let objectScale = layoutObjectScale(compositionLayout?.metrics?.productAreaPct);
    compositingHints = sceneToCompositingHints(scenePlan, objectScale);

    // ── 3. Render Engine v17 OR Prompt Compiler → background ─────────
    if (!useRenderEngineV17) {
      compiledBackground = compileBackgroundPrompt({
        prompt: input.prompt,
        analysis,
        scenePlan,
        layoutSpec,
        sceneBlueprint: activeSceneBlueprint ?? sceneDirection?.blueprint,
        designBrief,
        productVisual,
        storyDirection,
        marketIntelligence,
        assetsIntelligence,
        genomeIntelligence,
        trendIntelligence,
        luxuryScore: luxuryScoreValue,
        compositionScore: compositionDirection?.quality.total,
        sceneScore: sceneDirection?.quality.total,
      });
      sdData.backgroundPrompt = compiledBackground.prompt;
      if (designBrief) {
        designBrief = {
          ...designBrief,
          backgroundPrompt: compiledBackground.prompt.slice(0, 480),
          negativePrompt: compiledBackground.negativePrompt.slice(0, 300),
        };
      }
      if (!compiledBackground.approved) {
        console.warn(
          "[prompt-compiler] validation issues:",
          compiledBackground.metadata.validation.issues,
        );
      }

      if (layoutSpec) {
        const promptConstitution = validateCompiledPromptStage(compiledBackground, {
          analysis,
          layoutSpec,
          luxuryScore: luxuryScoreValue,
          compositionScore: compositionDirection?.quality.total,
        });
        constitutionReports.push(promptConstitution.report);
        if (!promptConstitution.validation.passed) {
          console.warn(
            "[design-constitution] prompt",
            formatConstitutionReport(promptConstitution.report),
          );
        }
      }
    } else {
      sdData.backgroundPrompt = "[RENDER_ENGINE_V17]";
      console.info("[render-engine-v17] using provider-independent render pipeline");
    }

    let backgroundUrl: string | null = null;
    let backgroundSource: "sd" | "fallback" | "provider" = "sd";
    let backgroundDataUrl: string | undefined;
    let compositeResult: Awaited<ReturnType<typeof compositeProductIntoScene>> | undefined;
    let qualityValidation: QualityValidationResult | undefined;
    let photoReview: CommercialPhotographerReview | undefined;
    let mergedImageDataUrl: string | undefined;
    let productRender: Awaited<ReturnType<typeof loadProductCutout>> | undefined =
      preloadedCutout;

    const usePhotorealMerge =
      sdData.layout === "marketplace" && process.env.MARKETPLACE_HTML_PRODUCT !== "1";

    // SD фон + вырезка (если ещё нет) — параллельно
    const cutoutPromise =
      productRender
        ? Promise.resolve(productRender)
        : loadProductCutout(
            input.productImage,
            input.userId,
            input.regenerateBackgroundOnly ? productCutoutPath ?? undefined : undefined,
          );

    const bgPromise = (async () => {
      if (useRenderEngineV17) {
        const engine = await runRenderEngine({
          analysis,
          scenePlan,
          layoutSpec,
          sceneBlueprint: activeSceneBlueprint ?? sceneDirection?.blueprint,
          luxuryScore: luxuryScoreValue,
          compositionScore: compositionDirection?.quality.total,
          sceneScore: sceneDirection?.quality.total,
          constitutionPassed: constitutionReports.every((r) => r.passed),
          seedSuffix: variationSeed,
          skipCompose: true,
          qualityInput: {
            layoutSpec,
            layout: compositionLayout,
            meaning: cardMeaning,
            luxuryScore: luxuryScoreValue,
            compositionScore: compositionDirection?.quality.total,
            sceneScore: sceneDirection?.quality.total,
          },
        });
        renderEngineResult = engine;
        const adapterPrompt =
          engine.selectedAttempt.result?.compiled.prompt ?? "v17 background";
        sdData.backgroundPrompt = adapterPrompt.slice(0, 480);
        if (designBrief) {
          designBrief = {
            ...designBrief,
            backgroundPrompt: adapterPrompt.slice(0, 480),
            negativePrompt:
              engine.selectedAttempt.result?.compiled.negativePrompt?.slice(0, 300),
          };
        }
        return {
          url: engine.backgroundUrl,
          dataUrl: `data:image/png;base64,${engine.backgroundBuffer.toString("base64")}`,
        };
      }
      if (!process.env.HF_API_KEY) throw new Error("HF_API_KEY missing");
      const url = await generateBackground(sdData.backgroundPrompt, {
        seedSuffix: variationSeed,
        style: appliedStyle,
      });
      return { url, dataUrl: await backgroundToDataUrl(url) };
    })();

    try {
      const [bg, cutout] = await Promise.all([bgPromise, cutoutPromise]);
      backgroundUrl = bg.url;
      backgroundDataUrl = bg.dataUrl;
      backgroundSource = useRenderEngineV17 ? "provider" : "sd";
      productRender = cutout;
      productCutoutPath = cutout.webPath;
    } catch (error) {
      console.warn("SD background failed, gradient fallback:", error);
      backgroundSource = "fallback";
      try {
        productRender = await cutoutPromise;
        productCutoutPath = productRender.webPath;
      } catch (cutoutError) {
        console.warn("Cutout failed:", cutoutError);
      }
    }

    const runPhotoReview = async () => {
      photoReview = await runCommercialPhotographer({
        scene: scenePlan,
        lighting: compositeResult?.lighting,
        qualityValidation,
        hasComposite: !!compositeResult,
        hasReflection: scenePlan.reflectionEnabled,
        hasShadows: !!compositeResult,
        backgroundSource,
        productPrompt: input.prompt,
        marketIntelligenceSnippet: agentKnowledgeSnippet(
          marketIntelligence,
          assetsIntelligence,
          genomeIntelligence,
          storyDirection,
          trendIntelligence,
        ),
      });
    };

    if (
      usePhotorealMerge &&
      productRender?.cutout &&
      productCutoutPath &&
      backgroundUrl &&
      backgroundSource === "sd"
    ) {
      let photoBgRetry = 0;
      while (photoBgRetry <= MAX_PHOTO_BG_RETRIES) {
        try {
          if (photoBgRetry > 0) {
            if (!process.env.HF_API_KEY) break;
            const url = await generateBackground(sdData.backgroundPrompt, {
              seedSuffix: `${variationSeed}:photo-${photoBgRetry}`,
              style: appliedStyle,
            });
            backgroundUrl = url;
            backgroundDataUrl = await backgroundToDataUrl(url);
          }

          compositeResult = await compositeProductIntoScene(backgroundUrl, productCutoutPath, {
            layout: "marketplace",
            scene: scenePlan,
            compositionLayout,
            objectScale,
          });

          qualityValidation = validateQuality({
            compositionLayout,
            compositionScore: compositionResult?.score,
            dna: compositionResult?.dna,
            scene: scenePlan,
            lighting: compositeResult.lighting,
            productAreaPct: compositionLayout?.metrics?.productAreaPct,
            hasReflection: scenePlan.reflectionEnabled,
            hasShadows: true,
          });
          qualityScore = qualityValidation.total;

          await runPhotoReview();

          if (photoReview?.looksLikePhoto || photoBgRetry >= MAX_PHOTO_BG_RETRIES) {
            if (photoBgRetry > 0 && photoReview?.looksLikePhoto) {
              console.info(`[commercial-photographer] passed after bg retry ${photoBgRetry}`);
            }
            break;
          }

          console.warn(
            `[commercial-photographer] score ${photoReview?.score} realism ${photoReview?.realism}`,
            photoReview?.problems,
          );
          photoBgRetry++;
        } catch (error) {
          console.warn("Scene composite failed:", error);
          break;
        }
      }

      if (qualityValidation && !qualityValidation.passed) {
        console.warn(
          `[quality] score ${qualityValidation.total}/${QUALITY_PASS_THRESHOLD}`,
          qualityValidation.issues,
        );
      }
    } else {
      await runPhotoReview();
    }

    let chiefPlan: ChiefDesignDirectorPlan | undefined;
    if (cardMeaning && compositionLayout && seniorAdReview && ctrReview && photoReview) {
      chiefPlan = await runChiefDesignDirector({
        cardMeaning,
        layout: compositionLayout,
        designScore: compositionResult?.score?.total,
        templateId: compositionResult?.layout?.scenarioId,
        seniorArtDirector: seniorAdReview,
        marketplaceExpert: ctrReview,
        commercialPhotographer: photoReview,
        productPrompt: input.prompt,
        marketIntelligenceSnippet: agentKnowledgeSnippet(
          marketIntelligence,
          assetsIntelligence,
          genomeIntelligence,
          storyDirection,
          trendIntelligence,
        ),
        storyBlueprintSnippet: storySnippet,
      });

      if (!chiefPlan.approved && MAX_CHIEF_FIX_RETRIES > 0) {
        const hints = deriveFixApplicationHints(
          chiefPlan,
          analysis.category,
          input.prompt,
          `${variationSeed}:chief`,
        );

        if (hints.simplifyCardMeaning && cardMeaning) {
          cardMeaning = { ...cardMeaning, subtitle: "", badge: "" };
          if (designBrief) {
            designBrief = { ...designBrief, cardMeaning };
          }
        }

        if (hints.needsLayoutRetry && sdData.layout === "marketplace") {
          const currentTemplate = compositionResult?.layout?.scenarioId as LayoutTemplateId | undefined;
          const fixed = buildProfessionalComposition({
            designBrief,
            activeCreative,
            category: analysis.category,
            productVisual,
            seed: `${variationSeed}:chief-layout`,
            templateId: hints.preferTemplateId,
            excludeTemplateIds: currentTemplate ? [currentTemplate] : undefined,
            knowledgeCategory,
          });
          compositionResult = fixed.compositionResult;
          compositionLayout = compositionResult.layout;
          objectScale = layoutObjectScale(compositionLayout.metrics?.productAreaPct);
          cardMeaning = fixed.cardMeaning;
        }

        if (
          hints.needsBackgroundRetry &&
          hints.backgroundEnvironment &&
          productCutoutPath &&
          backgroundUrl &&
          usePhotorealMerge
        ) {
          const bgPrompt = `${hints.backgroundEnvironment}, ultra realistic commercial photography, no text, no product`;
          if (designBrief) {
            designBrief = { ...designBrief, backgroundPrompt: bgPrompt.slice(0, 480) };
          }
          sdData.backgroundPrompt = bgPrompt;
          try {
            if (!process.env.HF_API_KEY) throw new Error("HF_API_KEY missing");
            const url = await generateBackground(bgPrompt, {
              seedSuffix: `${variationSeed}:chief-bg`,
              style: appliedStyle,
            });
            backgroundUrl = url;
            backgroundDataUrl = await backgroundToDataUrl(url);
            compositeResult = await compositeProductIntoScene(url, productCutoutPath, {
              layout: "marketplace",
              scene: scenePlan,
              compositionLayout,
              objectScale,
            });
            mergedImageDataUrl = await mergedToDataUrl(compositeResult.mergedPath);
            qualityValidation = validateQuality({
              compositionLayout,
              compositionScore: compositionResult?.score,
              dna: compositionResult?.dna,
              scene: scenePlan,
              lighting: compositeResult.lighting,
              productAreaPct: compositionLayout?.metrics?.productAreaPct,
              hasReflection: scenePlan.reflectionEnabled,
              hasShadows: true,
            });
            await runPhotoReview();
            chiefPlan = await runChiefDesignDirector({
              cardMeaning,
              layout: compositionLayout,
              designScore: compositionResult?.score?.total,
              templateId: compositionResult?.layout?.scenarioId,
              seniorArtDirector: seniorAdReview!,
              marketplaceExpert: ctrReview!,
              commercialPhotographer: photoReview!,
              productPrompt: input.prompt,
              marketIntelligenceSnippet: agentKnowledgeSnippet(
                marketIntelligence,
                assetsIntelligence,
                genomeIntelligence,
                storyDirection,
              ),
              storyBlueprintSnippet: storySnippet,
            });
            console.info(`[chief-design-director] fix retry → approved=${chiefPlan.approved} est=${chiefPlan.estimatedScoreAfterFix}`);
          } catch (error) {
            console.warn("[chief-design-director] fix retry failed:", error);
          }
        }
      }
    }

    let finalQuality = activeCreative
      ? evaluateFinalQuality({
          creative: activeCreative,
          analysis,
          productPrompt: input.prompt,
          compositionLayout,
          qualityValidation,
          hasComposite: !!compositeResult,
        })
      : undefined;

    let conceptRetryIndex = 0;
    while (
      finalQuality &&
      !finalQuality.passed &&
      conceptRetryIndex < MAX_CONCEPT_RENDER_RETRIES &&
      conceptRenderQueue[conceptRetryIndex + 1]
    ) {
      conceptRetryIndex++;
      const nextConcept = conceptRenderQueue[conceptRetryIndex];
      activeCreative = nextConcept;
      if (designBrief) {
        const retryMeaning = creativeConceptToCardMeaning(nextConcept, designBrief);
        designBrief = applyPosterRules(designBrief, nextConcept, retryMeaning, analysis.category);
        sdData = briefToSdInput(designBrief, input.prompt);
        cardMeaning = retryMeaning;
      }

      if (sdData.layout === "marketplace") {
        const rebuilt = await buildLayoutWithAgentReview({
          designBrief,
          activeCreative: nextConcept,
          analysis,
          productVisual,
          productPrompt: input.prompt,
          seed: `${variationSeed}:concept-${conceptRetryIndex}`,
          knowledgeCategory,
          marketIntelligenceSnippet: agentKnowledgeSnippet(
            marketIntelligence,
            assetsIntelligence,
            genomeIntelligence,
            storyDirection,
            trendIntelligence,
          ),
          storyBlueprintSnippet: storySnippet,
          genomeTemplateId,
          genomeDnaOverride,
          trendIntelligence,
          palette: paletteColorsForSd(assetsIntelligence?.palette),
          initialLayoutSpec: layoutSpec,
          sceneBlueprint: activeSceneBlueprint ?? sceneDirection?.blueprint,
          compositionScore: compositionDirection?.quality.total,
          constitutionReports,
        });
        compositionResult = rebuilt.compositionResult;
        compositionLayout = compositionResult.layout;
        objectScale = layoutObjectScale(compositionLayout.metrics?.productAreaPct);
        seniorAdReview = rebuilt.seniorAdReview;
        ctrReview = rebuilt.ctrReview;
        layoutSpec = rebuilt.layoutSpec;
        qualityGateV165 = rebuilt.qualityGate;
        luxuryScoreValue = rebuilt.qualityGate.luxuryScore.total;
        qualityRefinementPasses = rebuilt.refinementPasses;
      }

      const retryScene = planScene({
        prompt: input.prompt,
        coverConceptId: input.coverConcept,
        visualHook,
        styleHint: input.style,
        seed: `${variationSeed}:concept-${conceptRetryIndex}`,
        productVisual,
        sceneNarrative: nextConcept.sceneNarrative,
        compositionScenarioId: nextConcept.compositionScenarioId,
      }).scene;

      const retryCompiled = compileBackgroundPrompt({
        prompt: input.prompt,
        analysis,
        scenePlan: retryScene,
        layoutSpec,
        sceneBlueprint: activeSceneBlueprint ?? sceneDirection?.blueprint,
        designBrief,
        productVisual,
        storyDirection,
        marketIntelligence,
        assetsIntelligence,
        genomeIntelligence,
        trendIntelligence,
        luxuryScore: luxuryScoreValue,
        compositionScore: compositionDirection?.quality.total,
        sceneScore: sceneDirection?.quality.total,
      });
      compiledBackground = retryCompiled;
      sdData.backgroundPrompt = retryCompiled.prompt;

      try {
        if (!process.env.HF_API_KEY) throw new Error("HF_API_KEY missing");
        const url = await generateBackground(sdData.backgroundPrompt, {
          seedSuffix: `${variationSeed}:c${conceptRetryIndex}`,
          style: appliedStyle,
        });
        backgroundUrl = url;
        backgroundDataUrl = await backgroundToDataUrl(url);
        backgroundSource = "sd";

        if (productCutoutPath && usePhotorealMerge) {
          compositeResult = await compositeProductIntoScene(url, productCutoutPath, {
            layout: "marketplace",
            scene: retryScene,
            compositionLayout,
            objectScale,
          });
          mergedImageDataUrl = await mergedToDataUrl(compositeResult.mergedPath);
          qualityValidation = validateQuality({
            compositionLayout,
            compositionScore: compositionResult?.score,
            dna: compositionResult?.dna,
            scene: retryScene,
            lighting: compositeResult.lighting,
            productAreaPct: compositionLayout?.metrics?.productAreaPct,
            hasReflection: retryScene.reflectionEnabled,
            hasShadows: true,
          });
          photoReview = await runCommercialPhotographer({
            scene: retryScene,
            lighting: compositeResult.lighting,
            qualityValidation,
            hasComposite: true,
            hasReflection: retryScene.reflectionEnabled,
            hasShadows: true,
            backgroundSource: "sd",
            productPrompt: input.prompt,
          });
        }
      } catch (error) {
        console.warn(`[concept-retry] ${nextConcept.archetypeId} failed:`, error);
        break;
      }

      finalQuality = evaluateFinalQuality({
        creative: nextConcept,
        analysis,
        productPrompt: input.prompt,
        compositionLayout,
        qualityValidation,
        hasComposite: !!compositeResult,
      });
      if (finalQuality.passed) {
        console.info(`[concept-retry] passed with ${nextConcept.archetypeId}`);
      }
    }

    if (finalQuality && !finalQuality.passed) {
      console.warn(`[final-quality] ${finalQuality.total}/100`, finalQuality.issues);
    }

    const infographicData = sdDataToInfographic(sdData, input.prompt);
    const { font: libraryFont, badge: libraryBadge } = await resolveLibraryAssets(
      sdData.fontId,
      sdData.badgeId,
    );
    const fallbackBg =
      backgroundSource === "fallback"
        ? TRENDS[appliedStyle].background
        : buildFallbackGradient(sdData.colors);

    if (!mergedImageDataUrl && compositeResult) {
      mergedImageDataUrl = await mergedToDataUrl(compositeResult.mergedPath);
    } else if (
      sdData.layout !== "marketplace" &&
      backgroundUrl &&
      backgroundSource === "sd" &&
      productRender?.cutout &&
      productCutoutPath
    ) {
      try {
        compositeResult = await compositeProductIntoScene(backgroundUrl, productCutoutPath, {
          layout: "center",
          scene: scenePlan,
          objectScale,
        });
        mergedImageDataUrl = await mergedToDataUrl(compositeResult.mergedPath);
      } catch (error) {
        console.warn("Non-marketplace composite failed:", error);
      }
    }

    const accentHex = resolveMarketplaceAccent(sdData.colors, analysis.category);

    const badgeText =
      infographicData.mainBanner?.title ??
      infographicData.headline ??
      cardMeaning?.badge ??
      cardMeaning?.title ??
      "Новинка";

    const parametricBadgeHtml =
      assetsIntelligence?.parametricBadge && sdData.layout === "marketplace"
        ? renderIntelligentBadge(
            assetsIntelligence.parametricBadge,
            badgeText,
            accentHex,
            Math.max(14, Math.round(headlineFontPx * 0.55)),
          )
        : undefined;

    const compositionMeta = compositionResult
      ? {
          dna: compositionResult.dna,
          scenarioId: compositionResult.scenarioId,
          score: compositionResult.score,
          seed: compositionResult.seed,
          attempts: compositionResult.attempts,
        }
      : undefined;

    // ── 10. Layout Renderer ───────────────────────────────────────────
    const html = renderInfographicHtml(infographicData, {
      style: appliedStyle,
      layout: sdData.layout,
      mergedImageDataUrl,
      backgroundDataUrl: mergedImageDataUrl ? undefined : backgroundDataUrl,
      backgroundCss: !backgroundDataUrl && !mergedImageDataUrl ? fallbackBg : undefined,
      productImageSrc: mergedImageDataUrl ? undefined : productRender?.renderSrc,
      productImageCutout: productRender?.cutout ?? false,
      libraryFont,
      libraryBadge,
      parametricBadgeHtml,
      accentHex,
      compositionLayout,
    });

    const filename = `${input.userId}-${Date.now()}.png`;
    const imagePath = await renderHtmlToImage(html, filename);

    const balance = slot.usedFreeQuota
      ? { ...slot.balance, freeRemaining: slot.balance.freeRemaining - 1 }
      : slot.balance;

    if (marketIntelligence && compositionResult?.layout) {
      marketNoveltyScore = computeNoveltyScore({
        productScale: compositionResult.layout.metrics?.productAreaPct,
        backgroundType: scenePlan.backgroundType,
        layoutTemplate: compositionResult.layout.scenarioId,
        market: marketIntelligence,
      });
    }

    const payloadExtras = {
      brief: designBrief,
      compositingHints,
      qualityScore: qualityValidation?.total ?? qualityScore,
      composition: compositionMeta,
      scenePlan,
      qualityValidation,
      seniorArtDirector: seniorAdReview,
      marketplaceCtrExpert: ctrReview,
      commercialPhotographer: photoReview,
      chiefDesignDirector: chiefPlan,
      designMemory: undefined as DesignMemoryUpdateResult | undefined,
      marketIntelligence: marketIntelligence
        ? {
            category: marketIntelligence.category,
            marketVersion: marketIntelligence.marketVersion,
            productsAnalyzed: marketIntelligence.productsAnalyzed,
            noveltyScore: marketNoveltyScore,
          }
        : undefined,
      feedbackLearning: undefined as FeedbackLearningSnapshot | undefined,
      promptCompiler: compiledBackground?.metadata,
      designConstitution: constitutionReports.length ? constitutionReports : undefined,
      renderEngine: renderEngineResult
        ? {
            request: renderEngineResult.request,
            attempts: renderEngineResult.attempts.map((a) => ({
              attemptIndex: a.attemptIndex,
              modelId: a.modelId,
              providerId: a.providerId,
              qualityScore: a.qualityScore,
              passed: a.passed,
            })),
            selectedModel: renderEngineResult.selectedAttempt.modelId,
            overallScore: renderEngineResult.overallScore,
          }
        : undefined,
    };

    let designMemory: DesignMemoryUpdateResult | undefined;
    let knowledgeAnalysisTriggered = false;
    let collectedHistoryId: string | undefined;
    if (sdData.layout === "marketplace") {
      try {
        designMemory = await runDesignMemory({
          productPrompt: input.prompt,
          category: analysis.category,
          templateId: compositionResult?.layout?.scenarioId as LayoutTemplateId | undefined,
          fontId: sdData.fontId,
          badgeId: sdData.badgeId,
          scenePlan,
          designScore: compositionResult?.score?.total,
          cardMeaning,
          seniorAdReview,
          ctrReview,
          photoReview,
          chiefPlan,
          parametricBadgeKey: assetsIntelligence?.recommendedBadgeKey,
          parametricBadgeModel: assetsIntelligence?.parametricBadge
            ? {
                style: assetsIntelligence.parametricBadge.style,
                radius: assetsIntelligence.parametricBadge.radius,
                paddingX: assetsIntelligence.parametricBadge.paddingX,
                paddingY: assetsIntelligence.parametricBadge.paddingY,
                gradient: assetsIntelligence.parametricBadge.gradient,
                shadow: assetsIntelligence.parametricBadge.shadow,
                marketplaceScore: ctrReview?.score,
              }
            : undefined,
        });
        payloadExtras.designMemory = designMemory;

        if (assetsIntelligence) {
          const assetOutcome = computeOutcomeScore({
            productPrompt: input.prompt,
            category: analysis.category,
            templateId: compositionResult?.layout?.scenarioId as LayoutTemplateId | undefined,
            fontId: sdData.fontId,
            badgeId: sdData.badgeId,
            scenePlan,
            designScore: compositionResult?.score?.total,
            cardMeaning,
            seniorAdReview,
            ctrReview,
            photoReview,
            chiefPlan,
          });
          const tasks: Promise<void>[] = [];
          if (assetsIntelligence.recommendedBadgeKey) {
            tasks.push(
              recordAssetSuccess(assetsIntelligence.recommendedBadgeKey, "badge", assetOutcome),
            );
          }
          if (assetsIntelligence.recommendedFontFamily) {
            const fontKey = `font_${assetsIntelligence.recommendedFontFamily.toLowerCase().replace(/\s+/g, "_")}`;
            tasks.push(recordAssetSuccess(fontKey, "font", assetOutcome));
          }
          if (assetsIntelligence.recommendedPaletteKey) {
            const paletteKey = `palette_${assetsIntelligence.recommendedPaletteKey.toLowerCase().replace(/\s+/g, "_")}`;
            tasks.push(recordAssetSuccess(paletteKey, "palette", assetOutcome));
          }
          await Promise.all(tasks).catch((e) =>
            console.warn("[assets-intelligence] record success failed:", e),
          );
        }
      } catch (error) {
        console.warn("[design-memory] learn failed:", error);
      }

      try {
        const collected = await collectGenerationPattern({
          prompt: input.prompt,
          productCategory: analysis.category,
          sdData,
          scenePlan,
          compositionResult,
          fontName: libraryFont?.name ?? libraryFont?.fontFamily ?? null,
          badgeName: libraryBadge?.name ?? null,
          imagePath,
          seniorAdReview,
          ctrReview,
          photoReview,
        });
        knowledgeAnalysisTriggered = collected.analysisTriggered;
        collectedHistoryId = collected.historyId;
        if (!knowledgeCategory) knowledgeCategory = collected.category;
      } catch (error) {
        console.warn("[knowledge-engine] collect failed:", error);
      }

      const feedbackLearning: FeedbackLearningSnapshot = {
        productCategory: analysis.category,
        knowledgeCategory,
        templateId: compositionResult?.layout?.scenarioId as LayoutTemplateId | undefined,
        fontId: sdData.fontId,
        badgeId: sdData.badgeId,
        scenePlan,
        designScore: compositionResult?.score?.total,
        cardMeaning,
        seniorAdReview,
        ctrReview,
        photoReview,
        chiefPlan,
        parametricBadgeKey: assetsIntelligence?.recommendedBadgeKey,
        parametricBadgeModel: assetsIntelligence?.parametricBadge
          ? {
              style: assetsIntelligence.parametricBadge.style,
              radius: assetsIntelligence.parametricBadge.radius,
              paddingX: assetsIntelligence.parametricBadge.paddingX,
              paddingY: assetsIntelligence.parametricBadge.paddingY,
              gradient: assetsIntelligence.parametricBadge.gradient,
              shadow: assetsIntelligence.parametricBadge.shadow,
              marketplaceScore: ctrReview?.score,
            }
          : undefined,
        recommendedFontFamily: assetsIntelligence?.recommendedFontFamily,
        recommendedPaletteKey: assetsIntelligence?.recommendedPaletteKey,
        generationHistoryId: collectedHistoryId,
        designGenomeKey: genomeIntelligence?.mutatedGenome.genomeKey,
      };
      payloadExtras.feedbackLearning = feedbackLearning;

      if (genomeIntelligence) {
        const finalGenome = extractGenomeFromGeneration({
          prompt: input.prompt,
          productCategory: analysis.category,
          knowledgeCategory: genomeIntelligence.category,
          customerIntent: storyDirection?.customerIntent,
          heroConcept: storyDirection?.heroConcept,
          sceneNarrative: storyDirection?.sceneNarrative,
          scenePlan,
          compositionTemplate: compositionResult?.layout?.scenarioId as LayoutTemplateId | undefined,
          productScalePct: compositionResult?.layout?.metrics?.productAreaPct,
          negativeSpacePct: compositionResult?.layout?.metrics?.whitespacePct,
          fontFamily: assetsIntelligence?.recommendedFontFamily,
          designScore: compositionResult?.score?.total,
          seniorAdScore: seniorAdReview?.score,
          ctrScore: ctrReview?.score,
          photoScore: photoReview?.score,
          ctrPrediction: ctrReview?.ctrPrediction,
          productVisual,
          badge: genomeIntelligence.mutatedGenome.badge,
          palette: genomeIntelligence.mutatedGenome.palette,
          dna: compositionResult?.dna,
        });
        finalGenome.genomeKey = genomeIntelligence.mutatedGenome.genomeKey;
        finalGenome.rankings = genomeIntelligence.mutatedGenome.rankings;
        await saveGenerationGenome(
          finalGenome,
          !!(chiefPlan?.approved && seniorAdReview?.approved && ctrReview?.wouldClick),
        ).catch((e) => console.warn("[design-genome] save failed:", e));
      }
    }

    if (input.regenerateBackgroundOnly && input.existingImageId) {
      await prisma.generatedImage.update({
        where: { id: input.existingImageId },
        data: {
          imagePath,
          backgroundUrl,
          productCutout: productCutoutPath,
          generatedJson: packSdPayload(sdData, appliedStyle, payloadExtras),
        },
      });

      return {
        id: input.existingImageId,
        imagePath,
        backgroundUrl,
        freeRemaining: balance.unlimited ? -1 : balance.freeRemaining,
        credits: balance.credits,
        unlimited: balance.unlimited,
        aiSource,
        backgroundSource,
        pipelineVersion: PIPELINE_VERSION,
        qualityScore: qualityValidation?.total,
        layoutTemplateId: compositionResult?.layout?.scenarioId,
        designScore: compositionResult?.score?.total,
        seniorAdScore: seniorAdReview?.score,
        seniorAdApproved: seniorAdReview?.approved,
        ctrScore: ctrReview?.score,
        ctrPrediction: ctrReview?.ctrPrediction,
        wouldClick: ctrReview?.wouldClick,
        photoScore: photoReview?.score,
        photoRealism: photoReview?.realism,
        looksLikePhoto: photoReview?.looksLikePhoto,
        chiefApproved: chiefPlan?.approved,
        estimatedScoreAfterFix: chiefPlan?.estimatedScoreAfterFix,
        designMemoryUpdate: designMemory?.memoryUpdate,
        designMemoryAdvice: designMemory?.nextGenerationAdvice,
        knowledgeCategory,
        knowledgePatternsUsed,
        knowledgeAnalysisTriggered,
        marketIntelligenceVersion: marketIntelligence?.marketVersion,
        marketProductsAnalyzed: marketIntelligence?.productsAnalyzed,
        marketNoveltyScore,
        assetsIntelligenceActive: !!assetsIntelligence?.parametricBadge,
        parametricBadgeStyle: assetsIntelligence?.parametricBadge?.style,
        designGenomeKey: genomeIntelligence?.mutatedGenome.genomeKey,
        storyHeroConcept: storyDirection?.heroConcept,
        trendIntelligenceScore: trendIntelligence?.trendScore,
        luxuryScore: luxuryScoreValue,
        qualityRefinementPasses,
        sceneQualityScore: sceneDirection?.quality.total,
        sceneType: sceneDirection?.sceneType,
        compositionQualityScore: compositionDirection?.quality.total,
        compositionTemplate: compositionDirection?.templateId,
        ...promptCompilerResponseFields(compiledBackground),
        ...renderEngineResponseFields(renderEngineResult),
        ...constitutionResponseFields(constitutionReports),
        ...briefMeta(designBrief),
      };
    }

    const image = await prisma.generatedImage.create({
      data: {
        userId: input.userId,
        prompt: input.prompt,
        htmlContent: "[SCENE_PIPELINE]",
        imagePath,
        generatedJson: packSdPayload(sdData, appliedStyle, payloadExtras),
        backgroundUrl,
        productCutout: productCutoutPath,
        usedFreeQuota: slot.usedFreeQuota,
      },
    });

    if (sdData.layout === "marketplace") {
      try {
        await prisma.generationHistory.updateMany({
          where: { generatedImage: imagePath },
          data: { generatedImageId: image.id },
        });
      } catch {
        // non-blocking
      }
    }

    return {
      id: image.id,
      imagePath,
      backgroundUrl,
      freeRemaining: balance.unlimited ? -1 : balance.freeRemaining,
      credits: balance.credits,
      unlimited: balance.unlimited,
      aiSource,
      backgroundSource,
      pipelineVersion: PIPELINE_VERSION,
      qualityScore: qualityValidation?.total,
      layoutTemplateId: compositionResult?.layout?.scenarioId,
      designScore: compositionResult?.score?.total,
      seniorAdScore: seniorAdReview?.score,
      seniorAdApproved: seniorAdReview?.approved,
      ctrScore: ctrReview?.score,
      ctrPrediction: ctrReview?.ctrPrediction,
      wouldClick: ctrReview?.wouldClick,
      photoScore: photoReview?.score,
      photoRealism: photoReview?.realism,
      looksLikePhoto: photoReview?.looksLikePhoto,
      chiefApproved: chiefPlan?.approved,
      estimatedScoreAfterFix: chiefPlan?.estimatedScoreAfterFix,
      designMemoryUpdate: designMemory?.memoryUpdate,
      designMemoryAdvice: designMemory?.nextGenerationAdvice,
      knowledgeCategory,
      knowledgePatternsUsed,
      knowledgeAnalysisTriggered,
      marketIntelligenceVersion: marketIntelligence?.marketVersion,
      marketProductsAnalyzed: marketIntelligence?.productsAnalyzed,
      marketNoveltyScore,
      assetsIntelligenceActive: !!assetsIntelligence?.parametricBadge,
      parametricBadgeStyle: assetsIntelligence?.parametricBadge?.style,
      designGenomeKey: genomeIntelligence?.mutatedGenome.genomeKey,
      storyHeroConcept: storyDirection?.heroConcept,
      trendIntelligenceScore: trendIntelligence?.trendScore,
      luxuryScore: luxuryScoreValue,
      qualityRefinementPasses,
      sceneQualityScore: sceneDirection?.quality.total,
      sceneType: sceneDirection?.sceneType,
      compositionQualityScore: compositionDirection?.quality.total,
      compositionTemplate: compositionDirection?.templateId,
      ...promptCompilerResponseFields(compiledBackground),
      ...renderEngineResponseFields(renderEngineResult),
      ...constitutionResponseFields(constitutionReports),
      ...briefMeta(designBrief),
    };
  } catch (error) {
    if (!slot.usedFreeQuota && !slot.balance.unlimited) {
      await prisma.user.update({
        where: { id: input.userId },
        data: { credits: { increment: 1 } },
      });
    }
    throw error;
  }
}
