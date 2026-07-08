# Wave 38A — Foundation Object Registry (RFC-2700)

## Engineering Implementation Specification

| Field | Value |
|-------|-------|
| **Wave** | 38A |
| **RFC** | RFC-2700 — Canonical Object Registry |
| **Constitution** | Volume 27 — Canonical Object Registry |
| **Status** | Engineering specification (design only) |
| **Layer** | Foundation / Object Governance |
| **Normative** | Mandatory for Wave 38B implementation |
| **Primary violation** | **V-011 — Object Registry** |
| **Depends on** | Wave 35 (Metric Registry), Wave 36 (GenerationContext), Wave 37 (Feature Flag Registry) |
| **Scope** | Foundation runtime objects only |

**Frozen references (not extended by this spec):**

- RFC-2700 through RFC-2710 (Volume 27)
- SPEC-2700 through SPEC-2705 (Volume 27)
- RFC-2500 (GenerationContext), RFC-2600 (Metric Registry), RFC-2800 (Feature Flag Registry)

**Explicitly excluded from this specification:**

CommercialGenome, KnowledgeRule, KnowledgeCandidate, ResolvedKnowledgeSet, DecisionGraph, SceneGraph, RenderBlueprint, Benchmark, Research, Learning.

---

## 1. Objective

Design the Foundation Object Registry as the **canonical directory** for foundation runtime objects.

The registry SHALL:

- Own **metadata and identity** only.
- Describe runtime objects that already exist as producer-owned implementations.

The registry SHALL NOT:

- Become an object database.
- Own runtime state.
- Store or serialize object instances.
- Replace producers or consumers.

Wave 38B (implementation) realizes this specification and closes **V-011 — Object Registry** for the foundation layer by registering exactly three object types under Volume 27 governance rules.

> **Wave naming:** Wave 38A = this specification. Wave 38B = implementation. Implementation report: `docs/DAOS_WAVE_38_FOUNDATION_OBJECT_REGISTRY_REPORT.md`.

---

## 2. Runtime Object — Formal Definition

### 2.1 What is a Runtime Object?

A **Runtime Object** is an architectural entity that exists in the DAOS foundation runtime as a typed, governed artifact produced and consumed by named subsystems. The Foundation Object Registry does not create Runtime Objects; it registers **definitions** that describe them.

### 2.2 Registration eligibility

An entity SHALL be registered in the Foundation Object Registry **only if** it satisfies **all** of the following requirements:

| Requirement | Meaning |
|-------------|---------|
| **Stable identity** | A permanent `ObjectId` that does not change across schema revisions |
| **Single owner** | Exactly one owning subsystem responsible for the object type (SPEC-2700) |
| **Producer** | A named module or function that creates instances or definitions at runtime |
| **Lifecycle** | A declared lifecycle model (type-level and/or instance-level) |
| **Schema version** | A semantic version identifying the payload schema |
| **Validation rules** | Explicit rules that instances or definitions must satisfy |
| **Diagnostics** | Declared diagnostic keys observable at runtime |
| **Consumers** | At least one declared consumer, or an explicit `consumers: []` with documented deferred mapping |

If an entity does not satisfy **all** eight requirements, it **SHALL NOT** be registered.

### 2.3 Runtime Object vs Registry Record

| Concept | Owner | Mutable at runtime? | Stored in registry? |
|---------|-------|---------------------|---------------------|
| **Runtime Object instance** | Producer module | Per object mutability rules | **No** |
| **Runtime Object definition** | Foundation Object Registry | **No** (immutable once registered) | **Yes** |
| **Registry metadata** | Foundation Object Registry | **No** after bootstrap | **Yes** |

Examples:

- A `GenerationContext` **instance** built by `buildGenerationContext()` is a Runtime Object instance. It is **not** stored in the registry.
- The `GenerationContext` **definition** (`FOUNDATION.GENERATION_CONTEXT`) is a registry record describing identity, owner, producer, schema, and relationships.

### 2.4 Phase 1 registered Runtime Object types

Only these three types satisfy all eight requirements in Wave 38B:

