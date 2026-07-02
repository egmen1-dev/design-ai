# Design AI — Restoration Status

Updated: 2026-07-02  
Branch: `cursor/project-restore-0e50`

## What was restored

| Component | Status |
|-----------|--------|
| Ch 3–7 v18 render-blueprint | 120/120 specs — full |
| Ch 8 Design Knowledge Platform | 27 sections — registry + runner |
| Ch 9 Intelligent Orchestration | 19 sections — registry + runner |
| Ch 10 Human AI Collaboration | 15 sections — registry + runner |
| Ch 11 Commercial Intelligence | 20 sections — **all engines runnable** |
| Hung-agent stash (21 files) | Merged into `src/lib/` |
| Hung-agent design-ai-os logic | Ported to `ecosystem-engine-runners.ts` |
| Unified book pipeline | `src/lib/design-ai-book/pipeline.ts` |
| Full project archive | `docs/full-project-archive/` |

## Test suite

```bash
./scripts/run-design-ai-book-audit.sh   # 219 tests (120 v18 + 99 platform)
```

## Canonical structure

```
Ch 1–2   docs + types (philosophy, blueprint schema)
Ch 3–7   src/lib/render-blueprint/
Ch 8     src/lib/design-knowledge-platform/
Ch 9     src/lib/intelligent-orchestration-platform/
Ch 10    src/lib/human-ai-collaboration/
Ch 11    src/lib/commercial-intelligence-platform/
Book     src/lib/design-ai-book/
```

## Not merged (intentionally)

- `docs/archive/deprecated-design-ai-os/` — wrong chapter taxonomy
- `index-stash` snapshot (ch6.13) — older than current; forensic use only
- Production handler — still v17.1 on `main`; book code is feature-branch

## Next steps (optional)

1. Wire `runDesignAiBookPipeline()` behind feature flag in handler
2. Implement Ch 8–10 section engines beyond registry
3. Merge `cursor/project-restore-0e50` → integration branch
