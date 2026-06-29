/**
 * Chapter 3.11 — Provider capability profiles
 */
import type { ProviderCapabilities, ProviderId } from "./render-pipeline-types";

export const PROVIDER_CAPABILITIES: Record<ProviderId, ProviderCapabilities> = {
  flux: {
    supportsNegativePrompt: true,
    supportsSeed: true,
    supportsCFG: true,
    supportsSteps: true,
    supportsAspectRatio: true,
    supportsReferenceImage: false,
    supportsJsonPrompt: false,
  },
  "gpt-image": {
    supportsNegativePrompt: false,
    supportsSeed: false,
    supportsCFG: false,
    supportsSteps: false,
    supportsAspectRatio: true,
    supportsReferenceImage: true,
    supportsJsonPrompt: false,
  },
  imagen: {
    supportsNegativePrompt: false,
    supportsSeed: true,
    supportsCFG: false,
    supportsSteps: false,
    supportsAspectRatio: true,
    supportsReferenceImage: false,
    supportsJsonPrompt: true,
  },
  sdxl: {
    supportsNegativePrompt: true,
    supportsSeed: true,
    supportsCFG: true,
    supportsSteps: true,
    supportsAspectRatio: true,
    supportsReferenceImage: false,
    supportsJsonPrompt: false,
  },
  pollinations: {
    supportsNegativePrompt: true,
    supportsSeed: true,
    supportsCFG: false,
    supportsSteps: false,
    supportsAspectRatio: true,
    supportsReferenceImage: false,
    supportsJsonPrompt: false,
  },
};

/** Fields Design AI uses internally but providers cannot understand */
export const PROVIDER_EXCLUDED_FIELDS: Record<ProviderId, readonly string[]> = {
  flux: [
    "coordinates",
    "html",
    "ctr",
    "professionalScore",
    "badgePriority",
    "headlineSpace",
    "layoutSpec",
    "heroCoverage",
    "marketplaceScore",
  ],
  "gpt-image": ["coordinates", "html", "cfg", "steps", "negativePromptProfile", "layoutSpec"],
  imagen: ["coordinates", "html", "cfg", "steps", "negativePrompt"],
  sdxl: ["coordinates", "html", "ctr", "layoutSpec", "marketplaceScore"],
  pollinations: [
    "coordinates",
    "html",
    "ctr",
    "professionalScore",
    "layoutSpec",
    "heroCoverage",
    "marketplaceScore",
    "badgePriority",
  ],
};

export function getProviderCapabilities(provider: ProviderId): ProviderCapabilities {
  return { ...PROVIDER_CAPABILITIES[provider] };
}

export function getExcludedFields(provider: ProviderId): readonly string[] {
  return PROVIDER_EXCLUDED_FIELDS[provider];
}
