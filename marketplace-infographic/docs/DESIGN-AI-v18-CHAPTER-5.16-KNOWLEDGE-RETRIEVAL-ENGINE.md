# DESIGN AI v18 — Chapter 5.16: Knowledge Retrieval Engine

## Purpose

Knowledge Retrieval Engine intelligently searches, selects, and delivers knowledge from Design Knowledge Engine to all platform agents. It finds only what is needed for the current decision — not the entire knowledge base.

## Design Philosophy

Knowledge quantity does not define system quality. Quality is defined by finding the right knowledge at the right moment. Retrieval optimizes for relevance, not maximum search volume.

## Retrieval Pipeline

1. Agent Request
2. Context Analysis
3. Knowledge Filtering
4. Semantic Search
5. Rule Ranking
6. Conflict Resolution
7. Knowledge Package
8. Agent Delivery

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Context analysis | `analyzeRetrievalContext()` — category, marketplace, style, story, agent, business goal |
| Semantic retrieval | `SEMANTIC_EXPANSIONS` + `computeSemanticMatch()` — meaning not keywords |
| Multi-domain | `AGENT_RETRIEVAL_DOMAINS` — agent-specific domain packages |
| Ranking | `rankKnowledgeItems()` — context, confidence, evidence, success, marketplace, freshness |
| Knowledge package | `retrieveKnowledgePackage()` — max `MAX_PACKAGE_SIZE` (12) items |
| Caching | `CACHEABLE_CATEGORIES` — cosmetics, electronics, kitchen, furniture, tools |
| Conflict resolution | `resolveKnowledgeConflicts()` — delegates to Design Rules Engine |
| Explainability | Each item includes Context Match, Historical Success, Marketplace Compatibility |
| Validation | `validateKnowledgePackage()` — no duplicates, required domains, size limits |

## Golden Rule

Knowledge base value is finding the right knowledge at the right moment — turning a vast library into a precise, fast, explainable tool.

## Implementation

| Module | Role |
|--------|------|
| `knowledge-retrieval-types.ts` | Request, package, retrieval types (distinct from Ch 5.2 `KnowledgeQuery`) |
| `knowledge-retrieval-engine.ts` | Catalog, pipeline, ranking, caching, validation |

## Integration

Indexes knowledge from Ch 5.9–5.15 layers, Ch 5.14 Pattern Library, Ch 5.15 Anti-Pattern Library, Ch 5.5 Marketplace. Uses `retrieveKnowledgePackage` (not Ch 5.2 `queryKnowledge`).

## Failure Conditions

Violated when:

- agent receives full knowledge base;
- search is keyword-only;
- ranking is missing;
- business context is ignored;
- selections are unexplainable.
