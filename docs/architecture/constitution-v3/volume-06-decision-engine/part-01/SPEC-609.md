# SPEC-609 — Decision Output Contract

Decision Engine exports exactly one object.

```yaml
Output:

  DecisionGraph
```

No additional commercial reasoning objects may be emitted downstream.

All subsequent subsystems consume DecisionGraph as the sole commercial authority.
