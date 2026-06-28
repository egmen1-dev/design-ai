import type { DesignDecision } from "../decision/types";
import type { ConflictSeverity, ConflictType, DesignConflict } from "./types";

function normalizeScene(v: string): string {
  const s = v.toLowerCase();
  if (/kitchen|кухн/.test(s)) return "kitchen";
  if (/outdoor|garden|nature|загород|дач|сад|lifestyle/.test(s)) return "outdoor";
  if (/studio|premium_studio|luxury_minimal|modern_white|modern_dark/.test(s)) return "studio";
  if (/interior|home|kitchen|domestic/.test(s)) return "interior";
  if (/industrial|workshop|construction|technical/.test(s)) return "industrial";
  return s;
}

function normalizeLighting(v: string): string {
  const s = v.toLowerCase();
  if (/golden|sunset|warm_spotlight|закат/.test(s)) return "golden_hour";
  if (/studio|softbox|soft_studio|luxury_softbox/.test(s)) return "studio";
  if (/industrial|cold/.test(s)) return "industrial";
  return s;
}

function severityForScenePair(a: string, b: string): ConflictSeverity {
  const na = normalizeScene(a);
  const nb = normalizeScene(b);
  if (na === nb) return "low";
  if (
    (na === "outdoor" && nb === "kitchen") ||
    (na === "kitchen" && nb === "outdoor") ||
    (na === "outdoor" && nb === "interior") ||
    (na === "studio" && nb === "kitchen")
  ) {
    return "critical";
  }
  if (na === "studio" && nb === "outdoor") return "high";
  return "medium";
}

function makeConflict(
  type: ConflictType,
  decisions: DesignDecision[],
  severity: ConflictSeverity,
  description: string,
): DesignConflict {
  return {
    id: `${type}_${decisions.map((d) => d.agentId).join("_")}`,
    type,
    severity,
    values: [...new Set(decisions.map((d) => d.value))],
    sources: decisions.map((d) => d.agentId),
    description,
  };
}

export function detectConflicts(all: DesignDecision[]): DesignConflict[] {
  const conflicts: DesignConflict[] = [];

  const byDomain = (domain: DesignDecision["domain"]) =>
    all.filter((d) => d.domain === domain);

  const sceneDecisions = byDomain("scene");
  const sceneValues = [...new Set(sceneDecisions.map((d) => normalizeScene(d.value)))];
  if (sceneValues.length > 1) {
    let maxSev: ConflictSeverity = "low";
    for (let i = 0; i < sceneValues.length; i++) {
      for (let j = i + 1; j < sceneValues.length; j++) {
        const sev = severityForScenePair(sceneValues[i], sceneValues[j]);
        if (sev === "critical") maxSev = "critical";
        else if (sev === "high" && maxSev !== "critical") maxSev = "high";
        else if (sev === "medium" && maxSev === "low") maxSev = "medium";
      }
    }
    conflicts.push(
      makeConflict(
        "scene",
        sceneDecisions,
        maxSev,
        `Scene conflict: ${sceneValues.join(" vs ")}`,
      ),
    );
  }

  const lightingDecisions = [
    ...byDomain("lighting"),
    ...all.filter((d) => d.lighting).map((d) => ({ ...d, domain: "lighting" as const, value: d.lighting! })),
  ];
  const lightValues = [...new Set(lightingDecisions.map((d) => normalizeLighting(d.value)))];
  if (lightValues.length > 1) {
    const sev: ConflictSeverity =
      lightValues.includes("studio") && lightValues.includes("golden_hour")
        ? "high"
        : "medium";
    conflicts.push(
      makeConflict(
        "lighting",
        lightingDecisions,
        sev,
        `Lighting conflict: ${lightValues.join(" vs ")}`,
      ),
    );
  }

  const compDecisions = byDomain("composition");
  const compValues = [...new Set(compDecisions.map((d) => d.value))];
  if (compValues.length > 1) {
    conflicts.push(
      makeConflict(
        "composition",
        compDecisions,
        "medium",
        `Composition conflict: ${compValues.join(" vs ")}`,
      ),
    );
  }

  const layoutDecisions = byDomain("layout");
  const layoutValues = [...new Set(layoutDecisions.map((d) => d.value))];
  if (layoutValues.length > 1) {
    conflicts.push(
      makeConflict(
        "layout",
        layoutDecisions,
        "medium",
        `Layout conflict: ${layoutValues.join(" vs ")}`,
      ),
    );
  }

  const envDecisions = byDomain("environment");
  const envNorm = envDecisions.map((d) => d.value.toLowerCase().slice(0, 24));
  if (new Set(envNorm).size > 1 && envDecisions.length > 1) {
    conflicts.push(
      makeConflict(
        "environment",
        envDecisions,
        "high",
        `Environment conflict: ${[...new Set(envDecisions.map((d) => d.value))].join(" vs ")}`,
      ),
    );
  }

  return conflicts;
}

export function scoreDecision(
  d: DesignDecision,
  categoryBoost: Record<string, number>,
): number {
  let score = d.confidence * 100;
  score += categoryBoost[d.value] ?? 0;
  score += categoryBoost[normalizeScene(d.value)] ?? 0;
  if (d.source === "knowledge-engine") score += 12;
  if (d.source === "story-director") score += 8;
  if (d.source === "scene-director") score += 5;
  if (d.source === "scene-planner") score -= 5;
  return score;
}
