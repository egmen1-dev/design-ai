# DAOS Runtime Specification

**Status:** Canonical Runtime Specification  
**Authority:** DAOS Architecture Council  
**Version:** 1.0  
**Scope:** Runtime behavior only

---

## Document Purpose

This specification defines how DAOS **thinks** at runtime.

It describes the canonical execution model from which every future implementation — Commercial Genome, Knowledge Resolution Engine, Decision Engine, DecisionGraph, SceneGraph, Render Pipeline, Benchmark, and Learning — SHALL be built.

This document answers:

- What is the first thing DAOS does?
- How does DAOS understand a product?
- How does DAOS decide?
- How does DAOS select commercial knowledge?
- How does DAOS reject bad ideas?
- How does DAOS build a scene?
- How does DAOS know that a decision is good?
- How does DAOS learn?

This document SHALL NOT describe implementation details, programming language constructs, module wiring, or file organization.

---

## Runtime Philosophy

DAOS is **not** an image generator.

DAOS is a **Commercial Decision Operating System**.

Images, HTML, and other media are possible **outputs** of commercial reasoning. They are never the purpose of the runtime.

The runtime SHALL be understood as a **strict sequence of commercial decision stages**. Each stage receives bounded inputs, performs bounded processing, emits bounded outputs, and hands control to exactly one next stage.

No stage may:

- Access future stages
- Bypass earlier stages
- Reconstruct context that belongs to a prior stage
- Perform responsibilities owned by another stage

---

## Global Execution Model

Every generation is one **commercial reasoning run** bound to exactly one immutable **GenerationContext**.

The canonical runtime pipeline is:

```text
Runtime Entry
        ↓
GenerationContext Initialization
        ↓
Commercial Genome Loading
        ↓
Knowledge Resolution
        ↓
Commercial Decision Engine
        ↓
DecisionGraph Construction
        ↓
SceneGraph Construction
        ↓
Commercial Validation
        ↓
Render Preparation
        ↓
Rendering
        ↓
Post Render Validation
        ↓
Benchmark
        ↓
Learning
        ↓
Genome Feedback
        ↓
Research Feedback
```

Each stage below follows the mandatory structure:

```text
Inputs
        ↓
Processing
        ↓
Outputs
        ↓
Invariants
        ↓
Failure Conditions
        ↓
Diagnostics
        ↓
Next Stage
```

---

## 1. Runtime Entry

### Inputs

- External generation request containing at minimum:
  - Product identity and attributes
  - Target marketplace
  - Commercial goal
  - Operating mode (Production or Exploration)
- Optional request extensions:
  - Brand constraints
  - Audience definition
  - Design intent
  - Asset references
  - Provider preferences
  - Benchmark profile
  - Learning policy flags

### Processing

1. Accept the generation request as a **single commercial intent**.
2. Validate that the request is structurally complete enough to initialize a generation.
3. Reject requests that cannot be bound to a product, marketplace, and commercial goal.
4. Assign a unique generation identity for traceability.
5. Record entry timestamp, request provenance, and operating mode.
6. Transition control to GenerationContext initialization.

Runtime Entry performs **no** commercial reasoning, knowledge loading, or rendering.

### Outputs

- Validated generation request envelope
- Generation identity
- Entry audit record

### Invariants

- Exactly one generation identity per run
- Operating mode is determined at entry and SHALL NOT change during the run
- No subsystem state exists before entry completes
- Entry never reads Commercial Genome

### Failure Conditions

- Missing product, marketplace, or commercial goal
- Invalid or unknown operating mode
- Malformed request that cannot be normalized
- Duplicate generation identity collision

### Diagnostics

- Request validation summary
- Normalized field list
- Rejected field list with reasons
- Entry latency

### Next Stage

**GenerationContext Initialization**

---

## 2. GenerationContext Initialization

### Inputs

- Validated generation request envelope from Runtime Entry
- Generation identity
- Operating mode

### Processing

1. Assemble the canonical **GenerationContext** — the single source of truth for the entire run.
2. Populate all required context domains:
   - Metadata (generation identity, timestamps, trace identifiers)
   - Product
   - Marketplace
   - Category
   - Audience
   - Brand
   - Commercial Goal
   - Operating Mode
   - Design Intent
   - Constraints
   - Assets
   - Provider Capabilities
   - Rendering Context
   - Benchmark Context
   - Learning Context
