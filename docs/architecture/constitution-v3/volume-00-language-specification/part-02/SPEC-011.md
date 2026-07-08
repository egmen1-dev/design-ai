# SPEC-011 — Decision

Only Decision Engine may emit Decision.

Decision represents the single authoritative commercial choice.

```yaml
Decision:

  extends:

    CommonEnvelope

  fields:

    selectedAction

    rejectedAlternatives

    decisionBasis

    confidence

    expectedImpact
```

Decision becomes immutable after publication.
