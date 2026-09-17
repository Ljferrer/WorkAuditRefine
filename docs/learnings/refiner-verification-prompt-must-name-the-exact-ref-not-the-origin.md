---
name: refiner-verification-prompt-must-name-the-exact-ref-not-the-origin
description: An unnamed origin ref in a refiner verification prompt resolves to whatever is in scope
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: refiner-verification-prompt-must-name-the-exact-ref-not-the-origin
  phase: 2026-09-11-backward-chain-doctrine/phase-1
  keywords: 
    - PIN TRANSFER GIT VERIFICATION
    - remote_sha
    - refs/heads
    - pin-transfer:git-verified
    - Pin transfer changed the integration target
    - ambiguous referent
    - refiner dispatch prompt
    - integration branch ref
  tags: 
    - engine
    - prompt-authoring
    - refiner
    - pin-transfer
  created: 2026-09-12
  originSessionId: 5a652d85-60d8-4ec9-9cbf-3333802c7056
  modified: 2026-09-12T08:14:43.099Z
---

# Name the exact ref in a refiner verification prompt — "the origin X" resolves ambiguously

**Fact:** the PIN TRANSFER GIT VERIFICATION prompt in `skills/war/assets/workflow-template.js`
asked the refiner to read "the exact origin remote_sha" without naming which ref. With no origin
integration ref named, the dispatched refiner returned the TASK branch's own just-pushed tip
instead. Downstream code compares the reported `remote_sha` against the recorded pre-dispatch
`before.remote_sha` and throws `Pin transfer changed the integration target; Git reconciliation
required before land` on any mismatch — a hard halt, even though the actual integration ref had
never moved.

**Current fix (code-verified at the landed tip):** the prompt now reads: "Read actual task
head_sha, integration local_sha and the exact origin refs/heads/<integration branch> remote_sha
(the integration branch's own origin ref, NEVER the task branch's pushed tip; null ONLY after a
successful query proving absence)." The explicit `NEVER the task branch's pushed tip` clause
confirms the failure mode it guards against.

**Guidance:** any read-only verification prompt dispatched to an agent that must resolve "the
origin X" or "the remote Y" needs the concrete ref spelled out (`refs/heads/<name>`), never an
implicit "the" — a bare-word referent resolves to whatever matching ref happens to be in the
agent's scope, which is not necessarily the one the prompt author meant. This is a general prompt-
authoring risk for any refiner/auditor dispatch that reads live Git state, not unique to pin
transfer.
