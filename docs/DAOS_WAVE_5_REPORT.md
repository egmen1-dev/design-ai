# DAOS Wave 5 Report

## Implemented

- Generation mode module: `src/lib/daos/config/generation-mode.ts`
  - `DAOSGenerationMode`: `draft` | `balanced` | `premium` | `enterprise`
  - `resolveDaosGenerationMode()` — env/input resolution
  - `getDaosGenerationPolicy()` — guardrail policy per mode
- Legacy DAOS state: `generationMode` on `ProductBrief`, policy in `events` + `debug`
- Debug bundle: `generationMode`, `generationPolicySummary`, diagnostics flags
- Meaning-loss severity escalation for `premium` / `enterprise`
- Pipeline hook at start of `generate-infographic-handler.ts`
- Tests: `src/lib/daos/tests/generation-mode.test.ts`

## Modes

| Mode | maxRetries | Fast shortcuts | Debug bundle | Render debug | Vision | min score |
|------|------------|----------------|--------------|--------------|--------|-----------|
| **draft** | 1 | yes | optional | no | optional | 70 |
| **balanced** | 2 | yes | yes | no | optional | 80 |
| **premium** | 5 | no | yes | required | required | 90 |
| **enterprise** | 8 | no | yes | required | required | 95 |

> Policy fields are **declarative guardrails** in Wave 5. They do not yet change legacy pipeline retry counts or FAST_GENERATION behavior.

## FAST_GENERATION compatibility

| Condition | Resolved mode |
|-----------|---------------|
| `DAOS_GENERATION_MODE` set (valid) | **that mode** (highest priority) |
| `FAST_GENERATION=0` | `premium` |
| `FAST_GENERATION` unset | `balanced` |
| `FAST_GENERATION=1` (or other truthy) | `draft` |

Legacy `FAST_GENERATION` env and `pipeline-config.ts` are **unchanged**.

## Debug bundle additions

```json
{
  "generationMode": "premium",
  "generationPolicySummary": {
    "mode": "premium",
    "maxRetries": 5,
    "allowFastShortcuts": false,
    "requireRenderDebug": true,
    "minimumFinalScore": 90
  },
  "diagnostics": {
    "generationMode": "premium",
    "fastShortcutsAllowed": false,
    "premiumGuardrailsActive": true
  }
}
```

## Meaning-loss escalation (premium / enterprise)

| Code | draft/balanced | premium/enterprise |
|------|----------------|-------------------|
| `PROMPT_MISSING` | warning | **critical** |
| `FALLBACK_USED` | warning | **critical** |
| `RENDER_DEBUG_MISSING` | — | **critical** |
| `MODULES_IGNORED` | warning | warning (counted in diagnostics) |

## Not changed

- Render engine retry counts, providers, prompt compiler
- UI, public API response
- Global FAST_GENERATION behavior in `pipeline-config.ts`
- Pre-existing typecheck errors

## Wave 6 (next)

- Wire `maxRetries` / `minimumFinalScore` policy into pipeline gates (opt-in)
- Vision report bridge when `enableVisionRequired`
- Admin UI mode selector → `DAOS_GENERATION_MODE`
- Enforce premium guardrails (block generation on critical meaning-loss)

## Verification

```bash
cd marketplace-infographic
npm run daos:test
npm run daos:spec
npm run lint
npm run typecheck
```