| ObjectType | Wave introduced | Producer module |
|------------|-----------------|-----------------|
| `GenerationContext` | 36 | `daos/generation-context/` |
| `MetricValue` | 35 | `daos/metric-registry/` |
| `FeatureFlag` | 37 | `daos/feature-flag-registry/` |

---

## 3. Registry Principles

### 3.1 Canonical directory

The Foundation Object Registry is a **canonical directory** of foundation object definitions. It is the single lookup surface for:

- Who owns an object type.
- Which module produces it.
- Which schema version is current.
- Which subsystems consume it.
- What dependencies exist between foundation objects.

### 3.2 No runtime state

The registry **SHALL NOT** store:

- Object instances (`GenerationContext` payloads, computed `MetricValue` numbers, env flag current values).
- Session state, caches, or computed results.
- Serialized snapshots or debug bundle contents.

Current values (e.g. `process.env.DAOS_*`) remain in their existing resolution paths. The registry may **reference** that a producer reads env; it does not **hold** env values as registry state.

### 3.3 Describe, not replace

The registry **SHALL describe** runtime objects. It **SHALL NOT replace** them.

| Runtime object | Producer remains authoritative for |
|----------------|-----------------------------------|
| `GenerationContext` | `buildGenerationContext()`, freeze, snapshot |
| `MetricValue` | `MetricRegistry.compute()` |
| `FeatureFlag` | `createRuntimeFeatureFlagRegistry()`, `Resolve()` |

### 3.4 Read-only after bootstrap

After initialization, registry records are immutable. Updates occur only by registering a **new schema version** as a separate definition record (see Section 10).

### 3.5 Foundation-only scope

The registry SHALL NOT register commercial, graph, render, benchmark, research, or learning object types in Wave 38B.

---

## 4. Registry Responsibilities

### 4.1 The registry SHALL

| Responsibility | Description |
|----------------|-------------|
| Register object definitions | Accept bootstrap definitions for eligible foundation types |
| Validate definitions | Enforce Section 7 rules; emit diagnostics only |
| Validate ownership | Ensure exactly one owner per `ObjectId` + `SchemaVersion` |
| Validate versions | Ensure semver format; reject duplicate `(ObjectId, SchemaVersion)` pairs |
| Provide lookup | `Lookup`, `LookupById`, `List`, `ListVersions` |
| Provide diagnostics | Aggregated health and validation report |
| Provide dependency information | Expose producer → object → consumer graph |

### 4.2 The registry SHALL NOT

| Prohibition | Rationale |
|-------------|-----------|
| Own object instances | Instances belong to producers |
| Mutate runtime objects | No write path to producer state |
| Serialize runtime state | Debug bundle attachment is producer responsibility |
| Replace producers | Build/compute/resolve stay in Wave 35/36/37 modules |
| Replace consumers | Consumer modules call producers directly |
| Register ineligible entities | Eight-requirement gate (Section 2.2) |
| Register excluded types | Section 1 exclusion list |

---

## 5. Object Definition

Every registered foundation object **SHALL** define the following fields in its registry record.

### 5.1 Field schema

```yaml
ObjectId: string          # Stable canonical ID, e.g. FOUNDATION.GENERATION_CONTEXT
ObjectName: string        # Human name, e.g. GenerationContext
ObjectType: enum          # GenerationContext | MetricValue | FeatureFlag
Description: string       # Single responsibility statement (SPEC-2701)
Owner: string             # Exactly one owner subsystem
Producer: string          # Module path or fully-qualified producer identifier
Consumers: string[]       # Declared consumer module paths (may be empty with Notes)
Lifecycle: LifecycleSpec  # Type-level lifecycle state and allowed transitions
SchemaVersion: string     # Semver, e.g. 1.0.0
Dependencies: string[]    # ObjectIds or external refs (e.g. process.env)
ValidationRules: Rule[]   # Machine- and human-readable rules
Diagnostics: string[]     # Diagnostic keys this object type contributes
Notes: string             # Governance notes, deferred items, wave provenance
```

### 5.2 Field constraints

