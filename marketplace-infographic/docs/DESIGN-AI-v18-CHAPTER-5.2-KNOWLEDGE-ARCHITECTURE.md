# DESIGN AI v18 — Chapter 5.2: Knowledge Architecture

## Purpose

Knowledge Architecture defines how all Design AI Platform knowledge is organized, structured, stored, and used. It transforms scattered design knowledge into a unified intellectual system accessible to every agent.

## Design Philosophy

Knowledge is not a document, PDF, prompt, or article collection. It is a network of interconnected objects that any agent can use for decisions.

## High-Level Architecture

```
Design Knowledge Engine
├── Marketplace Knowledge
├── Design Knowledge
├── Photography Knowledge
├── Psychology Knowledge
├── Typography Knowledge
├── Color Knowledge
├── Material Knowledge
├── Composition Knowledge
├── Product Knowledge
├── Pattern Library
├── Anti-Pattern Library
└── Learning Knowledge
```

## Knowledge Object

The base unit of the system:

```typescript
interface KnowledgeObject {
  id: string;
  type: string;
  category: string;
  title: string;
  description: string;
  rules: Rule[];
  examples: Example[];
  confidence: number;
  sources: Source[];
  version: number;
  metadata: Metadata;
}
```

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Modular structure | 12 independent modules, unified object format |
| Knowledge hierarchy | Photography → Lighting → Soft → Window → Morning |
| Semantic graph | supports, requires, contradicts, extends, inherits |
| Immutable versioning | publishKnowledgeVersion() — never mutate in place |
| Scoped access | AGENT_KNOWLEDGE_ACCESS — agents get relevant modules only |
| Knowledge API | queryKnowledge(KnowledgeQuery) → KnowledgeResult |
| Consistency | Unified confidence 0..1, metadata, evidence levels |

## Golden Rule

Design Knowledge is not a collection of documents. It is an engineering system of interconnected Knowledge Objects forming a unified knowledge graph.

## Implementation

| Module | Role |
|--------|------|
| `knowledge-architecture-types.ts` | Objects, graph, query, relationships |
| `knowledge-architecture-engine.ts` | Seed graph, API, validation, versioning |

## Integration

Builds on Philosophy of Design Knowledge (Ch 5.1), Agent Memory Knowledge layer (Ch 4.7), and Design Memory (Ch 4.20).

## Failure Conditions

Architecture is violated when:

- knowledge exists only in text documents;
- semantic links are missing;
- versioning is impossible;
- categories use different structures;
- agents receive the full base instead of scoped knowledge.
