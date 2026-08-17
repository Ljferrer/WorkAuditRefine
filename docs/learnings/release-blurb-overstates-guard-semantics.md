---
name: release-blurb-overstates-guard-semantics
description: "Guard blurb: say 'refuse diffs touching X' not repos"
metadata:
  node_type: memory
  type: project
  keywords: [Status section wording, trigger surface, diff vs repo, fail-closed phrasing, submodule refuse, prose nit, operator misinformation, absolute claim vs residual exception, ADR carve-out, fresh-env re-run, unconditional vs conditional emission, near-miss diagnostic, assert-test-in-diff.sh, stderr guard clause, umbrella clause, heterogeneous guard shapes, realpathSync, campaign-ledger, fileURLToPath, No behavior change label, bolded lead-in, colon-scoped enumeration, release headline contradiction, anti-overclaim device, appositive antecedent ambiguity, dangling modifier, itself unchanged, nearest-noun misattachment, D6 verbatim-capture contract, on every error path, seed-pack die try region, mkdtemp scratch leak scope, TOKEN-scoped absence lock, prose-only reintroduction, verifyTier cap exceeded, unconditional prose append, gating-premise mismatch, non-submodule byte identity claim, submodule floor gain, polish merge prompt, floor-retry prompt, submodLandNote, submodMergeNote, every existing non-submodule prompt, issue citation convention, origin issue vs task issue, ADR body vs header qualifier, byte-unchanged body qualifier dropped, ADR Status line amendment, expect_deny_teach pinning granularity, K5 combined substring stated as separate pins, test assertion granularity overclaim, authoring checklist self-violation, checklist item dropped in its own introducing paragraph, D25 cross-ADR mirror, two-site characterization, either-alone overclaim, guard scope word omission, bound every absolute, universal quantifier enumeration gap, version-manifest omitted from outside-dir enumeration, doctrine count vs guard count mismatch, engine untouched claim, task diff vs release window scope, unbumped stacked PR, zero engine change, named above enumeration gap, skills touch outside families, previously-valid vs currently-valid, boilerplate closing sentence drift, stock release phrase word swap, headline vs body scope mismatch, malformed argv every mode, file mode bare token carve-out, worktree name collision resolved via numeric suffix, unbounded absolute inherited from source comment, namespace-scoped ref-diff refs/heads refs/tags, every live ref vs every live heads/tags ref, escape-worthy fixture misattribution, wrong case cited as the escaping fixture, faithful mirror of suite banner still overstates scope, watchdog group kill fd survivor, unbounded claim repaired two sentences later same bullet, discrimination ceiling banner dropped, quoted test case number without its own scope caveat, done-when floor wiring, TERM-ignoring descendant residual, hand-duplicated guard not shared, lacks_i lacks has_i_stripped, existence guard controls #1362, pin the guard both ways, shell-pin-helpers, character allowlist residue check, forbidden character deny message, metacharacter rule fired, guard-message-overclaim-inherited-into-blurb, static-guard-deny-message, verdict enumeration drift guard, scoped SHORT of its whole line, byte-identical eviction requalified, same-phase artifact correction not propagated, glossary-cold header qualifier, Homes link list omission, drift on any of those five lines, distributive plural over two rows, headline attributes one-row gain to both rows, sole writer wording quoted safely scoped, retired token quoted in blurb, per-family deepEqual proof, posterity corpus sentinel, hardcoded literal cannot deepEqual a scan, D3 sentinel family count, three seats one clause]
  provenance: code-verified
  promoted: dev/2026-08-06-verdict-adjudication-integrity@phase-2
  slug: release-blurb-overstates-guard-semantics
  phase: "submodule-inc1/T4 +20 recurrences (war-campaign-resilience-roadmap/phase-2 Release task 2.1, 2026-07-22; test-floor-target-repo/phase-2 Release task 2.1, 2026-07-22; cli-main-guard-normalization/phase-2 Release task 2.1, 2026-07-23; runbook-and-standing-record-coherence/phase-2 Release task 2.1, 2026-07-24; recovery-re-merge-dispatch-coherence/phase-2 Release task 2.1, 2026-07-24; drift-guard-and-floor-diagnostic-hardening/phase-2 Release task 2.1, 2026-07-24/25; 2026-07-24-memory-tooling-hardening/phase-2 Release task 2.1, 2026-07-26; 2026-07-26-dispatch-args-and-floor-coverage/phase-3 Release task 3.1, 2026-07-26/27; 2026-07-26-auditor-guard-policy-and-mirror-truth/phase-2 Release task 2.1, 2026-07-27; 2026-07-26-standing-doc-and-remedy-truth-sweep/phase-2 Release task 2.1, 2026-07-27; 2026-07-28-audit-evidence-precedence/phase-2 Release task 2.1, 2026-07-28; 2026-08-02-redteam-doctrine-and-guards/phase-2 Release task 2.1, 2026-08-02; 2026-08-04-interview-and-authoring-contract/phase-3 Release task 10, 2026-08-05; 2026-08-06-red-team-gate-cli/phase-2 Release task 2.1, 2026-08-06/14; 2026-08-06-escape-guard-exit-contract/phase-2 Release task 2.1, 2026-08-15; 2026-08-06-done-when-floor-wiring/phase-2 Release task 2.1, 2026-08-15; 2026-08-06-shell-pin-helpers/phase-2 Release task 2.1, 2026-08-15; 2026-08-06-gate-audit-finding-routing/phase-3 Release task 3.1, 2026-08-15; 2026-08-06-verdict-adjudication-integrity/phase-2 Release task 2.1, 2026-08-16; 2026-08-06-redteam-rounds-config-telemetry/phase-2 Release task 2.1, 2026-08-16; 2026-08-06-doc-cli-consistency-corpus/phase-2 Release task 2.1, 2026-08-16)"
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
    - "[[static-guard-deny-message-misnames-which-rule-fired-for-shared-char-class]]"
  created: 2026-06-30
  originSessionId: 0e364ee5-f0b3-47f6-a9e4-9bf2dd555733
  modified: 2026-08-17T00:00:00.000Z
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

## Recurrence 12 (2026-08-02, plan `2026-08-02-redteam-doctrine-and-guards`, phase 2 "Release",
task 2.1) — two independent scope-word gaps in the same closing paragraph: an "outside X" file-set
enumeration omitting the release's own version-manifest files, and a universal "every doctrine"
quantifier not covering all N doctrines the same sentence names

