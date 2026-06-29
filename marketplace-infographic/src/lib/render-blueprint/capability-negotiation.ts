/**
 * Chapter 3.11 — Capability negotiation
 */
import type { RenderIntent } from "./render-pipeline-types";
import type { ProviderId } from "./render-pipeline-types";
import { getExcludedFields, getProviderCapabilities } from "./provider-capabilities";

const INTENT_FIELD_KEYS = [
  "scene",
  "camera",
  "lighting",
  "composition",
  "materials",
  "mood",
  "background",
  "constraints",
  "photography",
] as const;

export function negotiateCapabilities(
  intent: RenderIntent,
  provider: ProviderId,
): { capabilities: ReturnType<typeof getProviderCapabilities>; negotiated: import("./render-pipeline-types").NegotiatedFields } {
  const capabilities = getProviderCapabilities(provider);
  const providerExcluded = new Set(getExcludedFields(provider));
  const supported: string[] = [];
  const excludedList: string[] = [...getExcludedFields(provider)];

  for (const key of INTENT_FIELD_KEYS) {
    if (providerExcluded.has(key)) {
      if (!excludedList.includes(key)) excludedList.push(key);
    } else {
      supported.push(key);
    }
  }

  if (!capabilities.supportsNegativePrompt && !excludedList.includes("negativePrompt")) {
    excludedList.push("negativePrompt");
  }
  if (!capabilities.supportsCFG && !excludedList.includes("cfg")) excludedList.push("cfg");
  if (!capabilities.supportsSteps && !excludedList.includes("steps")) excludedList.push("steps");

  return {
    capabilities,
    negotiated: { supported, excluded: [...new Set(excludedList)] },
  };
}