| Field | Constraint |
|-------|------------|
| `ObjectId` | MUST start with `FOUNDATION.`; MUST be unique per logical object |
| `ObjectName` | MUST match `ObjectType` for Phase 1 types |
| `ObjectType` | MUST be one of the three allowed types |
| `Description` | MUST be non-empty; MUST describe one responsibility only |
| `Owner` | MUST be non-empty; MUST NOT list multiple owners |
| `Producer` | MUST resolve to existing module under `daos/` |
| `Consumers` | Each entry MUST be a module path; empty array requires Notes justification |
| `Lifecycle` | MUST include current type-level state |
| `SchemaVersion` | MUST be valid semver |
| `Dependencies` | MUST NOT create cycles within foundation graph |
| `ValidationRules` | MUST be non-empty array |
| `Diagnostics` | MUST be non-empty array |
| `Notes` | MAY be empty |

### 5.3 Lifecycle specification shape

```yaml
Lifecycle:
  currentState: Initialized | Active | Deprecated | Archived
  allowedTransitions:
    - from: Initialized
      to: Active
    - from: Active
      to: Deprecated
    - from: Deprecated
      to: Archived
  instanceMutability: Immutable | AppendOnly | Mutable
```

Phase 1 bootstrap values:

| ObjectType | currentState | instanceMutability |
|------------|--------------|-------------------|
| `GenerationContext` | `Active` | `Immutable` |
| `MetricValue` | `Active` | `Immutable` |
| `FeatureFlag` | `Active` | `Immutable` (definition); env value resolved at runtime by producer |

---

## 6. Registered Object Definitions (Wave 38B bootstrap)

### 6.1 GenerationContext

```yaml
ObjectId: FOUNDATION.GENERATION_CONTEXT
ObjectName: GenerationContext
ObjectType: GenerationContext
Description: >
  Immutable single source of truth for one commercial generation run,
  capturing product, marketplace, mode, assets, constraints, and provider context.
Owner: GenerationContext
Producer: marketplace-infographic/src/lib/daos/generation-context/build-generation-context.ts
Consumers:
  - marketplace-infographic/src/lib/daos/debug/daos-debug-bundle.ts
Lifecycle:
  currentState: Active
  instanceMutability: Immutable
SchemaVersion: 1.0.0
Dependencies:
  - FOUNDATION.FEATURE_FLAG
  - marketplace-infographic/src/lib/daos/config/generation-mode.ts
ValidationRules:
  - metadata.generationId, projectId, runId REQUIRED when instance exists
  - schemaVersion MUST match registered SchemaVersion
  - instance MUST be deep-frozen after build
  - completenessScore and missingFields diagnostics MUST be computable
Diagnostics:
  - generationContextRegistered
  - generationContextSchemaVersion
  - generationContextProducerPath
  - generationContextCreated
  - generationContextCompleteness
  - generationContextMissingFields
Notes: >
  Wave 36 producer. Instance creation gated by DAOS_GENERATION_CONTEXT.
  Consumer mapping for downstream subsystems deferred; debug bundle is Phase 1 consumer.
```

### 6.2 MetricValue

```yaml
ObjectId: FOUNDATION.METRIC_VALUE
ObjectName: MetricValue
ObjectType: MetricValue
Description: >
  Immutable computed metric result emitted by the Metric Registry;
  carries value, unit, provenance, and formula version for a single computation.
Owner: Metric Registry
Producer: marketplace-infographic/src/lib/daos/metric-registry/metric-registry.ts
Consumers:
  - marketplace-infographic/src/lib/scene-graph/SceneGraphLaw003V2.ts
  - marketplace-infographic/src/lib/scene-graph/SceneGraphConstitutionMirror.ts
Lifecycle:
  currentState: Active
  instanceMutability: Immutable
SchemaVersion: 1.0.0
Dependencies:
  - FOUNDATION.FEATURE_FLAG
ValidationRules:
  - metricId MUST be in registered metric catalog
  - value MUST be finite number
  - owner MUST match registration Owner
  - formulaVersion MUST match catalog entry
  - createdAt MUST be ISO-8601
Diagnostics:
  - metricValueTypeRegistered
  - registeredMetricIds
  - metricRegistryDelegationActive
  - lastMetricShadowDiagnostic
Notes: >
  Wave 35 producer. Pilot metric METRIC_PRODUCT_AREA_RATIO only.
  Product geometry metric domain owner: SceneGraph.
  Delegation gated by DAOS_METRIC_REGISTRY; shadow by DAOS_METRIC_REGISTRY_SHADOW.
```

