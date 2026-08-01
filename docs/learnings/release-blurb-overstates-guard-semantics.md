---
name: release-blurb-overstates-guard-semantics
description: "Guard blurb: say 'refuse diffs touching X' not repos"
metadata:
  node_type: memory
  type: project
  keywords: [Status section wording, trigger surface, diff vs repo, fail-closed phrasing, submodule refuse, prose nit, operator misinformation, absolute claim vs residual exception, ADR carve-out, fresh-env re-run, unconditional vs conditional emission, near-miss diagnostic, assert-test-in-diff.sh, stderr guard clause, umbrella clause, heterogeneous guard shapes, realpathSync, campaign-ledger, fileURLToPath, No behavior change label, bolded lead-in, colon-scoped enumeration, release headline contradiction, anti-overclaim device, appositive antecedent ambiguity, dangling modifier, itself unchanged, nearest-noun misattachment, D6 verbatim-capture contract, on every error path, seed-pack die try region, mkdtemp scratch leak scope, TOKEN-scoped absence lock, prose-only reintroduction, verifyTier cap exceeded, unconditional prose append, gating-premise mismatch, non-submodule byte identity claim, submodule floor gain, polish merge prompt, floor-retry prompt, submodLandNote, submodMergeNote, every existing non-submodule prompt, issue citation convention, origin issue vs task issue, ADR body vs header qualifier, byte-unchanged body qualifier dropped, ADR Status line amendment, expect_deny_teach pinning granularity, K5 combined substring stated as separate pins, test assertion granularity overclaim, authoring checklist self-violation, checklist item dropped in its own introducing paragraph, D25 cross-ADR mirror, two-site characterization, either-alone overclaim, guard scope word omission]
  provenance: code-verified
  promoted: dev/2026-07-24-memory-tooling-hardening@phase-2
  slug: release-blurb-overstates-guard-semantics
  phase: "submodule-inc1/T4 +11 recurrences (war-campaign-resilience-roadmap/phase-2 Release task 2.1, 2026-07-22; test-floor-target-repo/phase-2 Release task 2.1, 2026-07-22; cli-main-guard-normalization/phase-2 Release task 2.1, 2026-07-23; runbook-and-standing-record-coherence/phase-2 Release task 2.1, 2026-07-24; recovery-re-merge-dispatch-coherence/phase-2 Release task 2.1, 2026-07-24; drift-guard-and-floor-diagnostic-hardening/phase-2 Release task 2.1, 2026-07-24/25; 2026-07-24-memory-tooling-hardening/phase-2 Release task 2.1, 2026-07-26; 2026-07-26-dispatch-args-and-floor-coverage/phase-3 Release task 3.1, 2026-07-26/27; 2026-07-26-auditor-guard-policy-and-mirror-truth/phase-2 Release task 2.1, 2026-07-27; 2026-07-26-standing-doc-and-remedy-truth-sweep/phase-2 Release task 2.1, 2026-07-27; 2026-07-28-audit-evidence-precedence/phase-2 Release task 2.1, 2026-07-28)"
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
  modified: 2026-07-28T21:01:11.727Z
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

## Recurrence 7 (2026-07-26, plan `2026-07-24-memory-tooling-hardening`, phase 2 "Release", task 2.1) — two independent overstate-scope Nits in the same paragraph, both "the guard's real reach is narrower than the summary clause"

An eighth and ninth instantiation, both flagged by the task auditor in the same `## Status`
paragraph (`README.md` line 340 at land, landed tip `e50e3ca47f42181fa5715251f08be099118516f9`
— worktree gitdir physical path containing this plan's slug:
`<repo-root>/.claude/worktrees/2026-07-24-memory-tooling-hardening-2026-07-26/_refinery/`, this
servitor's own cwd being a stale sibling worktree on a different plan/branch, per
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]). `code-verified` — both findings
confirmed against `skills/lessons-learned/assets/seed-pack.mjs` and
`skills/lessons-learned/lessons-learned-doc-contract.test.mjs` at that tip.

