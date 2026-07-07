# DAOS Architecture Constitution v3

**Status:** canonical  
**Version:** 3.0  
**Audience:** DAOS agents, Cursor, internal runtime, future developers  
**Human readability:** secondary  
**Machine interpretability:** primary  

---

## Document map

| Volume | Title | Status |
|--------|-------|--------|
| **0** | DAOS Language Specification | Part 1 canonical · Part 2 pending |
| 1+ | (future volumes) | — |

**Supersedes** agent/runtime contracts in `docs/DAOS_Specification.md` v1.0. Stage reports (`docs/DAOS_V2_*`) remain historical experiment evidence.

---

# Volume 0 — DAOS Language Specification

## SPEC-000: System Identity

```yaml
DAOS:
  full_name: Design AI Operating System
  type: CommercialDesignDecisionSystem
  primary_goal: produce_commercial_design_decisions
  secondary_goal: render_visual_outputs
  not_a:
    - image_generator
    - prompt_library
    - template_collection
    - provider_wrapper
  core_principle:
    statement: "DAOS creates commercial design decisions. Images are implementation artifacts."
  source_of_truth:
    architecture: DAOS_Architecture_Constitution_v3
    design_state: SceneGraph
    commercial_knowledge: CommercialKnowledgeEngine
    research_evidence: ResearchLab
    decisions: DecisionGraph
```

---

## SPEC-001: Agent Communication Protocol

```yaml
AgentCommunicationProtocol:
  name: DAOS Protocol
  version: 3.0
  format: structured_objects_only

  forbidden:
    - free_text_decisions
    - implicit_recommendations
    - untyped_agent_messages
    - undocumented_strategy_changes
    - direct_layout_mutation_without_scene_event

  required:
    - message_type
    - id
    - source_agent
    - target_engine
    - confidence
    - reason
    - created_at
    - evidence_refs

  allowed_message_types:
    - Finding
    - Proposal
    - Decision
    - ConstraintResponse
    - Evidence
    - KnowledgeRule
    - LearningEvent
    - ExperimentResult
    - SceneMutation
    - RenderIntent
    - OverlayIntent
    - GeometryIntent
    - GovernanceResult
```

---

## SPEC-002: Common Message Envelope

```yaml
DAOSMessage:
  required_fields:
    id: string
    type: DAOSMessageType
    source: AgentId
    target: EngineId
    created_at: ISODateTime
    confidence: number
    reason: string

  optional_fields:
    priority: number
    evidence_refs: EvidenceRef[]
    scene_refs: SceneGraphRef[]
    rule_refs: KnowledgeRuleRef[]
    experiment_refs: ExperimentRef[]
    depends_on: DAOSMessageId[]
    conflicts_with: DAOSMessageId[]
    status: MessageStatus

  status_values:
    - draft
    - proposed
    - accepted
    - rejected
    - superseded
    - deprecated
```

---

## SPEC-003: Finding Object

```yaml
Finding:
  extends: DAOSMessage
  type: Finding

  required_fields:
    finding_type: FindingType
    severity: Severity
    metric: object
    expected: object
    actual: object
    recommendation: VocabularyAction

  finding_types:
    - ProductDominance
    - OverlayDensity
    - TypographyReadability
    - CommercialWeakness
    - GrammarIssue
    - VisualHierarchyIssue
    - MarketplaceMismatch
    - SceneGraphDrift
    - ProviderCapabilityMismatch
    - KnowledgeConflict

  severity_values:
    - info
    - warning
    - critical

  example:
    id: FINDING_PRODUCT_DOMINANCE_LOW
    type: Finding
    source: SceneGraphValidator
    target: DecisionEngine
    finding_type: ProductDominance
    severity: warning
    confidence: 0.94
    metric:
      productAreaRatio: 0.28
    expected:
      productAreaRatio_min: 0.45
    actual:
      productAreaRatio: 0.28
    recommendation: increase_product_target_area
    reason: "Product is below commercial hero dominance threshold."
```

---

## SPEC-004: Proposal Object

```yaml
Proposal:
  extends: DAOSMessage
  type: Proposal

  required_fields:
    proposal_type: ProposalType
    action: VocabularyAction
    expected_impact: ExpectedImpact
    risks: Risk[]
    affected_nodes: SceneGraphNodeRef[]

  proposal_types:
    - CommercialStrategy
    - LayoutStrategy
    - GeometryStrategy
    - OverlayStrategy
    - TypographyStrategy
    - EnvironmentStrategy
    - LightingStrategy
    - GovernanceStrategy

  example:
    id: PROPOSAL_USE_WIDE_PRODUCT_TEMPLATE
    type: Proposal
    source: LayoutStrategyAgent
    target: DecisionEngine
    proposal_type: LayoutStrategy
    action: apply_wide_product_template
    confidence: 0.91
    reason: "Product aspect ratio is 2.6 and standard hero scale cannot satisfy LAW003 V2."
    expected_impact:
      LAW003_V2: improve
      product_dominance: improve
    risks:
      - LAW014_overlap
    affected_nodes:
      - SceneGraph.ProductNode
      - SceneGraph.OverlayNode
```

