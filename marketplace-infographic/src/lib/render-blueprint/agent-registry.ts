/**
 * Chapter 3.10 / 4.3 — Agent Registry
 * Sole DI container for BlueprintAgent instances — factory-based, lazy creation.
 */
import type { BlueprintLifecycle } from "./lifecycle-types";
import type { AgentContractId, AgentResultBase, BlueprintAgent } from "./agent-contracts";
import { AGENT_READ_MATRIX, AGENT_STAGE_MATRIX, AGENT_WRITE_MATRIX } from "./agent-matrix";
import { categoryForAgent } from "./universal-agent-contract";
import { capabilityTagsForAgent } from "./agent-registry-capabilities";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import { compareBlueprintVersions } from "./blueprint-version";
import {
  AgentType,
  AgentStatus,
  RegistryEventType,
  DEFAULT_ADAPTER_CAPABILITIES,
  DEFAULT_CRITIC_CAPABILITIES,
  DEFAULT_DIRECTOR_CAPABILITIES,
  type AgentCapabilities,
  type AgentDescriptor,
  type AgentFactory,
  type AgentInstanceRecord,
  type AgentMetadata,
  type AgentRegistration,
  type AgentStatusId,
  type AgentTypeId,
  type RegistryAgentReport,
  type RegistryEvent,
  type RegistryEventTypeId,
  type RegistryHealthIssue,
  type RegistryHealthResult,
  type RegistryReport,
  type RegistryRuntimeOptions,
} from "./agent-registry-types";

export {
  AgentType,
  AgentStatus,
  RegistryEventType,
  DEFAULT_DIRECTOR_CAPABILITIES,
  DEFAULT_CRITIC_CAPABILITIES,
  DEFAULT_ADAPTER_CAPABILITIES,
  type AgentDescriptor,
  type AgentCapabilities,
  type AgentMetadata,
  type AgentFactory,
  type AgentRegistration,
  type AgentInstanceRecord,
  type RegistryHealthIssue,
  type RegistryHealthResult,
  type RegistryAgentReport,
  type RegistryReport,
  type RegistryRuntimeOptions,
  type RegistryEvent,
  type RegistryEventTypeId,
  type AgentStatusId,
  type RegistryValidationResult,
} from "./agent-registry-types";

export {
  AGENT_REGISTRY_VERSION,
  AGENT_REGISTRY_GOLDEN_RULE,
  AGENT_CAPABILITY_TAGS,
  capabilityTagsForAgent,
} from "./agent-registry-capabilities";

export {
  validateAgentRegistry,
  assertAgentRegistryValid,
} from "./agent-registry-validation";

export class AgentRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentRegistryError";
  }
}

function inferAgentType(id: AgentContractId): AgentTypeId {
  if (id === "flux-adapter") return AgentType.ADAPTER;
  if (id === "governance" || id === "chief-design-director") return AgentType.ORCHESTRATOR;
  if (id === "critics") return AgentType.CRITIC;
  return AgentType.DIRECTOR;
}

function defaultCapabilities(id: AgentContractId): AgentCapabilities {
  const type = inferAgentType(id);
  if (type === AgentType.ADAPTER) return { ...DEFAULT_ADAPTER_CAPABILITIES };
  if (type === AgentType.CRITIC) return { ...DEFAULT_CRITIC_CAPABILITIES };
  return { ...DEFAULT_DIRECTOR_CAPABILITIES };
}

function defaultMetadata(agent: BlueprintAgent<unknown, AgentResultBase>): AgentMetadata {
  return {
    author: "design-ai",
    description: `Blueprint agent ${agent.id}`,
    supportedStages: [agent.stage],
    dependencies: [],
  };
}

