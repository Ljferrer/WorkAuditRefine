---
name: release-blurb-overstates-guard-semantics
description: "Guard blurb: say 'refuse diffs touching X' not repos"
metadata:
  node_type: memory
  type: project
  keywords: [Status section wording, trigger surface, diff vs repo, fail-closed phrasing, submodule refuse, prose nit, operator misinformation, absolute claim vs residual exception, ADR carve-out, fresh-env re-run, unconditional vs conditional emission, near-miss diagnostic, assert-test-in-diff.sh, stderr guard clause, umbrella clause, heterogeneous guard shapes, realpathSync, campaign-ledger, fileURLToPath, No behavior change label, bolded lead-in, colon-scoped enumeration, release headline contradiction, anti-overclaim device, appositive antecedent ambiguity, dangling modifier, itself unchanged, nearest-noun misattachment, D6 verbatim-capture contract]
  provenance: code-verified
  promoted: dev/2026-07-24-recovery-re-merge-dispatch-coherence@phase-2
  slug: release-blurb-overstates-guard-semantics
  phase: "submodule-inc1/T4 +6 recurrences (war-campaign-resilience-roadmap/phase-2 Release task 2.1, 2026-07-22; test-floor-target-repo/phase-2 Release task 2.1, 2026-07-22; cli-main-guard-normalization/phase-2 Release task 2.1, 2026-07-23; runbook-and-standing-record-coherence/phase-2 Release task 2.1, 2026-07-24; recovery-re-merge-dispatch-coherence/phase-2 Release task 2.1, 2026-07-24; drift-guard-and-floor-diagnostic-hardening/phase-2 Release task 2.1, 2026-07-24/25)"
  tags:
    - war
    - release
    - readme
    - status-section
    - guard
    - submodule
    - plan-repo-mismatch
    - prose-precision
  relates:
    - "[[release-status-is-replace-slot-not-empty-field]]"
    - "[[release-bump-slots-canonical-no-badge]]"
    - "[[gitmodules-working-tree-read-vs-ref-snapshot]]"
  created: 2026-06-30
  originSessionId: 0e364ee5-f0b3-47f6-a9e4-9bf2dd555733
  modified: 2026-07-26T03:54:44.321Z
---

# Release blurb prose overstates guard semantics

**Local recurrence copy** of the repo-root lesson at `docs/learnings/release-blurb-overstates-guard-semantics.md`
(same slug) — the repo copy is not directly editable by a servitor (D1), so this file carries the
original content plus the new recurrence below; a future Gate-2 promotion of this file overwrites
the same-slug repo file.

**Rule** — when drafting the `## Status` blurb for a guard task, describe the **trigger surface** (what property of the task's *diff* causes the refuse), not repo topology. "Refuse diffs that touch X" is almost always more precise than "refuse repos that contain X". Fail-closed template: "Changes that X are blocked; safe-to-ignore diffs are unaffected." Blurbs favor short concrete phrasing, so writers unconsciously upgrade the restriction from the mutation surface to the topology surface — a prose Nit, never a land-halt, but it accumulates as operator misinformation across releases.

Instance (submodule-inc1/T4, v0.7.8): the blurb said "agents refuse to process repos that contain git submodules", but the landed guard (`skills/war/assets/assert-no-submodule-mutation.sh`) refuses **diffs touching submodule entries** (paths in `.gitmodules` or gitlink entries) and is a no-op on a submodule-free repo. Auditor rated it a Nit; suggested "refuse to process changes that touch git submodules". The offending blurb is gone from the live README — `## Status` is a replace-in-place slot ([[release-status-is-replace-slot-not-empty-field]]).

See [[gitmodules-working-tree-read-vs-ref-snapshot]] for the companion reading-context hazard.

## Recurrence 1 (2026-07-22, campaign war-campaign-resilience-roadmap, phase 2 "Release", task 2.1)

A distinct instantiation of the same family, this time not trigger-surface-vs-topology but
**absolute claim vs a documented residual exception**: task 2.1's audit (`disposition: note`,
Nit, not required to fix) flagged the release blurb's opening parenthetical — "a positive proof,
since the classifier re-ran the same tip green in a fresh environment moments earlier" — as stated
without exception, while the auditor's rationale cites an ADR (numbered "0040" in the audit
rationale) recording a "Residual, accepted" carve-out: the `REL_GUARD_PRECONDITION_FAILED`
short-circuit classifies `environment` **without** a fresh-env tip re-run, so a retry triggered by
that marker has weaker pass-prediction than the blurb's unqualified claim implies.

