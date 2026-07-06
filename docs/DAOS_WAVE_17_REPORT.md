# DAOS Wave 17 — CTR Wording Bridge Report

## Goal

Stop leaving `ctr_wording` in `modulesStillIgnored` when commercial/market/CTR data exists in the pipeline. Enhanced CTR compilation under `DAOS_V17_CTR_BRIDGE=1` (default **OFF**), extending Wave 16 modules bridge.

Requires `DAOS_RENDER_CONTEXT=1`, `DAOS_V17_PROMPT_BRIDGE=1`, and `DAOS_V17_MODULES_BRIDGE=1` for full stack.

---

## Implemented

### CTR bridge (extends modules bridge)

`marketplace-infographic/src/lib/daos/adapters/v17-modules-bridge.ts`

| Export | Role |
|--------|------|
| `isDaosV17CtrBridgeEnabled()` | `process.env.DAOS_V17_CTR_BRIDGE === "1"` |
| `compileCtrWordingSectionEnhanced(request)` | Structured CTR section (max 180 chars) |
| Enhanced path in `createDaosV17ModulesBridgeBlock()` | Replaces Wave 16 basic `[ctr_wording]` when CTR flag on |

**CTR section format (max 180 chars):**

```text
CTR wording intent:
- main message: ...
- click trigger: ...
- trust driver: ...
```

**Data sources (no fabrication):**

| Field | Sources (priority order) |
|-------|--------------------------|
| main message | `daosContext.mainMessage`, `commercialSpec.mainMessage` |
| click trigger | `providerHints.ctrHook`, `ctrExpert.recommendations/issues`, `marketSnippet`, `daosContext.commercialGoal`, `commercialSpec.usp`, `daosContext.warnings` |
| trust driver | `commercialSpec.trustDrivers`, `seniorArtDirector.recommendations`, `commercialSpec.hierarchy`, `daosContext.warnings` |

### Metadata passthrough

Handler → `regenerateMarketplaceBackground` → `renderWithRetry` → `planRenderRequest.metadata`:

- `marketSnippet`
- `commercialSpec` (interim DAOS state)
- `ctrExpert` (`ctrReview`)
- `seniorArtDirector` (`seniorAdReview`)

### Connection point

Same as Wave 16 — `compileFromBlueprint()` in `pollinations-adapters.ts`, inside `attachDaosV17ModulesBridgeToPayload()` when `DAOS_V17_MODULES_BRIDGE=1`. CTR enhanced section activates when `DAOS_V17_CTR_BRIDGE=1`.

### Diagnostics

| Field | Description |
|-------|-------------|
| `daosV17CtrBridgeEnabled` | Flag state |
| `daosV17CtrBridgeApplied` | Enhanced CTR section compiled |
| `daosV17CtrBridgeSource` | Primary source fields used |
| `daosV17CtrBridgeLength` | CTR body length (≤180) |

`ctr_wording` added to `modulesCompiled` when section compiles; `modulesStillIgnored` computed honestly.

### Meaning-loss

| Code | When |
|------|------|
| `DAOS_V17_CTR_BRIDGE_NOT_APPLIED` | CTR flag on, render context attached, CTR bridge not applied |
| `CTR_WORDING_STILL_IGNORED` | `ctr_wording` still in `modulesStillIgnored` |

---

## Smoke A/B (real Pollinations)

| Env | Baseline | CTR |
|-----|----------|-----|
| `DAOS_RENDER_CONTEXT` | `1` | `1` |
| `DAOS_V17_PROMPT_BRIDGE` | `1` | `1` |
| `DAOS_V17_MODULES_BRIDGE` | `1` | `1` |
| `DAOS_V17_CTR_BRIDGE` | `0` | `1` |
| Seed | `wave17-ab-drill-20260706` | same |

### Baseline (CTR OFF)

| Field | Value |
|-------|--------|
| projectId | `f8a12451-5626-4f20-be0b-26d9cd2f9d75` |
| promptLength | **1377** |
| daosV17CtrBridgeApplied | false |
| modulesCompiled | layout, hierarchy, typography, **ctr_wording** (basic) |
| modulesStillIgnored | **[]** |
| ctr section | `[ctr_wording] hook …; market WB: 58%…` |

### CTR ON

| Field | Value |
|-------|--------|
| projectId | `7aadc75a-3846-44a9-a8eb-c4f839693c8a` |
| promptLength | **1380** (+3) |
| daosV17CtrBridgeApplied | **true** |
| daosV17CtrBridgeLength | **177** |
| daosV17CtrBridgeSource | `daosContext.mainMessage+ctrExpert.recommendations+commercialSpec.trustDrivers` |
| modulesCompiled | all 4 including **ctr_wording** |
| modulesStillIgnored | **[]** |
| ctr section | `CTR wording intent: - main message: … - click trigger: … - trust driver: Trust signals pending` |

### Comparison

| Metric | Baseline | CTR | Delta |
|--------|----------|-----|-------|
| promptLength | 1377 | 1380 | **+3** |
| CTR format | basic `[ctr_wording]` | structured intent block | changed |
| daosV17CtrBridgeApplied | false | true | changed |
| modulesStillIgnored | [] | [] | 0 |
| provider seed | 1001282180 | 1001282180 | same |

Note: Baseline already compiled `ctr_wording` via Wave 16 basic path (`marketSnippet` on `providerHints`). Wave 17 adds structured CTR intent, source tracking, and richer fields from `ctrExpert` / `commercialSpec` / `seniorArtDirector`.

---

## Constraints respected

- Provider unchanged
- Prompt compiler not rewritten (adapter hook only)
- `modulesIgnored` not artificially cleared
- Default **OFF**

---

## Risks

1. **Cyrillic stripping** — commercial fields may degrade at provider boundary (same as Waves 15–16).
2. **Basic vs enhanced overlap** — with `MODULES=1` only, basic CTR may compile; `CTR=1` replaces with enhanced format.
3. **Placeholder trust drivers** — adapter defaults like `"Trust signals pending"` compile honestly but add limited provider value.

---

## Verification

```bash
cd marketplace-infographic
npm run daos:test    # PASS (v17-modules-bridge tests include CTR)
npm run daos:spec    # PASS
npm run lint         # PASS
npm run typecheck    # pre-existing errors in tmp/* and render-blueprint/* only
```