export function descriptorFromAgent(
  agent: BlueprintAgent<unknown, AgentResultBase>,
  overrides?: Partial<AgentDescriptor>,
): AgentDescriptor {
  const status = overrides?.status ?? (overrides?.enabled === false ? AgentStatus.DISABLED : AgentStatus.ACTIVE);
  return {
    id: agent.id,
    name: overrides?.name ?? agent.id,
    version: agent.version,
    stage: agent.stage,
    type: overrides?.type ?? inferAgentType(agent.id),
    producer: overrides?.producer ?? agent.id,
    enabled: overrides?.enabled ?? status === AgentStatus.ACTIVE,
    category: overrides?.category ?? categoryForAgent(agent.id) ?? undefined,
    produces: overrides?.produces ?? [...(AGENT_WRITE_MATRIX[agent.id] ?? [])],
    consumes: overrides?.consumes ?? [...(AGENT_READ_MATRIX[agent.id] ?? [])],
    capabilityTags: overrides?.capabilityTags ?? capabilityTagsForAgent(agent.id),
    status,
  };
}

export function registrationFromAgent(
  agent: BlueprintAgent<unknown, AgentResultBase>,
  partial?: {
    descriptor?: Partial<AgentDescriptor>;
    capabilities?: Partial<AgentCapabilities>;
    metadata?: Partial<AgentMetadata>;
  },
): AgentRegistration {
  return {
    descriptor: descriptorFromAgent(agent, partial?.descriptor),
    factory: { create: () => agent },
    capabilities: { ...defaultCapabilities(agent.id), ...partial?.capabilities },
    metadata: { ...defaultMetadata(agent), ...partial?.metadata },
  };
}

export class AgentRegistry {
  private readonly entries = new Map<AgentContractId, AgentRegistration>();
  private readonly versions = new Map<AgentContractId, Map<string, AgentRegistration>>();
  private readonly activeVersion = new Map<AgentContractId, string>();
  private readonly active = new Map<AgentContractId, AgentInstanceRecord>();
  private readonly runReports = new Map<AgentContractId, RegistryAgentReport>();
  private readonly eventListeners: Array<(event: RegistryEvent) => void> = [];
  private locked = false;
  private probeBlueprint = createEmptyRenderBlueprint({ category: "probe" });

  get isLocked(): boolean {
    return this.locked;
  }

