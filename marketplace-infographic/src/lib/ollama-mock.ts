import type { InfographicStyle } from "./design-trends";
import type { InfographicResult } from "./validations";

export function generateMockInfographicJson(
  prompt: string,
  style: InfographicStyle = "modern",
): InfographicResult {
  return {
    title: prompt.slice(0, 58) || "Инфографика для маркетплейса",
    subtitle:
      "Детерминированный AI_MOCK_MODE: структура подходит для проверки рендера, лайков и few-shot обучения.",
    bullets: [
      "Короткий заголовок с понятной выгодой",
      "До пяти тезисов для карточки товара или витрины",
      "Цветовая схема и стиль валидируются Zod",
      "Одобренные результаты сохраняются анонимно",
    ],
    colorScheme: style === "minimal" || style === "swiss" ? "light" : "gradient",
    style,
    colors: ["#0ea5e9", "#8b5cf6", "#f8fafc"],
    layout: "cards",
  };
}
