# DESIGN AI v18 — Chapter 7.27: Render Adapter Agent

## Purpose

Render Adapter is the bridge between the intelligent Agent Ecosystem and a specific image generation AI model. Prior agents work in a universal design language; this agent translates that language into the prompt and parameters each provider understands.

## Mission

Answer: **"How do we turn a universal blueprint into the perfect request for this generator?"** It does not make design decisions — it ensures maximum fidelity when handing work to the image provider.

## Module

Implemented as `render-adapter-agent-*`, provider translation layer.

| File | Role |
|------|------|
| `render-adapter-agent-types.ts` | 7 internal modules, input/output contracts, KPIs |
| `render-adapter-agent-engine.ts` | Agent runner, prompt compilation, provider adaptation, retry |
| `render-adapter-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Blueprint Translator
2. Provider Adapter
3. Prompt Compiler
4. Negative Prompt Builder
5. Parameter Optimizer
6. Payload Validator
7. Render Payload Builder

## Pipeline Position

```text
Render Orchestrator → Render Adapter → Image Provider
```

Render Adapter is the last intelligent component before image generation.

## Key APIs

| API | Role |
|-----|------|
| `executeRenderAdapterAgent()` | Full agent execution with modules + prompt retry |
| `buildBatterySprayerRenderAdapterInput()` | Garden sprayer kitchen fixture with render session |
| `compileRenderAdapterPrompt()` | Provider-aware positive prompt from blueprints |
| `fromRenderAdapterPayloadSection()` | Spec-compliant RenderPayload output |
| `validateRenderAdapterAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 7.26 `render-orchestrator-agent` — RenderSession input
- Ch 7.1–7.19 director blueprints — full blueprint stack
- Ch 6.12 `render-adapter-stage` — provider profile patterns
- Ch 4.17 `render-adapter-engine` — legacy adapter compilation reference
- Ch 7.6 `agent-professional-decision` — render adaptation validation

## Golden Rule

The ecosystem thinks in design; generators think in prompts. Render Adapter is the professional translator — it does not change the idea, only guarantees every blueprint is understood by the specific AI model.
