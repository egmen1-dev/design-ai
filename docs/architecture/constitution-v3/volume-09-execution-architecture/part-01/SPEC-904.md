# SPEC-904 — Product Composer

## Purpose

Composite product into scene.

## Consumes

```yaml
SceneComposition

ProductNode

GeometryGraph
```

## Produces

```yaml
CompositeResult
```

Product Composer SHALL update

```yaml
SceneGraph.product.actual
```

Product Composer SHALL NOT modify

```yaml
SceneGraph.product.planned
```
