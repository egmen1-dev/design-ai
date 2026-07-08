# RFC-2600 — Metric Registry Runtime (Phase A1)

| Field | Value |
|-------|-------|
| **RFC Number** | RFC-2600 |
| **Title** | Metric Registry Runtime — `productAreaRatio` pilot |
| **Author** | DAOS Architecture Council (Audit-driven) |
| **Status** | Draft (Proposed) |
| **Layer** | Foundation / Quality |
| **Normative** | Mandatory after acceptance |
| **Constitution** | [Volume 26 — Metric Registry](../architecture/constitution-v3/volume-26-metric-registry/) |
| **Audit** | Architecture Compliance Report 2026-07-07 — Violation **V-001** |
| **Roadmap** | [Phase A1](../roadmap/IMPLEMENTATION_ROADMAP.md) |

Related: [RFC-2600 (constitution)](../architecture/constitution-v3/volume-26-metric-registry/part-01/RFC-2600.md) · [RFC-2601](../architecture/constitution-v3/volume-26-metric-registry/part-01/RFC-2601.md) · [RFC-2604](../architecture/constitution-v3/volume-26-metric-registry/part-01/RFC-2604.md) · [RFC-010](RFC-010_ARCHITECTURE_COUNCIL.md) · [RFC-2900](../architecture/constitution-v3/volume-29-platform-quality-governance/part-01/RFC-2900.md)

---

# 1. Purpose

Establish a **minimal runtime Metric Registry** that becomes the single source of truth for metric **definitions and computation**, starting with **`productAreaRatio`**.

This RFC addresses **Violation V-001** (multiple SSOT for metrics) without rewriting the generation pipeline, without migrating all metrics, and **without changing production pass/fail behavior** in Wave 1.

---

# 2. Problem Statement

## 2.1 Current state

`productAreaRatio` is computed independently in at least **five resolver implementations**:

| Location | Resolver | Input domain |
|----------|----------|--------------|
| `scene-graph/SceneGraphLaw003V2.ts` | `resolveProductAreaRatio(graph)` | SceneGraph + wide-template branch |
| `scene-graph/SceneGraphConstitutionMirror.ts` | `resolveProductArea(graph)` | SceneGraph (planned fallback) |
| `daos/audit/composer-quality-audit.ts` | `resolveProductAreaRatio(input)` | Placement, blueprint, canvas |
| `daos/audit/product-scale-audit.ts` | `resolveProductAreaRatio(input)` | Composite placement, layout spec |
| `daos/overlay/geometry-whitespace-patch.ts` | `resolveProductAreaRatio(input)` | Composition layout metrics |

Additional **consumers** (not owners) read or propagate values:

- `generate-infographic-handler.ts` — sets `diagnostics.productAreaRatio` from heterogeneous sources
- `daos/debug/daos-debug-bundle.ts` — serializes metric into debug artifact
- `daos/benchmark/metrics.ts` — extracts `productAreaRatio` from debug bundle
- `tmp/daos-stage*-benchmark.ts` — fallback chains across V2 / composite / placement

## 2.2 Architectural violation

| Constitution rule | Status |
|-------------------|--------|
| RFC-2600 — one canonical metric | **FAIL** |
| RFC-2604 — calculate exactly once | **FAIL** |
| SPEC-2603 — consumers reuse, never recompute | **FAIL** |
| RFC-2602 — single owner (SceneGraph) | **FAIL** (audits own local formulas) |

## 2.3 Observed risks

- LAW_003 V2 pass/fail may disagree with composer/product-scale audits on the same run
- Benchmark arms compare non-equivalent `productAreaRatio` values
- Debug bundle may record a different ratio than SceneGraph evaluation used
- Future waves add more inline calculations (Vol 21 debt acceleration)

---

# 3. Scope

## 3.1 In scope (Wave 1 — this RFC)

