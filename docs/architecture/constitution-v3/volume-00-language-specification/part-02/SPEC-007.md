# SPEC-007 — Message Envelope

Every DAOS object inherits CommonEnvelope.

```yaml
CommonEnvelope:

  id:

    UUID

  objectType:

    enum

  protocolVersion:

    string

  sourceAgent:

    AgentID

  targetAgent:

    AgentID

  timestamp:

    ISO8601

  confidence:

    float

  priority:

    integer

  reason:

    string

  evidence:

    []

  relatedRules:

    []

  relatedExperiments:

    []

  relatedSceneNodes:

    []

  status:

    proposed

    accepted

    rejected

    archived
```
