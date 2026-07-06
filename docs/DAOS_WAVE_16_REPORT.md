# DAOS Wave 16 — V17 Compiler Modules Bridge Report

## Goal

Stop silently ignoring `layout_coordinates`, `hierarchy`, `typography_zones`, and `ctr_wording` in the v17 Pollinations/Flux blueprint path. Compile deterministic prompt sections under `DAOS_V17_MODULES_BRIDGE=1` (default **OFF**), while keeping `modulesIgnored` honest.

Requires `DAOS_RENDER_CONTEXT=1` for `daosContext` and works alongside Wave 15 `DAOS_V17_PROMPT_BRIDGE=1`.

---

## Implemented

### Modules bridge compiler

`marketplace-infographic/src/lib/daos/adapters/v17-modules-bridge.ts`

| Export | Role |
|--------|------|
| `createDaosV17ModulesBridgeBlock(request)` | Builds sections from layout / visualBlueprint / daosContext / providerHints |
| `attachDaosV17ModulesBridgeToPayload(payload, request)` | Clones payload, appends block when flag on |
| `isDaosV17ModulesBridgeEnabled()` | `process.env.DAOS_V17_MODULES_BRIDGE === "1"` |

Each module compiler uses only available data (no fabrication):

| Module | Data sources |
|--------|----------------|
| `layout_coordinates` | `request.layout` (hero, zones, placement), `visualBlueprint.composition` |
| `hierarchy` | `metadata.daosContext` mainMessage / commercialGoal / creativeConcept |
| `typography_zones` | `layout.headlineZone`, `textSafeZones`, blueprint safeZones |
| `ctr_wording` | `daosContext` commercialGoal / mainMessage, `providerHints.marketSnippet` / `ctrHook` |

Max total bridge length: **700 chars**.

### Connection point (exact)

`compileFromBlueprint()` in `pollinations-adapters.ts` — after Wave 15 prompt bridge:

```typescript
const withPromptBridge = attachDaosV17PromptBridgeToPayload(payload, request.metadata?.daosContext);
return attachDaosV17ModulesBridgeToPayload(withPromptBridge, request);
```

### Diagnostics

| Field | Description |
|-------|-------------|
| `daosV17ModulesBridgeEnabled` | Flag state in handler / debug bundle |
| `daosV17ModulesBridgeApplied` | Modules block appended to prompt |
| `daosV17ModulesBridgeLength` | Block char length |
| `daosV17ModulesCompiled` | Modules that produced sections |
| `daosV17ModulesStillIgnored` | `modulesIgnored − modulesCompiled` (honest) |

`modulesIgnored` on payload **unchanged** (still lists all four adapter-ignored modules).

### Meaning-loss

| Code | When |
|------|------|
| `DAOS_V17_MODULES_BRIDGE_NOT_APPLIED` | Flag on, render context attached, bridge not applied |
| `DAOS_V17_MODULES_STILL_IGNORED` | Bridge applied but some ignored modules lack compiled sections |

### Tests

`src/lib/daos/tests/v17-modules-bridge.test.ts` — added to `npm run daos:test`.

---

## Smoke A/B (manual, real Pollinations)

| Env | Baseline | Modules |
|-----|----------|---------|
| `DAOS_RENDER_CONTEXT` | `1` | `1` |
| `DAOS_V17_PROMPT_BRIDGE` | `1` | `1` |
| `DAOS_V17_MODULES_BRIDGE` | `0` | `1` |
| Seed suffix | `wave16-ab-drill-20260706` | same |

### Baseline (modules OFF)

| Field | Value |
|-------|--------|
| projectId | `1f5ab648-5965-49d3-9b3c-3a3f910e94a3` |
| runId | `f67978ee-d4b6-4cb9-b822-b347e0da5217` |
| summaryScore | **78** |
| promptLength | **895** |
| daosV17ModulesBridgeApplied | false |
| modulesIgnored | 4 modules |
| modulesStillIgnored | n/a |
| provider seed | `23696521` |

### Modules ON

| Field | Value |
|-------|--------|
| projectId | `016ea71f-335b-4bc0-8ea9-0211576deaf0` |
| runId | `090928ef-8f7f-455f-a52f-28295f7173c4` |
| summaryScore | **73** |
| promptLength | **1399** (+504) |
| daosV17ModulesBridgeApplied | **true** |
| daosV17ModulesBridgeLength | **571** |
| daosV17ModulesCompiled | `layout_coordinates`, `hierarchy`, `typography_zones` |
| daosV17ModulesStillIgnored | `ctr_wording` (1 vs 4) |
| modulesIgnored | 4 modules (unchanged, honest) |
| provider seed | `23696521` (same) |

### finalPrompt diff (tail)

**Baseline (895 chars):** ends with Wave 15 `DAOS V17 CONTEXT:` block only.

**Modules (1399 chars):** same context block + appended:

```text
DAOS V17 MODULES:
[layout_coordinates] hero right, negative space left, product zone center 57 67, hero zone x50 y32 w59 h64, ...
[hierarchy] main …; goal Outdoor- …
[typography_zones] headline zone x6 y9 w29 h18 empty, headline safe left 5.3 top 6.2 w 52 h 16 empty, ...
```

`ctr_wording` remained in `modulesStillIgnored` because no `providerHints.ctrHook` / `marketSnippet` was present on the render request and Cyrillic commercial fields were stripped at provider boundary.

### Background PNG

| Run | MD5 (approx.) |
|-----|----------------|
| Baseline | `d21925c71f1329365a25c8546eb6a611` |
| Modules | `94c5f5b913f9c4a7b7d8f57cf911fdbd` |

Same seed, different prompt → different background (expected).

### Comparison table

| Metric | Baseline | Modules | Delta |
|--------|----------|---------|-------|
| promptLength | 895 | 1399 | **+504** |
| daosV17ModulesBridgeApplied | false | true | changed |
| modulesCompiled | 0 | 3 | **+3** |
| modulesStillIgnored count | 4 | 1 | **−3** |
| modulesIgnored (honest) | 4 | 4 | 0 |
| provider seed | 23696521 | 23696521 | same |
| background MD5 | d21925c7… | 94c5f5b9… | different |

---

## Constraints respected

- Render-engine: single hook in `compileFromBlueprint`, no provider rewrite
- Public API response unchanged
- Legacy path unchanged when flag off
- `modulesIgnored` not artificially cleared
- Default **OFF**

---

## Risks

1. **Partial compilation** — modules compile only when source data exists; `ctr_wording` may stay ignored without providerHints / Latin-safe commercial text.
2. **Cyrillic stripping** — Pollinations moderation may degrade hierarchy/ctr sections (same as Wave 15).
3. **Prompt length** — stacked Wave 15 + 16 bridges can exceed ~1300 chars; monitor provider limits.
4. **Adapter honesty** — `modulesIgnored` still reports compiler gaps; `modulesStillIgnored` is the actionable delta.

---

## Verification

```bash
cd marketplace-infographic
npm run daos:test    # PASS (includes v17-modules-bridge.test.ts)
npm run daos:spec    # PASS
npm run lint         # PASS
npm run typecheck    # pre-existing errors in tmp/* smoke scripts and render-blueprint/* only
```