3. Validate internal consistency (for example: marketplace constraints compatible with product type, assets sufficient for stated goal).
4. **Freeze** the GenerationContext — after initialization it becomes immutable.
5. Publish the frozen context to all downstream consumers.

No subsystem may reconstruct, shadow, or locally override GenerationContext.

### Outputs

- Immutable GenerationContext
- Context integrity attestation
- Initialization trace record

### Invariants

- GenerationContext is the **only** authoritative description of what this generation is
- GenerationContext SHALL NOT be modified after initialization
- Every downstream stage consumes the **same** GenerationContext instance
- DecisionGraph, SceneGraph, and rendered artifacts SHALL NOT exist at this stage

### Failure Conditions

- Incomplete required context domains
- Internal context contradiction (conflicting constraints, incompatible goals)
- Asset references that cannot be resolved
- Attempt to mutate context after freeze

### Diagnostics

- Context domain completeness report
- Constraint conflict report
- Asset resolution summary
- Initialization latency

### Next Stage

**Commercial Genome Loading**

---

## 3. Commercial Genome Loading

### Inputs

- Immutable GenerationContext
- Operating mode

### Processing

1. Resolve which Commercial Genome corpus is authoritative for this run.
2. Load lifecycle-managed commercial knowledge objects appropriate to the operating mode:
   - **Production mode:** only certified, stable, production-eligible knowledge
   - **Exploration mode:** may additionally load experimental or candidate knowledge under explicit isolation
3. Filter loaded objects by coarse applicability using GenerationContext (marketplace, category, audience, brand, operating mode).
4. Reject or quarantine objects that lack required lifecycle metadata:
   - Type
   - Version
   - Evidence reference
   - Confidence score
   - Applicability scope
   - Lifecycle state
   - Traceability
5. Assemble the **Loaded Genome View** — the raw, filtered knowledge corpus available for resolution.
6. Record genome version, object counts, and exclusion reasons.

Commercial Genome Loading performs **no** conflict resolution, ranking, or commercial reasoning. It only loads and coarse-filters.

### Outputs

- Loaded Genome View
- Genome version manifest
- Load exclusion report
- Genome access trace

### Invariants

- Commercial Genome is lifecycle-managed knowledge, not a static rules file
- Objects without lifecycle metadata SHALL NOT enter the Loaded Genome View
- Production mode SHALL NOT execute experimental-only knowledge
- Loading does not mutate Commercial Genome
- Decision Engine SHALL NOT access Commercial Genome directly — only the Loaded Genome View passes to Knowledge Resolution

### Failure Conditions

- Genome corpus unavailable or corrupt
- No applicable knowledge objects after coarse filter
- Operating mode violation (experimental knowledge in production path)
- Missing genome version or integrity attestation

### Diagnostics

- Objects loaded by type and lifecycle state
- Objects excluded by reason
- Genome version and checksum
- Load latency

### Next Stage

**Knowledge Resolution**

---

## 4. Knowledge Resolution

### Inputs

- Immutable GenerationContext
- Loaded Genome View

### Processing

Knowledge Resolution is the **sole** transformation path from Commercial Genome to executable commercial knowledge. It SHALL execute the following pipeline in order without skipping stages:

```text
Genome Filter
        ↓
Applicability Filter
        ↓
Lifecycle Filter
        ↓
Conflict Resolution
        ↓
Priority Resolution
        ↓
Confidence Resolution
        ↓
Knowledge Ranking
        ↓
Resolved Knowledge Set
```

**Genome Filter** — Remove knowledge that does not belong to the generation's marketplace, category, audience, operating mode, brand, or provider constraints.

**Applicability Filter** — Score each remaining object for contextual fit (marketplace match, category match, audience match, brand match, product match, aspect ratio, product type, operating mode). Objects below applicability threshold are excluded.

**Lifecycle Filter** — Enforce operating-mode eligibility. Deprecate, archive, or experimental objects are excluded or isolated per mode policy.

**Conflict Resolution** — When multiple knowledge objects assert incompatible commercial guidance, resolve using governed precedence rules. Suppressed objects are recorded, not silently dropped.

**Priority Resolution** — Order surviving objects by commercial priority within their domain.

**Confidence Resolution** — Adjust effective confidence using evidence strength, recency, and benchmark history.

**Knowledge Ranking** — Produce the final ordered **Resolved Knowledge Set** ready for commercial reasoning.

**AntiRule processing** — Explicit rejection rules SHALL eliminate proposals that violate known commercial failures. AntiRules are first-class knowledge, not exceptions.

