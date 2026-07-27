---
name: full-gates-green-end-state-soft-without-threaded-gate-log-artifact
description: "A full-gates-green-at-land End state is SOFT at audit time without a threaded gate-log artifact/pin_status token — gate evidence capture is the refiner's job"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-07-24-runbook-and-standing-record-coherence@phase-2
  slug: full-gates-green-end-state-soft-without-threaded-gate-log-artifact
  phase: "red-team-fallback-and-anchor-hygiene/phase-2 (Release, task 2.1) +4 recurrences (latest runbook-and-standing-record-coherence/phase-1-integrated-tip gate-audit, 2026-07-24)"
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
    - integrated-tip gate-audit
    - self spot-verify
    - git rev-parse HEAD
    - pin proof
  tags:
    - audit-pipeline
    - gate-audit
    - end-state
    - release
    - test-strategy
  created: 2026-07-15
  updated: 2026-07-24
  originSessionId: e11422bd-1b49-4d13-9840-37a67306b3f5
  modified: 2026-07-27T03:52:24.313Z
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

## Recurrence 4 (2026-07-24, plan `2026-07-24-runbook-and-standing-record-coherence`, phase-1-integrated-tip gate-audit)

Same missing-artifact shape, a different seat: not the per-task/version-slot `phase-N-end-state`
gate-audit, but the **integrated-tip** gate-audit pass (`task: "phase-1-integrated-tip"`,
`authoritative: true`). The spawn threaded the gate-log artifact path but **no stamped `pin_status`
token** (none of CONFIRMED / BENIGN-ADVANCE / STALE-MISMATCH / ERROR). Per the standing rule this is
a SOFT cannot-confirm, never a hold — but this seat did not stop at recording the gap: it ran the
**optional read-only spot-verify** instead (`git -C <_refinery-worktree> rev-parse HEAD` compared
against the threaded gate-HEAD SHA, plus `git status` clean, plus the captured gate log's own
scout-manifest-surface lines independently naming the same absolute `_refinery` path) and used that
to **fully confirm** — not just SOFT-note — that the tree provably corresponds to the gate-HEAD SHA a
provably-unrun mapped test would have surfaced as HARD. Verdict: `gate-audit:approve`, `hard:false`,
recorded as a Nit/`note` for evidence-chain completeness, with a suggested_fix to thread the
`pin_status` token into the integrated-tip dispatch "the same way the per-task gate-audit seat
receives it."

**New nuance over Recurrences 1-3:** those were all per-task/version-slot End-state audits with no
escape hatch beyond "record SOFT and move on." An **integrated-tip** gate-audit seat has one extra
tool available — it can independently re-derive the pin proof via a read-only `git rev-parse
HEAD`/`git status` spot-check against the worktree the gate log itself names, converting a
missing-`pin_status`-token gap from "unconfirmable, SOFT" into "independently confirmed, HARD path
stayed available." Future integrated-tip gate-audit seats facing the same missing token should
attempt this spot-verify before defaulting to a bare SOFT note.

**`code-verified`** the `pin_status` concept and its four-value enum are live in this repo at the
landed tip `3f136c0327713487768aed59f986b665b07f9cb6` — confirmed present in
`skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`,
`agents/war-refiner.md`, `agents/war-auditor.md`, `CONTEXT.md`, and
`docs/adr/0024-audit-gate-verdicts-integrated-tip-captured-evidence.md` (read via the `_refinery`
worktree matching that SHA, gitdir physical path containing this plan's slug —
`.claude/worktrees/2026-07-24-runbook-and-standing-record-coherence-2026-07-24/_refinery/`).

## Recurrence 5 (2026-07-24/25, plan `2026-07-24-runbook-and-standing-record-coherence`, phase 2 "Release", task 2.1) — back to the per-task/version-slot shape, with self-mitigation spelled out

Fifth occurrence, back to the Recurrences 1-3 per-task/version-slot `phase-N-end-state` shape (not
the integrated-tip variant of Recurrence 4): End state 10 required all four version slots bumped in
lock-step to the next free patch (`0.14.59`), `version-slots.test.mjs` named as arbiter. This pass
carried no stamped `pin_status` token and no captured gate-log artifact path, so the commit body's
"929/929 pass 0 fail, 26 shell suites" claim is unverified evidence — SOFT, never a hold, per the
standing rule; verdict stayed `gate-audit:approve`, `hard:false`, `disposition:note`.

**What this occurrence adds:** the auditor's own rationale spelled out its mitigation chain in full
rather than just citing the rule — confirmed the tip with `git rev-parse`, confirmed
`git status --porcelain` empty in the `_refinery` worktree, and read all four slots directly from
the pinned blobs (all `0.14.59` bare semver, `## Releasing` section satisfying both the absence key
and the presence key). `code-verified` at the landed tip `3444016a48a3d97b5beb21fc9700bd7fa788272d`
(gitdir physical path containing this plan's slug:
`.claude/worktrees/2026-07-24-runbook-and-standing-record-coherence-2026-07-24/_refinery/`):
`.claude-plugin/plugin.json` `version`, `.claude-plugin/marketplace.json` `metadata.version` and
`plugins[0].version`, and the README `## Status` line all read `0.14.59` at that tip, and
`skills/war/assets/version-slots.test.mjs` is present.

