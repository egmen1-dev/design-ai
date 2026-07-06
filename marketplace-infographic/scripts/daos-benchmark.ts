import { runDaosBenchmark } from "../src/lib/daos/benchmark/runner";

function parsePhase(argv: string[]): number {
  const phaseArg = argv.find((arg) => arg.startsWith("--phase="));
  if (phaseArg) {
    const value = Number(phaseArg.split("=")[1]);
    if (value === 1 || value === 30) return value === 30 ? 2 : 1;
  }
  if (argv.includes("--phase=30") || process.env.BENCHMARK_PHASE === "30") return 2;
  return 1;
}

async function main(): Promise<void> {
  const phase = parsePhase(process.argv.slice(2));
  const productCount = phase === 1 ? 5 : 30;

  if (phase === 2) {
    console.log(`Phase 2: benchmarking ${productCount} products. This may take a while.`);
  }

  await runDaosBenchmark(phase);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
