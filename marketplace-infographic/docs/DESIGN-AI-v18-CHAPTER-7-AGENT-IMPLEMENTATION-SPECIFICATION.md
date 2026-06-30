# DESIGN AI v18 — Chapter 7: Agent Implementation Specification

## Purpose

Agent Implementation Specification defines the internal structure of every intelligent agent on the Design AI Platform. While prior chapters described ecosystem interaction, pipeline flow, and knowledge — this chapter standardizes how each agent is built inside.

## Design Philosophy

```text
Legacy:  Input → Prompt → LLM → Output
Design AI: Pipeline Context → Input Adapter → Knowledge → Decision → Rules
           → Blueprint Generator → Self Validation → Output → Pipeline Context
```

Each agent is an independent intelligent microservice — not one big prompt.

## Universal Agent Model

| Stage | Module |
|-------|--------|
| Pipeline Context | `agent-context-engine` |
| Input Adapter | `universal-agent-bridge` |
| Knowledge Retrieval | `knowledge-retrieval-engine` |
| Decision Engine | `agent-decision-engine` |
| Rule Engine | `constraint-engine` |
| Blueprint Generator | `mutation-engine` |
| Self Validation | `validation-engine` |
| Output Adapter | `universal-agent-contract` |
| Pipeline Context (out) | `pipeline-context-engine` |

## Common Internal Architecture

Input Layer → Context Analyzer → Knowledge Retrieval → Decision Engine → Rule Validation → Blueprint Builder → Self Critic → Output Layer

Only Decision Engine content changes per agent.

## Shared Principles

All agents must: work in single domain, use Knowledge Engine, avoid foreign blueprint mutation, pass self validation, return explainable output, support retry, and maintain deterministic decisions.

## Documentation Standard

Every specialized agent documents 13 sections: Purpose, Responsibilities, Input, Output, Internal Modules, Decision Engine, Knowledge Usage, Rule Engine, Validation, Retry Logic, Performance Metrics, Future Evolution, Golden Rule.

## Scope (21 Agents)

Implemented: Story, Scene, Composition, Photography, Lighting, Camera, Material Directors; Vision/Commercial Critics; Chief Design Director; Learning Agent; Consensus Engine.

Planned: Typography, Marketplace, Pattern, Anti-Pattern Directors; Marketplace Critic; Senior Art Director.

## Key APIs

| API | Role |
|-----|------|
| `UNIVERSAL_AGENT_MODEL_PIPELINE` | 9-stage internal agent flow |
| `AGENT_INTERNAL_ARCHITECTURE` | 8 common layers |
| `AGENT_IMPLEMENTATION_SCOPE` | Agent catalog with status |
| `validateAgentImplementationSpec()` | Full specification validation |
| `validateImplementedAgentConformance()` | Per-agent conformance check |

## Integration

- Ch 4.1 `Universal Agent Contract` — external interface
- Ch 4.8 `Agent Decision Model` — Decision Engine stage
- Ch 4.2 `Agent Lifecycle` — orchestration wrapper
- Ch 6.20 `Pipeline Architecture Principles` — Principle 3 Agent Specialization

## Golden Rule

Agent Ecosystem describes how agents interact. Agent Implementation Specification describes how each agent is built inside — turning abstract AI agents into implementable, testable, scalable engineering components.
