# DAOS Wave 15 — V17 Prompt Compiler Bridge Report

## Goal

Make DAOS context affect v17 `finalPrompt` when explicitly enabled, without rewriting render-engine/provider/compiler or changing the public API.

**Feature flag:** `DAOS_V17_PROMPT_BRIDGE=1` (default **OFF**).

Requires `DAOS_RENDER_CONTEXT=1` so `daosContext` is attached to the v17 render input.

---

## Implemented

### Bridge compiler

`marketplace-infographic/src/lib/daos/adapters/v17-prompt-bridge.ts`

| Export | Role |
|--------|------|
| `createDaosV17PromptBridgeBlock(context)` | Short block (max 900 chars), header `DAOS V17 CONTEXT:` |
| `attachDaosV17PromptBridgeToPayload(payload, context)` | Clones payload, appends block when flag on |
| `isDaosV17PromptBridgeEnabled()` | `process.env.DAOS_V17_PROMPT_BRIDGE === "1"` |

Bridge content: commercial goal, main message, USP, creative concept, visual scene, composition, render strategy, missing specs, and explicit `Modules must not ignore: layout_coordinates, hierarchy, typography_zones, ctr_wording`. No JSON dump.

### Connection point (exact)

**Primary hook:** `compileFromBlueprint()` in  
`marketplace-infographic/src/lib/render-engine/adapters/pollinations-adapters.ts`

After `compilePollinationsPrompt()` builds the Flux/GPT-image blueprint payload, before return:

```typescript
return attachDaosV17PromptBridgeToPayload(payload, request.metadata?.daosContext);
```

This path runs only when `request.metadata.visualBlueprint` is present (v17 Pollinations/Flux blueprint compiler path).

**Context passthrough chain:**

1. `generate-infographic-handler.ts` — `attachDaosContextToRenderInput` when `DAOS_RENDER_CONTEXT=1`
2. `regenerate-background.ts` → `renderWithRetry({ daosContext })`
3. `render-planner.ts` — `metadata.daosContext` on `RenderRequest`
4. `pollinations-adapters.ts` — bridge append at compile time

### Diagnostics & meaning-loss

| Field | Where |
|-------|--------|
| `daosV17BridgeApplied` | `CompiledRenderPayload.daosV17Bridge`, `renderDebug`, handler diagnostics |
| `daosV17BridgeLength` | same |
| `daosV17BridgePreview` | same (first 240 chars of block, pre-provider) |
| `daosV17BridgeModulesAddressed` | same |

| Warning code | When |
|--------------|------|
| `DAOS_V17_BRIDGE_NOT_APPLIED` | Flag on, `renderContextAttached`, bridge not applied |
| `DAOS_V17_BRIDGE_APPLIED_WITH_IGNORED_MODULES` | Bridge applied but adapter still reports ignored layout/hierarchy/typography/ctr modules |

`modulesIgnored` are **not** artificially removed — adapter still honestly reports all four modules.

### Tests

`marketplace-infographic/src/lib/daos/tests/v17-prompt-bridge.test.ts` — added to `npm run daos:test`.

---

## Smoke A/B (manual, real Pollinations)

| Env | Baseline | Bridge |
|-----|----------|--------|
| `DAOS_RENDER_CONTEXT` | `1` | `1` |
| `DAOS_V17_PROMPT_BRIDGE` | `0` | `1` |
| `POLLINATIONS_API_KEY` | set | set |
| Seed suffix | `wave15-ab-drill-20260706` | same |

### Baseline run

| Field | Value |
|-------|--------|
| projectId | `c77b8714-b776-4523-a567-d1ef6604fc50` |
| runId | `38aae6a4-86ff-45aa-8102-f1acb7fc7a7f` |
| summaryScore | **83** |
| fallbackUsed | **false** |
| provider / model | pollinations / flux |
| promptLength | **583** |
| provider seed | `2088873363` |
| renderContextAttached | **true** |
| daosV17BridgeApplied | **false** (flag off) |
| modulesIgnored | `layout_coordinates`, `hierarchy`, `typography_zones`, `ctr_wording` |

### Bridge run