### Outputs

- Resolved Knowledge Set (ordered, conflict-free, mode-eligible)
- Resolution trace (every inclusion, exclusion, conflict, and override)
- Applicability scores per retained object
- AntiRule activation record

### Invariants

- Knowledge Resolution is the **only** path from Genome to reasoning
- Decision Engine SHALL reason only over the Resolved Knowledge Set
- Skipping resolution stages is prohibited
- Resolution does not mutate Commercial Genome
- Resolution does not make final commercial strategy decisions — it prepares knowledge

### Failure Conditions

- Empty Resolved Knowledge Set after mandatory filters
- Unresolvable conflict with no governed precedence
- AntiRule cascade that eliminates all viable knowledge in a required domain
- Trace integrity failure

### Diagnostics

- Per-stage object counts
- Conflict resolution log
- AntiRule activations
- Applicability score distribution
- Resolution latency

### Next Stage

**Commercial Decision Engine**

---

## 5. Commercial Decision Engine

### Inputs

- Immutable GenerationContext
- Resolved Knowledge Set

### Processing

The Commercial Decision Engine is the central commercial reasoning subsystem. It selects **exactly one coherent commercial strategy** from competing possibilities.

1. **Understand the product** — Derive a product profile from GenerationContext: what is being sold, to whom, in which marketplace context, under which commercial goal.
2. **Activate reasoning domains** — Hero, environment, composition, typography, overlay, lighting, camera, material, and governance constraints as required by the commercial goal.
3. **Generate proposals** — Expert reasoning units analyze context and resolved knowledge. Each may analyze, propose, reject, estimate, and explain. Each produces bounded proposals with evidence references.
4. **Reject bad ideas** — Proposals are eliminated when they:
   - Violate hard constraints from GenerationContext
   - Contradict active AntiRules
   - Lack supporting evidence above threshold
   - Introduce incoherent commercial strategy (conflicting hero, environment, and goal)
   - Exceed acceptable commercial cost (cognitive load, visual noise, implementation complexity, benchmark risk, governance risk)
5. **Evaluate survivors** — Weighted evidence scoring across proposals within each domain.
6. **Integrate** — Compose domain decisions into one coherent commercial strategy. No expert bypasses integration.
7. **Emit decision intent** — Hand off to DecisionGraph construction.

The Decision Engine:

- **Never** renders
- **Never** performs research
- **Never** generates prompts
- **Never** accesses Commercial Genome directly
- **Only** makes commercial decisions

### Outputs

- Integrated commercial decision intent (pre-graph)
- Proposal registry (accepted and rejected)
- Rejection rationale per eliminated proposal
- Evidence weighting record
- Decision confidence estimate

### Invariants

- Exactly one coherent commercial strategy per generation
- All proposals flow through integration — no bypass
- Rejected proposals are recorded, not discarded silently
- Decision Engine does not mutate GenerationContext, Genome, or SceneGraph
- Experts communicate only through the governed protocol

### Failure Conditions

- No viable proposal survives rejection in a required domain
- Unresolvable inter-domain incoherence
- Evidence threshold failure across all candidates
- Integration timeout with incomplete domain coverage

### Diagnostics

- Proposals generated, accepted, rejected per domain
- Rejection reason taxonomy
- Evidence weight distribution
- Commercial cost breakdown
- Decision latency

### Next Stage

**DecisionGraph Construction**

---

## 6. DecisionGraph Construction

### Inputs

- Immutable GenerationContext
- Integrated commercial decision intent from Decision Engine
- Proposal registry and evidence references

### Processing

1. Materialize the integrated commercial strategy into the canonical **DecisionGraph** structure.
2. Populate required decision domains:
   - Commercial goal
   - Marketplace alignment
   - Product profile
   - Hero decision
   - Environment decision
   - Composition decision
   - Typography decision
   - Overlay decision
   - Lighting decision
   - Camera decision
   - Material decision
   - Governance constraints
   - Benchmark references
   - Evidence references
   - Confidence
   - History and trace metadata
3. Validate structural completeness and internal consistency.
4. **Publish** the DecisionGraph — after publication it becomes **immutable**.
5. Emit publication event for downstream consumers.

DecisionGraph Construction is the formalization step. It does not re-reason; it records the outcome of reasoning.

### Outputs

- Published immutable DecisionGraph
- Publication attestation
- Structural validation report

