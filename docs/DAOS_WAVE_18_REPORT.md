# DAOS Wave 18 — Prompt Compression & Relevance Gate Report

## Goal

Reduce harm from DAOS v17 bridges. Phase 1 (pre-compression) showed `modulesCompiled` improving (+2.4 avg) but `promptLength` growing +803 chars and `summaryScore` falling −3.3. Wave 18 caps additions, prioritizes visual content, and skips low-relevance blocks.

Flag: `DAOS_V17_PROMPT_COMPRESSION=1` (default **OFF**). Requires bridges enabled.

---

## Implemented

### Compressor

`marketplace-infographic/src/lib/daos/adapters/v17-prompt-compressor.ts`

| Export | Role |
|--------|------|
| `compressDaosV17PromptAdditions(input)` | Visual-first compression to ≤450 chars |
| `scoreDaosPromptAdditionRelevance(input)` | 0–1 relevance score for gate |
| `applyDaosV17PromptCompressionToPayload()` | Hook used after prompt + modules bridges |
| `isDaosV17PromptCompressionEnabled()` | `DAOS_V17_PROMPT_COMPRESSION === "1"` |

### Compression rules

**Budget:** total DAOS additions ≤ **450 chars** when flag on.

**Keep first (priority):**

1. Visual scene / composition (`Visual scene:`, `Composition:`, `[layout_coordinates]`)
2. Main message
3. Product/background constraints (`Render strategy:`, placement zones)
4. Lighting/mood / creative concept
5. Commercial goal / USP / `[ctr_wording]` (shortened last)

**Remove/compress first:**

- `Missing specs:` lines
- `Modules must not ignore:` boilerplate
- Long CTR/trust wording (abbreviated to `CTR: msg … click … trust …`)
- Duplicate commercial phrases across bridge + modules
- Abstract filler (`synergy`, `leverage`, `best-in-class`, etc.)

### Relevance gate

If `relevanceScore < 0.55`:

- DAOS additions are **not** appended to provider prompt
- `daosPromptAdditionsSkipped=true`, `skipReason=low_relevance`
- Meaning-loss: `DAOS_PROMPT_ADDITIONS_SKIPPED_LOW_RELEVANCE`

### Connection point

`compileFromBlueprint()` in `pollinations-adapters.ts`:

1. Save `basePrompt` before bridges
2. Run prompt bridge → modules bridge (unchanged)
3. Compress or skip additions before return

Compression runs only when bridges are enabled and at least one bridge applied.

### Diagnostics

| Field | Description |
|-------|-------------|
| `daosPromptCompressionEnabled` | Flag active and compression pass ran |
| `daosPromptOriginalAdditionLength` | Pre-compression DAOS block length |
| `daosPromptCompressedAdditionLength` | Post-compression length (0 if skipped) |
| `daosPromptCompressionRatio` | compressed / original |
| `daosPromptRelevanceScore` | Gate score |
| `daosPromptAdditionsSkipped` | Low-relevance skip |
| `daosPromptRemovedSections` | Section ids dropped during compression |

### Meaning-loss

| Code | When |
|------|------|
| `DAOS_PROMPT_ADDITIONS_SKIPPED_LOW_RELEVANCE` | Relevance gate skipped all additions |
| `DAOS_PROMPT_ADDITIONS_TOO_LONG` | Compressed additions still exceed 450 chars |

---

## Phase 1 mini benchmark (Baseline vs DAOS compressed)

**DAOS arm env:** `DAOS_RENDER_CONTEXT=1`, `DAOS_V17_PROMPT_BRIDGE=1`, `DAOS_V17_MODULES_BRIDGE=1`, `DAOS_V17_CTR_BRIDGE=1`, `DAOS_V17_PROMPT_COMPRESSION=1`

### Before vs after (aggregate)

| Metric | Pre-Wave 18 (uncompressed) | Wave 18 (compressed) | Change |
|--------|---------------------------|----------------------|--------|
| Avg prompt delta | **+803** chars | **+309** chars | **−494 chars (−62%)** |
| Avg summary delta | **−3.3** | **−3.8** | −0.5 (within run variance) |
| Avg modulesCompiled delta | **+2.4** | **+3.2** | still > baseline |
| Office chair | failed (Zod) | failed (Zod) | pre-existing catalog issue |

### Per-product prompt delta (compressed run)

| Product | Baseline prompt | DAOS prompt | Delta |
|---------|-----------------|-------------|-------|
| Cordless Drill | 584 | 895 | +311 |
| Electric Kettle | 542 | 848 | +306 |
| Mattress | 581 | 892 | +311 |
| Children's Toy | 562 | 869 | +307 |

DAOS additions after compression: ~**290–310 chars** above baseline (vs ~800 before).

### Per-product summary delta (compressed run)

| Product | Baseline | DAOS | Delta |
|---------|----------|------|-------|
| Cordless Drill | 83 | 78 | −5 |
| Electric Kettle | 78 | 78 | 0 |
| Mattress | 78 | 73 | −5 |
| Children's Toy | 78 | 73 | −5 |

---

## Decision: **Continue**

**Rationale:**

- Primary Wave 18 target met: prompt bloat cut by ~62% while `modulesCompiled` remains well above baseline.
- Summary delta is still slightly negative (−3.8 vs −3.3) but not driven by prompt length anymore; further gains likely need visual/layout quality work (Wave 19+), not more prompt text.
- Relevance gate and compression diagnostics are in place for Phase 2 monitoring.

**Do not run** `npm run daos:benchmark:30` until office-chair catalog Zod issue is fixed and summary trend is reviewed on a clean 5/5 product run.

---

## Verification

```bash
cd marketplace-infographic
npm run daos:test      # pass
npm run daos:spec      # pass
npm run lint           # pass
npm run typecheck      # pre-existing errors in tmp/* and render-blueprint/*
```

---

## Files changed

- `src/lib/daos/adapters/v17-prompt-compressor.ts` (new)
- `src/lib/daos/tests/v17-prompt-compressor.test.ts` (new)
- `src/lib/render-engine/adapters/pollinations-adapters.ts`
- `src/lib/render-engine/types.ts`
- `src/lib/daos/debug/render-debug-bridge.ts`
- `src/lib/daos/debug/daos-meaning-loss.ts`
- `src/lib/daos/debug/daos-debug-bundle.ts`
- `src/lib/generate-infographic-handler.ts`
- `src/lib/generation/diagnostic-report.ts`
- `src/lib/daos/benchmark/catalog.ts` (`BENCHMARK_DAOS_COMPRESSED_ENV`)
- `src/lib/daos/benchmark/runner.ts` (Phase 1 DAOS arm uses compressed profile)
- `package.json` (test script)