A sixteenth and seventeenth instantiation, both `disposition: note` Nits on the same `## Status`
closing paragraph. `code-verified` — read directly at the `_refinery` worktree whose `HEAD` equals
the landed tip `06efa2b925caec1fafd1f019e32e32517e114250` (gitdir physical path containing this
plan's slug: `<repo-root>/.claude/war-worktrees/2026-08-02-redteam-doctrine-and-guards-2026-08-02/_refinery/`).

**(a) "outside `skills/red-team/`, the release diff is documentation ... plus" the two named test
files omits the release's own `.claude-plugin/plugin.json` + `marketplace.json` version-manifest
bump.** Measured at the plan's own footprint (`224c4d3..46d42be`), the non-`skills/red-team/` set
also includes both release-slot manifests this very task changed — neither documentation nor one of
the two named test surfaces. The omission is self-evident from the same paragraph's leading
`**0.15.1**` token (a reader who parses the enumeration literally would wonder where the version
bump lives), and the load-bearing half of the sentence — "No `/war` engine file, hook, or
merge-path floor changed" — was independently verified true, so this is the mild, non-misleading
end of the family: an incomplete enumeration next to a claim that stays correct.

**(b) "Every doctrine ships beside its own guard" opens by naming four doctrines but only three get
a guard clause in the enumeration that follows.** The fourth — "adjudication G's carve-out
granularity is recorded once, canonically" (ADR 0043's own subsection) — is a prose record, not a
mechanism; none of the release's test-file diffs extract, pin, or assert anything over that
subsection or over the corresponding guidance comment in `references/lenses.md`. This is the
sharpest form of the family yet for a specific reason: it is not a scope-word slip inside one
sentence describing one guard (Recurrences 1-11), it is a **universal quantifier opening a list of
N items where only N-1 get the promised property**, and the repo's own `### Status-blurb authoring
checklist` item 1 ("Bound every absolute") exists precisely to catch this shape. Mitigating,
and why this stayed Nit rather than Minor: the sentence's own qualifier ("in the same task or
across the `deps` edge the rule itself requires") makes the primary assertion the **co-travel**
discipline (mirroring the plan's own Method text "every mirror and its guard travel together"), and
the immediately preceding clause already tells the reader doctrine four is *recorded*, not
mechanized — so a careful reader isn't actually misled, only a skimmer counting "four doctrines,
four guards" would be.

**Sharper form of the Rule for this pairing:** when a release blurb opens a colon-introduced
enumeration with a universal quantifier ("every X ships beside Y"), count the antecedent's own
named subjects (here: four doctrines) against the enumeration's items before publishing — a
paragraph that correctly, precisely describes three mechanisms is not automatically safe to
front-load with an unqualified "every" if a fourth subject was named just one sentence earlier and
sits outside the mechanized set.

Both left unfixed at land (`## Status` is a release slot outside task 2.1's `Files:` list to touch
incidentally; the disposition rule refuses `absorb` for anything touching a version/release slot).

**Now 17 recurrences.** Applies-to checklist addendum: before publishing a universal-quantifier
enumeration, explicitly count how many distinct subjects the *opening* clause named against how
many items the *following* enumeration actually substantiates — a bolded "0.X.Y" version token at
the top of the same paragraph is itself a reminder to sanity-check that any "outside `<dir>`, the
diff is..." enumeration includes the release's own version-slot files.

## Recurrence 13 (2026-08-05, plan `2026-08-04-interview-and-authoring-contract`, phase 3
"Release", task 10) — an "engine untouched" absolute is true of the task's own diff but false of
the release window it heads, plus a "sole X named above" enumeration missing one item

An eighteenth and nineteenth instantiation, both flagged on the same `## Status` paragraph.
`code-verified` — read directly at the `_refinery` worktree whose `HEAD` equals the landed tip
`3b1287111098120ae5dce1057548cd725bc00005` (gitdir physical path containing this plan's slug:
`<repo-root>/.claude/war-worktrees/2026-08-04-interview-and-authoring-contract-2026-08-05/2026-08-04-interview-and-authoring-contract-2026-08-05/_refinery/`),
`README.md` line 361.

**(a) "The extraction bound held — zero `/war` engine change: no file under `skills/war/`,
`hooks/`, or `agents/` changed" (Minor, disposition `follow-up`) — a new sub-family: task-diff
scope vs. release-window scope.** Every prior recurrence in this family is about a blurb
misdescribing its **own diff** (a clause broader/narrower than the guard the same diff ships). This
one is different in kind: the audited rationale computed the sentence as *true* of this plan's own
change set (`git diff --stat 94ee5b3..84c8ced` shows no such paths) but *false* of the release the
blurb heads — the audit's cited `git diff --stat 46d42be..84c8ced -- skills/war hooks agents`
(46d42be = the 0.15.1 release commit) shows 12 files / 753 insertions under those three paths,
attributed to two prior PRs that landed on `master` between 0.15.1 and this plan's integration base
with no version bump of their own, so they ship to consumers under this release's `0.16.0` per the
README's own caching-contract framing in `## Updating`. **This lesson's own causal aggregate-diff
claim is not independently re-derived here** — no Bash tool available to this servitor to run
`git diff --stat` against a historical SHA — so treat the specific PR/file-count figures as the
audit's own computed rationale, not re-verified fact; only the live blurb text itself (quoted above)
is directly `code-verified` at the pin. Held Minor rather than Major because the plan's own Pivotal
constraints and the blurb's own lead-in ("The extraction bound held") name the work-scope reading,
and the immediately preceding 0.15.1 blurb used the identical plan-scoped framing under the same
kind of unbumped-predecessor gap (house precedent, not unique to this worker — see
[[stacked-per-branch-releases-make-main-lag-cumulative]], the mechanism that produces the gap this
absolute trips on). **Sharper form of the Rule, new axis:** an "X untouched"/"zero change" absolute
in a `## Status` blurb needs its scope word to bind not just the sentence's own clause-vs-guard
reach (the 17 prior recurrences) but also **which window** it claims — this plan's diff alone, or
everything a consumer receives when they bump to the version number the same paragraph opens with.
When N stacked, unbumped predecessor PRs land on the integration base before this release's own
bump, "no engine file changed" is a work-scope claim that reads as a release-scope one unless it
says so ("no `skills/war/`/`hooks/`/`agents/` file changed **by this plan**").

**(b) "the sole `skills/` touch outside the skill families named above" (Nit, `disposition:
note`) — the same "outside X, the diff is..." enumeration-gap shape as Recurrence 12(a), now on a
`skills/` subset rather than a whole-repo set.** At the point the clause is read, the blurb has
named `war-strategy`, `war-machine`, `red-team`, `survey-corps`. `git diff --stat 94ee5b3..84c8ced`
shows two `skills/` touches outside those families: `skills/war-campaign/assets/campaign-ledger.test.mjs`
(the claimed sole one) and `skills/war-help/SKILL.md` (+4/-4, two command-table rows) — the latter
is named only in the *next* sentence's gospel list, one sentence too late for "named above" to be
literally true. Self-correcting one sentence later, same as Recurrence 3's umbrella clause and
Recurrence 12's mild end of the family; both auditor passes rated it Nit, not a hold. **Applies-to
checklist addendum, sharpened again:** an "outside `<dir>`, the sole/only other touch is Y"
enumeration must be checked against the *whole* diff before publishing, not just the items the
blurb has already named in prose above the clause — a name appearing later in the same paragraph
does not retroactively satisfy an "above" scope word.

