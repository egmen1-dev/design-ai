# v16.6 Scene Director & Scene Blueprint

## Pipeline (updated)

```
Market + Knowledge + Assets + Trend + Genome
    ↓
Ollama Design Process (LayoutSpec)
    ↓
Visual Story Director (Story Engine)
    ↓
Scene Director → SceneBlueprint (+ quality gate)
    ↓
Scene Planner (applies blueprint to ScenePlan)
    ↓
Commercial Photo Director
    ↓
Layout Engine + Quality v16.5 critics
    ↓
Prompt Builder (compiles FROM SceneBlueprint)
    ↓
SD Background → Composite → Render
```

## Folder structure

```
src/lib/design/scene-blueprint/
  types.ts           — SceneBlueprint schema
  templates.ts       — 14 scene type templates
  lighting.ts        — 7 lighting presets
  materials.ts       — material language profiles
  SceneDirector.ts   — design decisions (NO prompts)
  quality.ts         — Scene Quality Score
  to-scene-plan.ts   — blueprint → ScenePlan patch
  prompt-compiler.ts — blueprint → SD prompt
  examples.ts        — example JSON blueprints
  index.ts

src/lib/agents/scene-director/
  agent.ts           — agent wrapper
```

## Scene Director inputs

- Market Intelligence (`marketSnippet`)
- Knowledge Engine (`knowledgeCategory`, `knowledgeSnippet`)
- Design Genome (`genomeContext`)
- Story Engine (`storyDirection`)
- Product analysis + visual profile

## Scene Director outputs

- `SceneBlueprint` (structured JSON)
- `SceneBlueprintQuality` (7 dimensions, threshold 76)
- Regenerates up to 2 attempts if below threshold

## Backward compatibility

- Without `sceneBlueprint`, Prompt Builder uses legacy scene prose path
- Scene Planner unchanged API; optional `sceneBlueprint` input
- All existing agents preserved

## API fields (new)

```json
{
  "sceneQualityScore": 82,
  "sceneType": "premium_studio",
  "pipelineVersion": "v16.6-scene-director"
}
```

## Implementation checklist

- [x] SceneBlueprint TypeScript interfaces
- [x] Scene template library (14 types)
- [x] Lighting presets (7)
- [x] Material language (10 materials)
- [x] Scene Director (heuristic/template)
- [x] Scene Quality Score + regeneration
- [x] Prompt Builder integration
- [x] Scene Planner integration
- [x] Handler wiring
- [ ] Optional: Ollama assist for scene type selection (future)
- [ ] Optional: persist SceneBlueprint in stored payload

## Example Scene Blueprint

See `src/lib/design/scene-blueprint/examples.ts` — `EXAMPLE_PREMIUM_STUDIO`

## Unit test

```bash
npx tsx -e "import { scoreSceneBlueprint, EXAMPLE_PREMIUM_STUDIO } from './src/lib/design/scene-blueprint'; console.log(scoreSceneBlueprint(EXAMPLE_PREMIUM_STUDIO));"
```
