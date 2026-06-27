import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, validationError } from "@/lib/require-admin";
import { runMonthlyTrendSync, TREND_INTELLIGENCE_VERSION } from "@/lib/design/trend-intelligence";
import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const VALID_CATEGORIES = new Set<KnowledgeCategory>([
  "generic",
  "generator",
  "furniture",
  "pets",
  "electronics",
  "cosmetics",
  "kids",
  "clothes",
  "auto",
  "kitchen",
  "sports",
  "home",
  "tools",
]);

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  let body: { category?: string };
  try {
    body = await request.json();
  } catch {
    return validationError("Ожидается JSON с полем category");
  }

  const category = body.category?.trim();
  if (!category) {
    return validationError("Поле category обязательно");
  }

  if (!VALID_CATEGORIES.has(category as KnowledgeCategory)) {
    return validationError(`Неизвестная категория: ${category}`);
  }

  try {
    await runMonthlyTrendSync(category);
    return NextResponse.json({
      ok: true,
      category,
      trendIntelligenceVersion: TREND_INTELLIGENCE_VERSION,
    });
  } catch (error) {
    console.error("[admin/intelligence-sync] failed:", error);
    return NextResponse.json({ error: "Синхронизация трендов не удалась" }, { status: 500 });
  }
}
