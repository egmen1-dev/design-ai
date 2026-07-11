# DAOS Marketplace Learning

**Version:** 1.0.0 — Cycle 6 MVP  
**Status:** Knowledge Runtime  
**Priority:** P0  
**Date:** 2026-07-11  
**Parent:** [DAOS_COMMERCIAL_KNOWLEDGE_BASE_V1.md](./DAOS_COMMERCIAL_KNOWLEDGE_BASE_V1.md)

---

## Objective

Commercial Knowledge Base v1 is frozen. Cycle 6 makes it **alive** — DAOS can automatically verify whether Wildberries commercial patterns have changed, without modifying production generation.

**Scope:** Knowledge Runtime only. No changes to Prompt, Layout, Typography, Compositor, Genome, or generation handlers.

---

## Learning Loop

```
┌─────────────────────────────────────────────────────────────┐
│  1. Top N WB cards per category (WB search leaders)         │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Feature extraction (visual weight + attention metrics)  │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Pearson correlations vs Product Dominance (per cohort)  │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Compare with Knowledge Base v1 baseline correlations    │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Classify: confirmation · change · contradiction · new   │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Knowledge Update Report (JSON + HTML)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Categories Monitored

| Category ID | Label | Top N |
|-------------|-------|-------|
| `power-tools` | Электроинструмент | 14 |
| `garden` | Сад | 14 |
| `home-appliances` | Бытовая техника | 14 |
| `construction` | Строительство | 14 |
| `home` | Дом | 14 |
| `auto` | Авто | 14 |
| `kitchen` | Кухня | 14 |
| `pressure-wash` | Мойка | 14 |
| `humidifier` | Климат | 8 |

**Total:** 120 cards (same cohort as Knowledge Freeze baseline).

Future runs may refresh card IDs via `tmp/wb-harvest-ids.ts` + `tmp/quality-cycle-1-collect.ts` before learning scan.

---

## Architecture

| Component | Path | Role |
|-----------|------|------|
| **Runner** | `benchmark/marketplace-learning.ts` | Orchestrates full loop |
| **KB Baseline** | `benchmark/lib/knowledge-base-baseline.ts` | Frozen law registry + thresholds |
| **Law Validation** | `benchmark/lib/law-validation.ts` | Drift detection engine |
| **Feature metrics** | `benchmark/lib/visual-weight-metrics.ts`, `attention-metrics.ts` | Reused measurement modules |
| **Output** | `benchmark/output/market-learning/` | Reports and artifacts |

**Isolation rule:** None of these modules are imported by production handlers, Genome, or Compositor.

---

## Law Validation Statuses

| Status | Meaning |
|--------|---------|
| **Still Proven** | Correlation within drift tolerance; sign unchanged |
| **Confidence Increased** | \|r\| grew ≥ 0.08 vs baseline |
| **Confidence Decreased** | \|r\| fell ≥ 0.12 vs baseline |
| **Contradicted** | Sign flip or collapse to negligible |
| **Still Rejected** | Rejected law remains unsupported |
| **Market Change — Review Required** | Rejected law may be weakening |
| **Not Measurable** | DAOS-only or qualitative law |

---

## Candidate Law Policy

New patterns with \|r\| ≥ 0.28 and n ≥ 30 receive status **Candidate Law**.

- **Not auto-promoted** to Commercial Knowledge Base
- Require separate Council review and experimental proof
- Sub-features of proven cluster laws (e.g. `localContrast` under LAW_008) are excluded from candidacy

---

## How to Run

```bash
cd marketplace-infographic

# Default: cached feature matrices (fast, deterministic)
npx tsx benchmark/marketplace-learning.ts

# Live extraction from WB PNGs (slower, validates pipeline)
ML_EXTRACT=1 npx tsx benchmark/marketplace-learning.ts
```

### Output artifacts

```
benchmark/output/market-learning/
├── summary.json           # Full run payload
├── correlation-matrix.json
├── law-validation.json
├── candidate-laws.json
├── feature-matrix.json
└── report.html            # Human review package
```

---

## Drift Thresholds

Defined in `knowledge-base-baseline.ts`:

| Threshold | Value | Purpose |
|-----------|-------|---------|
| `negligibleCorrelation` | 0.10 | Below = law weakened |
| `confidenceIncreaseDelta` | 0.08 | Promote confidence |
| `confidenceDecreaseDelta` | 0.12 | Demote confidence |
| `candidateLawMinR` | 0.28 | New pattern discovery |
| `candidateLawMinN` | 30 | Minimum sample size |

---

## Integration with Knowledge Freeze

| Knowledge Freeze artifact | Learning Runtime usage |
|---------------------------|------------------------|
| `DAOS_COMMERCIAL_LAWS.md` | Source for `KNOWLEDGE_BASE_V1` registry |
| `quality-cycle-2/correlation-matrix.json` | Baseline r for visual-weight laws |
| `quality-cycle-4/correlation-matrix.json` | Baseline r for attention laws |
| `DAOS_ROADMAP_AFTER_FREEZE.md` | Cycle 6 scheduled as P0 |

---

## Future Extensions (Out of Scope for MVP)

1. **Scheduled runs** — monthly cron after WB re-harvest
2. **Alerting** — Slack/email on `Contradicted` status
3. **Per-category law validation** — category-stratified drift (snapshots included in report)
4. **Knowledge Base v2 promotion workflow** — Council gate for Candidate Laws
5. **DAOS production card scan** — extend loop to DAOS finals alongside WB

---

## Related

- [DAOS_LAW_VALIDATION_REPORT.md](./DAOS_LAW_VALIDATION_REPORT.md) — latest run results
- [DAOS_COMMERCIAL_KNOWLEDGE_BASE_V1.md](./DAOS_COMMERCIAL_KNOWLEDGE_BASE_V1.md)
- [DAOS_ROADMAP_AFTER_FREEZE.md](./DAOS_ROADMAP_AFTER_FREEZE.md)

---

**END OF MARKETPLACE LEARNING MVP**
