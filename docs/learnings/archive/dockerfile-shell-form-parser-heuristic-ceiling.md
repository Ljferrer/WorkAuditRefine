---
name: dockerfile-shell-form-parser-heuristic-ceiling
description: "assert-packaging-in-diff.sh Dockerfile parser is shell-form-only — ceilings #1 (continuation) and #3 (O(N*M) reparse) FIXED phase 'Floor fixes' 2026-07-12"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: dockerfile-shell-form-parser-heuristic-ceiling
  phase: packaging-floor-enum-wiring/p1-T1 (origin); Floor fixes/task-1 (fix, 2026-07-12)
  date: 2026-07-06
  keywords:
    - parse_dockerfile
    - shell-form COPY only
    - line-continuation joined
    - Dockerfile heuristic parser
    - ponytail ceiling comment
    - JSON exec form deferred
    - assert-packaging-in-diff.sh
    - Dockerfile-outer loop
    - parse-once inversion
    - floor-script-correctness
  tags:
    - heuristic-floor
    - adr-0006
    - parser-ceiling
  related:
    - defined-but-not-yet-emitted-plan-slice-pattern
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
  updated: 2026-07-12
---

# Dockerfile shell-form parser: a documented heuristic ceiling — two of three closed

**Original instance (packaging-floor-enum-wiring T1, 2026-07-06):** `parse_dockerfile` in
`skills/war/assets/assert-packaging-in-diff.sh` read a Dockerfile line-by-line and dispatched on
the first token per physical line. Three related audit-noted ceilings, all originally graded
Nit/informational:

1. **Line-continuation not joined** (line ~256): a multi-line `COPY \` mis-scoped sources.
2. **Rename (R) status is diff.renames-default-dependent** (line ~110): outcome-equivalent, not a
   gap — **still open, unaddressed.**
3. **O(N×M) re-parse, not memoized** (line ~498): `parse_dockerfile` invoked fresh per
   `(added-file, Dockerfile)` pair even though its output is a pure function of the Dockerfile
   alone.

**Status: ceilings #1 and #3 fixed in phase "Floor fixes" (plan
`docs/plans/2026-07-12-floor-script-correctness.md`, Task 1), landed on
`dev/2026-07-12-floor-script-correctness`, 2026-07-12.** Per that plan's Commander's Intent:
`parse_dockerfile` now pre-joins backslash continuations into logical lines before tokenizing
(closes #1 — a mid-continuation `#` comment and a dangling final-line `\` are both handled per the
audit's confirmed test fixtures), and the main scan loop was inverted to Dockerfile-outer /
added-file-inner so each Dockerfile is parsed exactly once (closes #3 — locked by a test counting
runtime `parse_dockerfile` invocations, not a static call-site count, since a static count-of-1
survives both pre- and post-inversion and would be a vacuous lock; see
[[plan-literal-test-spec-can-be-vacuous-strengthen-under-latitude-rule]]). **Ceiling #2 (rename
status) is untouched — still an open, accepted gap.**

**Provenance caveat:** this checkout's `HEAD` is on an unrelated branch (worktree-lag — see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]), so the fix was **not**
independently re-Grepped here; sourced from the phase's Commander's Intent plus the unanimous
gate-audit `approve` verdicts (`audit_sha a38520a6...`, task-1 gate-audit specifically confirming
the single-call-site + set-equality locks). Before citing exact line numbers or the loop shape,
re-Read `skills/war/assets/assert-packaging-in-diff.sh` on or after
`dev/2026-07-12-floor-script-correctness`.

**Why durable:** this is the *shape* of finding a Dockerfile/build-manifest heuristic parser will
keep generating as the packaging floor is extended. The `# ponytail:` ceiling comment convention +
ADR 0006's heuristic-floor posture is the standing defense — **before filing a Critical/Major
against a narrow-parser gap, check whether the spec already named the fuller-parser case as
deferred.** Two of three named ceilings in one repo did eventually get fixed in a dedicated
"floor fixes" phase — a documented ceiling is not a permanent exemption, just a deferred one.

**How to apply:** grep the target parser file for existing `# ponytail:` / ceiling comments and the
owning spec section before grading a parser gap above Nit; if a ceiling has an owning-lesson slug,
check whether a later phase closed it before assuming it's still open.

> archived 2026-07-15: resolved — moved to archive
