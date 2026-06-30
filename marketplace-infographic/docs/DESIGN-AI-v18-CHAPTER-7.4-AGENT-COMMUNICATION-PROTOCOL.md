# DESIGN AI v18 — Chapter 7.4: Agent Communication Protocol

## Purpose

Agent Communication Protocol defines the unified standard for interaction between all intelligent agents in Design AI Platform. The protocol ensures safe, deterministic, explainable, and scalable information exchange.

**Never Agent → Agent. Always Agent → Pipeline.**

## Design Philosophy

Direct agent chains become chaotic — cyclic dependencies, hidden changes, responsibility violations. Pipeline is the sole mediator.

```text
Agent → Blueprint → Pipeline Context → Next Agent
```

## Module

Implemented as `agent-pipeline-communication-*`, extending Ch 4.21 blueprint principles with pipeline message contracts.

| File | Role |
|------|------|
| `agent-pipeline-communication-types.ts` | Message types, request/response/error contracts |
| `agent-pipeline-communication-engine.ts` | Communication sequence, validation, Event Bus |
| `agent-pipeline-communication.spec.ts` | Kitchen and contract tests |

## Message Types

| Type | Role |
|------|------|
| Request | Data-only agent launch package |
| Response | Status, blueprint, telemetry |
| Event | Informational Event Bus publication |
| Retry Request | Pipeline-mediated retry |
| Validation Report | Self-validation result |
| Consensus Report | Independent agent report for Consensus Engine |

## Communication Sequence (8 stages)

1. Pipeline Dispatch
2. Agent Request
3. Agent Execution (Ch 7.3 session lifecycle)
4. Blueprint Publish
5. Validation
6. Agent Response
7. Pipeline Update
8. Next Agent (reads context only)

## Key APIs

| API | Role |
|-----|------|
| `buildAgentPipelineRequest()` | Construct AgentRequest contract |
| `buildAgentPipelineResponse()` | Construct AgentResponse contract |
| `executeAgentPipelineCommunication()` | Full communication cycle |
| `validatePipelineMediatedCommunication()` | Block direct agent calls |
| `validateRetryCommunication()` | Retry via Pipeline only |
| `validateConsensusCommunication()` | Independent consensus reports |

## Integration

- Ch 4.21 `agent-communication-protocol` — ownership, immutability, structured blueprint
- Ch 7.3 `agent-session-lifecycle` — ephemeral agent execution
- Ch 6.2 `pipeline-context` — Pipeline Context SSOT
- Ch 3.9 `event-bus` — lifecycle events
- Ch 4.23 `consensus-engine` — collective validation

## Golden Rule

A true Multi-Agent system is built on interaction quality, not agent count. Each agent remains independent and communicates only through the unified language of Pipeline.
