# Commercial Genome — System Architecture (Pre-Design)

| Field | Value |
|-------|-------|
| **Status** | Pre-design (architecture blueprint) |
| **Owner** | Architecture Council |
| **RFC** | RFC-2200 — Commercial Genome Runtime (Wave 43) |
| **Constitution** | Volume 5 — Commercial Knowledge System; Volume 22 — Commercial Genome Lifecycle; Volume 3 — Core Domain Model |
| **Era** | Post-Foundation (Phase B — Commercial Reasoning) |
| **Prerequisite** | Foundation Milestone accepted; Waves 39–42 complete |
| **Implementation** | **Not started** — no runtime code in this document |

This document is the **architectural blueprint** for the Commercial Genome subsystem. Wave 43 implementation **SHALL** follow this architecture; architecture **SHALL NOT** follow ad hoc implementation.

**Related (frozen):**

- [Foundation Milestone](../milestones/DAOS_FOUNDATION_MILESTONE.md)
- [Architecture Portal](ARCHITECTURE_PORTAL.md)
- [Architecture Decision Log](ARCHITECTURE_DECISION_LOG.md)
- Constitution RFC-502, SPEC-506, RFC-2200–RFC-2205, SPEC-2200–SPEC-2206

---

## 1. Purpose

### 1.1 Why Commercial Genome exists

DAOS must make **commercial design decisions** — what to emphasize, what to avoid, what patterns apply for a category, marketplace, and generation context — based on **validated knowledge**, not scattered hardcoded rules in handlers, audits, and prompt templates.

Today, commercial intelligence is fragmented across:

- Inline thresholds and heuristics in runtime modules
- Category-specific branches in generation logic
- Implicit patterns in prompts and specs
- Non-versioned “tribal knowledge” in documentation

This does not scale. Adding a marketplace, category, or seasonal campaign requires touching many modules, risks inconsistent decisions, and prevents evidence-based evolution.

### 1.2 Why hardcoded commercial rules are not scalable

| Problem | Consequence |
|---------|-------------|
| Rules embedded in code | No lifecycle, no confidence, no retirement |
| Duplicate commercial logic | DecisionGraph and KRE receive conflicting guidance |
| No provenance | Cannot audit why a commercial choice was made |
| No benchmark linkage | Cannot certify or deprecate rules with evidence |
| Handler coupling | Commercial change requires code deploy |

Hardcoded rules violate Constitution intent: commercial knowledge **SHALL** be lifecycle-managed, evidence-backed, and explainable (RFC-2200, RFC-502).

### 1.3 Why Commercial Genome becomes commercial SSOT

**Commercial Genome** is the canonical, versioned, lifecycle-managed repository of **validated commercial design knowledge**. It is the **single source of truth** for:

- What commercial rules, patterns, and anti-patterns exist
- Their confidence, evidence, and lifecycle state
- What is eligible for production vs experimental use

Downstream systems — Knowledge Resolution Engine (KRE), DecisionGraph, SceneGraph planning inputs — **consume** genome-resolved knowledge; they **do not** redefine commercial semantics.

---

## 2. System Position

Commercial Genome sits **after** foundation context is established and **before** knowledge resolution and commercial reasoning execute.

### 2.1 Pipeline position

```text
GenerationContext          [Foundation — Wave 36]
        ↓
Commercial Genome          [Phase B — Wave 43]
        ↓
Knowledge Resolution Engine
        ↓
DecisionGraph
        ↓
SceneGraph
        ↓
Renderer
```

### 2.2 Boundary rules

| Subsystem | Relationship to Genome |
|-----------|------------------------|
| **GenerationContext** | Supplies immutable input boundary (product, marketplace, category, mode) |
| **Commercial Genome** | Resolves **which commercial knowledge** applies to this context |
| **KRE** | Resolves knowledge **candidates** into a bounded set using genome + context eligibility |
| **DecisionGraph** | Makes **decisions** informed by resolved knowledge — does not own rules |
| **SceneGraph** | Represents **geometry/scene** — consumes decisions, not genome directly |
| **Renderer** | Produces **image** — no genome access |

### 2.3 Foundation dependency

Per Foundation Milestone §11 (Commercial Isolation):

