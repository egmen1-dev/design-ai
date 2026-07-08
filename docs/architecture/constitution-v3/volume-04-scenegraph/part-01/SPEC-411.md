# SPEC-411 — SceneGraph Invariants

The following invariants are mandatory.

```yaml
Invariants:

  planned_exists_before_render:

    true

  actual_exists_after_render:

    true

  governance_reads_actual:

    true

  overlay_reads_actual:

    true

  benchmark_reads_actual:

    true

  learning_reads_benchmark:

    true
```

Violation of invariants invalidates the generation pipeline.
