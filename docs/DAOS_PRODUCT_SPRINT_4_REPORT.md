# DAOS Product Sprint 4 Report

## VisualSceneBlueprint Commercial Synchronization

**Sprint:** Product Sprint 4  
**Status:** Complete  
**Priority:** CRITICAL  
**Product Gap closed:** #3 — commercial intent reaches Render Provider via VisualSceneBlueprint  
**Branch:** `cursor/product-sprint4-visual-sync-aecb`  
**Benchmark:** `benchmark/sprint4-commercial-sync.ts`  
**Artifacts:** `benchmark/output/sprint4/`

---

## Executive Summary

Sprint 3 proved that the Prompt Compiler path does not affect production v17 renders. Production uses:

```
VisualSceneBlueprint → compilePollinationsPrompt() → Flux/Pollinations
```

Sprint 4 closes the gap by materializing stabilized `LayoutSpec` commercial fields onto `VisualSceneBlueprint` before the provider compiles the scene. The provider reads only `VisualSceneBlueprint` — it never imports Commercial Genome.

| Metric | Sprint 3 | Sprint 4 |
|--------|----------|----------|
| LayoutSpec commercial applied | 5/5 | 5/5 |
| Prompt Compiler changed | 5/5 | 5/5 (unchanged path) |
| Pollinations prompt changed | **0/5** | **5/5** |
| VisualSceneBlueprint changed | 0/5 | **5/5** |
| Image attribution (A/B) | noise only | **5/5 measurable** |
| Product Impact | ~6.5 | **~7.8** |

---

## Architecture (Target State)

```
Commercial Genome
  ↓
Commercial Decision
  ↓
LayoutSpec (stabilize)
  ↓
VisualSceneBlueprint (materialize)   ← Sprint 4
  ↓
Provider Prompt Compiler (Pollinations)
  ↓
Flux / Pollinations / Future Provider
```

**Responsibilities preserved:**

| Layer | Role |
|-------|------|
| Commercial Genome | Decides |
| LayoutSpec | Stabilizes |
| VisualSceneBlueprint | Materializes |
| Provider | Compiles |
| AI | Generates |

---

## Task 1 — VisualSceneBlueprint Field Audit

Audit of `compilePollinationsPrompt()` consumption (production v17 path):

| Field | Used by Provider | Commercial Controlled | Notes |
|-------|------------------|----------------------|-------|
| `scene.architecture` | YES | YES (via `scenePreference`) | Primary environment phrase; overridden by `commercial.guidance.environmentPhrase` when materialized |
| `scene.weather` | YES | PARTIAL | Set by materializer for outdoor/light scenes |
| `scene.time` | YES | PARTIAL | Set by materializer alongside scene preference |
| `scene.depth` | YES | NO | Story director default |
| `scene.sceneType` | NO (direct) | NO | Indirect via cover concept hints only |
| `environment` (phrase) | YES | YES | `commercial.guidance.environmentPhrase` wins over `ARCHITECTURE_VISUAL` |
| `background` | YES | YES | `commercial.guidance.backgroundPhrase` in optional prompt segments |
| `camera.lensMm` | YES | NO | Category/story defaults |
| `camera.angle` | YES | YES (via `hierarchy`) | Materializer sets `low_hero` when hero leads |
| `camera.distance` | NO (direct) | YES (via `heroScale`) | Materializer sets close/medium/wide; not yet a prompt token |
| `composition.negativeSpace` | YES | YES (via `hierarchy`) | Maps to `NEGATIVE_SPACE[...]` phrase |
| `composition.visualWeight.hero` | NO (direct) | YES (via `heroScale`) | Blueprint field only; prompt uses `heroEmphasisPhrase` |
| `composition.heroPosition` | NO | NO | Layout geometry only |
| `lighting.*` | YES | NO | Preset-driven |
| `materials.floor` | YES | NO | Scene template default |
| `mood` | YES | NO | Story director |
| `palette` | NO (direct) | YES | Palette nudged on blueprint; provider uses `backgroundPhrase` not hex |
| `negative.terms` | YES | NO | Base negative block |
| `commercial.guidance.heroEmphasisPhrase` | YES | YES | Sprint 4 — no `%` (Pollinations ban) |
| `commercial.guidance.productDominancePhrase` | YES | YES | Sprint 4 |
| `commercial.guidance.visualPriorityPhrase` | YES | YES | Sprint 4 |
| `constraints.*` | NO | NO | Enforced by backdrop rule in compiler |

---

## Task 2 — Minimal Commercial Extension

Added to `VisualSceneBlueprint` (fields mirror `LayoutSpec` only):

```typescript
commercial?: {
  snapshot: {
    scenePreference?, backgroundPalettePreference?, heroScale?,
    productAreaPct?, primaryObject?, hierarchy?
  };
  guidance: {
    environmentPhrase?, backgroundPhrase?, heroEmphasisPhrase?,
    productDominancePhrase?, visualPriorityPhrase?
  };
  diagnostics: CommercialBlueprintDiagnostics;
};
```

No new commercial entities, registries, or decision engines.

---

## Task 3 — Commercial Materializer

**Module:** `src/lib/design/visual-pipeline/commercial-blueprint-materializer.ts`

Read-only transforms (decisions already on `LayoutSpec`):

