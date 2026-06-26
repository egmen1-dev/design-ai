import type { InfographicStyle } from "@/lib/design-trends";
import { prisma } from "@/lib/prisma";
import { expandQueryTerms, termsMatch } from "@/lib/query-terms";

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

  const words = expandQueryTerms(prompt);
  const scored = pool.map((example) => {
    const haystack = `${example.prompt} ${example.notes ?? ""} ${example.tags.join(" ")} ${example.appliedStyle}`;
    let score = 0;

    for (const word of words) {
      if (termsMatch(haystack, word)) score += 1;
    }

    for (const tag of example.tags) {
      if (words.some((word) => termsMatch(tag, word))) score += 2;
      if (words.some((word) => termsMatch(haystack, tag))) score += 1;
    }

    if (style && example.appliedStyle === style) {
      score += 4;
    }

    if (style && example.tags.includes(style)) {
      score += 2;
    }

    if (example.imageUrl) {
      score += 1;
    }

    return { example, score };
  });

  const matched = scored
    .filter((item) => item.score > 0)
    .sort(
      (a, b) => b.score - a.score || b.example.createdAt.getTime() - a.example.createdAt.getTime(),
    )
    .map((item) => item.example);

  const unique: typeof pool = [];
  const seen = new Set<string>();

  for (const example of matched) {
    if (seen.has(example.id)) continue;
    seen.add(example.id);
    unique.push(example);
    if (unique.length >= limit) break;
  }

  for (const example of pool) {
    if (unique.length >= limit) break;
    if (seen.has(example.id)) continue;
    seen.add(example.id);
    unique.push(example);
  }

  return unique.slice(0, limit);
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
        lines.push(`synonyms: [${synonyms.slice(0, 12).join(", ")}]`);
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
        lines.push(
          "Задача: повтори композицию и подачу похожих карточек — крупный заголовок, УТП, акценты, расположение товара.",
        );
      }

      return lines.join("\n");
    })
    .join("\n\n");
}
