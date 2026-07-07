import { createDaosDebugSummary } from "../debug/daos-debug-summary";
import type { DAOSDebugSummary } from "../debug/daos-debug-summary";
import type { DAOSFinalGateResult } from "../gates/final-gate";

const DAOS_CONTEXT_MARKER = "DAOS CONTEXT:";

export type DAOSContextEffectAuditStatus = "insufficient_data" | "unchanged" | "changed" | "partial";

export type DAOSContextEffectAudit = {
  status: DAOSContextEffectAuditStatus;
  createdAt: string;
  prompt: {
    lengthBefore?: number;
    lengthAfter?: number;
    delta?: number;
    containsDaosBlockBefore?: boolean;
    containsDaosBlockAfter?: boolean;
  };
  renderContext: {
    attachedBefore?: boolean;
    attachedAfter?: boolean;
  };
  provider: {
    before?: string;
    after?: string;
    same?: boolean;
  };
  modulesIgnored: {
    before: string[];
    after: string[];
    added: string[];
    removed: string[];
  };
  fallback: {
    before?: boolean;
    after?: boolean;
    changed?: boolean;
  };
  summaryScore: {
    before?: number;
    after?: number;
    delta?: number;
  };
  finalGate: {
    beforeStatus?: string;
    afterStatus?: string;
    beforeScore?: number;
    afterScore?: number;
    statusChanged?: boolean;
    scoreDelta?: number;
  };
  notes: string[];
};

type ContextEffectAuditSnapshot = {
  promptLength?: number;
  containsDaosContextBlock?: boolean;
  promptContextInjected?: boolean;
  renderContextAttached?: boolean;
  provider?: string;
  modulesIgnored: string[];
  fallbackUsed?: boolean;
  summaryScore?: number;
  summaryStatus?: string;
  finalGateScore?: number;
  finalGateStatus?: string;
};

