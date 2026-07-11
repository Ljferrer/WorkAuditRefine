---
name: floor-subset-gate-claim-overstates-arbitrary-custom-pattern
description: "'no custom pattern can exceed the gate' is true only for the *.test.sh union arm, not any custom token"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: floor-subset-gate-claim-overstates-arbitrary-custom-pattern
  phase: test-floor-pattern-threading/p2t2 (plan Task 1.2)
  keywords:
    - floor subset gate
    - testPattern overclaim
    - assert-test-in-diff.sh
    - overrides.testPattern
    - gate exceeds floor
    - both-surfaces doc drift
    - mismatched custom pattern
  tags:
    - war
    - test-floor
    - doc-precision
    - both-surfaces
  relates:
    - "[[release-blurb-overstates-guard-semantics]]"
    - "[[adr-policy-table-entry-vs-mechanism-attribution]]"
    - "[[floor-script-discovery-set-must-mirror-gate-exclusions]]"
    - "[[unthreaded-pattern-override-dooms-cross-repo-test-floor]]"
  created: 2026-07-07
  originSessionId: f2ff9548-8046-450e-b06a-30d1dc445cd1
---

# "No custom pattern can make the floor exceed the gate" is an overclaim — only the `*.test.sh` union arm gives that guarantee

## The durable rule

When documenting a floor/gate subset relationship that holds only for one specific union arm,
don't generalize the sentence to cover the whole custom-pattern feature — a reader will take it as
"any operator-supplied pattern is safe by construction," which is false.

`assert-test-in-diff.sh`'s custom-pattern branch unions the gate's unconditional `*.test.sh`
discovery arm into any `--pattern` set, so a `.test.sh` suite always satisfies the floor — that part
is a real, provable subset guarantee. But an arbitrary custom token (e.g. `overrides.testPattern:
'*.test.ts'` pinned against a pytest-only gate) is **not** thereby a subset of the gate: it can
accept a test file the gate itself never runs. That's exactly the "over-wide but file-matching
pattern that admits a test the gate ignores" residual the same doc block documents as caught
downstream by the execution-evidence pass — so the overclaim directly contradicts the very next
bullet in the same file.

Flagged during phase test-floor-pattern-threading (p2t2, `skills/war/SKILL.md`, Nit/note,
non-blocking) against the sentence "...so no custom set can make it exceed the gate." Auditor
rationale noted the sentence faithfully mirrors an already-ratified `war-config.mjs` `DEFAULTS`
comment with the same wording — so a rescope must hit **both** surfaces (both-surfaces rule) or the
mirror re-diverges.

**Absence note:** at write time (phase test-floor-pattern-threading close), this servitor's own
checkout (branch `claude/resume-war-campaign-945f35`) does not yet contain the `testPattern`
threading — `overrides.testPattern`, `plan.testPattern`, and the flagged `skills/war/SKILL.md`
sentence were not found via Grep here; the landed work lives on
`dev/2026-07-07-target-repo-agnostic-execution`. Verify the sentence's current wording (and its
`war-config.mjs` DEFAULTS mirror) directly on that branch/tip before editing.

**Suggested rescope** (from the audit): "...so the gate's unconditional `*.test.sh` discovery is
always in the floor's match set (floor ⊆ gate for that arm); a mismatched custom token can still
over-cover the gate — the over-wide residual below."

**Why:** a subset proof for one union arm reads, in prose, as a guarantee for the whole feature —
watch for this whenever a doc block proves a narrow case and then states the conclusion in the
broader, unqualified terms of the feature it's part of.
**How to apply:** when a doc claims "no X can exceed/violate Y," check whether the very next
paragraph documents a residual case where X *does* exceed/violate Y — if so, the general claim
needs a scoping clause, and if it's mirrored in a second surface (a source-file comment plus a
SKILL.md paragraph), fix both in the same task.

> archived 2026-07-11: resolved — moved to archive
