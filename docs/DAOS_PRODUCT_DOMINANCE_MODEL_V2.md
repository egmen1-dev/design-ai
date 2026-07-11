# DAOS Product Dominance Model v2

**Version:** `2.0.0-quality-cycle-2`  
**Status:** Research — not yet wired to production gates  
**Derived from:** 120 WB cards + 5 DAOS production finals  
**Supersedes:** Cycle 1 aggregate model (35/30/20/10/5 heuristic)

---

## Why v2?

Cycle 1 proposed:

```
Product Dominance ≈
  35% Hero Visual Weight
+ 30% Hero/Headline Energy
+ 20% Scene Integration
+ 10% Background Simplicity
+  5% Typography Competition
```

Cycle 2 **decomposed and validated** each layer with Pearson correlation on n=120.

---

## Hero Visual Weight — Decomposed

Cycle 1 `visualWeightHero` is now defined as:

```
Hero Visual Weight =
  Object Sharpness  × 0.28   (r=0.893 with v1 metric)
+ Local Contrast    × 0.28   (r=0.887)
+ Object Contrast   × 0.22   (r=0.870)
+ Object Saturation × 0.22   (r=0.870)
```

Where:

| Component | Formula | WB Mean |
|-----------|---------|---------|
| Object Sharpness | `edgeDensity×100 + RGB_std×0.4` | 30.5 |
| Local Contrast | `edgeContrast×0.6 + objectContrast×0.4` | 29.7 |
| Object Contrast | `mean(RGB_std)` in hero zone | 71.3 |
| Object Saturation | same as contrast (color variance) | 71.3 |

**Residual:** shadow presence (+0.32), perspective (+0.30) explain remaining ~13%.

---

## Product Dominance Model v2

Weights derived from |Pearson r| normalized across features with |r| ≥ 0.10:

```
Product Dominance Score ≈ normalize(
  + 12.8% × Foreground Isolation     (r=+0.332)
  + 12.5% × Object Sharpness         (r=+0.326)
  + 12.3% × Local Contrast           (r=+0.321)
  + 12.0% × Object Contrast          (r=+0.313)
  + 12.0% × Object Saturation        (r=+0.313)
  − 11.1% × Texture Competition      (r=−0.289)
  +  6.7% × Perspective              (r=+0.173)
  +  5.8% × Visual Center Offset     (r=+0.150)
  +  5.1% × Brightness Separation    (r=+0.133)
  −  5.0% × Object Symmetry          (r=−0.130)
  −  4.6% × Dominant Color Balance   (r=−0.120)
)
```

### Removed from dominance model (|r| < 0.10)

| Feature | r | Reason |
|---------|---|--------|
| Product Area | −0.099 | No discriminative power |
| Negative Space | +0.099 | Mirror of area |
| Object Depth | +0.098 | Low WB variance; high DAOS gap but not WB predictor |
| Shadow Presence | +0.091 | Compositor artifact |
| Edge Contrast alone | +0.094 | Absorbed into Sharpness |
| Color Separation | +0.085 | Already near parity |
| Object Lighting | +0.009 | SVG artifact on DAOS |

---

## Feature Definitions (SSOT for v2)

### Foreground Isolation
```
hero_edge_density / global_edge_density × 50
```
Product silhouette edges stand out from the rest of the frame.

### Object Sharpness
```
hero_edge_density × 100 + hero_RGB_std × 0.4
```
Crisp product edges and color variance.

### Local Contrast
```
edgeContrast × 0.6 + objectContrast × 0.4
```
Combined edge + tonal pop in hero zone.

### Texture Competition (negative)
```
headline_zone_edge_density × 100
```
More headline texture → lower dominance. Top WB cards keep this low (~1.6 in top quartile).

---

## DAOS Current Score vs Model v2

| Component | WB Target (median) | DAOS (mean) | Gap | Priority |
|-----------|-------------------|-------------|-----|----------|
| Foreground Isolation | 50.2 | 32.5 | **−17.7** | P0 |
| Object Sharpness | 29.6 | 24.0 | −5.6 | P0 |
| Local Contrast | 29.0 | 23.8 | −5.2 | P0 |
| Object Contrast | 69.6 | 59.0 | −10.6 | P0 |
| Object Saturation | 69.6 | 59.0 | −10.6 | P0 |
| Texture Competition | 2.1 | 1.0 | OK | — |
| Object Depth | 11.0 | **0.0** | −11.0 | P0 |
| Perspective | 23.2 | 8.6 | −14.6 | P1 |

---

## Implementation Readiness

| Component | DAOS Module | Status |
|-----------|-------------|--------|
| Foreground Isolation | compositor + cutout quality | **Missing** |
| Object Sharpness | cutout edge + post-sharpen | **Partial** |
| Local Contrast | compositor lighting harmonization | **Missing** |
| Object Contrast | product photography / cutout | **Partial** |
| Texture Competition | typography overlay | **Supported** |
| Object Depth | `floor-contact.ts` shadows | **Missing** (0/5 Sprint 9.5) |

---

## Model v2 vs Cycle 1 Heuristic

| Cycle 1 bucket | v2 equivalent | Validated? |
|----------------|---------------|------------|
| 35% Hero Visual Weight | Sharpness + Local Contrast + Contrast + Saturation | **Yes** (r≈0.87–0.89) |
| 30% Hero/Headline Energy | Partially → Texture Competition (−11%) | **Partial** |
| 20% Scene Integration | Foreground Isolation + Object Depth | **Yes** (isolation r=0.33) |
| 10% Background Simplicity | Background Noise (r=−0.07) | **Weak** |
| 5% Typography Competition | Texture Competition | **Yes** (r=−0.29) |

---

## Recommended Production Gate (future — not implemented)

When wired to `final-quality-validator`:

```typescript
// Pseudocode — research proposal only
const dominanceV2 =
  0.128 * norm(foregroundIsolation) +
  0.125 * norm(objectSharpness) +
  0.123 * norm(localContrast) +
  0.120 * norm(objectContrast) +
  0.120 * norm(objectSaturation) -
  0.111 * norm(textureCompetition) +
  ...;

PASS if dominanceV2 >= wb_median (49);
```

---

## Next Step

**Quality Cycle 3 — Visual Weight Execution**

Target: raise Foreground Isolation from 32.5 → ≥50 (WB median).

Dependencies:
1. Compositor merge success (Cycle 2 execution — compositor reliability)
2. Real product cutouts with crisp edges
3. Post-composite local contrast on hero zone

No Genome / Layout / Prompt changes required for Cycle 3 scope.