| Item | Detail |
|------|--------|
| Runtime module | `marketplace-infographic/src/lib/daos/metric-registry/` |
| Registry format | Typed metric catalog + compute dispatch |
| Pilot metric | `METRIC_PRODUCT_AREA_RATIO` (`productAreaRatio`) |
| Context adapters | SceneGraph, CompositePlacement, PlacementBounds |
| Shadow mode | Old vs new comparison logging |
| Consumer migration | SceneGraph LAW_003 paths (V2 + Mirror) |
| Tests | Unit + equivalence fixtures |
| CI guard | Block new inline `productAreaRatio` resolvers outside registry |

## 3.2 Out of scope (deferred)

| Item | Deferred to |
|------|-------------|
| `overlayDensity`, `emptySpaceEstimate`, `productDominanceScore` | RFC-2600-W2+ |
| Full audit module rewrite | RFC-2600-W3 |
| Benchmark certified metric catalog | RFC-2900 |
| GenerationContext integration | RFC-2500 |
| YAML-driven metric definitions | RFC-2600-W2 |
| Handler decomposition | RFC-900-R |
| Changing LAW_003 thresholds | Never without Genome + benchmark evidence |

## 3.3 Non-goals (explicit prohibitions)

Per Architecture Council directive and audit constraints:

1. **Do not rewrite** `generate-infographic-handler.ts` structure
2. **Do not migrate** all 29 `productAreaRatio` touchpoints in one PR
3. **Do not change** production pass/fail outcomes in Wave 1
4. **Do not change** LAW_003 numeric thresholds (`0.32`, `0.25`, etc.)
5. **Do not change** rendered image output or compositor behavior
6. **Do not remove** legacy resolvers until shadow mode validates equivalence

---

# 4. Architecture

## 4.1 Target data flow

```text
Source data (SceneGraph | Placement | Composite)
        ↓
MetricRegistry.compute("METRIC_PRODUCT_AREA_RATIO", context)
        ↓
MetricValue { value, unit, source, provenance, version }
        ↓
Consumers (LAW_003, debug bundle, audits — read only)
```

## 4.2 Module layout (proposed)

```text
src/lib/daos/metric-registry/
├── index.ts                    # public API
├── types.ts                    # MetricId, MetricValue, MetricContext
├── registry.ts                 # metric catalog (Wave 1: TS catalog)
├── compute.ts                  # dispatch
├── metrics/
│   └── product-area-ratio.ts   # canonical resolver + priority chain
├── adapters/
│   ├── scene-graph.ts          # SceneGraph → MetricContext
│   ├── placement.ts            # bounds + canvas → MetricContext
│   └── composite.ts            # NormalizedCompositePlacement → MetricContext
├── shadow.ts                   # compare legacy vs registry (dev/benchmark)
└── tests/
    ├── product-area-ratio.test.ts
    └── equivalence-fixtures.ts
```

## 4.3 Public API (normative)

```typescript
/** Immutable metric identity — matches constitution metricId */
type MetricId = "METRIC_PRODUCT_AREA_RATIO";

type MetricUnit = "ratio";

type MetricSource =
  | "scene_graph.product.actual.areaRatio"
  | "scene_graph.product.actual.visibleAreaRatio"
  | "scene_graph.product.actual.bounds"
  | "scene_graph.composition.actual.productAreaPct"
  | "scene_graph.product.planned.bounds"
  | "composite_placement.areaRatio"
  | "placement.bounds"
  | "composition_layout.productAreaPct"
  | "unknown";

type MetricValue = {
  metricId: MetricId;
  value: number;           // clamped [0, 1]
  unit: MetricUnit;
  version: string;         // e.g. "1.0.0"
  source: MetricSource;
  provenance: string;      // human-readable resolution step
  computedAt: string;      // ISO timestamp
};

type MetricContext =
  | { kind: "scene_graph"; graph: SceneGraph; mode?: "law003_v2" | "mirror" }
  | { kind: "composite"; placement: NormalizedCompositePlacement }
  | { kind: "placement"; bounds: ProductBounds; canvas: CanvasSize }
  | { kind: "precomputed"; value: number; source: MetricSource };

function computeMetric(id: MetricId, ctx: MetricContext): MetricValue;

function getMetricDefinition(id: MetricId): MetricDefinition;
```

