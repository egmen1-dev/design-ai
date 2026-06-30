# DESIGN AI v18 — Chapter 7.9: Knowledge Retrieval Agent

## Purpose

Knowledge Retrieval Agent is the only agent with direct access to the Design Knowledge Engine. All other agents receive knowledge exclusively through it.

## Mission

Answer: **"What knowledge is needed right now for the optimal design decision?"** — relevance over volume, never design decisions.

## Module

Implemented as `knowledge-retrieval-agent-*`, extending Ch 6.4 `knowledge-retrieval-stage-*` pipeline stage.

| File | Role |
|------|------|
| `knowledge-retrieval-agent-types.ts` | 7 internal modules, request/package contracts, KPIs |
| `knowledge-retrieval-agent-engine.ts` | Service agent runner, retry, Ch 7.5/7.6 integration |
| `knowledge-retrieval-agent.spec.ts` | Kitchen and validation tests |

## Internal Modules (7)

1. Context Analyzer
2. Knowledge Query Builder
3. Semantic Search
4. Ranking Engine
5. Context Filter
6. Knowledge Validator
7. Knowledge Package Builder

## Service Model

On-demand for every agent that needs knowledge:

```text
Requesting Agent → Knowledge Retrieval Agent → Agent Knowledge Delivery → Requesting Agent
```

## Key APIs

| API | Role |
|-----|------|
| `executeKnowledgeRetrievalAgent()` | Full service execution with modules + retry |
| `buildStoryDirectorKnowledgeRequest()` | Story Director kitchen fixture |
| `expandKnowledgeDomainsForAgent()` | Story Pattern → + Consumer Psychology, Emotional Design |
| `fromStagedKnowledgePackage()` | Spec-compliant KnowledgePackage output |
| `fuseKnowledgeInsights()` | Marketplace rule + pattern + historical stat fusion |
| `validateKnowledgeRetrievalAgentWithExecution()` | Structure + kitchen test |

## Integration

- Ch 6.4 `knowledge-retrieval-stage-engine` — core retrieval implementation
- Ch 5.16 `knowledge-retrieval-engine` — Design Knowledge Engine access
- Ch 7.5 `agent-memory-model` — isolated memory during execution
- Ch 7.6 `agent-professional-decision` — business-focused decision framing

## Golden Rule

The smartest agent is useless without the right knowledge. This agent does not design — it equips every specialist with exactly what they need at this moment.
