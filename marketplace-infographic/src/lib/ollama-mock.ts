import type { InfographicData } from "./infographic-template";

type ProductCategory =
  | "generator"
  | "cosmetics"
  | "electronics"
  | "clothing"
  | "home"
  | "generic";

const CATEGORY_HINTS: Record<Exclude<ProductCategory, "generic">, string[]> = {
  generator: ["генератор", "бензин", "инвертор", "электростанц", "квт", "кВт"],
  cosmetics: ["крем", "сыворот", "шампун", "космет", "уход", "кож", "spf", "маск", "помад", "духи"],
  electronics: ["наушник", "телефон", "ноутбук", "bluetooth", "usb", "заряд", "кабель", "колонк", "планшет"],
  clothing: ["куртк", "плать", "футболк", "джинс", "одежд", "размер", "хлопок", "кроссовк", "обув"],
  home: ["пылесос", "чайник", "термос", "посуда", "дом", "кухн", "уборк", "ламп", "подушк"],
};

const CATEGORY_EMOJI: Record<ProductCategory, string> = {
  generator: "⚡",
  cosmetics: "✨",
  electronics: "🎧",
  clothing: "👕",
  home: "🏠",
  generic: "📦",
};

const CATEGORY_SCENE: Record<ProductCategory, InfographicData["backgroundScene"]> = {
  generator: "outdoor_home",
  cosmetics: "bathroom",
  electronics: "office",
  clothing: "nature",
  home: "kitchen",
  generic: "studio",
};

const CATEGORY_ACCENT: Record<ProductCategory, InfographicData["accentColor"]> = {
  generator: "red",
  cosmetics: "purple",
  electronics: "blue",
  clothing: "green",
  home: "red",
  generic: "blue",
};

const CATEGORY_TITLE: Record<ProductCategory, string> = {
  generator: "ГЕНЕРАТОР",
  cosmetics: "КРЕМ",
  electronics: "НАУШНИКИ",
  clothing: "КУРТКА",
  home: "ПЫЛЕСОС",
  generic: "ТОВАР",
};

const CATEGORY_PILL: Record<ProductCategory, string> = {
  generator: "бензиновый",
  cosmetics: "для лица",
  electronics: "беспроводные",
  clothing: "зимний",
  home: "для дома",
  generic: "новинка",
};

/** Демо-ответ без Ollama */
export function generateMockInfographicData(prompt: string): InfographicData {
  const category = detectCategory(prompt);
  const productName = buildProductName(prompt);
  const specBlocks = extractSpecBlocks(prompt, category);
  const callouts = extractCallouts(prompt, category);
  const headline = CATEGORY_TITLE[category];
  const categoryPill = CATEGORY_PILL[category];
  const brandMatch = productName.match(/\b([A-ZА-Я][a-zа-яA-ZА-Я0-9-]+)\b/);

  return {
    headline,
    productName,
    categoryPill,
    brandName: brandMatch?.[1],
    productEmoji: CATEGORY_EMOJI[category],
    productVisual: category === "generator" ? "generator" : category === "cosmetics" ? "cosmetic" : category === "home" ? "appliance" : "generic",
    backgroundScene: CATEGORY_SCENE[category],
    specBlocks,
    mainBanner: buildMainBanner(prompt, category),
    callouts,
    accentColor: CATEGORY_ACCENT[category],
  };
}

function detectCategory(prompt: string): ProductCategory {
  const lower = prompt.toLowerCase();
  for (const category of Object.keys(CATEGORY_HINTS) as Exclude<ProductCategory, "generic">[]) {
    if (CATEGORY_HINTS[category].some((hint) => lower.includes(hint))) {
      return category;
    }
  }
  return "generic";
}

function buildProductName(prompt: string): string {
  const words = prompt.split(/\s+/).filter(Boolean);
  const name = words.slice(0, 8).join(" ").slice(0, 80).trim();
  return name.charAt(0).toUpperCase() + name.slice(1) || "Ваш товар";
}


