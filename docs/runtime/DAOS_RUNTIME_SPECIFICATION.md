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

Each stage below follows the mandatory structure:

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

---

## Stage 0: Runtime Entry

### Purpose
Describe how a generation request enters DAOS.

### Commercial objective
Create a deterministic, traceable commercial intent envelope for the generation.

### Runtime objective
Normalize the user request into a Generation Request that is structurally complete for context initialization.

### Why this stage exists
- Why previous stages are insufficient: Runtime has no prior state; without a normalized request, DAOS cannot reliably bind product, marketplace, and commercial goal.
- Why following stages cannot replace it: Later stages depend on a complete request envelope and cannot safely infer missing commercial intent.

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

- Generation Request
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

### Transition Rule
- Success: If Outputs satisfy Invariants and no Failure Conditions trigger, transition to the Next Stage.
- Failure: If any Failure Conditions trigger, terminate the generation run immediately and emit Failure Diagnostics; no later stage is executed.

### Next Stage

**Stage 1: Generation Context Initialization**

---

## Stage 1: Generation Context Initialization

### Purpose
Create the canonical GenerationContext. The context becomes immutable.

### Commercial objective
Guarantee that every subsequent commercial decision uses the same single source of truth for the generation.

### Runtime objective
Freeze GenerationContext immutably after initialization so later stages cannot rewrite the meaning of the run.

### Why this stage exists
- Why previous stages are insufficient: Runtime Entry validates structure but does not establish the complete, authoritative context domain.
- Why following stages cannot replace it: Knowledge resolution and commercial reasoning must not attempt to reconstruct context; they must consume the frozen GenerationContext.

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

### Transition Rule
- Success: If Outputs satisfy Invariants and no Failure Conditions trigger, transition to the Next Stage.
- Failure: If any Failure Conditions trigger, terminate the generation run immediately and emit Failure Diagnostics; no later stage is executed.

### Next Stage

**Stage 2: Commercial Genome Loading**

---

## Stage 2: Commercial Genome Loading

### Purpose
Load only production-approved commercial knowledge.
Rejected rules and experimental rules are isolated and never enter the production reasoning path.
Research candidates are treated as non-production until explicitly governed for promotion.

### Commercial objective
Ensure the commercial reasoning pipeline for this generation has access only to production-eligible knowledge.

### Runtime objective
Produce a Commercial Genome Snapshot that is eligible for downstream resolution while preserving traceable records of excluded content.

### Why this stage exists
- Why previous stages are insufficient: GenerationContext defines what the generation is, but it does not select which knowledge is allowed to drive production decisions.
- Why following stages cannot replace it: Knowledge resolution and commercial reasoning assume the input knowledge is already eligible; inserting ineligible knowledge later breaks determinism and mode boundaries.

### Inputs

- Immutable GenerationContext
- Operating mode

### Processing

1. Resolve which Commercial Genome corpus is authoritative for this run.
2. Load lifecycle-managed commercial knowledge objects that are production-approved for production reasoning for this generation.
3. Filter loaded objects by coarse applicability using GenerationContext (marketplace, category, audience, brand, operating mode).
4. Reject or quarantine objects that lack required lifecycle metadata:
   - Type
   - Version
   - Evidence reference
   - Confidence score
   - Applicability scope
   - Lifecycle state
   - Traceability
5. Assemble the Commercial Genome Snapshot — the raw, filtered production-eligible knowledge corpus available for resolution.
6. Record genome version, object counts, and exclusion reasons for any quarantined content.

Commercial Genome Loading performs **no** conflict resolution, ranking, or commercial reasoning. It only loads and coarse-filters.

### Outputs

- Commercial Genome Snapshot
- Genome version manifest
- Load exclusion report
- Genome access trace

### Invariants

- Commercial Genome is lifecycle-managed knowledge, not a static rules file
- Objects without lifecycle metadata SHALL NOT enter the Commercial Genome Snapshot
- Loading does not mutate Commercial Genome
- Downstream stages consume only the Commercial Genome Snapshot for production reasoning

### Failure Conditions

- Genome corpus unavailable or corrupt
- No production-eligible knowledge objects after coarse filter
- Missing genome version or integrity attestation

### Diagnostics

- Objects loaded by type and lifecycle state
- Objects excluded by reason
- Genome version and checksum
- Load latency