**(a) "on every error path" for a fix scoped to three specific `try` regions.** The blurb says
`die()` "wrote to stderr and called `process.exit` from inside `cmdPack`'s, `verifyTier`'s, and
`cmdEvict`'s `try` regions; ... their `mkdtemp` scratch dirs leaked ... on every error path."
`verifyTier`'s two cap-exceeded `die()` calls (member cap, byte cap, `seed-pack.mjs` lines
357/361) fire **before** its `mkdtemp('seed-pack-verify-<tier>-')` at line 364 and **outside**
its `try` — that error path never creates, and so never leaks, a scratch dir. Same shape for
`cmdPack`'s seed-cap-exceeded `die()` (line 322, before the `mkdtemp` at 335) and `cmdEvict`'s two
archive-cap `die()`s (lines 455/458, before the `mkdtemp`s at 464-465). The claim is accurate for
every `die()` reachable *inside* the three named `try` regions (which "those" grammatically
scopes it to), but the bare "every error path" reads as every `die()` call site in the file,
several of which fire pre-`try`. Sharper form: when a blurb quantifies "every error path" right
after naming specific enclosing regions, the quantifier silently inherits the region's boundary in
the writer's head but not on the page — say "every error path that had already reached the scratch
phase" or name the pre-`try` refusal `die()`s as an explicit exception.

**(b) "a prose-only reintroduction is red too" for a lock whose own code comment disclaims that
exact generality.** The blurb says the new absence lock plus a whole-file token check means "a
prose-only reintroduction is red too." The lock's own comment in
`lessons-learned-doc-contract.test.mjs` states the opposite explicitly: "(ii) is TOKEN-scoped — a
set-then-thread revived under a different variable name, or the same expansion added to some OTHER
bash fence in this doc, passes both asserts." A prose reintroduction that never spells the literal
token `TIGHTEN_TARGET` (renamed variable, respelled fence) is **not** caught. The mechanism is
named immediately before the overstated claim, so a careful reader isn't misled, but the sentence
itself generalizes past what the cited guard proves — the same "state the true property, not the
adjacent stronger one the evidence doesn't cover" mistake as Recurrence 4's arm-pattern-vs-arm-body
conflation, here applied to a token-literal guard vs. a semantic/token-family guard.

Both `disposition: note`, Nit, non-blocking, not fixed before land (`fixRounds: 0`) — not
absorb-eligible, `## Status` is a release slot. **Now 7 recurrences of the "on every error path" /
"X is Y too" absolute-overclaim shape alone**, on top of the 6 prior distinct sub-mechanisms above:
this family is the single most frequent recurring Nit class in this repo's release blurbs.
**Applies-to checklist for a blurb author:** before writing "every"/"all"/"X is Y too" about a
guard or cleanup's reach, ask (1) does the enclosing scope word ("those `try` regions", "that
lock") actually bound every instance the absolute covers, and (2) does the guard's own code
comment already disclaim a narrower scope than the blurb claims — if the guard's own comment says
"TOKEN-scoped" or similar, the blurb cannot say "X is red too" without repeating that same scope
word.

Related: [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]] (this phase's
other recurring finding, a different family — gate-audit artifact threading, not blurb prose).

## Recurrence 8 (2026-07-26/27, plan `2026-07-26-dispatch-args-and-floor-coverage`, phase 3
"Release", task 3.1) — a gating-premise sentence covers only 2 of 4 enumerated gains, the other 2
are unconditional and DID change every non-submodule prompt