### 6.3 FeatureFlag

```yaml
ObjectId: FOUNDATION.FEATURE_FLAG
ObjectName: FeatureFlag
ObjectType: FeatureFlag
Description: >
  Governed runtime feature flag definition for DAOS_* environment keys;
  carries ownership, lifecycle metadata, and resolution defaults.
Owner: Feature Flag Registry
Producer: marketplace-infographic/src/lib/daos/feature-flag-registry/feature-flag-registry.ts
Consumers: []
Lifecycle:
  currentState: Active
  instanceMutability: Immutable
SchemaVersion: 1.0.0
Dependencies:
  - process.env (read-only, external)
ValidationRules:
  - FlagId MUST match ^DAOS_[A-Z0-9_]+$
  - Owner MUST be non-empty per flag definition
  - LifecycleState MUST be valid enum
  - DefaultValue MUST be non-empty string
  - registry MUST NOT write to process.env
Diagnostics:
  - featureFlagTypeRegistered
  - delegatedRegistryVersion
  - foundationFlagCount
  - discovery.discoveredFlagCount
  - registered.flagCount
  - unknownFlags.unknownFlagIds
  - validationIssues
Notes: >
  Wave 37 producer. Lifecycle governance owner: Platform Governance.
  Consumers empty at type level in Wave 38B bootstrap;
  per-flag consumers populated by owner via delegated registry in implementation.
  Type-level registration wraps delegated FeatureFlagRegistry.
```

---

## 7. Registration Rules

### 7.1 Owner-only registration

Only the declared **Owner** subsystem may submit or authorize registration of an object definition.

| ObjectType | Registering authority |
|------------|----------------------|
| `GenerationContext` | GenerationContext |
| `MetricValue` | Metric Registry |
| `FeatureFlag` | Feature Flag Registry |

Consumers **SHALL NOT** register object definitions. Consumer modules are listed in `Consumers` only.

### 7.2 Bootstrap registration

Wave 38B uses **static bootstrap** at registry initialization:

1. Feature Flag Registry registers `FOUNDATION.FEATURE_FLAG` @ `1.0.0`
2. Metric Registry registers `FOUNDATION.METRIC_VALUE` @ `1.0.0`
3. GenerationContext registers `FOUNDATION.GENERATION_CONTEXT` @ `1.0.0`
4. Registry validates dependency order (`FEATURE_FLAG` before dependents)
5. Registry freezes — no runtime `Register()` after bootstrap in default mode

### 7.3 Duplicate registration

Duplicate registration **SHALL fail validation**:

- Same `ObjectId` + `SchemaVersion` registered twice → `DUPLICATE_SCHEMA_VERSION`
- Same `ObjectId` with conflicting `ObjectType` → `DUPLICATE_OBJECT_ID`

Failed duplicates are recorded in diagnostics. They **SHALL NOT** overwrite existing records.

### 7.4 No object replacement

Object replacement is **prohibited**. A registered definition for `(ObjectId, SchemaVersion)` is immutable forever.

To evolve an object, the owner registers a **new** `SchemaVersion` under the same `ObjectId`. The old version remains visible via `ListVersions(ObjectId)`.

### 7.5 New schema versions only

The only permitted change to the catalog is **additive registration** of a new `(ObjectId, SchemaVersion)` pair authorized by the owner. Editing fields of an existing version is forbidden.

---

## 8. Validation Rules

Validation **SHALL produce diagnostics only**. It **SHALL NOT** throw, block production requests, or mutate runtime state in Wave 38B default mode.

### 8.1 Validation codes

