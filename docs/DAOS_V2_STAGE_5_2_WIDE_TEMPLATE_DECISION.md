# DAOS v2 Stage 5.2 — Wide Template Hook Decision

## Decision

**`DAOS_WIDE_TEMPLATE_COMPOSITOR_HOOK` remains experimental and OFF by default.**

Stage 5.1 proved the hook can steer compositor placement, but it **hurts factual composite area** without improving constitution outcomes on mattress benchmarks. The flag stays available for experiments only; production runs should keep it unset or explicitly `0`.

---

## Evidence (Stage 5.1 mattress, `DAOS_WIDE_PRODUCT_TEMPLATE=1`)

| Metric | HOOK=0 (baseline) | HOOK=1 (experimental) |
|--------|-------------------|-------------------------|
| **visual hash** | `589858cc…` | `773cbd92…` (**changed**) |
| **compositeProductAreaRatio** | **0.20** | **0.12** (worse) |
| **placement px** | 720×302 | 562×236 |
| **LAW_003 V2** | pass | pass |
| **LAW_014 mirror** | pass | pass |
| **overlayQualityScore** | 63 | 63 |

Source: `marketplace-infographic/benchmark/output/stage5-1-wide-template-compositor-hook-benchmark.json`

---

## Interpretation

1. **HOOK=1 changes actual compositor output** — visual hash and placement px shift into the template hero band.
2. **Factual `compositeProductAreaRatio` drops** (0.20 → 0.12) because forcing the compositor into the hero zone shrinks the alpha bbox after vertical-safe fit.
3. **LAW_003 V2 still passes** on **planned / template geometry** in both arms — the constitution mirror already credits wide template fill without needing compositor forcing.
4. **Net effect:** hook adds compositor churn and smaller on-card product area with no governance gain.

**Conclusion:** do **not** recommend enabling `DAOS_WIDE_TEMPLATE_COMPOSITOR_HOOK` in production.

---

## Default OFF

- Flag is opt-in only: `process.env.DAOS_WIDE_TEMPLATE_COMPOSITOR_HOOK === "1"`.
- Unset, empty, or `0` → hook disabled.
- No benchmark catalog arm sets hook ON unless explicitly testing Stage 5.1.

---

## Diagnostics when hook is enabled

If `DAOS_WIDE_TEMPLATE_COMPOSITOR_HOOK=1`, debug bundle adds:

- `diagnostics.warnings[]` entry with code **`WIDE_TEMPLATE_COMPOSITOR_HOOK_EXPERIMENTAL`**
- `diagnostics.wideTemplateCompositorHookWarnings: ["WIDE_TEMPLATE_COMPOSITOR_HOOK_EXPERIMENTAL"]`

This surfaces the experimental status in summaries and gates without blocking the pipeline.

---

## Recommended next path

Do **not** force compositor hero zone from template metadata.

Instead pursue a **separate wide-template render strategy** — template-level composition that sizes and places the product during render/composite planning, rather than overriding compositor limits post-plan. Candidates:

- Dedicated wide-template compositor profile (not SceneGraph zone forcing)
- Template-scoped render strategy aligned with `wide_bottom_hero` layout mode
- Composition pass that reconciles planned hero fill with alpha-fit before merge

Stage 5 (template ON, hook OFF) remains the supported path for mattress LAW_003 V2.

---

## Files touched (Stage 5.2)

| File | Change |
|------|--------|
| `src/lib/daos/templates/wide-product-template.ts` | Explicit default-OFF docs; experimental warning builder |
| `src/lib/daos/debug/daos-debug-bundle.ts` | Emit `WIDE_TEMPLATE_COMPOSITOR_HOOK_EXPERIMENTAL` when flag on |
| `src/lib/daos/tests/wide-template-compositor-hook.test.ts` | Default OFF + warning tests |

---

## Checks

| Check | Result |
|-------|--------|
| `npm run daos:test` | pass |
| `npm run lint` | pass |
