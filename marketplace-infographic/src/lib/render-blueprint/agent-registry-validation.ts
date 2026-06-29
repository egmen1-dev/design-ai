/**
 * Chapter 4.3 — Agent Registry startup validation
 */
import type { AgentContractId } from "./agent-contracts";
import { AGENT_WRITE_MATRIX } from "./agent-matrix";
import { testBlueprintAgentContract } from "./contract-tests";
import { compareBlueprintVersions } from "./blueprint-version";
import type { AgentRegistry } from "./agent-registry";
import type { RegistryHealthIssue, RegistryValidationResult } from "./agent-registry-types";
import { AgentStatus } from "./agent-registry-types";

function issue(
  code: RegistryHealthIssue["code"],
  message: string,
  agentId?: AgentContractId,
): RegistryHealthIssue {
  return { code, message, agentId };
}

export function validateAgentRegistry(registry: AgentRegistry): RegistryValidationResult {
  const issues: RegistryHealthIssue[] = [];
  const descriptors = registry.listDescriptors();
  const registrations = registry.listRegistrations();
  let versionCount = 0;

  const sectionOwners = new Map<string, string[]>();

  for (const reg of registrations) {
    versionCount += 1;
    const { descriptor, factory } = reg;
    const id = descriptor.id;

    if (!descriptor.version?.trim()) {
      issues.push(issue("INVALID_VERSION", `Agent ${id} missing version`, id));
    } else {
      try {
        compareBlueprintVersions("0.0.0", descriptor.version);
      } catch {
        issues.push(issue("INVALID_VERSION", `Agent ${id} has invalid version ${descriptor.version}`, id));
      }
    }

    if (!factory?.create) {
      issues.push(issue("MISSING_FACTORY", `Agent ${id} missing factory`, id));
      continue;
    }

    try {
      const probe = factory.create();
      const contract = testBlueprintAgentContract(probe, registry.createProbeBlueprint());
      if (!contract.passed) {
        issues.push(
          issue("INVALID_CONTRACT", `Agent ${id}: ${contract.violations.join("; ")}`, id),
        );
      }
      factory.dispose?.(probe);
    } catch (e) {
      issues.push(
        issue(
          "INVALID_CONTRACT",
          `Agent ${id} contract probe failed: ${e instanceof Error ? e.message : "unknown"}`,
          id,
        ),
      );
    }

    if (descriptor.status === AgentStatus.ACTIVE || descriptor.enabled) {
      for (const section of descriptor.produces ?? AGENT_WRITE_MATRIX[id] ?? []) {
        const owners = sectionOwners.get(section) ?? [];
        owners.push(id);
        sectionOwners.set(section, owners);
      }
    }
  }

  for (const [section, owners] of sectionOwners) {
    if (owners.length > 1) {
      issues.push(
        issue(
          "OWNERSHIP_CONFLICT",
          `Section ${section} claimed by multiple active agents: ${owners.join(", ")}`,
        ),
      );
    }
  }

  const health = registry.healthCheck();
  issues.push(...health.issues);

  const blocking = issues.filter(
    (i) =>
      i.code !== "DISABLED_STAGE_GAP" &&
      i.code !== "OWNERSHIP_CONFLICT",
  );

  return {
    valid: blocking.length === 0,
    issues,
    agentCount: descriptors.length,
    versionCount,
  };
}

export function assertAgentRegistryValid(registry: AgentRegistry): RegistryValidationResult {
  const result = validateAgentRegistry(registry);
  if (!result.valid) {
    throw new Error(
      `Agent registry validation failed: ${result.issues.map((i) => i.message).join("; ")}`,
    );
  }
  return result;
}
