---
name: terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it
description: "A phase-close polish task's OWN gate-audit can surface a fresh absorb+phaseClose:true finding on the polish diff itself — but if that polish task is the phase's last round (e.g. a release/final phase), there is no subsequent polish pass to drain the queue, and the finding ships unfixed at land"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-08-06-handoff-schemas-contract@phase-2
  slug: terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it
  phase: 2026-08-05-precision-chain-and-loop-breaker/6.1 +recurrences (latest 2026-09-03-in-band-absorb-default/phase-1 p1-polish)
  keywords: 
    - polish fix reproduces same defect class
    - replacement wording still wrong
    - ordinal attribution fragile
    - positional summary claim fragile
    - campaign-ledger.mjs Fallback ceilings
    - in-band-absorb-default
    - six auditor findings same line
    - CONTEXT.md Re-entry glossary
    - noReentry
    - merge-slot pin-transfer mismatch
    - design.md sole bound stale
    - unrelated finding sinks whole polish batch
    - engine-concurrency-and-pin-transfer
    - routeReauditMinors
    - phase-close
    - polish
    - absorb
    - phaseClose true
    - unresolved finding
    - release phase
    - CLAUDE.md drift
    - done-unmet
    - queue drain
    - last round
    - autoFixable not applied
    - recurring finding not fixed
    - escape guard header
    - assert-no-repo-escape.sh
    - disposition follow-up not absorb
    - mitigation confirmed
    - terminal polish disposition routing
    - mitigation not applied
    - polish-rejected
    - polish-discarded
    - env-died schemas.md gap
    - Homes list
    - Status blurb
    - note disposition
    - mitigation not learned
    - worker returned no result
    - entire phase absorb backlog orphaned
    - no dedicated polish task in build order
    - final post-merge gate-audit finding unfixed
    - ADR 0025 Status line
    - phase-3-integrated-tip
    - assert-budget-raise-cited.sh
    - merge-path floor enumeration
    - engine-reliability-and-filing-fidelity
    - ruledAskRowText
    - foreign string row fixture gap
    - schemas.md afk annotation
    - cross-file mirror partial fix
    - in-run-finding-resolution
    - run.afk producer
    - queued from earlier task gate-audit
  tags: 
    - war
    - phase-close
    - process
    - audit-findings
  created: 2026-08-06
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-09-04T04:25:33.965Z
---

# A terminal phase-close polish task's own absorb finding can ship unfixed

**Code-verified at landed tip `3d3b7913239e6a62e9ee2e485e1d7a9dcd2cf0e4` on
`dev/2026-08-05-precision-chain-and-loop-breaker`**, read via the run-scoped `_refinery`
worktree (`<repo-root>/.claude/war-worktrees/2026-08-05-precision-chain-and-loop-breaker-2026-08-05/_refinery/`).

Phase 6 ("Release") ran a phase-close polish task (`p6-polish`) that correctly fixed the
queued README `## Status` blurb wording finding from task 6.1's audit. But the gate-audit that
then judged the `p6-polish` task's own diff surfaced a **new** finding on that same diff:
`CLAUDE.md`'s floor-family mirror (`skills/war/assets/assert-done-when.sh`'s `done-unmet` route,
landed earlier in this same phase-6 run) was missing from three sibling spots — the named-route
parenthetical (`` `no-test`, `unpackaged` `` with no `done-unmet`), the merge-path floor-script
list (missing `assert-done-when.sh` alongside `assert-test-in-diff.sh` /
`assert-packaging-in-diff.sh` / `assert-no-submodule-mutation.sh`), and the per-phase pipeline
sentence (no land-barrier endstate-check dispatch step named between "Refine" and "post-merge
gate-audit"). That finding was tagged `disposition: absorb, phaseClose: true` — the standard
signal that it should be picked up by phase-close polish.

**It never was.** Verified directly at the landed tip: `CLAUDE.md` still reads (near line 54)
"Floor scripts exit 0/1/2: 1 = the named route (`` `no-test`, `unpackaged` ``)" — no
`done-unmet` — and line 62's merge-path floor list still omits `assert-done-when.sh`. Because
`p6-polish` was itself the LAST phase-close round of the phase (phase 6 is the plan's trailing
release phase — no further task or polish round follows), there was no subsequent polish pass to
drain a queue that only came into existence via this task's own audit. The finding was correctly
routed (`absorb`, `phaseClose: true` is the right disposition in isolation) but had nowhere left
to land within this phase's execution.

**Why this differs from [[phase-close-polish-revert-can-silently-orphan-a-subset-of-absorbed-findings]]:**
that lesson's mechanism is a revert-then-redo losing track of what the reverted commit fixed —
there is always a next round, it just derives the wrong queue. Here there is no revert and no
next round at all: a polish task's audit is free to raise fresh findings against the polish diff
itself, and the phase-close flow has no mechanism to guarantee a further round exists to consume
an `absorb` disposition raised that late. The finding is real, `code-verified`, and non-cosmetic
(a standing-doc drift the release phase's own CLAUDE.md advisory-byte-budget accepted as
byte-cheap) but is currently open, not fixed.

**Pattern to watch for:** an `absorb + phaseClose: true` finding surfacing from the audit of a
phase-close/polish task's OWN diff (not the original task's diff) is a hazard signal — check
whether that polish task is the phase's terminal round before trusting the disposition means
"will be fixed." If it is terminal, the finding needs either a same-round follow-up commit or
explicit escalation/note, not a bare `absorb` that has nowhere to go.

