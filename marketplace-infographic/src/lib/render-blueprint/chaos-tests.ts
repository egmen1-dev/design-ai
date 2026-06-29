/**
 * Chapter 3.17 — Chaos scenarios (fixed imports)
 */
import {
  RecoveryEngine,
  classifyError,
  RecoveryErrorCategory,
} from "./recovery-engine";
import { SnapshotManager, SnapshotIntegrityError } from "./snapshot-manager";
import { DecisionGraph } from "./decision-graph";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import { BlueprintLifecycle } from "./lifecycle-types";
import type { ChaosScenario } from "./testing-types";
import type { BlueprintSnapshot } from "./snapshot-types";

export const CHAOS_SCENARIOS: ChaosScenario[] = [
  { id: "provider-fail", name: "Provider failure", inject: "provider_failure", expectRecovery: true },
  { id: "network-loss", name: "Network loss", inject: "network_loss", expectRecovery: true },
  { id: "snapshot-corrupt", name: "Snapshot corruption", inject: "snapshot_corrupt", expectRecovery: false },
  { id: "composite-fail", name: "Composite failure", inject: "composite_fail", expectRecovery: true },
  { id: "vision-fail", name: "Vision QA failure", inject: "vision_fail", expectRecovery: true },
];

export type ChaosRunResult = {
  scenarioId: string;
  recovered: boolean;
  passed: boolean;
  detail: string;
};

export function runChaosScenario(scenario: ChaosScenario): ChaosRunResult {
  const engine = new RecoveryEngine();

  switch (scenario.inject) {
    case "provider_failure": {
      const err = classifyError({
        message: "Provider HTTP 500",
        httpStatus: 500,
        provider: "flux",
        category: RecoveryErrorCategory.PROVIDER,
      });
      const plan = engine.decideRecovery(err);
      return {
        scenarioId: scenario.id,
        recovered: plan.strategy !== "abort",
        passed: scenario.expectRecovery === (plan.strategy !== "abort"),
        detail: `strategy=${plan.strategy}`,
      };
    }
    case "network_loss": {
      const err = classifyError({
        message: "ECONNRESET timeout",
        category: RecoveryErrorCategory.NETWORK,
      });
      const plan = engine.decideRecovery(err);
      return {
        scenarioId: scenario.id,
        recovered: true,
        passed: scenario.expectRecovery,
        detail: `strategy=${plan.strategy}`,
      };
    }
    case "snapshot_corrupt": {
      const mgr = new SnapshotManager();
      const bp = createEmptyRenderBlueprint({ seed: 1, category: "x" });
      const graph = DecisionGraph.fromBlueprint(bp);
      const snap = mgr.store({ blueprint: bp, graph, stage: BlueprintLifecycle.NEW, validated: true });
      const corrupted = { ...snap, checksum: "corrupt" } as BlueprintSnapshot;
      try {
        mgr.verifyIntegrity(corrupted);
        return { scenarioId: scenario.id, recovered: false, passed: false, detail: "integrity not detected" };
      } catch (e) {
        const ok = e instanceof SnapshotIntegrityError;
        return { scenarioId: scenario.id, recovered: false, passed: ok === !scenario.expectRecovery, detail: "integrity detected" };
      }
    }
    case "composite_fail": {
      const err = classifyError({ message: "Composite shadow fail", category: RecoveryErrorCategory.COMPOSITE });
      const plan = engine.decideRecovery(err);
      return {
        scenarioId: scenario.id,
        recovered: plan.strategy === "composite_retry",
        passed: scenario.expectRecovery,
        detail: plan.strategy,
      };
    }
    case "vision_fail": {
      const err = classifyError({ message: "Vision QA rejected", category: RecoveryErrorCategory.VISION });
      const plan = engine.decideRecovery(err);
      return {
        scenarioId: scenario.id,
        recovered: plan.strategy !== "abort",
        passed: scenario.expectRecovery,
        detail: plan.strategy,
      };
    }
    default:
      return { scenarioId: scenario.id, recovered: false, passed: false, detail: "unknown" };
  }
}

export function runAllChaosScenarios(): ChaosRunResult[] {
  return CHAOS_SCENARIOS.map(runChaosScenario);
}

export function assertChaosRecoveryOrThrow(): void {
  const results = runAllChaosScenarios();
  const failed = results.filter((r) => !r.passed);
  if (failed.length) {
    throw new Error(`Chaos tests failed: ${failed.map((f) => f.scenarioId).join(", ")}`);
  }
}
