# DAOS Wave 7 Report

## Implemented

- Soft final gate: `src/lib/daos/gates/final-gate.ts`
  - `evaluateDaosFinalGate({ summary?, generationMode? })`
  - `renderDaosFinalGateMarkdownSection(result)` — appended to summary markdown
- Exports: `src/lib/daos/gates/index.ts`, `src/lib/daos/index.ts`
- Pipeline hook after debug summary creation in `generate-infographic-handler.ts`
- Tests: `src/lib/daos/tests/final-gate.test.ts`

## Gate rules

| Input | Gate status |
|-------|-------------|
| `summary.status === "critical"` | `failed` |
| `summary.status === "warning"` | `warning` |
| `summary.status === "ok"` | `passed` |
| `premium` / `enterprise` and `score < 80` | `failed` (escalates) |
| `balanced` and `score < 65` | `warning` (escalates) |
| `draft` and `score < 50` | `warning` (escalates) |
| No summary | `warning` |

When multiple rules apply, the **worst** status wins (`failed` > `warning` > `passed`).

## Why `blocking = false`

Wave 7 is intentionally **soft**: the gate records quality posture in stored diagnostics only. Generation always completes; public API response is unchanged. Hard blocking is deferred to Wave 8+ behind an explicit feature flag.

## Recommendations (minimum set)

- Failed due to critical → *"Review DAOS debug bundle before trusting output."*
- `fallbackUsed` → *"Investigate render fallback path."*
- `modulesIgnored` present → *"Review ignored render modules."*
- Missing specs → *"Improve spec adapter coverage."*

## Diagnostics additions

Stored `daosProjectState` fields (not public API):

| Field | Type | Description |
|-------|------|-------------|
| `finalGateStatus` | `passed` \| `warning` \| `failed` | Soft gate outcome |
| `finalGateScore` | number | From debug summary score |
| `finalGateBlocking` | `false` | Always false in Wave 7 |
| `finalGateReasons` | string[] | Why gate reached this status |

Summary markdown (`daos-debug-summary.md`) optionally includes a **Final Gate (soft)** section.

## Not changed

- Generation blocking behavior
- UI, public API response
- Render engine, prompt compiler, providers
- Pre-existing typecheck errors

## Wave 8 (next)

- Opt-in hard gate (`DAOS_FINAL_GATE_BLOCKING=1`) for premium/enterprise
- Surface gate status in admin diagnostics UI
- Gate history / trend across runs
- Vision report integration when `enableVisionRequired`

## Verification

```bash
cd marketplace-infographic
npm run daos:test
npm run daos:spec
npm run lint
npm run typecheck
```
