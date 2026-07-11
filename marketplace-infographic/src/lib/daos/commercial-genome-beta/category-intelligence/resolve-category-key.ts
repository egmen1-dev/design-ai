import type { CategoryIntelligenceKey } from "./types";

type CategoryMatcher = {
  key: CategoryIntelligenceKey;
  keywords: string[];
  priority: number;
};

const MATCHERS: CategoryMatcher[] = [
  {
    key: "pressure-wash",
    priority: 10,
    keywords: [
      "мойк",
      "давлен",
      "karcher",
      "минимойк",
      "автомойк",
      "пеногенератор",
      "аккумуляторная мойка",
    ],
  },
  {
    key: "humidifier",
    priority: 9,
    keywords: [
      "увлажнител",
      "осушител",
      "очистител воздух",
      "климат",
      "ионизатор",
      "увлажнение",
    ],
  },
  {
    key: "kitchen",
    priority: 8,
    keywords: [
      "кухон",
      "блендер",
      "миксер",
      "мультивар",
      "чайник",
      "тостер",
      "соковыжим",
      "кофемашин",
      "посуда",
      "кастрюл",
      "сковород",
      "нож",
      "терка",
    ],
  },
  {
    key: "home",
    priority: 7,
    keywords: [
      "органайзер",
      "для дома",
      " дом ",
      "полка",
      "корзин",
      "ящик",
      "хранен",
      "вешалк",
      "подставк",
      "контейнер",
      "пылесос",
      "швабр",
    ],
  },
];

function normalize(text: string): string {
  return ` ${text.trim().toLowerCase().replace(/\s+/g, " ")} `;
}

/**
 * Resolve harvest-aligned category key from product title / prompt.
 * Explicit category override takes precedence when it matches wave-1 keys.
 */
export function resolveCategoryIntelligenceKey(input: {
  productTitle?: string;
  category?: string;
}): CategoryIntelligenceKey | null {
  const explicit = (input.category ?? "").trim().toLowerCase();
  if (
    explicit === "home" ||
    explicit === "kitchen" ||
    explicit === "humidifier" ||
    explicit === "pressure-wash"
  ) {
    return explicit;
  }

  const text = normalize(input.productTitle ?? "");
  if (!text.trim()) return null;

  let best: { key: CategoryIntelligenceKey; priority: number } | null = null;

  for (const matcher of MATCHERS) {
    for (const kw of matcher.keywords) {
      if (text.includes(kw)) {
        if (!best || matcher.priority > best.priority) {
          best = { key: matcher.key, priority: matcher.priority };
        }
        break;
      }
    }
  }

  return best?.key ?? null;
}
