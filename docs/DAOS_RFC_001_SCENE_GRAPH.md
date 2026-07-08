# DAOS RFC-001 — Unified Scene Graph Architecture (DAOS v2)

## Problem

After Waves 26–34, local patches deliver diminishing returns because different pipeline stages maintain separate scene representations:

| Component | Representation |
|-----------|----------------|
| Layout Planner | Planned geometry |
| Scene Compositor | Composited placement |
| HTML Overlay | Patched layout for render |
| Design Constitution | Estimated metrics |

This causes persistent drift: planned area ≠ factual area, LAW_003 uses stale data, LAW_014 requires patches, overlay builds around assumed (not actual) product geometry.

## Solution

**Single source of truth: Scene Graph.**

All components read and write through `src/lib/scene-graph/`. Each node stores `planned`, `actual`, `confidence`, `source`, and `history`.

## Pipeline (target architecture)

```
Planner → Scene Graph → Compositor → Updated Scene Graph
       → Overlay Engine → Updated Scene Graph → Constitution → Render
```

## Phase 1 (this PR) — Mirror Mode

Migration stage 1: create Scene Graph infrastructure and mirror the existing pipeline without changing behavior.

### Feature flag

```
DAOS_SCENE_GRAPH_V2=1   # default OFF
```

When enabled, the pipeline records four snapshots per run:

| File | Stage |
|------|-------|
| `sceneGraphBefore.json` | After planner |
| `sceneGraphAfterCompositor.json` | After compositor |
| `sceneGraphAfterOverlay.json` | After overlay patches |
| `sceneGraphFinal.json` | After constitution audits |

Drift reports are written to `sceneGraphDrifts.json`.

### Modules

```
src/lib/scene-graph/
  SceneGraph.ts
  SceneNode.ts
  SceneGraphBuilder.ts
  SceneGraphValidator.ts
  SceneGraphSerializer.ts
  index.ts

src/lib/daos/scene-graph/
  scene-graph-mirror.ts   # pipeline orchestration
```

### Constraints (unchanged)

- Current API, UI, prompt compiler, and render providers are not modified
- Existing diagnostics remain
- All existing tests must pass

## Migration roadmap

| Stage | Action |
|-------|--------|
| 1 | Create SceneGraph, mirror pipeline (this PR) |
| 2 | Planner writes SceneGraph |
| 3 | Compositor updates SceneGraph.actual |
| 4 | Overlay reads ProductNode.actual |
| 5 | Constitution uses SceneGraph.actual only |
| 6 | Remove legacy metrics |

## Expected outcome

After full migration:

- LAW_003 uses factual product/whitespace geometry
- LAW_014 uses real overlay ∩ product intersections
- Planned vs actual drift becomes measurable in benchmark
- Wave 21–34 patches simplify or become unnecessary