**Referent verified at Gate-2 (Lead, 2026-07-22).** The servitor's write-time absence note claimed
no accessible checkout carried an ADR above 0038 and flagged the referent unverified. That note was
itself a stale-checkout artifact and is **superseded**: at the landed phase-2 tip
`a2ab68ddef373e463da7f8b6f116855d1e68dcad`, `docs/adr/0040-environment-class-gate-failures-earn-one-retry.md`
is present and the `## Status` blurb carrying the flagged parenthetical is the live `**0.14.52**`
text. Both referents are confirmed; this recurrence's specific claim is settled, not provisional.

This is itself an instance of [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] — and
a pointed one, since the landed-tip anchor threading meant to mitigate it had already shipped: the
anchor tells the servitor *which* SHA is authoritative but cannot conjure a checkout containing it,
so when Refine has already reaped the task worktrees the servitor is left with no readable tree.
The honest absence note was the correct servitor behavior; resolving it is Gate-2's job.

**Confirms the general Rule generalizes** beyond trigger-surface-vs-topology to any release blurb
that states a proof-strength claim as universal when a design doc records a named residual
carve-out: hedge with "normally"/"typically" rather than an unqualified claim whenever a known
exception is on record, even a Nit-severity, not-required-to-fix one.

## Recurrence 2 (2026-07-22, plan `test-floor-target-repo`, phase 2 "Release", task 2.1) — unconditional-reads prose for a guard-clause-conditional code path

A third distinct instantiation: **unconditional-reading prose vs. an explicit runtime guard
clause.** The `## Status` blurb (`README.md` line 339 at land) describes the new near-miss
diagnostic as: "[assert-test-in-diff.sh] prints a **stderr** block naming the active pattern set
... followed by each near-miss path" — phrased as something the exit-1 path always does. The
landed script wraps the entire block behind `if [ -n "$near_misses" ]` (`skills/war/assets/assert-test-in-diff.sh`,
~line 254 at the phase-2 tip `088e2cb75787ca2dfd9ed80aaa0ec417d7df2201` — verify still present
before acting), so a docs-only exit-1 diff (no test-shaped file anywhere in the changed-file list)
keeps stderr byte-identical to today: empty. `code-verified`: read directly at the task's
`_refinery` merge worktree (`<session-worktree>/.claude/war/wt/2026-07-22-test-floor-target-repo-2026-07-23/_refinery/`)
since the servitor's own cwd was — again — the stale worktree
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] documents (Recurrences 12/14/15,
same physical worktree `war-campaign-resilience-roadmap-33290f`).

Auditor disposition was `note` (Nit, not required to fix) and the blurb was **not** corrected before
land. **Resolved at Gate-2 (Lead, 2026-07-23):** the servitor's "remains unapplied" status was
accurate at wrap-up time but is now superseded — the Lead applied the auditor's own suggested wording
(`and, **when that scan finds anything**, prints a **stderr** block …`) to the landed `## Status`
blurb before the plan's PR was opened, re-running `version-slots.test.mjs` (3/3) and the full JS gate
(881/881) to confirm the four release slots and the arbiter's README-token extraction were untouched.
The general Rule below stands on its own; only this instance's disposition changed.

**Sharper form of the Rule for this instance:** when a release blurb narrates a diagnostic/logging
side effect that lives behind its own runtime conditional (as opposed to firing unconditionally
whenever the parent code path is taken), state the conditional explicitly — "prints X **when** Y"
— never just "prints X" with the trigger condition left implicit in the surrounding prose. A reader
cannot distinguish "always emits on this exit code" from "emits only when this sub-condition also
holds" without the explicit qualifier, and the gap is exactly the kind of prose a fresh operator
would trust literally when deciding whether empty stderr on a real no-test run is expected or a
regression.

