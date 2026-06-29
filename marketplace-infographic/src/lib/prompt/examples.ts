import type { DesignExampleRecord } from "@/lib/select-relevant-examples";

export function buildExamplesPrompt(examples: DesignExampleRecord[]): string {
  if (examples.length === 0) {
    return "РЕФЕРЕНСЫ: пока нет. Ориентируйся на лучшие практики WB/Ozon marketplace.";
  }

  return examples
    .map((example, index) => {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(example.resultJson) as Record<string, unknown>;
      } catch {
        parsed = {};
      }

      const synonyms = Array.isArray(parsed.synonyms)
        ? parsed.synonyms.filter((s): s is string => typeof s === "string").slice(0, 6)
        : [];

      const lines = [
        `Референс ${index + 1} [score-weighted]:`,
        `prompt: "${example.prompt}"`,
        `style: ${example.appliedStyle}`,
        `tags: [${example.tags.join(", ")}]`,
      ];

      if (example.imageUrl) lines.push(`image: ${example.imageUrl}`);
      if (example.notes) lines.push(`notes: ${example.notes}`);
      if (example.fontId) lines.push(`fontId: ${example.fontId}`);
      if (example.badgeId) lines.push(`badgeId: ${example.badgeId}`);
      if (synonyms.length) lines.push(`synonyms: [${synonyms.join(", ")}]`);

      if (parsed.layoutBlueprint) {
        lines.push(`blueprint: ${JSON.stringify(parsed.layoutBlueprint)}`);
      }

      lines.push(
        "Повтори композицию: заголовок слева, pill, stat-карточки, вертикальная колонка, товар по диагонали.",
      );

      return lines.join("\n");
    })
    .join("\n\n");
}