### Invariants

- DecisionGraph is the **sole commercial authority** for all downstream stages
- Exactly one DecisionGraph per generation (in Production mode)
- DecisionGraph SHALL NOT exist before Decision Engine completes
- DecisionGraph SHALL NOT be modified after publication
- GenerationContext SHALL NOT be modified by DecisionGraph
- Exploration mode may emit candidate DecisionGraphs under isolation policy, but each follows the same construction rules

### Failure Conditions

- Incomplete required decision domains
- Internal inconsistency detected at publication
- Publication attestation failure
- Attempt to modify published DecisionGraph

### Diagnostics

- Domain completeness checklist
- Confidence score
- Evidence reference count
- Construction latency

### Next Stage

**SceneGraph Construction**

---

## 7. SceneGraph Construction

### Inputs

- Immutable GenerationContext
- Published immutable DecisionGraph

### Processing

1. Translate commercial decisions into spatial and visual design intent.
2. Build **SceneGraph.planned** — the authoritative planned representation of the commercial design state.
3. Instantiate scene nodes as required by the DecisionGraph (product placement, environment, composition, typography regions, overlay regions, lighting, camera, materials).
4. Apply governance constraints from DecisionGraph as structural bounds, not as new commercial reasoning.
5. Validate SceneGraph invariants (single authoritative scene, no duplicate geometry authority, planned state only).
6. Leave **SceneGraph.actual** empty — actual state is populated only during rendering.

SceneGraph Construction does not render. It plans.

### Outputs

- SceneGraph with populated **planned** state
- Empty **actual** state
- Scene construction trace
- Planned-vs-decision alignment report

### Invariants

- SceneGraph is the **single authoritative representation** of commercial design state
- No subsystem may maintain an alternative scene representation
- SceneGraph may only be changed through governed scene mutations after construction
- SceneGraph.actual SHALL be empty at construction completion
- DecisionGraph is consumed read-only
- Governance never modifies SceneGraph during construction

### Failure Conditions

- DecisionGraph domain cannot be mapped to scene structure
- SceneGraph invariant violation
- Required node missing for mandatory decision domain
- Planning conflict that cannot be resolved within constraints

### Diagnostics

- Node inventory
- Planned geometry summary
- Decision-to-scene mapping coverage
- Construction latency

### Next Stage

**Commercial Validation**

---

## 8. Commercial Validation

### Inputs

- Immutable GenerationContext
- Published DecisionGraph
- SceneGraph.planned

### Processing

Commercial Validation is the pre-execution gate that confirms the planned commercial outcome is viable before any rendering investment.

1. **Decision completeness** — Verify DecisionGraph covers all requirements implied by Commercial Goal and Operating Mode.
2. **Knowledge alignment** — Verify decisions remain consistent with the Resolved Knowledge Set that produced them (no drift between resolution trace and final graph).
3. **Constraint satisfaction** — Verify hard constraints from GenerationContext are satisfied in both DecisionGraph and SceneGraph.planned.
4. **Governance pre-check** — Evaluate planned outcome against active governance rules. Governance observes and reports; it does not mutate SceneGraph.
5. **Commercial viability** — Assess whether the planned scene can achieve the stated commercial goal (for example: hero prominence, message clarity, marketplace fit).
6. **AntiRule re-validation** — Re-check planned outcome against active AntiRules at the scene level.
7. Emit pass, conditional pass, or fail verdict.

### Outputs

- Commercial Validation Report
- Pass / conditional pass / fail verdict
- Findings list with severity
- Governance pre-check record

### Invariants

- Validation occurs **before** rendering
- Validation does not mutate DecisionGraph or SceneGraph
- Fail verdict blocks rendering unless operating mode explicitly allows degraded exploration output
- Governance evaluates but never modifies scene state

### Failure Conditions

- Hard constraint violation
- AntiRule violation in planned scene
- Decision-knowledge drift detected
- Governance block in Production mode
- Incomplete decision coverage for stated goal

### Diagnostics

- Validation rule inventory
- Findings by severity
- Constraint check matrix
- Validation latency

### Next Stage

**Render Preparation** (on pass or conditional pass)  
**Run termination with audit bundle** (on hard fail in Production mode)

---

## 9. Render Preparation

### Inputs

- Immutable GenerationContext
- Published DecisionGraph
- SceneGraph.planned
- Commercial Validation Report (pass or conditional pass)
- Provider Capabilities from context

### Processing

