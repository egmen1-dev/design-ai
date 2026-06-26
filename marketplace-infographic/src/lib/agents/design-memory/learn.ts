import type { ProductCategory } from "@/lib/product-analysis";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { CardMeaning, LayoutTemplateId } from "@/lib/layout-engine/types";
import type { SeniorArtDirectorReview } from "../senior-art-director/types";
import type { MarketplaceCtrReview } from "../marketplace-ctr-expert/types";
import type { CommercialPhotographerReview } from "../commercial-photographer/types";
import type { ChiefDesignDirectorPlan } from "../chief-design-director/types";
import type {
  CategoryMemory,
  DesignMemoryStore,
  PatternCombo,
  WeightChange,
  WeightEntry,
} from "./types";
import {
  MEMORY_EMA_ALPHA,
  MEMORY_OVERUSE_THRESHOLD,
  MEMORY_OVERUSE_WINDOW,
} from "./types";

export type DesignMemoryLearnInput = {
  productPrompt: string;
  category: ProductCategory;
  templateId?: LayoutTemplateId;
  fontId?: string | null;
  badgeId?: string | null;
  scenePlan?: ScenePlan;
  designScore?: number;
  cardMeaning?: CardMeaning;
  seniorAdReview?: SeniorArtDirectorReview;
  ctrReview?: MarketplaceCtrReview;
  photoReview?: CommercialPhotographerReview;
  chiefPlan?: ChiefDesignDirectorPlan;
  userFeedback?: "like" | "dislike";
  ctr?: number;
  viewTimeMs?: number;
};

export type LearnResult = {
  store: DesignMemoryStore;
  outcome: number;
  successfulPatterns: PatternCombo[];
  unsuccessfulPatterns: PatternCombo[];
  recommendedWeightChanges: WeightChange[];
};

const SUCCESS_OUTCOME = 0.55;

function emaUpdate(entry: WeightEntry | undefined, outcome: number, alpha: number): WeightEntry {
  const prev = entry ?? { weight: 0.5, samples: 0, avgScore: 0.5 };
  const weight = alpha * outcome + (1 - alpha) * prev.weight;
  const samples = prev.samples + 1;
  const avgScore = alpha * outcome + (1 - alpha) * prev.avgScore;
  return { weight, samples, avgScore };
}

function upsertWeight(
  map: Record<string, WeightEntry>,
  key: string,
  outcome: number,
  changes: WeightChange[],
  reason: string,
): void {
  const before = map[key]?.weight ?? 0.5;
  map[key] = emaUpdate(map[key], outcome, MEMORY_EMA_ALPHA);
  const delta = map[key].weight - before;
  if (Math.abs(delta) >= 0.01) {
    changes.push({ key, delta: Number(delta.toFixed(3)), reason });
  }
}

export function computeOutcomeScore(input: DesignMemoryLearnInput): number {
  let score = 0.25;

  if (input.chiefPlan?.approved) score += 0.35;
  if (input.seniorAdReview?.approved) score += 0.2;
  if (input.ctrReview?.wouldClick) score += 0.2;
  if (input.photoReview?.looksLikePhoto) score += 0.2;
  if (input.userFeedback === "like") score += 0.25;
  if (input.userFeedback === "dislike") score -= 0.45;

  if (typeof input.designScore === "number") {
    score += (input.designScore / 100) * 0.15;
  }
  if (typeof input.ctr === "number") {
    score += Math.min(0.1, input.ctr * 0.1);
  }
  if (typeof input.viewTimeMs === "number" && input.viewTimeMs > 3000) {
    score += 0.05;
  }

  return Math.max(0, Math.min(1, score));
}

export function lightingKey(scene?: ScenePlan): string {
  if (!scene) return "unknown";
  const temp = scene.lightingTemperature.toLowerCase();
  const warm =
    temp.includes("warm") || /\b[34]\d{3}\b/.test(temp)
      ? "warm"
      : temp.includes("cool") || /\b[678]\d{3}\b/.test(temp)
        ? "cool"
        : "neutral";
  const dir = scene.lightingDirection
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24);
  return `${warm}_${dir || "studio"}`;
}

export function backgroundKey(scene?: ScenePlan): string {
  if (!scene) return "unknown";
  return scene.backgroundType
    ? scene.backgroundType.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 32)
    : scene.surfaceType;
}

