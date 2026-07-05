# DAOS Wave 6 Report

## Implemented

- Debug summary reporter: `src/lib/daos/debug/daos-debug-summary.ts`
  - `createDaosDebugSummary(bundle: unknown)`
  - `renderDaosDebugSummaryMarkdown(summary)`
- Summary writer: `src/lib/daos/debug/daos-debug-summary-writer.ts`
  - `writeDaosDebugSummary({ bundle, bundlePath? })`
- Pipeline hook after `writeDaosDebugBundle` in `generate-infographic-handler.ts`
- Tests: `src/lib/daos/tests/debug-summary.test.ts`

## Summary files created

When bundle write succeeds, alongside `daos-debug-bundle.json`:

```
generated/daos-debug/<projectId>/<runId>/daos-debug-summary.json
generated/daos-debug/<projectId>/<runId>/daos-debug-summary.md
```

Write failures log a warning and do not abort generation.

## Summary fields

| Field | Description |
|-------|-------------|
| `projectId` / `runId` | Run identity |
| `generationMode` | From bundle (`draft` / `balanced` / `premium` / `enterprise`) |
| `status` | `ok` \| `warning` \| `critical` |
| `score` | 0–100 deterministic health score |
| `specsPresent` / `specsMissing` | Adapted vs missing DAOS specs |
| `warningCount` / `criticalCount` | From meaning-loss warnings |
| `topWarnings` | Up to 5 warning messages |
| `render` | provider, model, prompt, fallback, modulesIgnored |
| `recommendations` | Actionable remediation hints |

## Scoring formula

Start at **100**, then subtract:

| Factor | Penalty |
|--------|---------|
| Each critical warning | −15 |
| Each warning | −5 |
| Each missing spec | −7 |
| `fallbackUsed` | −20 |
| Each `modulesIgnored` entry | −3 |
| Prompt missing (renderBlueprint without captured prompt) | −10 |

Clamp to **0–100**.

**Status rules:**

- `critical` if `criticalCount > 0` or `score < 60`
- `warning` if `warningCount > 0` or `score < 85`
- `ok` otherwise

## Diagnostics additions

Stored `daosProjectState` (not public API response):

- `debugSummaryPath`
- `debugSummaryStatus`
- `debugSummaryScore`

## Not changed

- Render engine, prompt compiler, providers, UI
- Public `GenerateInfographicResult` response
- Legacy pipeline retry behavior
- Pre-existing typecheck errors

## Wave 7 (next)

- CLI command to list/sort recent summaries by score
- Optional HTTP admin route to fetch summary markdown
- Cross-link summary with `public/debug/<requestId>/` render artifacts
- Aggregate dashboard across runs (mode × score)

## Verification

```bash
cd marketplace-infographic
npm run daos:test
npm run daos:spec
npm run lint
npm run typecheck
```
