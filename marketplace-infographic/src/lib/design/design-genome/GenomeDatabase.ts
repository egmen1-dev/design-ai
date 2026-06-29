import { prisma } from "@/lib/prisma";
import type { DesignGenomeRecord } from "./types";
import { GENOME_VERSION } from "./types";

export async function loadTopGenomes(
  category: string,
  limit = 12,
): Promise<DesignGenomeRecord[]> {
  const rows = await prisma.designGenome.findMany({
    where: { category },
    orderBy: { successWeight: "desc" },
    take: limit,
  });
  return rows.map((r) => r.genome as DesignGenomeRecord);
}

export async function loadGenomeByKey(genomeKey: string): Promise<DesignGenomeRecord | null> {
  const row = await prisma.designGenome.findUnique({ where: { genomeKey } });
  return row ? (row.genome as DesignGenomeRecord) : null;
}

export async function persistGenome(
  genome: DesignGenomeRecord,
  source = "generated",
): Promise<void> {
  await prisma.designGenome.upsert({
    where: { genomeKey: genome.genomeKey },
    create: {
      genomeKey: genome.genomeKey,
      category: genome.knowledgeCategory,
      customerIntent: genome.story.customerIntent,
      heroConcept: genome.story.heroConcept,
      genome: genome as object,
      rankings: genome.rankings as object,
      source,
      successWeight: genome.rankings.reuseScore,
    },
    update: {
      genome: genome as object,
      rankings: genome.rankings as object,
      customerIntent: genome.story.customerIntent,
      heroConcept: genome.story.heroConcept,
      updatedAt: new Date(),
    },
  });
}

export async function evolveGenomeWeight(
  genomeKey: string,
  outcome: number,
  userLiked?: boolean,
): Promise<void> {
  const row = await prisma.designGenome.findUnique({ where: { genomeKey } });
  if (!row) return;
  const alpha = 0.12;
  const next = alpha * outcome + (1 - alpha) * row.successWeight;
  await prisma.designGenome.update({
    where: { genomeKey },
    data: {
      successWeight: next,
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
      likes: userLiked === true ? { increment: 1 } : undefined,
      dislikes: userLiked === false ? { increment: 1 } : undefined,
    },
  });
}

export async function ensureSeedGenomes(category: string): Promise<void> {
  const count = await prisma.designGenome.count({ where: { category } });
  if (count > 0) return;
  const { buildDesignGenome } = await import("./GenomeBuilder");
  const seeds = [
    {
      prompt: "генератор резервного питания для дома",
      productCategory: "garden_tools" as const,
      customerIntent: "backup_electricity",
      heroConcept: "House remains with electricity",
      layout: "hero_right" as const,
    },
    {
      prompt: "премиум косметика уход",
      productCategory: "cosmetics" as const,
      customerIntent: "self_care_ritual",
      heroConcept: "Daily luxury ritual",
      layout: "premium" as const,
    },
  ];
  for (const s of seeds) {
    const g = buildDesignGenome({
      prompt: s.prompt,
      productCategory: s.productCategory,
      knowledgeCategory: category as import("@/lib/design/knowledge-engine/types").KnowledgeCategory,
      customerIntent: s.customerIntent,
      heroConcept: s.heroConcept,
      compositionTemplate: s.layout,
    });
    await persistGenome(g, "seed");
  }
}
