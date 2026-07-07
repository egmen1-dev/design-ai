# DAOS Wave 29 — LAW_003 Soft Governance Integration Report

## Goal

Use `law003After` in DAOS overlay gate and benchmark decision so scores reflect factual composite `productPlacement`, not stale planned whitespace — without changing Design Constitution blocking, templates, prompt/provider, or UI/API.

Feature flag: `DAOS_LAW003_SOFT_GOVERNANCE=1` (default OFF).

---

## Integration

### Soft governance resolver

`src/lib/daos/governance/law003-soft-governance.ts`

| Export | Role |
|--------|------|
| `isDaosLaw003SoftGovernanceEnabled()` | `DAOS_LAW003_SOFT_GOVERNANCE=1` |
| `resolveLaw003SoftGovernance(input)` | Chooses constitution vs recalibrated violation |

**When soft ON + `law003Recalibration` present:**
- Overlay audit score/gate uses `law003After` (`softViolation`)
- Diagnostics keep `law003Before` from constitution
- `law003GovernanceSource: "daos_recalibrated"` when soft active

**When soft OFF:**
- Uses constitution `law003Before` only
- `law003GovernanceSource: "constitution"`

### Overlay gate wiring

- `overlay-quality-audit.ts` — soft LAW_003 fields on audit output
- `overlay-gate.ts` — unchanged API; consumes soft `law003WhitespaceViolation`
- Handler evaluates `evaluateDaosOverlayGate(overlayQualityAudit)` and stores in debug bundle

### Diagnostics

| Field | Meaning |
|-------|---------|
| `law003GovernanceSource` | `"constitution"` \| `"daos_recalibrated"` |
| `law003Before` | Original constitution LAW_003 fail |
| `law003After` | Recalibrated fail using composite placement |
| `law003SoftResolved` | `law003Before=true` and `law003After=false` with soft ON |
| `law003StillFailingReason` | Why recalibration still fails when applicable |
| `overlayGateStatus` / `overlayGateScore` | Soft overlay gate result |

---

## Phase 1 benchmark — soft OFF vs ON

Both arms: `DAOS_OVERLAY_PATCH=1`, `DAOS_GEOMETRY_WHITESPACE_PATCH=1`, `DAOS_PRODUCT_SCALE_PATCH=1`, `DAOS_CONTRAST_OVERLAP_PATCH=1`

| Metric | Soft OFF | Soft ON |
|--------|----------|---------|
| **overlayQualityScore** | **46.3** | **53.5** |
| **law003 violation rate (soft score)** | **100%** | **50%** |
| law003Before rate | 100% | 100% |
| law003After rate | 50% | 50% |
| **law003SoftResolved rate** | **0%** | **50%** |
| overlayGateScore | 46.3 | 53.5 |
| overlayGate pass rate | 0% | 0% |
| finalGate / summaryScore Δ | 0 | 0 |

Per-product: Cordless Drill + Electric Kettle — `law003SoftResolved=true` with soft ON (constitution fail, recalibrated pass).

---

## Main finding

**Soft governance closes the gap between constitution LAW_003 and factual composite product area.**

1. Constitution `law003Before` unchanged in diagnostics — blocking behavior preserved.
2. **Soft ON:** overlay score **+7.2**, LAW_003 soft violation rate **100% → 50%**.
3. **50% of products** get `law003SoftResolved` when factual composite area is large enough.
4. Overlay gate score tracks overlay audit (still warning on some products due to PNG feel / other warnings).
5. `summaryScore Δ = 0` — debug summary unchanged; overlay gate is the primary soft signal.

**Benchmark decision:** `law003SoftImproved` added as success criterion when soft violation rate drops.

---

## Verification

```bash
cd marketplace-infographic
npm run daos:test      # pass (includes law003-soft-governance.test.ts)
npm run daos:spec      # pass
npm run lint           # pass
npm run daos:benchmark # Phase 1 pass
```

---

## Files

**Created**

- `src/lib/daos/governance/law003-soft-governance.ts`
- `src/lib/daos/tests/law003-soft-governance.test.ts`
- `docs/DAOS_WAVE_29_REPORT.md`

**Modified**

- `src/lib/daos/audit/overlay-quality-audit.ts`
- `src/lib/daos/debug/daos-debug-bundle.ts`
- `src/lib/generate-infographic-handler.ts`
- `src/lib/generation/diagnostic-report.ts`
- `src/lib/daos/benchmark/catalog.ts`, `runner.ts`, `types.ts`, `metrics.ts`, `decision.ts`, `reporter.ts`
- `src/lib/daos/tests/overlay-gate.test.ts`
- `package.json`
