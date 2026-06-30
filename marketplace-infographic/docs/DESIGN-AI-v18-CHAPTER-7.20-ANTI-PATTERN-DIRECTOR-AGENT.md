# DESIGN AI v18 — Chapter 7.20: Anti-Pattern Director Agent

## Purpose

Anti-Pattern Director is the main quality guardian of the Design AI Platform. After Pattern Director selects proven patterns, this agent answers: **"Which mistakes must absolutely be avoided?"**

## Mission

Detect potential errors before image generation — visual anti-patterns, commercial failures, marketplace violations, and blueprint conflicts. The agent reports problems; it does not fix them.

## Module

Implemented as `anti-pattern-director-agent-*`, extending Ch 5.15 `anti-pattern-library-*`.

| File | Role |
|------|------|
| `anti-pattern-director-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `anti-pattern-director-agent-engine.ts` | Agent runner, retry, Ch 5.15 integration |
| `anti-pattern-director-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Visual Anti-Pattern Detector
2. Commercial Error Analyzer
3. Marketplace Violation Checker
4. Consistency Validator
5. Risk Assessment Engine
6. Recommendation Builder
7. Anti-Pattern Report Builder

## Pipeline Position

```text
Pattern Director → Anti-Pattern Director → Vision Critic
```

Anti-Pattern Director is the last agent that prevents errors before expert critic review.

## Key APIs

| API | Role |
|-----|------|
| `executeAntiPatternDirectorAgent()` | Full agent execution with modules + retry |
| `buildBatterySprayerAntiPatternDirectorInput()` | Garden sprayer full blueprint stack kitchen fixture |
| `buildAntiPatternBlueprintCheck()` | Map blueprints to Ch 5.15 detection context |
| `fromAntiPatternSection()` | Spec-compliant AntiPatternReport output |
| `validateAntiPatternDirectorAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 5.15 `anti-pattern-library-engine` — detection, severity, recommendations
- Ch 7.19 `pattern-director-agent` — Pattern Blueprint input
- Ch 7.18 `marketplace-director-agent` — Marketplace Blueprint input
- Ch 7.17 `typography-director-agent` — Typography Blueprint input
- Ch 7.16–7.13 director agents — Material, camera, lighting, photography blueprints
- Ch 7.6 `agent-professional-decision` — audit decision validation

## Golden Rule

Creating good design is hard; creating bad design is easy. Anti-Pattern Director is the internal auditor — it protects the system from mistakes that destroy commercial potential, without inventing new design.
