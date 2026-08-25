---
name: full-gates-green-end-state-soft-without-threaded-gate-log-artifact
description: "Full-gates-green End state is SOFT without a threaded gate-log/pin_status artifact"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-08-06-verdict-adjudication-integrity@phase-2
  slug: full-gates-green-end-state-soft-without-threaded-gate-log-artifact
  phase: "red-team-fallback-and-anchor-hygiene/phase-2 (Release, task 2.1) +14 recurrences (latest 2026-08-06-handoff-schemas-contract/phase-3 Release task 3.1 phase-3-end-state gate-audit, 2026-08-17 — fast-forward/linear-range tip-identity sub-shape)"
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
    - STALE-MISMATCH
    - reserved lens
    - mapped file moved between gate and audit
    - four-value pin_status enum
    - gate-pin-status.sh
    - unstamped dispatch
    - recurring unfixed gap
    - phase-close polish commit
    - --ace polish
    - gate captured pre-polish
    - per-task gate log vs integrated-tip gate log
    - GATE_EXIT terminal stamp
    - gate-phase-N.log
    - absence-of-failure inference vs stamped exit code
    - met via corroboration
    - branch-tip SHA equality
    - second corroborating artifact
    - tip-correspondence without stamp
    - fast-forward range
    - linear range no merge commit
    - git branch --contains
  tags:
    - audit-pipeline
    - gate-audit
    - end-state
    - release
    - test-strategy
  created: 2026-07-15
  updated: 2026-08-05
  originSessionId: e11422bd-1b49-4d13-9840-37a67306b3f5
  modified: 2026-08-17T17:06:36.854Z
---

**Local recurrence copy** of the repo-root lesson at `docs/learnings/full-gates-green-end-state-soft-without-threaded-gate-log-artifact.md`
(same slug) — the repo copy is not directly editable by a servitor (D1), so this file carries the
original content plus the new Recurrence 8 below; a future Gate-2 promotion of this file overwrites
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

## Recurrence 8 (2026-07-28, plan `2026-07-28-audit-evidence-precedence`, phase 1, task 1.1 gate-audit) — first captured live STALE-MISMATCH instance (distinct from missing-token and BENIGN-ADVANCE)

Eighth occurrence, a genuinely new sub-shape within the same `pin_status` family Recurrences 4/7
name but had not yet captured live: this seat's `pin_status` token **was** stamped — unlike
Recurrences 1-3/5-7 (missing token) — and its computed value was **`STALE-MISMATCH`**, the third of
the four enum values (`CONFIRMED` / `BENIGN-ADVANCE` / `STALE-MISMATCH` / `ERROR`,
`code-verified` at the landed tip `731d46e88b502009745bfbb07e9655fdd027cd0a` — read via the
`_refinery` worktree matching that SHA, gitdir physical path
`<repo-root>/.claude/war-worktrees/2026-07-28-audit-evidence-precedence-2026-07-28/_refinery/`,
`skills/war/assets/workflow-template.js` line 125 `pin_status: { enum: [...] }` and lines 1638-1639,
the STALE-MISMATCH/ERROR handling prose). Observed HEAD `68d5ff6130fcaeb9c1b73fb0a3378297b4abe4b1`
diverged from the expected gate-HEAD `58bbca9bedb02280addb1c461dbf6079184fac87` **specifically in a
file this task's own audit maps** (`skills/war/assets/skill-doc-contracts.test.mjs`, moved by
sibling task 1.3's D27 row, landed in commits `77b9302`/`68d5ff6` after task 1.1's own gate ran) —
this is the discriminator between `STALE-MISMATCH` and Recurrence 7's `BENIGN-ADVANCE`:
BENIGN-ADVANCE is divergence touching only *unrelated* (later-task) files; STALE-MISMATCH is
divergence touching a file *this task's own mapped test reads*, so the task's execution evidence
for that mapped file is genuinely unreliable at the observed HEAD, not merely stale-but-safe. The
seat correctly downgraded per the reserved-lens rule (verdict stayed `gate-audit:approve`,
`hard:false`, `disposition:note`, `severity:Minor`) and recorded the mandated SOFT-note fields
verbatim (observed HEAD, expected gate-HEAD, the reason string
`"gate-audit worktree not at the integration tip — execution evidence unreliable, downgraded to
SOFT, not a land-halt"`) — matching `workflow-template.js` line 1638's prompt-mandated wording
exactly.

