---
name: packaging-floor-is-a-noop-without-a-dockerfile-and-ignores-modified-paths
description: "Packaging floor noop: no Dockerfile, Mod skipped"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: packaging-floor-is-a-noop-without-a-dockerfile-and-ignores-modified-paths
  phase: fail-loud-ingest-boundaries/t1
  keywords: 
    - requiresPackaging
    - assert-packaging-in-diff.sh
    - packaging floor no-op
    - no Dockerfile trivial exit 0
    - Added Renamed only not Modified
    - over-declared plan flag benign
  tags: 
    - packaging-floor
    - plan-faithfulness
    - audit-grading
  created: 2026-07-08
  originSessionId: 67b9a13b-7f13-4b27-bc54-8459e04f97b5
---

# `requiresPackaging:true` with no packaging surface is a benign over-declaration

**Instance (fail-loud-ingest-boundaries/t1, 2026-07-08):** Phase 1 Task 1/2 of
`docs/plans/2026-07-08-fail-loud-ingest-boundaries.md` both carry `requiresPackaging:true`
even though their `Files:` lists have no packaging artifact (this repo has no Dockerfile at
all). Auditor graded it Nit/note, not a plan-faithfulness violation, because the floor
verifiably no-ops in this shape.

**Verified at `skills/war/assets/assert-packaging-in-diff.sh`** (re-verified at master
2026-07-13, both shapes still `exit 0`):
- The empty-`dockerfiles` early exit after the `is_dockerfile` discovery walk over `git ls-tree`:
  no `Dockerfile` / `Dockerfile.*` / `*.Dockerfile` anywhere in the branch tree → `exit 0`
  immediately, before any per-file analysis.
- The diff status-collection loop over `git diff --name-status` only collects `A*` (added) and
  `R*`/`C*` (rename/copy-target) paths; `M`, `D`, `T`, `U`, anything else is explicitly skipped
  (`continue`) — a purely-Modified diff can never flag even with a Dockerfile present (empty
  `added_files` → `exit 0`).

A `--advise-vacuous` flag now emits a stderr advisory on exactly these two vacuous shapes
without changing the exit code.

**Why durable:** a plan author (or `/war-strategy` conversion) can over-declare
`requiresPackaging:true` defensively without it ever blocking a merge or costing a fix round,
*as long as* the target repo has no Dockerfile matching the discovery set, or the task's diff
is Modified-only. Do not grade this above Nit/note on its own — check the two conditions above
before escalating a bare "flag doesn't match Files list" packaging finding.

**How to apply:** when auditing a `requiresPackaging` flag against a task's file list, verify
(a) whether any Dockerfile exists in the target repo at the branch tip (`git ls-tree -r
--name-only <branch>` filtered per `is_dockerfile`), and (b) whether the diff's changed paths
are Added/Renamed/Copied vs purely Modified — both must be checked before the flag/coverage
mismatch is treated as more than informational.

Related: [[dockerfile-shell-form-parser-heuristic-ceiling]] (same floor script, different
finding class — parser ceiling vs flag over-declaration).
