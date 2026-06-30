# DESIGN AI v18 — Chapter 7.18: Marketplace Director Agent

## Purpose

Marketplace Director adapts the entire infographic to a specific trading platform's requirements. After Typography Director completes overlay text design, this agent answers: **"How should this design look specifically for this marketplace?"**

## Mission

Apply platform rules, buyer behavior, overlay strategy, and commercial optimization without redesigning the core creative work from prior agents.

## Module

Implemented as `marketplace-director-agent-*`, extending Ch 5.5 `marketplace-knowledge-*`.

| File | Role |
|------|------|
| `marketplace-director-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `marketplace-director-agent-engine.ts` | Agent runner, retry, Ch 7.5/7.6 integration |
| `marketplace-director-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Marketplace Profile Loader
2. Marketplace Rules Engine
3. Behavior Analyzer
4. Overlay Optimizer
5. Commercial Adaptation Engine
6. Marketplace Validator
7. Marketplace Blueprint Builder

## Pipeline Position

```text
Typography Director → Marketplace Director → Pattern Director
```

Marketplace Director is the last agent that modifies infographic structure before final validation.

## Key APIs

| API | Role |
|-----|------|
| `executeMarketplaceDirectorAgent()` | Full agent execution with modules + retry |
| `buildBatterySprayerMarketplaceDirectorInput()` | Garden sprayer Wildberries kitchen fixture |
| `selectOverlayStrategy()` | Platform-specific overlay strategy selection |
| `fromMarketplaceSection()` | Spec-compliant MarketplaceBlueprint output |
| `validateMarketplaceDirectorAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 5.5 `marketplace-knowledge-engine` — platform rules and validation
- Ch 7.17 `typography-director-agent` — Typography Blueprint input
- Ch 7.12 `composition-director-agent` — Layout Blueprint input
- Ch 7.10 `visual-story-director-agent` — Story Blueprint input
- Ch 7.8 `business-understanding-agent` — Business Model input
- Ch 7.6 `agent-professional-decision` — marketplace strategy decision

## Golden Rule

Beautiful design is not yet effective design. Marketplace Director makes the final commercial step — adapting all prior agent work for the specific platform so the card converts where the buyer decides to purchase.
