---
name: full-gates-green-end-state-soft-without-threaded-gate-log-artifact
description: "A full-gates-green-at-land End state is SOFT at audit time without a threaded gate-log artifact/pin_status token — gate evidence capture is the refiner's job"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-07-24-land-advance-exit-contract-truth@phase-2
  slug: full-gates-green-end-state-soft-without-threaded-gate-log-artifact
  phase: "red-team-fallback-and-anchor-hygiene/phase-2 (Release, task 2.1) +3 recurrences (latest land-advance-exit-contract-truth/phase-2 Release task 2.1, 2026-07-24)"
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
  tags:
    - audit-pipeline
    - gate-audit
    - end-state
    - release
    - test-strategy
  created: 2026-07-15
  updated: 2026-07-24
  originSessionId: e11422bd-1b49-4d13-9840-37a67306b3f5
  modified: 2026-07-24T21:37:05.481Z
---

**Local recurrence copy** of the repo-root lesson at `docs/learnings/full-gates-green-end-state-soft-without-threaded-gate-log-artifact.md`
(same slug) — the repo copy is not directly editable by a servitor (D1), so this file carries the
original content plus the new Recurrence 3 below; a future Gate-2 promotion of this file overwrites
the same-slug repo file.

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

## Recurrence 3 (2026-07-24, plan `2026-07-24-land-advance-exit-contract-truth`, phase 2 "Release", task 2.1)

Fourth occurrence, same shape again: this phase's End state 1 required all four version slots in
lock-step at the next free patch above the live integration base (`0.14.57` -> `0.14.58`,
`version-slots.test.mjs` named as arbiter). The `phase-2-end-state` gate-audit split the condition
exactly as prescribed — `gate-audit:approve`, `hard:false`, one Nit/`disposition:note` finding
covering both halves in one write-up this time (content half ruled MET via direct `git show` at the
pinned `auditSha`; the "green" half explicitly called SOFT/cannot-confirm because "this pass was
threaded no pin_status token and no gate-log artifact path").

**`code-verified`** at the landed tip `9cd713f560d0953a4664610eef2b7d02ef292171` (read via the
`_refinery` worktree matching this SHA, gitdir at
`.claude/worktrees/2026-07-24-land-advance-exit-contract-truth-2026-07-24/_refinery/` — this
servitor's own cwd was a stale sibling worktree on a different branch, per
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]): `.claude-plugin/plugin.json`
`version` and `README.md` `## Status` both read `0.14.58`, and
`skills/war/assets/version-slots.test.mjs` is present at that path — the structural half is
directly confirmed, not just audit-log-trusted.

**Confirms:** the two-finding (or, as here, combined single-finding-covering-both-halves) SOFT
split continues to be the correct, non-escalating resolution across a fourth distinct
plan/campaign — no drift in the pattern, no new lesson warranted, only occurrence-count/date
freshness.