**Locate-cue (verify still present before acting):** `CLAUDE.md`, the "Execution architecture"
section — the "Enum discipline: ..." paragraph (named-route parenthetical) and the "Guard
architecture (hooks/)" paragraph (merge-path floor list); canonical source of the `done-unmet`
route is `skills/war/assets/land-decision.mjs`'s `HARD_ESCALATION_REASONS` export (confirmed
present there at the same pin).

## Recurrence — `2026-08-06-escape-guard-exit-contract`/p1-polish (landed `dev/2026-08-06-escape-guard-exit-contract` @ `a9f238c00928b369f11621cd46b2922a95e54172`, 2026-08-15)

Independently confirms the pattern with a sharper twist: the finding was raised **three separate
times** — task 1.1's own audit, that same task's post-merge gate-audit (`disposition: absorb,
phaseClose: true`), and then *again*, worded near-identically by multiple auditor seats, inside
`p1-polish`'s own audit of the polish diff itself — and it **still shipped unfixed**. The finding:
`skills/red-team/assets/assert-no-repo-escape.sh`'s header comment (near the top, immediately
after the "DETECTION authority (Layer-2/3 doctrine, ADR 0033)" clause) reads "A nonzero result
quarantines the verdict through the self-confound gate — never CLEARED — until the state is
clean." — a routing claim the phase deliberately narrowed everywhere else: `SKILL.md` Step 4 now
reads "**On exit 1**, diagnose every delta by action-provenance FIRST" plus a new "**On exit 2** —
there is no delta to triage" arm, and `skills/red-team/references/lenses.md`'s escape-guard bullet
was rescoped the same way. Every one of the (at least) three audit passes marked this
`disposition: absorb, phaseClose: true, autoFixable: true` — the standard "polish will pick this
up" signal.

**Verified directly at the landed tip** (read via the run-scoped `_refinery` worktree,
`<repo-root>/.claude/war-worktrees/2026-08-06-escape-guard-exit-contract-2026-08-15/2026-08-06-escape-guard-exit-contract-2026-08-15/_refinery/`):
`skills/red-team/assets/assert-no-repo-escape.sh` line 12 still reads the pre-rescope sentence
verbatim, byte-for-byte, unchanged from before the phase. `p1-polish` — this phase's terminal
phase-close round — never applied the fix despite the finding being `autoFixable: true` and
recurring in its own audit output.

