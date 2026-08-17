---
name: full-gates-green-end-state-soft-without-threaded-gate-log-artifact
description: "A plan End-state condition of 'full gates green at each phase's land' is SOFT (never a hold) at gate-audit/end-state-audit time when no gate-log artifact or pin_status token was threaded into that audit spawn — full-gate execution is the refiner's captured-evidence responsibility, not the auditing seat's"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: full-gates-green-end-state-soft-without-threaded-gate-log-artifact
  phase: "red-team-fallback-and-anchor-hygiene/phase-2 (Release, task 2.1) +8 recurrences (latest 2026-08-06-doc-cli-consistency-corpus/phase-2 Release task 2.1, 2026-08-16)"
  keywords:
    - full gates green
    - gate-log artifact
    - pin_status
    - end-state audit
    - gate-audit
    - SOFT finding
    - cannot-confirm
    - refiner-owned
    - version-slots
    - release phase
    - mechanical bump
    - version-slots.test.mjs arbiter
    - lock-step equality
    - orphaned task worktree
    - worktree fallback unavailable
    - artifact recovery
    - gate-2.1.log
    - .war directory ignored files
    - gate-phase-2.log missing
    - single-task fast-forward phase
    - branch identity reconstruction
  tags:
    - audit-pipeline
    - gate-audit
    - end-state
    - release
    - test-strategy
  created: 2026-07-15
  updated: 2026-08-16
  originSessionId: e11422bd-1b49-4d13-9840-37a67306b3f5
  modified: 2026-08-17T06:32:49.637Z
---

# "Full gates green" as an end-state condition is SOFT, not HARD, without a threaded gate-log artifact

**Context (audit-log-sourced, `phase-2-end-state` gate-audit, task 2.1, verified against
`.claude/war-worktrees/2026-07-14-red-team-fallback-and-anchor-hygiene-2026-07-16/p2-2.1/` — see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] Recurrence 6 for how that path was
located after the servitor's own cwd proved stale):** the plan's End-state condition 11 read "Full
gates green at each phase's land (`node --test 'skills/**/*.test.mjs'` plus the composed gate's
shell-suite discovery loop); all four release slots bumped together to the next free patch."
`skills/war/assets/version-slots.test.mjs` genuinely exists and all four release slots (`plugin.json#version`,
`marketplace.json#metadata.version`, `marketplace.json#plugins[0].version`, README `## Status`
token) genuinely read `0.14.40` at that tip — code-verified directly. But the *executable*
"full gates green" half of the condition — actually running `node --test` and the shell-suite gate
— is the **refiner's** captured-evidence responsibility during Refine/Land, not something threaded
as a gate-log path or `pin_status` token into this end-state audit's own spawn. The gate-audit
seat therefore correctly could not *itself* re-confirm the runtime-execution half from artifacts in
its own prompt.

