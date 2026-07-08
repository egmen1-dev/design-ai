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

- **Closes V-010 Feature Flag Governance**
  - Flags are now represented as registered objects with lifecycle metadata, ownership, and validation diagnostics.
  - Diagnostics are additive and validation is non-terminating.

## Architecture Health Delta

- Reduces architectural entropy by providing a single canonical registry boundary for runtime DAOS flags.
- Improves explainability by attaching owner and lifecycle metadata to runtime flags.

## Technical Debt Delta

- Discovery scans repository directories for `DAOS_*` usage patterns and populates the in-memory registry.
- Lifecycle metadata is implemented for governance and diagnostics, but lifecycle state is not used to gate runtime behavior in Wave 37 (per scope).

## Tests

- ✅ `cd marketplace-infographic && npx tsx src/lib/daos/feature-flag-registry/feature-flag-registry.spec.ts`
- ✅ `cd marketplace-infographic && bash scripts/run-specs.sh`

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

If a runtime env key with `DAOS_` prefix is present but not discovered/registered, diagnostics report it under `unknownFlags`.

## Known limitations

- Discovery is currently scoped to repository patterns in:
  - `marketplace-infographic/tmp`
  - `docs`
- If future DAOS runtime flags are referenced outside these scopes, they may not be discovered automatically until the discovery scope expands.
- Lifecycle is metadata-only in Wave 37 and does not gate runtime behavior.

## Exit Criteria verification

- ✅ Every discovered `DAOS_*` runtime env flag becomes a registered object (listed above).
- ✅ No runtime behavior changes were introduced (registry is additive only).
- ✅ No render/benchmark/handler refactoring/public API changes were made.
- ✅ Registry diagnostics and validation issues work and do not terminate runtime.
- ✅ Unknown env flags are surfaced as diagnostics.

## Council Questions

1. Should Wave 38 start *consuming* the registry to replace direct `process.env` reads in the runtime paths that actually interpret DAOS flags?
2. Should discovery scope be expanded beyond `tmp/` and `docs/` to reduce the chance of missing flags referenced elsewhere?

## Next Wave

- Wave 38: Consume this Feature Flag Registry as the runtime source of truth for DAOS flags (while preserving legacy `process.env` compatibility).
- Optionally, tighten ownership mapping from heuristics to explicit governance-owned metadata once ownership sources are finalized.

