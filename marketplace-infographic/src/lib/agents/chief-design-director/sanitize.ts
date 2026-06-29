import type { ChiefDesignDirectorPlan, FixAction, TopProblem } from "./types";
import { CHIEF_APPROVE_SCORE } from "./types";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function sanitizeActions(raw: unknown): FixAction[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const o = item as Record<string, unknown>;
      const action = String(o.action ?? "").trim();
      if (!action || /красив|современн|улучшить композицию|добавить воздуха/i.test(action)) {
        return null;
      }
      const priority = ["critical", "major", "minor"].includes(String(o.priority))
        ? (o.priority as FixAction["priority"])
        : "major";
      return {
        priority,
        action,
        expectedImprovement: String(o.expectedImprovement ?? "").trim(),
      };
    })
    .filter((x): x is FixAction => !!x)
    .slice(0, 4);
}

export function sanitizeChiefDesignDirectorPlan(
  raw: unknown,
  fallback: ChiefDesignDirectorPlan,
): ChiefDesignDirectorPlan {
  const p = (raw ?? {}) as Record<string, unknown>;
  const topProblems: TopProblem[] = Array.isArray(p.topProblems)
    ? p.topProblems
        .map((t) => {
          const o = t as Record<string, unknown>;
          return {
            problem: String(o.problem ?? "").trim(),
            reason: String(o.reason ?? "").trim(),
          };
        })
        .filter((t) => t.problem)
        .slice(0, 5)
    : fallback.topProblems;

  const estimatedScoreAfterFix = clamp(
    Number(p.estimatedScoreAfterFix ?? fallback.estimatedScoreAfterFix),
  );

  const approved =
    typeof p.approved === "boolean"
      ? p.approved && estimatedScoreAfterFix >= CHIEF_APPROVE_SCORE - 2
      : fallback.approved;

  return {
    approved,
    estimatedScoreAfterFix,
    topProblems,
    layoutChanges: sanitizeActions(p.layoutChanges).length
      ? sanitizeActions(p.layoutChanges)
      : fallback.layoutChanges,
    typographyChanges: sanitizeActions(p.typographyChanges).length
      ? sanitizeActions(p.typographyChanges)
      : fallback.typographyChanges,
    backgroundChanges: sanitizeActions(p.backgroundChanges).length
      ? sanitizeActions(p.backgroundChanges)
      : fallback.backgroundChanges,
    lightingChanges: sanitizeActions(p.lightingChanges).length
      ? sanitizeActions(p.lightingChanges)
      : fallback.lightingChanges,
    productChanges: sanitizeActions(p.productChanges).length
      ? sanitizeActions(p.productChanges)
      : fallback.productChanges,
    colorChanges: sanitizeActions(p.colorChanges).length
      ? sanitizeActions(p.colorChanges)
      : fallback.colorChanges,
    effectChanges: sanitizeActions(p.effectChanges).length
      ? sanitizeActions(p.effectChanges)
      : fallback.effectChanges,
    badgeChanges: sanitizeActions(p.badgeChanges).length
      ? sanitizeActions(p.badgeChanges)
      : fallback.badgeChanges,
    compositionChanges: sanitizeActions(p.compositionChanges).length
      ? sanitizeActions(p.compositionChanges)
      : fallback.compositionChanges,
    finalAdvice: String(p.finalAdvice ?? fallback.finalAdvice).slice(0, 400),
    source: "ollama",
  };
}

export function mergeChiefDesignDirectorPlans(
  heuristic: ChiefDesignDirectorPlan,
  llm: ChiefDesignDirectorPlan,
): ChiefDesignDirectorPlan {
  const mergeActions = (a: FixAction[], b: FixAction[]) => {
    const seen = new Set<string>();
    return [...a, ...b].filter((f) => {
      if (seen.has(f.action)) return false;
      seen.add(f.action);
      return true;
    }).slice(0, 4);
  };

  const topProblems = [...heuristic.topProblems, ...llm.topProblems]
    .filter((t, i, arr) => arr.findIndex((x) => x.problem === t.problem) === i)
    .slice(0, 5);

  const estimatedScoreAfterFix = Math.max(
    heuristic.estimatedScoreAfterFix,
    llm.estimatedScoreAfterFix,
  );

  return {
    approved: heuristic.approved && llm.approved,
    estimatedScoreAfterFix,
    topProblems,
    layoutChanges: mergeActions(heuristic.layoutChanges, llm.layoutChanges),
    typographyChanges: mergeActions(heuristic.typographyChanges, llm.typographyChanges),
    backgroundChanges: mergeActions(heuristic.backgroundChanges, llm.backgroundChanges),
    lightingChanges: mergeActions(heuristic.lightingChanges, llm.lightingChanges),
    productChanges: mergeActions(heuristic.productChanges, llm.productChanges),
    colorChanges: mergeActions(heuristic.colorChanges, llm.colorChanges),
    effectChanges: mergeActions(heuristic.effectChanges, llm.effectChanges),
    badgeChanges: mergeActions(heuristic.badgeChanges, llm.badgeChanges),
    compositionChanges: mergeActions(heuristic.compositionChanges, llm.compositionChanges),
    finalAdvice: llm.finalAdvice || heuristic.finalAdvice,
    source: "merged",
  };
}
