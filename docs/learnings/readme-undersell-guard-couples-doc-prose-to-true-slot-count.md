---
name: readme-undersell-guard-couples-doc-prose-to-true-slot-count
description: "Version lock-step test can force a README fix outside plan Files list"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: readme-undersell-guard-couples-doc-prose-to-true-slot-count
  phase: drift-guards-for-mirrored-and-asserted-facts/t1.1
  keywords: 
    - undersell guard
    - doc prose count
    - version slots
    - README Releasing
    - files list scope
    - intent-authorized latitude
    - plan file list incomplete
  tags: 
    - war
    - doc-prose-drift
    - release
    - plan-faithfulness
  files: 
    - README.md
    - skills/war/assets/version-slots.test.mjs
  relates: 
    - "[[plan-affected-file-list-doc-completeness-vs-correctness]]"
    - "[[version-slots-no-cross-slot-consistency-test]]"
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

# A new lock-step version test can force a same-task doc-prose fix outside the task's literal Files: list

**Found (code-verified — `README.md` `## Releasing` section, current wording "all four version
slots across three files"; verify still present before acting):** Task 1.1's `Files:` line named
only the new test file (`skills/war/assets/version-slots.test.mjs`), but making the test's third
assertion pass required also editing `README.md`'s `## Releasing` prose, which previously **undersold**
the true slot count — "three version-of-truth files" — when there are actually **four slots
across three files** (`marketplace.json` carries two: `metadata.version` and
`plugins[0].version`). This is the same recurring shape as
[[plan-affected-file-list-doc-completeness-vs-correctness]] (a plan's literal `Files:` line
undercounts what a task must touch to make its own test pass), but the specific flavor here is
narrower and worth naming on its own: **the doc-prose itself asserts a count/enumeration claim
("three files") that a new drift-guard test can indirectly bind to** — get the test passing and
you're forced to also true-up the prose it depends on, even though the test never explicitly
names the prose file.

**Why this was correctly APPROVE, not a plan-faithfulness violation:** the Commander's Intent
explicitly named the README undersell guard as in-scope ("undersell phrase reintroduced fails"),
and the plan's own Task 1.1 slice cited
`[[plan-affected-file-list-doc-completeness-vs-correctness]]` at that exact spot — the file-list
gap was pre-flagged as known-incomplete by the plan author, not an unauthorized scope expansion by
the worker. No sibling Phase-1 task touched `README.md`, so there was no rebase-collision risk
from the extra file either.

**How to apply:** when a new test asserts something is byte-identical/consistent/lock-stepped
across N surfaces and one of those surfaces is prose making a **count claim** ("three files",
"N slots", "differs by exactly one"), expect that surface to need updating too even if it's absent
from the task's literal `Files:` line — check the Commander's Intent / plan-slice comments for a
pre-authorization note before treating it as scope creep, and prefer editing the prose to be
invariant-worded rather than re-asserting a new hardcoded count (see the sibling pattern in
[[version-slots-no-cross-slot-consistency-test]] for the analogous "no snapshot counts, describe
the invariant" move applied to tour prose).