1. Translate SceneGraph.planned and DecisionGraph into execution-ready structures.
2. Build execution graphs (geometry, overlay, typography, compositing order) as **projections** of SceneGraph — not independent authorities.
3. Resolve provider capabilities and select rendering strategy compatible with GenerationContext.
4. Prepare render instructions bound to planned scene nodes.
5. Validate that execution structures contain **no embedded commercial reasoning** — templates and render paths are presentation-only.
6. Stage provider requests without executing them.

Render Preparation performs **no** rendering. It makes the scene executable.

### Outputs

- Execution-ready render plan
- Provider capability binding
- Render instruction set
- Preparation trace

### Invariants

- Execution structures are projections of SceneGraph, not alternatives
- No commercial decisions inside render templates or instructions
- SceneGraph.actual remains empty until Rendering begins
- Provider selection respects GenerationContext constraints
- Rendering providers are interchangeable at this boundary

### Failure Conditions

- Provider capability insufficient for planned scene
- Execution projection failure
- Embedded commercial reasoning detected in render path
- Preparation timeout

### Diagnostics

- Execution graph summary
- Provider binding report
- Node coverage for render instructions
- Preparation latency

### Next Stage

**Rendering**

---

## 10. Rendering

### Inputs

- Immutable GenerationContext
- Published DecisionGraph
- SceneGraph.planned
- Execution-ready render plan and render instructions

### Processing

Rendering materializes the planned commercial design into actual visual state.

1. Execute rendering in governed order:
   - Product compositing (populate SceneGraph.product.actual)
   - Environment and geometry realization
   - Overlay and typography rendering (populate overlay and typography actual nodes)
   - Compositing and assembly
   - Output generation (bitmap, HTML, or other media per context)
2. Each rendering step mutates only **SceneGraph.actual** through governed scene mutations.
3. Record planned-vs-actual drift where actual geometry deviates from plan.
4. Produce final media assets.

Rendering:

- **Never** re-decides commercial strategy
- **Never** modifies DecisionGraph
- **Never** updates Commercial Genome
- **Never** performs knowledge resolution

### Outputs

- SceneGraph with populated **actual** state
- Final rendered assets
- Planned-vs-actual drift report
- Render execution trace

### Invariants

- SceneGraph remains the authoritative scene representation throughout rendering
- Only governed mutations may change SceneGraph during rendering
- DecisionGraph is consumed read-only
- Commercial reasoning does not occur during rendering
- Overlay rendering consumes product actual state

### Failure Conditions

- Provider execution failure
- Unrecoverable compositing error
- Scene mutation invariant violation
- Critical planned-vs-actual drift beyond tolerance (mode-dependent)

### Diagnostics

- Per-stage render latency
- Provider response metadata
- Drift measurements
- Asset output manifest

### Next Stage

**Post Render Validation**

---

## 11. Post Render Validation

### Inputs

- Immutable GenerationContext
- Published DecisionGraph
- SceneGraph (planned and actual)
- Final rendered assets
- Render execution trace

### Processing

Post Render Validation confirms the **actual** outcome matches commercial intent after execution.

1. **Visual fidelity** — Compare SceneGraph.actual against SceneGraph.planned within governed tolerances.
2. **Decision fidelity** — Verify rendered output reflects published DecisionGraph (hero treatment, composition, typography, overlay).
3. **Constraint re-check** — Confirm hard constraints still satisfied in actual output.
4. **Governance evaluation** — Run full governance rules against actual assets and scene state. Governance reports; it does not mutate.
5. **Quality signals** — Collect metric values through the Metric Registry for downstream benchmark and learning.
6. Emit pass, conditional pass, or fail verdict.

### Outputs

- Post Render Validation Report
- Governance findings on actual output
- Metric value snapshot
- Fidelity scores (planned vs actual, decision vs output)

### Invariants

- Post Render Validation occurs after rendering, before benchmark
- Validation does not mutate DecisionGraph, SceneGraph, or Genome
- Metric definitions come from the Metric Registry — ad hoc metrics are prohibited
- Governance evaluates but does not modify scene or assets

### Failure Conditions

- Critical fidelity failure
- Governance block in Production mode
- Mandatory metric computation failure
- Asset integrity failure

### Diagnostics

- Fidelity score breakdown
- Governance finding taxonomy
- Metric computation log
- Validation latency

### Next Stage

**Benchmark**

---

## 12. Benchmark

### Inputs