**Sharpens the pattern:** it is not enough to check whether a polish-diff-own finding got a fix —
here the *same* substantive finding was raised **before** the terminal polish task ran (queued
from an earlier task's gate-audit) *and* resurfaced inside the terminal polish task's own audit,
and it still went unfixed both times. `autoFixable: true` and repeated recurrence across audit
passes are not evidence a fix landed — only reading the file at the landed tip is. A servitor or
Lead closing out a phase with a `p1-polish`/terminal-round step should specifically re-grep every
`phaseClose: true` finding queued against that round, not just trust the disposition tag once.

**Locate-cue (verify still present before acting):**
`skills/red-team/assets/assert-no-repo-escape.sh`, the header comment block, the sentence
beginning "A nonzero result quarantines the verdict through the self-confound gate".

## Recurrence — mitigation confirmed, `2026-08-06-verdict-adjudication-integrity`/p1-polish (landed `dev/2026-08-06-verdict-adjudication-integrity` @ `10ab150911e7425e16d0944931129593e1410e1`, 2026-08-16)

This run's `p1-polish` gate-audit surfaced a fresh Minor finding on the polish task's own diff (a
`QUALIFIED_HEADERS` comment in `skills/war/assets/reference-link-integrity.test.mjs` overclaiming
completeness) — and, unlike the two prior recurrences above, the auditor **routed it
`disposition: follow-up`, not `absorb`**, with the rationale stated inline: "Not absorbable in this
phase: this IS the phase-close polish task, so a fresh absorb finding on its own diff has no further
round to land it (see the code-verified terminal-polish lesson)." The finding correctly shipped as an
open follow-up rather than a silently-orphaned `absorb`.

**This is the pattern's mitigation working as intended**, not a new instance of the defect: the
"Pattern to watch for" guidance above (check whether the polish task is the phase's terminal round
before trusting `absorb`) was explicitly applied at review time. Recorded so future seats have positive
confirmation that citing this lesson to justify `follow-up` over `absorb` on a terminal polish task's
own-diff finding is the correct, load-bearing move — not merely defensible reasoning.

**Locate-cue:** none — this recurrence is process/disposition evidence from the audit log itself, not a
file referent (the finding's own text, task `p1-polish`, phase 1 of the named plan).

## Recurrence — mitigation NOT applied, `2026-08-06-handoff-schemas-contract`/p2-polish, reverts to
## the original (pre-mitigation) `absorb` routing (2026-08-17)

**Code-verified** via the phase-2 gate-audit/audit log, `auditSha`/`gateHeadSha`
`71ddc088fb558add6d92aab1ec4ec773b9881cd8` (`gateEvidence: true`); commit-graph facts confirmed by
direct `.git/refs`/`.git/logs/refs` reads (see the sibling recurrence's checkout-topology note in
[[phase-close-polish-revert-can-silently-orphan-a-subset-of-absorbed-findings]] for why the final
file content at the true landed tip `43d757d3464d6f248a4c1e9f4a5f37de8fba37a7` was not independently
re-confirmed).

`p2-polish` — this phase's terminal phase-close round — had its own diff audited, and that audit
raised a fresh **Major**, `disposition: absorb, phaseClose: true` finding on the polish diff itself
(the reverted `env-died` schemas.md fix, see the sibling lesson above for the full mechanism). Unlike
the `2026-08-06-verdict-adjudication-integrity`/p1-polish recurrence directly above — where the
auditor correctly cited this lesson and routed `disposition: follow-up` because "this IS the
phase-close polish task, so a fresh absorb finding on its own diff has no further round to land it"
— **this run's auditor used the original, unmitigated `absorb`/`phaseClose: true` routing**, with no
citation of this lesson anywhere in the finding. The task's terminal verdict was `polish-rejected`
(the diff carrying that finding did not merge) followed by a second recorded outcome
`verdict: polish-discarded` with empty findings — i.e. no further round ever consumed the `absorb`
disposition, reproducing the ORIGINAL defect shape (finding ships with nowhere to land), not the
mitigated one.

**Sharpens the pattern further:** the mitigation (citing this lesson to justify `follow-up` over
`absorb` on a terminal polish task's own-diff finding) is **not a durable fix baked into any
auditor's standing behavior** — it appeared once (the `verdict-adjudication-integrity` recurrence)
and then did not recur on the very next terminal-polish-own-diff finding this lesson's own memory
history captures. A servitor/Lead should not assume the mitigation "sticks" across runs; re-surface
this lesson's citation explicitly whenever a terminal polish task's gate-audit is about to route a
polish-diff-own finding, rather than trusting a prior recurrence's correct routing to generalize.

**Locate-cue:** none — process/disposition evidence from the audit log itself (task `p2-polish`,
phase 2 of `2026-08-06-handoff-schemas-contract`); see
[[phase-close-polish-revert-can-silently-orphan-a-subset-of-absorbed-findings]] for the underlying
file-level finding this routing decision concerns.

## Recurrence — mitigation reapplied at `note` disposition, 3x in one round, `2026-08-06-handoff-schemas-contract`/p3-polish (landed `dev/2026-08-06-handoff-schemas-contract` @ `432d9d361f6ebe3c850048bd137250c7744d68a6`, 2026-08-17)

**Code-verified** via the `_refinery` worktree matching the landed tip (gitdir physical path
containing this plan's slug:
`<repo-root>/.claude/war-worktrees/2026-08-06-handoff-schemas-contract-2026-08-17/_refinery/`):
`README.md` lines 363, 364, 366, 367 read exactly as the findings below describe.

`p3-polish` — this phase's terminal phase-close round — correctly absorbed its one queued finding
(adding `schemas.md` to the `#1381` bullet's Homes list, `README.md:366` — confirmed present at the
landed tip). Its own gate-audit then surfaced **three** fresh findings of the identical defect class
(a Status-blurb bullet's `Homes:`/`Home:` list omitting a surface the bullet's own prose names) on
sibling bullets at lines 363, 364, and 367 — and this time **every one of the three was routed
`disposition: note`, not `absorb`**, with each rationale explicitly citing this lesson's
terminal-round-has-no-further-round argument (two also add: the omissions pre-date this diff, so
they are survey stragglers outside the plan's mandated scope, not a worker-introduced defect).

**This is the mitigation working as intended, at a new density.** The prior positive-confirmation
recurrence above (`2026-08-06-verdict-adjudication-integrity`/p1-polish) showed the mitigation firing
once, routed `follow-up`. This occurrence shows it firing three times in one audit round, routed
`note` instead — a second sanctioned terminal-round disposition, not only `follow-up`. **Read
together with the immediately preceding recurrence (`p2-polish`, mitigation NOT applied)**, the
pattern's reliability is confirmed to be per-seat/per-run, not learned: two consecutive phases of the
*same plan* (`2026-08-06-handoff-schemas-contract`, phases 2 and 3) landed opposite outcomes —
phase 2's polish audit used the original unmitigated `absorb` routing (finding shipped orphaned),
phase 3's used the mitigated `note`/`follow-up` routing correctly, three times over. A servitor/Lead
should keep re-surfacing this lesson's citation at every terminal-polish dispatch; do not assume a
fix within one phase of a plan generalizes to that same plan's next phase.

**Locate-cue:** none — process/disposition evidence from the audit log itself (task `p3-polish`,
phase 3 of `2026-08-06-handoff-schemas-contract`); the three findings' own file citations
(`README.md:363`, `364`, `367`) are confirmed at the landed tip above. Related:
[[readme-status-blurb-homes-list-is-editorial-not-exhaustive]] (the substantive defect class these
three `note` findings share).

## Recurrence — sharper failure mode: the terminal polish task never even convenes (`worker returned no result`), orphaning EVERY queued absorb finding from the whole phase, `2026-08-06-references-pointer-integrity`/p1 (landed tip `d712424133e66952e780acba6dbd45c737a6afd5` on `dev/2026-08-06-references-pointer-integrity`, 2026-08-18)

Reported directly by the phase's own audit log (Lead-orchestration data, not independently
Read/Grep-confirmed by me this round — my checkout was on `master` at an unrelated SHA with no live
worktree matching this plan's slug under `.git/worktrees/*`, so I fell to the landed-tip-grounding
gate-audit fallback rung; kept `agent-unverified` since this is a run-outcome fact with no file/code
referent to verify): the phase's `p1-polish` `auditLog` entry reads
`{"task":"p1-polish","verdict":"polish-discarded","branch":"war/2026-08-06-references-pointer-integrity/p1-polish","findings":[],"blocked":"worker returned no result"}`.

This is the `sweepWhy` set / "no panel convened at all" arm from
[[polish-discarded-auditlog-entry-carries-no-findings-critical-major-ride-polish-rejected-instead]]
— but the trigger this time is not a routine "no findings queued" skip, it is the **polish worker's
own dispatch failing to return a result at all**. Tasks 1.1, 1.2, and 1.5's audits (plus that same
gate-audit pass) queued well over a dozen `disposition: absorb, phaseClose: true` findings against
this exact phase (a mis-attributing failure message, a false "verbatim" claim, an un-truthed
`refiner-recovery.md` header, a stale ADR consequences enumeration, etc.). Because the polish task
never convened, **none of them had any chance to land** — this sharpens the parent lesson's pattern
beyond "the terminal round's own gate-audit raises a fresh finding with nowhere to go": here the
terminal round doesn't run at all, so the *entire backlog* of absorb findings queued across the
whole phase ships unfixed, not just the polish diff's own follow-on findings.

**Pattern to watch for, extended:** when checking a phase-close polish task's outcome, a
`verdict: polish-discarded` entry with `blocked: "worker returned no result"` (rather than a benign
`sweepWhy` like "no findings queued") means the phase's entire `absorb`/`phaseClose: true` backlog is
orphaned, not just findings raised against the polish diff itself. A servitor/Lead auditing a phase
close should treat this `blocked` value as materially worse than the other `sweepWhy` shapes and flag
every `absorb, phaseClose: true` finding from every task in the phase as unlanded, not just the polish
round's own.

**Locate-cue:** none — process/disposition evidence from the audit log itself (task `p1-polish`,
phase 1 of `2026-08-06-references-pointer-integrity`).

## Recurrence — no distinct polish task at all; the FINAL post-merge gate-audit's own `phaseClose: true` finding ships unfixed, `realized-absorb-rate`/phase-3 (landed `dev/2026-08-19-realized-absorb-rate` @ `4d93459972a4c4c67b5977064b583cbd41265d31`, 2026-08-20)

**Code-verified** — landed-tip grounding reached rung 2 (worktree lookup): the `_refinery22`
worktree's `gitdir` physical path is
`/Users/ljf/GitHub/WorkAuditRefine/.claude/worktrees/realized-absorb-rate-2026-08-19-r2/_refinery/.git`
(contains the plan slug) and its `HEAD` reads `4d93459972a4c4c67b5977064b583cbd41265d31`,
exactly the threaded landed tip — a direct Read there is `code-verified`-capable.

This phase's audit log carries no separate `*-polish` task at all: the last entry is
`task: "phase-3-integrated-tip"`, `verdict: "gate-audit:approve"`, `authoritative: true` — the
post-merge gate-audit over the whole integrated phase tip. That entry raised a fresh
`severity: Minor`, `disposition: absorb, phaseClose: true` finding on `docs/adr/0025-drift-guard-discipline.md`
line 3: the Status currency parenthetical still names only the `amended 2026-08-02` amendment even
though the same diff appended a *second* `## Amendment (2026-08-19)` section, so a reader consulting
only Status under-counts the ADR's amendment history. The finding's own rationale explicitly judged
the fix mechanical and guardrail-consistent (ADR 0013's amendment, landed in the SAME phase, sets the
in-repo precedent that the Status currency line is extended per amendment, not frozen — see
[[adr-amendment-byte-unchanged-body-mandate-exempts-status-currency-line]]).

**It never was fixed.** Read directly at the landed tip (`docs/adr/0025-drift-guard-discipline.md`,
lines 3-5): the Status parenthetical still reads verbatim `amended 2026-08-02 — a file-disjoint
guard/mirror split takes a `deps` edge, not shared-wave placement; see the amendment below)` — no
mention of `2026-08-19` or the touched-doc amendment appended later in the same file. This phase had
**no dedicated phase-close polish task** in its build order at all (only 3.1/3.2/3.3 plus the
post-merge gate-audit) — sharpening the pattern once more: it is not only "the terminal polish
task's own audit has nowhere to go" and not only "the terminal task never convenes" — here there is
no terminal polish task in the plan's shape to begin with, so a `phaseClose: true` finding raised by
the phase's own final gate-audit has no dispatch slot whatsoever, by construction, not by a run-time
failure. The fail-open coherence sweep this repo's pipeline names (CLAUDE.md: "phase-close coherence
sweep (fail-open polish of `absorb` findings)") evidently did not create one either.

**Pattern to watch for, extended again:** absence of a `*-polish` task in a phase's task list is
itself a signal to check every `phaseClose: true` finding from that phase's final gate-audit by hand
— there may be no queue-drain mechanism convened at all, not even a discarded/rejected one.

**Locate-cue (verify still present before acting):** `docs/adr/0025-drift-guard-discipline.md`, line
3, the `**Status:**` parenthetical.

## Recurrence — near-identical shape to the original example, CLAUDE.md's floor-family mirror again, `2026-08-25-engine-reliability-and-filing-fidelity`/p2-polish (landed `dev/2026-08-25-engine-reliability-and-filing-fidelity` @ `8b1e0ea6d9db99a8042ebaf34766f8c5c7780617`, 2026-08-26)

**Code-verified** — landed-tip grounding reached rung 2 (worktree lookup): the `_refinery28`
worktree's `gitdir` physical path is
`<repo-root>/.claude/war-worktrees/2026-08-25-engine-reliability-and-filing-fidelity-2026-08-26/_refinery/.git`
(contains the plan slug) and its `HEAD` reads `8b1e0ea6d9db99a8042ebaf34766f8c5c7780617`, exactly
the threaded landed tip — a direct Read there is `code-verified`-capable.

The `p2-polish` task's own gate-audit surfaced a fresh `severity: Minor`, `disposition: absorb,
phaseClose: true` finding on `CLAUDE.md`: Phase 2 landed a fifth merge-path floor
(`skills/war/assets/assert-budget-raise-cited.sh`, the Budget-Raise citation floor) wired
unconditionally into all four dispatched merge flavors plus `agents/war-refiner.md` step 7, but
`CLAUDE.md`'s `## Guard architecture (hooks/)` paragraph still enumerated only the prior four
merge-path floors (`assert-test-in-diff.sh`, `assert-packaging-in-diff.sh`,
`assert-no-submodule-mutation.sh`, `assert-done-when.sh`). This is structurally the *same*
defect shape as the original canonical example at the top of this lesson (a new floor's
`CLAUDE.md` mirror omission) — just a different floor name, one plan-run later, in the same
paragraph.

**It never was fixed.** Read directly at the landed tip
(`skills/war/assets/workflow-template.js` §46, this file), `CLAUDE.md` line 62 still reads
"Merge-path floors (`assert-test-in-diff.sh`, `assert-packaging-in-diff.sh`,
`assert-no-submodule-mutation.sh`, `assert-done-when.sh`) run refiner-side pre-merge" — no
`assert-budget-raise-cited.sh`. Grepping the whole file for `assert-budget-raise-cited` or
`Budget-Raise` returns zero matches. `p2-polish` was this phase's terminal phase-close round
(the phase's audit log has no subsequent polish/gate-audit entry after it beyond the unrelated
`phase-2-integrated-tip` post-merge pass, whose own findings do not mention this gap), so —
exactly as the pattern predicts — the `absorb, phaseClose: true` disposition had nowhere left to
land.

**Sharpens the confidence, does not sharpen the mechanism:** this is the same "polish task's own
audit raises a fresh absorb+phaseClose finding with no further round to drain it" shape as the
lesson's very first example (also a `CLAUDE.md` floor-list omission). Contrast with the
`schemas.md` `floor_route` field mirror gap raised in the SAME phase's task-2.2 audit (not a
polish-own-diff finding, so it had a normal downstream round available) — that one WAS fixed by
land (confirmed present in `skills/war/references/schemas.md` at this same landed tip). The
differentiator is not "is it a doc mirror gap" but specifically "was it raised by the terminal
polish round's own audit, with no further round to consume the disposition."

