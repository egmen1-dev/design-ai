# DAOS Attention Model v1

**Version:** `attention-model-v1`  
**Cycle:** Quality Cycle 4  
**Status:** Research model — not wired to production

---

## Formula

```
Product Attention =
    Product Visual Weight
  − Typography Competition
  − Badge Competition
  − Background Competition
  − Visual Noise
```

---

## Component Definitions

| Component | Measurement | Zone | Weight |
|-----------|-------------|------|--------|
| **Product Visual Weight** | `edgeDensity × 100 + stdR × 0.3` | Hero (right 54%) | +1.0 |
| **Typography Competition** | Headline VW + 0.7 × Benefits VW | Headline + benefits | −0.40 |
| **Badge Competition** | CTA zone visual weight | Bottom-left CTA | −0.25 |
| **Background Competition** | Left-column edge density × 100 | Background left 40% | −0.10 |
| **Visual Noise** | Global clutter − 0.2 × background | Full canvas | −0.25 |

### Derived indices

```
Primary Focus Ratio   = productVW / (productVW + headlineVW + badgeVW + benefitsVW)
Secondary Focus Ratio = 1 − Primary Focus Ratio
Attention Competition Index = 0.35×typography + 0.20×badge + 0.15×background + 0.30×noise
Text Competition = typographyCompetition + typographyDensity × 0.15
```

---

## WB Reference Means (n=120)

| Component | Mean | Median |
|-----------|------|--------|
| Product Visual Weight | 23.9 | 24.3 |
| Typography Competition | 40.0 | 41.0 |
| Badge Competition | 4.2 | 4.0 |
| Background Competition | 3.1 | 3.0 |
| Visual Noise | 2.8 | 2.7 |
| **Product Attention** | **3.4** | **3.5** |
| Primary Focus Ratio | 0.28 | 0.27 |
| Foreground Isolation | 52.7 | 50.2 |

---

## Correlation with Product Dominance

| Component | r | Direction |
|-----------|---|-----------|
| Product Attention | +0.783 | More attention → more dominance |
| Primary Focus Ratio | +0.744 | Product share of weight |
| Headline Visual Weight | **−0.723** | **Steals dominance** |
| Typography Contrast | −0.595 | High contrast headline hurts |
| Typography Competition | −0.537 | Composite text competition |
| Foreground Isolation | +0.332 | Compositor signal (pre-overlay) |

---

## Layer Transition Model (DAOS)

When HTML overlay merges onto composited scene:

```
Δ Foreground Isolation ≈ −47   (hero/global edge ratio collapse)
Δ Product Dominance    ≈ −39   (attention redistribution)
Δ Headline VW          ≈ +10   (new text edges in headline zone)
Δ Typography Contrast  ≈ +39   (high-contrast H1 appears)
Δ Badge VW             ≈  0    (badges not primary competitor in current template)
```

**Attention peak migration:**
- Composited: `(0.39, 0.23)` — product zone
- Final: `(0.12, 0.07)` — headline zone

---

## Model v1 Regression Weights (|r| normalized)

```
Product Dominance ≈
  78.3% Product Attention
+ 74.4% Primary Focus Ratio
− 74.4% Secondary Focus Ratio
− 72.3% Headline Visual Weight
− 59.5% Typography Contrast
− 53.7% Typography Competition
+ 33.2% Foreground Isolation (compositor only)
```

---

## Recommended Next Cycle

**Quality Cycle 5 — Typography Weight Governance**

Scope (research-first, then execution):
1. Cap headline contrast relative to hero luminance
2. Limit headline edge density in safe zone
3. Preserve compositor FI through overlay stage
4. Measure on `04-final-card.png` not just `03-composited.png`

**Not recommended:** More compositor isolation (Cycle 3 proved compositor is sufficient).

---

## Implementation Status

| Component | Status |
|-----------|--------|
| Product Visual Weight | SUPPORTED (compositor) |
| Foreground Isolation | SUPPORTED (Cycle 3) |
| Typography Competition | **MISSING** — overlay uncapped |
| Headline Contrast Governance | **MISSING** |
| Badge Competition | SUPPORTED (low weight on WB) |
| Attention heatmap diagnostics | Research only |

---

## Module

Benchmark implementation: `marketplace-infographic/benchmark/lib/attention-competition-metrics.ts`

No production modules added per Cycle 4 scope.