> Commercial Genome, KRE, and DecisionGraph **SHALL NOT** depend on undocumented runtime objects outside the Foundation Registry.

Commercial Genome **SHALL** consume registered foundation objects (`GenerationContext`, `MetricValue` for evidence, `FeatureFlag` for rollout) via documented contracts only.

---

## 3. Core Principles

### 3.1 Commercial Genome SHALL

| Principle | Description |
|-----------|-------------|
| **Contain commercial knowledge** | Laws, rules, category bindings, heuristics |
| **Contain commercial rules** | Normative commercial constraints and guidance |
| **Contain commercial patterns** | Reusable commercial design structures |
| **Contain anti-patterns** | Explicit prohibitions (AntiRule) |
| **Contain confidence** | Per-object and aggregate confidence scores |
| **Contain lifecycle** | Every object has exactly one lifecycle state |

Additional constitution-aligned properties (RFC-502):

- **Versioned** — genome, rule, and pattern versions are explicit
- **Explainable** — provenance and evidence links are mandatory
- **Benchmark-driven** — promotion to production requires benchmark validation

### 3.2 Commercial Genome SHALL NOT

| Prohibition | Owner instead |
|-------------|---------------|
| **Render** | Renderer |
| **Generate prompts** | Prompt / execution layer |
| **Call providers** | Provider adapter layer |
| **Modify SceneGraph** | SceneGraph / compositor |
| **Compute metrics** | Metric Registry |

Genome **informs** commercial reasoning; it does **not** execute generation or geometry.

### 3.3 Architectural invariants

1. No knowledge object enters genome without **lifecycle**, **confidence**, **evidence**, and **ownership** (RFC-2200).
2. Genome is a **graph**, not a flat config file (RFC-502).
3. Production mode consumes only **certified/stable** knowledge (SPEC-2200 mapping).
4. Genome evolution is **evidence-based**, not ad hoc code change.

---

## 4. Commercial Knowledge Model

Architecture-only type definitions. No implementation.

### 4.1 Type catalog

| Type | Purpose | Constitution alignment |
|------|---------|------------------------|
| **Rule** | Normative commercial directive (what must/should hold) | `CommercialRule`, `CategoryRule` |
| **Pattern** | Reusable commercial design structure | `Pattern` |
| **AntiRule** | Explicit prohibition; prevents repeated failed strategies | `AntiRule` |
| **Strategy** | Coordinated approach combining rules/patterns for a goal | Composition over rules/patterns |
| **Constraint** | Hard boundary on commercial decisions (budget, brand, legal) | `CommercialLaw` (very high stability) |
| **CommercialGoal** | Target outcome (CTR, clarity, dominance, trust) | Drives rule selection weighting |
| **CommercialSignal** | Observed market/context signal input to resolution | Context enrichment, not genome storage |
| **CommercialEvidence** | Benchmark, experiment, or research artifact supporting promotion | `Evidence` edge in SPEC-506 |
| **CommercialRecommendation** | Resolved output: apply rule/pattern with confidence | KRE/Genome resolver output type |
| **CommercialPriority** | Ordering when multiple recommendations conflict | Resolution policy metadata |

### 4.2 Graph structure (constitution)

Per SPEC-506, genome internal structure follows explicit edges:

```text
Commercial Law (Constraint)
        ↓
Commercial Rule
        ↓
Category Rule
        ↓
Adaptive Parameter
        ↓
Validated Experiment
        ↓
Evidence
        ↓
Benchmark
        ↓
Confidence
```

Architecture types map into this graph:

- **Constraint** → Commercial Law layer
- **Rule** → Commercial Rule / Category Rule
- **Pattern** → Pattern nodes with category bindings
- **AntiRule** → AntiRule nodes with high stability
- **Strategy** → Named subgraph referencing rules + patterns
- **CommercialEvidence** → Evidence nodes linked to benchmark results

### 4.3 Object identity (each type)

Every genome object **SHALL** expose:

| Field | Required |
|-------|----------|
| `objectId` | Stable canonical ID |
| `objectType` | One of registered genome types |
| `owner` | Single owning subsystem |
| `lifecycleState` | See Section 5 |
| `confidence` | Numeric or enumerated confidence |
| `schemaVersion` | Semver |
| `evidenceRefs` | Links to CommercialEvidence |
| `description` | Human-readable responsibility |