Consumers **SHALL** call `computeMetric` or receive a precomputed `MetricValue`.  
Consumers **SHALL NOT** implement local area/canvas division for `productAreaRatio`.

## 4.4 Canonical metric definition — `METRIC_PRODUCT_AREA_RATIO`

```yaml
metricId: METRIC_PRODUCT_AREA_RATIO
displayName: productAreaRatio
description: >
  Ratio of visible product area to canvas area.
owner: SceneGraph
unit: ratio
dataType: number
version: "1.0.0"
lifecycle: production
status: active

formula: |
  clamp01(
    visibleProductArea / canvasArea
  )

dependencies:
  - visibleProductArea
  - canvasArea

consumers:
  - SceneGraphLaw003V2
  - SceneGraphConstitutionMirror
  - ComposerQualityAudit        # Wave 3 — read only
  - ProductScaleAudit             # Wave 3 — read only
  - DaosDebugBundle
  - BenchmarkReporter             # Wave 3 — read only

sourceOfTruth: metric-registry
```

## 4.5 Resolution priority chain (normative)

Wave 1 defines **one** priority chain per context kind.  
Behavior preservation requires documenting equivalence with existing resolvers.

### 4.5.1 Context: `scene_graph` + mode `law003_v2`

Matches `SceneGraphLaw003V2.resolveProductAreaRatio`:

```text
1. IF wideProductTemplateApplied AND composition.actual.productAreaPct > 0
     → productAreaPct / 100
2. ELSE IF product.actual.areaRatio > 0
     → product.actual.areaRatio
3. ELSE IF product.actual.visibleAreaRatio > 0
     → product.actual.visibleAreaRatio
4. ELSE IF product.actual.width AND product.actual.height
     → (width × height) / canvasArea
5. ELSE IF composition.actual.productAreaPct != null
     → productAreaPct / 100
6. ELSE → 0
```

### 4.5.2 Context: `scene_graph` + mode `mirror`

Matches `SceneGraphConstitutionMirror.resolveProductArea`:

```text
1–4. Same actual chain as above (returns source: actual)
5. ELSE IF product.planned.width AND product.planned.height
     → planned bounds / canvasArea (source: planned)
6. ELSE IF composition.actual.productAreaPct != null
     → productAreaPct / 100 (source: planned)
7. ELSE → 0 (source: planned)
```

### 4.5.3 Context: `composite`

```text
1. composite_placement.areaRatio (clamped)
```

### 4.5.4 Context: `placement`

```text
1. (bounds.width × bounds.height) / canvasArea (clamped)
```

### 4.5.5 Context: `precomputed`

Pass-through for debug/benchmark when upstream already computed via registry.  
**Prohibited in new code** except benchmark replay of stored `MetricValue`.

> **Note:** `law003_v2` and `mirror` modes intentionally differ on planned fallback.  
> This is **not a registry bug** — they are different evaluation contexts.  
> The registry makes the difference **explicit** via `mode` and `provenance`.

---

# 5. Migration Plan (strangler, 4 waves)

## Wave 1 — Registry + SceneGraph authority (this RFC implementation)

| Step | Action | Behavior change |
|------|--------|-----------------|
| W1.1 | Add `metric-registry` module | None |
| W1.2 | Implement `METRIC_PRODUCT_AREA_RATIO` | None |
| W1.3 | `SceneGraphLaw003V2` delegates to registry (`mode: law003_v2`) | None — same formula |
| W1.4 | `SceneGraphConstitutionMirror` delegates to registry (`mode: mirror`) | None — same formula |
| W1.5 | Shadow comparator in tests + optional `DAOS_METRIC_REGISTRY_SHADOW=1` | Log only |
| W1.6 | Unit tests + equivalence fixtures from existing tests | None |

