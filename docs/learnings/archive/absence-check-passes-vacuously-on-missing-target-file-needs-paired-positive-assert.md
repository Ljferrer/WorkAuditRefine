---
name: absence-check-passes-vacuously-on-missing-target-file-needs-paired-positive-assert
description: A shell old-absent grep-check helper (lacks/lacks_i piping through strip_prose) reads empty stdin and reports a vacuous PASS if its target file is deleted or renamed — only a paired positive (new-present) assert on the same surface catches that case
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: absence-check-passes-vacuously-on-missing-target-file-needs-paired-positive-assert
  phase: "2026-08-04-interview-and-authoring-contract/2 (task 8 gate-audit, execution-evidence lens)"
  keywords: 
    - absence check
    - old-absent
    - vacuous pass
    - lacks
    - lacks_i
    - strip_prose
    - missing file
    - deleted surface
    - paired positive assert
    - doc-cascade sweep
    - gate design
  tags: 
    - doc-honesty
    - test-design
    - doc-cascade
    - gate-audit
  created: 2026-08-05
  originSessionId: 67745971-e7bc-4d1f-87e7-038430dd13ab
  modified: 2026-08-05T15:28:26.934Z
---

# An old-absent grep-check on a deletable target file passes vacuously if the file disappears

## The fact

`skills/war-machine/war-pipeline-structure.test.sh`'s `lacks()`/`lacks_i()` helpers (verified present
at the landed tip `955e7c10d98e4c4c4e30d22f0ab7c29209f8ab23` on
`dev/2026-08-05-2026-08-04-interview-and-authoring-contract`, read via the `_refinery` worktree —
`lacks()` at line 86, `lacks_i()` at line 101) both read the target file through
`strip_prose < "$1" | grep -qF -e "$2"` (or `-qiF` for the `_i` twin). The script sets `set -u` but
**not** `set -e`. If `"$1"` (the target file) is deleted or renamed, the input redirection fails,
`strip_prose` sees no stdin, `grep` sees an empty stream, exits 1 (no match), and the helper prints
`ok - ... lacks ... (correct)` — a false but silent PASS. Nothing in the script halts on the missing
file.

Locate cue: verify still present before acting — `skills/war-machine/war-pipeline-structure.test.sh`,
functions `lacks()`/`lacks_i()`, both piping `strip_prose < "$1"` with no existence guard, `set -u`
active but not `set -e`.

## Why it didn't bite here

The phase's five gospel surfaces (README.md, CLAUDE.md, `skills/war-help/SKILL.md`, CONTEXT.md,
`skills/war-strategy/SKILL.md`) each carry a **paired positive** assert — a `has_i()` new-present pin
on the same surface (four of the five in this suite; the fifth, war-strategy, in its own sibling
suite `war-strategy-structure.test.sh`) — that reds if the file is missing. Wholesale deletion of a
surface still fails the suite via its positive pin even though every one of that surface's absence
pins would pass vacuously. The gate-audit judged this fully mitigated **by construction**, not by any
guard inside `lacks()`/`lacks_i()` themselves.

## The durable rule

An "old wording is absent" (old-absent / retired-anchor) grep-check that reads its target file via a
redirect with no existence guard is unsound in isolation: deleting or renaming the target file makes
every absence pin against it pass vacuously. This is not hypothetical scaffolding-only risk — it is
the generic failure mode of any old-absent/new-absent doc-cascade sweep built on `lacks()`-shaped
helpers. Never author (or approve) an absence-only pin suite for a doc surface without also asserting
at least one positive (presence) pin against the *same* surface path in the *same* run — the positive
pin is what turns "deleted the whole file" from a silent vacuous pass into a hard red.

[[old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently]],
[[lacks-case-sensitive-vs-has-i-presence-pin-asymmetry]],
[[weak-test-assertion-passes-without-feature-being-exercised]]

> archived 2026-08-15: resolved — moved to archive
