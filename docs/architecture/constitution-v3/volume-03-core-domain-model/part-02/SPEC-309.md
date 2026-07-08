# SPEC-309 — DecisionGraph

DecisionGraph is the central commercial decision object.

DecisionGraph is created exactly once during every generation.

DecisionGraph becomes the authoritative source for every downstream subsystem.

```yaml
DecisionGraph:

  id:

  version:

  marketplace:

  category:

  productProfile:

  commercialGoal:

  customerIntent:

  competitorStrategy:

  selectedConcept:

  sceneDecision:

  compositionDecision:

  typographyDecision:

  hierarchyDecision:

  lightingDecision:

  colorDecision:

  environmentDecision:

  renderStrategy:

  confidence:

  supportingEvidence:

  generatedAt:
```

DecisionGraph is immutable after publication.
