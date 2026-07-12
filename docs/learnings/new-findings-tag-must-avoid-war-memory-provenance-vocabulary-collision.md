---
name: new-findings-tag-must-avoid-war-memory-provenance-vocabulary-collision
description: "Grep new tag names against war-memory provenance vocabulary first"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: 
    - agent-unverified
    - pin-mismatch
    - provenance tier
    - naming collision
    - findings tag
    - ADR 0024
    - controlled vocabulary
  slug: new-findings-tag-must-avoid-war-memory-provenance-vocabulary-collision
  phase: audit-gate-verdict-fidelity/t1.4
  tags: 
    - naming
    - adr-deviation
    - memory-provenance
    - audit-pipeline
  related: 
    - legacy-provenance-value-retire-not-widen
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

# A new findings/status tag must be checked against the war-memory provenance vocabulary before naming it

The source spec for this phase named the pin-mismatch demotion tag `agent-unverified`. The plan deliberately renamed it to `pin-mismatch` instead, because `agent-unverified` is already a reserved `war-memory` provenance tier (the servitor's `metadata.provenance` ladder: `agent-unverified < code-verified < user-confirmed`) — an unrelated concept (how a durable *lesson* was established, vs. whether an *audit finding* was made against a stale-pinned tree). Reusing the string would have made `agent-unverified` ambiguous across two orthogonal subsystems. Documented at ADR 0024 (verify still present before acting — found at `docs/adr/0024-audit-gate-verdicts-integrated-tip-captured-evidence.md` lines 73-74, 108-110, 126-128 @ phase audit-gate-verdict-fidelity/t1.4): "the plan deviates from the spec's suggested tag name... `pin-mismatch` names the mechanism... `agent-unverified` is exclusively a `war-memory` provenance tier in this repo."

**Durable pattern:** before naming any new enum value, tag, or status string in this codebase, grep whether the token is already a reserved word in an *unrelated* controlled vocabulary — the memory-provenance ladder (`agent-unverified`/`code-verified`/`user-confirmed`), the task/land status enums (`merged`/`landed`/held reasons), or a disposition (`absorb`/`follow-up`/`note`). A same-string collision across two orthogonal subsystems is a silent ambiguity trap for anyone grepping the term later, even when each individual usage is internally correct.

[[legacy-provenance-value-retire-not-widen]]
