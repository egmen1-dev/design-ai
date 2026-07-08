# SPEC-213 — Rule Promotion Policy

A rule becomes Stable only when:

```yaml
Requirements:

  repeated_success:

    true

  benchmark_positive:

    true

  commercial_validation:

    true

  conflicts_resolved:

    true
```

Otherwise it remains Candidate.
