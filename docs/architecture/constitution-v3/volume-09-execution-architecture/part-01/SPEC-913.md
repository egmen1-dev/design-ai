# SPEC-913 — Actual Geometry Priority

When

```yaml
SceneGraph.actual exists
```

every downstream module SHALL consume

```yaml
SceneGraph.actual
```

Fallback order

```text
Actual

↓

Measured Composite

↓

Detected Bounds

↓

Planned
```

No module SHALL bypass this priority.
