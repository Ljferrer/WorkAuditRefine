---
name: mirror-registry-verification-mode-by-construct-kind
description: "A drift-guard mirror registry needs three distinct equality modes (deepEqual / subset / behavioral) chosen by construct kind, not one uniform check"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: mirror-registry-verification-mode-by-construct-kind
  phase: drift-guards-for-mirrored-and-asserted-facts/t1.5
  keywords: 
    - mirror registry
    - deepEqual
    - subset check
    - behavioral equivalence
    - drift guard
    - ADR 0025
    - inline sandbox mirror
    - workflow-template
    - canonical export
    - ponytail ceiling
  tags: 
    - war
    - drift-guard
    - test-design
    - workflow-template
    - adr-0025
  files: 
    - skills/war/assets/workflow-template.test.mjs
  relates: 
    - "[[curried-inline-mirror-needs-adapter-shim-in-registry-row]]"
    - "[[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]]"
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

# A mirror registry needs three equality modes, chosen by what kind of construct is mirrored

**Found (code-verified — `skills/war/assets/workflow-template.test.mjs`, `D2 mirror registry`
test, ~line 5142; verify still present before acting):** the Workflow sandbox in
`workflow-template.js` cannot `import`, so it hand-copies several canonical facts inline
(`HARD_ESCALATION_REASONS`, the `landDecision` value set, four roster helpers). The new
`MIRROR_REGISTRY` binds each inline copy to its canonical export — but not with one uniform
equality check. Three distinct `mode`s are load-bearing:

- **`deepEqual`** — for a const array the inline code re-declares verbatim
  (`HARD_ESCALATION_REASONS`): parse the inline array literal via regex, sort both sides, `deepEqual`.
  Appropriate because the canonical export IS a closed, fully-enumerated set and the inline copy
  should be byte-for-byte the same set.
- **`subset`** — for `landDecision`'s known-value set: the template's executable code (comments
  stripped) emits only 6 of the 7 `KNOWN_LAND_DECISIONS` values (the 7th, `held:phase-incomplete`,
  is Lead-only and never assigned inline). A `deepEqual` here would be a **false-fail by
  construction** — the correct assertion is "every literal the code actually emits is a member of
  the canonical known set," not "the two sets are identical."
- **`behavioral`** — for the four roster helper functions (`spawnOpts`, `validateRoster`,
  `widenRoster`, `resolveWidenSource`): the inline copy legitimately differs from the canonical
  export in whitespace/comments (hand-copied into a template literal), so byte/AST equality is the
  wrong axis. The registry instead runs both implementations over an enumerated fixture-input set
  and asserts `deepEqual` on the **outputs**, per fixture.

**Why this matters:** a registry author who reflexively reaches for one equality primitive
(`deepEqual` on parsed literals, say) for every row will either false-fail on a legitimately
partial mirror (`landDecision`) or false-pass on a behaviorally-drifted function mirror (bytes
differ trivially, e.g. reformatted, but semantics also silently changed and a byte-only diff
wouldn't have caught it either way — behavioral fixtures are the only mode that actually exercises
the logic). **Classify the construct first** (fully-enumerated set vs. partially-emitted set vs.
function-with-logic), then pick the mode.

**How to apply:** when adding a new inline-mirror row to a registry like this one, ask: (1) is the
canonical side a closed set the inline side re-declares completely? → `deepEqual`. (2) Is the
inline side only a subset the code path actually reaches? → `subset` (assert inline ⊆ canonical,
plus a sanity floor on `inline.length` so an empty extraction doesn't vacuously pass). (3) Is the
canonical side a function whose logic — not literal text — must match? → `behavioral`, with an
enumerated fixture set covering the branchy cases (see
[[curried-inline-mirror-needs-adapter-shim-in-registry-row]] for a related gotcha when the inline
mirror is curried).
