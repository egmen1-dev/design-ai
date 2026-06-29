# Migration v17.1 — Design Governance Layer

## Pipeline

```
Knowledge → Story → Scene → Composition → Scene Planner
  → Design Decision Resolver → Constitution (mandatory) → Render Planner → Render Engine
```

## Key modules

- `src/lib/design-governance/decision/` — structured `DesignDecision` from each agent
- `src/lib/design-governance/conflicts/` — conflict detection + severity
- `src/lib/design-governance/resolver/` — single `FinalDesignBlueprint`
- `src/lib/design-governance/constitution/gate.ts` — FAIL blocks render until auto-fix passes
- `src/lib/design-governance/scores/` — multi-dimensional scorecard
- `src/lib/design-governance/trace/` — `decision_trace` + `render_report.json` in `generatedJson`

## Flags

| Env | Default (with v17) | Effect |
|-----|-------------------|--------|
| `RENDER_ENGINE_V17=1` | — | Enables render engine |
| `DESIGN_GOVERNANCE_V171=0` | off | Disable governance |
| `GOVERNANCE_ALLOW_GRADIENT_FALLBACK=1` | off | Allow gradient after all provider retries |
| `GOVERNANCE_PROFESSIONAL_THRESHOLD` | 75 | Minimum professional score before HTML render |

## Errors

- `GOVERNANCE_BLOCKED` (422) — constitution failed after auto-fix
- `RENDER_BLOCKED` (422) — unresolved design or background / low professional score

## Test

```bash
npx tsx src/lib/design-governance/design-governance.spec.ts
```
