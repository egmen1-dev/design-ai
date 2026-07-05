# DAOS Wave 3 Report

## Implemented

- Debug bundle module in `src/lib/daos/debug/`
  - `daos-debug-bundle.ts` — DTO + `createDaosDebugBundle()`
  - `daos-meaning-loss.ts` — deterministic loss-of-meaning analysis
  - `daos-debug-writer.ts` — JSON persistence
  - `index.ts`
- Pipeline hook in `generate-infographic-handler.ts` (after Wave 2 enrichment)
- Tests: `src/lib/daos/tests/debug-bundle.test.ts`

## Debug bundle location

Each generation run writes:

```
generated/daos-debug/<projectId>/<runId>/daos-debug-bundle.json
```

Relative to `marketplace-infographic/` process cwd.

Example:

```
generated/daos-debug/daos-legacy-<uuid>/<run-uuid>/daos-debug-bundle.json
```

The stored diagnostic step `daosProjectState` includes `debugBundlePath` when write succeeds.

## Loss checks (deterministic, no LLM)

| Check | Rule |
|-------|------|
| **missingSpecs** | Any of brief / knowledge / commercial / creative / visual / render absent |
| **lowConfidenceSpecs** | `confidence.score < 0.6` on any spec |
| **emptyDecisionTraceSpecs** | Spec present but `decisionTrace` empty |
| **commercialToCreativeLoss** | `commercialSpec.usp` tokens not found in creative concept/hook/mood |
| **creativeToVisualLoss** | `visualHook` set but `visualBlueprint.scene/composition` empty or placeholder |
| **visualToRenderLoss** | Visual present but render missing, provider empty, or strategy mismatch vs scene heuristics |
| **renderPromptRisk** | `promptAllowedOnlyInAdapter !== true` → **critical** |

## Heuristic / partial fields

- **commercialToCreativeLoss** — token overlap (≥3 chars), not semantic similarity
- **visualToRenderLoss** — keyword-based strategy inference (`studio` → `background_only`, `lifestyle` → `integrated_scene`)
- **Placeholder detection** — `"pending"`, `"unknown"`, etc. from Wave 2 adapters
- **brief** — included in bundle but not always populated in legacy pipeline

## Not changed

- Render engine, prompt compiler, UI, providers
- Public `GenerateInfographicResult` API response
- Pre-existing `render-blueprint/*` typecheck errors

## Risk

Low — debug bundle is side-effect write + diagnostic metadata only. Write failures log warning and do not abort generation.

## Wave 4 (next)

- Surface `meaningLossReport` in admin diagnostics UI (read-only)
- Cross-reference bundle with `render-debug` artifacts
- `VisionReport` / `LearningReport` in bundle
- Optional retention policy / cleanup for `generated/daos-debug/`
- Stronger commercial→creative alignment (structured USP IDs, not word overlap)

## Verification

```bash
cd marketplace-infographic
npm run daos:test
npm run daos:spec
npm run lint
npm run typecheck
```
