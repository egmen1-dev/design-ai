# SPEC-001 — Architectural Philosophy

Every architectural decision inside DAOS must satisfy the following principles.

```yaml
ArchitecturePrinciples:

  P001:

    name:
      Decision Before Rendering

    description:
      Rendering engines never decide design.

  P002:

    name:
      Knowledge Before Prompt

    description:
      Prompts are generated from knowledge,
      not vice versa.

  P003:

    name:
      Research Before Knowledge

    description:
      New rules originate from experiments.

  P004:

    name:
      Single Source Of Truth

    description:
      Every subsystem owns exactly one truth.

  P005:

    name:
      Structured Communication

    description:
      Agents communicate only through DAOS Protocol.

  P006:

    name:
      Deterministic Decision Making

    description:
      Equal inputs produce equal decisions.

  P007:

    name:
      Commercial First

    description:
      Commercial performance is always more important
      than visual aesthetics.

  P008:

    name:
      Research Driven Evolution

    description:
      Architecture evolves only after validated evidence.
```
