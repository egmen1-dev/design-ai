# SPEC-903 — Scene Composer

## Purpose

Assemble executable scene.

## Consumes

```yaml
GeometryGraph

EnvironmentDecision

LightingDecision
```

## Produces

```yaml
SceneComposition
```

Scene Composer SHALL NOT:

- resize product
- reposition product
- create overlays
