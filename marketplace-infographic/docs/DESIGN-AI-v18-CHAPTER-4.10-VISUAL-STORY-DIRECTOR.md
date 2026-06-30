# DESIGN AI v18 — Chapter 4.10: Visual Story Director

## Purpose

Visual Story Director is the **first intelligent agent** in Design AI. It defines the commercial story the product card must tell — not the scene, composition, or prompt.

## Pipeline Position

```
Analysis → Visual Story Director → Story Section → Scene Director
```

First among Creative Directors. All downstream creative agents use Story as design intent.

## Responsibilities (only)

- Commercial narrative
- Emotional scenario
- Visual Hook (idea, not effect)
- Customer intent
- Primary emotion
- Story Blueprint

**Never:** scene, lighting, camera, colors, composition, prompts.

## Story Section

```typescript
interface StorySection {
  storyType: StoryType;
  customerIntent: CustomerIntent;
  visualHook: VisualHook;
  primaryEmotion: PrimaryEmotion;
  storyBlueprint: StoryBlueprint;
  commercialGoal: CommercialGoal;
  confidence: number; // 0.0..1.0
}
```

## Story Types

Problem → Solution, Transformation, Premium Lifestyle, Professional Authority, Comfort, Safety, Innovation, Minimal Luxury, Speed, Efficiency, Emotional Gift, Trust, Health, Family, Technology, Before → After.

## Golden Rule

Visual Story Director never creates an image — it creates **meaning**. If Story can be removed without changing the infographic, the agent failed.

## Implementation

| Module | Role |
|--------|------|
| `visual-story-director-types.ts` | Story types, goals, intents, hooks, emotions |
| `visual-story-director-engine.ts` | Story selection, validation, decision pipeline |
| `agents/story-director-agent.ts` | Agent contract integration |

## Integration

Uses Chapter 4.6 Context, 4.7 Memory, 4.8 Decision pipeline, and 4.9 Confidence.