### Transition Rule
- Success: If Outputs satisfy Invariants and no Failure Conditions trigger, transition to the Next Stage.
- Failure: If any Failure Conditions trigger, terminate the generation run immediately and emit Failure Diagnostics; no later stage is executed.

### Next Stage

**Stage 3: Knowledge Resolution**

---

## Stage 3: Knowledge Resolution

### Purpose
Resolve only knowledge applicable to the current product.

### Commercial objective
Derive a mode-eligible, conflict-free ResolvedKnowledgeSet that accurately represents what DAOS may use for commercial reasoning in this generation.

### Runtime objective
Transform the Commercial Genome Snapshot into an ordered ResolvedKnowledgeSet using a deterministic resolution pipeline.

### Why this stage exists
- Why previous stages are insufficient: Commercial Genome Loading produces an eligible snapshot but does not resolve applicability, conflicts, priority, and confidence into a final reasoning-ready set.
- Why following stages cannot replace it: Commercial reasoning requires a governed ResolvedKnowledgeSet; later stages cannot interpret raw knowledge without redoing resolution semantics.

### Inputs

- Immutable GenerationContext
- Commercial Genome Snapshot

### Processing

Knowledge Resolution is the **sole** transformation path from Commercial Genome to executable commercial knowledge. It SHALL execute the following pipeline in order without skipping stages:

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

### Transition Rule
- Success: If Outputs satisfy Invariants and no Failure Conditions trigger, transition to the Next Stage.
- Failure: If any Failure Conditions trigger, terminate the generation run immediately and emit Failure Diagnostics; no later stage is executed.

### Next Stage

**Stage 4: Commercial Reasoning**

---

## Stage 4: Commercial Reasoning

### Purpose
Answer one question: What is the best commercial strategy for THIS product?
This stage does not think about images. It thinks about selling.

### Commercial objective
Select exactly one coherent commercial strategy that is internally consistent and evidence-backed.

### Runtime objective
Produce a single integrated Commercial Strategy that is ready to be transformed deterministically into decision objects.

### Why this stage exists
- Why previous stages are insufficient: Knowledge resolution prepares usable knowledge but does not decide a strategy.
- Why following stages cannot replace it: Decision construction must encode the chosen strategy into deterministic commercial authorities; it cannot invent strategy at the scene level.

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

- Commercial Strategy
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

### Transition Rule
- Success: If Outputs satisfy Invariants and no Failure Conditions trigger, transition to the Next Stage.
- Failure: If any Failure Conditions trigger, terminate the generation run immediately and emit Failure Diagnostics; no later stage is executed.

### Next Stage

**Stage 5: Decision Construction**

---

## Stage 5: Decision Construction

### Purpose
Transform the chosen commercial strategy into deterministic commercial decisions.

### Commercial objective
Create a single, immutable DecisionGraph that downstream stages treat as the sole commercial authority.

### Runtime objective
Publish a DecisionGraph with structural completeness and internal consistency, then lock it.

### Why this stage exists
- Why previous stages are insufficient: Commercial reasoning produces a strategy narrative, not a deterministically structured authority object.
- Why following stages cannot replace it: Scene planning and validation consume DecisionGraph; they cannot infer decisions from knowledge without violating the reasoning boundary.

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

### Transition Rule
- Success: If Outputs satisfy Invariants and no Failure Conditions trigger, transition to the Next Stage.
- Failure: If any Failure Conditions trigger, terminate the generation run immediately and emit Failure Diagnostics; no later stage is executed.

### Next Stage

**Stage 6: Scene Planning**

---

## Stage 6: Scene Planning

### Purpose
Transform decisions into visual intentions.

### Commercial objective
Preserve commercial intent encoded in DecisionGraph while representing it as an authoritative planned scene suitable for validation.

### Runtime objective
Produce the SceneGraph that downstream validation and rendering preparation consume as the single authoritative design state.

### Why this stage exists
- Why previous stages are insufficient: DecisionGraph expresses commercial decisions but does not define the scene-structured design state required by downstream checks.
- Why following stages cannot replace it: Commercial validation and render preparation require SceneGraph as the authoritative structure; they cannot recreate it from decisions without re-implementing planning semantics.

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

