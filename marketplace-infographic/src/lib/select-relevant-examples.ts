import type { InfographicStyle } from "@/lib/design-trends";
import { prisma } from "@/lib/prisma";
import { rankExamplesForProduct } from "@/lib/example-engine";
import { analyzeProductPrompt } from "@/lib/product-analysis";

export type DesignExampleRecord = Awaited<ReturnType<typeof loadDesignExamples>>[number];

export async function loadDesignExamples(limit = 100) {
  return prisma.designExample.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      font: { select: { id: true, name: true } },
      badge: { select: { id: true, name: true } },
    },
  });
}

export async function selectRelevantExamples(
  prompt: string,
  limit = 5,
  style?: InfographicStyle,
) {
  const pool = await loadDesignExamples(120);
  if (pool.length === 0) return [];

  const analysis = analyzeProductPrompt(prompt);
  return rankExamplesForProduct(prompt, pool, analysis.category, style, limit);
}

export function formatExamplesForPrompt(
  examples: Awaited<ReturnType<typeof selectRelevantExamples>>,
): string {
  if (examples.length === 0) {
    return "Референсные карточки товаров: пока нет. Ориентируйся только на библиотеку и стиль.";
  }

  return examples
    .map((example, index) => {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(example.resultJson) as Record<string, unknown>;
      } catch {
        parsed = { raw: example.resultJson.slice(0, 400) };
      }

      const synonyms = Array.isArray(parsed.synonyms)
        ? parsed.synonyms.filter((s): s is string => typeof s === "string")
        : [];

      const lines = [
        `Референс ${index + 1} (карточка товара WB/Ozon):`,
        `prompt: "${example.prompt}"`,
        `appliedStyle: ${example.appliedStyle}`,
        `tags: [${example.tags.join(", ")}]`,
      ];

      if (synonyms.length > 0) {
        lines.push(`synonyms: [${synonyms.slice(0, 6).join(", ")}]`);
      }

      if (example.imageUrl) {
        lines.push(`referenceImage: ${example.imageUrl}`);
      }

      if (example.notes) {
        lines.push(`compositionNotes: "${example.notes}"`);
      }

      if (example.fontId) lines.push(`fontId: ${example.fontId}`);
      if (example.badgeId) lines.push(`badgeId: ${example.badgeId}`);

      if (parsed.type !== "reference_card") {
        lines.push(`approvedLayout: ${JSON.stringify(parsed)}`);
      } else {
        const blueprint = parsed.layoutBlueprint as Record<string, unknown> | undefined;
        const colors = Array.isArray(parsed.dominantColors)
          ? parsed.dominantColors.filter((c): c is string => typeof c === "string")
          : [];

        lines.push(
          "layout: marketplace (профессиональная карточка WB/Ozon)",
          "композиция: заголовок слева вверху (без КАПСА), подзаголовок в цветной pill, слева белые блоки с цифрами, справа вертикальная цветная колонка с крупными числами, товар по диагонали по центру",
        );

        if (colors.length > 0) {
          lines.push(`dominantColors: [${colors.join(", ")}]`);
        }

        if (blueprint) {
          lines.push(`layoutBlueprint: ${JSON.stringify(blueprint)}`);
        }
      }

      return lines.join("\n");
    })
    .join("\n\n");
}
