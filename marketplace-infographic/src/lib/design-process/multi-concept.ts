import type { DesignDNA } from "@/lib/design/types";
import type { ProductAnalysis } from "@/lib/product-analysis";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import { resolveArtDirector } from "./category-art-directors";
import { resolveArtDirectorMode, type ArtDirectorModeId } from "./art-director-modes";
import {
  CONCEPT_ARCHETYPES,
  type ConceptArchetype,
  type ConceptArchetypeId,
} from "./concept-archetypes";
import type { CreativeDirectorResult } from "./creative-concept";
import { BASE_DNA } from "./dna-constants";

export type MultiConcept = {
  archetypeId: ConceptArchetypeId;
  title: string;
  visualHook: string;
  emotion: string;
  environment: string;
  composition: string;
  lighting: string;
  textStrategy: string;
  backgroundPrompt: string;
  designDNA: Partial<DesignDNA>;
};

function extractSpecs(prompt: string): string[] {
  return prompt
    .split(/[.!?\n;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4)
    .slice(0, 8);
}

function pickHeroSpec(prompt: string, specs: string[]): { value: string; label: string } {
  const kwt = specs.find((s) => /\d[\d.,]*\s*квт/i.test(s));
  if (kwt) {
    const m = kwt.match(/(\d[\d.,]*)\s*кВт/i);
    return { value: m?.[1] ?? "3", label: "кВт" };
  }
  const db = specs.find((s) => /\d+\s*дБ/i.test(s));
  if (db) {
    const m = db.match(/(\d+)\s*дБ/i);
    return { value: m?.[1] ?? "65", label: "дБ" };
  }
  if (/генератор|generator/i.test(prompt)) return { value: "3", label: "кВт" };
  const first = specs.find((s) => /\d/.test(s));
  if (first) {
    const m = first.match(/(\d+(?:[.,]\d+)?)/);
    return { value: m?.[1] ?? "1", label: "параметр" };
  }
  return { value: "★", label: "премиум" };
}

const ARCHETYPE_HEADLINES: Record<ConceptArchetypeId, string[]> = {
  hero_product: ["Сила в каждой детали", "Главный герой кадра", "Выбор профессионалов"],
  lifestyle: ["Создан для вашей жизни", "Комфорт каждый день", "Всегда под рукой"],
  premium_studio: ["Премиальное качество", "Искусство надёжности", "Выше ожиданий"],
  minimal_poster: ["Меньше слов — больше смысла", "Чистый выбор", "Без компромиссов"],
  commercial_photography: ["Профессиональный стандарт", "Качество, которое видно", "Проверено временем"],
  outdoor_advertising: ["Электричество всегда под рукой", "Надёжность на природе", "Сила в любых условиях"],
  technical_focus: ["Мощность без компромиссов", "Точные характеристики", "Инженерное решение"],
  emotional_story: ["Спокойствие в каждом моменте", "Уверенность в завтрашнем дне", "Ваш надёжный партнёр"],
};

function mergeDna(
  archetype: ConceptArchetype,
  modeBias: Partial<DesignDNA>,
  categoryBias: Partial<DesignDNA>,
): Partial<DesignDNA> {
  const merged = { ...BASE_DNA, ...categoryBias, ...modeBias, ...archetype.designDNABias };
  return Object.fromEntries(
    Object.entries(merged).map(([k, v]) => [k, Math.min(100, Math.max(0, Math.round(v as number)))]),
  ) as Partial<DesignDNA>;
}

function buildEnvironment(
  archetype: ConceptArchetype,
  director: ReturnType<typeof resolveArtDirector>,
  analysis: ProductAnalysis,
  index: number,
): string {
  const env =
    director.sceneEnvironments[index % director.sceneEnvironments.length] ??
    director.sceneEnvironments[0];

  switch (archetype.id) {
    case "premium_studio":
      return "luxury catalog studio, seamless backdrop, polished floor";
    case "outdoor_advertising":
      return env.includes("закат") ? env : `${env}, outdoor advertising atmosphere`;
    case "technical_focus":
      return "dark tech gradient studio, clean lines, reflective pedestal";
    case "emotional_story":
      return `${env}, warm emotional bokeh, storytelling atmosphere`;
    case "minimal_poster":
      return "vast negative space, soft neutral tones, editorial minimalism";
    default:
      return env;
  }
}

/** Генерирует ровно 8 принципиально разных концептов */
export function buildEightMultiConcepts(
  prompt: string,
  analysis?: ProductAnalysis,
  modeId: ArtDirectorModeId = "marketplace_ctr",
): MultiConcept[] {
  const a = analysis ?? analyzeProductPrompt(prompt);
  const director = resolveArtDirector(a.category, prompt);
  const mode = resolveArtDirectorMode(modeId);
  const specs = extractSpecs(prompt);
  const hero = pickHeroSpec(prompt, specs);
  const isGenerator = /генератор|generator/i.test(prompt);

  return CONCEPT_ARCHETYPES.map((archetype, index) => {
    const headlines = ARCHETYPE_HEADLINES[archetype.id];
    const headline =
      isGenerator && archetype.id === "outdoor_advertising"
        ? "Электричество всегда под рукой"
        : headlines[index % headlines.length];

    const environment = buildEnvironment(archetype, director, a, index);
    const visualHook = (() => {
      switch (archetype.id) {
        case "hero_product":
          return `Огромный товар на 70% кадра, ${archetype.composition}`;
        case "lifestyle":
          return `Товар в реальной среде: ${environment}, естественная интеграция`;
        case "premium_studio":
          return "Ювелирная студийная подача, много воздуха, премиальный свет";
        case "minimal_poster":
          return "Постер: минимум элементов, товар доминирует, без плашек";
        case "commercial_photography":
          return "Каталожная коммерческая съёмка, чёткий фокус, профессиональный свет";
        case "outdoor_advertising":
          return `Outdoor-реклама: крупный товар, ${environment}, тёплый свет`;
        case "technical_focus":
          return `Технический акцент: ${hero.value} ${hero.label}, чистый tech-фон`;
        case "emotional_story":
          return `Эмоциональная история: ${environment}, товар как решение`;
        default:
          return archetype.composition;
      }
    })();

    const backgroundPrompt = [
      "ultra realistic commercial product photography background",
      environment,
      archetype.lighting,
      "no text, no product, no watermark",
      "photorealistic, 8k, advertising quality",
    ].join(", ");

    return {
      archetypeId: archetype.id,
      title: headline,
      visualHook,
      emotion: director.defaultEmotion,
      environment,
      composition: archetype.composition,
      lighting: archetype.lighting,
      textStrategy: mode.textStrategy,
      backgroundPrompt,
      designDNA: mergeDna(archetype, mode.dnaBias, {}),
    };
  });
}

export function multiConceptToCreativeDirector(
  mc: MultiConcept,
  prompt: string,
  analysis?: ProductAnalysis,
  modeId: ArtDirectorModeId = "marketplace_ctr",
): CreativeDirectorResult {
  const a = analysis ?? analyzeProductPrompt(prompt);
  const archetype = CONCEPT_ARCHETYPES.find((x) => x.id === mc.archetypeId)!;
  const specs = extractSpecs(prompt);
  const hero = pickHeroSpec(prompt, specs);
  const deferred = specs.filter((s) => !s.includes(hero.value)).slice(0, 5);

  return {
    creativeConcept: {
      title: mc.title,
      mainIdea: mc.visualHook.slice(0, 200),
      visualHook: mc.visualHook,
      emotion: mc.emotion,
      marketingGoal: `концепт ${archetype.label}`,
      reason: `${mc.composition}. ${mc.textStrategy}`,
      targetAudience: resolveArtDirector(a.category, prompt).targetAudience,
      toneOfVoice: resolveArtDirectorMode(modeId).textStrategy,
      styleKeywords: [mc.archetypeId, archetype.label],
      whatToSayInOneSecond: mc.title,
    },
    oneThought: {
      question: "Главное преимущество?",
      answer: hero.value,
      answerLabel: hero.label,
      headline: mc.title,
      badge: `${hero.value} ${hero.label}`.trim(),
      deferredSpecs: deferred.length ? deferred : ["гарантия", "качество"],
    },
    sceneNarrative: `${mc.environment}, ${mc.lighting}`,
    compositionScenarioId: archetype.compositionScenarioId,
    archetypeId: mc.archetypeId,
    multiConcept: mc,
  };
}