### Transition Rule
- Success: If Outputs satisfy Invariants and no Failure Conditions trigger, transition to the Next Stage.
- Failure: If any Failure Conditions trigger, terminate the generation run immediately and emit Failure Diagnostics; no later stage is executed.

### Next Stage

**Stage 7: Commercial Validation**

---

## Stage 7: Commercial Validation

### Purpose
Reject weak commercial solutions before rendering.

### Commercial objective
Ensure the planned scene meets governed commercial quality gates (hierarchy, hero emphasis, visual noise, emphasis correctness, and differentiation).

### Runtime objective
Emit a Validated SceneGraph when checks pass, otherwise emit a Rejected SceneGraph with explicit failure diagnostics.

### Why this stage exists
- Why previous stages are insufficient: Scene planning can express intent, but it does not enforce commercial quality gates against the planned outcome.
- Why following stages cannot replace it: Rendering is costly; it must not execute for designs that validation rejects.

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

- Validated SceneGraph
- Rejected SceneGraph
- Commercial Validation Report
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

### Transition Rule
- Success: If Outputs satisfy Invariants and no Failure Conditions trigger, transition to the Next Stage.
- Failure: If any Failure Conditions trigger, terminate the generation run immediately and emit Failure Diagnostics; no later stage is executed.

### Next Stage

**Stage 8: Render Preparation** (on pass or conditional pass)  
**Run termination with audit bundle** (on hard fail in Production mode)

---

## Stage 8: Render Preparation

### Purpose
Prepare rendering instructions.
DAOS still does not generate images in this stage.

### Commercial objective
Translate the validated scene into a render blueprint that cannot reinterpret commercial intent.

### Runtime objective
Produce a Render Blueprint suitable for rendering execution, without performing rendering or commercial reasoning.

### Why this stage exists
- Why previous stages are insufficient: Commercial validation verifies viability but does not produce a render-ready blueprint.
- Why following stages cannot replace it: Rendering requires a prebuilt blueprint; it cannot rerun commercial validation without breaking stage separation.

### Inputs

- Immutable GenerationContext
- Published DecisionGraph
- SceneGraph.planned
- Commercial Validation Report (pass or conditional pass)
- Rendering capability constraints from context

### Processing

1. Project SceneGraph.planned and DecisionGraph into a Render Blueprint that contains only presentation instructions derived from the validated planned scene.
2. Ensure the Render Blueprint contains no commercial reasoning and cannot reinterpret commercial intent.
3. Bind the Render Blueprint to rendering capability constraints specified by GenerationContext.
4. Freeze the Render Blueprint for execution by the rendering stage.
5. Confirm that no rendering execution occurs in this stage.

### Outputs

- Render Blueprint
- Capability constraints binding
- Render instruction set
- Preparation trace

### Invariants

- The Render Blueprint is a projection of SceneGraph.planned, not an alternative scene authority.
- No commercial reasoning appears inside the Render Blueprint.
- SceneGraph.actual remains empty until the rendering stage begins.
- Render Blueprint capability bindings respect GenerationContext constraints.

### Failure Conditions

- Rendering capability constraints are insufficient for the planned scene.
- Render Blueprint projection integrity failure.
- Commercial reasoning embedded in the Render Blueprint.
- Render Blueprint preparation timeout

### Diagnostics

- Render Blueprint integrity summary
- Capability binding report
- Projection coverage report
- Render Blueprint preparation latency

### Transition Rule
- Success: If Outputs satisfy Invariants and no Failure Conditions trigger, transition to the Next Stage.
- Failure: If any Failure Conditions trigger, terminate the generation run immediately and emit Failure Diagnostics; no later stage is executed.

### Next Stage

**Stage 9: Rendering**

---

## Stage 9: Rendering

### Purpose
Render the prepared blueprint.

### Commercial objective
Materialize the planned commercial intent into actual output while preserving fidelity to the render blueprint.

### Runtime objective
Generate a Rendered Candidate that can be evaluated in post-render validation.

### Why this stage exists
- Why previous stages are insufficient: Render preparation creates instructions but has not executed realization and composition.
- Why following stages cannot replace it: Post render validation must evaluate an actual rendered candidate, not only intent.

### Inputs

- Immutable GenerationContext
- Published DecisionGraph
- SceneGraph.planned
- Execution-ready render plan and render instructions

### Processing

Rendering executes the Render Blueprint to materialize the validated planned design into an actual rendered candidate.

