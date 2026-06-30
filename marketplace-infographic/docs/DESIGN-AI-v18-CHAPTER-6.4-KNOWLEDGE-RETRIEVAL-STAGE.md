# DESIGN AI v18 — Chapter 6.4: Knowledge Retrieval Stage

## Purpose

Knowledge Retrieval Stage intelligently loads all knowledge required for the current generation. After Product Analysis forms complete product understanding, this stage determines **which knowledge** is needed for image design — not the entire knowledge base.

Bridge between Product Analysis and Agent Ecosystem.

## Design Philosophy

**Maximum Relevance, Minimum Context** — agents receive only knowledge that truly relates to the current project.

## Responsibilities

| Responsibility | Implementation |
|----------------|----------------|
| Analyze Product Profile | `runKnowledgeRetrievalStage()` input |
| Build Knowledge Query | `buildPipelineKnowledgeQueryFromProfile()` — `PipelineKnowledgeQuery`, no prompt |
| Domain selection | `selectKnowledgeDomainsForProfile()` |
| Semantic search | Ch 5.16 `retrieveKnowledgePackage()` + `buildSemanticQueryFromProfile()` |
| Context filtering | `filterKnowledgeByMarketplaceContext()` |
| Ranking | `buildStagedDesignRules()` — context match, confidence, marketplace, historical success |
| Pattern retrieval | `retrievePatternsForStage()` — top scored patterns only |
| Anti-pattern retrieval | `retrieveAntiPatternsForStage()` — preemptive warnings |
| Package assembly | `assembleStagedKnowledgePackage()` — `StagedKnowledgePackage` |
| Consistency | conflicts delegated to Design Rules Engine via Ch 5.16 |
| Agent delivery | `enrichPipelineContextWithKnowledgeRetrieval()` |

Retrieval Stage **never mutates** knowledge — only selects.

## Staged Knowledge Package

Structured slices: marketplace, style, composition, photography, psychology, consumer, typography, color, patterns, antiPatterns, rules.

## Pipeline Micro-Stages

`KNOWLEDGE_RETRIEVAL_STAGE_PIPELINE` — 12 stages from profile analysis to agent delivery.

## Integration

- Ch 6.3 `AnalyzedProductProfile` — stage input
- Ch 5.16 `retrieveKnowledgePackage()` — retrieval engine
- Ch 5.14 `recommendDesignPatterns()` — pattern scores
- Ch 5.15 anti-pattern library — warnings
- Ch 6.2 `PipelineContextSection.KNOWLEDGE` — shared package
- Ch 6 `executeDesignPipelineStage(KNOWLEDGE_RETRIEVAL)` — pipeline gate

## Golden Rule

Knowledge is valuable when the right knowledge reaches the right agent at the right moment.

## Failure Conditions

Violated when full base leaks, agents get different rule versions, marketplace ignored, ranking absent, or package contains unresolved contradictions.