function extractSpecBlocks(
  prompt: string,
  category: ProductCategory,
): InfographicData["specBlocks"] {
  const blocks: InfographicData["specBlocks"] = [];

  const powerMatch = prompt.match(/(\d+(?:[.,]\d+)?)\s*(?:квт|кВт)/i);
  if (powerMatch) {
    blocks.push({
      value: powerMatch[1].replace(",", "."),
      label: "кВт мощность",
      hint: "Стабильная работа дома и на даче",
    });
  }

  const literMatch = prompt.match(/(\d+(?:[.,]\d+)?)\s*литр/i);
  if (literMatch) {
    blocks.push({
      value: `${literMatch[1].replace(",", ".")} литров`,
      label: "объём бака",
      hint: "Долгая работа без дозаправки",
    });
  }

  const patterns: [RegExp, string, string?, boolean?][] = [
    [/(\d+(?:[.,]\d+)?)\s*(?:вт|Вт)/i, "Вт мощность", "Стабильная мощность", true],
    [/(\d+(?:[.,]\d+)?)\s*л\s*\/\s*час/i, "л/час расход", "Экономичный режим"],
    [/(\d+(?:[.,]\d+)?)\s*(?:дб|дБ|db)/i, "дБ шум", "Комфортная работа"],
    [/(\d+(?:[.,]\d+)?)\s*(?:мл|ml)/i, "Объём", "Удобный формат"],
    [/spf\s*(\d+)/i, "SPF", "Защита от солнца", true],
    [/(\d+)\s*час/i, "часов", "Долгая автономность", true],
    [/(\d+(?:[.,]\d+)?)\s*(?:па|Па)/i, "Па всасывание", "Глубокая уборка"],
  ];

  for (const [pattern, label, hint, numberOnly] of patterns) {
    if (blocks.length >= 2) break;
    const match = prompt.match(pattern);
    if (match) {
      blocks.push({
        value: numberOnly ? match[1] : match[0].trim().slice(0, 30),
        label,
        hint,
      });
    }
  }

  if (blocks.length >= 2) return blocks.slice(0, 2);

  const defaults: Record<ProductCategory, InfographicData["specBlocks"]> = {
    generator: [
      { value: "3", label: "кВт мощность", hint: "Стабильная работа дома и на даче" },
      { value: "15 литров", label: "объём бака", hint: "Долгая работа без дозаправки" },
    ],
    cosmetics: [
      { value: "50 мл", label: "Объём", hint: "Хватает на курс ухода" },
      { value: "SPF 30", label: "Защита", hint: "Ежедневная защита от солнца" },
    ],
    electronics: [
      { value: "30 часов", label: "Автономность", hint: "Несколько дней без зарядки" },
      { value: "Bluetooth 5.3", label: "Подключение", hint: "Стабильная связь с устройством" },
    ],
    clothing: [
      { value: "S–XXL", label: "Размеры", hint: "Широкая размерная сетка" },
      { value: "200 г", label: "Утеплитель", hint: "Тепло в мороз до −20°C" },
    ],
    home: [
      { value: "5000 Па", label: "Мощность всасывания", hint: "Убирает пыль и крошки" },
      { value: "2.5 л", label: "Объём пылесборника", hint: "Реже нужно очищать" },
    ],
    generic: [
      { value: "12 мес", label: "Гарантия", hint: "Официальная гарантия производителя" },
      { value: "1–3 дня", label: "Доставка", hint: "Быстрая отправка со склада" },
    ],
  };

  return [...blocks, ...defaults[category]].slice(0, 2);
}

function buildMainBanner(
  prompt: string,
  category: ProductCategory,
): InfographicData["mainBanner"] {
  const lower = prompt.toLowerCase();

  if (category === "generator" || /генератор|квт|кВт/i.test(lower)) {
    const kwMatch = prompt.match(/(\d+(?:[.,]\d+)?)\s*(?:квт|кВт)/i);
    const kw = kwMatch ? parseFloat(kwMatch[1].replace(",", ".")) : 3;
    const watts = Math.round(kw * 1000);
    return {
      icon: "⚡",
      title: `${watts} Вт стабильная мощность`,
      description: "Хватает для холодильника, освещения и инструмента",
    };
  }

  const sentences = prompt
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  if (sentences[0]) {
    return {
      icon: "★",
      title: sentences[0].slice(0, 60),
      description:
        sentences[1]?.slice(0, 120) ??
        "Главное преимущество, которое заметит покупатель сразу",
    };
  }

  const defaults: Record<ProductCategory, InfographicData["mainBanner"]> = {
    generator: {
      icon: "⚡",
      title: "3000 Вт стабильная мощность",
      description: "Хватает для холодильника, освещения и инструмента",
    },
    cosmetics: {
      icon: "✨",
      title: "Видимый результат уже через неделю",
      description: "Формула для ежедневного ухода и комфорта кожи",
    },
    electronics: {
      icon: "🔋",
      title: "Долгая автономность без подзарядки",
      description: "Хватает на поездки, работу и активный день",
    },
    clothing: {
      icon: "🛡",
      title: "Защита от ветра и влаги",
      description: "Подходит для активного отдыха и города",
    },
    home: {
      icon: "⚡",
      title: "Мощная уборка без лишних усилий",
      description: "Справляется с пылью, крошками и шерстью",
    },
    generic: {
      icon: "★",
      title: "Проверенное качество для ежедневного использования",
      description: "Всё главное — на одном наглядном слайде",
    },
  };

  return defaults[category];
}

function extractCallouts(
  prompt: string,
  category: ProductCategory,
): InfographicData["callouts"] {
  const sentences = prompt
    .split(/[.!?\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && s.length < 80)
    .slice(0, 4);

  if (sentences.length >= 2) {
    const positions: InfographicData["callouts"][number]["position"][] = [
      "bottom-left",
      "middle-right",
      "bottom-right",
      "middle-left",
    ];
    return sentences.slice(0, 3).map((text, i) => ({
      text,
      position: positions[i] ?? "bottom-left",
    }));
  }

  const defaults: Record<ProductCategory, InfographicData["callouts"]> = {
    generator: [
      { text: "Защита от перегрузки и короткого замыкания", position: "bottom-left" },
      { text: "Автоотключение при низком уровне масла", position: "middle-right" },
    ],
    cosmetics: [
      { text: "Гипоаллергенная формула для чувствительной кожи", position: "bottom-left" },
      { text: "Лёгкая текстура без липкости", position: "middle-right" },
    ],
    electronics: [
      { text: "Активное шумоподавление для города и дороги", position: "bottom-left" },
      { text: "Влагозащита для спорта и дождя", position: "middle-right" },
    ],
    clothing: [
      { text: "Мембранная ткань от ветра и осадков", position: "bottom-left" },
      { text: "6 практичных карманов для мелочей", position: "middle-right" },
    ],
    home: [
      { text: "Лазерная навигация по комнатам", position: "bottom-left" },
      { text: "Управление через приложение", position: "middle-right" },
    ],
    generic: [
      { text: "Гарантия производителя 12 месяцев", position: "bottom-left" },
      { text: "Быстрая доставка по всей России", position: "middle-right" },
    ],
  };

  return defaults[category];
}