**Confirms:** the SOFT-never-hold disposition for this exact End-state shape now holds across five
occurrences and two campaigns; the mechanical-half-confirmable / execution-half-SOFT split is
stable and needs no further pattern refinement, only occurrence-count freshness.

## Recurrence 6 (2026-07-26, plan `2026-07-24-gate-evidence-and-release-integrity`, phase 2 "Release", task 2.1) — sixth occurrence, End state 11

Sixth occurrence, back to the Recurrences 1-3/5 per-task/version-slot `phase-N-end-state` shape:
End state 11 required all four version slots bumped in lock-step to the next free patch
(`0.14.62`) and the full `version-slots.test.mjs` suite (now including the new monotonic floor)
green. The `phase-2-end-state` gate-audit split the condition exactly as prescribed — content half
HARD-verified MET (all four slots read `0.14.62` at the confirmed tip `1e9c287965f57e31acc347bb2153c86b868e5219`,
the land-time base read `0.14.61`, and `git log --all -S0.14.62/-S0.14.63` confirmed `0.14.62` is
the next free patch), execution half recorded SOFT ("this pass was threaded NO gate-log artifact
path and NO pin_status token, so greenness is established by deterministic reconstruction of each
assertion against the confirmed tip, not by reading captured refiner gate output"). Verdict stayed
`gate-audit:approve`, `hard:false`, `disposition:note`.

**What this occurrence adds:** the seat went further than prior recurrences and independently
*reconstructed* the monotonic-floor assertion's outcome by reproducing its exact command
(`git log --first-parent --diff-merges=first-parent -n 50 -p -- .claude-plugin/plugin.json`) against
the confirmed tip and checking the parsed window max against the working tree's `plugin.json#version` —
a deeper mitigation than a bare SOFT note, though still recorded as SOFT rather than promoted to HARD,
since it reconstructs rather than reads captured gate output. This sits between Recurrence 4's
integrated-tip spot-verify (which independently re-derives *pin proof*, promoting to HARD) and
Recurrences 1-3/5's bare SOFT note (no independent reconstruction at all) — a new middle rung:
independently reconstructing an assertion's *outcome* stays SOFT/note even when the reconstruction is
thorough, because it still isn't the refiner's own captured gate-log artifact.

`code-verified` at the landed tip `23f853c9b51c2256a0ea59bfd4762204181724ac` (read via the `_refinery`
worktree matching that SHA, gitdir physical path containing this plan's slug:
`<repo-root>/.claude/worktrees/2026-07-24-gate-evidence-and-release-integrity-2026-07-26/_refinery/`):
`.claude-plugin/plugin.json` `version` reads `0.14.62`, matching the audit's confirmed content.

**Confirms:** the SOFT-never-hold disposition holds across six occurrences and three campaigns; a
seat's independent reconstruction of the withheld artifact's outcome is a valid deepening of the
mitigation but does not itself convert the finding to HARD — only a genuinely captured gate-log
artifact or pin_status token does that (per Recurrence 4's narrower promotion path, which relies on
*pin* re-derivation, not *assertion-outcome* re-derivation).

## Recurrence 7 (2026-07-26, plan `2026-07-24-memory-tooling-hardening`, phase 1, tasks 1.1/1.2/1.3 per-task gate-audits) — three occurrences in one phase, mixed HEAD-equal and HEAD-advanced

Seventh occurrence, and the first time the pattern fires three times in a single phase (one per
task's own gate-audit, not the phase-2-Release/version-slot shape of Recurrences 1-3/5-6): each of
tasks 1.1, 1.2, 1.3 threaded a captured gate-log path but **no stamped `pin_status` token**, so each
seat formally downgraded its execution evidence to SOFT per the standing rule — `gate-audit:approve`,
`hard:false`, `disposition:note`, none HARD. Task 1.3's observed `_refinery` worktree HEAD happened to
equal that task's own gate-HEAD exactly (both `80bf15e0...`), so the practical risk was nil even
though the seat still formally downgraded (no shortcut taken just because the SHAs matched — the rule
is "no token ⇒ SOFT," not "no token unless the SHA happens to match"). Tasks 1.1 and 1.2 both observed
a HEAD several commits ahead of their own gate-HEAD (later sibling tasks' commits already landed by
the time each seat ran) and used the same advisory, non-substituting mitigation as Recurrence 6:
read-only `git diff --name-only <gate-HEAD> <observed-HEAD>` showed the divergence touched only
later-task files (BENIGN-ADVANCE shape), and the seat judged the task's own content from
`git show <gate-HEAD>:<path>` (committed-tree grounding), never the advanced working tree.

**Confirms:** the SOFT-never-hold disposition and the "verify content at the pinned blob via `git
show`, never trust an advanced working tree" mitigation both continue to hold at per-task gate-audit
granularity, including the degenerate case where the observed HEAD happens to equal the gate-HEAD
exactly — no shortcut is taken on a SHA-equality coincidence; the seat still records SOFT absent the
stamped token. No new edge — recorded only to keep the occurrence count/date current for retrieval
confidence.
