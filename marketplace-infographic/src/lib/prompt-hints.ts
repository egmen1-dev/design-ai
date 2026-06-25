export type PromptHintId = "name" | "specs" | "usp" | "features";

export type PromptHint = {
  id: PromptHintId;
  title: string;
  description: string;
  example: string;
  insertText: string;
};

export const PROMPT_HINTS: PromptHint[] = [
  {
    id: "name",
    title: "Название и бренд",
    description: "Как называется товар — AI вынесет это на слайд",
    example: "Бензиновый генератор Kronwerk 3 кВт",
    insertText: "Бензиновый генератор Kronwerk 3 кВт",
  },
  {
    id: "specs",
    title: "2 цифры для характеристик",
    description: "Объём, мощность, время, вес — попадут в красные блоки",
    example: "бак 15 литров, расход 1,25 л/час",
    insertText: "бак 15 литров, расход 1,25 л/час",
  },
  {
    id: "usp",
    title: "Главная выгода",
    description: "Одна фраза для крупного заголовка и синего баннера",
    example: "низкий уровень шума 65 дБ",
    insertText: "низкий уровень шума 65 дБ",
  },
  {
    id: "features",
    title: "2–3 функции товара",
    description: "Станут подписями-указателями на инфографике",
    example:
      "защита от перегрузки, автоотключение при низком уровне масла",
    insertText:
      "защита от перегрузки и короткого замыкания, автоматическое отключение при низком уровне масла",
  },
];

const USP_PATTERN =
  /тих|шум|дб|эконом|расход|быстр|защит|комфорт|надёж|надеж|лёгк|легк|мощн|долг|удобн|эффектив|качеств|премиум|оригинал|гарант/i;

export type AnalyzedHint = PromptHint & {
  satisfied: boolean;
  missingTip: string;
};

export type PromptAnalysis = {
  hints: AnalyzedHint[];
  satisfiedCount: number;
  total: number;
  readiness: "low" | "medium" | "high";
  summary: string;
};

function countClauses(text: string): number {
  return text
    .split(/[.!?\n;,]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 8).length;
}

function hasName(prompt: string): boolean {
  const words = prompt.trim().split(/\s+/).filter(Boolean);
  return words.length >= 3 && prompt.trim().length >= 18;
}

function hasSpecs(prompt: string): boolean {
  const numericChunks = prompt.match(/\d+[\d.,]*/g) ?? [];
  return numericChunks.length >= 2;
}

function hasUsp(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (USP_PATTERN.test(lower)) return true;
  return countClauses(prompt) >= 2 && prompt.length >= 40;
}

function hasFeatures(prompt: string): boolean {
  return countClauses(prompt) >= 3;
}

const CHECKERS: Record<PromptHintId, (prompt: string) => boolean> = {
  name: hasName,
  specs: hasSpecs,
  usp: hasUsp,
  features: hasFeatures,
};

const MISSING_TIPS: Record<PromptHintId, string> = {
  name: "Укажите тип товара и бренд",
  specs: "Добавьте минимум две цифры: объём, мощность, время, вес",
  usp: "Опишите главную выгоду: тихий, экономичный, мощный…",
  features: "Перечислите 2–3 конкретные функции через запятую",
};

export function analyzePrompt(prompt: string): PromptAnalysis {
  const hints: AnalyzedHint[] = PROMPT_HINTS.map((hint) => {
    const satisfied = CHECKERS[hint.id](prompt);
    return {
      ...hint,
      satisfied,
      missingTip: MISSING_TIPS[hint.id],
    };
  });

  const satisfiedCount = hints.filter((hint) => hint.satisfied).length;
  const total = hints.length;

  let readiness: PromptAnalysis["readiness"] = "low";
  let summary =
    "Добавьте детали — так AI точнее соберёт заголовок, блоки и подписи.";

  if (satisfiedCount >= total) {
    readiness = "high";
    summary = "Отлично! AI получит всё нужное для точной инфографики.";
  } else if (satisfiedCount >= 2) {
    readiness = "medium";
    summary = "Уже неплохо — допишите пару пунктов для более изящного слайда.";
  }

  return { hints, satisfiedCount, total, readiness, summary };
}

export function appendHintToPrompt(prompt: string, insertText: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return insertText;
  const separator = /[.!?]$/.test(trimmed) ? " " : ". ";
  return `${trimmed}${separator}${insertText}`;
}
