import { readFile } from "fs/promises";
import path from "path";
import type { BenchmarkCatalog, BenchmarkProduct } from "./types";

const BENCHMARK_DIR = path.join(process.cwd(), "benchmark");

export function resolveBenchmarkDir(): string {
  return BENCHMARK_DIR;
}

export async function loadBenchmarkCatalog(phase: number): Promise<BenchmarkCatalog> {
  if (phase === 1) {
    const raw = await readFile(path.join(BENCHMARK_DIR, "products.phase1.json"), "utf8");
    return JSON.parse(raw) as BenchmarkCatalog;
  }

  const phase1Raw = await readFile(path.join(BENCHMARK_DIR, "products.phase1.json"), "utf8");
  const phase1 = JSON.parse(phase1Raw) as BenchmarkCatalog;
  const phase2Raw = await readFile(path.join(BENCHMARK_DIR, "products.phase2.json"), "utf8");
  const phase2 = JSON.parse(phase2Raw) as {
    phase: number;
    description: string;
    sharedSeed: string;
    additionalProducts: BenchmarkProduct[];
  };

  return {
    phase: 2,
    description: phase2.description,
    sharedSeed: phase2.sharedSeed,
    products: [...phase1.products, ...phase2.additionalProducts],
  };
}

export function productSeed(sharedSeed: string, productId: string): string {
  return `${sharedSeed}:${productId}`;
}

export const BENCHMARK_BASELINE_ENV: Record<string, string> = {
  DAOS_PROMPT_CONTEXT: "0",
  DAOS_RENDER_CONTEXT: "0",
  DAOS_V17_PROMPT_BRIDGE: "0",
  DAOS_V17_MODULES_BRIDGE: "0",
  DAOS_V17_CTR_BRIDGE: "0",
  RENDER_ENGINE_V17: "1",
  FAST_GENERATION: "1",
  AI_MOCK_MODE: "true",
  DISABLE_IMGLY: "1",
  USE_FAST_CUTOUT: "1",
  DESIGN_GOVERNANCE_V171: "0",
  GOVERNANCE_ALLOW_GRADIENT_FALLBACK: "0",
};

export const BENCHMARK_DAOS_ENV: Record<string, string> = {
  ...BENCHMARK_BASELINE_ENV,
  DAOS_RENDER_CONTEXT: "1",
  DAOS_V17_PROMPT_BRIDGE: "1",
  DAOS_V17_MODULES_BRIDGE: "1",
  DAOS_V17_CTR_BRIDGE: "1",
};

export const BENCHMARK_DAOS_COMPRESSED_ENV: Record<string, string> = {
  ...BENCHMARK_DAOS_ENV,
  DAOS_V17_PROMPT_COMPRESSION: "1",
};

export const BENCHMARK_DAOS_NO_PATCH_ENV: Record<string, string> = {
  ...BENCHMARK_DAOS_COMPRESSED_ENV,
  DAOS_OVERLAY_PATCH: "0",
};

export const BENCHMARK_DAOS_PATCHED_ENV: Record<string, string> = {
  ...BENCHMARK_DAOS_COMPRESSED_ENV,
  DAOS_OVERLAY_PATCH: "1",
};

export function isDaosBenchmarkEnabled(): boolean {
  return (
    process.env.DAOS_RENDER_CONTEXT === "1" ||
    process.env.DAOS_V17_PROMPT_BRIDGE === "1" ||
    process.env.DAOS_V17_MODULES_BRIDGE === "1" ||
    process.env.DAOS_V17_CTR_BRIDGE === "1" ||
    process.env.DAOS_V17_PROMPT_COMPRESSION === "1" ||
    process.env.DAOS_OVERLAY_PATCH === "1" ||
    process.env.DAOS_PROMPT_CONTEXT === "1"
  );
}