**Locate-cue (verify still present before acting):** `CLAUDE.md`, `## Guard architecture
(hooks/)` paragraph, the "Merge-path floors (...)" sentence.

## Recurrence — two independent instances in one phase, one a cross-file-mirror partial-fix, the other
## a test-coverage gap on a just-landed defensive code arm, `2026-08-27-in-run-finding-resolution`/p2-polish
## (landed `dev/2026-08-27-in-run-finding-resolution` @ `121da3bdae390583c3c50f04d408605398b54460`, 2026-08-27)

**Code-verified** — landed-tip grounding reached rung 2 (worktree lookup): the `_refinery34`
worktree's `gitdir` physical path is
`<repo-root>/.claude/war-worktrees/2026-08-27-in-run-finding-resolution-2026-08-27-r3/_refinery/.git`
(contains the plan slug) and its `HEAD` reads `121da3bdae390583c3c50f04d408605398b54460`, exactly the
threaded landed tip — a direct Read there is `code-verified`-capable.

**Instance 1 — cross-file-mirror partial fix.** Task 2.0's audit queued (`absorb, phaseClose: true`)
a finding that `skills/war/SKILL.md`'s Quick start had no `--afk` producer sentence for the newly
engine-read `run.afk` field. `p2-polish` correctly fixed it — confirmed at the landed tip,
`skills/war/SKILL.md` line 17 reads "`--afk` sets `run.afk = true` for this run ... the engine reads
it as the operator-presence gate on the absorb-by-citation unpark (#1879 RULING 1)" verbatim. But the
**same commit** that added that sentence also touched `skills/war/references/schemas.md` (the sibling
canonical field-reference the SKILL.md fix duplicates) without updating that file's own `run.afk`
annotation: line 248 still reads verbatim "`afk = default for /war --afk;`" with no consumer clause —
confirmed unchanged at the landed tip. `p2-polish`'s own gate-audit raised this exact gap as a fresh
`absorb, phaseClose: true` finding on the polish diff itself (the canonical shape this lesson's
original example names), and since `p2-polish` is this phase's terminal round, it shipped unfixed.

**Instance 2 — test-coverage gap on a just-landed defensive code arm.** Task 2.0's own **gate-audit**
(post-merge, before `p2-polish` ran) queued (`absorb, phaseClose: true`) a finding that
`ruledAskRowText`'s new `typeof row === 'string'` arm (`skills/war/assets/workflow-template.js`,
landed at `ffb8e53`) shipped with no same-diff fixture proving a **foreign** string ruled-ask row is
refused by the provenance floor — the one existing string-row fixture (`workflow-template.test.mjs`,
the S3 `notObject = 'a bare string (plan wtprov-a)'` vector) carries the run's OWN token, so it
exercises the intake-drop path, never the floor's string-scanning path. **Confirmed still true at the
landed tip**: the code arm is present (`workflow-template.js`, `ruledAskRowText`, the `if (typeof row
=== 'string') return { text: row, exempt: false }` line) but no fixture in
`workflow-template.test.mjs` threads a foreign-plan string row through it — grepped for `bare string`,
`notObject`, and the `provenance floor (ruledAsks` test family; only the own-token S3 vector and the
object-shaped foreign-record fixtures exist. This finding was queued from an EARLIER task's
gate-audit (not the polish task's own diff), matching the
[[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]] Recurrence-2/18-style "queued
from an earlier stage, not the polish diff itself" sub-shape already named in this lesson's
`assert-no-repo-escape.sh` recurrence above — and it too shipped unfixed, because `p2-polish` was the
only round left to drain it.

**Sharpens the pattern once more:** both instances land in the SAME phase-close round, and neither is
the "polish task's own audit found a NEW defect on the polish diff" shape from the canonical example —
Instance 1 is a same-commit sibling-file mirror the fix touched-but-missed; Instance 2 is a
pre-queued finding from an earlier task's gate-audit that the terminal round simply never got to. A
servitor/Lead closing out a terminal polish round should check BOTH: (a) did every `phaseClose: true`
finding queued from PRIOR tasks actually get addressed by the polish diff, and (b) did the polish
diff's OWN fix correctly cover every doc/code mirror the original finding implied, not just the one
file named in the `suggested_fix`.

**Locate-cue (verify still present before acting):**
`skills/war/references/schemas.md` line 248 (the `run:` block's `afk` annotation, still Lead-side-only);
`skills/war/assets/workflow-template.test.mjs`, the `provenance floor (ruledAsks` and `ruled-ask intake
(S3` test titles (no foreign-string-row fixture among them).

## Recurrence — glossary enumeration goes stale, `2026-08-30-engine-concurrency-and-pin-transfer`/phase-2
## task 2.1 (landed `dev/2026-08-30-engine-concurrency-and-pin-transfer` @
## `ad440fc0b65dfbfdf797b8f8b83f44b0d4531b50`, 2026-08-30)

**Code-verified** — landed-tip grounding reached rung 2 (worktree lookup): the `_refinery38`
worktree's `gitdir` physical path is
`<repo-root>/.claude/war-worktrees/engine-concurrency-and-pin-transfer-2026-08-30-r3/_refinery/.git`
(contains the plan slug's components) and its `HEAD` reads
`ad440fc0b65dfbfdf797b8f8b83f44b0d4531b50`, exactly the threaded landed tip.

Task 2.1's own audit queued an `absorb, phaseClose: true` Minor finding: the same diff that added
a 4th re-audit source (the merge-slot pin-transfer MISMATCH re-audit, routed via
`routeReauditMinors`'s `noReentry` opt straight to the sweep, unconditional on budget headroom)
left `CONTEXT.md`'s **Re-entry** glossary entry unchanged — it still enumerates re-audit sources
as "(plain, bisection-subset, or a re-entry batch's own)" and still calls the floor-retry reserve
"the SOLE bound," both now inaccurate for this 4th source.

**It never was fixed.** `CONTEXT.md`'s **Re-entry** entry at the landed tip still reads, verbatim,
"a fresh `absorb`-dispositioned finding born at ANY re-audit (plain, bisection-subset, or a
re-entry batch's own)" and "The **floor-retry reserve** (`fixRounds < roundLimit − 2` ...) is the
SOLE bound" — no mention of the merge-slot pin-transfer mismatch source. Independently confirmed
the mechanism itself IS live: `skills/war/assets/workflow-template.js` calls
`routeReauditMinors(r, rbSeats, { noReentry: 'merge-slot pin-transfer mismatch re-audit — the wave
side is over, so re-entry can never dispatch; the sweep is the vehicle' })` at its merge-slot
mismatch arm, and the `noReentry` opt is read and honored in `routeReauditMinors` itself — the
code and the doc genuinely disagree. `p2-polish` (this phase's terminal round, tasked with
draining exactly this queue) was rejected on unrelated grounds (a stale budget-raise citation
comment — see
[[prompt-surface-budget-derivation-comment-regex-checks-shape-not-arithmetic-truth]]) and its
retry was `polish-discarded` — no round ever consumed the disposition.

**Compounds with a second `absorb, phaseClose: true` finding in the same task-2.1 audit** (also
never fixed, same terminal-polish-discarded mechanism): `skills/war/references/design.md` §18
("Disposition routing (ADR 0013)") makes the identical unscoped "that reserve is its sole bound"
claim, now also stale — confirmed unchanged at the landed tip.

**Sharpens the pattern once more:** this is the FIRST recorded instance of the `p2-polish` fix
diff itself being rejected on an UNRELATED finding (see
[[prompt-surface-budget-derivation-comment-regex-checks-shape-not-arithmetic-truth]]), so a batch
of otherwise-correct absorb fixes never got a chance to land at all — not because the polish task didn't run (as in the "worker returned no result"
recurrence above) and not because its own diff raised a fresh finding (the canonical shape), but
because the polish diff bundled multiple fixes and ONE unrelated defect in that same diff sank
the whole batch through `polish-rejected` → `polish-discarded`.

**Locate-cue (verify still present before acting):** `CONTEXT.md`, the **Re-entry** glossary
entry (search `**Re-entry**:`), the sentence beginning "The budget-bounded
return of the ace ladder for a fresh `absorb`-dispositioned finding born at ANY re-audit"; sibling
gap at `skills/war/references/design.md` §18, the sentence "that reserve is its sole bound."

## Recurrence — the polish's OWN replacement wording reproduces the identical misattribution class; ships
## with the ORIGINAL wrong wording after `polish-rejected` then `polish-discarded`,
## `2026-09-03-in-band-absorb-default`/phase-1 p1-polish (landed
## `dev/2026-09-03-2026-09-03-in-band-absorb-default` @ `a06d7260684761001549f958fc71acde414b2a0b`, 2026-09-03)

**Code-verified** — landed-tip grounding reached rung 2 (worktree lookup): the `_refinery45`
worktree's `gitdir` physical path is
`<repo-root>/.claude/war-worktrees/2026-09-03-in-band-absorb-default-2026-09-03/_refinery/.git`
(contains this plan's slug) and its `HEAD` reads `a06d7260684761001549f958fc71acde414b2a0b`,
exactly the threaded landed tip — a direct Read there is `code-verified`-capable.

Task 1.2's own audit queued a Nit, `disposition: absorb, autoFixable: true`:
`skills/war-campaign/assets/campaign-ledger.mjs` line 107's header comment "Fallback ceilings
(both fail-loud-backstopped, never a silent wrong ingest):" lags its own three-bullet list — a
third bullet (code-fence blindness) had been added in the same diff, so "both" undercounts, and
that third bullet is never backstopped at all (it "never throws").

`p1-polish` attempted a fix. Its OWN gate-audit then returned SIX findings against the SAME
line — one Major, four Minor, one Nit — every one pointing at the SAME root cause: the polish's
REPLACEMENT wording ("the first two fail-loud-backstopped … the third bounded") is ITSELF wrong.
Bullet 1 (`isPathShaped` over-acceptance) ends "never a throw" at the pinned blob, so it is NOT
backstopped; only bullet 2 (the parenthetical keep-rule asymmetry) reaches `assertOrderable`'s
fail-loud throw. The polish's fix swapped one wrong count word ("both") for a wrong POSITIONAL
attribution ("the first two") — the identical misattribution defect class in new wording, not a
fix. Verdict: `polish-rejected`. A second `p1-polish` audit-log entry then recorded
`verdict: polish-discarded`, `findings: []`, `branch: war/2026-09-03-in-band-absorb-default/p1-polish`
— no further redo commit ever landed.

**It never was fixed — confirmed at the landed tip.**
`skills/war-campaign/assets/campaign-ledger.mjs` line 107 still reads verbatim `// Fallback
ceilings (both fail-loud-backstopped, never a silent wrong ingest):` — the ORIGINAL flawed
wording from before task 1.2's own finding, not even the polish's (also flawed) replacement.
Because the polish branch was discarded wholesale, neither the original defect nor the polish's
new defect shipped; the pre-finding text survives untouched.

**Sharpens the pattern with a new sub-shape:** every prior recurrence in this lesson has the
polish's fix landing CORRECTLY, with a NEW, unrelated defect then surfacing on the polish diff.
Here the polish's fix was REJECTED before merge because it reproduced the SAME defect class (an
ordinal/positional summary clause over sibling bullets, fragile to bullet count AND to bullet
order) in new wording — five independent auditor seats converged on the same root cause the
original finding named ("attribution," not merely "count"). Also new: six polish-audit findings
in ONE round independently caught the SAME issue, showing the underlying defect class (a
"counts/summarizes its own sibling bullets" comment header) is inherently attribution-fragile,
not merely count-fragile — swapping a stale count word for a stale ordinal claim is not a fix.

**Pattern to watch for, extended once more:** a phase-close absorb fix for a "summary/count
header over enumerated sibling bullets" defect is at high risk of reproducing the SAME
misattribution in new words, because the fix author tends to patch the SURFACE symptom (the count
word) without re-deriving the attribution from each bullet's own text. Before accepting such a
fix, re-read every enumerated bullet the header summarizes and check the fix's claim against each
one individually — do not merely check that the new count word now matches the bullet count.

**Locate-cue (verify still present before acting):**
`skills/war-campaign/assets/campaign-ledger.mjs`, the `extractFiles` header comment block, the
line beginning `// Fallback ceilings (both fail-loud-backstopped`. Related:
[[collectblocks-files-anchor-scan-is-fence-blind-while-sibling-parser-in-same-file-is-fence-aware]]
— a different finding on the same `extractFiles` header block, from the same task 1.2 diff.

> archived 2026-08-17: resolved — moved to archive