  /** Chapter 4.3 — subscribe to registry changes */
  onRegistryEvent(listener: (event: RegistryEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  private emit(type: RegistryEventTypeId, agentId: string, version: string, detail?: string): void {
    const event: RegistryEvent = { type, agentId, version, at: Date.now(), detail };
    for (const listener of this.eventListeners) listener(event);
  }

  /** Minimal blueprint for contract probes */
  createProbeBlueprint() {
    return this.probeBlueprint;
  }

  private isRunnable(descriptor: AgentDescriptor): boolean {
    const status = descriptor.status ?? (descriptor.enabled ? AgentStatus.ACTIVE : AgentStatus.DISABLED);
    return status === AgentStatus.ACTIVE || status === AgentStatus.EXPERIMENTAL;
  }

  private storeRegistration(registration: AgentRegistration): void {
    const { descriptor } = registration;
    const id = descriptor.id;
    const version = descriptor.version;

    let versionMap = this.versions.get(id);
    if (!versionMap) {
      versionMap = new Map();
      this.versions.set(id, versionMap);
    }
    if (versionMap.has(version)) {
      throw new AgentRegistryError(`Agent ${id} version ${version} already registered`);
    }
    versionMap.set(version, registration);

    const currentActive = this.activeVersion.get(id);
    if (!currentActive || compareBlueprintVersions(version, currentActive) > 0) {
      this.activeVersion.set(id, version);
      this.entries.set(id, registration);
    }
  }

  /** Register at application startup — forbidden during pipeline */
  register(registration: AgentRegistration): void;
  register(agent: BlueprintAgent<unknown, AgentResultBase>): void;
  register(
    registrationOrAgent: AgentRegistration | BlueprintAgent<unknown, AgentResultBase>,
  ): void {
    if ("execute" in registrationOrAgent && "toUpdates" in registrationOrAgent) {
      this.registerBlueprintAgent(registrationOrAgent);
      return;
    }
    const registration = registrationOrAgent as AgentRegistration;
    if (this.locked) {
      throw new AgentRegistryError("Cannot register agents while registry is locked (pipeline running)");
    }
    const { descriptor, factory } = registration;
    const versionMap = this.versions.get(descriptor.id);
    if (versionMap?.has(descriptor.version)) {
      throw new AgentRegistryError(`Agent ${descriptor.id} version ${descriptor.version} already registered`);
    }
    if (!factory?.create) {
      throw new AgentRegistryError(`Agent ${descriptor.id} missing factory.create()`);
    }
    const expectedStage = AGENT_STAGE_MATRIX[descriptor.id];
    if (expectedStage && expectedStage !== descriptor.stage) {
      throw new AgentRegistryError(
        `Agent ${descriptor.id} stage ${descriptor.stage} does not match matrix ${expectedStage}`,
      );
    }
    this.storeRegistration(registration);
    this.emit(RegistryEventType.AGENT_REGISTERED, descriptor.id, descriptor.version);
  }

  /** Convenience — wraps BlueprintAgent in a static factory */
  registerBlueprintAgent(
    agent: BlueprintAgent<unknown, AgentResultBase>,
    partial?: Parameters<typeof registrationFromAgent>[1],
  ): void {
    const registration = registrationFromAgent(agent, partial);
    if (this.locked) {
      throw new AgentRegistryError("Cannot register agents while registry is locked (pipeline running)");
    }
    const { descriptor, factory } = registration;
    const versionMap = this.versions.get(descriptor.id);
    if (versionMap?.has(descriptor.version)) {
      throw new AgentRegistryError(`Agent ${descriptor.id} version ${descriptor.version} already registered`);
    }
    if (!factory?.create) {
      throw new AgentRegistryError(`Agent ${descriptor.id} missing factory.create()`);
    }
    const expectedStage = AGENT_STAGE_MATRIX[descriptor.id];
    if (expectedStage && expectedStage !== descriptor.stage) {
      throw new AgentRegistryError(
        `Agent ${descriptor.id} stage ${descriptor.stage} does not match matrix ${expectedStage}`,
      );
    }
    this.storeRegistration(registration);
    this.emit(RegistryEventType.AGENT_REGISTERED, descriptor.id, descriptor.version);
  }

  /** @deprecated alias */
  registerAgent(agent: BlueprintAgent<unknown, AgentResultBase>): void {
    this.registerBlueprintAgent(agent);
  }

  lock(): void {
    this.locked = true;
  }

  unlock(): void {
    this.locked = false;
  }

  /** Chapter 4.3 — unregister agent (all versions) */
  unregister(agentId: AgentContractId): void {
    if (this.locked) {
      throw new AgentRegistryError("Cannot unregister agents while registry is locked");
    }
    const versionMap = this.versions.get(agentId);
    if (!versionMap) {
      throw new AgentRegistryError(`Agent ${agentId} not found in registry`);
    }
    const active = this.activeVersion.get(agentId);
    for (const version of versionMap.keys()) {
      this.emit(RegistryEventType.AGENT_REMOVED, agentId, version);
    }
    this.versions.delete(agentId);
    this.entries.delete(agentId);
    this.activeVersion.delete(agentId);
    this.active.delete(agentId);
    this.runReports.delete(agentId);
    if (active) void active;
  }

  /** Chapter 4.3 — agent exists in registry */
  hasAgent(agentId: AgentContractId): boolean {
    return this.versions.has(agentId);
  }

  /** Chapter 4.3 — get agent instance (throws if missing) */
  getAgent(agentId: AgentContractId, version?: string): BlueprintAgent<unknown, AgentResultBase> {
    const instance = version
      ? this.createInstanceForVersion(agentId, version)
      : this.getById(agentId);
    if (!instance) {
      throw new AgentRegistryError(`Agent ${agentId} not found or not runnable`);
    }
    return instance;
  }

  /** Chapter 4.3 — all runnable agent instances */
  getAll(): BlueprintAgent<unknown, AgentResultBase>[] {
    return [...this.entries.entries()]
      .filter(([, entry]) => this.isRunnable(entry.descriptor))
      .map(([id]) => this.createInstance(id)!)
      .filter(Boolean);
  }

  /** Chapter 4.3 — find by ecosystem category */
  findByCategory(category: import("./universal-agent-contract-types").AgentCategoryId): BlueprintAgent<unknown, AgentResultBase>[] {
    return [...this.entries.entries()]
      .filter(([, entry]) => entry.descriptor.category === category && this.isRunnable(entry.descriptor))
      .map(([id]) => this.createInstance(id)!)
      .filter(Boolean);
  }

  listRegistrations(): AgentRegistration[] {
    const all: AgentRegistration[] = [];
    for (const versionMap of this.versions.values()) {
      all.push(...versionMap.values());
    }
    return all;
  }

  listVersions(agentId: AgentContractId): string[] {
    const versionMap = this.versions.get(agentId);
    if (!versionMap) return [];
    return [...versionMap.keys()].sort((a, b) => compareBlueprintVersions(a, b));
  }

  setActiveVersion(agentId: AgentContractId, version: string): void {
    if (this.locked) {
      throw new AgentRegistryError("Cannot change active version while registry is locked");
    }
    const versionMap = this.versions.get(agentId);
    const registration = versionMap?.get(version);
    if (!registration) {
      throw new AgentRegistryError(`Agent ${agentId} version ${version} not registered`);
    }
    this.activeVersion.set(agentId, version);
    this.entries.set(agentId, registration);
    this.emit(RegistryEventType.AGENT_UPDATED, agentId, version, "active_version_set");
  }

  disableAgent(agentId: AgentContractId): void {
    const entry = this.entries.get(agentId);
    if (!entry) throw new AgentRegistryError(`Agent ${agentId} not found`);
    entry.descriptor.enabled = false;
    entry.descriptor.status = AgentStatus.DISABLED;
    this.emit(RegistryEventType.AGENT_DISABLED, agentId, entry.descriptor.version);
  }

  getDescriptor(id: AgentContractId): AgentDescriptor | undefined {
    return this.entries.get(id)?.descriptor;
  }

  getRegistration(id: AgentContractId): AgentRegistration | undefined {
    return this.entries.get(id);
  }

  has(stage: BlueprintLifecycle): boolean {
    return this.getEnabledForStage(stage).length > 0;
  }

  /** Lookup by stage — lazy factory creation */
  get(stage: BlueprintLifecycle): BlueprintAgent<unknown, AgentResultBase>[] {
    return this.createForStage(stage);
  }

  getByStage(stage: BlueprintLifecycle): BlueprintAgent<unknown, AgentResultBase>[] {
    return this.get(stage);
  }

  getById(id: AgentContractId): BlueprintAgent<unknown, AgentResultBase> | undefined {
    const entry = this.entries.get(id);
    if (!entry || !this.isRunnable(entry.descriptor)) return undefined;
    return this.createInstance(id);
  }

  createForStage(stage: BlueprintLifecycle): BlueprintAgent<unknown, AgentResultBase>[] {
    return this.getEnabledForStage(stage).map((id) => this.createInstance(id)!);
  }

  private getEnabledForStage(stage: BlueprintLifecycle): AgentContractId[] {
    const ids: AgentContractId[] = [];
    for (const [id, entry] of this.entries) {
      if (this.isRunnable(entry.descriptor) && entry.descriptor.stage === stage) {
        ids.push(id);
      }
    }
    return ids;
  }

  private createInstanceForVersion(
    id: AgentContractId,
    version: string,
  ): BlueprintAgent<unknown, AgentResultBase> | undefined {
    const registration = this.versions.get(id)?.get(version);
    if (!registration || !this.isRunnable(registration.descriptor)) return undefined;
    const instance = registration.factory.create();
    if (instance.id !== id) {
      throw new AgentRegistryError(`Factory for ${id}@${version} returned wrong id ${instance.id}`);
    }
    return instance;
  }

  private createInstance(id: AgentContractId): BlueprintAgent<unknown, AgentResultBase> | undefined {
    const entry = this.entries.get(id);
    if (!entry || !this.isRunnable(entry.descriptor)) return undefined;

    const existing = this.active.get(id);
    if (existing && !existing.disposed) return existing.instance;

    const instance = entry.factory.create();
    if (instance.id !== id) {
      throw new AgentRegistryError(`Factory for ${id} returned agent with id ${instance.id}`);
    }
    if (instance.stage !== entry.descriptor.stage) {
      throw new AgentRegistryError(
        `Factory for ${id} returned wrong stage ${instance.stage}`,
      );
    }

    const record: AgentInstanceRecord = {
      descriptor: entry.descriptor,
      instance,
      createdAt: Date.now(),
      disposed: false,
    };
    this.active.set(id, record);
    return instance;
  }

  disposeInstances(): void {
    for (const [id, record] of this.active) {
      if (record.disposed) continue;
      const entry = this.entries.get(id);
      entry?.factory.dispose?.(record.instance);
      record.disposed = true;
    }
    this.active.clear();
  }

  recordRunResult(
    id: AgentContractId,
    report: Omit<RegistryAgentReport, "id" | "version" | "stage">,
  ): void {
    const descriptor = this.entries.get(id)?.descriptor;
    if (!descriptor) return;
    this.runReports.set(id, {
      id,
      version: descriptor.version,
      stage: descriptor.stage,
      ...report,
    });
  }

  getReport(): RegistryReport {
    const agents = [...this.runReports.values()];
    for (const [id, entry] of this.entries) {
      if (!this.isRunnable(entry.descriptor)) continue;
      if (!agents.some((a) => a.id === id)) {
        agents.push({
          id,
          version: entry.descriptor.version,
          stage: entry.descriptor.stage,
        });
      }
    }
    return { agents, generatedAt: Date.now() };
  }

  /** Startup health check — blocks app boot on failure */
  healthCheck(options: RegistryRuntimeOptions = {}): RegistryHealthResult {
    const issues: RegistryHealthIssue[] = [];

    for (const [id, entry] of this.entries) {
      if (!entry.factory?.create) {
        issues.push({
          code: "MISSING_FACTORY",
          message: `Agent ${id} has no factory`,
          agentId: id,
        });
        continue;
      }
      try {
        const probe = entry.factory.create();
        if (probe.stage !== entry.descriptor.stage) {
          issues.push({
            code: "STAGE_MISMATCH",
            message: `Agent ${id} factory stage mismatch`,
            agentId: id,
          });
        }
        entry.factory.dispose?.(probe);
      } catch (e) {
        issues.push({
          code: "MISSING_FACTORY",
          message: `Agent ${id} factory failed: ${e instanceof Error ? e.message : "unknown"}`,
          agentId: id,
        });
      }

      if (entry.capabilities.requiresVision && options.visionEngineAvailable === false) {
        issues.push({
          code: "VISION_UNAVAILABLE",
          message: `Agent ${id} requires vision engine`,
          agentId: id,
        });
      }
    }

    const cycle = detectDependencyCycle(this.entries);
    if (cycle) {
      issues.push({
        code: "CYCLIC_DEPENDENCY",
        message: `Cyclic agent dependency: ${cycle.join(" → ")}`,
      });
    }

    return { ok: issues.length === 0, issues };
  }

  assertHealthy(options: RegistryRuntimeOptions = {}): void {
    const result = this.healthCheck(options);
    if (!result.ok) {
      throw new AgentRegistryError(
        `Agent registry health check failed: ${result.issues.map((i) => i.message).join("; ")}`,
      );
    }
  }

  listDescriptors(): AgentDescriptor[] {
    return [...this.entries.values()].map((e) => ({ ...e.descriptor }));
  }
}

function detectDependencyCycle(
  entries: Map<AgentContractId, AgentRegistration>,
): string[] | null {
  const graph = new Map<string, string[]>();
  for (const [id, entry] of entries) {
    graph.set(
      id,
      entry.metadata.dependencies.filter((dep) => entries.has(dep as AgentContractId)),
    );
  }

  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): string[] | null {
    if (stack.has(node)) {
      const idx = path.indexOf(node);
      return [...path.slice(idx), node];
    }
    if (visited.has(node)) return null;
    visited.add(node);
    stack.add(node);
    path.push(node);
    for (const next of graph.get(node) ?? []) {
      const cycle = dfs(next);
      if (cycle) return cycle;
    }
    path.pop();
    stack.delete(node);
    return null;
  }

  for (const id of graph.keys()) {
    const cycle = dfs(id);
    if (cycle) return cycle;
  }
  return null;
}

export function createDefaultAgentRegistry(): AgentRegistry {
  return new AgentRegistry();
}

export const defaultAgentRegistry = createDefaultAgentRegistry();
