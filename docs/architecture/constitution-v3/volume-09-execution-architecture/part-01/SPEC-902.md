# SPEC-902 — Geometry Resolver

## Purpose

Resolve executable geometry from SceneGraph.

## Consumes

```yaml
SceneGraph:

  planned

DecisionGraph
```

## Produces

```yaml
GeometryGraph
```

## MUST NOT

- change hierarchy
- change commercial weights
- invent layout

## MAY

- resolve percentages
- resolve coordinates
- resolve anchors
- resolve safe zones
