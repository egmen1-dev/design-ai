export type DAOSFinalGateStatus = "passed" | "warning" | "failed";

export type DAOSFinalGateResult = {
  status: DAOSFinalGateStatus;
  score: number;
  blocking: false;
  reasons: string[];
  recommendations: string[];
  createdAt: string;
};

function asRecord(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function worstStatus(a: DAOSFinalGateStatus, b: DAOSFinalGateStatus): DAOSFinalGateStatus {
  const order: Record<DAOSFinalGateStatus, number> = { passed: 0, warning: 1, failed: 2 };
  return order[a] >= order[b] ? a : b;
}

function mapSummaryStatus(summaryStatus: string | undefined): DAOSFinalGateStatus {
  if (summaryStatus === "critical") return "failed";
  if (summaryStatus === "warning") return "warning";
  if (summaryStatus === "ok") return "passed";
  return "warning";
}

function applyModeScoreGate(
  status: DAOSFinalGateStatus,
  generationMode: string,
  score: number,
  reasons: string[],
): DAOSFinalGateStatus {
  let next = status;

  if ((generationMode === "premium" || generationMode === "enterprise") && score < 80) {
    next = worstStatus(next, "failed");
    reasons.push(`${generationMode} mode requires score >= 80 (got ${score})`);
  } else if (generationMode === "balanced" && score < 65) {
    next = worstStatus(next, "warning");
    reasons.push(`balanced mode score below 65 (got ${score})`);
  } else if (generationMode === "draft" && score < 50) {
    next = worstStatus(next, "warning");
    reasons.push(`draft mode score below 50 (got ${score})`);
  }

  return next;
}

function buildGateRecommendations(input: {
  status: DAOSFinalGateStatus;
  summaryStatus?: string;
  criticalCount: number;
  fallbackUsed: boolean;
  modulesIgnored: string[];
  specsMissing: string[];
  summaryRecommendations: string[];
}): string[] {
  const recommendations = new Set<string>(input.summaryRecommendations);

  if (input.status === "failed" && (input.summaryStatus === "critical" || input.criticalCount > 0)) {
    recommendations.add("Review DAOS debug bundle before trusting output.");
  }
  if (input.fallbackUsed) {
    recommendations.add("Investigate render fallback path.");
  }
  if (input.modulesIgnored.length > 0) {
    recommendations.add("Review ignored render modules.");
  }
  if (input.specsMissing.length > 0) {
    recommendations.add("Improve spec adapter coverage.");
  }
  if (recommendations.size === 0) {
    recommendations.add("DAOS soft gate passed — no remediation required.");
  }

  return [...recommendations];
}

/** Wave 7 soft final gate — diagnostics only, never blocks generation. */
export function evaluateDaosFinalGate(input: {
  summary?: unknown;
  generationMode?: string;
}): DAOSFinalGateResult {
  const summary = asRecord(input.summary);
  const generationMode = input.generationMode ?? asString(summary.generationMode) ?? "balanced";
  const summaryStatus = asString(summary.status);
  const score = typeof summary.score === "number" ? summary.score : 0;
  const criticalCount = typeof summary.criticalCount === "number" ? summary.criticalCount : 0;
  const render = asRecord(summary.render);
  const fallbackUsed = render.fallbackUsed === true;
  const modulesIgnored = asStringArray(render.modulesIgnored);
  const specsMissing = asStringArray(summary.specsMissing);
  const summaryRecommendations = asStringArray(summary.recommendations);

  const reasons: string[] = [];
  let status: DAOSFinalGateStatus;

  if (!input.summary || Object.keys(summary).length === 0) {
    status = "warning";
    reasons.push("No debug summary available for gate evaluation");
  } else {
    status = mapSummaryStatus(summaryStatus);
    if (summaryStatus === "critical") {
      reasons.push("Debug summary status is critical");
    } else if (summaryStatus === "warning") {
      reasons.push("Debug summary status is warning");
    } else if (summaryStatus === "ok") {
      reasons.push("Debug summary status is ok");
    } else {
      reasons.push("Debug summary status is unknown");
    }
  }

  status = applyModeScoreGate(status, generationMode, score, reasons);

  const recommendations = buildGateRecommendations({
    status,
    summaryStatus,
    criticalCount,
    fallbackUsed,
    modulesIgnored,
    specsMissing,
    summaryRecommendations,
  });

  return {
    status,
    score,
    blocking: false,
    reasons,
    recommendations,
    createdAt: new Date().toISOString(),
  };
}

export function renderDaosFinalGateMarkdownSection(result: DAOSFinalGateResult): string {
  const lines = [
    "## Final Gate (soft)",
    "",
    `- Status: ${result.status}`,
    `- Score: ${result.score}`,
    `- Blocking: ${result.blocking}`,
  ];

  if (result.reasons.length > 0) {
    lines.push("", "### Reasons", "");
    for (const reason of result.reasons) {
      lines.push(`- ${reason}`);
    }
  }

  if (result.recommendations.length > 0) {
    lines.push("", "### Gate recommendations", "");
    for (const recommendation of result.recommendations) {
      lines.push(`- ${recommendation}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}
