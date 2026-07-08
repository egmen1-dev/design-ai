export type DAOSDebugSummaryStatus = "ok" | "warning" | "critical";

export type DAOSDebugSummary = {
  projectId: string;
  runId: string;
  generationMode?: string;
  status: DAOSDebugSummaryStatus;
  score: number;
  specsPresent: string[];
  specsMissing: string[];
  warningCount: number;
  criticalCount: number;
  topWarnings: string[];
  render: {
    provider?: string;
    model?: string;
    promptCaptured: boolean;
    promptLength?: number;
    fallbackUsed: boolean;
    modulesIgnored: string[];
  };
  recommendations: string[];
};

const SPEC_KEYS = [
  "brief",
  "knowledgeSpec",
  "commercialSpec",
  "creativeSpec",
  "visualBlueprint",
  "renderBlueprint",
] as const;

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

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function collectWarnings(bundle: Record<string, unknown>): Array<{ severity: string; message: string; code?: string }> {
  const meaningLoss = asRecord(bundle.meaningLossReport);
  const diagnostics = asRecord(bundle.diagnostics);
  const raw =
    (Array.isArray(meaningLoss.warnings) ? meaningLoss.warnings : null) ??
    (Array.isArray(diagnostics.warnings) ? diagnostics.warnings : []);

  return raw.map((item) => {
    const warning = asRecord(item);
    return {
      severity: asString(warning.severity) ?? "warning",
      message: asString(warning.message) ?? asString(warning.code) ?? "unknown warning",
      code: asString(warning.code),
    };
  });
}

function resolveSpecs(bundle: Record<string, unknown>): { present: string[]; missing: string[] } {
  const specs = asRecord(bundle.specs);
  const diagnostics = asRecord(bundle.diagnostics);
  const adapted = asRecord(diagnostics.specsAdapted);

  const present = SPEC_KEYS.filter((key) => {
    if (specs[key] != null) return true;
    const adaptedKey = key === "brief" ? "brief" : key.replace("Spec", "").replace("Blueprint", "");
    if (key === "knowledgeSpec" && adapted.knowledge === true) return true;
    if (key === "commercialSpec" && adapted.commercial === true) return true;
    if (key === "creativeSpec" && adapted.creative === true) return true;
    if (key === "visualBlueprint" && adapted.visual === true) return true;
    if (key === "renderBlueprint" && adapted.render === true) return true;
    if (key === "brief" && adapted.brief === true) return true;
    return false;
  });

  const missing =
    asStringArray(diagnostics.missingSpecs).length > 0
      ? asStringArray(diagnostics.missingSpecs)
      : SPEC_KEYS.filter((key) => !present.includes(key));

  return { present: [...present], missing: [...missing] };
}

function buildRecommendations(input: {
  status: DAOSDebugSummaryStatus;
  specsMissing: string[];
  render: DAOSDebugSummary["render"];
  topWarnings: string[];
}): string[] {
  const recommendations = new Set<string>();

  if (input.status === "critical") {
    recommendations.add("Resolve critical DAOS meaning-loss issues before treating this run as production-ready.");
  }
  if (input.specsMissing.length > 0) {
    recommendations.add(`Adapt missing specs in pipeline: ${input.specsMissing.join(", ")}.`);
  }
  if (!input.render.promptCaptured) {
    recommendations.add("Capture final render prompt in renderDebug to trace RenderBlueprint → provider request.");
  }
  if (input.render.fallbackUsed) {
    recommendations.add("Investigate render fallback path and provider retry chain.");
  }
  if (input.render.modulesIgnored.length > 0) {
    recommendations.add(`Review ignored render modules: ${input.render.modulesIgnored.join(", ")}.`);
  }
  if (input.topWarnings.some((w) => /commercial.*creative/i.test(w))) {
    recommendations.add("Align commercial USP with creative concept to reduce meaning loss.");
  }

  if (recommendations.size === 0) {
    recommendations.add("No immediate DAOS remediation required for this run.");
  }

  return [...recommendations];
}

function computeScore(input: {
  criticalCount: number;
  warningCount: number;
  specsMissingCount: number;
  fallbackUsed: boolean;
  modulesIgnoredCount: number;
  promptMissing: boolean;
}): number {
  let score = 100;
  score -= input.criticalCount * 15;
  score -= input.warningCount * 5;
  score -= input.specsMissingCount * 7;
  if (input.fallbackUsed) score -= 20;
  score -= input.modulesIgnoredCount * 3;
  if (input.promptMissing) score -= 10;
  return clampScore(score);
}