**Exit criteria Wave 1:** All existing `scene-graph-law003-v2` and `scene-graph-constitution-mirror` tests pass unchanged.

## Wave 2 — Debug bundle SSOT

| Step | Action |
|------|--------|
| W2.1 | Handler writes `diagnostics.productAreaRatio` from registry output only |
| W2.2 | Add `diagnostics.productAreaRatioProvenance` field |
| W2.3 | Benchmark `extractMetricsFromBundle` reads provenance |

**Exit criteria Wave 2:** Debug bundle metric matches SceneGraph evaluation on same run.

## Wave 3 — Audit consumers (read-only)

| Step | Action |
|------|--------|
| W3.1 | `composer-quality-audit` — remove local resolver; accept `MetricValue` or compute via registry |
| W3.2 | `product-scale-audit` — same |
| W3.3 | `geometry-whitespace-patch` — read precomputed value; no local resolver |
| W3.4 | Delete deprecated private `resolveProductAreaRatio` functions |

**Exit criteria Wave 3:** Zero `function resolveProductAreaRatio` outside `metric-registry/`.

## Wave 4 — CI enforcement

| Step | Action |
|------|--------|
| W4.1 | ESLint / rg CI rule: no `productAreaRatio` division outside registry |
| W4.2 | Remove shadow mode default; keep opt-in for regression |
| W4.3 | Update IMPLEMENTATION_ROADMAP Phase A1 → done |

---

# 6. Feature Flag

| Flag | Default | Purpose |
|------|---------|---------|
| `DAOS_METRIC_REGISTRY` | `0` | Master enable for registry dispatch |
| `DAOS_METRIC_REGISTRY_SHADOW` | `0` | Log legacy vs registry delta; no behavior change |

**Rollout:**

```text
Shadow (SHADOW=1, REGISTRY=0) → dual compute, log delta
  ↓
Registry (REGISTRY=1) → registry is authoritative for migrated consumers
  ↓
Legacy removal → delete local resolvers (Wave 3+)
```

Flags are **temporary** until Wave 4; then migrate to Feature Flag Registry (RFC-2800).

---

# 7. Compatibility & Behavior Preservation

## 7.1 Equivalence requirement

For Wave 1, for every existing test fixture:

```text
abs(registryValue - legacyValue) < 1e-9
```

If equivalence fails, **STOP** — do not enable `DAOS_METRIC_REGISTRY=1` in production.

## 7.2 What must NOT change

| Dimension | Requirement |
|-----------|-------------|
| Rendered images | Identical pixel output |
| LAW_003 pass/fail | Identical on existing test corpus |
| Benchmark decision arms | Identical until Wave 2 provenance audit |
| Threshold constants | Frozen in Wave 1–3 |
| Handler control flow | No stage reordering |

## 7.3 Allowed changes

| Dimension | Allowed |
|-----------|---------|
| Internal call path | Local resolver → `computeMetric()` |
| Debug output | Add `productAreaRatioProvenance` (additive) |
| Logs | Shadow delta warnings |

---

# 8. Testing Strategy

## 8.1 Unit tests

- Each priority step in isolation (fixture per source)
- `clamp01` edge cases (0, 1, >1 input)
- Wide-template branch
- Mode `law003_v2` vs `mirror` planned fallback divergence (documented)

## 8.2 Equivalence tests

Port existing assertions from:

- `scene-graph-law003-v2.test.ts`
- `scene-graph-constitution-mirror.test.ts`

## 8.3 Shadow integration test

When `DAOS_METRIC_REGISTRY_SHADOW=1`:

```typescript
if (Math.abs(legacy - registry) > EPSILON) {
  logMetricDivergence({ metricId, legacy, registry, context });
}
```

## 8.4 Benchmark regression

Run existing stage benchmarks before/after Wave 1:

```bash
# No change expected in pass rates or productAreaRatio aggregates
npm run daos:benchmark:stage5
```

---

# 9. CI Guard (Wave 4 preview)

