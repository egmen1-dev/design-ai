# DAOS Wave 37 — Feature Flag Registry (RFC-2800)

## Created files

- `marketplace-infographic/src/lib/daos/feature-flag-registry/feature-flag-registry.ts`
- `marketplace-infographic/src/lib/daos/feature-flag-registry/index.ts`
- `marketplace-infographic/src/lib/daos/feature-flag-registry/feature-flag-registry.spec.ts`

## Modified files

- `marketplace-infographic/scripts/run-specs.sh` (adds the new Wave 37 spec to the suite)

## Architecture impact

- Introduces one canonical **Runtime Feature Flag Registry** module.
- Adds a runtime lifecycle metadata model (Draft → Shadow → Canary → Production → Deprecated → Removed).
- Adds diagnostics for:
  - registered flags
  - duplicates
  - unknown runtime flags (env keys present but not discovered/registered)
  - validation issues (missing owner / missing lifecycle / invalid defaults / unknown lifecycle)

No runtime behavior (flag gating) is changed in Wave 37: the registry is additive and does not replace legacy `process.env` behavior.

## Compliance Delta

- **V-010 Feature Flag Governance**
  - Status after: **PARTIAL**
  - Reason: Wave 37 introduces registry-backed visibility (ownership + lifecycle metadata + diagnostics), but does not yet fully close feature flag governance because:
    - lifecycle is metadata-only (no retirement/rollout enforcement)
    - consumers are empty for discovery-only mode
    - plannedRemovalWave remains unassigned for every discovered flag
    - CI/enforcement for unmanaged new flags is not yet active
    - legacy `process.env` behavior remains the runtime source of truth in this wave
    - the registry is not yet consumed by Wave 38 / future rollout gates

## Architecture Health Delta

- **Feature Flag Governance Health**
  - Before: 2/10
  - After: 6/10
  - Delta: +4
- **Global Architecture Health**
  - Not recalculated in Wave 37.
  - (This estimate applies only to the feature-flag governance subdomain.)

## Technical Debt Delta

- Discovery scans repository directories for `DAOS_*` usage patterns and populates the in-memory registry.
- Lifecycle metadata is implemented for governance and diagnostics, but lifecycle state is not used to gate runtime behavior in Wave 37 (per scope).

## Tests
- feature-flag-registry spec:
  - ✅ `cd marketplace-infographic && npx tsx src/lib/daos/feature-flag-registry/feature-flag-registry.spec.ts`
- scripts/run-specs:
  - ✅ `cd marketplace-infographic && bash scripts/run-specs.sh`
- lint:
  - ✅ `cd marketplace-infographic && npm run lint`
- typecheck:
  - ❌ `cd marketplace-infographic && npx tsc --noEmit` (FAIL; pre-existing repository errors not attributable to Wave 37)
- daos:test:
  - NOT AVAILABLE (no such script/command in this repo’s current scripts)
- daos:spec:
  - NOT AVAILABLE (no such script/command in this repo’s current scripts)

## Compatibility

- Legacy `process.env` behavior remains unchanged:
  - The registry reads `process.env` values but does not write to `process.env`.
  - The registry is not integrated into existing generation/render logic in Wave 37.
- A targeted spec verifies legacy env compatibility:
  - when `process.env.DAOS_PROMPT_CONTEXT` is set, `Resolve("DAOS_PROMPT_CONTEXT")` returns the same value.

## Diagnostics — discovered & registered DAOS flags

Discovery discovers the following DAOS flags and registers them as runtime objects:

- `DAOS_PROMPT_CONTEXT`
- `DAOS_RENDER_CONTEXT`
- `DAOS_SCENE_GRAPH_V2_PLANNED_ENV`
- `DAOS_SCENE_GRAPH_V2_GATED_ENV`
- `DAOS_SCENE_GRAPH_V2_ACTUAL_ENV`
- `DAOS_V17_PROMPT_BRIDGE`
- `DAOS_V17_MODULES_BRIDGE`
- `DAOS_V17_CTR_BRIDGE`

Flag discovery vs unknown flags semantics are distinct:

- repository discovery:
  - static/source usage detection performed by the registry scan
- `unknownFlags`:
  - runtime environment key detection: `DAOS_*` env keys present at runtime but not discovered/registered are reported under `unknownFlags`

In the compatibility diagnostic run, `unknownFlags` was empty.

## Known limitations

- Discovery is currently scoped to repository patterns in:
  - `marketplace-infographic/tmp`
  - `docs`
- If future DAOS runtime flags are referenced outside these scopes, they may not be discovered automatically until the discovery scope expands.
- Lifecycle is metadata-only in Wave 37 and does not gate runtime behavior.
- Consumer mapping is not yet complete:
  - Wave 37 discovers and registers runtime DAOS `env` flags, but does not yet map all concrete source-level consumers.
  - Consumer mapping is deferred to future registry enforcement / Object Registry integration waves.
  - Full lifecycle governance is therefore not claimed until consumers and enforcement gates are mapped.

## Exit Criteria verification
- PARTIAL PASS:
  - ✅ Wave 37 establishes the registry and discovery diagnostics to make unmanaged `DAOS_*` flags detectable.
  - ✅ Registry exists and is test-covered.
  - ✅ Unmanaged runtime env flags are detectable via `unknownFlags`.
  - ✅ Enforcement gating is not yet mandatory in Wave 37; this is deferred to a future CI / Object Registry integration wave.
  - ✅ No render/benchmark/handler refactoring/public API changes were made in Wave 37.
  - ✅ Unknown env flags are surfaced as diagnostics.

## Council Questions

1. Should Wave 38 start *consuming* the registry to replace direct `process.env` reads in the runtime paths that actually interpret DAOS flags?
2. Should discovery scope be expanded beyond `tmp/` and `docs/` to reduce the chance of missing flags referenced elsewhere?

## Next Wave

- Wave 38: Consume this Feature Flag Registry as the runtime source of truth for DAOS flags (while preserving legacy `process.env` compatibility).
- Optionally, tighten ownership mapping from heuristics to explicit governance-owned metadata once ownership sources are finalized.

---
## Planned removal / review policy (Wave 37 discovery-only metadata)

Wave 37 does not yet assign `plannedRemovalWave` for any discovered `DAOS_*` flag.

To avoid leaving all flags with `plannedRemovalWave: null` without explanation, Wave 37 records the following review markers in this report:

### 1) Long-lived production capability flags
- `DAOS_PROMPT_CONTEXT`
- `DAOS_RENDER_CONTEXT`
- `DAOS_SCENE_GRAPH_V2_PLANNED_ENV`
- `DAOS_SCENE_GRAPH_V2_GATED_ENV`
- `DAOS_SCENE_GRAPH_V2_ACTUAL_ENV`

plannedRemovalWave: null  
reviewRequired: true  
reviewReason: "Wave 37 discovery-only registration; retirement wave must be assigned during Feature Flag Registry enforcement / lifecycle retirement phase."

### 2) Bridge / compatibility flags (legacy runtime compatibility)
- `DAOS_V17_CTR_BRIDGE`
- `DAOS_V17_MODULES_BRIDGE`
- `DAOS_V17_PROMPT_BRIDGE`

category: Compatibility or Migration  
plannedRemovalWave: null  
reviewRequired: true  
reviewReason: "Legacy bridge flag discovered in Wave 37; retirement decision deferred to bridge/adapters migration enforcement phase."

### 3) Consumers

For all flags above, `consumers` is currently empty in Wave 37 discovery mode.
This is acceptable for Wave 37, but enforcement and lifecycle governance are deferred until consumer mapping is implemented in a future wave.