A tenth instantiation, the sharpest yet of the "X is Y too" family: the `## Status` blurb
(`README.md` line 340 at land, landed tip `da7a5f37e145aaf246bb04fa0d2e235f8786d118` — `code-verified`,
read directly at the `_refinery` worktree whose `HEAD` equals the landed tip, gitdir physical path
`<repo-root>/.claude/war/worktrees/2026-07-26-dispatch-args-and-floor-coverage-2026-07-27/_refinery/`)
closes its section (2) paragraph with: "Every gain is a prose append reusing in-scope constants,
and `submodLandNote`/`submodMergeNote` remain `''` off the submodule path — so every existing
non-submodule prompt is byte-unchanged." The paragraph enumerates **four** distinct gains (both
re-land prompts gaining `submodLandNote`, the polish-merge prompt gaining a bare
`assert-no-submodule-mutation.sh` invocation, the floor-retry re-merge prompt gaining the same
invocation with a `--declared` conditional suffix), but the `''`-off-the-submodule-path premise
only covers the first two (the note-gated ones). The polish and floor-retry gains are
**unconditional string concatenations** — not gated on `submodLandNote`/`submodMergeNote` at all —
so both of those prompts changed byte-for-byte on **every** phase, submodule or not. The blurb's
own two preceding sentences describe those unconditional gains explicitly ("it now carries the
invocation bare", "it now carries it with the gitlink-bump `--declared` conditional shape"), so the
closing clause visibly contradicts its own paragraph three sentences up — the same
"state-the-stronger-property-using-the-weaker-property's-evidence" shape as Recurrence 4 and both
halves of Recurrence 7. Two auditor seats (task-level + gate-audit lens) independently flagged the
identical defect (`disposition: follow-up`, Minor — one severity step above this family's usual
Nit, since the false claim sits in the same clause the plan's own End state 11 scopes correctly
to "no non-submodule prompt gains a submodule NOTE"). **Not fixed before land** (`fixRounds: 0`):
the edit lands in the README `## Status` release-slot paragraph, Lead/operator-owned — a phase-close
absorb-worktree edit there is the recorded #1083 stale-worktree-revert shape
([[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]]), so it is correctly deferred
to a follow-up rather than absorbed.

**Sharper form of the Rule for this instance:** when a release blurb enumerates N gains and then
appends a single gating-premise clause ("X remains `''` off path P, so every non-P surface is
unchanged") to justify a byte-identity claim, verify the premise actually gates **every** enumerated
gain — not just the first ones named. An unconditional gain slipped into the same enumeration (a
floor invocation appended regardless of any note/flag) silently rides the closing claim's shadow
and produces a false byte-identity statement about a real, shipped, unconditional prompt change.
**Secondary, same paragraph:** a companion Nit in the same landed text — section (2) cites the WAR
task issue `#1160` where its sibling sections (1) and (4) cite origin defect issues (`#1134`,
`#1151`) matching the plan's own `Source spec: … (issues #1134, #1114, #1151)` line — is a distinct,
narrower mechanism (issue-citation convention, not a code-semantics overclaim) but the same family
of "a summary sentence quietly narrower/broader than its own paragraph's evidence"; worth a fast
gut-check on any future blurb citing an issue number in an enumerated list: confirm every item cites
the same tier (origin defect issue vs. execution/task sub-issue), since the two look identical to a
skimming reader.

Related: [[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]] (why this Minor stays
a follow-up rather than a phase-close absorb).

## Recurrence 9 (2026-07-27, plan `2026-07-26-auditor-guard-policy-and-mirror-truth`, phase 2 "Release", task 2.1) — two independent overclaims in the same paragraph: a dropped qualifier from the cited source's own precise wording, and a combined test assertion described as separately pinned

An eleventh and twelfth instantiation, both flagged by the task auditor in the same `## Status`
paragraph (`README.md` line 332 at land, landed tip `a6c3c099dc9a95600894240b410c11df6ce6375e` —
`code-verified`, read directly at the `_refinery` worktree whose `HEAD` equals the landed tip,
gitdir physical path
`<repo-root>/.claude/war/worktrees/2026-07-26-auditor-guard-policy-and-mirror-truth-2026-07-27/_refinery/`).

**(a) "every other pre-existing line stand byte-unchanged" drops the cited ADR's own "body" qualifier.**
The blurb says "ADR 0029 gains a dated, append-only amendment recording the re-ratification while its
Decision, its Considered options and every other pre-existing line stand byte-unchanged." The ADR's own
new `## Amendment (2026-07-26)` paragraph is more precise: "every other line of this ADR's pre-existing
**body** stand as originally ratified and are left byte-unchanged." The two differ on exactly one line —
`docs/adr/0029-capture-grounds-on-committed-tip.md`'s `**Status:**` header line was itself edited in the
same plan (`accepted; amended 2026-07-22` → `accepted; amended 2026-07-22, 2026-07-26`, an absorbed
phase-1 "ADR Status currency" finding), so "every other **line**" is false for that one line while "every
other line of the **body**" is true (a Status header field is not body prose). Same shape as Recurrence 4's
arm-pattern-vs-arm-body conflation and Recurrence 7(b)'s token-vs-family generalization: the blurb states
the broader, false property (every line) using the narrower, true property's evidence (every body line) —
and the source document it paraphrases had *already* stated the narrower, correct claim in its own words.
**Sharper form of the Rule:** when a blurb paraphrases a cited doc's own precision claim, carry every
scoping noun the source used ("body", "those try regions", "TOKEN-scoped") verbatim or the paraphrase
silently regresses to the broader claim the source deliberately avoided.

**(b) "pin the prefix, the residue echo, and each teach element separately" overstates test granularity —
never guard behavior.** Item (2) of the blurb defines the deny prefix as `` `command contains forbidden
character(s)` `` plus the `head -c 20` residue echo, then says the four `expect_deny_teach` cases "pin the
prefix, the residue echo, and each teach element separately" — enumerating 5 separately-pinned items across
4 cases. In the landed `hooks/validate-auditor-git.test.sh`, K5's single substring assertion
(`"forbidden character(s): &&"`) covers the prefix tail and the residue echo **together, in one pinned
string** — its own comment says so explicitly: "K5 pins the prefix tail ... plus the ... residue echo at
the front (the leading 'command contains' fragment rides along, unpinned by itself)." K6/K7/K8 each pin one
teach element separately, so 3 of the 4 named items are genuinely separately pinned and 2 (prefix tail +
residue echo) are pinned jointly by one assertion — a test-coverage-granularity overclaim, not a behavior
overclaim (the prefix is still byte-preserved and K5 still reds if the string changes). Distinct sub-mechanism
from (a): this is a claim about how finely a *test* verifies a property, not about how broadly a *code*
property holds — the closest sibling is describing what a guard's *code* enforces, only here it is what a
*test* separately asserts.

Both `disposition: note`, Nit, non-blocking, not fixed before land (`fixRounds: 0`) — not absorb-eligible,
`## Status` is a release slot outside task 2.1's `Files:` list to touch incidentally, and the disposition
rule refuses `absorb` for anything touching a version/release slot.

**Applies-to checklist addendum:** when a blurb paraphrases another artifact's own precision language
(an ADR amendment, a test's own comment), diff the blurb's wording against that artifact's *exact* scoping
words before trusting the paraphrase — a paraphrase that drops one scoping noun ("body", "separately")
silently promotes a narrow true claim to a broad false one even when the cited artifact itself got it right.

Related: [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]] (unrelated family, same
phase-close audit-log-sourced-finding provenance discipline).

## Recurrence 10 (2026-07-27, plan `2026-07-26-standing-doc-and-remedy-truth-sweep`, phase 2 "Release",
task 2.1) — the paragraph that ships this lesson's own new authoring checklist violates the
checklist's own item 2, in the same sentence

A thirteenth instantiation, and the sharpest irony in the family so far: this release's `## Status`
paragraph (`README.md`, `## Status` section at the landed tip
`bb1b1c0877396838f5057dabc19c2281882c37b5` — `code-verified`, read directly at the `_refinery`
worktree whose `HEAD` equals the landed tip, gitdir physical path
`<repo-root>/.claude/war/worktrees/2026-07-26-standing-doc-and-remedy-truth-sweep-2026-07-27/_refinery/`)
is the one that **introduces** `README.md`'s new `### Status-blurb authoring checklist` — item 2 of
which is "Repeat the guard's own scope word … Dropping it silently promotes a narrow true claim to a
broad false one" — and that checklist explicitly cites this very lesson
(`docs/learnings/release-blurb-overstates-guard-semantics.md`) as its provenance (item 7). The same
paragraph's `#1115` sub-clause then commits exactly the violation the checklist warns against: "the
new D25 row reads both ADRs and asserts the two-site characterization on each, so an edit to either
ADR alone reds." The D25 row's own code comment
(`skills/war/assets/skill-doc-contracts.test.mjs`, the `(D25) CROSS-ADR MIRROR` banner) states a
narrower reach: "This row reads BOTH files so a revert on EITHER surface reds" and "Keys are ORDERED
and per-surface, anchored on the ADRs' own tokens rather than either ADR's sentence bytes, so
sanctioned rewording latitude on either side does not false-red." A **sanctioned rewording** of
either ADR is "an edit to either ADR alone" and does **not** red — so the blurb's consequence clause
generalizes past the guard's own disclaimed scope, dropping the "revert"/"sanctioned rewording"
distinction the guard's comment is careful to draw. The paragraph's immediately preceding clause
("asserts the two-site characterization on each") does supply enough context that the sentence reads
as true in situ, which is why the task auditor rated it Nit and not a hold; not fixed before land
(`disposition: note`, non-blocking, `## Status` is a release slot outside task 2.1's `Files:` list to
touch incidentally, and the disposition rule refuses `absorb` for anything touching a version/release
slot).

**Why this recurrence is worth its own entry despite being "just another Nit":** authoring a checklist
distilled from this lesson family is not self-applying. The same drafting pass that writes "repeat the
guard's own scope word: revert vs. sanctioned rewording" as new standing guidance can, in the very
paragraph announcing that guidance, drop that exact distinction describing an unrelated guard two
sentences later — the checklist protects future blurbs only if the author re-reads their own paragraph
against it, not merely by virtue of having written it down in the same commit. **Applies-to checklist
addendum:** when a release blurb introduces a new anti-overclaim checklist/guard in the same paragraph
that also narrates unrelated guards, re-run each of that paragraph's *own* sentences through the new
checklist before treating the paragraph as compliant — the checklist's presence in the document is not
evidence its own introducing prose passes it.

Related: [[audit-log-finding-can-be-stale-by-land-time]] (this recurrence's finding-match check
confirmed the defect live at the landed tip rather than fixed-in-flight — both audit-log Nits on this
task's paragraph were verified present, not resolved, before this entry was written).

## Recurrence 11 (2026-07-28, plan `2026-07-28-audit-evidence-precedence`, phase 2 "Release", task 2.1) — two independent overclaims in the same paragraph: a per-term guard's construct-level reach described as applying to both surfaces it only applies to one, and a token-anchored registry row's "any edit reds" overstating a guard that only reds on a reword away from its anchors

A fourteenth and fifteenth instantiation, both flagged across two auditor seats on the same `##
Status` paragraph (`README.md`, at the landed tip `5f018f183eefa225ee900afd7e33dca9c5dfb4e8` —
`code-verified`, read directly at the `_refinery` worktree whose `HEAD` equals the landed tip,
gitdir physical path
`<repo-root>/.claude/war-worktrees/2026-07-28-audit-evidence-precedence-2026-07-28/_refinery/`).

**(a) "per-term extraction by construct... so a diff that rewords either surface... reds" claims a
symmetry the guard's own code doesn't have.** The blurb describes the new D26 row in
`skill-doc-contracts.test.mjs` as doing "per-term extraction by construct (bolded term to the next
bolded term or heading), token-anchored `\s+`-wrapped keys rather than sentence bytes, so a diff
that rewords either surface away from a doctrine clause reds." Read at the pin, the per-term
construct extraction applies only to the `CONTEXT.md` side; the ADR side matches each key against
the whole normalized file (`norm(adr0041)`), not a per-term extracted region. Two of the row's keys
even have two independent homes in ADR 0041 (`/never\s+evidence/i` matches both the floor-rule
bullet and the `history` rung-2 clause; `/naming\s+both\s+rungs/i` matches both the D3 table row and
the floor-rule bullet), so removing either clause alone from the ADR still greens the row — "either
surface... reds" is stronger than the guard actually is. Same family as Recurrence 9(b) (a claim
about how finely a *guard* discriminates, not about how broadly a code property holds), just applied
to extraction *symmetry* between two surfaces rather than test-assertion granularity within one.

