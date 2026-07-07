# DAOS Experimental Knowledge Base

**Status:** experimental  
**Version:** 0.1  
**Audience:** DAOS agents, DecisionEngine, ResearchLab  
**Authority:** subordinate to [DAOS_ARCHITECTURE_CONSTITUTION_V3.md](./DAOS_ARCHITECTURE_CONSTITUTION_V3.md)  

Rules here are **evidence-backed experiment outcomes**. They are candidates for promotion to `CommercialKnowledgeEngine` — not production law until accepted.

---

## Index

| ID | Type | Confidence | Status | Summary |
|----|------|------------|--------|---------|
| [KB_HERO_DOMINANCE](#kb_hero_dominance) | rule | 0.88 | experimental | Wide products need hero area ≥ 0.32 for LAW_003 V2 |
| [KB_WIDE_PRODUCT_TEMPLATE_REQUIRED](#kb_wide_product_template_required) | rule | 0.87 | experimental | Mattress/wide aspect needs `apply_wide_product_template` |
| [KB_LAW003_V2_PLANNED_GEOMETRY](#kb_law003_v2_planned_geometry) | rule | 0.90 | experimental | LAW_003 V2 evaluates planned/template geometry when template applied |
| [ANTI_FORCE_COMPOSITOR_HERO_ZONE](#anti_force_compositor_hero_zone) | anti_rule | 0.91 | experimental | Do not enable compositor hero-zone forcing in production |
| [EXP_STAGE_4_2_LAW003_V2](#exp_stage_4_2_law003_v2) | experiment | — | completed | Geometry-first LAW_003 formula |
| [EXP_STAGE_5_WIDE_PRODUCT_TEMPLATE](#exp_stage_5_wide_product_template) | experiment | — | completed | Wide template improves planned fill |
| [EXP_STAGE_5_1_COMPOSITOR_HOOK](#exp_stage_5_1_compositor_hook) | experiment | — | completed | Hook changes hash, hurts factual area |
| [EXP_STAGE_5_2_HOOK_DECISION](#exp_stage_5_2_hook_decision) | experiment | — | accepted | Hook remains OFF by default |

---

## Rules

### KB_HERO_DOMINANCE

```yaml
id: KB_HERO_DOMINANCE
type: KnowledgeRule
status: experimental
confidence: 0.88
domain: geometry
statement: "Commercial hero product area ratio should be >= 0.32 for marketplace wide products."
evidence_refs:
  - EXP_STAGE_4_2_LAW003_V2
  - FINDING_PRODUCT_DOMINANCE_LOW
vocabulary_actions:
  - increase_product_target_area
  - apply_wide_product_template
related_laws:
  - LAW_003
  - LAW_003_V2
```

### KB_WIDE_PRODUCT_TEMPLATE_REQUIRED

```yaml
id: KB_WIDE_PRODUCT_TEMPLATE_REQUIRED
type: KnowledgeRule
status: experimental
confidence: 0.87
domain: layout
statement: "Products with aspect >= 2.0 or mattress category signal require wide_bottom_hero template for LAW_003 V2 pass on planned geometry."
evidence_refs:
  - EXP_STAGE_5_WIDE_PRODUCT_TEMPLATE
vocabulary_actions:
  - apply_wide_product_template
  - move_text_top
  - reduce_badge_count
feature_flag: DAOS_WIDE_PRODUCT_TEMPLATE=1
```

### KB_LAW003_V2_PLANNED_GEOMETRY

```yaml
id: KB_LAW003_V2_PLANNED_GEOMETRY
type: KnowledgeRule
status: experimental
confidence: 0.90
domain: governance
statement: "When wideProductTemplateApplied=true, LAW_003 V2 uses planned template product fill, not compositor alpha bbox alone."
evidence_refs:
  - EXP_STAGE_5_WIDE_PRODUCT_TEMPLATE
  - EXP_STAGE_5_1_COMPOSITOR_HOOK
governance_actions:
  - apply_law003_v2
```

---

## Anti-rules

### ANTI_FORCE_COMPOSITOR_HERO_ZONE

```yaml
id: ANTI_FORCE_COMPOSITOR_HERO_ZONE
type: anti_rule
status: experimental
confidence: 0.91
statement: "Do not enable DAOS_WIDE_TEMPLATE_COMPOSITOR_HOOK in production; forcing compositor hero zone reduces factual compositeProductAreaRatio without governance gain."
evidence_refs:
  - EXP_STAGE_5_1_COMPOSITOR_HOOK
  - EXP_STAGE_5_2_HOOK_DECISION
rejected_action: force_compositor_hero_zone
recommended_alternative: apply_wide_product_template
warning_code: WIDE_TEMPLATE_COMPOSITOR_HOOK_EXPERIMENTAL
feature_flag: DAOS_WIDE_TEMPLATE_COMPOSITOR_HOOK=0
```

---

## Experiments

### EXP_STAGE_4_2_LAW003_V2

```yaml
id: STAGE_4_2_LAW003_V2
type: ExperimentResult
status: completed
hypothesis: "Geometry-first LAW_003 V2 resolves metric_mismatch for standard products."
outcome: partial_success
notes: "Drill/kettle/toy pass; mattress still fails without wide template."
report: docs/DAOS_V2_STAGE_4_2_LAW003_V2_REPORT.md
```

### EXP_STAGE_5_WIDE_PRODUCT_TEMPLATE

```yaml
id: STAGE_5_WIDE_PRODUCT_TEMPLATE
type: ExperimentResult
status: completed
hypothesis: "Wide product template improves planned productAreaRatio and LAW_003 V2 for mattress."
outcome: success
metrics:
  productAreaRatio_planned: 0.48
  law003_v2: pass
  visual_hash: unchanged_vs_baseline
report: docs/DAOS_V2_STAGE_5_WIDE_PRODUCT_TEMPLATE_REPORT.md
benchmark: marketplace-infographic/benchmark/output/stage5-wide-product-template-benchmark.json
```

### EXP_STAGE_5_1_COMPOSITOR_HOOK

```yaml
id: STAGE_5_1_COMPOSITOR_HOOK
type: ExperimentResult
status: completed
hypothesis: "Compositor hook aligns factual placement with template hero zone."
outcome: negative
metrics:
  compositeProductAreaRatio_baseline: 0.20
  compositeProductAreaRatio_hook: 0.12
  visual_hash: changed
  law003_v2: pass_both_arms
report: docs/DAOS_V2_STAGE_5_1_WIDE_TEMPLATE_COMPOSITOR_HOOK_REPORT.md
benchmark: marketplace-infographic/benchmark/output/stage5-1-wide-template-compositor-hook-benchmark.json
```

### EXP_STAGE_5_2_HOOK_DECISION

```yaml
id: STAGE_5_2_HOOK_DECISION
type: ExperimentResult
status: accepted
decision: "DAOS_WIDE_TEMPLATE_COMPOSITOR_HOOK remains experimental OFF."
report: docs/DAOS_V2_STAGE_5_2_WIDE_TEMPLATE_DECISION.md
```

---

## Promotion criteria

A rule may graduate from experimental → canonical when:

1. Reproduced in ≥2 benchmark arms or A/B runs  
2. Referenced by a `Decision` object with `decision_basis.knowledge_rules`  
3. No conflicting `anti_rule` with higher confidence  
4. Registered in `CommercialKnowledgeEngine` (not yet implemented)

---

## Related

- [DAOS_ARCHITECTURE_CONSTITUTION_V3.md](./DAOS_ARCHITECTURE_CONSTITUTION_V3.md) — SPEC-005 Decision example references rules here  
- [DAOS_EXPERIMENTAL_KNOWLEDGE_BASE/](./DAOS_EXPERIMENTAL_KNOWLEDGE_BASE/) — per-entry YAML fragments  
