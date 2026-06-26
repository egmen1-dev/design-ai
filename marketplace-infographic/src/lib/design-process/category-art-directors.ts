import type { ProductCategory } from "@/lib/product-analysis";
import type { CompositionScenarioId } from "@/lib/design/types";

/** Art Director профиль по категории — визуальный стиль, не шаблон координат */
export type CategoryArtDirector = {
  label: string;
  visualStyle: string;
  toneOfVoice: string;
  defaultEmotion: string;
  targetAudience: string;
  styleKeywords: string[];
  preferredScenarios: CompositionScenarioId[];
  sceneEnvironments: string[];
  forbiddenScenes: string[];
};

const BASE: CategoryArtDirector = {
  label: "Универсальный",
  visualStyle: "премиальная предметная съёмка, чистый свет",
  toneOfVoice: "уверенный, лаконичный",
  defaultEmotion: "доверие",
  targetAudience: "покупатели маркетплейса 25–45 лет",
  styleKeywords: ["premium", "clean", "minimal", "studio"],
  preferredScenarios: ["hero_product", "minimal_premium", "commercial_studio"],
  sceneEnvironments: ["чистая студия", "мягкий градиентный фон"],
  forbiddenScenes: ["перегруженный интерьер", "хаотичный фон"],
};

export const CATEGORY_ART_DIRECTORS: Record<ProductCategory, CategoryArtDirector> = {
  home_appliances: {
    label: "Бытовая техника",
    visualStyle: "надёжность, контраст, профессиональная съёмка",
    toneOfVoice: "уверенный, технический, без пафоса",
    defaultEmotion: "спокойствие и контроль",
    targetAudience: "владельцы дома и дачи, ищущие надёжность",
    styleKeywords: ["reliability", "power", "contrast", "outdoor", "garage"],
    preferredScenarios: ["hero_product", "lifestyle", "commercial_studio", "focus_frame"],
    sceneEnvironments: [
      "загородный дом на закате",
      "гараж с мягким светом",
      "терраса с тёплым вечерним светом",
      "мастерская с контрастным светом",
    ],
    forbiddenScenes: ["гостиная с диваном", "спальня", "детская"],
  },
  garden_tools: {
    label: "Сад и инструменты",
    visualStyle: "энергия, свежесть, зелёный контекст",
    toneOfVoice: "динамичный, практичный",
    defaultEmotion: "энергия и контроль",
    targetAudience: "владельцы участков и садоводы",
    styleKeywords: ["garden", "green", "outdoor", "dynamic", "fresh"],
    preferredScenarios: ["lifestyle", "dynamic_diagonal", "hero_product"],
    sceneEnvironments: ["солнечный сад", "зелёный газон", "деревянный забор в боке"],
    forbiddenScenes: ["офис", "тёмная студия"],
  },
  cosmetics: {
    label: "Косметика",
    visualStyle: "минимализм, мягкий свет, премиальные материалы",
    toneOfVoice: "нежный, премиальный, доверительный",
    defaultEmotion: "забота и престиж",
    targetAudience: "женщины 25–45, забота о коже",
    styleKeywords: ["soft light", "minimal", "premium", "clean", "spa"],
    preferredScenarios: ["minimal_premium", "luxury_advertising", "editorial"],
    sceneEnvironments: ["мраморная поверхность", "мягкий дневной свет", "spa-атмосфера"],
    forbiddenScenes: ["гараж", "стройка", "грязный фон"],
  },
  electronics: {
    label: "Электроника",
    visualStyle: "технологичность, холодный свет, чистые линии",
    toneOfVoice: "современный, точный, инновационный",
    defaultEmotion: "восхищение технологией",
    targetAudience: "техно-энтузиасты и мобильные пользователи",
    styleKeywords: ["tech", "gradient", "cold light", "sleek", "futuristic"],
    preferredScenarios: ["tech_showcase", "minimal_premium", "focus_frame"],
    sceneEnvironments: ["тёмный градиентный студийный фон", "неоновый акцент", "чистый пьедестал"],
    forbiddenScenes: ["деревенский дом", "сад"],
  },
  kids: {
    label: "Детские товары",
    visualStyle: "яркие цвета, мягкость, безопасность",
    toneOfVoice: "тёплый, игривый, заботливый",
    defaultEmotion: "радость и безопасность",
    targetAudience: "родители детей 3–12 лет",
    styleKeywords: ["bright", "soft", "safe", "playful", "warm"],
    preferredScenarios: ["lifestyle", "hero_product", "floating_product"],
    sceneEnvironments: ["светлая детская комната", "мягкий пастельный фон", "игровая зона"],
    forbiddenScenes: ["тёмная студия", "агрессивный контраст", "гараж"],
  },
  sport: {
    label: "Спорт",
    visualStyle: "динамика, энергия, движение",
    toneOfVoice: "мотивирующий, сильный",
    defaultEmotion: "сила и достижение",
    targetAudience: "активные люди 20–40 лет",
    styleKeywords: ["dynamic", "energy", "motion", "athletic", "bold"],
    preferredScenarios: ["dynamic_diagonal", "hero_product", "tech_showcase"],
    sceneEnvironments: ["спортзал с размытым фоном", "беговая дорожка", "улица на рассвете"],
    forbiddenScenes: ["спальня", "кухня"],
  },
  fashion: {
    label: "Мода",
    visualStyle: "editorial, премиальная подача, фактура ткани",
    toneOfVoice: "стильный, уверенный",
    defaultEmotion: "престиж и самовыражение",
    targetAudience: "модные покупатели 20–45 лет",
    styleKeywords: ["editorial", "fabric", "fashion", "elegant", "texture"],
    preferredScenarios: ["editorial", "luxury_advertising", "minimal_premium"],
    sceneEnvironments: ["студийный фон с мягким светом", "urban blur background"],
    forbiddenScenes: ["гараж", "стройка"],
  },
  food: {
    label: "Продукты питания",
    visualStyle: "аппетитность, натуральность, тёплый свет",
    toneOfVoice: "дружелюбный, натуральный",
    defaultEmotion: "аппетит и доверие",
    targetAudience: "семьи и ЗОЖ-покупатели",
    styleKeywords: ["fresh", "natural", "warm light", "organic"],
    preferredScenarios: ["lifestyle", "hero_product", "commercial_studio"],
    sceneEnvironments: ["деревянный стол", "кухонный свет", "фермерская эстетика"],
    forbiddenScenes: ["тёмная tech-студия"],
  },
  auto: {
    label: "Авто",
    visualStyle: "брутальность, металл, контраст",
    toneOfVoice: "уверенный, мужественный",
    defaultEmotion: "сила и надёжность",
    targetAudience: "автовладельцы",
    styleKeywords: ["metal", "contrast", "garage", "automotive"],
    preferredScenarios: ["commercial_studio", "hero_product", "dynamic_diagonal"],
    sceneEnvironments: ["гараж", "асфальт", "металлическая поверхность"],
    forbiddenScenes: ["детская", "spa"],
  },
  premium: BASE,
  generic: BASE,
};

/** Генератор внутри home_appliances — отдельный art director */
export const GENERATOR_ART_DIRECTOR: CategoryArtDirector = {
  label: "Генератор / энергия",
  visualStyle: "брутальность, контраст, надёжность, outdoor/garage",
  toneOfVoice: "уверенный, надёжный, без лишних слов",
  defaultEmotion: "спокойствие и уверенность",
  targetAudience: "владельцы загородных домов и дач",
  styleKeywords: ["power", "reliability", "outdoor", "evening light", "contrast"],
  preferredScenarios: ["hero_product", "lifestyle", "focus_frame", "commercial_studio"],
  sceneEnvironments: [
    "загородный дом на закате, тёплый золотой свет",
    "терраса с резервным питанием",
    "гараж с мягким контровым светом",
  ],
  forbiddenScenes: ["гостиная", "спальня", "ванная", "кухня"],
};

export function resolveArtDirector(
  category: ProductCategory,
  productPrompt: string,
): CategoryArtDirector {
  if (/генератор|generator|квт|кВт/i.test(productPrompt)) {
    return GENERATOR_ART_DIRECTOR;
  }
  return CATEGORY_ART_DIRECTORS[category] ?? BASE;
}
