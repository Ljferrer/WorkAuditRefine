---
name: new-floor-script-forces-same-wave-classification-census-touch
description: "A new non-test .sh under skills/war/assets/ always forces a same-wave touch of assert-test-in-diff.test.sh's fail-closed CLASSIFICATION census — a code-boundary decomposition trap when the new floor and the census owner are parallel file-disjoint tasks"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - CLASSIFICATION census
    - assert-test-in-diff.test.sh
    - file-disjointness
    - decomposition
    - code-boundary
    - default-deny
    - new floor script
    - same-wave
  provenance: code-verified
  slug: new-floor-script-forces-same-wave-classification-census-touch
  phase: 2026-08-05-precision-chain-and-loop-breaker/2
  tags: 
    - plan-decomposition
    - floor-scripts
    - gate
  created: 2026-08-05
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-06T06:32:12.032Z
---

`skills/war/assets/assert-test-in-diff.test.sh` carries a fail-closed, default-deny
`CLASSIFICATION` census (case 11a) over **every** non-test `.sh` file under
`skills/war/assets/` — verify still present before acting: the heredoc list at
`skills/war/assets/assert-test-in-diff.test.sh` line ~734 (`assert-done-when.sh exempt:
...`, `assert-guard-specificity-in-diff.sh parity`, etc.). Landing a *new* floor script
with no row in that list turns the census RED (`UNCLASSIFIED <script>.sh`).

This means: **a plan task that adds a new floor script under `skills/war/assets/` always
forces a same-wave edit to `assert-test-in-diff.test.sh`**, even when that file is declared
in a *different*, file-disjoint, same-wave sibling task's `Files:` list (both `deps: []`).
Observed in WAR phase 2026-08-05-precision-chain-and-loop-breaker: Task 2.1's `Files:` list
was `assert-done-when.sh` + `assert-done-when.test.sh` only, but its diff also touched
`assert-test-in-diff.test.sh` (Task 2.2's declared file) to add the new
`assert-done-when.sh exempt: ...` census row. The collision risk (both tasks editing the
same file in the same wave) did not materialize this time — the tasks merged serially with
no conflict — but it is a real code-boundary-decomposition rule violation waiting to bite:
the census gate has no other home, and no merge order lands the phase gate-green without
someone adding the row.

**Decomposition rule going forward:** when a plan phase adds a new floor script to
`skills/war/assets/`, either (a) give that script's own task an explicit `Files:` entry for
`assert-test-in-diff.test.sh` (the census row), or (b) add an explicit `deps` edge from the
sibling task that owns `assert-test-in-diff.test.sh` in that wave, rather than leaving the
census-row edit as an undeclared same-wave collision. See also
[[coupling-comment-restating-grep-pattern-bytes-self-matches-the-sweep]] for a related
census/self-matching gotcha in the same file family.