### 4.4 Relationships between types

| Relationship | Meaning |
|--------------|---------|
| `depends_on` | Rule requires another rule or constraint |
| `contradicts` | AntiRule blocks a rule or pattern |
| `supports` | Evidence supports a rule promotion |
| `applies_to` | Category/marketplace binding |
| `recommends` | Strategy recommends pattern set |
| `prioritizes_over` | CommercialPriority ordering |

Hidden relationships are prohibited (Volume 27 principle applies to commercial registry in future wave).

---

## 5. Lifecycle

Every genome object exists in **exactly one** lifecycle state. Production eligibility is governed by state.

### 5.1 Architecture lifecycle pipeline

```text
Research
        ↓
Evidence
        ↓
Candidate
        ↓
Validation
        ↓
Approved
        ↓
Certified
        ↓
Production
        ↓
Deprecated
        ↓
Archived
```

### 5.2 State semantics

| State | Description | Production allowed |
|-------|-------------|-------------------|
| **Research** | Observation / hypothesis formation | No |
| **Evidence** | Evidence collected; not yet candidate | No |
| **Candidate** | Positive signal; awaiting validation | No |
| **Validation** | Active benchmark/experiment validation | No |
| **Approved** | Council or automated gate approved for certification path | Beta only |
| **Certified** | Benchmark-certified for production use | Yes |
| **Production** | Active stable production knowledge | Yes |
| **Deprecated** | Must not be selected for new decisions | No |
| **Archived** | Historical record only | No |

### 5.3 Constitution mapping (SPEC-2200)

| Architecture state | Constitution state(s) |
|--------------------|----------------------|
| Research | `idea`, `hypothesis` |
| Evidence | `experimental` (with evidence) |
| Candidate | `candidate` |
| Validation | `validated` (pre-certification) |
| Approved | `validated` (beta) |
| Certified | `certified` |
| Production | `stable` |
| Deprecated | `deprecated` |
| Archived | `archived` |

Production mode **SHALL** consume only objects in **Certified** or **Production** states (maps to `certified` + `stable`).

### 5.4 Promotion rules (architecture)

| Transition | Requirement |
|------------|-------------|
| Research → Evidence | Documented observation + owner |
| Evidence → Candidate | Initial evidence threshold met |
| Candidate → Validation | Experiment design approved |
| Validation → Approved | Benchmark threshold met |
| Approved → Certified | Council or automated certification gate |
| Certified → Production | Stability period + no regression |
| Any → Deprecated | Superseding rule or negative benchmark |
| Deprecated → Archived | Retention policy elapsed |

No object **SHALL** skip states without approved RFC exception.

---

## 6. Relationships

### 6.1 Downstream flow

```text
Commercial Genome
        ↓  (resolved commercial knowledge)
Knowledge Resolution
        ↓  (ResolvedKnowledgeSet — future commercial object)
DecisionGraph
        ↓  (decisions)
Execution (SceneGraph → Renderer)
```

### 6.2 Ownership along the chain

| Stage | Owns | Consumes from Genome |
|-------|------|------------------------|
| **Commercial Genome** | Knowledge objects, lifecycle, confidence, evidence links | GenerationContext |
| **Knowledge Resolution** | Eligibility filtering, candidate resolution, ranking | Genome objects + context |
| **DecisionGraph** | Decision nodes, decision lifecycle, traces | Resolved knowledge (not raw genome) |
| **Execution** | Scene plans, render plans, output artifacts | DecisionGraph output only |

Genome **SHALL NOT** be read directly by Renderer. SceneGraph **SHALL NOT** own commercial rules.

### 6.3 Upstream inputs

| Input | Purpose |
|-------|---------|
| `GenerationContext` | Category, marketplace, product, operating mode |
| `MetricValue` | Evidence metrics for validation/promotion |
| `FeatureFlag` | Rollout of genome versions and experimental states |
| Research artifacts | Feed Research → Evidence transitions |

---

## 7. Ownership

### 7.1 Genome owns

