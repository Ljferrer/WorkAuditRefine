---
name: analyzed-scope-lock-forbids-the-external-read-a-new-lens-instruction-requires
description: "A new probe instruction that needs an external read must also widen the scope-lock carve-out, not just the prompt body."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - scope-lock
    - analyzed probe
    - scopeLock override
    - PER-ISSUE EVIDENCE JOIN
    - coverage-vs-source
    - gh issue read
    - red-team lens
    - workflow-scaffold.js
    - fail-open capping
    - open nothing else on the machine
  provenance: code-verified
  slug: analyzed-scope-lock-forbids-the-external-read-a-new-lens-instruction-requires
  phase: "authoring-side-verification/phase-2 (Task 2.1 audit finding, D9/PIN-26)"
  tags: 
    - red-team
    - prompt-authoring
    - guard-architecture
    - fail-open
  created: 2026-08-25
  originSessionId: dcda690d-99d2-4fba-9d28-2a2a858d4676
  modified: 2026-08-25T07:01:13.992Z
---

# A scope-locked probe's own preamble can forbid the exact external read a new instruction asks for

**Rule:** when a new dispatched-prompt instruction requires a red-team probe to read something
outside its confined repo/target set (a cited issue, a network resource, an external file), a
prompt-body addition alone is not enough if that probe's technique carries a scope-lock preamble.
The scope-lock is composed to override competing instructions in the same prompt (ADR 0033's
defense-in-depth layer). You must also widen the scope-lock's own carve-out clause to name the new
exception. Widening a scope-lock is a reviewed contract change, not a drive-by edit alongside the
new instruction.

**Why:** a probe that reads the lock conservatively declines the external read every time and emits
only the "unverified note" fallback arm, so the new mechanism's primary arm never fires even when
access is available. It fails open and loud (Minor, not a hold), but the deliverable loses its
efficacy.

**Fixed:** `scopeLock()` in `skills/red-team/assets/workflow-scaffold.js` now carries the D14
carve-out on its `analyzed` arm: "EXCEPT: reading a cited issue's `## Evidence artifacts` section
via `gh issue view` when your probe prompt directs it (read-only, this repo's issues only)". This
pairs with the PER-ISSUE EVIDENCE JOIN clause in the `coverage-vs-source` `SPINE` entry.

**Locate-cue:** `workflow-scaffold.js`: the `scopeLock()` function's `analyzed` arm under the
`D14 carve-out` comment, and the `coverage-vs-source` entry in the `SPINE` array.

## Related

[[template-defers-runtime-values-to-agent-via-literal-placeholder]] is the same class: the
dispatched prompt is the only surface the probe agent ever reads.