Add check `scripts/check-metric-ssot.sh`:

```bash
# Fail if new inline product area ratio calculation appears outside metric-registry
rg 'productAreaRatio|product\.width.*product\.height.*canvas' \
  --glob '*.ts' \
  --glob '!**/metric-registry/**' \
  --glob '!**/*.test.ts'
```

Exact rule finalized in Wave 4 implementation spec.

---

# 10. Alternatives Considered

| Alternative | Verdict | Reason |
|-------------|---------|--------|
| Big-bang: migrate all 29 files in one PR | **Rejected** | High regression risk; violates audit scope |
| Pick `SceneGraphLaw003V2` as implicit SSOT, delete others | **Rejected** | Audits use different input domains; needs explicit context modes |
| YAML-only registry, no runtime | **Rejected** | No enforcement; consumers still recompute |
| Full GenerationContext first | **Deferred** | RFC-2500 is prerequisite for Wave 2+, not Wave 1 |
| Do nothing | **Rejected** | V-001 blocks certified benchmarks (RFC-2900) |

---

# 11. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Subtle formula drift during migration | High | Shadow mode + equivalence tests |
| `law003_v2` vs `mirror` mode confusion | Medium | Explicit `mode` parameter + provenance |
| Handler still sets metric from wrong source (Wave 1) | Medium | Wave 2 scope; document as known gap |
| Flag proliferation | Low | Retire into RFC-2800 registry |
| Scope creep to overlayDensity | Medium | Strict out-of-scope list in PR template |

---

# 12. Acceptance Criteria

RFC-2600 is **Accepted** when:

- [ ] Architecture Council review complete (RFC-010 pipeline)
- [ ] Implementation Spec approved (no code in RFC PR)
- [ ] Wave 1 implementation PR passes all existing scene-graph tests
- [ ] Equivalence tests cover ≥ 100% of existing `productAreaRatio` fixtures
- [ ] Shadow mode reports zero divergence on benchmark corpus
- [ ] `docs/roadmap/IMPLEMENTATION_ROADMAP.md` Phase A1 references this RFC
- [ ] No production behavior change confirmed by benchmark diff

---

# 13. Implementation Checklist (post-acceptance)

**Pre-code (mandatory):**

- [ ] [Pre-Implementation Architecture Review](../engineering/PRE_IMPLEMENTATION_ARCHITECTURE_REVIEW.md)
- [ ] Council sign-off on resolution priority chains (§4.5)
- [ ] Identify PR boundary: Wave 1 only

**Code (Wave 1 PR):**

- [ ] Create `daos/metric-registry/` module
- [ ] Implement `METRIC_PRODUCT_AREA_RATIO`
- [ ] Migrate `SceneGraphLaw003V2` + `SceneGraphConstitutionMirror`
- [ ] Add equivalence + shadow tests
- [ ] No handler changes in Wave 1 PR

**Post-merge:**

- [ ] Open Wave 2 RFC amendment or sub-task for debug bundle
- [ ] Track remaining inline resolvers in IMPLEMENTATION_ROADMAP

---

# 14. Related RFCs

| RFC | Relationship |
|-----|--------------|
| RFC-2500 | GenerationContext will carry `MetricValue` snapshots |
| RFC-2800 | Feature flags for registry rollout |
| RFC-2900 | Certified benchmarks consume registry only |
| RFC-400-R | SceneGraph authority — registry reinforces owner |
| RFC-2100 | Debt budget — each wave removes one resolver |

---

# 15. Council Decision

| Role | Decision | Date |
|------|----------|------|
| Architecture Auditor | Proposed | 2026-07-08 |
| Architecture Council | _Pending_ | — |
| Engineering Lead | _Pending_ | — |

**Status transitions:** `Draft → Review → Accepted → Implemented (Wave 1) → Released`

---

*This document is an implementation RFC. Normative metric rules remain in [Constitution Volume 26](../architecture/constitution-v3/volume-26-metric-registry/).*
