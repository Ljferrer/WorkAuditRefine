---
name: new-drift-guard-pin-skips-established-region-scoping-idiom-in-same-file
description: "A new presence/mirror pin authored alongside sibling pins that already use a ±N-char/window…"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - region scoping
    - drift guard pin
    - whole-file match
    - window scoping idiom
    - workflow-scaffold.test.mjs
    - skill-doc-contracts.test.mjs
    - D36
    - D9
    - presence pair
    - guard specificity
  provenance: code-verified
  slug: new-drift-guard-pin-skips-established-region-scoping-idiom-in-same-file
  phase: authoring-side-verification/phase-2 (Task 2.1 + Task 2.3 audit findings)
  tags: 
    - test-design
    - drift-guard
    - guard-architecture
  created: 2026-08-25
  originSessionId: dcda690d-99d2-4fba-9d28-2a2a858d4676
  modified: 2026-08-25T07:02:04.066Z
---

# A new drift-guard pin often skips its own file's established region-scoping idiom

## What happened (code-verified at the landed tip, two independent instances)

Verified at `959d1fa1d69e5fea368ebc4be64d2eab833df15a` on `claude/authoring-side-verification-600a79`
(read via the `_refinery` worktree at `.claude/war-worktrees/authoring-side-verification-2026-08-24/_refinery`,
HEAD == the landed tip exactly).

**(a) `skills/red-team/assets/workflow-scaffold.test.mjs`.** The new D9 test ("coverage-vs-source
Evidence join…", ~line 1021-1030) scopes its `lenses.md` half with a bare
`lenses.split('\n').filter(line => line.toLowerCase().includes('coverage-vs-source'))` — a
line-based filter with no surrounding window. Three sibling presence-pair tests in the **same
file** — the ff-topology test (~line 927-943), the envGap test (~line 956-970), and the merged-arm
coverage-vs-source test directly above the new one (~line 983-1011) — all build a proper ±320-char
`region()` window around every mention before asserting, precisely so an unrelated occurrence of
the anchor token elsewhere in `lenses.md` cannot vacuously satisfy the assertion.

**(b) `skills/war/assets/skill-doc-contracts.test.mjs`.** The new D36 test (~line 2116 onward)
asserts every canonical-side key against `norm(canonicalText)` — the **entire** canonical file
(`plan-interview.md`, `strategy-verifier.md`, or war-strategy `SKILL.md`) — for all eight new
glossary-term rows. D35, the sibling row directly above it (for the pre-existing
Touched-doc-accuracy duty term), deliberately construct-extracts the canonical side too and states
in its own comment that it is "never a whole-file scan."

## Why it happens

A new pin is typically authored by pattern-matching the nearest similar-looking assertion in the
file, without first checking whether that file already has an established narrower-scoping
convention for the specific target document being pinned. Both instances above pass every test
today — the anchor tokens happen to be unique within their target files at land time — so the gap
is invisible to the suite. But it is measurably weaker than the sibling pins in the same file: it
cannot catch (i) a clause relocating away from the sentence/section it was pinned inside while the
anchor token survives elsewhere in the document, or (ii) an outcome-inverting rewrite that keeps
the pinned antecedent phrase but changes what follows it (e.g. a vacuous-arm pin that stops one
token before the ratified outcome word, so an inverted rewrite of the outcome still matches).

## The durable rule

Before landing a new presence/mirror drift-guard pin in a test file, grep that file for an
existing `region(`-style windowing helper (or equivalent narrowing idiom) already applied to the
**same target document**. If one exists, match that scoping convention for the new pin rather than
defaulting to the file's most common (often looser) assertion style — a new pin over an
already-scoped document that skips the file's own established discipline is a silent regression in
guard strength, not a stylistic latitude choice.

## Locate-cues (verify still present before acting)

- `skills/red-team/assets/workflow-scaffold.test.mjs`: the `region()` helper and its three prior
  callsites (~line 927-943 ff-topology, ~956-970 envGap, ~983-1011 merged-arm) versus the new D9
  test's bare `.split('\n').filter(...)` (~line 1021-1030).
- `skills/war/assets/skill-doc-contracts.test.mjs`: D35's construct-extraction comment ("never a
  whole-file scan") versus D36's `norm(canonicalText)` whole-file asserts (~line 2116-2179).

## Related

[[guard-scan-scope-narrower-than-its-own-endstate-check-literal]] — a different scope-mismatch
class (a guard narrower than the End-state check it backstops, not a guard narrower than its own
file's established sibling convention).
[[count-only-source-census-pin-is-blind-to-relocation-not-just-addition]] — a related failure mode
(occurrence-count pins are blind to relocation), same underlying theme of scope not tracking the
clause's actual location.
