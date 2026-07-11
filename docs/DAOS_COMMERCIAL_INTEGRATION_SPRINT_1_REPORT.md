# DAOS Commercial Integration Sprint 1 Report

**Sprint:** Genome → LayoutSpec Integration  
**Variant:** A (extend existing production stack, no Commercial Blueprint)  
**Branch:** `cursor/commercial-genome-beta-aecb`  
**Layout commercial version:** `1.0.0-sprint1`

---

## Sprint Goal

`CommercialDecisionBeta` now drives production `LayoutSpec` through a dedicated integration layer. Layout runtime owns application; Commercial Genome supplies intent only.

---

## Integration Layer

| Component | Path |
|-----------|------|
| Integration gate | `marketplace-infographic/src/lib/design/layout-spec/commercial-layout-integration.ts` |
| Layout builders | `marketplace-infographic/src/lib/design/layout-spec/builder.ts` |
| Feature flag | `DAOS_COMMERCIAL_LAYOUT_INTEGRATION` (Owner: Layout Runtime, Shadow, default `0`) |
| Handler hook | `generate-infographic-handler.ts` — applies intent after Genome decision, passes decision into quality refinement |

### Activation

Both flags recommended for full pipeline effect:

1. `DAOS_COMMERCIAL_GENOME_BETA=1` — produces `CommercialDecisionBeta`
2. `DAOS_COMMERCIAL_LAYOUT_INTEGRATION=1` — maps decision onto `LayoutSpec`

When layout integration flag is `0`, legacy `LayoutSpec` is preserved unchanged.

---

## Fields Now Controlled by Genome

| CommercialDecisionBeta | LayoutSpec field | Status |
|------------------------|------------------|--------|
| `productAreaTarget` | `heroScale`, `productAreaPct` | **Applied** |
| `heroDominance` | `primaryObject` | **Applied** |
| `visualHierarchy` | `hierarchy` | **Applied** |
| `maxCharacteristics` | `maxCharacteristics` | **Applied** |
| `typographyDirection` | `typographyStrategy` | **Applied** |
| `badgeLimit` | `maxIcons`, `maxBadges` | **Applied** |
| `backgroundContrastDirection` | `backgroundPalettePreference` | **Applied** |
| `environmentDirection` | `scenePreference` | **Applied** |

### Diagnostics (on LayoutSpec)

- `commercialLayout.commercialLayoutApplied`
- `commercialLayout.commercialDecisionId`
- `commercialLayout.commercialMappings`
- `commercialLayout.ignoredCommercialMappings`
- `commercialLayout.layoutCommercialVersion`

### Debug bundle (flag on)

Exposed in `payloadExtras.commercialLayoutIntegration` and diagnostic step `commercial_layout_integration`:

- `commercialLayoutIntegration`
- `appliedMappings`
- `ignoredMappings`
- `layoutVersion`

---

## Fields Still Legacy (Layout-owned)

These remain driven by Composition Director, layout engine, agents, or constitution — not Genome Beta in Sprint 1:

| LayoutSpec field | Owner |
|------------------|-------|
| `heroPosition` | Composition Director / layout engine |
| `headlineArea`, `benefitsArea`, `ctaArea` | Template + card meaning |
| `whitespaceTarget` | Composition metrics / premium heuristics |
| `maxSecondaryObjects`, `maxDecorativeObjects` | Template constraints |
| `maxColors`, `palette` | Assets / genome palette path |
| `backgroundStyle`, `lightingStyle` | Scene Director / governance resolver |
| `visualWeightMap`, `geometry`, `visualWeight` | Composition Director |
| `compositionTemplateId` | Composition Director |

---

## Genome Fields Not Mapped (Sprint 1)

| Field | Reason | Sprint 2 candidate |
|-------|--------|-------------------|
| `mainMessage` | Prompt / copy domain — Layout not owner | Prompt Compiler bridge |
| `antiRules` | Prompt negative constraints | SceneGraph / prompt modules |
| `selectedRules` | Diagnostics / trace only | Benchmark attribution |
| `decisionTrace` | Diagnostics only | Debug bundle enrichment |

---

## Product Impact

| Metric | Before Sprint 1 | After Sprint 1 (estimate) |
|--------|-----------------|---------------------------|
| Product Impact | 5/10 | **6–7/10** |
| Genome → Layout coupling | Diagnostics + prompt snippet only | **Direct LayoutSpec mutation** |
| v17 render path | Unaffected by Genome snippet | LayoutSpec fields available to visual-pipeline directors |

**Why impact rises:** Commercial rules for hero scale (55%), badge limits, hierarchy, typography caps, and environment/contrast preferences now reach the same `LayoutSpec` object consumed by layout engine, quality gate, and prompt compiler — not only shadow diagnostics.

**Remaining gap:** `backgroundStyle` / `scenePlan` / `VisualSceneBlueprint` are not yet synced from `scenePreference` and `backgroundPalettePreference`. v17 path still does not compile Genome snippet into background prompt.

---

## Tests

`marketplace-infographic/src/lib/design/layout-spec/commercial-layout-integration.test.ts`

- productAreaTarget → heroScale
- heroDominance → primaryObject
- badgeLimit → maxIcons / maxBadges
- typography + maxCharacteristics
- visualHierarchy → hierarchy
- environmentDirection → scenePreference
- backgroundContrastDirection → backgroundPalettePreference
- flag off → legacy layout unchanged
- deterministic integration
- debug bundle shape

Run: `marketplace-infographic/scripts/run-specs.sh`

---

## Recommendations for Sprint 2

1. **Scene bridge** — map `scenePreference` → `ScenePlan` / `SceneBlueprint.environment` (not only LayoutSpec metadata).
2. **Background bridge** — map `backgroundPalettePreference` → `backgroundStyle` and render-engine palette modules.
3. **v17 path** — ensure `rebuildVisualPipelineForRender` reads new LayoutSpec commercial fields.
4. **Governance resolver** — pass `commercialDecision` into `resolveDesignDecisions` so locked blueprints inherit commercial layout.
5. **Composition Director** — optional post-pass when genome runs before composition (ordering optimization).
6. **Canary** — promote `DAOS_COMMERCIAL_LAYOUT_INTEGRATION` from Shadow → Canary after A/B on hero scale + badge limit CTR.

---

## Council Verdict

Sprint 1 success criteria met: **CommercialDecision influences production LayoutSpec directly**, without a new Blueprint type and without rewriting handler, Prompt Compiler, SceneGraph, DecisionGraph, RenderBlueprint v18, or Directors.
