# SPEC-104 — Dependency Rules

Allowed dependencies.

```yaml
Research:

  outputs:

    KnowledgeCandidate

Knowledge:

  consumes:

    KnowledgeCandidate

  outputs:

    KnowledgeRule

Decision:

  consumes:

    KnowledgeRule

    Findings

    Constraints

    BrandDNA

    MarketplaceProfile

  outputs:

    DecisionGraph

SceneGraph:

  consumes:

    DecisionGraph

  outputs:

    SceneState

Rendering:

  consumes:

    SceneState

Governance:

  consumes:

    SceneState

Benchmark:

  consumes:

    GovernanceResult

Learning:

  consumes:

    BenchmarkResult
```
