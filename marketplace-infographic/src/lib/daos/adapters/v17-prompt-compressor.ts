import { isDaosV17PromptBridgeEnabled } from "./v17-prompt-bridge";
import { isDaosV17ModulesBridgeEnabled } from "./v17-modules-bridge";
import type { DAOSRenderEngineContextSummary } from "./render-engine-context-adapter";
import type { CompiledRenderPayload } from "@/lib/render-engine/types";

export const DAOS_V17_PROMPT_COMPRESSION_MAX_CHARS = 450;
export const DAOS_V17_RELEVANCE_THRESHOLD = 0.55;

const BRIDGE_CONTEXT_HEADER = "DAOS V17 CONTEXT:";
const BRIDGE_MODULES_HEADER = "DAOS V17 MODULES:";

const ABSTRACT_WORD_PATTERN =
  /\b(synergy|leverage|innovative|best-in-class|premium quality|holistic|cutting-edge|world-class|seamless)\b/gi;

export type DaosV17PromptCompressorInput = {
  bridgeBlock?: string;
  modulesBlock?: string;
  ctrBlock?: string;
  maxTotalChars: number;
  visualScene?: string;
  commercialGoal?: string;
  mainMessage?: string;
  creativeConcept?: string;
};

export type DaosV17PromptCompressorOutput = {
  compressedText: string;
  originalLength: number;
  compressedLength: number;
  removedSections: string[];
  relevanceScore: number;
  warnings: string[];
};

export type DaosV17CompressionDiagnostics = {
  enabled: boolean;
  originalAdditionLength: number;
  compressedAdditionLength: number;
  compressionRatio: number;
  relevanceScore: number;
  additionsSkipped: boolean;
  skipReason?: string;
  removedSections: string[];
};

type PrioritizedChunk = {
  id: string;
  priority: number;
  text: string;
};

function cleanLine(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  return value.trim().replace(/\s+/g, " ");
}

