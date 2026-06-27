# v16.9 Design Constitution

## Mission

Every generated design must obey immutable design laws. No agent may violate them. The Constitution is the **highest authority** in the pipeline — the system asks *"Does this violate any design law?"* instead of *"Does this look good?"*

Design Constitution is **NOT an LLM**. It is a deterministic rule engine.

## Pipeline

```
Knowledge Engine
    ↓
Design Constitution (validate at every stage)
    ↓
Scene Director → Validate Scene Blueprint
    ↓
Composition Director → Validate LayoutSpec
    ↓
Prompt Compiler → Validate Prompt
    ↓
Renderer
    ↓
Critics → Validate Rendered Critique
    ↓
Corrections (patches) → Revalidate
```

## Module

`src/lib/design/design-constitution/` (maps to future `packages/design-constitution/`)

```
design-constitution/
├── types.ts              # Law, violation, patch, report interfaces
├── index.ts              # Public API
├── laws/
│   ├── index.ts          # LAW_001–LAW_015 registry
│   └── helpers.ts        # createLaw factory
├── validators/
│   ├── engine.ts         # validateConstitution()
│   ├── pipeline.ts       # validateWithCorrection()
│   └── stages.ts         # stage-specific validators
├── patches/
│   └── engine.ts         # merge + apply LayoutSpec / SceneBlueprint patches
├── scores/
│   └── engine.ts         # CompositionScore, WhitespaceScore, OverallDesignScore…
├── schemas/
│   └── law-schema.ts     # Zod law definition schema
├── versions/
│   └── index.ts          # core_v1, marketplace_v1, luxury_v2, DNA sets
└── reports/
    └── index.ts          # formatConstitutionReport()
```

## Laws (v1.0)

| ID | Name | Severity |
|----|------|----------|
| LAW_001 | Single Focal Point | Critical |
| LAW_002 | Hero Coverage 35–50% | Critical |
| LAW_003 | Whitespace 20–35% | Critical |
| LAW_004 | Color Discipline (max 4) | Major |
| LAW_005 | Background Complexity LOW | Major |
| LAW_006 | Visual Noise | Major |
| LAW_007 | Typography Hierarchy (one H1) | Critical |
| LAW_008 | Reading Order (eye flow) | Critical |
| LAW_009 | Lighting Consistency (max 2 sources) | Major |
| LAW_010 | Depth separation | Major |
| LAW_011 | Marketplace Safe Zones | Major |
| LAW_012 | No Floating Product | Critical |
| LAW_013 | Grid Alignment | Minor |
| LAW_014 | Contrast Minimum | Major |
| LAW_015 | Brand Palette | Minor |

Each law is an independent module — adding LAW_016 requires no changes to existing laws.

## Constitution sets (versioning)

| Set ID | Version | Use case |
|--------|---------|----------|
| `core_v1` | 1.0 | Universal laws |
| `marketplace_v1` | 1.2 | Wildberries covers |
| `luxury_v2` | 2.0 | Premium segment |
| `industrial_dna` | 1.0 | Tools, construction, auto |
| `beauty_dna` | 1.0 | Cosmetics, fashion |
| `electronics_dna` | 1.0 | Tech products |

## Scoring

Independent scores (0–100):

- CompositionScore, HierarchyScore, WhitespaceScore, LuxuryScore
- TypographyScore, ContrastScore, MarketplaceScore, BrandScore
- VisualNoiseScore
- **OverallDesignScore** (weighted aggregate)

**Pass threshold:** OverallDesignScore ≥ **85**

## Automatic correction

Violations return:

```json
{
  "lawId": "LAW_003",
  "severity": "critical",
  "reason": "Whitespace below minimum 20%",
  "recommendedPatch": { "layoutSpecPatch": { "whitespaceTarget": 24 } },
  "priority": 100
}
```

Up to 3 correction attempts per stage via `validateWithCorrection()`.

## API fields

```json
{
  "pipelineVersion": "v16.9-design-constitution",
  "overallDesignScore": 88,
  "constitutionPassed": true,
  "constitutionVersion": "1.2"
}
```

Stored payload includes `designConstitution[]` — full explainability report per stage.

## Migration from v16.8

| Before | After |
|--------|-------|
| `DESIGN_CONSTITUTION` string array in Prompt Compiler only | Central `DESIGN_CONSTITUTION_RULES` + 15 machine-readable laws |
| Quality gate asks agents + heuristics | Constitution validates every stage; critics merged into gate |
| No stored law report | `designConstitution` in `generatedJson` |

### Prompt Compiler

Imports rules from Design Constitution — single source of truth.

## Test

```bash
npx tsx src/lib/design/design-constitution/design-constitution.spec.ts
```

## Implementation checklist

- [x] Core types and law schema
- [x] 15 independent laws with validators + correction strategies
- [x] Validator engine + stage validators
- [x] Patch engine (LayoutSpec + SceneBlueprint)
- [x] Scoring engine + OverallDesignScore
- [x] Report builder with explainability
- [x] Versioned constitution sets
- [x] Handler integration (4 pipeline stages)
- [x] Stored payload + API response fields
- [ ] Future: block SD render when prompt stage fails critically
- [ ] Future: CMS-driven law definitions from `lawDefinitionSchema`
