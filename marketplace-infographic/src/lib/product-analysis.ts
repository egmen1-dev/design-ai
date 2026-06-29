export type ProductCategory =
  | "garden_tools"
  | "electronics"
  | "cosmetics"
  | "home_appliances"
  | "fashion"
  | "food"
  | "sport"
  | "kids"
  | "auto"
  | "premium"
  | "generic";

export type PriceSegment = "budget" | "mid" | "premium";
export type AudienceGender = "unisex" | "male" | "female" | "kids";

export type ProductAnalysis = {
  category: ProductCategory;
  priceSegment: PriceSegment;
  audienceGender: AudienceGender;
  brandTone: "modern" | "premium" | "eco" | "sport" | "minimal" | "playful";
  useCases: string[];
  painPoints: string[];
  emotionalTriggers: string[];
  keywords: string[];
};

const CATEGORY_RULES: Array<{ category: ProductCategory; pattern: RegExp }> = [
  { category: "garden_tools", pattern: /триммер|газон|косил|садов|лопат|грабл|опрыск/i },
  { category: "electronics", pattern: /наушник|телефон|планшет|bluetooth|usb|акб|аккумулятор|электрон/i },
  { category: "cosmetics", pattern: /крем|сыворот|космет|spf|шампун|маск[аи]|парфюм/i },
  { category: "home_appliances", pattern: /генератор|generator|пылесос|чайник|робот|бытов|микровол|утюг|стирал|квт|кВт/i },
  { category: "fashion", pattern: /куртк|плать|одежд|обув|размер|хлопок|ткан/i },
  { category: "food", pattern: /еда|продукт|вкус|органик|нутри|калори|состав/i },
  { category: "sport", pattern: /спорт|фитнес|трениров|бег|йог|гантел/i },
  { category: "kids", pattern: /детск|ребён|игруш|школ/i },
  { category: "auto", pattern: /авто|машин|двигател|масл[оа]|шин[аы]/i },
];

export function analyzeProductPrompt(prompt: string): ProductAnalysis {
  const lower = prompt.toLowerCase();
  const keywords = lower
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 2)
    .slice(0, 24);

  const category =
    CATEGORY_RULES.find((rule) => rule.pattern.test(lower))?.category ?? "generic";

  const priceSegment: PriceSegment =
    /премиум|premium|люкс|профессионал|pro\b/i.test(lower)
      ? "premium"
      : /бюджет|дешев|эконом/i.test(lower)
        ? "budget"
        : "mid";

  const audienceGender: AudienceGender = /детск|ребён|игруш/i.test(lower)
    ? "kids"
    : /женск|для неё|девуш/i.test(lower)
      ? "female"
      : /мужск|для него/i.test(lower)
        ? "male"
        : "unisex";

  const brandTone =
    priceSegment === "premium"
      ? "premium"
      : /эко|organic|натурал/i.test(lower)
        ? "eco"
        : /спорт|fitness/i.test(lower)
          ? "sport"
          : category === "electronics"
            ? "modern"
            : "minimal";

  const painPoints: string[] = [];
  if (/шум|громк/i.test(lower)) painPoints.push("шум при работе");
  if (/тяжел|вес/i.test(lower)) painPoints.push("тяжёлый вес");
  if (/сложн|неудоб/i.test(lower)) painPoints.push("сложность использования");
  if (painPoints.length === 0) painPoints.push("сомнения в качестве", "страх переплатить");

  const emotionalTriggers =
    category === "garden_tools"
      ? ["уютный сад", "лёгкая работа", "экономия времени"]
      : category === "cosmetics"
        ? ["красота", "уход", "уверенность"]
        : category === "electronics"
          ? ["технологичность", "удобство", "статус"]
          : ["надёжность", "выгода", "качество"];

  const useCases =
    category === "garden_tools"
      ? ["дача", "газон", "подрезка травы"]
      : category === "electronics"
        ? ["дом", "работа", "путешествия"]
        : ["повседневное использование"];

  return {
    category,
    priceSegment,
    audienceGender,
    brandTone,
    useCases,
    painPoints,
    emotionalTriggers,
    keywords,
  };
}
