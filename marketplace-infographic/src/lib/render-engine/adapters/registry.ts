import type { RenderAdapter, RenderModelId } from "../types";
import {
  PollinationsFluxAdapter,
  PollinationsFluxKontextAdapter,
  PollinationsGPTImageAdapter,
  PollinationsSeedreamAdapter,
} from "./pollinations-adapters";

const ADAPTERS: RenderAdapter[] = [
  new PollinationsFluxAdapter(),
  new PollinationsFluxKontextAdapter(),
  new PollinationsGPTImageAdapter(),
  new PollinationsSeedreamAdapter(),
];

export function getRenderAdapter(
  modelId: RenderModelId,
  providerId: string = "pollinations",
): RenderAdapter {
  const found = ADAPTERS.find(
    (a) => a.modelId === modelId && a.providerId === providerId,
  );
  if (!found) {
    return new PollinationsFluxAdapter();
  }
  return found;
}

export function listAdapters(): RenderAdapter[] {
  return [...ADAPTERS];
}