Both left unfixed at land (`## Status` is the fourth version/release slot; the disposition rule
refuses `absorb` for anything touching it — (a) is routed `follow-up`, (b) `note`).

**Now 19 recurrences across three overlapping sub-families**: "X is Y too" absolute-overclaim,
"a guard's discrimination/reach described more broadly than its own code", and (new, this
recurrence) "task-diff scope vs. release-window scope."

Related: [[stacked-per-branch-releases-make-main-lag-cumulative]] (the unbumped-stacked-PR mechanism
behind (a)'s gap, previously documented only for auditor version-jump false positives, not blurb
absolutes); [[gospel-new-present-pin-self-satisfied-by-status-blurb-prose]] (a distinct, sibling
finding on this same task/paragraph — a structural-test guard-mechanics gap, not a blurb-prose
overclaim, recorded separately).

## Recurrence 14 (2026-08-06, plan `2026-08-06-red-team-gate-cli`, phase 2 "Release", task 2.1) —
one instance fixed at phase-close (a boilerplate scope word swapped, self-contradicting the same
bullet's first sentence), one left live (a headline absolute one channel wider than its own very
next bullet already discloses)

A twentieth and twenty-first instantiation on the same `## Status` paragraph, with different
outcomes. `code-verified` — read directly at the `_refinery8` worktree whose `HEAD` is byte-equal
to the landed tip `8064a3c603bffd462ea616f877954bfe0bf332f2` (gitdir physical path containing this
plan's slug: `<repo-root>/.claude/war-worktrees/2026-08-06-red-team-gate-cli-2026-08-14/2026-08-06-red-team-gate-cli-2026-08-14/_refinery/`
— the collision-prone bare name `p2-2.1`/`_refinery` resolved to an unrelated concurrent plan
(`2026-07-28-audit-evidence-precedence`) and had to be discarded in favor of the numerically
suffixed entry per [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]'s name-collision
rule), `README.md` lines 361/363.