function normalizePhrase(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function measureDuplicatePhraseRatio(text: string): number {
  const phrases = text
    .split(/[.;,\n]/)
    .map((part) => normalizePhrase(part))
    .filter((part) => part.length >= 12);
  if (phrases.length < 2) return 0;

  const seen = new Set<string>();
  let duplicates = 0;
  for (const phrase of phrases) {
    if (seen.has(phrase)) duplicates += 1;
    else seen.add(phrase);
  }
  return duplicates / phrases.length;
}

function dedupePhrasesAcrossChunks(chunks: PrioritizedChunk[]): PrioritizedChunk[] {
  const seen = new Set<string>();
  return chunks
    .map((chunk) => {
      const parts = chunk.text
        .split(/(?<=[.;])\s+/)
        .map((part) => part.trim())
        .filter(Boolean);
      const kept: string[] = [];
      for (const part of parts) {
        const key = normalizePhrase(part);
        if (key.length >= 10 && seen.has(key)) continue;
        if (key.length >= 10) seen.add(key);
        kept.push(part);
      }
      return { ...chunk, text: kept.join(". ").replace(/\.\./g, ".") };
    })
    .filter((chunk) => chunk.text.trim().length > 0);
}

function splitDaosAdditions(additions: string): {
  bridgeBlock?: string;
  modulesBlock?: string;
  ctrBlock?: string;
} {
  const trimmed = additions.trim();
  if (!trimmed) return {};

  let bridgeBlock: string | undefined;
  let modulesBlock: string | undefined;
  let ctrBlock: string | undefined;

  for (const part of trimmed.split(/\n\n+/)) {
    if (part.startsWith(BRIDGE_CONTEXT_HEADER)) {
      bridgeBlock = part;
    } else if (part.startsWith(BRIDGE_MODULES_HEADER)) {
      modulesBlock = part;
      const ctrLine = part
        .split("\n")
        .find((line) => line.trim().startsWith("[ctr_wording]"));
      if (ctrLine) ctrBlock = ctrLine.trim();
    }
  }

  return { bridgeBlock, modulesBlock, ctrBlock };
}

function bridgeLinePriority(line: string): number {
  const lower = line.toLowerCase();
  if (/^visual scene:|^composition:/.test(lower)) return 1;
  if (/^main message:/.test(lower)) return 2;
  if (/^render strategy:|product|background|backdrop/.test(lower)) return 3;
  if (/^creative concept:|lighting|mood/.test(lower)) return 4;
  if (/^commercial goal:|^usp:/.test(lower)) return 5;
  if (/^missing specs:/.test(lower)) return 9;
  if (/^modules must not ignore:/.test(lower)) return 10;
  return 6;
}

function parseBridgeChunks(block: string | undefined): PrioritizedChunk[] {
  if (!block?.trim()) return [];
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  const chunks: PrioritizedChunk[] = [];

  for (const line of lines) {
    if (line === BRIDGE_CONTEXT_HEADER) {
      chunks.push({ id: "bridge_header", priority: 0, text: line });
      continue;
    }
    const priority = bridgeLinePriority(line);
    if (priority >= 9) continue;
    chunks.push({
      id: `bridge_${priority}_${chunks.length}`,
      priority,
      text: line,
    });
  }

  return chunks;
}

function moduleSectionPriority(sectionLine: string): number {
  if (sectionLine.startsWith("[layout_coordinates]")) return 1;
  if (sectionLine.startsWith("[hierarchy]")) return 2;
  if (sectionLine.startsWith("[typography_zones]")) return 3;
  if (sectionLine.startsWith("[ctr_wording]")) return 5;
  return 4;
}

function parseModuleChunks(block: string | undefined): PrioritizedChunk[] {
  if (!block?.trim()) return [];
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  const chunks: PrioritizedChunk[] = [];

  for (const line of lines) {
    if (line === BRIDGE_MODULES_HEADER) {
      chunks.push({ id: "modules_header", priority: 0, text: line });
      continue;
    }
    if (!line.startsWith("[")) continue;
    const priority = moduleSectionPriority(line);
    chunks.push({
      id: `module_${priority}_${chunks.length}`,
      priority,
      text: line,
    });
  }

  return chunks;
}

function shortenCtrSection(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const compact = text
    .replace(/CTR wording intent:\s*/i, "CTR: ")
    .replace(/main message:\s*/gi, "msg ")
    .replace(/click trigger:\s*/gi, "click ")
    .replace(/trust driver:\s*/gi, "trust ")
    .replace(/\s+/g, " ")
    .trim();
  if (compact.length <= maxChars) return compact;
  return `${compact.slice(0, Math.max(0, maxChars - 3))}...`;
}

function assembleCompressedText(chunks: PrioritizedChunk[], maxTotalChars: number): {
  text: string;
  removedSections: string[];
} {
  const removedSections: string[] = [];
  const sorted = [...chunks].sort((a, b) => a.priority - b.priority);
  const deduped = dedupePhrasesAcrossChunks(sorted);

  const bridgeHeader = deduped.find((chunk) => chunk.id === "bridge_header");
  const modulesHeader = deduped.find((chunk) => chunk.id === "modules_header");
  const bridgeLines = deduped.filter((chunk) => chunk.id.startsWith("bridge_") && chunk.id !== "bridge_header");
  const moduleLines = deduped.filter((chunk) => chunk.id.startsWith("module_"));

  const bridgeParts: string[] = [];
  if (bridgeHeader) bridgeParts.push(bridgeHeader.text);
  for (const chunk of bridgeLines) {
    let text = chunk.text;
    if (text.startsWith("[ctr_wording]") || /ctr wording/i.test(text)) {
      text = shortenCtrSection(text, 100);
    }
    bridgeParts.push(text);
  }

  const moduleParts: string[] = [];
  if (modulesHeader) moduleParts.push(modulesHeader.text);
  for (const chunk of moduleLines) {
    let text = chunk.text;
    if (text.startsWith("[ctr_wording]")) {
      text = shortenCtrSection(text, 90);
    }
    moduleParts.push(text);
  }

  let bridgeBlock = bridgeParts.length > 1 || (bridgeParts.length === 1 && bridgeParts[0] !== BRIDGE_CONTEXT_HEADER)
    ? bridgeParts.join("\n")
    : "";
  let modulesBlock = moduleParts.length > 1 || (moduleParts.length === 1 && moduleParts[0] !== BRIDGE_MODULES_HEADER)
    ? moduleParts.join("\n")
    : "";

  const blocks = [bridgeBlock, modulesBlock].filter(Boolean);
  let combined = blocks.join("\n\n");

  const dropLowestPriority = (): void => {
    const candidates = [...bridgeLines, ...moduleLines].sort((a, b) => b.priority - a.priority);
    for (const candidate of candidates) {
      if (!combined.includes(candidate.text)) continue;
      removedSections.push(candidate.id);
      if (bridgeBlock.includes(candidate.text)) {
        bridgeBlock = bridgeBlock
          .split("\n")
          .filter((line) => line.trim() !== candidate.text)
          .join("\n");
      }
      if (modulesBlock.includes(candidate.text)) {
        modulesBlock = modulesBlock
          .split("\n")
          .filter((line) => line.trim() !== candidate.text)
          .join("\n");
      }
      blocks.length = 0;
      if (bridgeBlock.trim()) blocks.push(bridgeBlock);
      if (modulesBlock.trim()) blocks.push(modulesBlock);
      combined = blocks.join("\n\n");
      return;
    }
  };

  while (combined.length > maxTotalChars) {
    const before = combined.length;
    dropLowestPriority();
    if (combined.length >= before) {
      combined = `${combined.slice(0, Math.max(0, maxTotalChars - 3))}...`;
      removedSections.push("truncated_tail");
      break;
    }
  }

  return { text: combined.trim(), removedSections };
}

/** Score how visually useful DAOS prompt additions are (0–1). */
export function scoreDaosPromptAdditionRelevance(
  input: DaosV17PromptCompressorInput,
): number {
  const ctrExtra =
    input.ctrBlock && !input.modulesBlock?.includes(input.ctrBlock) ? input.ctrBlock : "";
  const combined = [input.bridgeBlock, input.modulesBlock, ctrExtra]
    .filter(Boolean)
    .join("\n");
  if (!combined.trim()) return 0;

  const lower = combined.toLowerCase();
  let score = 0.35;

  if (cleanLine(input.visualScene)) score += 0.15;
  if (/visual scene:|composition:|\[layout_coordinates\]/i.test(lower)) score += 0.22;
  if (cleanLine(input.mainMessage)) score += 0.1;
  if (/\[hierarchy\]|\[typography_zones\]/i.test(lower)) score += 0.08;

  if (cleanLine(input.visualScene) && /\[layout_coordinates\]/i.test(lower)) {
    score += 0.12;
  }

  if (/missing specs:/i.test(lower)) score -= 0.12;
  if (/modules must not ignore/i.test(lower)) score -= 0.1;

  const abstractHits = (lower.match(ABSTRACT_WORD_PATTERN) ?? []).length;
  score -= abstractHits * 0.06;

  score -= measureDuplicatePhraseRatio(combined) * 0.15;

  const ctrSource = input.ctrBlock && !lower.includes(input.ctrBlock.toLowerCase().slice(0, 24))
    ? input.ctrBlock
    : "";
  if (/\[ctr_wording\]|ctr wording|trust driver|click trigger/i.test(lower)) {
    const ctrLen = (ctrSource || input.modulesBlock?.match(/\[ctr_wording\][^\n]*/i)?.[0] || "").length;
    if (ctrLen > 120) score -= 0.12;
    else if (ctrLen > 80) score -= 0.06;
  }

  if (
    cleanLine(input.creativeConcept) &&
    /visual|scene|composition|macro|hero|light/i.test(input.creativeConcept!)
  ) {
    score += 0.05;
  }

  if (!cleanLine(input.visualScene) && !/\[layout_coordinates\]/i.test(lower)) {
    score -= 0.15;
  }

  return Math.max(0, Math.min(1, score));
}

/** Compress DAOS v17 bridge/modules additions to a visual-first budget. */
export function compressDaosV17PromptAdditions(
  input: DaosV17PromptCompressorInput,
): DaosV17PromptCompressorOutput {
  const originalText = [input.bridgeBlock, input.modulesBlock]
    .filter(Boolean)
    .join("\n\n")
    .trim();
  const originalLength = originalText.length;
  const warnings: string[] = [];

  const relevanceScore = scoreDaosPromptAdditionRelevance(input);
  const chunks = [
    ...parseBridgeChunks(input.bridgeBlock),
    ...parseModuleChunks(input.modulesBlock),
  ];

  if (!chunks.length) {
    return {
      compressedText: "",
      originalLength,
      compressedLength: 0,
      removedSections: ["empty_additions"],
      relevanceScore,
      warnings,
    };
  }

  const { text, removedSections } = assembleCompressedText(chunks, input.maxTotalChars);

  if (originalLength > input.maxTotalChars) {
    warnings.push("DAOS_PROMPT_ADDITIONS_TOO_LONG");
  }

  return {
    compressedText: text,
    originalLength,
    compressedLength: text.length,
    removedSections,
    relevanceScore,
    warnings,
  };
}

export function isDaosV17PromptCompressionEnabled(): boolean {
  return process.env.DAOS_V17_PROMPT_COMPRESSION === "1";
}

export function areDaosV17BridgesActiveForCompression(): boolean {
  return isDaosV17PromptBridgeEnabled() || isDaosV17ModulesBridgeEnabled();
}

export function extractDaosAdditionsFromPrompt(
  basePrompt: string,
  fullPrompt: string,
): string {
  if (!fullPrompt.startsWith(basePrompt)) return "";
  return fullPrompt.slice(basePrompt.length).trim();
}

/** Clone payload and compress/skip DAOS additions when compression flag is on. */
export function applyDaosV17PromptCompressionToPayload(
  payload: CompiledRenderPayload,
  options: {
    basePrompt: string;
    visualScene?: string;
    commercialGoal?: string;
    mainMessage?: string;
    creativeConcept?: string;
  },
): CompiledRenderPayload {
  try {
    const bridgesApplied =
      payload.daosV17Bridge?.applied === true || payload.daosV17Modules?.applied === true;

    if (
      !isDaosV17PromptCompressionEnabled() ||
      !areDaosV17BridgesActiveForCompression() ||
      !bridgesApplied
    ) {
      return payload;
    }

    const originalAdditions = extractDaosAdditionsFromPrompt(
      options.basePrompt,
      payload.prompt,
    );
    if (!originalAdditions) return payload;

    const { bridgeBlock, modulesBlock, ctrBlock } = splitDaosAdditions(originalAdditions);
    const ctrForScoring = modulesBlock?.includes("[ctr_wording]") ? undefined : ctrBlock;
    const compressInput: DaosV17PromptCompressorInput = {
      bridgeBlock,
      modulesBlock,
      ctrBlock: ctrForScoring,
      maxTotalChars: DAOS_V17_PROMPT_COMPRESSION_MAX_CHARS,
      visualScene: options.visualScene,
      commercialGoal: options.commercialGoal,
      mainMessage: options.mainMessage,
      creativeConcept: options.creativeConcept,
    };

    const relevanceScore = scoreDaosPromptAdditionRelevance(compressInput);
    const originalLength = originalAdditions.length;

    if (relevanceScore < DAOS_V17_RELEVANCE_THRESHOLD) {
      return {
        ...payload,
        prompt: options.basePrompt,
        daosV17Compression: {
          enabled: true,
          originalAdditionLength: originalLength,
          compressedAdditionLength: 0,
          compressionRatio: 0,
          relevanceScore,
          additionsSkipped: true,
          skipReason: "low_relevance",
          removedSections: ["all_additions"],
        },
      };
    }

    const compressed = compressDaosV17PromptAdditions(compressInput);
    const compressedAdditions = compressed.compressedText.trim();
    const nextPrompt = compressedAdditions
      ? `${options.basePrompt}\n\n${compressedAdditions}`
      : options.basePrompt;

    return {
      ...payload,
      prompt: nextPrompt,
      daosV17Compression: {
        enabled: true,
        originalAdditionLength: originalLength,
        compressedAdditionLength: compressed.compressedLength,
        compressionRatio:
          originalLength > 0 ? compressed.compressedLength / originalLength : 1,
        relevanceScore: compressed.relevanceScore,
        additionsSkipped: false,
        removedSections: compressed.removedSections,
      },
    };
  } catch {
    return payload;
  }
}

export function compressionFieldsFromDaosContext(
  context: DAOSRenderEngineContextSummary | undefined,
): {
  visualScene?: string;
  commercialGoal?: string;
  mainMessage?: string;
  creativeConcept?: string;
} {
  if (!context) return {};
  return {
    visualScene: cleanLine(context.visualScene),
    commercialGoal: cleanLine(context.commercialGoal),
    mainMessage: cleanLine(context.mainMessage),
    creativeConcept: cleanLine(context.creativeConcept),
  };
}

export function extractDaosV17CompressionDiagnostics(
  payload: CompiledRenderPayload | undefined,
): DaosV17CompressionDiagnostics | undefined {
  return payload?.daosV17Compression;
}