| Field | Value |
|-------|--------|
| projectId | `95c84259-e132-443b-b4dd-55c29ffbb46f` |
| runId | `a937f4f9-ddf3-46ea-ad0e-45cfbcb85e7a` |
| summaryScore | **73** |
| fallbackUsed | **false** |
| provider / model | pollinations / flux |
| promptLength | **895** (+312) |
| provider seed | `2088873363` (same) |
| renderContextAttached | **true** |
| daosV17BridgeApplied | **true** |
| daosV17BridgeLength | **449** |
| daosV17BridgeModulesAddressed | all four bridge modules |
| modulesIgnored | same four (unchanged, honest) |
| meaning-loss | `DAOS_V17_BRIDGE_APPLIED_WITH_IGNORED_MODULES` |

### finalPrompt diff

**Baseline tail (583 chars, no bridge):**

```text
…performance premium, large clean empty space on left
```

**Bridge tail (+312 chars appended):**

```text
…large clean empty space on left DAOS V17 CONTEXT: Commercial goal: Outdoor- : , , outdoor advertising atmosphere, Main message: USP: Outdoor- : , , outdoor advertising atmosphere, Creative concept: Visual scene: luxury_minimal Missing specs: renderBlueprint Modules must not ignore: layout_coordinates, hierarchy, typography_zones, ctr_wording
```

`daosV17BridgePreview` retains readable Cyrillic (pre-moderation snapshot); provider-facing `finalPrompt` shows Cyrillic stripped in the bridge segment by existing Pollinations moderation — baseline compiler prompt unchanged.

### Background PNG

| Run | File (approx.) | MD5 |
|-----|----------------|-----|
| Baseline | `v17-ad1d2dd9200bedbb-1783318473189.png` | `0cbfe9effe29dc7d02248551a7497ed3` |
| Bridge | `v17-2c619e435de0e625-1783318477511.png` | `ebaefccced28d18edb8c5075c01f3cbb` |

Same provider seed, **different prompt** → **different background** (expected).

### Comparison table

| Metric | Baseline | Bridge | Delta |
|--------|----------|--------|-------|
| `DAOS_V17_PROMPT_BRIDGE` | 0 | 1 | flag |
| finalPrompt length | 583 | 895 | **+312** |
| finalPrompt text | compiler only | compiler + DAOS block | **changed** |
| daosV17BridgeApplied | false | true | **changed** |
| modulesIgnored | 4 modules | 4 modules (same) | 0 |
| provider seed | 2088873363 | 2088873363 | same |
| background MD5 | 0cbfe9ef… | ebaefccc… | **different** |
| summaryScore | 83 | 73 | -10 |

---

## modulesIgnored (before / after bridge)

| Module | Baseline | Bridge |
|--------|----------|--------|
| `layout_coordinates` | ignored | ignored |
| `hierarchy` | ignored | ignored |
| `typography_zones` | ignored | ignored |
| `ctr_wording` | ignored | ignored |

Bridge addresses these modules **in prompt text only**; adapter/compiler module wiring unchanged.

---

## Constraints respected

- Render-engine: single hook in `compileFromBlueprint`, metadata passthrough only
- Provider: unchanged
- Public API response: unchanged
- Legacy path: unchanged when flag off
- Default: bridge **OFF**

---

## Risks

1. **Moderation strips Cyrillic** in appended bridge while compiler prompt stays Latin — commercial meaning may be partially lost at provider boundary.
2. **modulesIgnored remain honest** — bridge is advisory append; true module integration needs a future compiler wave.
3. **Prompt length** grows up to +900 chars — may affect provider limits/latency.
4. **Score variance** — bridge run scored 73 vs baseline 83 on same product; prompt change alters render quality heuristics.
5. **Flag coupling** — bridge requires both `DAOS_RENDER_CONTEXT=1` and `DAOS_V17_PROMPT_BRIDGE=1`.

---

## Verification

```bash
cd marketplace-infographic
npm run daos:test    # PASS (includes v17-prompt-bridge.test.ts)
npm run daos:spec    # PASS
npm run lint         # PASS
npm run typecheck    # pre-existing errors in tmp/* smoke scripts and render-blueprint/* only
```