1. Execute the Render Blueprint to produce the rendered candidate output.
2. Apply governed mutations only to SceneGraph actual state.
3. Record planned-vs-actual drift where the rendered outcome deviates from the planned scene.
4. Produce the Rendered Candidate artifact for post-render evaluation.

Rendering:

- **Never** re-decides commercial strategy
- **Never** modifies DecisionGraph
- **Never** updates Commercial Genome
- **Never** performs knowledge resolution

### Outputs

- Rendered Candidate
- Planned-vs-actual drift report
- Render execution trace

### Invariants

- SceneGraph remains the authoritative scene representation throughout rendering
- Only governed mutations may change SceneGraph during rendering
- DecisionGraph is consumed read-only
- Commercial reasoning does not occur during rendering
- Rendered output is derived from SceneGraph actual state derived from the Render Blueprint

### Failure Conditions

- Render Blueprint execution failure
- Governed scene mutation invariant violation
- Critical fidelity drift beyond tolerance (mode-dependent)

### Diagnostics

- Per-stage render latency
- Drift measurements
- Fidelity drift diagnostics

### Transition Rule
- Success: If Outputs satisfy Invariants and no Failure Conditions trigger, transition to the Next Stage.
- Failure: If any Failure Conditions trigger, terminate the generation run immediately and emit Failure Diagnostics; no later stage is executed.

### Next Stage

**Stage 10: Post Render Validation**

---

## Stage 10: Post Render Validation

### Purpose
Evaluate commercial quality, rendering quality, and benchmark quality.

### Commercial objective
Certify that the rendered candidate matches the published commercial intent.

### Runtime objective
Produce a Validated Candidate or a Rejected Candidate with explicit failure diagnostics.

### Why this stage exists
- Why previous stages are insufficient: Rendering executes intent but does not certify commercial quality or fidelity against governance checks.
- Why following stages cannot replace it: Benchmarking and learning must operate only on validated outcomes.

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

- Validated Candidate
- Rejected Candidate
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

### Transition Rule
- Success: If Outputs satisfy Invariants and no Failure Conditions trigger, transition to the Next Stage.
- Failure: If any Failure Conditions trigger, terminate the generation run immediately and emit Failure Diagnostics; no later stage is executed.

### Next Stage

**Stage 11: Commercial Benchmark**

---

## Stage 11: Commercial Benchmark

### Purpose
Measure commercial performance.

### Commercial objective
Quantify benchmark-relevant commercial performance for the validated candidate.

### Runtime objective
Produce a Benchmark Report that is suitable for learning.

### Why this stage exists
- Why previous stages are insufficient: Post render validation checks fidelity and quality signals, but does not quantify performance through governed benchmark criteria.
- Why following stages cannot replace it: Learning requires benchmark evidence; it cannot operate without a benchmark report.

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

### Transition Rule
- Success: If Outputs satisfy Invariants and no Failure Conditions trigger, transition to the Next Stage.
- Failure: If any Failure Conditions trigger, terminate the generation run immediately and emit Failure Diagnostics; no later stage is executed.

### Next Stage

**Stage 12: Learning** (Production mode and when learning policy permits)  
**Run completion** (Exploration mode — Learning skipped)

---

## Stage 12: Learning

### Purpose
Learn only from validated benchmark evidence.

### Commercial objective
Adjust the confidence of existing knowledge in a traceable way using governed benchmark outcomes.

### Runtime objective
Emit Learning Events that are evidence-backed and ready for genome feedback proposals.

### Why this stage exists
- Why previous stages are insufficient: Benchmark evidence exists, but learning does not produce governed confidence adjustments.
- Why following stages cannot replace it: Genome feedback proposals must originate from learning events; they must not infer learning directly from benchmark output.

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

### Transition Rule
- Success: If Outputs satisfy Invariants and no Failure Conditions trigger, transition to the Next Stage.
- Failure: If any Failure Conditions trigger, terminate the generation run immediately and emit Failure Diagnostics; no later stage is executed.

### Next Stage

**Stage 13: Commercial Genome Feedback**

---

## Stage 13: Commercial Genome Feedback

### Purpose
Determine whether genome knowledge should change.
Output is a Genome Update Proposal. No genome mutation occurs in this stage.

### Commercial objective
Prepare governance-ready proposals for what knowledge confidence or applicability changes should be considered for future runs.