export function compositionKey(scene?: ScenePlan, templateId?: LayoutTemplateId): string {
  if (scene?.compositionScenario) return scene.compositionScenario;
  return templateId ?? "balanced";
}

function ensureCategory(store: DesignMemoryStore, category: ProductCategory): CategoryMemory {
  if (!store.categories[category]) {
    store.categories[category] = {
      samples: 0,
      layoutWeights: {},
      lightingWeights: {},
      backgroundWeights: {},
      avgDesignScore: 0.5,
    };
  }
  return store.categories[category]!;
}

function buildComboKey(input: DesignMemoryLearnInput): string {
  return [
    input.category,
    input.templateId ?? "no_layout",
    lightingKey(input.scenePlan),
    backgroundKey(input.scenePlan),
    input.fontId ?? "default_font",
    input.badgeId ?? "no_badge",
  ].join("*");
}

function trackTemplateUsage(store: DesignMemoryStore, templateId?: LayoutTemplateId): void {
  if (!templateId) return;
  store.recentTemplateUsage = [...store.recentTemplateUsage, templateId].slice(
    -MEMORY_OVERUSE_WINDOW,
  );
}

function refreshAvoidPatterns(store: DesignMemoryStore): void {
  const counts = new Map<string, number>();
  for (const id of store.recentTemplateUsage) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const overused = [...counts.entries()]
    .filter(([, count]) => count >= MEMORY_OVERUSE_THRESHOLD)
    .map(([id]) => `overused_layout:${id}`);

  const lowPerformers = Object.entries(store.layoutWeights)
    .filter(([, entry]) => entry.samples >= 3 && entry.weight < 0.38)
    .map(([id]) => `weak_layout:${id}`);

  store.avoidPatterns = [...new Set([...overused, ...lowPerformers])].slice(0, 12);
}

export function learnFromGeneration(
  store: DesignMemoryStore,
  input: DesignMemoryLearnInput,
): LearnResult {
  const outcome = computeOutcomeScore(input);
  const successful = outcome >= SUCCESS_OUTCOME;
  const changes: WeightChange[] = [];
  const comboKey = buildComboKey(input);

  store.totalSamples += 1;
  trackTemplateUsage(store, input.templateId);

  const categoryMem = ensureCategory(store, input.category);
  categoryMem.samples += 1;
  categoryMem.avgDesignScore =
    MEMORY_EMA_ALPHA * outcome + (1 - MEMORY_EMA_ALPHA) * categoryMem.avgDesignScore;

  if (input.templateId) {
    upsertWeight(
      store.layoutWeights,
      input.templateId,
      outcome,
      changes,
      successful ? "layout performed well" : "layout underperformed",
    );
    upsertWeight(
      categoryMem.layoutWeights,
      input.templateId,
      outcome,
      changes,
      `category ${input.category} layout signal`,
    );
  }

  const fontKey = input.fontId ?? "default_font";
  upsertWeight(store.fontWeights, fontKey, outcome, changes, "font signal");

  const badgeKey = input.badgeId ?? "no_badge";
  upsertWeight(store.badgeWeights, badgeKey, outcome, changes, "badge signal");

  const lightKey = lightingKey(input.scenePlan);
  upsertWeight(store.lightingWeights, lightKey, outcome, changes, "lighting signal");
  upsertWeight(categoryMem.lightingWeights, lightKey, outcome, changes, "category lighting");

  const bgKey = backgroundKey(input.scenePlan);
  upsertWeight(store.backgroundWeights, bgKey, outcome, changes, "background signal");
  upsertWeight(categoryMem.backgroundWeights, bgKey, outcome, changes, "category background");

  const compKey = compositionKey(input.scenePlan, input.templateId);
  upsertWeight(store.compositionWeights, compKey, outcome, changes, "composition signal");

  const comboBefore = store.comboScores[comboKey]?.weight ?? 0.5;
  store.comboScores[comboKey] = emaUpdate(store.comboScores[comboKey], outcome, MEMORY_EMA_ALPHA);
  const comboDelta = store.comboScores[comboKey].weight - comboBefore;

  refreshAvoidPatterns(store);

  const combo: PatternCombo = {
    pattern: comboKey,
    delta: Number(comboDelta.toFixed(2)),
    samples: store.comboScores[comboKey].samples,
  };

  return {
    store,
    outcome,
    successfulPatterns: successful ? [combo] : [],
    unsuccessfulPatterns: successful ? [] : [combo],
    recommendedWeightChanges: changes,
  };
}