- Immutable GenerationContext
- Published DecisionGraph
- SceneGraph (planned and actual)
- Final rendered assets
- Post Render Validation Report
- Metric value snapshot
- Benchmark Context from GenerationContext

### Processing

1. Select benchmark suite appropriate to operating mode and Benchmark Context.
2. Execute governed benchmark measurements using Metric Registry definitions.
3. Compare results against:
   - Baseline references
   - Regression thresholds
   - Certification criteria (Production mode)
4. Produce benchmark verdict: pass, regression, or fail.
5. Generate confidence adjustment proposals (not applied here — deferred to Learning).
6. Record benchmark integrity attestation.

Benchmark:

- **Never** modifies production state
- **Never** mutates DecisionGraph or SceneGraph
- **Never** promotes knowledge

### Outputs

- Benchmark Report
- Metric comparison matrix
- Benchmark verdict
- Confidence adjustment proposals
- Benchmark integrity attestation

### Invariants

- Benchmark uses only Metric Registry definitions
- Benchmark does not modify the generation artifact
- Benchmark results are traceable to generation identity
- Exploration mode may use exploratory benchmark profiles; Production mode uses certification profiles
- Learning in Exploration mode SHALL NOT occur

### Failure Conditions

- Benchmark suite unavailable
- Integrity attestation failure
- Regression beyond release threshold (Production mode)
- Missing mandatory benchmark metrics

### Diagnostics

- Per-metric values and deltas
- Regression analysis summary
- Benchmark execution latency
- Suite version and profile

### Next Stage

**Learning** (Production mode and when learning policy permits)  
**Run completion** (Exploration mode — Learning skipped)

---

## 13. Learning

### Inputs

- Immutable GenerationContext
- Published DecisionGraph
- SceneGraph (planned and actual)
- Benchmark Report
- Confidence adjustment proposals
- Learning Context from GenerationContext

### Processing

1. Evaluate benchmark outcomes against learning policy.
2. Identify knowledge objects from the resolution trace that contributed to this generation.
3. Adjust **confidence scores** on existing knowledge objects — Learning never creates new knowledge.
4. Emit Learning Events recording:
   - Affected knowledge object
   - Previous confidence
   - New confidence
   - Reason
   - Benchmark reference
5. Identify promotion candidates and deprecation signals for genome lifecycle review.
6. Preserve generation immutability — learning adjusts future knowledge, not this run's artifacts.

Learning:

- **Never** changes the current generation's DecisionGraph, SceneGraph, or assets
- **Never** creates knowledge objects directly
- **Never** bypasses lifecycle governance for promotion

### Outputs

- Learning Events
- Confidence adjustment record
- Promotion candidate list
- Deprecation signal list

### Invariants

- Learning Engine never creates knowledge — it adjusts confidence
- Learning Engine never changes runtime artifacts of the current generation
- All confidence changes are traceable to benchmark evidence
- Promotion requires lifecycle governance — Learning proposes, it does not promote

### Failure Conditions

- Learning policy prohibits adjustment
- Traceability link from outcome to knowledge object missing
- Confidence adjustment would violate lifecycle bounds

### Diagnostics

- Learning events emitted
- Objects affected count
- Confidence delta distribution
- Learning latency

### Next Stage

**Genome Feedback**

---

## 14. Genome Feedback

### Inputs

- Learning Events
- Confidence adjustment record
- Promotion candidate list
- Deprecation signal list
- Generation identity and trace

### Processing

1. Translate Learning outputs into governed **Genome lifecycle events**:
   - ConfidenceUpdated
   - ApplicabilityUpdated
   - ConflictResolved
   - GenomeObjectDeprecated (signals only)
   - Promotion candidates queued for governance review
2. Apply permitted in-place mutations to Commercial Genome through approved lifecycle events only.
3. Queue objects requiring promotion, certification, or archival for governance workflow.
4. Record audit trail for every genome mutation.
5. Reject direct mutation attempts that bypass lifecycle events.

Genome Feedback is the controlled write path from runtime learning back to Commercial Genome.

### Outputs

- Applied genome lifecycle events
- Queued governance items (promotion, certification, archival)
- Genome mutation audit record
- Updated genome version manifest

### Invariants

- Commercial Genome may be changed **only** through approved lifecycle events
- Direct file or database mutation is prohibited
- Every mutation is versioned, evidenced, and auditable
- Objects without full lifecycle metadata SHALL NOT be promoted
- Genome Feedback does not bypass Research governance for new knowledge creation

