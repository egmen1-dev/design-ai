import type { ProductAnalysis } from "@/lib/product-analysis";
import { analyzeProductPrompt } from "@/lib/product-analysis";

/** Рекламная идея карточки — до любой вёрстки */
export type CreativeConcept = {
  title: string;
  mainIdea: string;
  visualHook: string;
  emotion: string;
  marketingGoal: string;
  reason: string;
};

export type OneThought = {
  /** Единственный вопрос, на который отвечает обложка */
  question: string;
  /** Короткий ответ — одна цифра или фраза */
  answer: string;
  answerLabel: string;
  /** Рекламный заголовок (не название товара) */
  headline: string;
  /** Маленький бейдж, напр. «3 кВт» */
  badge?: string;
  /** Остальные характеристики — для следующих слайдов */
  deferredSpecs: string[];
};

export type CreativeDirectorResult = {
  creativeConcept: CreativeConcept;
  oneThought: OneThought;
  sceneNarrative: string;
};

function extractSpecs(prompt: string): string[] {
  const parts = prompt
    .split(/[.!?\n;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);
  return parts.slice(0, 8);
}

function pickHeroSpec(prompt: string, specs: string[]): { value: string; label: string } {
  const kw = prompt.toLowerCase();
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
  const warranty = specs.find((s) => /гарант|месяц/i.test(s));
  if (warranty) {
    const m = warranty.match(/(\d+)\s*месяц/i);
    return { value: m?.[1] ?? "12", label: "мес. гарантии" };
  }
  const liters = specs.find((s) => /\d+\s*л(?:итр)?/i.test(s));
  if (liters) {
    const m = liters.match(/(\d+)\s*л/i);
    return { value: m?.[1] ?? "15", label: "литров" };
  }
  if (/генератор|generator/i.test(kw)) {
    return { value: "3", label: "кВт" };
  }
  const first = specs.find((s) => /\d/.test(s));
  if (first) {
    const m = first.match(/(\d+(?:[.,]\d+)?)/);
    return { value: m?.[1] ?? "1", label: first.replace(/\d+(?:[.,]\d+)?\s*/, "").slice(0, 20) || "параметр" };
  }
  return { value: "★", label: "премиум" };
}

/** Детерминированный Creative Director для mock / fallback */
export function buildMockCreativeDirector(
  prompt: string,
  analysis?: ProductAnalysis,
): CreativeDirectorResult {
  const a = analysis ?? analyzeProductPrompt(prompt);
  const specs = extractSpecs(prompt);
  const hero = pickHeroSpec(prompt, specs);
  const isGenerator = /генератор|generator/i.test(prompt);
  const isGarden = a.category === "garden_tools";

  const deferred = specs
    .filter((s) => !s.includes(hero.value) || !s.toLowerCase().includes(hero.label.toLowerCase().slice(0, 3)))
    .slice(0, 5);

  if (isGenerator) {
    return {
      creativeConcept: {
        title: "Электричество всегда под рукой",
        mainIdea: "Генератор, который всегда выручит в загородном доме",
        visualHook:
          "Огромный генератор на 70% кадра, тёплый вечерний свет, дом на заднем плане — ощущение надёжности",
        emotion: "спокойствие и уверенность",
        marketingGoal: "показать надёжность резервного питания",
        reason: "Покупатель ищет не характеристики, а уверенность что не останется без света",
      },
      oneThought: {
        question: "Достаточно ли мощности?",
        answer: hero.value,
        answerLabel: hero.label,
        headline: "Электричество всегда под рукой",
        badge: `${hero.value} ${hero.label}`,
        deferredSpecs: deferred.length ? deferred : ["бак 15 литров", "65 дБ тихая работа", "гарантия 12 месяцев"],
      },
      sceneNarrative:
        "Загородный дом на закате, генератор на переднем плане, тёплый золотой свет, уютная атмосфера",
    };
  }

  if (isGarden) {
    return {
      creativeConcept: {
        title: "Сад без усилий",
        mainIdea: "Профессиональный инструмент для идеального газона",
        visualHook: "Крупный товар на фоне зелёного сада, динамика и свежесть",
        emotion: "энергия и контроль",
        marketingGoal: "показать мощность и удобство",
        reason: "Садовая техника продаётся через ощущение лёгкости работы",
      },
      oneThought: {
        question: "Хватит ли мощности?",
        answer: hero.value,
        answerLabel: hero.label,
        headline: "Сад без усилий",
        badge: hero.label.includes("об") ? `${hero.value} об/мин` : undefined,
        deferredSpecs: deferred,
      },
      sceneNarrative: "Солнечный сад, зелёный газон, товар как герой кадра",
    };
  }

  return {
    creativeConcept: {
      title: "Профессиональный выбор",
      mainIdea: "Товар, который говорит сам за себя",
      visualHook: "Минимум текста, максимум продукта — премиальная предметная съёмка",
      emotion: a.priceSegment === "premium" ? "престиж" : "доверие",
      marketingGoal: "остановить взгляд на товаре",
      reason: "Первая карточка продаёт внимание, не характеристики",
    },
    oneThought: {
      question: "Почему этот товар?",
      answer: hero.value,
      answerLabel: hero.label,
      headline: "Профессиональный выбор",
      badge: `${hero.value} ${hero.label}`.trim(),
      deferredSpecs: deferred,
    },
    sceneNarrative: "Чистая студийная сцена, мягкий свет, товар доминирует в кадре",
  };
}

export function sanitizeCreativeConcept(raw: unknown, fallback: CreativeConcept): CreativeConcept {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const cc = (o.creativeConcept ?? o) as Record<string, unknown>;
  return {
    title: String(cc.title ?? fallback.title).slice(0, 80),
    mainIdea: String(cc.mainIdea ?? fallback.mainIdea).slice(0, 200),
    visualHook: String(cc.visualHook ?? fallback.visualHook).slice(0, 300),
    emotion: String(cc.emotion ?? fallback.emotion).slice(0, 80),
    marketingGoal: String(cc.marketingGoal ?? fallback.marketingGoal).slice(0, 120),
    reason: String(cc.reason ?? fallback.reason).slice(0, 300),
  };
}

export function sanitizeOneThought(raw: unknown, fallback: OneThought): OneThought {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const ot = (o.oneThought ?? o) as Record<string, unknown>;
  const deferred = Array.isArray(ot.deferredSpecs)
    ? ot.deferredSpecs.map((s) => String(s).slice(0, 80)).slice(0, 6)
    : fallback.deferredSpecs;
  return {
    question: String(ot.question ?? fallback.question).slice(0, 100),
    answer: String(ot.answer ?? fallback.answer).slice(0, 20),
    answerLabel: String(ot.answerLabel ?? fallback.answerLabel).slice(0, 40),
    headline: String(ot.headline ?? fallback.headline).slice(0, 60),
    badge: ot.badge ? String(ot.badge).slice(0, 24) : fallback.badge,
    deferredSpecs: deferred,
  };
}
