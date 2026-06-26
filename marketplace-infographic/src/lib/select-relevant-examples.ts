import { prisma } from "@/lib/prisma";

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

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);
}

export async function selectRelevantExamples(prompt: string, limit = 5) {
  const pool = await loadDesignExamples(120);
  if (pool.length === 0) return [];

  const words = tokenize(prompt);
  const scored = pool.map((example) => {
    const haystack = `${example.prompt} ${example.tags.join(" ")} ${example.appliedStyle}`.toLowerCase();
    let score = 0;

    for (const word of words) {
      if (haystack.includes(word)) score += 1;
    }

    for (const tag of example.tags) {
      if (words.includes(tag.toLowerCase())) score += 2;
    }

    if (words.some((word) => example.appliedStyle.toLowerCase().includes(word))) {
      score += 1;
    }

    return { example, score };
  });

  const matched = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.example.createdAt.getTime() - a.example.createdAt.getTime())
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
    return "Примеры одобренных дизайнов: нет.";
  }

  return examples
    .map((example, index) => {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(example.resultJson) as Record<string, unknown>;
      } catch {
        parsed = { raw: example.resultJson.slice(0, 400) };
      }

      return `Пример ${index + 1}:
prompt: "${example.prompt}"
appliedStyle: ${example.appliedStyle}
tags: [${example.tags.join(", ")}]
fontId: ${example.fontId ?? "null"}
badgeId: ${example.badgeId ?? "null"}
result: ${JSON.stringify(parsed)}`;
    })
    .join("\n\n");
}