### Failure Conditions

- Lifecycle event rejected by governance policy
- Audit trail write failure
- Attempted direct mutation
- Promotion candidate lacks required evidence

### Diagnostics

- Events applied vs queued
- Genome version before and after
- Mutation audit log
- Feedback latency

### Next Stage

**Research Feedback**

---

## 15. Research Feedback

### Inputs

- Complete generation trace (all prior stage diagnostics)
- Benchmark Report
- Learning Events
- Genome mutation audit record
- Unresolved findings from validation and governance

### Processing

1. Package generation outcomes as **research observations** — not as direct knowledge.
2. Identify hypotheses suggested by:
   - Rejected proposals with high evidence
   - Benchmark regressions
   - Planned-vs-actual drift patterns
   - Governance findings
   - AntiRule near-misses
3. Emit observation records for the Research System.
4. Link observations to generation identity, evidence, and benchmark data.
5. Queue experiment candidates where observations exceed observation threshold.
6. Explicitly mark that observations **do not** modify Commercial Genome.

Research is the **only** canonical entry point for new knowledge into Commercial Genome.

### Outputs

- Research observation records
- Experiment candidate queue
- Research feedback bundle
- Generation completion record

### Invariants

- Observations SHALL NOT modify Commercial Genome
- Knowledge Candidates remain outside Genome until promotion through Research governance
- Research feedback preserves full traceability to source generation
- Failed research yields AntiRule candidates, not silent discard
- Generation becomes immutable at completion

### Failure Conditions

- Observation packaging failure
- Traceability break between outcome and observation
- Attempt to inject observation directly into Genome

### Diagnostics

- Observations emitted by category
- Experiment candidates queued
- Feedback bundle size and integrity
- End-to-end generation latency

### Next Stage

**None** — the commercial generation run is complete.

Research observations enter the external Research lifecycle:

```text
Observation → Hypothesis → Experiment → Evidence → Knowledge Candidate → Certification → Commercial Genome
```

---

## Operating Mode Behavior

### Production Mode

- Commercial Genome is authoritative
- Experimental rules do not execute
- Exactly one production DecisionGraph
- Learning and Genome Feedback execute when policy permits
- Benchmark uses certification profiles
- Hard validation failures block rendering or release

### Exploration Mode

- Design space exploration is permitted
- Candidate DecisionGraphs and SceneGraphs may be emitted under isolation
- Learning SHALL NOT occur
- Benchmark uses exploration profiles
- Output is for comparison and research, not direct production release

---

## Rejection Model

DAOS rejects bad ideas at multiple layers. Rejection is **explicit and traced**, never silent.

| Layer | What is rejected | Mechanism |
|-------|------------------|-----------|
| Runtime Entry | Invalid requests | Structural validation |
| Context Init | Inconsistent context | Constraint checking |
| Genome Loading | Unqualified knowledge objects | Lifecycle metadata gate |
| Knowledge Resolution | Inapplicable, conflicting, low-confidence knowledge | Filters, AntiRules, conflict resolution |
| Decision Engine | Incoherent proposals, evidence-poor strategies | Expert rejection, commercial cost, AntiRules |
| Commercial Validation | Planned outcomes that violate constraints or governance | Pre-render gate |
| Post Render Validation | Actual output that diverges from decision intent | Fidelity and governance checks |
| Benchmark | Regressed quality | Threshold comparison |
| Genome Feedback | Unauthorized mutations | Lifecycle event enforcement |
| Research Feedback | Direct knowledge injection | Observation-only contract |

---

## Traceability Contract

Every generation run SHALL produce a trace sufficient to answer:

- What was requested?
- What context was frozen?
- What knowledge was considered, excluded, and selected?
- What was proposed, rejected, and decided?
- What was planned vs what was rendered?
- What did validation and benchmark conclude?
- What did learning change for future runs?
- What observations were sent to research?

No stage may destroy diagnostic information required by downstream stages or post-hoc audit.

---

## Authority and Subordination

This Runtime Specification is subordinate to the DAOS Architecture Constitution.

Where the Constitution defines object contracts, lifecycle rules, or governance policy, this document describes **when and how** those contracts participate in runtime execution.

Implementations SHALL conform to this execution order. Deviations require Architecture Council approval.

---

## Document History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0 | 2026-07-08 | DAOS Architecture Council | Initial canonical runtime specification |