| Code | Condition | Severity |
|------|-----------|----------|
| `DUPLICATE_OBJECT_ID` | Two records share `ObjectId` with incompatible `ObjectType` | Error |
| `DUPLICATE_SCHEMA_VERSION` | Two records share `(ObjectId, SchemaVersion)` | Error |
| `MISSING_OWNER` | `Owner` empty or whitespace | Error |
| `MISSING_PRODUCER` | `Producer` empty or module not found | Error |
| `MISSING_LIFECYCLE` | `Lifecycle` absent or `currentState` missing | Error |
| `MISSING_DESCRIPTION` | `Description` empty or fewer than 10 characters | Error |
| `MISSING_VERSION` | `SchemaVersion` absent | Error |
| `INVALID_VERSION` | `SchemaVersion` not valid semver | Error |
| `INVALID_DEPENDENCY` | `Dependencies` references unknown `ObjectId` or creates cycle | Error |
| `UNKNOWN_OBJECT_TYPE` | `ObjectType` not in Phase 1 allowlist | Error |
| `INCOMPLETE_CONSUMERS` | `Consumers` empty without Notes justification | Warning |
| `PRODUCER_UNREACHABLE` | Producer module export missing | Error |

### 8.2 Validation execution points

| When | Action |
|------|--------|
| Bootstrap | Validate each definition before freeze |
| `Validate()` | Re-run all rules; return diagnostics |
| Future CI | Fail build on Error severity (specified, not implemented here) |

### 8.3 Eight-requirement gate

Before accepting a definition, the registry **SHALL** verify all eight Runtime Object requirements (Section 2.2). Failure of any requirement → `REGISTRATION_INELIGIBLE` (Error).

---

## 9. Diagnostics

### 9.1 Registry API

`Diagnostics()` **SHALL** return:

```typescript
type FoundationObjectRegistryDiagnostics = {
  registrySchemaVersion: number;
  bootstrapComplete: boolean;
  foundationRegistryHealthy: boolean;

  registeredObjects: FoundationObjectDefinition[];

  duplicates: {
    duplicateObjectIds: string[];
    duplicateSchemaVersions: Array<{ objectId: string; schemaVersion: string }>;
  };

  missingOwners: {
    objectIds: string[];
  };

  missingProducers: {
    objectIds: string[];
  };

  dependencyGraph: Array<{
    producer: string;
    objectId: string;
    consumers: string[];
  }>;

  validationIssues: Array<{
    code: string;
    severity: "Error" | "Warning";
    objectId?: string;
    message: string;
  }>;

  schemaVersions: Array<{
    objectId: string;
    schemaVersion: string;
    lifecycleState: string;
  }>;

  objectStatistics: {
    totalDefinitions: number;
    totalObjectTypes: number;
    definitionsByType: Record<string, number>;
    definitionsByOwner: Record<string, number>;
    activeCount: number;
    deprecatedCount: number;
  };
};
```

### 9.2 Required diagnostic categories

| Category | Content |
|----------|---------|
| **Registered objects** | Full definition records for all `(ObjectId, SchemaVersion)` pairs |
| **Duplicate registrations** | `duplicateObjectIds`, `duplicateSchemaVersions` |
| **Missing owners** | Object IDs failing owner validation |
| **Missing producers** | Object IDs whose producer module is absent |
| **Dependency graph** | Producer → ObjectId → Consumers edges |
| **Validation issues** | All Error and Warning codes from Section 8 |
| **Schema versions** | Per-object version listing |
| **Object statistics** | Counts by type, owner, lifecycle |

### 9.3 Health

`foundationRegistryHealthy` is `true` only when:

- `totalObjectTypes === 3`
- Zero Error-severity `validationIssues`
- `duplicates` arrays empty
- All producer modules reachable

---

## 10. Dependency Model

### 10.1 Canonical chain

The registry **SHALL** model and expose:

```text
Producer
   ↓
Registered Object (definition)
   ↓
Consumers
```

### 10.2 Phase 1 dependency graph

```text
feature-flag-registry/feature-flag-registry.ts
   ↓
FOUNDATION.FEATURE_FLAG
   ↓
(consumers deferred per-flag; type-level consumers: [])

metric-registry/metric-registry.ts
   ↓
FOUNDATION.METRIC_VALUE
   ↓
SceneGraphLaw003V2.ts
SceneGraphConstitutionMirror.ts

generation-context/build-generation-context.ts
   ↓
FOUNDATION.GENERATION_CONTEXT
   ↓
daos-debug/daos-debug-bundle.ts
```

### 10.3 Cross-object dependencies

