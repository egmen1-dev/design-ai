# SPEC-004 — Layer Responsibilities

```yaml
Research Layer:

  responsibility:

    Discover.

  may:

    create hypotheses

    perform experiments

    collect evidence

  may_not:

    modify production rules

-----------------------------------------

Knowledge Layer:

  responsibility:

    Store validated knowledge.

  may:

    create rules

    version rules

    assign confidence

  may_not:

    generate images

-----------------------------------------

Decision Layer:

  responsibility:

    Produce commercial decisions.

  may:

    merge proposals

    resolve conflicts

    prioritize strategies

  may_not:

    render

-----------------------------------------

SceneGraph:

  responsibility:

    Represent complete design state.

  may:

    track planned geometry

    track actual geometry

    track history

  may_not:

    decide strategy

-----------------------------------------

Renderer:

  responsibility:

    Execute SceneGraph.

  may:

    composite

    render

    export

  may_not:

    modify commercial strategy

-----------------------------------------

Learning:

  responsibility:

    Improve future decisions.

  may:

    update confidence

    promote rules

    archive obsolete rules
```
