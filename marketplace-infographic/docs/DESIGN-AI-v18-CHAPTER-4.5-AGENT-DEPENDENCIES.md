# DESIGN AI v18 — Chapter 4.5: Agent Dependencies

## Purpose

Agent Dependencies defines the dependency architecture between Design AI intelligent agents. The main goal is to guarantee that each agent runs only when all required data already exists in the RenderBlueprint.

Dependencies describe **data** relationships, not agent-to-agent relationships.

## Design Philosophy

In Design AI, an agent never depends on another agent. An agent depends only on RenderBlueprint sections.

```
Scene Director → Scene Section → Composition Director
```

Not:

```
Scene Director → Composition Director
```

## Core Principle

Agent Dependencies are **Data Dependencies**, not **Code Dependencies**. All links are built exclusively through RenderBlueprint.

## Dependency Model

```typescript
interface AgentDependency {
  consumes: BlueprintSection[];   // required reads
  produces: BlueprintSection[];   // owned writes
  optional: BlueprintSection[];   // soft dependencies
  conditional: DependencyRequirement[];  // conditional required
}
```

Lifecycle analyzes only this contract.

## Types of Dependencies

| Type | Behavior |
|------|----------|
| **Required** | Agent cannot run without section |
| **Optional** | Section used if present; pipeline continues if absent |
| **Conditional** | Required only when condition is met (e.g. composite when composite enabled) |

## Dependency Graph

```
Analysis → Story → Scene → Photography → Composition → Render Intent → Adapter → Render → Vision
```

The graph is a DAG — no cycles. Registry must detect cycles before pipeline start.

## Dependency Resolution

```
Blueprint → Dependency Graph → Topological Sort → Execution Plan
```

## Ownership Rule

Each section has a single owner (from `AGENT_WRITE_MATRIX`). All other agents may only read. After publication, sections are read-only for dependents.

## Validation

Before agent run, Lifecycle checks:

- All required sections exist
- Required sections are valid
- Section versions compatible (via blueprint revision)
- No ownership conflicts

## Dependency Scope

Agents may depend only on:

- RenderBlueprint
- Pipeline configuration
- Diagnostic context

Forbidden: files, globals, other agent state, previous runs.

## Soft Dependencies

Optional data for quality (e.g. Genome → Composition Director). Agent continues with heuristics when absent.

## Propagation

Section change does not rebuild entire pipeline. Only agents that directly or indirectly depend on the changed section re-run.

Example: `lighting` change → `composition`, `constraints`, `validation` — agents `composition-director`, `governance` re-run; `visual-story-director`, `scene-director` do not.

## Implementation

| Module | Role |
|--------|------|
| `agent-dependency-types.ts` | Contracts, validation/propagation types |
| `agent-dependency-graph.ts` | Section DAG, cycle detection, topological sort |
| `agent-dependency-engine.ts` | Validation, ownership, propagation, execution plan |

## Golden Rule

There are no dependencies between agents in Design AI. Only dependencies between data represented in RenderBlueprint. If an agent requires another agent instead of the corresponding section, the Agent Ecosystem architecture is violated.
