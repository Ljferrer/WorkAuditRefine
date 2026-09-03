---
name: new-drift-guard-pin-skips-established-region-scoping-idiom-in-same-file
description: "Before adding a drift-guard pin, match the region-scoping idiom the same test file already applies to that target document."
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

## The durable rule

Before landing a new presence or mirror drift-guard pin in a test file, grep that file for an
existing `region(`-style windowing helper or construct-extraction idiom already applied to the
**same target document**. If one exists, match it. A new pin over an already-scoped document
that falls back to a looser whole-file or bare-line match is a silent regression in guard
strength, not a style choice.

**Why:** a new pin is usually authored by copying the nearest similar assertion, not by checking
what the file already does for that document. The looser pin passes today because the anchor
token is unique at land time. It cannot catch (i) a clause moving away from the sentence it was
pinned inside while the token survives elsewhere, or (ii) an outcome-inverting rewrite that keeps
the pinned antecedent phrase and changes what follows it.

**How to apply:** if the pin must deviate from the sibling idiom (the clause spans more than the
window, for instance), say so in a comment next to the assertion and name the region you chose.

## Incident (two instances, both since addressed)

- `skills/red-team/assets/workflow-scaffold.test.mjs`: the D9 coverage-vs-source Evidence-join
  test filtered `lenses.md` by bare line while the three sibling presence-pair tests above it
  (ff-topology, envGap, merged-arm coverage-vs-source) used the ±320-char `region()` helper.
  Now carries a comment justifying the enclosing line as the region, since the join prose runs
  past the window.
- `skills/war/assets/skill-doc-contracts.test.mjs`: the D36 glossary-mirror rows asserted against
  the whole canonical file while sibling D35 construct-extracted ("never a whole-file scan").
  Fixed in #1683: `D36_ROWS` carry a per-home `construct` and the test asserts the span is
  strictly shorter than the file.

## Related

[[guard-scan-scope-narrower-than-its-own-endstate-check-literal]] — a different scope mismatch
(a guard narrower than the End-state check it backstops).
[[count-only-source-census-pin-is-blind-to-relocation-not-just-addition]] — occurrence-count pins
are blind to relocation; same theme of scope not tracking the clause's location.
