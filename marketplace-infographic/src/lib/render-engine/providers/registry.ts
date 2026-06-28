import type { RenderingProvider } from "../types";
import { PollinationsProvider } from "./pollinations/provider";
import { HuggingFaceProvider } from "./huggingface/provider";
import { RENDER_ENGINE_CONFIG } from "../config";

let pollinations: PollinationsProvider | undefined;
let huggingface: HuggingFaceProvider | undefined;

export function getRenderingProvider(id?: string): RenderingProvider {
  const providerId = id ?? RENDER_ENGINE_CONFIG.defaultProvider;
  if (providerId === "huggingface") {
    if (!huggingface) huggingface = new HuggingFaceProvider();
    return huggingface;
  }
  if (!pollinations) pollinations = new PollinationsProvider();
  return pollinations;
}

export async function checkRenderProvidersHealth(): Promise<
  Record<string, import("../types").ProviderHealth>
> {
  const providers = [getRenderingProvider("pollinations"), getRenderingProvider("huggingface")];
  const out: Record<string, import("../types").ProviderHealth> = {};
  for (const p of providers) {
    out[p.id] = await p.health();
  }
  return out;
}
