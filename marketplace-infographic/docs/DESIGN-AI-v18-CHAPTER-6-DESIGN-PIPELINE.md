# DESIGN AI v18 — Chapter 6: Design Pipeline

## Purpose

Design Pipeline defines the full lifecycle of commercial infographic creation in Design AI Platform. It answers how dozens of independent agents collaboratively create one professional image.

## Design Philosophy

Generic AI uses `User → Prompt → LLM → Image`. Design AI uses collective design engineering where each agent owns one domain. Pipeline is not API call sequence — it is collaborative image design.

## High-Level Pipeline

1. Business Goal
2. Product Analysis
3. Knowledge Retrieval
4. Visual Story Planning
5. Scene Planning
6. Composition Planning
7. Photography Planning
8. Blueprint Assembly
9. Consensus Validation
10. Render Adapter
11. Render Provider
12. Vision Analysis
13. Commercial Validation
14. Chief Design Review
15. Retry (optional)
16. Approved Blueprint
17. Knowledge Learning

## Pipeline Layers

| Layer | Stages |
|-------|--------|
| Input | Business Goal, Product Analysis |
| Knowledge | Knowledge Retrieval |
| Creative | Story, Scene, Composition, Photography |
| Technical | Blueprint Assembly |
| Rendering | Render Adapter, Render Provider |
| Validation | Consensus, Vision, Commercial, Chief Review, Retry, Approved |
| Learning | Knowledge Learning |

## Pipeline Principles

- Fully deterministic
- Each stage has its own contract
- Each agent owns only its decision
- Blueprint is incrementally extended, not rewritten
- Each stage can retry independently
- One stage failure must not break others

## Pipeline Responsibility

Pipeline handles: execution order, context transfer, dependencies, validation launch, retry management, completion.

Pipeline never makes design decisions — agents do.

## Input / Output

**Input:** product image, category, marketplace, brand, audience, business goal, constraints — not prompt.

**Output:** Render Blueprint, render prompt, image, Vision Report, Commercial Report, Learning Package, Design Memory update.

## Golden Rule

Pipeline does not create images. It organizes specialists that transform a business goal into professional commercial infographic.

## Implementation

| Module | Role |
|--------|------|
| `design-pipeline-types.ts` | Stages, layers, input/output contracts |
| `design-pipeline-engine.ts` | Pipeline definition, validation, execution |

## Integration

- Ch 5.16 `retrieveKnowledgePackage()` — Knowledge Retrieval stage
- Ch 5.19 `runKnowledgeLearningPipeline()` — Knowledge Learning stage
- Ch 4 Agent Ecosystem — agent ownership per stage
- Ch 3.4 Lifecycle Manager — orchestration patterns