function resolveStatus(
  score: number,
  criticalCount: number,
  warningCount: number,
): DAOSDebugSummaryStatus {
  if (criticalCount > 0 || score < 60) return "critical";
  if (warningCount > 0 || score < 85) return "warning";
  return "ok";
}

/** Build deterministic summary from a DAOS debug bundle (accepts unknown). */
export function createDaosDebugSummary(bundleInput: unknown): DAOSDebugSummary {
  const bundle = asRecord(bundleInput);
  const diagnostics = asRecord(bundle.diagnostics);
  const renderDebug = asRecord(bundle.renderDebug);
  const specs = asRecord(bundle.specs);

  const projectId = asString(bundle.projectId) ?? "unknown-project";
  const runId = asString(bundle.runId) ?? "unknown-run";
  const generationMode = asString(bundle.generationMode) ?? asString(diagnostics.generationMode);

  const { present: specsPresent, missing: specsMissing } = resolveSpecs(bundle);
  const warnings = collectWarnings(bundle);
  const criticalCount = warnings.filter((w) => w.severity === "critical").length;
  const warningCount = warnings.filter((w) => w.severity === "warning").length;
  const topWarnings = warnings.slice(0, 5).map((w) => w.message);

  const promptCaptured = Boolean(diagnostics.promptCaptured ?? renderDebug.finalPrompt);
  const promptMissing = Boolean(specs.renderBlueprint) && !promptCaptured;
  const fallbackUsed = Boolean(diagnostics.fallbackUsed ?? renderDebug.fallbackUsed);
  const modulesIgnored = asStringArray(renderDebug.modulesIgnored);

  const score = computeScore({
    criticalCount,
    warningCount,
    specsMissingCount: specsMissing.length,
    fallbackUsed,
    modulesIgnoredCount: modulesIgnored.length,
    promptMissing,
  });

  const status = resolveStatus(score, criticalCount, warningCount);

  const render: DAOSDebugSummary["render"] = {
    promptCaptured,
    fallbackUsed,
    modulesIgnored,
  };
  const provider = asString(renderDebug.provider);
  const model = asString(renderDebug.model);
  const promptLength =
    typeof renderDebug.promptLength === "number"
      ? renderDebug.promptLength
      : asString(renderDebug.finalPrompt)?.length;

  if (provider) render.provider = provider;
  if (model) render.model = model;
  if (promptLength !== undefined) render.promptLength = promptLength;

  const recommendations = buildRecommendations({
    status,
    specsMissing,
    render,
    topWarnings,
  });

  return {
    projectId,
    runId,
    generationMode,
    status,
    score,
    specsPresent,
    specsMissing,
    warningCount,
    criticalCount,
    topWarnings,
    render,
    recommendations,
  };
}

/** Render human-readable markdown for operators and diagnostics review. */
export function renderDaosDebugSummaryMarkdown(summary: DAOSDebugSummary): string {
  const lines = [
    "# DAOS Debug Summary",
    "",
    `**Project:** ${summary.projectId}`,
    `**Run:** ${summary.runId}`,
    `**Mode:** ${summary.generationMode ?? "unknown"}`,
    `**Status:** ${summary.status}`,
    `**Score:** ${summary.score}/100`,
    "",
    "## Specs",
    "",
    `- Present: ${summary.specsPresent.length ? summary.specsPresent.join(", ") : "none"}`,
    `- Missing: ${summary.specsMissing.length ? summary.specsMissing.join(", ") : "none"}`,
    "",
    "## Warnings",
    "",
    `- Critical: ${summary.criticalCount}`,
    `- Warning: ${summary.warningCount}`,
  ];

  if (summary.topWarnings.length > 0) {
    lines.push("", "### Top warnings", "");
    for (const warning of summary.topWarnings) {
      lines.push(`- ${warning}`);
    }
  }

  lines.push(
    "",
    "## Render",
    "",
    `- Provider: ${summary.render.provider ?? "n/a"}`,
    `- Model: ${summary.render.model ?? "n/a"}`,
    `- Prompt captured: ${summary.render.promptCaptured ? "yes" : "no"}`,
    `- Prompt length: ${summary.render.promptLength ?? "n/a"}`,
    `- Fallback used: ${summary.render.fallbackUsed ? "yes" : "no"}`,
    `- Modules ignored: ${summary.render.modulesIgnored.length ? summary.render.modulesIgnored.join(", ") : "none"}`,
    "",
    "## Recommendations",
    "",
  );

  for (const recommendation of summary.recommendations) {
    lines.push(`- ${recommendation}`);
  }

  lines.push("");
  return lines.join("\n");
}