```text
FOUNDATION.FEATURE_FLAG
   ──referenced_by──→ FOUNDATION.GENERATION_CONTEXT
   ──referenced_by──→ FOUNDATION.METRIC_VALUE
```

The graph is **acyclic**. `FOUNDATION.FEATURE_FLAG` has no foundation object dependencies (only external `process.env`).

### 10.4 Exposure

`dependencyGraph` in diagnostics **SHALL** list one entry per registered object:

```yaml
- producer: <Producer path>
  objectId: <ObjectId>
  consumers: [<Consumer paths>]
```

---

## 11. Versioning

### 11.1 Semantic versioning

All `SchemaVersion` values **SHALL** use Semantic Versioning (`MAJOR.MINOR.PATCH`).

| Change type | Version bump |
|-------------|--------------|
| Breaking payload shape | MAJOR |
| Additive optional fields | MINOR |
| Documentation / diagnostic key only | PATCH |

### 11.2 Immutable definitions

Once registered, a `(ObjectId, SchemaVersion)` record **SHALL NOT** be modified. Any field change requires a new schema version.

### 11.3 New version registration

Owners **SHALL** register new versions as new records:

```text
FOUNDATION.GENERATION_CONTEXT @ 1.0.0  (Active)
FOUNDATION.GENERATION_CONTEXT @ 1.1.0  (Active, additive fields)
```

### 11.4 Old versions remain visible

`ListVersions("FOUNDATION.GENERATION_CONTEXT")` **SHALL** return all registered versions sorted by semver descending. Deprecated versions remain queryable; they are not deleted.

### 11.5 Wave 38B baseline versions

| ObjectId | SchemaVersion |
|----------|---------------|
| `FOUNDATION.FEATURE_FLAG` | `1.0.0` |
| `FOUNDATION.METRIC_VALUE` | `1.0.0` |
| `FOUNDATION.GENERATION_CONTEXT` | `1.0.0` |

---

## 12. Migration Strategy

Migration plan only. No implementation. No code.

### 12.1 Current state

| Runtime object | Producer (Wave) | In Volume 27 registry? |
|----------------|-----------------|------------------------|
| `GenerationContext` | Wave 36 `generation-context/` | No |
| `MetricValue` | Wave 35 `metric-registry/` | No |
| `FeatureFlag` | Wave 37 `feature-flag-registry/` | No |

Each module already implements local validation and diagnostics. None is listed in a unified foundation directory.

### 12.2 Migration steps

| Step | Action | Runtime impact |
|------|--------|----------------|
| 1 | Add `daos/foundation-object-registry/` module | None (metadata only) |
| 2 | Define static bootstrap records (Section 6) | None |
| 3 | Wire read-only delegation to Waves 35/36/37 producers | None |
| 4 | Implement `Lookup`, `List`, `ListVersions`, `Diagnostics`, `Validate` | None |
| 5 | Add spec test; register in `run-specs.sh` | Test-only |
| 6 | Optionally attach `foundationObjectRegistry` to debug bundle behind flag | Additive diagnostic only |

### 12.3 What does not migrate

| Item | Disposition |
|------|-------------|
| Object instances | Stay with producers; never copied into registry |
| `process.env` resolution | Stays in Feature Flag Registry |
| Metric computation | Stays in Metric Registry |
| Context building | Stays in GenerationContext module |
| Legacy inline resolvers | Not removed in Wave 38B |

### 12.4 Prerequisite merge order

If branches are not on main: Wave 35 → Wave 36 → Wave 37 → Wave 38B.

### 12.5 No datastore migration

Registry is in-memory. No database, no JSON catalog file required in Wave 38B.

---

## 13. Compatibility

### 13.1 Additive registry

Introducing the Foundation Object Registry is **additive**. Existing modules continue to operate without calling the registry.

### 13.2 Runtime continuity

| Flag / path | Behavior |
|-------------|----------|
| All DAOS flags off | Identical to pre-Wave-38B |
| `DAOS_GENERATION_CONTEXT=0` | No context build; registry may still bootstrap |
| `DAOS_METRIC_REGISTRY=0` | Legacy SceneGraph resolvers |
| Feature flag resolution | Unchanged `process.env` read path |

### 13.3 No runtime behavior changes

