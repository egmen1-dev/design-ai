import type { ProductCategory } from "@/lib/product-analysis";
import type { DesignProcessFoundation } from "./types";

export function buildMockFoundation(
  productPrompt: string,
  category: ProductCategory,
): DesignProcessFoundation {
  const isTrimmer = category === "garden_tools";
  const isKids = category === "kids";

  if (isKids) {
    return {
      stage1: {
        category,
        dimensions: "средний",
        shape: "округлая",
        materials: ["пластик"],
        color: "яркий",
        purpose: "игра и развитие",
        priceSegment: "mid",
        emotionalPerception: "радость, безопасность",
        targetAudience: "родители детей 3–8 лет",
      },
      visualHook: {
        type: "emotional_background",
        reason: "Для детских товаров эмоции работают лучше технических характеристик.",
        confidence: 94,
      },
      stage2: {
        concept: "Тёплая семейная карточка",
        creativeDirection: "Мягкий свет, уютная среда, акцент на эмоциональной связи",
        mood: "радостный, доверительный",
        references: ["детская предметная съёмка", "pastel lifestyle"],
        whyThisConcept: "Родители покупают эмоцию безопасности и радости ребёнка",
      },
    };
  }

  if (isTrimmer) {
    return {
      stage1: {
        category,
        dimensions: "длинный инструмент",
        shape: "вертикальная",
        materials: ["пластик", "металл"],
        color: "чёрно-зелёный",
        purpose: "уход за газоном",
        priceSegment: "mid",
        emotionalPerception: "мощность, надёжность",
        targetAudience: "владельцы частных домов",
      },
      visualHook: {
        type: "power_number",
        reason: "Ключевой триггер — мощность 1300 Вт и автономность АКБ.",
        confidence: 96,
      },
      stage2: {
        concept: "Премиальная садовая съёмка",
        creativeDirection: "Солнечный газон, крупный товар, цифры мощности как якорь",
        mood: "уверенный, профессиональный",
        references: ["commercial garden tool photography", "golden hour outdoor"],
        whyThisConcept: productPrompt.slice(0, 120),
      },
    };
  }

  return {
    stage1: {
      category,
      dimensions: "стандартный",
      shape: "компактная",
      materials: ["смешанные"],
      color: "нейтральный",
      purpose: "повседневное использование",
      priceSegment: "mid",
      emotionalPerception: "качество, выгода",
      targetAudience: "широкая аудитория WB",
    },
    visualHook: {
      type: "oversized_product",
      reason: "Форма товара позволяет сделать его главным визуальным якорем карточки.",
      confidence: 90,
    },
    stage2: {
      concept: "Студийная коммерческая карточка",
      creativeDirection: "Чистый фон, крупный продукт, читаемые УТП",
      mood: "профессиональный, доверительный",
      references: ["marketplace hero product", "studio commercial"],
      whyThisConcept: "Максимальная читаемость и фокус на товаре для конверсии",
    },
  };
}
