# DAOS Commercial Calibration

**Version:** `1.0.0-sprint6c`  
**Module:** `marketplace-infographic/src/lib/compositing/commercial-calibration.ts`  
**Phase:** Product Sprint 6C — Commercial Calibration Engine

---

## Purpose

Commercial Calibration transforms propagated `objectScale` into compositor coefficients that **materialize** Commercial Decision in the final product bounding box.

Sprint 6B proved propagation works. Sprint 6C addresses the **sensitivity bottleneck** inside `computeMaxProductSize()`.

```
Commercial Decision → LayoutSpec → Propagation → objectScale
                                                    ↓
                                         Commercial Calibration
                                                    ↓
                                         computeMaxProductSize()
                                                    ↓
                                         Bounding Box → Product Area
```

Calibration does **not** make commercial decisions. It only improves accuracy of materializing decisions already made.

---

## Problem (Sprint 6B finding)

Legacy formula inside `computeMaxProductSize()`:

```
scaleBoost = 0.58 + objectScale × 0.05
```

| objectScale | scaleBoost | Δ scaleBoost |
|-------------|------------|--------------|
| 0.50 | 0.605 | — |
| 0.55 | 0.6075 | +0.4% |

Result: bbox change `316×480 → 317×482` — propagation correct, visual effect negligible.

**Root cause:** coefficient `0.05` has near-zero sensitivity. Canvas caps further flatten the curve when `sqrt(target/zone)` approaches `maxBoost`.

---

## Mathematical Model

### Inputs

| Symbol | Source | Role |
|--------|--------|------|
| `objectScale` | Commercial propagation (0.50–0.62 typical) | Normalized target area intent |
| `zoneW`, `zoneH` | `compositionLayout.product.maxWidth/HeightPct` | Template placement zone |
| `zoneAreaPct` | `width% × height%` | Zone area fraction |
| `canvasMaxW/H` | Product render policy + header reserve | Hard caps |

### Legacy path (unchanged)

```
scaleBoost = 0.58 + objectScale × 0.05
maxW = min(canvasMaxW, zoneW × scaleBoost)
maxH = min(canvasMaxH, zoneH × scaleBoost)
placementAreaPct = (maxW × maxH) / (900 × 1200) × 100
```

**Sensitivity:** ∂scaleBoost/∂objectScale = **0.05** (negligible)

### Calibrated path (Sprint 6C)

```
anchorBoost = legacyScaleBoost(0.5)           // 0.605 — backward-compat anchor
maxBoost    = min(canvasMaxW/zoneW, canvasMaxH/zoneH, 1.18)
t           = clamp((objectScale - 0.5) / (0.75 - 0.5), 0, 1)
scaleBoost  = min(maxBoost, max(legacy, anchorBoost + t × (maxBoost - anchorBoost)))
```

**Sensitivity:** full range from anchor to cap across `objectScale ∈ [0.5, 0.75]`

### Parameters that affect bbox

| Parameter | Effect |
|-----------|--------|
| `objectScale` | **High** (calibrated) / **Negligible** (legacy) |
| `zoneW`, `zoneH` | **High** — defines zone geometry |
| `canvasMaxW/H` | **High** — ceiling when `zone × boost` exceeds caps |
| `scaleBoost` slope `0.05` | **Negligible** (legacy only) |

### Parameters with minimal effect

- `compositionLayout.metrics.productAreaPct` — used for propagation fallback, not direct bbox math
- `fitProductWithSafePlacement()` — unchanged; alpha fitting may reduce visible area below max estimate

---

## Calibration Curve (empirical)

Measured on `battery-sprayer` layout zone (Sprint 6C benchmark):

| objectScale | scaleBoost | placementAreaPct |
|-------------|------------|------------------|
| 0.30 | 0.605 | 17.4 |
| 0.50 | 0.605 | 17.4 |
| 0.55 | 0.642 | **19.5** |
| 0.60 | 0.679 | 21.9 |
| 0.65 | 0.715 | 24.2 |
| 0.70 | 0.752 | 26.8 |
| 0.75 | 0.789 | 29.5 |

**Legacy at 0.50→0.55:** 17.4% → 17.5% (+0.1%)  
**Calibrated at 0.50→0.55:** 17.4% → 19.5% (+2.1%)

Relationship is **piecewise-linear in scaleBoost**, **non-linear in area** (quadratic in boost when uncapped).

---

## Activation

Calibration activates when `SceneCompositeOptions.commercialCalibration === true`.

Handler sets this when `commercialLayoutPropagation.commercialLayoutPropagation === true`.

Non-commercial generations use **legacy** formula — no behavior change.

---

## Diagnostics

| Field | Description |
|-------|-------------|
| `commercialCalibrationVersion` | `1.0.0-sprint6c` |
| `commercialCalibrationFormula` | `legacy:…` or `calibrated:lerp(…)` |
| `commercialTargetArea` | Target % from objectScale |
| `commercialMeasuredArea` | Measured placement area % |
| `commercialAreaError` | measured − target |
| `commercialCalibrationWarnings` | Cap/constraint warnings |

Logged on `SceneCompositeResult.commercialCalibration` and `payloadExtras.commercialCalibration`.

---

## Architecture Constraints

| Layer | Role |
|-------|------|
| Commercial Genome | Decides |
| LayoutSpec | Stores |
| Propagation | Transmits |
| **Calibration** | **Transforms coefficients** |
| Compositor | Materializes (algorithms unchanged except scaleBoost source) |
| Commercial Fidelity | Measures |

---

## Remaining Gap

Canvas caps limit maximum placement area to ~29–39% depending on zone geometry. Commercial target of 55% cannot be fully reached via `scaleBoost` alone.

If error remains material after calibration, the next Product Gap should target **compositing constraints** (`PRODUCT_MAX_WIDTH_PX`, alpha caps, safe placement), not commercial logic or propagation.
