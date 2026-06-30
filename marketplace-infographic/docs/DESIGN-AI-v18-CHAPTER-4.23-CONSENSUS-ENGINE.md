# DESIGN AI v18 — Chapter 4.23: Consensus Engine

## Purpose

Consensus Engine reconciles decisions made by different agents before the blueprint reaches the Render Adapter. It detects logical contradictions invisible when analyzing each section in isolation.

## Pipeline Position

```
Creative Directors → Technical Directors → Blueprint Validation → Consensus Engine → Approved Blueprint → Render Adapter
```

Runs **before** image generation so errors are fixed before contacting the Render Provider.

## Consensus Report

```typescript
interface ConsensusReport {
  overallConsistency: number;
  conflicts: BlueprintConflict[];
  warnings: BlueprintWarning[];
  agreementMatrix: AgreementMatrix;
  requiresRetry: boolean;
  recommendedMutations: BlueprintMutation[];
  confidence: number;
}
```

## Conflict Types

| Type | Example |
|------|---------|
| Semantic | Luxury story + industrial cold lighting |
| Structural | Outdoor scene + studio top-softbox scheme |
| Visual | Luxury story + wide documentary camera |
| Marketplace | Dark product on dark background |
| Provider | Rich composite background on GPT Image |

## Key Behaviors

- **Semantic analysis** — compares meaning, not string text
- **Cross-agent validation** — Story ⇄ Scene ⇄ Lighting ⇄ Materials ⇄ Camera ⇄ Composition
- **Agreement matrix** — per-section consistency scores with weakest-link detection
- **No voting** — one critical conflict overrides high individual agent agreement
- **Retry recommendations** — publishes mutations for Chief Design Director, never applies directly

## Golden Rule

Consensus Engine does not determine which agent is right — it determines whether all decisions form one professional commercial photograph.

## Implementation

| Module | Role |
|--------|------|
| `consensus-engine-types.ts` | ConsensusReport, conflicts, agreement matrix |
| `consensus-engine-engine.ts` | Semantic/visual/marketplace conflict detection |

## Integration

Consumes complete Render Blueprint with agent confidence scores. Publishes `ConsensusReport` for Chief Design Director — Consensus never mutates sections directly.
