# DAOS Wave 4 Report

## Implemented

- Render debug bridge: `src/lib/daos/debug/render-debug-bridge.ts`
  - `extractDaosRenderDebug(input: unknown)` — safe heuristic extraction
- Debug bundle extended with `renderDebug` section + diagnostics flags
- Meaning-loss checks for render prompt/provider/fallback gaps
- Pipeline hook in `generate-infographic-handler.ts`
- Tests: `src/lib/daos/tests/render-debug-bridge.test.ts`

## Render artifacts now in bundle

| Field | Source (heuristic) |
|-------|-------------------|
| `provider` | `request.providerId`, `selectedAttempt`, `result.providerId` |
| `model` | `request.modelId`, `compiled.model` |
| `renderStrategy` | `renderBlueprint.renderStrategy`, `request.profileId` |
| `finalPrompt` | `selectedAttempt.result.compiled.prompt`, `compiledBackground.prompt` |
| `negativePrompt` | `compiled.negativePrompt` |
| `promptLength` | derived from `finalPrompt` |
| `fallbackUsed` | `backgroundSource=fallback`, engine `backgroundSource`, `fallbackUsed` flag |
| `fallbackReason` | pipeline source, retry errors from `attempts[]` |
| `modulesIgnored` | `compiled.modulesIgnored` |
| `renderRequestSummary` | requestId, profileId, modelId, providerId, category, canvas |
| `providerPayloadSummary` | providerId, modelId, latencyMs, seed, modulesUsed |

Bundle path unchanged:

```
generated/daos-debug/<projectId>/<runId>/daos-debug-bundle.json
```

## Fields not fully captured yet

- Raw provider HTTP payload / response body (only summary metadata)
- Per-attempt prompt diffs across retry chain
- Composed final slide path (separate `render-debug` artifacts)
- SD legacy path prompt when render engine not used
- Exact moderation fallback prompt text

## New meaning-loss warnings

| Code | Severity | Rule |
|------|----------|------|
| `PROMPT_MISSING` | warning | `renderBlueprint` exists, no `finalPrompt` in `renderDebug` |
| `PROMPT_TOO_SHORT` | warning | `promptLength < 120` |
| `PROMPT_TOO_LONG` | warning | `promptLength > 2500` |
| `MODULES_IGNORED` | warning | `modulesIgnored.length > 0` |
| `FALLBACK_USED` | warning | `fallbackUsed === true` |
| `PROVIDER_MISSING` | warning | render context present, provider empty |
| `RENDER_PROMPT_CONTRACT_VIOLATION` | **critical** | unchanged from Wave 3 |

## Not changed

- Render engine, prompt compiler, providers, UI
- Public API response shape
- Pre-existing typecheck errors

## Wave 5 (next)

- Link bundle `renderDebug` to `public/debug/<requestId>/` render-debug files
- Per-attempt timeline in bundle (attempt 0 → N)
- Admin diagnostics viewer for bundle + meaning-loss
- `VisionReport` bridge (when vision critic is mandatory)
- Structured USP → prompt token alignment (no word-overlap heuristic)

## Verification

```bash
cd marketplace-infographic
npm run daos:test
npm run daos:spec
npm run lint
npm run typecheck
```
