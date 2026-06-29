import type { CompositionLayout } from "@/lib/composition/types";
import type { CardMeaning, DesignScoreResult } from "./types";
import { DESIGN_SCORE_PASS } from "./constants";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function computeDesignScore(
  layout: CompositionLayout,
  meaning: CardMeaning,
): DesignScoreResult {
  const m = layout.metrics;
  const visualBalance = clamp(100 - Math.abs(m.visualCenterX - 50) * 1.2 - m.overlapPct * 3);
  const hierarchy = clamp(
    m.productAreaPct >= 60 && m.productAreaPct <= 70 ? 95 : m.productAreaPct >= 55 ? 85 : 70,
  );
  const readability = clamp(meaning.title.length <= 45 ? 94 : meaning.title.length <= 60 ? 82 : 68);
  const professionalism = clamp(m.whitespacePct >= 20 && m.overlapPct < 2 ? 92 : 78);
  const minimalism = clamp(
    m.textAreaPct < 15 && m.plaqueAreaPct < 10 ? 95 : m.textAreaPct < 20 ? 85 : 70,
  );
  const marketplaceCtr = clamp(readability * 0.6 + hierarchy * 0.4);
  const composition = clamp(visualBalance * 0.5 + hierarchy * 0.5);
  const realism = 88;
  const brandFeeling = clamp(professionalism * 0.7 + minimalism * 0.3);

  const dimensions = [
    { id: "visual_balance", label: "Visual Balance", score: visualBalance },
    { id: "hierarchy", label: "Hierarchy", score: hierarchy },
    { id: "readability", label: "Readability", score: readability },
    { id: "professionalism", label: "Professionalism", score: professionalism },
    { id: "minimalism", label: "Minimalism", score: minimalism },
    { id: "marketplace_ctr", label: "Marketplace CTR", score: marketplaceCtr },
    { id: "composition", label: "Composition", score: composition },
    { id: "realism", label: "Realism", score: realism },
    { id: "brand_feeling", label: "Brand Feeling", score: brandFeeling },
  ];

  const total = clamp(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);

  return {
    total,
    passed: total >= DESIGN_SCORE_PASS,
    dimensions,
  };
}