| Domain | Owner |
|--------|-------|
| Commercial knowledge graph | **Commercial Genome Runtime** |
| Patterns | Commercial Genome |
| Commercial rules | Commercial Genome |
| Confidence model | Commercial Genome |
| Lifecycle states | Commercial Genome |
| Evidence linkage | Commercial Genome |
| Genome versioning | Commercial Genome |

### 7.2 Other subsystems own

| Subsystem | Owns | Does not own |
|-----------|------|--------------|
| **DecisionGraph** | Decisions, decision traces, decision lifecycle | Commercial rules, patterns |
| **SceneGraph** | Geometry, scene representation, spatial metrics domain | Commercial knowledge |
| **Renderer** | Image output, render execution | Commercial knowledge, decisions |
| **Metric Registry** | Metric compute | Commercial rules |
| **GenerationContext** | Generation input SSOT | Commercial knowledge |

### 7.3 Single-owner rule

Every genome object **SHALL** have exactly one owner (Volume 27 / SPEC-2700 principle extends to commercial registry in Wave 43+). Ownership ambiguity is prohibited.

---

## 8. Versioning

### 8.1 Version dimensions

| Version type | Scope | Mutability |
|--------------|-------|------------|
| **Genome Version** | Entire genome snapshot or release train | Immutable once published |
| **Rule Version** | Individual Rule object schema + semantics | Immutable; new version = new object revision |
| **Pattern Version** | Individual Pattern object | Immutable; new version = new revision |
| **Lifecycle Version** | Lifecycle state machine definition | Changed only by approved RFC |

All versions **SHALL** use **Semantic Versioning** (`MAJOR.MINOR.PATCH`).

### 8.2 Compatibility rules

| Change | Version bump | Compatibility |
|--------|--------------|---------------|
| Breaking rule semantics | MAJOR | Requires re-certification |
| Additive optional fields | MINOR | Backward compatible |
| Documentation / metadata only | PATCH | Backward compatible |
| Lifecycle policy change | Lifecycle Version MAJOR | Migration plan required |

### 8.3 Production pinning

- Production **SHALL** pin to a **Genome Version** or explicit certified rule set
- Experimental mode **MAY** consume Approved/Candidate objects under flag
- `GenerationContext` **SHALL** record genome version used for the run (future Wave 43+)

### 8.4 Deprecation

Deprecated rules remain queryable for audit. New decisions **SHALL NOT** select deprecated objects. Supersession **SHALL** link old → new object ID.

---

## 9. Diagnostics

Architecture-only diagnostic keys. No runtime implementation.

### 9.1 Genome resolution diagnostics

| Key | Description |
|-----|-------------|
| `genomeVersion` | Active genome version |
| `genomeResolutionUsed` | Whether genome participated in run |
| `eligibleObjectCount` | Objects eligible for context |
| `selectedObjectCount` | Objects selected after resolution |
| `excludedByLifecycle` | Count excluded by lifecycle gate |
| `excludedByConfidence` | Count below confidence threshold |
| `excludedByCategory` | Count not applicable to category |
| `appliedRules` | IDs of rules applied |
| `appliedPatterns` | IDs of patterns applied |
| `appliedAntiRules` | IDs of anti-rules enforced |
| `commercialRecommendations` | Recommendation IDs issued |
| `priorityConflicts` | Conflicts resolved by CommercialPriority |
| `evidenceCoverage` | Ratio of selected objects with evidence refs |
| `productionGatePassed` | Whether only certified/production objects used |

### 9.2 Lifecycle diagnostics

| Key | Description |
|-----|-------------|
| `lifecycleViolations` | Objects in wrong state for mode |
| `deprecatedObjectUsage` | Attempted use of deprecated objects |
| `uncertifiedProductionAttempt` | Blocked production use of non-certified object |

### 9.3 Health

| Key | Description |
|-----|-------------|
| `genomeHealthy` | No lifecycle violations in production mode |
| `genomeSchemaVersion` | Genome API/schema version |
| `validationIssues` | Structured issues (code, objectId, message) |

Diagnostics are **observability only**; they do not change decisions in this architecture document.

---

## 10. Compliance

### 10.1 Constitution volumes activated by Commercial Genome