---

## SPEC-005: Decision Object

```yaml
Decision:
  extends: DAOSMessage
  type: Decision

  required_fields:
    decision_type: DecisionType
    selected_action: VocabularyAction
    rejected_alternatives: RejectedAlternative[]
    confidence: number
    decision_basis: DecisionBasis
    scene_mutations: SceneMutation[]

  decision_types:
    - CommercialDecision
    - LayoutDecision
    - GeometryDecision
    - OverlayDecision
    - RenderDecision
    - GovernanceDecision
    - KnowledgeDecision
    - ResearchDecision

  example:
    id: DECISION_WIDE_PRODUCT_TEMPLATE_ACCEPTED
    type: Decision
    source: DecisionEngine
    target: SceneGraph
    decision_type: LayoutDecision
    selected_action: apply_wide_product_template
    confidence: 0.87
    reason: "Wide product geometry limit confirmed by SceneGraph attribution and LAW003 V2."
    rejected_alternatives:
      - action: increase_product_scale
        reason: "Factual composite area did not reach target in previous experiments."
      - action: force_compositor_hero_zone
        reason: "Stage 5.1 reduced factual composite area."
    decision_basis:
      knowledge_rules:
        - KB_HERO_DOMINANCE
        - KB_WIDE_PRODUCT_TEMPLATE_REQUIRED
      experiments:
        - STAGE_4_2_LAW003_V2
        - STAGE_5_WIDE_PRODUCT_TEMPLATE
    scene_mutations:
      - mutation: set_wide_product_template
```

---

## SPEC-006: Shared Vocabulary

```yaml
DAOSVocabulary:
  version: 3.0

  commercial_actions:
    - sell_interest
    - sell_result
    - reduce_information_overload
    - increase_trust_signal
    - improve_thumbnail_readability
    - strengthen_main_promise

  layout_actions:
    - apply_standard_hero_layout
    - apply_wide_product_template
    - move_text_top
    - move_text_side
    - reduce_badge_count
    - increase_whitespace
    - reduce_visual_noise

  geometry_actions:
    - increase_product_target_area
    - decrease_product_target_area
    - use_fit_width
    - use_fit_height
    - use_balanced_fit
    - reject_unreachable_target
    - report_geometry_constraint

  overlay_actions:
    - reduce_overlay_density
    - increase_text_contrast
    - move_overlay_away_from_product
    - use_simple_plaque
    - remove_decorative_element

  render_actions:
    - use_industrial_scene
    - use_lifestyle_scene
    - use_light_modern_background
    - use_dark_premium_background
    - use_premium_lighting
    - use_warm_rim_light
    - use_cool_background

  governance_actions:
    - apply_law003_v2
    - apply_law014_check
    - run_grammar_validation
    - run_thumbnail_test
    - run_visual_hierarchy_check
```

---

## SPEC-007: Agent Rule

```yaml
AgentRule:
  all_agents_must:
    - communicate_using_DAOSMessage
    - use_DAOSVocabulary
    - attach_confidence
    - attach_reason
    - reference_scene_nodes_when_applicable
    - reference_knowledge_rules_when_applicable

  all_agents_must_not:
    - invent_new_action_names_without_registry_update
    - mutate_SceneGraph_directly_without_SceneMutation
    - bypass_DecisionEngine_for_strategy_choice
    - store_business_logic_inside_prompt
    - treat_DebugBundle_as_source_of_truth
```

---

## SPEC-008: Core System Contract

```yaml
CoreContract:
  single_sources_of_truth:
    design_state: SceneGraph
    decisions: DecisionGraph
    knowledge: CommercialKnowledgeEngine
    research: ResearchLab
    learning: LearningEngine

  render_engine_contract:
    role: executor
    must_not:
      - decide_commercial_strategy
      - decide_visual_hierarchy
      - decide_typography
      - decide_badges
      - decide_marketplace_psychology

  scenegraph_contract:
    role: design_state_source_of_truth
    every_node_must_have:
      - planned
      - actual
      - confidence
      - source
      - history

  knowledge_contract:
    role: commercial_rule_source
    must_store:
      - laws
      - rules
      - adaptive_parameters
      - evidence
      - anti_rules
      - confidence
```

---

## Volume 0 Part 2 (pending)

- KnowledgeRule
- Experiment / ExperimentResult
- Evidence
- SceneMutation
- DecisionGraph contracts

---

**END OF VOLUME 0 PART 1**