**New nuance over Recurrences 4/7:** a stamped `pin_status` token does not itself guarantee HARD
evidence — `STALE-MISMATCH` and `ERROR` are stamped-but-still-SOFT outcomes, distinct from
`CONFIRMED` (stamped and HARD) and from the missing-token case (Recurrences 1-3/5-7, which is SOFT
for a different reason: no token at all to read). And `STALE-MISMATCH` itself is distinct from
`BENIGN-ADVANCE` (Recurrence 7): both arise from an observed HEAD past the gate-HEAD, but
`BENIGN-ADVANCE` is safe (divergence is in unrelated files) while `STALE-MISMATCH` is not (divergence
touches this task's own mapped file) — the seat cannot substitute a `git show <gate-HEAD>:<path>`
committed-tree read to rescue the verdict to HARD the way Recurrence 7's BENIGN-ADVANCE mitigation
does, because the very question at issue (does the mapped test still look the way it did at gate
time) is what changed. Independently, this same gate-audit pass separately confirmed via `git show
<audit_sha>:<path>` reads that the 1.1-mapped content was unaffected in substance — nothing here
suggests a real defect, only that the HARD determination path was unavailable this pass.

**Confirms:** the four-value `pin_status` enum's SOFT-never-hold rule extends cleanly to
`STALE-MISMATCH`, and the STALE-MISMATCH/BENIGN-ADVANCE distinction (unrelated-file divergence vs.
mapped-file divergence) is the operative test for whether a HEAD-advanced gate-audit seat can
mitigate its way back to HARD (BENIGN-ADVANCE: yes, via committed-tree grounding) or must stay SOFT
(STALE-MISMATCH: the mapped file itself is what's in question).

## Recurrence 9 (2026-07-28, plan `2026-07-28-audit-evidence-precedence`, phase 2 "Release", task 2.1 phase-2-end-state gate-audit) — ninth occurrence, back to the per-task/version-slot shape

Ninth occurrence, the same per-task/version-slot `phase-N-end-state` shape as Recurrences 1/3/5/6:
End state 9 required all four release slots bumped in lock-step to the next free patch above the
live base (`0.14.67` -> `0.14.68`), `version-slots.test.mjs` named as arbiter. The seat split the
condition exactly as prescribed: content half HARD-verified MET (`git show` at the confirmed
`auditSha` `9f35c6a9249a5d162e43fd27a59ebeaeacb56a44` — all four slots read `0.14.68`, the 50-commit
first-parent monotonic-floor window strictly ascending `0.14.19` -> `0.14.68`, README `## Status`
extraction anchor resolves, `## Releasing` byte-identical across the phase); execution half recorded
SOFT — "no stamped `pin_status` and no captured gate-log artifact path... the residual 'the suite
actually ran green' is inference, not gate evidence." Verdict `gate-audit:approve`, `hard:false`,
`gateEvidence:true`, both findings `disposition:note`.

**Confirms:** the SOFT-never-hold split for this End-state shape now holds across nine occurrences
and five-plus campaigns; no new nuance, recorded for occurrence-count/date freshness only.

## Recurrence 10 (2026-08-05, plan `2026-08-04-interview-and-authoring-contract`, phase 1, tasks 1/2/3/5 gate-audits) — highest single-phase density yet (4 of 5 dispatches)

Tenth occurrence, and the densest single-phase cluster recorded so far — four of this phase's five
per-task gate-audit dispatches (tasks 1, 2, 3, 5; only task 4's audit log is untouched by this
pattern) carried no stamped `pin_status` token, each independently downgrading its execution
evidence to SOFT per the standing rule (`gate-audit:approve`, `hard:false`, `disposition:note`,
none HARD). Shapes mirrored the prior recurrences exactly: task 1's seat observed a HEAD five
commits past its own gate-HEAD and corroborated BENIGN-ADVANCE via `git diff --name-only` touching
none of the task's own files; task 2's seat observed the same, corroborated via `git log -- <path>`
showing the task's two mapped files untouched in the intervening range; task 3's seat's observed
HEAD equaled the expected gate-HEAD on a read-only spot-verify (the Recurrence 4 promotion path),
so it stayed SOFT on the missing-token technicality alone despite the SHA match; task 5's seat
observed a HEAD one prior sibling-task-merge past its own gate-HEAD and corroborated via
`git diff --name-only` showing none of the task's five declared files touched.

**Confirms:** the SOFT-never-hold split holds across ten occurrences and eight-plus campaigns, with
no drift in the pattern. **New signal, not a new nuance:** the underlying gap this recurrence
history keeps naming a fix for — `skills/war/assets/gate-pin-status.sh` (code-verified present at
this phase's landed tip, path `skills/war/assets/gate-pin-status.sh`) exists and is capable of
computing the token, but the refiner's evidence-dispatch call site still does not stamp its output
into the gate-audit spawn prompt in the common case — has now gone unfixed across ten recorded
occurrences and eight-plus separate campaigns/plans, several of which (Recurrence 4's own
`suggested_fix`, and independently this phase's tasks 1/2/3/5) explicitly recommend threading the
stamp. This is the kind of persistent, cheap, repeatedly-recommended fix a Lead or operator should
consider escalating out of the recurring-Nit lane into an actual task, rather than continuing to
accrue SOFT notes indefinitely.

## Recurrence 11 (2026-08-15, plan `2026-08-06-shell-pin-helpers`, phase 1, task 1.1 gate-audit) — eleventh occurrence, new sub-shape: gate captured BEFORE a phase-close polish commit, not merely missing a `pin_status` token

Eleventh occurrence, and a genuinely new timing sub-shape distinct from Recurrences 1-10 (all of
which are about a *missing artifact/token* at an otherwise up-to-date tip). Here the plan's End
state 9 ("The full gates are green at the integrated tip, the redaction lint included") **was**
threaded a captured gate-log artifact (`_refinery/.war/gate-1.1.log`) and the seat did use it —
`gate-audit:approve`, `hard:false`, `gateEvidence:true`, `disposition:note` — but the artifact was
captured in task worktree `p1-1.1` over the pre-polish tree (commit `530f9eb`), and a phase-close
`--ace` polish commit (`fd72bb4`, three comment-only lines in
`skills/war-machine/war-pipeline-structure.test.sh`) landed **afterward** with no
`gate-phase-1.log` (integrated-tip full-gate re-run) ever produced. `code-verified` at the landed
tip `44acfe217621a1aa06583d2f83c3ee26d735bfc7` (read via the `_refinery` worktree matching that
SHA, gitdir physical path containing this plan's slug:
`<repo-root>/.claude/war-worktrees/2026-08-06-shell-pin-helpers-2026-08-15/2026-08-06-shell-pin-helpers-2026-08-15/_refinery/`):
`.war/gate-1.1.log` exists (per-task gate, its captured
`scout-manifest-surface.test.sh` lines are `p1-1.1`-scoped); no `gate-phase-1.log` or any
post-`fd72bb4` full-gate artifact exists in that worktree's `.war/` directory.

**What this occurrence adds:** the seat's own mitigation was narrower than Recurrence 4's
integrated-tip spot-verify and Recurrence 6's assertion-outcome reconstruction — it did not
re-derive the *missing* full-gate run at all, and instead corroborated only that the **specific
file the polish commit touched** was re-verified green post-polish, via two other threaded
artifacts that happen to cover it: `endstate-1-1.log` and `endstate-1-7.log` both stamp `tip_sha
fd72bb4...` (the confirmed tip) and both re-run
`skills/war-machine/war-pipeline-structure.test.sh` itself to `0 failure(s)` / exit 0. This is a
**narrower, file-scoped** mitigation, not a full-suite one — it proves the one file the polish
touched didn't break, but says nothing about the ~1129 Node tests or the other 27 shell suites at
the post-polish tip. The seat recorded this honestly (SOFT/note) rather than treating the
pre-polish `gate-1.1.log`'s "1129 pass / 0 fail, 28 shell suites green" as if it covered the
post-polish tip.

**New nuance over Recurrences 1-10:** a captured gate-log artifact with a real evidence trail is
not automatically full-tip evidence — check **which tree it ran over** (its own tip_sha /
scout-manifest lines) against the plan's actually-landed tip before trusting a "gates are green at
land" End state as confirmed-by-artifact. A phase-close polish commit landing after the per-task
gate captured its evidence is exactly the shape where this gap recurs (per
[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] — polish commits
are, by construction, the last thing to land in a phase, so there is structurally no further round
to re-run a full gate over them unless the refiner does so deliberately).

**Confirms:** the SOFT-never-hold disposition holds across eleven occurrences; **new
recommendation for future refiner/Lead attention** (not yet fixed, per Recurrence 10's same
"recurring unfixed gap" framing): a phase-close polish commit that touches non-comment/non-trivial
code should trigger a fresh `gate-phase-<n>.log` capture at the post-polish tip rather than relying
on the pre-polish per-task gate — this specific instance was low-risk (the polish diff was
three comment lines, re-verified green by two other artifacts), but the same shape on a
behavior-touching polish commit would leave "full gates green" resting entirely on inference.

## Recurrence 12 (2026-08-15, plan `2026-08-06-gate-audit-finding-routing`, phase 1, `phase-1-integrated-tip` gate-audit) — twelfth occurrence, new sub-shape: an authoritative, USED artifact still lacks a terminal exit-code stamp

Twelfth occurrence, and a third distinct timing/format sub-shape (after Recurrence 4's missing-token
promotion path and Recurrence 11's pre-polish-tip mismatch): here the integrated-tip seat **was**
threaded a full captured gate-log artifact (`_refinery/.war/gate-phase-1.log`, 2,522 lines) and
**did** treat it as authoritative — `gate-audit:approve`, `hard:false`, `gateEvidence:true` — reading
the node-half aggregate (`pass 1131 / fail 0`) and the bash-half per-file `== gate(bash): <path> ==`
headers straight through the final discovered suite. The gap: the artifact itself carries **no
terminal exit-code stamp** (no `GATE_EXIT: <n>` or equivalent line) the way every sibling
`.war/endstate-<phaseId>-<n>.log` artifact does (each of which ends with an explicit `exit_code: <n>`
line, per [[endstate-check-dispatch-captures-only-one-command-per-condition-row]]'s dispatch). The
seat therefore had to *infer* greenness from the absence of `not ok`/red-suite markers plus the
presence of the final suite's header, rather than reading a stamped exit code — an inference that
held cleanly here (no defect resulted) but is one step weaker than the endstate-check artifacts'
explicit stamp. `code-verified` at the landed tip `20816fd0412788ba11412356f5471f6b1447d682`
(gitdir physical path containing this plan's slug:
`<repo-root>/.claude/war-worktrees/2026-08-06-gate-audit-finding-routing-2026-08-15/_refinery/`):
`.war/gate-phase-1.log` ends at its final suite's `All 10 checks passed` line with no trailing
exit-code token.

**New nuance over Recurrences 1-11:** "artifact present and used" is not the ceiling of this
lesson's family — even a present, authoritative, correctly-read gate-log artifact can still force
the reading seat into an absence-of-failure inference rather than a stamped-exit-code confirmation,
because the refiner's gate tee (unlike the endstate-check dispatch) does not append a terminal
exit marker. Recorded by the auditing seat as a Nit/note for the servitor feed, not a defect —
**recommended fix, still unactioned:** when the refiner's gate tee is next touched, append a
terminal `GATE_EXIT: <code>` line the way `endstate-check:phase-<id>` already does, removing this
one inference step.

**Confirms:** the SOFT-cannot-confirm-without-full-evidence family (Recurrences 1-11) and this new
present-but-uncapped-artifact sub-shape (Recurrence 12) are siblings, not the same shape — track
both when searching this lesson for "is a gate-log artifact actually sufficient evidence" questions.

Related: [[deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold]] (same family: an
evidence-ceiling cannot-confirm is SOFT, not a hold). [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]
(how the four release slots were independently re-verified after this servitor's own cwd proved
stale). [[version-slots-no-cross-slot-consistency-test]] (RESOLVED — the lock-step test this
condition's structural half relies on). [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]]
(why a phase-close polish commit structurally has no next round to re-gate itself).

## Recurrence 13 (2026-08-16, plan `2026-08-06-verdict-adjudication-integrity`, phase 2 "Release",
task 2.1 `phase-2-end-state` gate-audit) — a fourth sub-shape: no in-file `tip_sha` stamp, but the
seat still attested `met` by cross-checking the log's own worktree path against a live branch-tip
SHA, rather than falling back to SOFT

Thirteenth occurrence, and the first where the artifact-absence gap (no in-file tip-correspondence
token) did **not** force a SOFT/cannot-confirm outcome. The "full gates green" condition's evidence
was the per-task `.war/gate-2.1.log` (2,529 lines; no integrated-tip `gate-phase-2.log` was
produced) — `code-verified` at the gate-audit's own pinned `auditSha`
`7377ea7deda56abc498562ad036cae56c5c8b04d`. The seat's own attestation honestly records the gap:
"gate-2.1.log carries no in-file tip_sha stamp and no `pin_status` token was threaded this pass" —
matching every prior recurrence's shape exactly. What differs: instead of defaulting to SOFT on that
gap, the seat independently re-derived tip-correspondence via read-only git — `git rev-parse
war/2026-08-06-verdict-adjudication-integrity/p2-2.1` equals the confirmed integration HEAD, **and**
the log's own paths are rooted in the matching `.../p2-2.1` worktree — then corroborated with a
second, independently tip-stamped artifact (`endstate-2-1.log`, which re-ran `version-slots.test.mjs`
green at the same SHA) before attesting `met`.

**New nuance over Recurrence 12:** Recurrence 12 showed a present-but-uncapped artifact still forces
an *inference* (absence of `not ok` markers) rather than a stamped confirmation, but did not need a
second corroborating artifact because the artifact's own worktree path already matched the
confirmed tip unambiguously. This recurrence goes one step further: the seat explicitly reached for
a **second, independently-stamped artifact** (`endstate-2-1.log`'s own `tip_sha:` line) to
corroborate the ungapped gate log — i.e., "no threaded gate-log tip stamp" is survivable, not
automatically SOFT, when (a) branch-ref-to-worktree-path correspondence is confirmed by read-only
git, **and** (b) a sibling artifact from the same audit round independently stamps the same tip.
Absent either corroborating leg, the established Recurrences 1-11 default (SOFT) should still hold
— this is not a general license to skip the tip-stamp requirement, only a documented instance of how
a seat can honestly earn `met` without one.

**Applies-to checklist for a future gate-audit seat facing this same gap:** before defaulting to
SOFT on a missing `tip_sha`/`pin_status` token, check whether (1) the log artifact's own file paths
are rooted in a worktree whose branch ref you can independently `git rev-parse` against the
confirmed tip, and (2) a second, independently-stamped artifact from the same audit round re-runs
at least one of the same assertions at that tip — if both hold, `met` with the corroboration
explicitly recorded in the evidence field is defensible; if either is missing, SOFT remains the
correct default per Recurrences 1-11.

Related: [[endstate-check-dispatch-captures-only-one-command-per-condition-row]] (the
`endstate-2-1.log` artifact's own `tip_sha:`-stamped format this recurrence leaned on for the second
corroborating leg).

## Recurrence 14 (2026-08-17, plan `2026-08-06-handoff-schemas-contract`, phase 3 "Release", task 3.1
`phase-3-end-state` gate-audit) — fast-forward/linear-range tip identity as an alternative leg-(1)
proof for Recurrence 13's two-leg checklist

Fourteenth occurrence, the same per-task/version-slot `phase-N-end-state` shape as Recurrences
1/3/5/6/9, and again reached `met` (not SOFT) via Recurrence 13's two-leg checklist rather than the
default. No `gate-phase-3.log` (integrated-tip run) was ever produced. **`code-verified`** at the
landed tip `432d9d361f6ebe3c850048bd137250c7744d68a6` (read via the `_refinery` worktree matching
that SHA, located by `git dir` physical path containing this plan's slug:
`<repo-root>/.claude/war-worktrees/2026-08-06-handoff-schemas-contract-2026-08-17/_refinery/`):
`.war/` holds `gate-1.1.log` … `gate-2.2.log`, `gate-phase-1.log`, `gate-p1-polish.log`,
`gate-3.1.log`, `gate-p3-polish.log` — no `gate-phase-3.log` exists, confirming the gate-audit's own
claim. The seat's evidence: the per-task `.war/gate-3.1.log` is fully green (node 1172/1172 pass; the
bash discovery loop reaches its last-sorted `.test.sh` suite with "All 10 checks passed", i.e. no
early abort on a red), and task worktree `p3-3.1`'s `HEAD` equals the confirmed tip — corroborated
via `git branch --contains=<tip>` (lists both the `p3-3.1` task branch and the working branch) **and**
a check that the phase-3 commit range (`<phase-base>..<tip>`) is **linear with no merge commit** (a
fast-forward), so the gated tree provably *is* the integrated tree, not merely reachable from it. A
second, independently tip-stamped artifact (`endstate-3-1.log`, `tip_sha: <tip>`) corroborated by
re-running `version-slots.test.mjs` green at the same SHA.

**New nuance over Recurrence 13:** Recurrence 13's checklist leg (1) was "the log artifact's own file
paths are rooted in a worktree whose branch ref you can independently `git rev-parse` against the
confirmed tip." This occurrence substitutes a stronger, structural proof for that same leg — a
**fast-forward/no-merge-commit range check** — which establishes tip-identity for the *whole gated
tree*, not just the artifact's own path. Both are valid instances of the same "(1) tip-correspondence
+ (2) second corroborating artifact" checklist; a future seat facing a missing integrated-tip gate log
should reach for whichever tip-correspondence proof is available (branch-rev-parse-equality, or
fast-forward-range-linearity), then still look for the second corroborating stamped artifact before
attesting `met`.

**Residual (recorded as a Nit/note by the seat, not escalated):** `gate-3.1.log` itself carries no
in-file `tip_sha` stamp — the tip-correspondence proof is entirely external to the artifact, the same
residual as Recurrences 12-13.

**Confirms:** the SOFT-never-hold default (Recurrences 1-11) and the "two-leg checklist earns `met`
without a threaded stamp" path (Recurrence 13) both continue to hold at a fourteenth occurrence;
fast-forward/no-merge-commit range linearity is now a recorded, valid alternative to
branch-rev-parse-equality for leg (1) of that checklist.
