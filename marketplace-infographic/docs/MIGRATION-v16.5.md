# v16.5 Quality Upgrade — Migration Plan

## Version
`PIPELINE_VERSION = v16.5-quality-upgrade`

## New modules

| Path | Role |
|------|------|
| `src/lib/design/layout-spec/` | `LayoutSpec` type, builder, patches, prompt compiler |
| `src/lib/design/quality-v165/` | LuxuryScore, EyeFlow, VisualNoise, refinement gate |

## Integration points

1. **Design process** (`design-process/pipeline.ts`) — builds `LayoutSpec` before `buildDesignStagePrompt`
2. **Prompt Builder** (`design-process/prompts.ts`, `design/prompt-builder.ts`) — compiles from LayoutSpec, not prose
3. **Layout engine** (`layout-engine/index.ts`) — template ranking biased by `layoutSpec`
4. **Critics** (`art-director`, `senior-art-director`, `marketplace-ctr-expert`) — return `corrections[]` + `layoutSpecPatch`
5. **Handler** (`generate-infographic-handler.ts`) — multi-pass: Generate → Critique → Patch → Regenerate (max 3)

## API response fields (new)

```json
{
  "luxuryScore": 82,
  "qualityRefinementPasses": 2,
  "pipelineVersion": "v16.5-quality-upgrade"
}
```

## Example LayoutSpec

```json
{
  "heroPosition": "right",
  "heroScale": 0.68,
  "headlineArea": "left",
  "benefitsArea": "left_panel",
  "ctaArea": "badge_under_title",
  "whitespaceTarget": 28,
  "maxIcons": 1,
  "maxSecondaryObjects": 2,
  "maxColors": 4,
  "palette": ["#1a1a2e", "#f8fafc", "#f97316", "#64748b"],
  "backgroundStyle": "clean_studio",
  "lightingStyle": "soft_key_top_left",
  "visualWeightMap": { "hero": 48, "headline": 26, "benefits": 12, "cta": 8, "background": 6 }
}
```

## Example critic correction

```json
{
  "score": 72,
  "confidence": 84,
  "issues": ["Недостаточно воздуха (<20%)"],
  "corrections": [
    {
      "id": "whitespace",
      "description": "Увеличить whitespace до 28%",
      "patch": { "whitespaceTarget": 28, "reduceObjectCount": 1 }
    }
  ],
  "layoutSpecPatch": { "whitespaceTarget": 28 }
}
```

## Unit tests

```bash
cd marketplace-infographic
npx tsx src/lib/design/quality-v165/luxury-score.spec.ts
```

Recommended additions: patch merge tests, full `runQualityGate` integration, golden LayoutSpec snapshots.

## Deploy

No Prisma migration required. Deploy: build + `pm2 reload`.