function asRecord(input: unknown): Record<string, unknown> | null {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function promptContainsDaosBlock(promptText: string | undefined, injected?: boolean): boolean {
  if (promptText?.includes(DAOS_CONTEXT_MARKER)) return true;
  return injected === true;
}

function diffStringArrays(before: string[], after: string[]): { added: string[]; removed: string[] } {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  return {
    added: after.filter((item) => !beforeSet.has(item)),
    removed: before.filter((item) => !afterSet.has(item)),
  };
}

function extractSnapshot(input: unknown): ContextEffectAuditSnapshot | null {
  const root = asRecord(input);
  if (!root) return null;

  const bundle = asRecord(root.bundle) ?? root;
  const summary = asRecord(root.summary) ?? {};
  const finalGate = asRecord(root.finalGate) ?? {};
  const renderDebug = asRecord(bundle.renderDebug) ?? {};
  const diagnostics = asRecord(bundle.diagnostics) ?? {};

  const promptText = asString(renderDebug.finalPrompt);
  const promptLength =
    asNumber(root.promptLength) ??
    (typeof renderDebug.promptLength === "number" ? renderDebug.promptLength : promptText?.length);

  const promptContextInjected =
    asBoolean(root.promptContextInjected) ??
    (bundle.promptContextInjected === true ? true : bundle.promptContextInjected === false ? false : undefined);

  const renderContextAttached =
    asBoolean(root.renderContextAttached) ??
    (bundle.renderContextAttached === true
      ? true
      : bundle.renderContextAttached === false
        ? false
        : undefined);

  const containsDaosContextBlock =
    asBoolean(root.containsDaosContextBlock) ??
    promptContainsDaosBlock(promptText, promptContextInjected);

  const summaryFromBundle =
    Object.keys(summary).length > 0
      ? (summary as unknown as DAOSDebugSummary)
      : createDaosDebugSummary(bundle);

  return {
    promptLength,
    containsDaosContextBlock,
    promptContextInjected,
    renderContextAttached,
    provider: asString(root.provider) ?? asString(renderDebug.provider),
    modulesIgnored: asStringArray(root.modulesIgnored ?? renderDebug.modulesIgnored),
    fallbackUsed:
      asBoolean(root.fallbackUsed) ??
      (diagnostics.fallbackUsed === true
        ? true
        : renderDebug.fallbackUsed === true
          ? true
          : diagnostics.fallbackUsed === false || renderDebug.fallbackUsed === false
            ? false
            : undefined),
    summaryScore: asNumber(root.summaryScore) ?? summaryFromBundle.score,
    summaryStatus: asString(root.summaryStatus) ?? summaryFromBundle.status,
    finalGateScore: asNumber(root.finalGateScore) ?? asNumber(finalGate.score),
    finalGateStatus: asString(root.finalGateStatus) ?? asString(finalGate.status),
  };
}

function hasComparablePair(before: ContextEffectAuditSnapshot, after: ContextEffectAuditSnapshot): boolean {
  if (before.promptLength !== undefined && after.promptLength !== undefined) return true;
  if (before.summaryScore !== undefined && after.summaryScore !== undefined) return true;
  if (before.provider !== undefined && after.provider !== undefined) return true;
  if (before.promptContextInjected !== undefined && after.promptContextInjected !== undefined) return true;
  if (before.renderContextAttached !== undefined && after.renderContextAttached !== undefined) return true;
  if (before.fallbackUsed !== undefined && after.fallbackUsed !== undefined) return true;
  if (before.finalGateScore !== undefined && after.finalGateScore !== undefined) return true;
  if (before.finalGateStatus !== undefined && after.finalGateStatus !== undefined) return true;
  if (before.modulesIgnored.length > 0 || after.modulesIgnored.length > 0) return true;
  return false;
}

function resolveAuditStatus(
  notes: string[],
  hasFullPromptPair: boolean,
  hasFullScorePair: boolean,
  hasChanges: boolean,
): DAOSContextEffectAuditStatus {
  if (notes.some((note) => note.includes("insufficient"))) {
    return "insufficient_data";
  }
  if (!hasChanges) {
    return "unchanged";
  }
  if (!hasFullPromptPair || !hasFullScorePair) {
    return "partial";
  }
  return "changed";
}

/** Compare DAOS context on/off artifacts without triggering a second render. */
export function createDaosContextEffectAudit(before: unknown, after: unknown): DAOSContextEffectAudit {
  const createdAt = new Date().toISOString();
  const notes: string[] = [];

  const beforeSnapshot = extractSnapshot(before);
  const afterSnapshot = extractSnapshot(after);

  if (!beforeSnapshot || !afterSnapshot) {
    notes.push("insufficient_data: before or after artifacts missing");
    return {
      status: "insufficient_data",
      createdAt,
      prompt: {},
      renderContext: {},
      provider: {},
      modulesIgnored: { before: [], after: [], added: [], removed: [] },
      fallback: {},
      summaryScore: {},
      finalGate: {},
      notes,
    };
  }

  if (!hasComparablePair(beforeSnapshot, afterSnapshot)) {
    notes.push("insufficient_data: no comparable before/after fields");
    return {
      status: "insufficient_data",
      createdAt,
      prompt: {},
      renderContext: {},
      provider: {},
      modulesIgnored: { before: [], after: [], added: [], removed: [] },
      fallback: {},
      summaryScore: {},
      finalGate: {},
      notes,
    };
  }

  const promptDelta =
    beforeSnapshot.promptLength !== undefined && afterSnapshot.promptLength !== undefined
      ? afterSnapshot.promptLength - beforeSnapshot.promptLength
      : undefined;

  const modulesDiff = diffStringArrays(beforeSnapshot.modulesIgnored, afterSnapshot.modulesIgnored);
  const providerSame =
    beforeSnapshot.provider !== undefined && afterSnapshot.provider !== undefined
      ? beforeSnapshot.provider === afterSnapshot.provider
      : undefined;

  const fallbackChanged =
    beforeSnapshot.fallbackUsed !== undefined && afterSnapshot.fallbackUsed !== undefined
      ? beforeSnapshot.fallbackUsed !== afterSnapshot.fallbackUsed
      : undefined;

  const scoreDelta =
    beforeSnapshot.summaryScore !== undefined && afterSnapshot.summaryScore !== undefined
      ? afterSnapshot.summaryScore - beforeSnapshot.summaryScore
      : undefined;

  const gateScoreDelta =
    beforeSnapshot.finalGateScore !== undefined && afterSnapshot.finalGateScore !== undefined
      ? afterSnapshot.finalGateScore - beforeSnapshot.finalGateScore
      : undefined;

  const statusChanged =
    beforeSnapshot.finalGateStatus !== undefined && afterSnapshot.finalGateStatus !== undefined
      ? beforeSnapshot.finalGateStatus !== afterSnapshot.finalGateStatus
      : undefined;

  if (promptDelta !== undefined && promptDelta !== 0) {
    notes.push(`prompt length delta ${promptDelta}`);
  }
  if (modulesDiff.added.length > 0 || modulesDiff.removed.length > 0) {
    notes.push(
      `modulesIgnored delta +${modulesDiff.added.length}/-${modulesDiff.removed.length}`,
    );
  }
  if (fallbackChanged) {
    notes.push("fallback usage changed");
  }
  if (providerSame === false) {
    notes.push("provider changed");
  }
  if (scoreDelta !== undefined && scoreDelta !== 0) {
    notes.push(`summary score delta ${scoreDelta}`);
  }
  if (statusChanged) {
    notes.push("final gate status changed");
  }
  if (
    beforeSnapshot.renderContextAttached !== afterSnapshot.renderContextAttached ||
    beforeSnapshot.promptContextInjected !== afterSnapshot.promptContextInjected
  ) {
    notes.push("DAOS context flags changed");
  }

  const hasChanges = notes.length > 0;
  const status = resolveAuditStatus(
    notes,
    beforeSnapshot.promptLength !== undefined && afterSnapshot.promptLength !== undefined,
    beforeSnapshot.summaryScore !== undefined && afterSnapshot.summaryScore !== undefined,
    hasChanges,
  );

  if (!hasChanges) {
    notes.push("no measurable deltas");
  }

  return {
    status,
    createdAt,
    prompt: {
      lengthBefore: beforeSnapshot.promptLength,
      lengthAfter: afterSnapshot.promptLength,
      delta: promptDelta,
      containsDaosBlockBefore: beforeSnapshot.containsDaosContextBlock,
      containsDaosBlockAfter: afterSnapshot.containsDaosContextBlock,
    },
    renderContext: {
      attachedBefore: beforeSnapshot.renderContextAttached,
      attachedAfter: afterSnapshot.renderContextAttached,
    },
    provider: {
      before: beforeSnapshot.provider,
      after: afterSnapshot.provider,
      same: providerSame,
    },
    modulesIgnored: {
      before: [...beforeSnapshot.modulesIgnored],
      after: [...afterSnapshot.modulesIgnored],
      added: modulesDiff.added,
      removed: modulesDiff.removed,
    },
    fallback: {
      before: beforeSnapshot.fallbackUsed,
      after: afterSnapshot.fallbackUsed,
      changed: fallbackChanged,
    },
    summaryScore: {
      before: beforeSnapshot.summaryScore,
      after: afterSnapshot.summaryScore,
      delta: scoreDelta,
    },
    finalGate: {
      beforeStatus: beforeSnapshot.finalGateStatus,
      afterStatus: afterSnapshot.finalGateStatus,
      beforeScore: beforeSnapshot.finalGateScore,
      afterScore: afterSnapshot.finalGateScore,
      statusChanged,
      scoreDelta: gateScoreDelta,
    },
    notes,
  };
}

export function summarizeDaosContextEffectAudit(audit: DAOSContextEffectAudit): {
  status: DAOSContextEffectAuditStatus;
  promptDelta?: number;
  scoreDelta?: number;
  notes: string;
} {
  return {
    status: audit.status,
    promptDelta: audit.prompt.delta,
    scoreDelta: audit.summaryScore.delta,
    notes: audit.notes.join("; "),
  };
}