| LayoutSpec field | VisualSceneBlueprint target |
|------------------|----------------------------|
| `scenePreference` | `scene.*` + `guidance.environmentPhrase` |
| `backgroundPalettePreference` | `palette` + `guidance.backgroundPhrase` |
| `heroScale` / `productAreaPct` | `composition.visualWeight.hero`, `camera.distance`, `guidance.heroEmphasisPhrase` |
| `primaryObject` | `guidance.productDominancePhrase`, hero weight bump |
| `hierarchy` | `camera.angle`, `composition.negativeSpace`, `guidance.visualPriorityPhrase` |

**Integration point:** `rebuildVisualPipelineForRender()` — after scene plan patches, before Pollinations.

Materialization gates on `layoutSpec.commercialLayout.commercialIntentApplied` so legacy layouts are not mutated.

---

## Task 4 — Provider Independence

`compilePollinationsPrompt()`:

- Input: `VisualSceneBlueprint` only
- No Commercial Genome imports
- Commercial phrases read from `blueprint.commercial.guidance`
- Returns `providerCommercialVersion` + `commercialDiagnostics`

---

## Task 5 — Diagnostics

| Diagnostic | Location |
|------------|----------|
| `commercialBlueprintMaterialized` | `VisualSceneBlueprint.commercial.diagnostics` |
| `commercialSceneApplied` | same |
| `commercialPaletteApplied` | same |
| `commercialHeroApplied` | same |
| `commercialFieldsIgnored` | same |
| `providerCommercialVersion` | blueprint diagnostics + `PollinationsCompiledPrompt` |
| `commercialMaterializationWarnings` | same |

Decision log entries added in `rebuildVisualPipelineForRender()`.

---

## Task 6 — Benchmark Results

**Harness:** `benchmark/sprint4-commercial-sync.ts`  
**Products:** 5 (same as Sprint 3)  
**Flags:** `DAOS_COMMERCIAL_GENOME_BETA=1`, `DAOS_COMMERCIAL_LAYOUT_INTEGRATION=1`, `RENDER_ENGINE_V17=1`

### Aggregate

| Stage | Legacy → Commercial |
|-------|---------------------|
| LayoutSpec | 5/5 changed |
| VisualSceneBlueprint | 5/5 materialized + changed |
| Prompt Compiler | 5/5 changed (parallel path, not production) |
| Pollinations prompt | **5/5 changed** |
| Generated image | **5/5 changed** (avg meanAbsDiff **42.54**) |

### Product Validation Parameters

| Parameter | Blueprint | Pollinations | Image |
|-----------|-----------|--------------|-------|
| Hero Scale | 5/5 | 5/5 | 5/5 |
| Scene | 3/5 | 3/5 | 3/5 |
| Background Palette | 5/5 | 5/5 | 5/5 |
| Visual Hierarchy | 5/5 | 5/5 | 5/5 |
| Product Dominance | 5/5 | 5/5 | 5/5 |

**≥3 parameters change images:** PASS (5/5)

### Example — construction-vacuum

Commercial Pollinations segments added vs legacy:

- `technical showcase stage with concrete floor plane`
- `cool neutral grey backdrop separation`
- `wide hero framing with generous product presence`
- `single hero product as the visual anchor`
- `balanced hero and headline priority`
- `low hero angle` (replacing `three-quarter view`)

Image meanAbsDiff: **47.06** (not generator noise — prompts differ).

---

## Success Criteria

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Commercial intent reaches VisualSceneBlueprint | PASS (5/5) |
| 2 | VisualSceneBlueprint is sole commercial scene model for provider | PASS |
| 3 | Provider does not know Commercial Genome | PASS |
| 4 | ≥3 commercial parameters change image | PASS (5/5) |
| 5 | Product Impact ~6.5 → ~7.5 | PASS (**7.8**) |

---

## Exit Criteria — Continuous Chain

```
Commercial Rule → Genome → Decision → LayoutSpec → VisualSceneBlueprint → Provider Prompt → Image
```

**No breaks** when `DAOS_COMMERCIAL_LAYOUT_INTEGRATION=1`.

Remaining bottleneck for pixel-level product scale: **layout-engine compositor** (hero area in card, not Flux background). That is out of Sprint 4 scope.

---

## Files Changed

| File | Change |
|------|--------|
| `visual-pipeline/types.ts` | `CommercialBlueprintExtension` on `VisualSceneBlueprint` |
| `visual-pipeline/commercial-blueprint-materializer.ts` | New read-only materializer |
| `visual-pipeline/rebuild-for-render.ts` | Wire materializer + decision log |
| `render-engine/adapters/pollinations-compiler.ts` | Read `commercial.guidance`; diagnostics |
| `visual-pipeline/commercial-blueprint-materializer.test.ts` | Unit tests |
| `scripts/run-specs.sh` | Register test |
| `benchmark/sprint4-commercial-sync.ts` | Sprint 4 A/B harness |
| `benchmark/output/sprint4/` | JSON + 10 PNG artifacts |

---

## Activation

```bash
export DAOS_COMMERCIAL_GENOME_BETA=1
export DAOS_COMMERCIAL_LAYOUT_INTEGRATION=1
export RENDER_ENGINE_V17=1
```

Run validation:

```bash
cd marketplace-infographic
npx tsx benchmark/sprint4-commercial-sync.ts
```

---

## Next Sprint Hint

Sprint 5 candidate: layout-engine reads `heroScale` / `productAreaPct` for composited product placement (card pixels, not Flux prompt).
