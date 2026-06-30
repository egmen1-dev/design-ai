# DESIGN AI v18 — Chapter 6.10: Blueprint Assembly Stage

## Purpose

Blueprint Assembly unites Story, Scene, Composition, and Photography into one **Render Blueprint** without making new design decisions.

## Design Philosophy

Each agent owns one domain until Assembly — the first point where all decisions become one engineering document.

## Responsibilities

| Area | Output |
|------|--------|
| Section merge | unified `RenderBlueprint` |
| Integrity | required sections present |
| Cross-module consistency | `AssemblyConflict[]` |
| Constraint merge | merged `ConstraintSet` |
| Metadata | `PipelineAssemblyMetadata` |
| Snapshot | `AssemblyBlueprintSnapshot` |
| Consensus handoff | `status: consistent \| inconsistent` |

Assembly does **not** resolve design conflicts — it collects them for Consensus Engine.

## Key APIs

| API | Role |
|-----|------|
| `assembleRenderBlueprint()` | Merge agent sections into RenderBlueprint |
| `detectCrossModuleConflicts()` | Story/scene/composition/photography conflicts |
| `mergeAssemblyConstraints()` | Story + composition + marketplace rules |
| `runBlueprintAssemblyStage()` | Full assembly pipeline |
| `blueprintAssemblyToMutations()` | Preserve per-agent authorship |
| `enrichPipelineContextWithBlueprintAssembly()` | Attach unified blueprint to context |

## Integration

- Ch 6.6–6.9 planning sections
- Ch 3 `RenderBlueprint` contract
- Ch 3.7 `ConstraintSet`
- Ch 6 `executeDesignPipelineStage(BLUEPRINT_ASSEMBLY)`
- Ch 6 Consensus Validation (downstream)

## Golden Rule

Dozens of independent professional decisions unite into one reproducible engineering document.

## Failure Conditions

Violated when sections are missing, authorship is lost, constraints or snapshot are absent, or assembly alters agent design decisions.
