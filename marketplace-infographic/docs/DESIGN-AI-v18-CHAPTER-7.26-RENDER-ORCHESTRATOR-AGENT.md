# DESIGN AI v18 — Chapter 7.26: Render Orchestrator Agent

## Purpose

Render Orchestrator is the central coordinator of the final image generation stage. Prior agents decide, build blueprints, analyze quality, and approve work — but none of them generate the image. This agent unifies the Agent Ecosystem output into a single Render Pipeline.

## Mission

Answer: **"How do we turn dozens of independent blueprints into one perfect commercial image?"** It does not make design decisions — it guarantees every decision is implemented without loss.

## Module

Implemented as `render-orchestrator-agent-*`, post-approval render coordination layer.

| File | Role |
|------|------|
| `render-orchestrator-agent-types.ts` | 6 internal modules, input/output contracts, KPIs |
| `render-orchestrator-agent-engine.ts` | Agent runner, dependency resolution, scheduling, retry |
| `render-orchestrator-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (6)

1. Blueprint Collector
2. Dependency Resolver
3. Render Planner
4. Execution Scheduler
5. Pipeline Validator
6. Render Session Builder

## Pipeline Position

```text
Final Approval → Render Orchestrator → Render Adapter → Image Generator
```

Render cannot start without Chief Design Director approval.

## Key APIs

| API | Role |
|-----|------|
| `executeRenderOrchestratorAgent()` | Full agent execution with modules + stage retry |
| `buildBatterySprayerRenderOrchestratorInput()` | Garden sprayer kitchen fixture with approved decision |
| `buildRenderOrchestratorPlan()` | Multi-stage render plan with strategy selection |
| `fromRenderSessionSection()` | Spec-compliant RenderSession output |
| `validateRenderOrchestratorAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 7.24 `chief-design-director-agent` — FinalDesignDecision input
- Ch 7.1–7.19 director blueprints — full approved blueprint stack
- Ch 6.12 `render-adapter-stage` — downstream render adapter handoff
- Ch 4.17 `render-adapter` — provider abstraction (Flux, GPT Image, etc.)
- Ch 7.6 `agent-professional-decision` — render orchestration validation

## Golden Rule

Creating the perfect design is not enough — it must be realized faithfully. Render Orchestrator guarantees every blueprint and agent decision is embodied in the final image exactly as specialists intended.
