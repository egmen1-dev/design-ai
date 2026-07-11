# DAOS Attention Competition Research

**Cycle:** Quality Cycle 4  
**Type:** Research only — no production changes  
**Dataset:** 120 WB cards + 5 DAOS (03-composited + 04-final)  
**Benchmark:** `marketplace-infographic/benchmark/quality-cycle-4-research.ts`  
**Review package:** `marketplace-infographic/benchmark/output/quality-cycle-4/report.html`

---

## Problem Statement

Quality Cycle 3 proved compositor isolation works:

| Layer | Foreground Isolation | Product Dominance |
|-------|---------------------|-------------------|
| 03-composited | **80.5** | **79.2** |
| 04-final-card | **33.8** | **40.0** |
| **Loss** | **−46.7** | **−39.2** |

The quality gap is **not** in the compositor. It appears **after** HTML typography overlay.

---

## Investigation

### Metrics measured (per card)

Headline Visual Weight · Badge Visual Weight · Typography Density · Typography Contrast · Badge Count · Badge Area · Headline Area · Text Area · Negative Space · Eye Path · Primary/Secondary Focus Ratio · Visual Clutter · Attention Competition Index · Visual Balance · Information Density · Whitespace Ratio

### Layer analysis (03 → 04)

| Metric | Avg Δ (5 products) |
|--------|-------------------|
| Foreground Isolation | **−46.6** |
| Product Dominance | **−39.2** |
| Typography Competition | **+9.2** |
| Headline Visual Weight | **+10.1** |
| Typography Contrast | **+38.8** |
| Primary Focus Ratio | **−0.30** |
| Visual Clutter | +0.16 |

Typography overlay adds edge density in the headline zone. Global `edgeDensity` rises, collapsing the hero/global ratio that drives Foreground Isolation.

---

## Attention Heatmaps

Edge-saliency maps (Sobel magnitude, jet colormap) confirm the shift:

| Cohort | Attention peak (normalized x, y) |
|--------|----------------------------------|
| WB aggregate (n=120) | (0.34, 0.14) — headline band |
| DAOS composited | (0.39, 0.23) — **product / hero zone** |
| DAOS final | (0.12, 0.07) — **top-left headline** |

**Construction Vacuum example:**
- Composited peak: **(0.78, 0.59)** — product right
- Final peak: **(0.16, 0.07)** — headline top-left

Heatmaps in `benchmark/output/quality-cycle-4/`:
- `heatmaps/wb-aggregate.png`
- `heatmaps/daos-composited-aggregate.png`
- `heatmaps/daos-final-aggregate.png`
- `heatmaps/daos-attention-shift.png`
- Per product: `03-composited-heatmap.png`, `04-final-heatmap.png`, `attention-shift.png`

---

## Correlation with Product Dominance (WB n=120)

| Factor | r | Confidence |
|--------|---|------------|
| **Headline Visual Weight** | **−0.723** | high |
| Typography Contrast | −0.595 | high |
| Typography Competition | −0.537 | high |
| Secondary Focus Ratio | −0.744 | high |
| Product Attention | +0.783 | high |
| Primary Focus Ratio | +0.744 | high |
| Foreground Isolation | +0.332 | medium |

Higher headline visual weight **predicts lower** product dominance on WB leader cards.

---

## DAOS Gap Analysis

| Factor | WB Mean | DAOS Final | Gap | Status |
|--------|---------|------------|-----|--------|
| Headline Visual Weight | 24.7 | 16.0 | −8.7 | **MISSING** (DAOS headline weaker but shift still hurts) |
| Typography Contrast | 75.4 | 58.0 | −17.4 | **MISSING** |
| Typography Competition | 40.0 | 20.8 | −19.1 | **MISSING** |
| Foreground Isolation | 52.7 | 33.8 | −18.9 | **MISSING** |
| Product Attention | 3.4 | 5.3 | +1.9 | SUPPORTED |

Note: DAOS absolute headline weight is lower than WB, but the **composited→final delta** (+5–15 headline weight, +17–59 typography contrast) is what collapses dominance.

---

## Council Decision

**Single biggest post-compositor factor: Headline Visual Weight**

| Item | Value |
|------|-------|
| Correlation with dominance | **r = −0.723** |
| DAOS gap (headline weight) | **−8.7** |
| Layer gain after overlay | **+10.1 avg** |
| Heatmap evidence | Peak moves hero-right → top-left |
| **Next cycle** | **Quality Cycle 5 — Typography Weight Governance** |

Badges showed **zero delta** on all 5 products (`badgeCompetitionDelta = 0`). Typography/headline is the confirmed competitor, not badges.

---

## Success Criteria

| Criterion | Met? |
|-----------|------|
| Why final card loses visual weight | **Yes** — FI collapse from global edge inflation + headline competition |
| Strongest competing element | **Yes** — Headline Visual Weight |
| Single highest-impact fix identified | **Yes** — Cap headline contrast/weight on overlay stage |

---

## Related

- [DAOS Attention Model v1](./DAOS_ATTENTION_MODEL_V1.md)
- [DAOS Quality Cycle 3 Report](./DAOS_QUALITY_CYCLE_3_REPORT.md)
- [DAOS Quality Backlog](./DAOS_QUALITY_BACKLOG.md)