**(b) "a diff editing any single one of the five copies one-sidedly reds" overstates a
token-anchored row to plain edit-sensitivity.** The row's own banner in
`workflow-template.test.mjs` states the narrower reach explicitly: "Token-anchored, case-tolerant —
never full-line bytes (the surfaces phrase the shared discipline differently)." A one-sided reword
that preserves the anchor tokens (`content-at-pin`, `never the top rung`, `never evidence`, `##
Evidence precedence`, the ordered four-shape chain) stays green by design — sanctioned rewording
latitude is the row's entire point — so "editing... reds" is broader than "rewording away from the
anchors reds." This is the exact shape Recurrence 10's `#1115` sub-clause already named for a
different (D25 cross-ADR) row in the *same drafting pass's own new checklist paragraph* — the
"repeat the guard's own scope word: revert/reword vs. sanctioned rewording" item continues to trip
even after being spelled out as standing guidance two prior recurrences ago.

Both `disposition: note`, Nit, non-blocking, not fixed before land (`fixRounds: 0`) — not
absorb-eligible, `## Status` is a release slot outside task 2.1's `Files:` list to touch
incidentally.

**Now 15 recurrences across two overlapping sub-families** ("X is Y too" absolute-overclaim, and
"a guard's discrimination/reach described more broadly than its own code"): this paragraph alone
carried nine `disposition: note` findings across two auditor passes, the highest single-paragraph
count recorded in this family to date, entirely because a doctrine-heavy release (four ladders,
floor rules, precedent mapping, three new guard rows) gives a blurb author many more scope words to
drop than a typical mechanical-fix release does.

Related: [[canonical-doc-precedent-mapping-subsection-can-contradict-the-same-docs-own-consequences-bullet]]
(same paragraph, same phase — the third and most serious of this paragraph's overclaims, an
unqualified absolute the ADR's own Consequences bullet contradicts, recorded separately since it is
doctrine-mapping rather than guard-semantics). [[release-blurb-quoted-code-literal-can-diverge-from-actual-identifier]]
(same paragraph, a fourth overclaim family — a quoted code-font literal that doesn't exist verbatim).
