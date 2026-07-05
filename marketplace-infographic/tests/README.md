# Tests

Canonical test layout per Architecture Bible Part 27.

```
tests/
├── unit/
├── integration/
├── architecture/
├── golden/
├── performance/
└── marketplace/
```

> **Current:** many specs live alongside source (`*.spec.ts`). Migration to `tests/` is incremental per REP-002.

## Related

- Part 16 — Architecture Validation & CI
- Part 19 — Wave completion gates
- `scripts/run-design-ai-book-audit.sh` — full audit (219 tests)