Wave 38B **SHALL NOT** change:

- Generation output
- Metric values returned to SceneGraph
- Feature flag resolution values
- Pass/fail thresholds
- Public API contracts

### 13.4 Registry optional at runtime

Downstream code **MAY** ignore the registry. Correctness of runtime objects does not depend on registry presence.

---

## 14. Rollback

### 14.1 Principle

Registry removal **SHALL NOT** affect runtime behavior. Producers and consumers operate independently of registry metadata.

### 14.2 Rollback actions

| Action | Effect |
|--------|--------|
| Do not deploy Wave 38B | No registry; Waves 35–37 unchanged |
| Remove bootstrap invocation | Zero production impact |
| Delete `foundation-object-registry/` module | Producers unaffected |

### 14.3 Rollback invariants

Rollback **MUST NOT**:

- Remove Wave 35/36/37 modules
- Alter producer logic
- Change env flag semantics
- Remove debug bundle fields added by other waves

---

## 15. Acceptance Criteria

The specification is **accepted** when all of the following hold:

### 15.1 Formal object definition

- [ ] Runtime Object defined with eight mandatory requirements (Section 2.2)
- [ ] Distinction between instance and registry record is explicit (Section 2.3)
- [ ] Ineligible entities have a clear rejection path

### 15.2 Registry responsibilities

- [ ] SHALL and SHALL NOT lists are explicit (Section 4)
- [ ] Registry is a canonical directory, not a database
- [ ] Runtime state is not owned by registry (Section 3.2)

### 15.3 Ownership

- [ ] Single owner per object type (Section 5, Section 7.1)
- [ ] Owner-only registration rule documented
- [ ] Ownership is deterministic (no inference for type-level records)

### 15.4 Producer / consumer model

- [ ] Producer → Registered Object → Consumers chain defined (Section 10)
- [ ] All three Phase 1 objects have declared producers
- [ ] Consumers listed or explicitly deferred with Notes

### 15.5 Dependency graph

- [ ] Acyclic foundation graph documented (Section 10.2, 10.3)
- [ ] `dependencyGraph` diagnostic shape defined (Section 9)

### 15.6 Immutable versioning

- [ ] Semver required (Section 11)
- [ ] Definitions immutable; new versions additive only
- [ ] Old versions remain visible

### 15.7 Foundation-only scope

- [ ] Exactly three types: `GenerationContext`, `MetricValue`, `FeatureFlag`
- [ ] Excluded types not discussed as in-scope
- [ ] V-011 identified as primary violation

### 15.8 Implementation readiness (for Wave 38B build)

- [ ] Object definition field schema complete (Section 5)
- [ ] Validation codes complete (Section 8)
- [ ] Diagnostics shape complete (Section 9)
- [ ] Migration plan without code (Section 12)
- [ ] Compatibility and rollback documented (Sections 13–14)

---

## Appendix A — Registry lookup API (implementation contract)

| Method | Input | Output |
|--------|-------|--------|
| `Lookup(objectType)` | `GenerationContext` \| `MetricValue` \| `FeatureFlag` | Latest active definition for type |
| `LookupById(objectId)` | e.g. `FOUNDATION.METRIC_VALUE` | Latest active definition for ID |
| `LookupVersion(objectId, schemaVersion)` | ID + version | Exact immutable definition |
| `List()` | — | All definitions, sorted by `objectId`, then semver |
| `ListVersions(objectId)` | ObjectId | All versions, semver descending |
| `Diagnostics()` | — | Section 9 shape |
| `Validate()` | — | Same as `Diagnostics()` validation section |

No `Register()` exposed after bootstrap in production build.

---

## Appendix B — V-011 compliance projection

| State | V-011 status |
|-------|--------------|
| Before Wave 38B | **FAIL** — foundation runtime objects exist without canonical registry |
| After Wave 38B bootstrap | **PARTIAL** — three foundation types registered with identity, ownership, versioning, dependency graph |
| Full PASS | Requires CI enforcement and complete consumer mapping (outside Wave 38B scope) |

---

**END OF WAVE 38A FOUNDATION OBJECT REGISTRY IMPLEMENTATION SPECIFICATION**
