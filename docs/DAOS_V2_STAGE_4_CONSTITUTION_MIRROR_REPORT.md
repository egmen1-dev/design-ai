# DAOS v2 Stage 4 — SceneGraph Constitution Mirror Report

## Goal

Add a **non-blocking** SceneGraph-based Constitution mirror that evaluates LAW_003 and LAW_014 from SceneGraph `actual`/`planned` nodes. The mirror does **not** replace the blocking Design Constitution, templates, prompt/provider, or API/UI.

Feature flag: `DAOS_SCENE_GRAPH_V2=1`.

Raw benchmark output: `marketplace-infographic/benchmark/output/stage4-constitution-mirror-benchmark.json` (2026-07-07).

---

## Created / modified files

| File | Change |
|------|--------|
| `src/lib/scene-graph/SceneGraphConstitutionMirror.ts` | **New** — `evaluateSceneGraphLaw003`, `evaluateSceneGraphLaw014`, `evaluateSceneGraphConstitutionMirror` |
| `src/lib/scene-graph/tests/scene-graph-constitution-mirror.test.ts` | **New** — unit tests (actual fill, low area, overlap, mixed source, determinism) |
| `src/lib/scene-graph/SceneGraphSerializer.ts` | Write `sceneGraphConstitutionMirror.json`; extend `SceneGraphSnapshotSet` |
| `src/lib/scene-graph/index.ts` | Export mirror API |
| `src/lib/daos/scene-graph/scene-graph-mirror.ts` | Evaluate mirror after `captureFinal()`; expose `getConstitutionMirror()` |
| `src/lib/daos/debug/daos-debug-bundle.ts` | `sceneGraphConstitutionMirror`, `sceneGraphLaw003Passed`, `sceneGraphLaw014Passed`, `sceneGraphConstitutionSource` |
| `package.json` | Register mirror tests in `daos:test` |
| `tmp/daos-stage4-benchmark.ts` | One-off Phase 1 benchmark — current governance vs mirror |

**Not changed:** blocking Design Constitution, templates, prompt/provider, API/UI.

---

## Mirror rules

### LAW_003 (Whitespace / fill)

| Input | Resolution |
|-------|------------|
| Product area | `ProductNode.actual.areaRatio` (or `visibleAreaRatio` / bbox) → else `ProductNode.planned` bbox or `composition.actual.productAreaPct` |
| Overlay density | `overlay.actual.density` / `whitespace.actual.overlayDensity` → else typography/overlay planned signals |
| Whitespace | `WhitespaceNode.actual.whitespacePct` → else `planned`, recalibrated when actual product area diverges from planned (reuses `law003-recalibration` constants) |

**Pass criteria:**
- Estimated whitespace in `[LAW003_MIN_WHITESPACE_PCT, LAW003_MAX_WHITESPACE_PCT]` (20–35%)
- Product area ratio ≥ 0.15
- Overlay density > 0.35 (safe + 0.1) adds advisory reason (does not alone fail unless combined with whitespace breach)

**Result fields:** `passed`, `score`, `source` (`actual` \| `planned` \| `mixed`), `productAreaRatio`, `overlayDensity`, `estimatedWhitespace`, `reasons`.

### LAW_014 (Contrast / overlap)

| Input | Resolution |
|-------|------------|
| Product bbox | `ProductNode.actual` → else `planned` |
| Overlay zones | Typography actual bbox → else planned; badge actual → else planned fallback; overlay actual element bbox if present and not full-canvas → else planned overlay bbox |
| Contrast | `productAreaPct / textAreaPct` (hero/text area ratio) |
| Overlap | Product bbox vs overlay zone bboxes; `overlapCount`, `overlapAreaRatio`, `composition.actual.overlapPct` |

**Pass criteria:**
- Hero/text area ratio ≥ 2
- Overlap % ≤ 2%
- Overlap area ratio ≤ 0.02 when zones intersect

**Mixed source:** when product uses actual but overlay element bboxes are missing → planned overlay bboxes used; `source="mixed"` with explicit reason.

**Result fields:** `passed`, `score`, `overlapCount`, `overlapAreaRatio`, `contrastRatio`, `source`, `reasons`.

### Integration

After `sceneGraphFinal` capture in `scene-graph-mirror`:
1. `evaluateSceneGraphConstitutionMirror(final)`
2. Persist to `generated/daos-debug/<project>/<run>/sceneGraphConstitutionMirror.json`
3. Surface in `daos-debug-bundle.json` diagnostics + top-level mirror payload

---

## Phase 1 benchmark — current governance vs SceneGraph mirror (n=4)

Stack: `DAOS_SCENE_GRAPH_V2=1` + Stage 3.2 gated overlay env.

| Metric | Current (soft governance) | SceneGraph mirror |
|--------|---------------------------|-------------------|
| **LAW_003 pass rate** | 0% (0/4) | 0% (0/4) |
| **LAW_014 pass rate** | 100% (4/4) | 75% (3/4) |
| **LAW_003 disagreement rate** | — | **0%** |
| **LAW_014 disagreement rate** | — | **25%** (1/4) |

Office-chair excluded (pre-existing mock-brief Zod error on `deferredSpecs`/`deferredBullets` > 80 chars).

### Product-level comparison

| Product | LAW_003 current | LAW_003 mirror | LAW_014 current | LAW_014 mirror | Disagreement |
|---------|-----------------|----------------|-----------------|----------------|--------------|
| cordless-drill | fail (soft) | fail | pass | pass | — |
| electric-kettle | fail (soft) | fail | pass | pass | — |
| mattress | fail (constitution) | fail | pass | **fail** | **LAW_014** |
| children's-toy | fail (soft) | fail | pass | pass | — |

### Disagreement detail — mattress (LAW_014)

| Side | Verdict | Reason |
|------|---------|--------|
| Current governance | pass (`law014ContrastViolation=false`) | Soft recalibration / audit path passes |
| SceneGraph mirror | fail | Hero/text area ratio **1.11** below minimum **2**; overlay uses planned bboxes (`source=actual` overall but mixed overlay geometry note) |

Mirror LAW_003 reasons (all products): whitespace **48–61%** above maximum **35%**; mattress additionally fails overlay density **0.39** above safe **0.25**.

---

## Tests & checks

| Check | Result |
|-------|--------|
| `npm run daos:test` | pass |
| `npm run lint` | pass |
| `npm run daos:benchmark` | pass (BenchmarkStatus: STOP — pre-existing Phase 1 gate) |
| `scene-graph-constitution-mirror.test.ts` | pass — actual fill, low area fail, overlap fail, mixed source, deterministic |

---

## Main conclusion

The SceneGraph Constitution mirror is wired end-to-end under `DAOS_SCENE_GRAPH_V2=1` as a **read-only diagnostic layer**: it writes `sceneGraphConstitutionMirror.json`, enriches the debug bundle, and does not alter blocking Design Constitution behavior.

**LAW_003** aligns fully with current governance in Phase 1 (0% disagreement): both paths fail all four products on high estimated whitespace (~49–61%), confirming the mirror reads the same structural fill signal from SceneGraph nodes.

**LAW_014** shows one meaningful divergence (**mattress**, 25% disagreement rate): current soft governance passes while the mirror fails on low hero/text contrast ratio (1.11 < 2). This highlights that mirror LAW_014 is stricter on area-ratio contrast and uses explicit bbox geometry rather than audit recalibration — useful for calibration before any future promotion to blocking status.

Next step (out of scope for Stage 4): tune mirror LAW_014 contrast thresholds or align hero/text area derivation with the existing audit path, and resolve office-chair mock-brief validation for full 5-product coverage.