**(a) "No previously-valid invocation's output changed by a byte" contradicted the same bullet's
own first sentence, and was FIXED before land (Minor, `disposition: absorb`, `phaseClose: true`).**
The bullet's closing sentence used the stock boilerplate word "previously" where the plan's own
Method/End-state-7 literal is "currently" ("no currently-valid invocation changes output by a
byte"). Read plainly, "previously-valid" is false for this very release: three invocation shapes
(`--stdin --rounds 3`; `['--stdin','results.json']`; `--round=3`) that exited 0 with a verdict
**before** this release now exit 1 — that is exactly the release's own headline change, so
"previously-valid" describes the pre-change acceptance set, not the post-change one the sentence
means to scope. Confirmed fixed at the landed tip: `README.md` line 363 reads "No **currently**-valid
invocation's output changed by a byte." This is a new sub-instance of the family distinct from
Recurrences 1–13: not a clause overstating a guard's *reach*, but a stock closing boilerplate phrase
("No previously-valid invocation...") used out of habit where the plan's own scoping term differs by
one word — check the literal word the plan mandates (Commander's Intent / End state), not just the
sentence's shape, before reusing a prior release's boilerplate closing clause.

**(b) The headline "the gate CLI refuses malformed argv loudly in every mode" is one channel wider
than the implementation — left unfixed (Nit, `disposition: note`).** `main()`'s default-deny loop
(`skills/red-team/assets/red-team-gate.mjs`) refuses every unknown `--` token in both modes, but in
FILE mode a surplus **bare** token is still silently ignored by design (`const path = args.find(a
=> !a.startsWith('--'))` picks the first bare token as the results path; any further bare token is
never inspected) — so `red-team-gate.mjs results.json stray.json` is malformed argv that emits a
verdict normally. The very next bullet in the same paragraph states this exact carve-out ("surplus
bare tokens there staying ignored (deliberate)"), so a reader of the full paragraph is not misled —
headline-vs-body, not a paragraph-internal contradiction. Same shape as Recurrence 12(b)'s
universal-quantifier-vs-N-1-items and Recurrence 13(a)'s scope-word-on-an-absolute: an unqualified
"every mode" in the bolded headline the checklist item 1 ("Bound every absolute") exists to catch,
one line above the very bullet that already bounds it correctly. Not absorbable — the fix edits the
`## Status` release-slot paragraph, which the disposition rule excludes fail-closed; left unfixed at
land, still live at the tip above (verify still present before acting).

**Now 21 recurrences.** Confirms both halves of the established Rule keep recurring independently
in the same release cycle: a boilerplate word can drift from the plan's own literal (new
sub-mechanism), and a headline absolute can outrun a scope its own next sentence already states
correctly (Recurrence 12(b)/13(a)'s family). Applies-to checklist addendum: when reusing a prior
release's stock closing sentence ("No previously-valid invocation..."), diff it against *this*
plan's own Method/End-state wording word-for-word — don't assume the boilerplate travels unchanged
release to release.

Related: [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] (the worktree-lookup
name-collision this recurrence's own grounding hit and resolved via the numeric-suffix rule).

## Recurrence 15 (2026-08-15, plan `2026-08-06-escape-guard-exit-contract`, phase 2 "Release",
task 2.1) — an unbounded absolute inherited byte-for-byte from the suite's own banner comment, and a
fixture misnamed "escape-worthy" when the suite's own comments assign that role to a sibling case

A twenty-second and twenty-third instantiation, both `disposition: note` Nits on the same `## Status`
bullet. `code-verified` — read directly at the `_refinery9` worktree whose `HEAD` is byte-equal to
the landed tip `900616ebda177d7970b9efbc8d39544a516c6e0e` (gitdir physical path containing this
plan's slug: `<repo-root>/.claude/war-worktrees/2026-08-06-escape-guard-exit-contract-2026-08-15/2026-08-06-escape-guard-exit-contract-2026-08-15/_refinery/`),
`README.md` line 363.

**(a) "every live ref reported as 'removed'" is an unbounded absolute; the ref-diff is
namespace-scoped to `refs/heads/` + `refs/tags/`.** The bullet describes the pre-fix awk `NR==FNR`
degeneracy as reporting "every live ref ... 'removed'." At the pin, `skills/red-team/assets/assert-no-repo-escape.sh`
filters both ref-diff operands to `refs/heads/` + `refs/tags/` only, and its own header comment
states the `refs/remotes/*` exclusion is load-bearing (`git for-each-ref` would otherwise pull in
remote-tracking refs that move on any background fetch). So the degeneracy reports every live
HEAD/TAG ref as "removed," not literally every live ref. **New sub-mechanism for the family:** the
phrasing is not the worker's own overclaim — it is inherited byte-for-byte from the landed suite's
own case-28 banner comment ("the END block reports every live ref as 'removed'"), so the blurb is a
*faithful mirror of the artifact* it describes, and the artifact itself already carries the
unbounded-absolute shape this lesson's own family exists to catch. A blurb author copying a test
banner's wording inherits that banner's imprecision along with its accuracy — check the cited
artifact's own comment for scope words before trusting it as blurb-ready prose, the same discipline
Recurrence 9's checklist addendum names for ADR/test paraphrase, now extended to comment-to-comment
copying.

**(b) "suite case 28's fixture carries an escape-worthy `rogue` branch" — the fixture that escapes
on its own merits is case 27, not case 28.** The bullet reads: "...an infra fault is never preempted
by an escape conclusion — suite case 28's fixture carries an escape-worthy `rogue` branch and
asserts the exit is explicitly not 1." At the pin, `assert-no-repo-escape.test.sh` case 28's `rogue`
branch name matches neither junk pattern (`refs/heads/redteam-*`, `*-sandbox-*`), and case 28 takes
no prior `--snapshot`, so `rogue` is not a ref-diff delta either — none of the guard's escape checks
(a/b1/b2/c) ever flag it; the suite's own comment states its role is only to supply "refs to invert"
for the zero-byte awk degeneracy. The suite's own comments assign the "would escape on its own
merits" role to case 27's `redteam-would-escape` branch instead ("a b1-pattern junk ref fires check
(b1) -> 1"). The claim is still defensible in a weaker reading (under the *pre-fix* degeneracy,
case 28's fixture does exit 1), but "escape-worthy" as written names the wrong case. **New
sub-mechanism for the family:** not a scope-word gap on a true clause, but a **fixture
misattribution** — the blurb correctly describes the guard's *ordering rule* (infra never preempted
by escape) while citing the wrong one of two adjacent, similarly-shaped test cases as the example
that demonstrates it.

Both left unfixed at land (`## Status` is a release slot outside task 2.1's `Files:` list to touch
incidentally; the disposition rule refuses `absorb` for anything touching a version/release slot —
the audit rationale for (a) additionally notes README.md is one of the four release version slots,
so a phase-close polish edit there is slot-adjacent and explicitly out of the absorb envelope).

**Now 23 recurrences across four overlapping sub-families**: "X is Y too" absolute-overclaim, "a
guard's discrimination/reach described more broadly than its own code", "task-diff scope vs.
release-window scope", and (new, this recurrence) "an inherited-from-source-comment absolute" plus
"fixture misattribution between two similarly-shaped suite cases." **Applies-to checklist addendum:**
when a blurb sentence is lifted from (or closely paraphrases) a test/guard's own banner or inline
comment, that comment is not automatically blurb-safe — apply the same "bound every absolute, repeat
the guard's own scope word" checklist to the *source comment* before copying it; and when citing a
specific suite case number as "the" example of a behavior, re-read that case's own fixture setup (not
just its neighbor's) to confirm which case actually earns the property being illustrated.

Related: [[awk-empty-baseline-nr-fnr-degeneracy]] (the underlying guard defect this release's task 1.1
fixed — the degeneracy this bullet describes); [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]
(worktree-lookup path used to ground this recurrence's D3 read, `_refinery9` resolved by gitdir
physical path over the ambiguous bare entry name).

## Recurrence 16 (2026-08-15, plan `2026-08-06-done-when-floor-wiring`, phase 2 "Release", task 2.1) —
an unbounded absolute repaired two sentences later in the same bullet (four independent audit
findings on one clause), plus a quoted test-case number dropping that case's own declared
discrimination ceiling

A twenty-fourth and twenty-fifth instantiation on the same `## Status` bullet. `code-verified` — read
directly at the `_refinery11` worktree whose `HEAD` (`fdb71c2f2d4c13c4cd58267e565c6e2cdeec881e`) is
the gate-audit `auditSha` and content-equal to the landed merge tip
`03b4cbe56e4a694e7dd985f7f797053405908b71` (gitdir physical path containing this plan's slug:
`<repo-root>/.claude/war-worktrees/2026-08-06-done-when-floor-wiring-2026-08-15-p2/2026-08-06-done-when-floor-wiring-2026-08-15/_refinery/`
— resolved over the bare-name-colliding `_refinery`/`p2-2.1` entries per
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]'s name-collision rule), `README.md`
line 363.

**(a) "no longer holds the inherited stdout fd past the kill" is stated unbounded, then bounded two
sentences later in the same bullet — four independent audit-seat findings on the identical gap.**
The Watchdog-group-kill bullet opens: "a backgrounded grandchild that stayed in the command's group no
longer holds the inherited stdout fd past the kill," then two sentences on: "the KILL insurance fires
only while the watchdog is still alive, so a TERM-ignoring descendant that never left the group can
outlive the teardown — neither survivor can change the exit code." `skills/war/assets/assert-done-when.sh`'s
own TIMEOUT header (lines 32-42 at the pin) states the same two residuals, explicitly framed: "though
each can hold an inherited stdout fd after the floor exits (the `sleep` for at most ~2s, a survivor
for its lifetime)." So the fd-release claim is true only for a TERM-responsive in-group grandchild; the
bullet's own next clause says so, but the opening clause doesn't carry the qualifier at the point it's
asserted — exactly checklist item 1 ("bound every absolute") and item 2 ("repeat the guard's own scope
word"). Four Nit `disposition: note` findings landed on this one clause in a single audit round (task
2.1), all describing the identical gap from slightly different angles (unqualified fd claim; residual
sentence dropping the fd half in favor of only the exit-code half; the group-kill-unbounded framing
generally) — the paragraph self-repairs, so no reader is left misled, but this is the family's highest
same-clause finding-count yet observed from a single audit pass (Recurrence 11 held nine findings, but
spread across a whole paragraph, not one clause).

**(b) "(case 22 pins it)" drops the case's own declared discrimination ceiling — new instance of
Recurrence 15(a)'s "inherited/cited-source absolute," here inverted.** The bullet closes its stdin
sentence with the bare parenthetical "(case 22 pins it)." `assert-done-when.test.sh` case 22 (line 614
at the pin) carries its own explicit "DISCRIMINATION CEILING" banner: "the case can only red when the
SUITE's own stdin does not EOF. Under a stdin that is already `/dev/null` or closed (a bare CI shell),
`cat` sees EOF either way and the case passes even with the redirect deleted." Recurrence 15(a) was a
blurb *faithfully copying* a source comment's own unbounded wording; here the source comment is itself
already scoped/caveated, and the blurb's citation drops the caveat rather than inheriting it — the
mirror-image failure mode of the same discipline (checking a cited artifact's own scope words before
quoting it applies whether the source states the caveat or omits it).

Both left unfixed at land (`## Status` is a release slot outside task 2.1's `Files:` list to touch
incidentally; the disposition rule refuses `absorb` for anything touching a version/release slot).

**Now 25 recurrences.** (a) is the sharpest same-clause repetition rate yet — four seats naming one
scope-word gap in one sentence — a signal that "bound every absolute" is easiest to violate exactly
where a guard has two named residual classes and the prose states the general claim before the
residuals rather than after. **Applies-to checklist addendum:** when a clause names a general
mitigation ("X no longer holds Y") immediately followed by named exceptions to it, state the bound at
the point of the general claim itself ("X, unless it belongs to residual class Z, no longer holds Y"),
not only in the residual sentence that follows — a residual stated two sentences later repairs a
careful reader's understanding but not the opening clause's own truth value in isolation, which is what
an audit seat scores.

Related: [[awk-empty-baseline-nr-fnr-degeneracy]] (unrelated family, this phase's own task 1.1 guard);
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] (worktree-lookup path used to ground
this recurrence's D3 read, `_refinery11` resolved by gitdir physical path over the ambiguous bare
entry name shared with a different concurrent plan's `p2-2.1`/`_refinery`).

## Recurrence 17 (2026-08-15, plan `2026-08-06-shell-pin-helpers`, phase 2 "Release", task 2.1) —
"Two committed controls pin the guard both ways" drops the exact scope word the suite's own comment
declares: the controls exercise only one of three hand-duplicated guard copies

A twenty-sixth instantiation, flagged independently by two auditor seats on the identical `## Status`
bullet clause. `code-verified` — read directly at the `p2-2.17` task worktree whose `HEAD`
(`496ed1a8a8f211e82c9a0c1c836e3182dfe90330`) is the gate-audit `auditSha`, content-equal to the landed
tip `71ed15b21bc48092ffad961ed54e3d66fbb4acd0` for this bullet (the release-bump commit between them
replaces only the `**0.17.4**` headline sentence, not this bullet's body — gitdir physical path
containing this plan's slug:
`<repo-root>/.claude/war-worktrees/2026-08-06-shell-pin-helpers-2026-08-15/2026-08-06-shell-pin-helpers-2026-08-15/p2-2.1/`),
`README.md` line 363, the "Absence-pin existence guard (`MISSING FILE`)" bullet.

**"Two committed controls pin the guard both ways" is true only through `lacks_i()`, but the bullet's
opening clause already named the guard as present in all three `strip_prose`-reading helpers.** The
bullet's first sentence names `lacks()`, `lacks_i()`, and `has_i_stripped()` as each independently
opening with the `[ -f ]` guard — accurate; the guard block is hand-duplicated into all three bodies
(`skills/war-machine/war-pipeline-structure.test.sh`, verified at the pin: each of the three helper
bodies repeats the identical `if [ ! -f "$1" ]; then printf 'not ok - %s MISSING FILE...'; fails=$((fails+1));
return; fi` block). The bullet then says "Two committed controls pin the guard both ways" — but the
suite's own control-block comment states the opposite scope explicitly: `# Existence-guard controls
(#1362) ...` followed by "Both controls invoke lacks_i SPECIFICALLY" (both the missing-path and
real-file probes call `lacks_i` alone, lines ~312-342 at the pin). Because the guard is duplicated
rather than shared, no committed assertion exercises the guard copy inside `lacks()` or
`has_i_stripped()` — deleting either of those two copies reds nothing. **New sub-mechanism for the
family:** the prior 25 recurrences are all about a *single* mechanism described with an overbroad
clause; here the mechanism is genuinely **triplicated** (not shared code), and the blurb's "pin the
guard both ways" reads as pinning the mechanism generally when only one of the three copies is under
committed test — the closest sibling is Recurrence 15(a)'s "faithful mirror of a source banner
comment," except here the *blurb itself* (not an inherited banner) drops the scope word its own
cited suite comment states two lines above the control block, in the same file.

Both `disposition: note`, Nit, non-blocking, not fixed before land (`fixRounds: 0`) — flagged
identically by two auditor seats in the same audit round (a repeat-seat pattern this family has seen
before, e.g. Recurrence 16(a)'s four seats on one clause); `## Status` is a release slot outside task
2.1's `Files:` list to touch incidentally, and the disposition rule refuses `absorb` for anything
touching a version/release slot.

**Sharper form of the Rule for this instance:** when a guard mechanism exists as multiple
hand-duplicated copies (not a single shared function) and only one copy is committed-tested, "the
guard is pinned" or "controls pin the guard" is a claim about the *tested copy*, not the *mechanism* —
name the specific function the controls invoke ("pin the guard both ways through `lacks_i()`") rather
than the general clause, exactly as the suite's own adjacent comment already does two lines above the
blurb's paraphrase.

**Now 26 recurrences across four overlapping sub-families** (unchanged families; this is a fresh
instance of "a guard's discrimination/reach described more broadly than its own code," now
specialized to hand-duplicated, not-actually-shared implementations). Applies-to checklist addendum:
before writing "the guard"/"the mechanism" is pinned/covered, check whether the underlying code is one
shared function or several hand-duplicated copies — a control exercising one copy does not pin the
others, even when they are byte-identical at the point the blurb is drafted.

Related: [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] (worktree-lookup path used to
ground this recurrence's D3 read — the task worktree's own branch never advanced to the release-bump
commit, since that commit was made directly on `dev/2026-08-06-shell-pin-helpers` during Refine's land
step, not on any task/integration branch this servitor's cwd or worktree enumeration could reach).

## Recurrence 18 (2026-08-15, plan `2026-08-06-gate-audit-finding-routing`, phase 3 "Release", task
3.1) — a blurb clause inherits the exact rule-attribution overclaim already carried by the guard's
own deny message, one level removed from the guard code itself

A twenty-seventh instantiation, `disposition: follow-up`, Minor. `code-verified` — read directly at
the `_refinery13` worktree whose `HEAD` is byte-equal to the landed tip
`3843440a5e0f85e4a3efd4b01b5b2f48e5f02e99` (gitdir physical path containing this plan's slug:
`<repo-root>/.claude/war-worktrees/2026-08-06-gate-audit-finding-routing-2026-08-15/_refinery/`),
`README.md` line 368.

**"…the deny message now names the rule that fired (glob/alternation/expansion metacharacters are
refused outright)" is true only when the offending byte genuinely is a glob/alternation/expansion
metacharacter — but the check the message describes is a single character-ALLOWLIST residue test
that fires for ANY out-of-allowlist byte.** At the pin, `hooks/validate-auditor-git.sh` lines 90-91
extract `residue` via `LC_ALL=C tr -d 'A-Za-z0-9 ./_=:,@^~%+-'` and, when non-empty, emits ONE static
deny message ending "the metacharacter rule fired: glob/alternation/expansion metacharacters are
refused outright…" for every residue — a `&&`/`;` chain operator, a stray `#`, a tab, or a non-ASCII
byte all trigger the identical message, so a seat denied for a pure chain operator reads "the
metacharacter rule fired" exactly as if a glob had fired. The plan's own End state 17 scopes the
claim correctly ("a metacharacter-refused search denial names the rule that fired"), but the blurb's
prose widens the trigger clause to "when the auditor git guard's forbidden-character check fires" —
i.e. every denial the check produces, not only the metacharacter-caused ones.

**New sub-mechanism for the family, and the first case where a blurb inherits an overclaim from its
own guard's *deny message* rather than a test's banner or a design doc's amendment paragraph.**
This exact over-attribution is *already* recorded, `code-verified`, one layer down, in this same
campaign's sibling lesson [[static-guard-deny-message-misnames-which-rule-fired-for-shared-char-class]]
(landed at Task 2.2, `phase: 2026-08-06-gate-audit-finding-routing/2.2`) — that lesson documents the
guard *message itself* over-attributing which rule fired for a shared allowlist-residue check. This
recurrence shows the identical over-attribution propagating one level further up the documentation
chain: the release blurb's own paraphrase of that message reproduces the same imprecision, because
the blurb author (correctly) trusted the message text as blurb-ready prose without re-checking it
against the underlying check's actual trigger set — the same discipline gap Recurrence 15(a) named
for copying a test banner's wording, now extended to copying a guard's own runtime deny string.

Not a security defect, not a hold: no deny decision, exit code, char set, or verb allowlist moved;
only the diagnostic-and-blurb text over-attributes precision it doesn't have. Both auditor seats
(task-level and the phase-close gate-audit) that reviewed this bullet left it Minor/`follow-up`
(one severity step above this family's default Nit, matching Recurrence 8's precedent for a false
claim sitting in the same clause a plan End state scopes correctly) rather than `absorb` — `##
Status` is a release-slot paragraph outside a normal task's `Files:` list to touch incidentally, and
the disposition rule refuses `absorb` for anything touching a version/release slot. Not fixed before
land (`fixRounds: 0`); suggested fix on record: drop the "that fired" attribution, or restore the
plan's own scope word ("when the guard's forbidden-character check refuses a search-shaped command,
the deny message now names the metacharacter rule…").

**Sharper form of the Rule for this instance:** when a release blurb paraphrases a guard's own deny
message (not a test banner, not a design doc) as blurb-ready prose, the message's own precision gap
is not blurb-safe just because it is the artifact's own wording — re-derive the message's *actual*
trigger set from the check's code (here: a character-allowlist residue test, not a metacharacter
detector) before repeating its rule-attribution clause, exactly as Recurrence 15(a) requires for a
test banner's wording and Recurrence 9's addendum requires for an ADR/test paraphrase. A guard
message and a release blurb can carry the *identical* over-attribution independently authored in two
different tasks of the same plan, because each author trusted the nearest artifact's prose rather
than the underlying check's code.

**Now 27 recurrences across four overlapping sub-families**, plus this recurrence's new
"message-to-blurb inheritance" sub-instance of the "inherited absolute" family Recurrence 15
established. Applies-to checklist addendum: before publishing a blurb clause paraphrasing a guard's
*own* deny/log message, trace the message back to the check's actual code condition (allowlist vs.
denylist framing, shared-message-many-causes vs. per-cause branching) rather than treating the
message's existing wording as already precise.

Related: [[static-guard-deny-message-misnames-which-rule-fired-for-shared-char-class]] (the sibling
lesson documenting the same over-attribution one layer down, in the guard's own message rather than
the release blurb describing it); [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]
(worktree-lookup path used to ground this recurrence's D3 read — `_refinery13` resolved by gitdir
physical path over several similarly-numbered sibling worktree entries for this same plan slug).

## Recurrence 19 (2026-08-16, plan `2026-08-06-verdict-adjudication-integrity`, phase 2 "Release",
task 2.1) — the guard's own "SHORT of its whole line" scoping is dropped from a "drift on any of
those five lines" clause, and a corrected artifact's qualifier is re-dropped verbatim on a second
medium, plus a `Homes:` link list omitting a guard file named in the same bullet's own prose

A twenty-eighth, twenty-ninth, and thirtieth instantiation across four raw audit findings (two Nits
collapsing to the same "byte-identical" fact, one Minor escalating that same fact once both
instances were counted together, one Nit on the `Homes:` list), all on the same `## Status`
paragraph. `code-verified` — the servitor's own cwd (`<repo-root>` for this session) was not the
landed tip; grounded per the gate-audit fallback rung (worktree lookup found `p2-2.19`'s `HEAD`
resolving to the task branch tip `7377ea7deda56abc498562ad036cae56c5c8b04d`, matching the audit
log's own `auditSha` with `gateEvidence: true`, not the separately-threaded landed-tip anchor —
read directly at that gitdir physical path,
`<repo-root>/.claude/war-worktrees/2026-08-06-verdict-adjudication-integrity-2026-08-16/p2-2.1/`),
`README.md` lines 364/365.

**(a) "or drift on any of those five lines" drops the guard's own "SHORT of its whole line" scoping
— new sub-mechanism: the guard extracts a sub-segment, but the blurb's absolute names the whole
line.** The five-surface verdict-enumeration-guard bullet closes: "A sixth verdict in `verdict()` —
or drift on any of those five lines — reds the suite." At the pin,
`skills/red-team/assets/workflow-scaffold.test.mjs`'s own banner states the opposite scope for
surface 4: "Surface 4's read is additionally scoped SHORT of its whole line: that line also carries
the blocking verdict in its trailing routing-invariant clause and the top proceed verdict a second
time in a parenthetical, so a whole-line read would false-pass both drifts" — confirmed at the
extraction site, `const seg = proceedLines[0].split('**(a) Proceed**')[1]` truncated at
`seg.indexOf('(')`. A drift inside the truncated parenthetical or the routing-invariant clause is
never compared, so "drift on any of those five lines" is broader than the guard: it should read
"drift in any of those five enumerations" — the same shape as every scope-word-drop recurrence
above, but the first one caught by the guard's *own drift-guard test file* naming the gap in its
own banner, one bullet away from where the blurb paraphrases it.

**(b) The unqualified "byte-identical" eviction claim reappears on a second medium after being
corrected on the first — new sub-mechanism: a same-phase artifact fix doesn't propagate to the
release blurb describing that same artifact.** Both the headline ("via a byte-identical eviction of
five cold recovery entries") and the CONTEXT.md-budget bullet ("are evicted byte-identical to the
new unbudgeted cold home") state the claim unqualified. `skills/war/references/glossary-cold.md`'s
own header at the pin reads: "Each body below was byte-identical to its pre-eviction `CONTEXT.md`
text **at eviction time** (only repo-root-relative links were re-anchored for this file's depth)" —
wording landed by this *same phase's* phase-1 polish commit `d30f70f`, itself a direct response to
an audit Minor titled "New eviction destination glossary-cold.md carries an UNQUALIFIED byte-identity
header claim." Two of the five moved bodies are demonstrably not byte-identical: the Orphan-adoption
and Dead-agent-land-failure entries' in-body ADR links (`docs/adr/0008-...`, `docs/adr/0005-...`)
were re-anchored to `../../../docs/adr/...` for the new file depth. **This is the family's first
observed instance of the source artifact already carrying the corrected wording — from an audit
finding raised and fixed earlier in the *very same phase* — while the release blurb describing that
artifact reintroduces the pre-fix unqualified form**, closest in mechanism to Recurrence 9(a)'s
"paraphrase drops a cited source's own scoping word," except here the source and the blurb are
artifacts of the same phase rather than a pre-existing ADR/test the blurb merely cites. Escalated to
Minor/`disposition: follow-up` on the third (combined, "two instances") framing of the same fact,
above this family's usual Nit — one severity step matching Recurrence 8's and Recurrence 18's
precedent for a false claim sitting in the same clause a plan's own literal (here, End state 11)
also states unqualified, so the plan's own wording is not itself at fault; `README.md` sits outside
`reference-link-integrity.test.mjs`'s Arm-3 scan (`agents/` + `skills/war/references/` only), so no
guard holds the README restatement.

**(c) The `Homes:` link list omits the guard file the same bullet names in prose — the enumeration-
completeness sub-family, applied to a link list rather than a claim.** The CONTEXT.md-budget bullet
credits "a per-term pointer-pair drift guard in `skill-doc-contracts.test.mjs`" (confirmed present
at the pin as the D32 row, `skills/war/assets/skill-doc-contracts.test.mjs` line 1261) but its
trailing `Homes:` list links only `CONTEXT.md` and `glossary-cold.md`. Informational-only Nit — the
prior release's Lead fix (`cc54ccb`) already tightened this Home/Homes accuracy convention once.

Findings (b) and (c) were `disposition: note`; (b)'s combined-instance framing was
`disposition: follow-up`, Minor. None fixed before land (`fixRounds: 0`) — `## Status` is a release
slot outside task 2.1's `Files:` list to touch incidentally, and the disposition rule refuses
`absorb` for anything touching a version/release slot.

**Now 30 recurrences across five overlapping sub-families**, plus this recurrence's two new
sub-mechanisms: (a) the guard's own test-file banner — not a design doc, ADR, or suite-case comment
— names the exact scope gap the blurb drops, one bullet away; (b) a same-phase artifact correction
(itself an absorbed audit fix) fails to propagate to the release blurb that separately describes the
corrected artifact. **Applies-to checklist addendum:** when a release blurb describes an artifact
that this *same phase* already corrected in response to an earlier audit finding (check the phase's
own audit log / polish commits for prior fixes to the artifact being paraphrased, not just the
artifact's current text), re-derive the blurb's wording from the corrected artifact rather than
reusing an earlier draft's phrasing — the correction being "in the same PR" does not make it
automatically visible to whoever drafts the blurb's summary of it.

Related: [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] (gate-audit `auditSha`
fallback rung used to ground this recurrence's D3 read, since no local worktree HEAD matched the
separately-threaded landed-tip anchor and no local ref existed for the `dev/` landing branch).

## Recurrence 20 (2026-08-16, plan `2026-08-06-redteam-rounds-config-telemetry`, phase 2 "Release",
task 2.1) — two exact recurrences of already-named sub-families (distributive plural over a
headline's two-item subject; a `Home:` list omitting the bullet's own named test file), plus one
confirmed-safe instance of a different fragility class (a retired token quoted inside the blurb
itself)

Three `disposition: note` Nits on the same `## Status` paragraph. `code-verified` — the servitor's
own cwd was an unrelated concurrent plan's worktree; grounded per the gate-audit fallback rung
(worktree lookup found `p2-2.110`'s gitdir physical path containing this plan's slug, `HEAD`
resolving to `76523230431318e7d430928b3bfb32440fcbf92b`, matching the audit log's own `auditSha`
with `gateEvidence: true` rather than the separately-threaded landed-tip anchor
`697db451b41911051df271258abfc30c2e6437e9` — read directly at
`<repo-root>/.claude/war-worktrees/2026-08-06-redteam-rounds-config-telemetry-2026-08-16/p2-2.1/`),
`README.md` lines 361/363/364.

**(a) Headline's plural subject distributes a rule only one of the two named rows gained — exact
recurrence of Recurrence 5's "bolded/headline label vs. narrower body scope" shape.** The headline
reads "`/war-review`'s rounds rows gain a named `plans[].slug` selection rule with `$MAIN`-anchored
sweeps" — plural "rows" grammatically covers both clauses for both rows. At the pin only row 1
("red-team rounds — this plan") gained the `plans[].slug` selection rule; row 2 ("trend across
campaigns") gained only the `$MAIN`-anchoring and deliberately carries no selection rule (it sweeps
every campaign ledger). The body two lines below (line 365) states the split correctly, so no
operator is left with a false statement of what the code does — same mitigating shape as every
prior "self-corrects nearby" instance in this family.

**(b) `Home:` list omits the guard's own test file, named in the same bullet's prose — exact
recurrence of Recurrence 19(c), one phase later, on a different bullet.** Bullet 2 (line 364,
`record`'s numeric-flag refusal) ends `Home: campaign-ledger.mjs`, but the bullet's own prose
credits the refusal's six generated test cases, which live in `campaign-ledger.test.mjs` — the
sibling bullet 1 (line 363) does list its own test file in its `Homes:` set. Confirms Recurrence
19's closing observation that a same-phase Home/Homes-accuracy fix (Lead commit `cc54ccb`, one
phase prior) does not durably prevent the next phase's blurb from re-dropping a bullet's own named
test file — the convention needs a structural guard, not just a prior correction, to stop
recurring.

**(c) Confirmed-safe instance, different family: quoting a retired token inside the blurb itself is
safe only because the retirement grep is directory-scoped.** Bullet 1 (line 363) states the retired
`proceed arm` wording "is gone from the maintained home (`grep -rn 'proceed arm'
skills/war-campaign/assets/` is zero-hit)" — which places the retired literal itself into
`README.md`. Verified zero-hit across all four files under `skills/war-campaign/assets/` at the
pin, and no gate test greps `README.md` for the retired phrase (the step-3 structure test reads
`skills/war-campaign/SKILL.md` directly; `version-slots.test.mjs` scopes its own absence check to
`## Releasing`, the same class of carve-out). **Not a defect** — the blurb's own inline
scope-qualification (`skills/war-campaign/assets/`) is the correct mitigation, matching
[[backstop-retirement-grep-false-reds-on-sanctioned-replacement-substring]]'s guidance to scope a
retirement check narrowly. Recorded because the risk class is real and not yet named in this
family: if a retirement grep is ever widened repo-wide, a `## Status` blurb quoting the retired
literal (even inside backticks, to prove its own absence) becomes the first false red — the same
way `version-slots.test.mjs` already special-cases `## Releasing` for this exact reason. **New
applies-to checklist item:** before widening any retirement grep to repo-wide scope, exclude
`README.md`'s `## Status` section (or any release-slot text that quotes the retired literal to
prove its own absence).

Both (a) and (b) left unfixed at land (`## Status` is a release slot outside task 2.1's `Files:`
list to touch incidentally); (c) required no fix.

**Now 33 recurrences across five overlapping sub-families**, two of them (a, b) exact repeats of
already-named shapes (Recurrence 5, Recurrence 19(c)) with no new sub-mechanism — the value of
recording them is the *rate*: this is the second phase in a row to reproduce a `Home:`/`Homes:`
list gap in the same file despite a Lead fix one phase prior, suggesting the convention needs a
structural drift guard rather than relying on each phase's blurb author re-reading the sibling
bullet's format.

Related: [[backstop-retirement-grep-false-reds-on-sanctioned-replacement-substring]] (the retirement-
grep-scoping guidance (c) confirms in a positive instance);
[[retirement-grep-for-prose-needle-must-be-case-insensitive-or-sentence-initial-capitalization-evades-it]]
(sibling retirement-grep fragility, case-sensitivity rather than scope);
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] (gate-audit `auditSha` fallback rung
used to ground this recurrence's D3 read).

## Recurrence 21 (2026-08-16, plan `2026-08-06-doc-cli-consistency-corpus`, phase 2 "Release", task
2.1) — three auditor seats converge on the identical clause: "per-family deepEquals ... prove each
slice is derived" describes 3 of the 4 enumerated D3 sentinel families; the fourth (README.md) is a
hardcoded literal that cannot structurally carry a deepEqual proof

A thirty-fourth instantiation, `disposition: note`, Nit, non-blocking, flagged identically by three
independent auditor seats in the same audit round. `code-verified` — read directly at the
`_refinery16` worktree whose `HEAD` (`ccdf5ad059eb5ac1fe76fca4d72914217e96aa3e`) is byte-equal to
the separately-threaded landed-tip anchor exactly (the strongest grounding rung — the worktree's own
`logs/HEAD` shows its final entry is the same "Merge integration/2026-08-06-doc-cli-consistency-corpus/phase-2"
that produced that SHA), gitdir physical path containing this plan's slug:
`<repo-root>/.claude/war-worktrees/2026-08-06-doc-cli-consistency-corpus-2026-08-16/_refinery/`,
`README.md` line 363.

**The bullet enumerates four D3 sentinel families** (`skills/*/SKILL.md`, `skills/*/references/*.md`,
`agents/*.md`, `README.md`) and then asserts uniformly: "four D3 sentinels pin one path per family,
and per-family `deepEqual`s against fresh `readdirSync` calls prove each slice is derived." At the
pin, `skills/_shared/doc-cli-consistency.test.mjs`'s spec-posterity test (lines 347-359) carries
exactly **three** derivation `deepEqual`s: the SKILL.md slice against a fresh `readdirSync`, the
agents slice against a fresh `readdirSync`, and the references slice against `referencesFiles()`
(the same census-bound scan function that built the slice — a self-comparison, not an independent
directory read). `README.md`'s corpus membership is a deliberate literal `paths.push('README.md')`
(line 207) with no derivation assert and none possible: a single fixed path is not a scanned slice
to prove derived. The suite's own comment states the narrower reach two lines above the asserts:
"The SKILL.md and agent-card slices must each deepEqual a fresh readdirSync of their family, and the
references slice must deepEqual referencesFiles() (the census-bound scan)" — the blurb collapses
that three-arm distinction into a uniform four-family claim.

**New instance of the family's "universal quantifier over N items where one is structurally
incapable" shape** (closest sibling: Recurrence 12(b)'s "four doctrines, only three get a guard
clause"), sharpened one step further — there, the fourth doctrine *could* in principle have gotten a
mechanized guard; here README's fourth "family" is definitionally un-scannable, since one hardcoded
literal path has no directory to `deepEqual` against. The substantive claim (the corpus is
scan-derived, not hand-kept) is true for the three scanned families; only the *proof-coverage* claim
over-reaches by one family.

**Three auditor seats flagged the identical clause independently in the same audit round** — the
family's highest same-clause seat-convergence rate on record after Recurrence 16(a)'s four seats
(there spread differently: four findings on one gap vs. here three near-identical restatements of
the same gap). All `disposition: note`, Nit, `fixRounds: 0`; not absorbable — the fix edits the
`## Status` paragraph, a release version slot, which the disposition rule bars from absorb
fail-closed.

**Applies-to checklist addendum:** when a blurb enumerates N named surfaces and then claims a
uniform proof mechanism "per-X," check whether every named X is even structurally *capable* of
carrying that mechanism before publishing — a hardcoded single-path member of an otherwise-scanned
corpus can never `deepEqual` a directory scan, so a "per-family" proof claim covering it is false by
construction, not merely by an unwritten assert that could someday be added.

Not fixed before land (`## Status` is a release slot outside task 2.1's `Files:` list to touch
incidentally; the disposition rule refuses `absorb` for anything touching a version/release slot).

**Now 34 recurrences across five overlapping sub-families.**

Related: [[release-blurb-headline-count-word-can-mismatch-its-own-enumeration]] (sibling family,
headline-count arithmetic rather than per-item proof-mechanism claims);
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] (worktree-lookup path used to ground
this recurrence's D3 read — `_refinery16`'s logged `HEAD` matched the threaded landed-tip anchor
exactly, the strongest grounding rung, no gate-audit fallback needed).