## Recurrence 3 (2026-07-23, campaign `war-campaign-resilience-roadmap`, plan `cli-main-guard-normalization`, phase 2 "Release", task 2.1) — blanket clause across three heterogeneous guard shapes

A fourth distinct instantiation, closest in mechanism to
[[guard-deny-string-blanket-adjective-mismatches-mixed-flag-shapes]] rather than the
trigger-surface-vs-topology Rule above: the `## Status` blurb (`README.md` line 339 at land, tip
`4a96b14fc5c7d23530d1e3372d664b630dcb9311`) opens "The three run-as-CLI guards that still compared
`fileURLToPath(import.meta.url)` against a raw `process.argv[1]`" as a single umbrella clause
covering all three normalized guards. `code-verified` — read at the phase's `_refinery` merge
worktree (`.claude/war/wt/2026-07-22-cli-main-guard-normalization-2026-07-23/_refinery/`, this
servitor's own cwd being stale per [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]):
the clause is accurate for `stage-workflow.mjs` and `war-config.mjs`, but the pre-change guard in
`skills/war-campaign/assets/campaign-ledger.mjs` was `` import.meta.url === `file://${process.argv[1]}` ``
— it never called `fileURLToPath` and wrapped `argv[1]` in a `file://` template, not a raw
comparison. Two auditor lenses independently flagged this (both `disposition: note`, Nit) but both
also noted the blurb **self-corrects two sentences later** ("for the ledger's `file://`-string
form, a percent-encodable path"), so a reader is not left misled — the umbrella clause is imprecise
but not an overstatement of guard *power*, which is why this was a non-blocking Nit both times.

**How this differs from the guard-deny-string sibling:** there, one adjective ("=-attached")
summarized eight enumerated flags where five didn't fit the shape. Here, one clause describes
three guards where one (the ledger's) used a structurally different comparison form. Same family —
a summary phrase applied uniformly across a set with a shape-heterogeneous member — different
surface (guard *forms* across files vs. flag *shapes* within one enumeration).

**Left unfixed at land** (both times): the change would touch the README `## Status` release slot
mid-phase, which is out of task 2.1's `Files:` list to touch incidentally.

## Recurrence 4 (2026-07-24, plan `2026-07-24-runbook-and-standing-record-coherence`, phase 2 "Release", task 2.1) — "every case arm ... byte-unchanged" claims a byte-identity property one arm doesn't hold

A fifth distinct instantiation, closest in mechanism to
[[guard-deny-string-blanket-adjective-mismatches-mixed-flag-shapes]] (same guard file, same
`branch` read-form loop, a different release cycle's touch-up of it) but a different specific
overclaim: the `## Status` blurb (`README.md` line 340 at land, landed tip
`3444016a48a3d97b5beb21fc9700bd7fa788272d`) states the auditor `git branch` guard's deny message and
header comment change "with every `case` arm, and so every allow/deny outcome, byte-unchanged," and
closes with "every guard case arm are byte-untouched." **`code-verified`** — read at the phase's
`_refinery` worktree (gitdir physical path containing this plan's slug:
`.claude/worktrees/2026-07-24-runbook-and-standing-record-coherence-2026-07-24/_refinery/`, this
servitor's own cwd being a stale sibling worktree on a different branch per
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]): in
`hooks/validate-auditor-git.sh`, the corrected deny message lives **inside** the branch-loop's `*)`
catch-all arm's body (the `deny "git branch admits read forms only: ..."` string), so that one arm's
body is not literally byte-unchanged — only its `case` *pattern* (bare `*`) is. What genuinely is
byte-identical across every arm is the **pattern list** each arm matches on
(`--contains=*|--no-contains=*|...` and `--list|--all|...`), and therefore every allow/deny
*outcome* for any given input token — which is the substantively true and load-bearing claim.

**The pattern, sharper than Recurrence 3's:** Recurrence 3 was one clause misapplying a uniform
descriptor to a set where one *member* used a structurally different mechanism. Here the blurb
conflates two distinct properties of the same `case` statement — "the arm's matching *pattern* is
byte-unchanged" (true, and it's what actually matters for allow/deny behavior) with "the arm's
*body* is byte-unchanged" (false for the one arm whose body is the exact site of the intentional
fix) — and states the stronger, false property using the weaker, true property's evidence. The
imprecision is self-disclosing in context (the same sentence just said the deny message changed,
and the paragraph's own closing "No behavior change" clause enumerates "one corrected deny string"),
so no reader is actually misled; both auditor seats that flagged it (task-level and gate-audit)
rated it Nit/`disposition: note`, non-blocking, not absorbable (release slot; also plan-mandated
phrasing — mirrors the plan slice's own parenthetical almost verbatim).

**How to apply:** when a release blurb claims "every arm of `case` construct X is byte-unchanged" as
shorthand for "the allow/deny outcome didn't change," check whether the touched fix (a corrected
error string, a reworded comment) sits *inside* one of those arms' bodies. If it does, the true
claim is at the *pattern*/*outcome* level, not the *arm* level — say "every arm's pattern — and so
every allow/deny outcome — byte-unchanged" rather than "every arm ... byte-unchanged," or the two
will visibly contradict a sentence two clauses earlier that says a string inside one of those arms
changed.

Related: [[guard-deny-string-blanket-adjective-mismatches-mixed-flag-shapes]] (same guard file,
same `branch` read-form loop, an earlier release's adjective-vs-enumeration mismatch — together
these two lessons show this one guard's deny-message precision has now tripped an auditor twice
across two different plans). [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] (how
this fact was confirmed against the actual landed tip rather than a stale cwd).

## Recurrence 5 (2026-07-24, plan `2026-07-24-recovery-re-merge-dispatch-coherence`, phase 2 "Release", task 2.1) — a bolded absolute-sounding lead-in label is colon-scoped to a narrower enumeration than the paragraph's own headline

A sixth distinct instantiation, closest in mechanism to Recurrence 3's "blanket clause across
heterogeneous items" but inverted: here the label itself is **not false** once its colon-scope is
read strictly, yet it visually contradicts the paragraph's own opening sentence. `code-verified` —
read at `README.md` line 340, `## Status` blurb, at the landed tip `a84b42d4264207e8de22063c75d035b9179eddc0`
(worktree gitdir physical path containing this plan's slug:
`<repo-root>/.claude/worktrees/2026-07-24-recovery-re-merge-dispatch-coherence-2026-07-25/_refinery/`,
this servitor's own cwd being a stale sibling worktree on a different plan/branch, per
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]). The blurb's headline sentence
states a real engine behavior change ("Submodule scoping now rides *every* merge-task dispatch,
not just the first" — a `taskType:'submodule'` task whose first merge trips a recoverable route
now gets the `SUBMODULE TASK:` targetRepo/targetBase paragraph on its retry dispatch, where it
previously rode only the initial merge prompt), but the closing sentence opens with the bolded
label **`No behavior change:`** before narrowing, in the same sentence, to an enumerated set of
untouched surfaces (`land-decision.mjs`, every `MergeResult` status,
`HARD_ESCALATION_REASONS`/`KNOWN_LAND_DECISIONS`, every dispatch label, every merge-path floor —
all independently confirmed absent from the phase diff by two auditor seats). Both the task-level
auditor and the gate-audit lens flagged it (`disposition: note`, Nit, non-blocking) — the label is
technically accurate (colon-scoped, not a false claim) and is exactly the anti-overclaim device
this plan's own task-2.1 slice mandated ("never a claim that any recovery route, status enum, or
escalation reason changed"), but a reader who skims only the bolded lead-in — the part of a Status
paragraph readers are most likely to skim — gets a signal that contradicts the paragraph's first
sentence. Both seats also noted the immediately preceding `0.14.59` blurb used the byte-identical
`**No behavior change:**` label on a release that shipped *zero* behavior change, so consecutive
release notes give a reader no visual signal distinguishing "genuinely nothing changed" from
"routing/enums/labels/floors didn't change, but something else did."

**Sharper form of the Rule for this instance:** a bolded absolute-sounding label ("No behavior
change:", "No routing change:") that is colon-scoped to a specific enumerated list, appended at
the *end* of a paragraph whose *opening* sentence already described a real, shipped behavior
change, is technically defensible but reads as a headline contradiction to any skim-reader.
Prefer a label that names what it actually scopes — "**No routing or enum change:**" or "**No
recovery-route or escalation-reason change:**" — over the maximally-generic "**No behavior
change:**", reserving the fully generic label for releases that ship none at all (as the prior
`0.14.59` cycle correctly did).

Not corrected before land (Nit, `disposition: note`, `## Status` is a release slot; the plan slice
mandated this exact anti-overclaim phrasing, so a fix would need re-authoring the label, not just
prose polish).

## Recurrence 6 (2026-07-24/25, plan `2026-07-24-drift-guard-and-floor-diagnostic-hardening`, phase 2 "Release", task 2.1) — an appositive's nearest-noun antecedent lands on the very guard the same release re-anchors

A seventh distinct instantiation, a new sub-mechanism in the family: not a blanket clause, a scoped
label, or an absolute claim, but a **dangling-appositive antecedent ambiguity**. `code-verified` —
read at `README.md` line 340, `## Status` blurb, at the landed tip
`64cf6bb4e06470f4c093c618bef085a62d132d18` (worktree gitdir physical path containing this plan's
slug: `<repo-root>/.claude/worktrees/2026-07-24-drift-guard-and-floor-diagnostic-hardening-2026-07-25/_refinery/`,
this servitor's own cwd being a stale sibling worktree on a different plan/branch, per
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]). The clause reads: "… the
verbatim-capture contract established by row **D6** of the *test-floor-target-repo* design and
enforced by the #1046 drift guard above, **itself unchanged** …". The intended antecedent of "itself
unchanged" is the D6 contract (genuinely unchanged — the per-site `floor_diagnostic`/stderr/verbatim/
exit-1 arms are byte-unchanged and `workflow-template.js` is untouched), but the grammatically
nearest noun phrase is "the #1046 drift guard above" — and this very release is the one that
re-anchors that guard (`FLOOR_SITE_RE` terminator + source-derived count cross-check). Both the
task-level auditor and later re-reads rated it Nit/`disposition: note`, non-blocking, not absorbable
(fix edits `README.md`, a release-slot file) — the two sentences immediately preceding it already
describe the #1046 hardening explicitly, so no reader is actually left with a false behavior claim;
the ambiguity is local-parse only, not a substantive overstatement (the plan's prohibited overclaims
— floor exit code, matcher, routing enum, prompt byte, guard verb set — are all explicitly denied and
true elsewhere in the same paragraph).

**How this differs from the rest of the family:** Recurrences 1-5 are all clause-*scope* problems
(a claim states a broader/narrower/differently-conditioned property than the code supports).
Recurrence 6 is a clause-*attachment* problem — the words are individually true, but a trailing
appositive with no restated subject binds, by proximity, to the wrong preceding noun phrase when
that sentence names two things in sequence (an unchanged contract, and the just-hardened guard that
enforces it) and only one of them is what "itself" was meant to describe.

**How to apply:** when a release blurb sentence names two related constructs back-to-back — one
that changed this release, one that didn't — and closes with a bare appositive ("… enforced by X,
itself unchanged"), restate the subject explicitly rather than trusting proximity: "… the contract —
established by Y, enforced by X, and itself unchanged by this release —" binds "itself" unambiguously
to the contract even though X (the just-hardened guard) is the nearer noun.

Related: [[guard-deny-string-blanket-adjective-mismatches-mixed-flag-shapes]],
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] (worktree-lookup path used to
ground this recurrence's D3 read).
