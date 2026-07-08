# SPEC-013 — Scene Mutation

SceneGraph may only be changed through SceneMutation.

Direct mutation is forbidden.

```yaml
SceneMutation:

  extends:

    CommonEnvelope

  fields:

    node

    operation

    before

    after
```

## Operations

```yaml
Operations:

  create

  update

  delete

  merge

  split

  archive
```
