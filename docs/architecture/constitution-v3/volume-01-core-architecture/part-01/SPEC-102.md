# SPEC-102 — Engine Lifecycle

Every engine follows identical lifecycle.

```text
Receive Protocol Object

↓

Validate

↓

Process

↓

Generate Result

↓

Emit Protocol Object

↓

Finish
```

Side effects outside owned domain are forbidden.
