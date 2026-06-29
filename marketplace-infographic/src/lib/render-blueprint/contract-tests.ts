/**
 * Chapter 3.17 — Contract tests for core interfaces
 */
import type { BlueprintAgent, AgentResultBase } from "./agent-contracts";
import type { RenderBlueprint } from "./types";
import type { ContractTestResult } from "./testing-types";
import type { RenderAdapter } from "./render-pipeline-types";

export function testBlueprintAgentContract(
  agent: BlueprintAgent<unknown, AgentResultBase>,
  blueprint: RenderBlueprint,
): ContractTestResult {
  const violations: string[] = [];

  if (!agent.id) violations.push("Agent must have id");
  if (!agent.version) violations.push("Agent must have version");
  if (!agent.stage) violations.push("Agent must have stage");
  if (typeof agent.canExecute !== "function") violations.push("Agent must implement canExecute");
  if (typeof agent.execute !== "function") violations.push("Agent must implement execute");
  if (typeof agent.toUpdates !== "function") violations.push("Agent must implement toUpdates");

  try {
    const frozen = Object.freeze(structuredClone(blueprint)) as RenderBlueprint;
    void agent.canExecute(frozen);
  } catch (err) {
    violations.push(`canExecute threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  return {
    contract: `BlueprintAgent<${agent.id}>`,
    passed: violations.length === 0,
    violations,
  };
}

export function testRenderAdapterContract(adapter: RenderAdapter): ContractTestResult {
  const violations: string[] = [];

  if (!adapter.id) violations.push("Adapter must have id");
  if (!adapter.provider) violations.push("Adapter must have provider");
  if (typeof adapter.capabilities !== "object") violations.push("Adapter must expose capabilities");
  if (typeof adapter.compile !== "function") violations.push("Adapter must implement compile");
  if (typeof adapter.render !== "function") violations.push("Adapter must implement render");

  return {
    contract: `RenderAdapter<${adapter.id}>`,
    passed: violations.length === 0,
    violations,
  };
}

export function assertContractOrThrow(result: ContractTestResult): void {
  if (!result.passed) {
    throw new Error(`Contract ${result.contract} failed: ${result.violations.join("; ")}`);
  }
}