### Runtime objective
Emit only proposals with full audit traceability back to learning evidence.

### Why this stage exists
- Why previous stages are insufficient: Learning produces learning events, but does not translate them into genome update proposals.
- Why following stages cannot replace it: Research feedback requires explicit genome feedback proposals (and their trace) to decide whether new research should begin.

### Inputs

- Learning Events
- Confidence adjustment record
- Promotion candidate list
- Deprecation signal list
- Generation identity and trace

### Processing

1. Translate Learning outputs into a Genome Update Proposal:
   - Confidence change proposals for affected knowledge objects
   - Applicability change proposals where scope boundaries are implicated
   - Conflict resolution proposals where contradictions are evidenced
   - Deprecation signals (signals only) when benchmarks indicate failure patterns
2. Validate that every proposal is traceable to learning evidence and benchmark signals.
3. Enforce that no production knowledge is mutated during runtime; only proposals are emitted.
4. Record the proposal set audit trail for downstream governance workflow.

### Outputs

- Genome Update Proposal
- Proposal audit trail

### Invariants

- No genome mutation occurs in this stage.
- Proposals are traceable to learning evidence and benchmark signals.
- Direct mutation attempts are rejected.

### Failure Conditions

- Inability to form a valid proposal set from learning evidence.
- Proposal audit trail integrity failure.

### Diagnostics

- Proposal set summary (counts by change type).
- Trace coverage metrics.
- Feedback latency

### Transition Rule
- Success: If Outputs satisfy Invariants and no Failure Conditions trigger, transition to the Next Stage.
- Failure: If any Failure Conditions trigger, terminate the generation run immediately and emit Failure Diagnostics; no later stage is executed.

### Next Stage

**Stage 14: Research Feedback**

---

## Stage 14: Research Feedback

### Purpose
Determine whether new research should begin.

### Commercial objective
Convert validated generation outcomes into structured research-entry artifacts that guide future knowledge discovery.

### Runtime objective
Emit a Research Proposal along with a Knowledge Candidate and an Anti Rule Candidate as outputs when research signals warrant it.

### Why this stage exists
- Why previous stages are insufficient: Learning and genome feedback proposals do not decide whether new research is required.
- Why following stages cannot replace it: The runtime model must emit research feedback artifacts explicitly; no later stage exists within the runtime pipeline.

### Inputs

- Complete generation trace (all prior stage diagnostics)
- Benchmark Report
- Learning Events
- Genome Update Proposal
- Proposal audit trail
- Unresolved findings from validation and governance

### Processing

1. Identify research-worthy signals suggested by:
   - Validated and rejected outcomes
   - Benchmark regressions and quality deltas
   - Planned-vs-actual drift patterns
   - Governance findings
   - Anti-rule near misses
2. Convert signals into a Research Proposal that is suitable for external research execution.
3. Emit a Knowledge Candidate when the signals suggest refined or expanded commercial knowledge would likely improve future outcomes.
4. Emit an Anti Rule Candidate when the signals indicate new or updated rejection constraints would prevent repeat failures.
5. Preserve traceability from emitted research artifacts back to generation identity and benchmark evidence.

### Outputs

- Research Proposal
- Knowledge Candidate
- Anti Rule Candidate

### Invariants

- Research Feedback does not mutate Commercial Genome in runtime.
- Knowledge Candidates and Anti Rule Candidates remain outside Commercial Genome until governed research promotion occurs.
- Research feedback preserves full traceability to the source generation and benchmark evidence.

### Failure Conditions

- Research packaging failure
- Traceability break between outcome and emitted artifacts
- Attempt to inject emitted research artifacts directly into Commercial Genome

### Diagnostics

- Artifact counts by type (proposal, knowledge candidate, anti rule candidate)
- Evidence linkage integrity
- End-to-end generation latency

### Transition Rule
- Success: If Outputs are emitted and Invariants hold, the generation run terminates (no later stage is executed).
- Failure: If any Failure Conditions trigger, terminate the generation run immediately and emit Failure Diagnostics; no later stage is executed.

### Next Stage

**None** — the commercial generation run is complete.

Research proposal artifacts enter the external Research lifecycle:

Observation → Hypothesis → Experiment → Evidence → Knowledge Candidate → Certification → Commercial Genome

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