**The pattern:** when an end-state/gate-audit seat is missing the specific execution artifact
(gate log path, `pin_status` token, captured test-run output) needed to re-confirm one clause of a
plan's End-state condition, and that clause's *responsibility* legitimately belongs to a different
pipeline stage (here: the refiner's per-task and per-phase gate execution, not the auditing seat),
record the resulting cannot-confirm as a **Nit-level, disposition `note`, SOFT** finding — never a
HARD hold. This mirrors [[deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold]]'s
family: a seat's evidence ceiling bounds what it can confirm, and a real capability gap in *this*
audit's own prompt is not the same thing as the underlying claim being false or unmet. Corroborate
instead from what IS confirmable: the mechanical parts of the condition (the version-slots
lock-step test present and passing by content inspection, the four slots byte-consistent) — that's
the load-bearing evidence for a purely mechanical release-only task; the runtime gate-log is
refiner-owned color, not proof this seat needed to reproduce.

**How to apply:** for any future plan End-state condition that bundles a "gates ran green" clause
with a separate structural/content clause (e.g. "N things bumped AND gates green"), an end-state
audit seat without a threaded gate-log/pin_status artifact should split the condition: confirm the
structural half directly, and record the unconfirmable execution half as SOFT/note — never
escalate to HARD on a missing-artifact basis alone when the responsible stage (refiner) already
owns that evidence elsewhere in the pipeline.

Related: [[deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold]] (same family: an
evidence-ceiling cannot-confirm is SOFT, not a hold). [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]
(how the four release slots were independently re-verified after this servitor's own cwd proved
stale). [[version-slots-no-cross-slot-consistency-test]] (RESOLVED — the lock-step test this
condition's structural half relies on).

## Recurrence 1 (2026-07-17, campaign learnings-recipe-drift-sweep, phase 2 "Release", task 2.1)

Identical pattern, a different campaign and a different release: End state 10 required all four
version slots to bump in lock-step (`0.14.44` -> `0.14.45`), with `version-slots.test.mjs` named as
the arbiter. The `phase-2-end-state` gate-audit split the condition exactly as this lesson
prescribes — a HARD-verified structural Nit ("all four slots read `0.14.45` at the pinned SHA via
`git show`, moved together in the single release commit") plus a second, SOFT Nit explicitly citing
this lesson's slug by name in its own rationale ("Per ... the recorded lesson
full-gates-green-end-state-soft-without-threaded-gate-log-artifact, this is a SOFT note, never a
hold"). Verdict stayed `approve`, `hard: false`, both findings `disposition: note`.

**Confirms:** an auditing seat citing this lesson by name to justify a SOFT (not HARD) disposition
is the intended reuse — the pattern generalizes across campaigns/releases as designed, and a future
auditor doing the same split for a version-slot-bump End-state condition without a threaded
gate-log/`pin_status` artifact should follow the identical two-finding shape (one HARD structural
Nit, one SOFT execution-evidence Nit) rather than inventing a new resolution each time.

## Recurrence 2 (2026-07-17, campaign aftermath-class1-gate-evidence, phase 2 "Release", task 2.1)

Third occurrence, same two-finding shape again: End state 10 (`0.14.45` -> `0.14.46`,
`version-slots.test.mjs` named arbiter), `gate-audit:approve`, `hard:false`, both findings
`disposition:note`. The HARD structural Nit this time also included an explicit "next free patch
unclaimed" proof (`refs/tags/0.14.46` does not resolve; `git log -S0.14.46 -- plugin.json` returns
exactly one commit) and a delete-and-trace confirmation that the arbiter test is non-vacuous — both
are one-off audit-methodology detail for *this* release, not a new durable pattern (no separate
lesson written for them). No change to the rule; recorded only to keep the occurrence count/date
current for retrieval confidence.

## Recurrence 3 (2026-07-22, campaign auditor-guard-ergonomics, phase 2 "Release", task 2.1)

Fourth occurrence, same shape again but a single-patch bump this time (`0.14.48` -> `0.14.49`,
not a lock-step-from-different-base case): `phase-2-end-state` gate-audit returned
`gate-audit:approve`, `hard:false`, one Nit `disposition:note` citing the missing `pin_status`
token / gate-log artifact as a SOFT cannot-confirm, at pinned `auditSha:
54a413970eda9d2de216e4ebee6caae38811c47f`. Independently code-verified (this servitor, via the
phase's own task worktree resolved through `.git/worktrees/p2-2.11/gitdir` after the servitor's own
cwd proved stale — see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]): all four
slots (`plugin.json#version`, `marketplace.json#metadata.version`, `marketplace.json#plugins[0].version`,
README `## Status` token) read `0.14.49` at that tip, base at merge-base `40d81e5` reads `0.14.48`.
No new edge — recorded only to keep the occurrence count/date current for retrieval confidence, per
Recurrence 2's stated purpose.

## Recurrence 4 (2026-07-22, campaign audit-adjudication-threading, phase 2 "Release", task 2.1)

Fifth occurrence, same shape again, another single-patch bump (`0.14.49` -> `0.14.50`, base
`f87c7ef` — the auditor-guard-ergonomics 0.14.49 release one plan below in this campaign's stack):
`phase-2-end-state` gate-audit returned `gate-audit:approve`, `hard:false`, one Nit
`disposition:note` at pinned `auditSha: eed08effec9b9e649b75e0271fbfe6ca5a6592a7`, explicitly split
exactly as this lesson prescribes — a HARD-verified structural half ("all four slots read
`0.14.50` at the pinned SHA, moved together in a single 4-ins/4-del commit, next free patch above
the `0.14.49` base") plus a SOFT half citing the missing gate-log artifact/`pin_status` token
("the arbiter is green" sub-clause could not be executed read-only and no gate-log artifact was
threaded — SOFT on that sub-clause only, resting on the refiner's gate report). Task 2.1 itself:
`approve`, zero findings, zero fix rounds. No new edge — recorded only to keep the occurrence
count/date current for retrieval confidence, per Recurrence 2's stated purpose. Servitor's own
session worktree (`war-campaign-resilience-roadmap`, unrelated to the landed release branch) reads
a stale `0.14.48` in `.claude-plugin/plugin.json` — expected per
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]], not used as the version-claim
source here; the `0.14.50` claim rests solely on the gate-audit's pinned-`audit_sha` evidence.

## Recurrence 5 (2026-07-22, campaign war-campaign-resilience-roadmap, phase 2 "Release", task 2.1)

Sixth occurrence, same shape again: End state 11 (`0.14.51` -> `0.14.52`, base = the phase-1
learnings tip `91f12a3`, `version-slots.test.mjs` named arbiter). `phase-2-end-state` gate-audit
returned `gate-audit:approve`, `hard:false`, one Nit `disposition:note` at pinned `auditSha:
f86ebe591c2d53de39a6d786e2f16f4dd5c879d6`, split exactly as this lesson prescribes: a HARD
structural half (tip confirmed via `rev-parse` with a clean `git status --short`; all three arbiter
arms — extraction fail-closed, lock-step equality at `0.14.52`, README Releasing prose naming "all
four version slots" — statically verified against the pinned blobs) plus a SOFT half citing the
absent `pin_status` token / gate-log artifact for the executed-gate ("... passes") sub-clause.

**New wrinkle vs Recurrences 1-4:** in those, the servitor independently re-verified the claimed
slot values by resolving the phase's own now-orphaned task worktree through its `.git/worktrees/*/gitdir`
pointer file (a plain Read, not Bash — see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]).
This time no such worktree existed on disk at all — `git worktree` metadata is removed once a task
merges, and neither the session worktree (`<session-worktree>`, still reading `0.14.48`) nor the
main checkout (`<repo-root>`, also `0.14.48`) had a path forward to the landed content. The
independent-reverification fallback is therefore itself opportunistic, not guaranteed available —
when it's gone, the servitor has no ground-truth path beyond the audit log's own pinned-`auditSha`
claim, which is exactly the gap this lesson's SOFT-not-HARD rule already covers. No change to the
rule; recorded to keep the occurrence count/date current and to flag that the worktree-fallback
verification path is unreliable across sessions, not a standing capability.

## Recurrence 6 (2026-07-26, plan `2026-07-24-memory-tooling-hardening`, phase 2 "Release", task 2.1) — this time the artifact WAS recoverable by hand

Seventh occurrence, same shape, but a variant outcome from Recurrence 5: `phase-2-end-state`
gate-audit returned `gate-audit:approve`, `hard:false`, one Nit `disposition:note` at pinned
`auditSha: 1b3005d05e3ffe92a2c1b462e0926eaaea1c258e`, again citing the missing `pin_status`
token/gate-log path in its own spawn prompt. Unlike Recurrence 5 (worktree fallback gone,
independent reverification impossible), the seat itself did the recovery work here: it enumerated
the refinery worktree's ignored files and found `.war/gate-2.1.log`, then hand-verified pin
equality (`war/2026-07-24-memory-tooling-hardening/p2-2.1` resolves to the same landed tip as the
integration branch, and that task worktree's `git status --porcelain -uno` is clean) — so the HARD
path stayed available and the End-state condition was verified MET, not SOFT, despite the threading
gap. `code-verified` (this servitor) — `.war/gate-2.1.log` independently confirmed present at
`<repo-root>/.claude/worktrees/2026-07-24-memory-tooling-hardening-2026-07-26/_refinery/.war/gate-2.1.log`
via the refinery worktree resolved through `.git/worktrees/_refinery5/gitdir` (detached HEAD
`e50e3ca47f42181fa5715251f08be099118516f9`, matching the plan's threaded landed tip exactly).

**New wrinkle:** the artifact-recovery fallback (enumerate the refinery worktree's own `.war/`
directory for a `gate-<taskId>.log`) is opportunistic and worktree-lifetime-bound like the
worktree-fallback in Recurrence 5, but when it DOES land inside the reap window, it fully resolves
the threading gap without escalating — a gate-audit seat should attempt this recovery before
defaulting to a bare SOFT note, and should still record the threading gap itself (the spawn prompt
should have carried the artifact path/pin_status token in the first place — this is a recurring
Lead-side prompt-construction gap, not a one-off). No change to the core SOFT-not-HARD rule when
recovery genuinely fails; this just shows recovery sometimes succeeds and, when it does, the
condition should be recorded MET rather than downgraded reflexively.

## Recurrence 7 (2026-08-02, plan `2026-08-02-redteam-doctrine-and-guards`, phase 2 "Release",
task 2.1) — again recoverable by hand, again scored MET rather than SOFT

Eighth occurrence, same variant outcome as Recurrence 6: `phase-2-end-state` gate-audit returned
`gate-audit:approve`, `hard:false`, one Nit `disposition:note` at pinned `auditSha:
46d42be94b551c0327a22bcb591ab59763644a95`, again citing that neither a `pin_status` token nor the
gate-log artifact path were threaded into its own spawn prompt. The seat again did the recovery
work itself two ways: (1) it located the artifact at the conventional refiner path
`_refinery/.war/gate-2.1.log` and read it green throughout (1029/1029 JS tests, both named shell
suites green, `resolveGate`'s discovery loop completed); (2) it spot-verified that both the
`_refinery` worktree and the task worktree sat at the same commit (`46d42be`) with a clean
`git status --porcelain`, and that the integration branch decorated the identical commit
(fast-forward, single-task phase). `code-verified` — independently reconfirmed by this servitor at
the landed tip `06efa2b925caec1fafd1f019e32e32517e114250`:
`.war/gate-2.1.log` is present and readable at
`<repo-root>/.claude/war-worktrees/2026-08-02-redteam-doctrine-and-guards-2026-08-02/_refinery/.war/gate-2.1.log`
(resolved via `.git/worktrees/_refinery3/gitdir`, `HEAD` detached at the exact landed tip).

**New wrinkle, worth generalizing:** the seat's own rationale named a **residual** even after
recovery succeeded — the artifact carries no header line stamping the git HEAD it ran against, so
the tree↔artifact binding still rests on the out-of-band worktree spot-verify plus a coincidental
match against the commit body's own test count, rather than on the artifact being self-identifying.
The seat's own suggested fix (repeated verbatim across this and prior recurrences without yet being
adopted): have the gate-capture step write a first line stamping the gate-HEAD SHA and worktree
path into `_refinery/.war/gate-<taskId>.log`, and thread that path plus a `pin_status` token into
the `execution-evidence` spawn prompt — closing both the threading gap this whole lesson tracks
and the self-identification gap this recurrence adds. No change to the core SOFT-not-HARD rule;
recorded to keep the occurrence count/date current and to underline that the recovery-by-hand
pattern from Recurrence 6 is now itself a **repeating, unmechanized** manual step at Gate-2 time,
not a one-off — a candidate for a `type: project` fix landing in a future phase rather than being
re-discovered by a fresh auditor seat each release.

## Recurrence 8 (2026-08-16, plan `2026-08-06-doc-cli-consistency-corpus`, phase 2 "Release",
task 2.1) — recoverable by hand again, but the recovery itself depends on a single-task
fast-forward phase shape, named explicitly as a residual this time

Ninth occurrence, same variant outcome as Recurrences 6/7 (recoverable, scored MET not SOFT), but
the gate-audit seat's own rationale is sharper about *why* the recovery is sound here and would not
be elsewhere. `phase-2-end-state` gate-audit returned `gate-audit:approve`, `hard:false`, one Nit
`disposition:note` at pinned `auditSha: d6ea82b82faf10c61027b9540edd68a3b3076aa4` — `code-verified`
(this servitor, `_refinery16` worktree whose `HEAD` `ccdf5ad059eb5ac1fe76fca4d72914217e96aa3e`
equals the threaded landed-tip anchor exactly): only `.war/gate-2.1.log` exists under
`<repo-root>/.claude/war-worktrees/2026-08-06-doc-cli-consistency-corpus-2026-08-16/_refinery/.war/`
(alongside `gate-1.1.log`, `gate-1.2.log`, `gate-1.3.log` from phase 1) — no separate
`gate-phase-2.log`, and (Recurrence 7's still-unadopted residual) `gate-2.1.log` itself carries no
stamped tip SHA as its own first line, unlike the sibling `.war/endstate-2-1.log` artifact whose
first line reads `tip_sha: d6ea82b8...`.

**The seat's own rationale states the reconstruction's precondition explicitly, not just its
result.** The tip-correspondence proof rested on branch identity, not an artifact stamp: `git
rev-parse war/2026-08-06-doc-cli-consistency-corpus/p2-2.1` and the checked-out
`integration/.../phase-2` both resolved to the same commit, and `git log <base>..<that-commit>` was
exactly one commit — so the gated tree *is* the integrated tip's tree only because phase 2 was a
**single-task phase whose merge was a fast-forward** (no distinct integration-merge commit sits
between the gated SHA and the tip). The seat named the generalization directly: "On a multi-task
phase the same evidence shape would have forced a SOFT cannot-confirm" — because a fast-forward
guarantee doesn't hold once a second task's merge commit (or a rebase) sits between the per-task
gate log's pinned SHA and the phase's actual integrated tip.

**New wrinkle vs Recurrences 6/7:** those two showed the artifact-recovery fallback *succeeding*
without naming the condition under which it could fail; this occurrence is the first to state that
condition as a load-bearing precondition of the MET verdict rather than an incidental detail — a
future gate-audit seat on a **multi-task** Release-adjacent phase (or any phase where the per-task
gate log's SHA might not equal the phase's own integrated tip) should not assume the same
branch-identity reconstruction transfers; it should downgrade to SOFT exactly as Recurrences 1-5
did when no recovery path was available at all. Confirms Recurrence 7's still-unadopted suggested
fix (stamp the gate-capture step's first line with the gate-HEAD SHA and worktree path) would close
this residual for every phase shape, not just single-task fast-forwards.

> archived 2026-07-21: resolved — moved to archive