| Volume | Role when Genome is implemented |
|--------|--------------------------------|
| **Volume 3** — Core Domain Model | Domain definitions for commercial entities |
| **Volume 5** — Commercial Knowledge System | RFC-502 genome definition; SPEC-506 structure |
| **Volume 22** — Commercial Genome Lifecycle | RFC-2200–2205; SPEC-2200–2206 lifecycle |
| **Volume 24** — Knowledge Resolution Engine | KRE consumes genome (Wave after 43) |
| **Volume 6** — Decision Engine | DecisionGraph consumes resolved knowledge |
| **Volume 19** — System Invariants | SSOT, immutability, no hidden dependencies |
| **Volume 27** — Object Registry | Commercial objects register in commercial registry (future) |
| **Volume 29** — Platform Quality Governance | Benchmark certification, quality gates |

Foundation volumes (25, 26, 27 foundation phase) remain active; Genome **extends** platform into Phase B.

### 10.2 Expected violations addressed (future)

| Violation domain | Expected movement |
|------------------|-------------------|
| Hardcoded commercial rules | FAIL → PARTIAL when genome runtime exists |
| Non-lifecycle commercial knowledge | FAIL → PARTIAL |
| Missing commercial SSOT | FAIL → PARTIAL |

Exact violation IDs **SHALL** be assigned at RFC-2200 implementation spec (Wave 43A). Not CLOSED until KRE + DecisionGraph integration complete.

### 10.3 ADL and milestone gates

- Foundation Milestone **SHALL** remain satisfied (Foundation Freeze)
- New ADL entry **SHALL** be recorded at Council acceptance of Wave 43 (e.g. ADL-005 proposed)
- Genome **SHALL NOT** ship before Waves 39–42 complete (Roadmap v2.0)

---

## 11. Future Extensions

Reserved placeholders. **Not** in Wave 43 scope. No design detail until approved RFC.

| Extension | Description |
|-----------|-------------|
| **Learning** | Automated evidence ingestion from production outcomes |
| **Self Evolution** | Controlled promotion proposals from learning pipeline |
| **Genome Merge** | Combine genome branches (e.g. regional + global) |
| **Genome Split** | Fork genome for marketplace-specific variants |
| **Marketplace Profiles** | Genome overlays per marketplace |
| **Regional Profiles** | Locale/region commercial bindings |
| **Season Profiles** | Temporal campaign overlays |

Each extension **SHALL** require RFC + Council acceptance + ADL entry before implementation.

---

## 12. Architecture Summary

### 12.1 Subsystem responsibilities

| Responsibility | Commercial Genome |
|----------------|-----------------|
| Store validated commercial knowledge | **Yes** |
| Version and lifecycle manage knowledge | **Yes** |
| Bind knowledge to context (category, marketplace) | **Yes** |
| Emit recommendations for KRE / reasoning | **Yes** |
| Make final decisions | **No** — DecisionGraph |
| Plan geometry | **No** — SceneGraph |
| Render images | **No** — Renderer |
| Compute metrics | **No** — Metric Registry |

### 12.2 Single-sentence definition

**Commercial Genome** is the lifecycle-managed, evidence-backed, versioned **commercial knowledge graph** that serves as the **SSOT for what commercial rules and patterns exist and which are production-eligible** — consumed by Knowledge Resolution and DecisionGraph, never by Renderer directly.

### 12.3 Implementation path (informative only)

| Step | Deliverable |
|------|-------------|
| Wave 43A | RFC-2200 implementation specification |
| Wave 43B | Commercial Genome runtime (minimal certified rule catalog) |
| Post-43 | KRE integration, DecisionGraph consumption, commercial object registry |

This document does **not** specify implementation modules, APIs, or migration. Wave 43A spec **SHALL** derive from this blueprint.

### 12.4 What does not exist yet

- Commercial Genome runtime module
- Commercial object registry (separate from Foundation Object Registry)
- KRE runtime
- DecisionGraph commercial consumption path
- Genome persistence format (graph store vs serialized catalog — deferred to Wave 43A)

---

**END OF COMMERCIAL GENOME SYSTEM ARCHITECTURE (PRE-DESIGN)**
