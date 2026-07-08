# DAOS Wave 35 — Metric Registry Runtime Report

**RFC:** [RFC-2600 Metric Registry Runtime](../rfc/RFC-2600_METRIC_REGISTRY_RUNTIME.md) (Accepted)  
**Wave:** 1 (SceneGraph delegation only)  
**Date:** 2026-07-08  
**Branch:** `cursor/wave-1-metric-registry-aecb`

---

## 1. Created files

| File | Purpose |
|------|---------|
| `marketplace-infographic/src/lib/daos/metric-registry/index.ts` | Public exports |
| `marketplace-infographic/src/lib/daos/metric-registry/types.ts` | `MetricId`, `MetricValue`, `MetricContext`, shadow diagnostic types |
| `marketplace-infographic/src/lib/daos/metric-registry/metric-registry.ts` | `MetricRegistry.compute()`, env flags, shadow diagnostics |
| `marketplace-infographic/src/lib/daos/metric-registry/product-area-ratio.ts` | Canonical `productAreaRatio` resolvers (`law003_v2`, `mirror`) |
| `marketplace-infographic/src/lib/daos/tests/metric-registry-product-area-ratio.test.ts` | Equivalence + flag + shadow tests |
| `docs/DAOS_WAVE_35_METRIC_REGISTRY_REPORT.md` | This report |

---

## 2. Modified files

| File | Change |
|------|--------|
| `marketplace-infographic/src/lib/scene-graph/SceneGraphLaw003V2.ts` | Delegation to registry when `DAOS_METRIC_REGISTRY=1`; shadow compare; legacy preserved as `legacyResolveProductAreaRatio` |
| `marketplace-infographic/src/lib/scene-graph/SceneGraphConstitutionMirror.ts` | Delegation to registry when `DAOS_METRIC_REGISTRY=1`; shadow compare; legacy preserved as `legacyResolveProductArea` |
| `marketplace-infographic/package.json` | Added metric-registry test to `daos:test` |
| `docs/rfc/RFC-2600_METRIC_REGISTRY_RUNTIME.md` | Status → **Accepted** |
| `docs/rfc/README.md` | RFC-2600 status → Accepted |
| `docs/roadmap/IMPLEMENTATION_ROADMAP.md` | Phase A1 → Wave 1 implemented |

---

## 3. Registry-owned metric

| MetricId | Owner | Unit | formulaVersion | Modes |
|----------|-------|------|----------------|-------|
| `METRIC_PRODUCT_AREA_RATIO` | SceneGraph | `ratio` | `1.0.0` | `law003_v2`, `mirror` |

**API:**

```typescript
MetricRegistry.compute("METRIC_PRODUCT_AREA_RATIO", {
  kind: "scene_graph",
  graph,
  mode: "law003_v2" | "mirror",
});
```

**Returns `MetricValue`:**

- `metricId`, `value`, `unit`, `source`, `owner`, `formulaVersion`, `provenance`, `createdAt`

---

## 4. Backward compatibility

| Mechanism | Behavior |
|-----------|----------|
| `DAOS_METRIC_REGISTRY` unset / `0` | Legacy inline resolvers run unchanged; default production path |
| `DAOS_METRIC_REGISTRY=1` | SceneGraph V2/Mirror read `productAreaRatio` from registry |
| `DAOS_METRIC_REGISTRY_SHADOW=1` | Dual compute (legacy + registry), `getLastMetricShadowDiagnostic()` populated; **returned value unchanged** relative to registry flag |
| Legacy functions | `legacyResolveProductAreaRatio` / `legacyResolveProductArea` retained in SceneGraph files |
| Feature flags default | Both flags **off** → zero behavior change for existing deployments |

**Equivalence verified:** `abs(registry - legacy) < 1e-9` on drill, compositor, and planned-only fixtures.

---

## 5. Test results

| Command | Result |
|---------|--------|
| `npx tsx src/lib/daos/tests/metric-registry-product-area-ratio.test.ts` | **PASS** (9 assertions) |
| `npm run daos:test` | **PASS** |
| `npm run daos:spec` | **PASS** |
| `npm run lint` | **PASS** (no warnings/errors) |
| `npm run typecheck` | **FAIL** (pre-existing; see §6) |

**New test coverage:**

- Registry matches legacy LAW_003 V2
- Registry matches legacy mirror (actual + planned fallback)
- `DAOS_METRIC_REGISTRY=0` unchanged behavior
- `DAOS_METRIC_REGISTRY=1` delegates correctly
- Shadow mode records diagnostic without changing pass/score/returned ratio
- Provenance: `owner=SceneGraph`, `unit=ratio`, `formulaVersion=1.0.0`

---

## 6. Typecheck notes (pre-existing)

`npm run typecheck` exits **1**. No new errors in `metric-registry/*`. Failures are pre-existing:

| Area | Examples |
|------|----------|
| `tmp/wave*-ab-run.ts` | Duplicate declarations, `.ts` import extensions, missing `imageId` |
| `src/lib/render-blueprint/*` | Multiple pre-existing type errors (not modified) |
| `src/lib/scene-graph/SceneGraphConstitutionMirror.ts` | `whitespacePct` on `SceneGeometry`, `SceneGraphConstitutionSource` assignability (pre-existing lines; file touched only for delegation) |
| `src/lib/daos/audit/overlay-quality-audit.ts` | `HierarchyLevel` comparison |
| `src/lib/daos/benchmark/reporter.ts` | `string \| number` assignability |

Wave 35 did **not** introduce typecheck regressions in new modules.

---

## 7. What was NOT touched

Per RFC-2600 Wave 1 constraints:

| Area | Status |
|------|--------|
| `generate-infographic-handler.ts` | **Not modified** |
| Benchmark pipeline (`daos/benchmark/*`, `tmp/daos-stage*`) | **Not modified** |
| Overlay/audit patches (`geometry-whitespace-patch`, `composer-quality-audit`, `product-scale-audit`) | **Not modified** |
| Rendered output / compositor / overlay logic | **Not modified** |
| LAW_003 / LAW_014 thresholds | **Not modified** |
| `overlayDensity`, `LAW003Score`, `LAW014Score` | **Not migrated** |
| Legacy inline calculations in audits/patches | **Not removed** |
| New agents/engines | **Not created** |
| Public API surface (`daos/index.ts` exports) | **Not changed** |

---

## 8. Rollout guidance

```bash
# Default — no change
DAOS_METRIC_REGISTRY=0

# Shadow validation (log only)
DAOS_METRIC_REGISTRY_SHADOW=1

# Enable registry for SceneGraph productAreaRatio
DAOS_METRIC_REGISTRY=1
```

**Next wave (RFC-2600 W2):** debug bundle writes `productAreaRatio` from registry + provenance field.

---

## 9. Council sign-off

| Item | Status |
|------|--------|
| RFC-2600 | Accepted 2026-07-08 |
| Wave 1 implementation | Complete |
| Production behavior change (flags off) | None |
