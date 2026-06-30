# DESIGN AI v18 — Chapter 5.18: Knowledge Versioning

## Purpose

Knowledge Versioning manages the lifecycle of all knowledge used by Design AI Platform — rules, patterns, anti-patterns, and marketplace profiles — with full change history, compatibility control, and reproducibility.

## Design Philosophy

Knowledge evolves continuously but must not break working systems. Design AI evolves incrementally, not by replacing old knowledge with new.

## Versioning Principles

1. Immutable published versions
2. Complete change history
3. Backward compatibility
4. Result reproducibility
5. Safe rollback

## Version Lifecycle

```
Draft → Validation → Testing → Approved → Deprecated → Archived
```

Only `Approved` versions are used by agents (unless project-pinned or experimental mode enabled).

## Key Behaviors

| Behavior | Implementation |
|----------|----------------|
| Immutable knowledge | `assertImmutablePublishedVersion()` — published versions never mutate in place |
| Semantic versioning | `parseSemanticVersion()`, `bumpSemanticVersion()`, `compareSemanticVersions()` |
| Compatibility | `analyzeVersionCompatibility()` — compatible / partially_compatible / breaking_change |
| State transitions | `transitionVersionState()`, `canTransitionVersionState()` |
| Draft creation | `createKnowledgeVersionDraft()` — new version from latest approved |
| Dependency tracking | `validateDependencyVersions()` |
| Publish gate | `validateVersionForPublication()` — integrates Ch 5.17 validation, simulation, regression |
| Publication | `releaseKnowledgeVersion()` — immutable approved release with audit |
| Rollback | `rollbackKnowledgeVersion()` — preserves history and test results |
| Snapshots | `createKnowledgeSnapshot()`, `validateKnowledgeSnapshot()` — project reproducibility |
| Version selection | `selectKnowledgeVersion()` — retrieval-aware version pick |
| Audit trail | `recordAuditEntry()` |
| Catalog | `buildKnowledgeVersionCatalog()` — seeds from Ch 5.17 validatable catalog + lighting v1–v3 chain |

## Golden Rule

Knowledge becomes valuable because every change is controlled, verified, documented, and can be safely undone.

## Implementation

| Module | Role |
|--------|------|
| `knowledge-versioning-types.ts` | `KnowledgeVersion` contract, states, compatibility, snapshots |
| `knowledge-versioning-engine.ts` | Lifecycle, semver, rollback, selection, audit |

## Integration

- Builds on Ch 5.17 `buildValidatableKnowledgeCatalog()` and `runKnowledgeValidationPipeline()`
- Feeds Ch 5.16 retrieval via `selectKnowledgeVersion()`
- Lighting rule demonstrates v1 (archived) → v2 (deprecated) → v3 (approved) chain

## Failure Conditions

Violated when:

- knowledge changes without history;
- old generations cannot be reproduced;
- rollback is unavailable;
- new versions break dependencies;
- change provenance is unknown.
