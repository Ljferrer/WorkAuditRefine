# Red Team — 2026-08-02-war-engine-and-standing-doc-truth (2026-08-03)

**Verdict:** BLOCKED (advisory) — every root finding is patched in the plan and carries an adjudication row; the campaign proceeds per the ratified operator directive (`redteam-blocked-is-advisory-once-patched-and-adjudicated`). **Single round by explicit operator instruction** ("stop red-teaming after this round") — the bounded ≤2-round re-verify loop was deliberately not run; the patches are Lead-verified against live measurements rather than re-probed.

Source spec: [2026-08-02-war-engine-and-standing-doc-truth-design](../specs/2026-08-02-war-engine-and-standing-doc-truth-design.md).
Plan authored by `/war-machine --afk` (ADR 0014) — its `## AI-Commander's Intent` and AI-declared backstops had no operator ratification entering this pass.

## Attack surface

Spine (all six): `claims-vs-reality`, `executable-proof`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan`.

Bespoke (6): `default-flip-old-absent`, `oldabsent-pattern-brittleness`, `d22-negative-reference-both-ways`, `count-keyed-arm-symmetry-pin`, `d9-card-script-usage-agreement`, `adr-and-tour-doc-truth`.

`ff-topology` not run — zero merge-topology anchors (token grep returned 0; the plan's two git-diff anchors are two-dot, not `^1`/`--first-parent`/three-dot, and a hand-read of the evidence prose found no merge-commit claim). `unguarded-new-mirror` vacuous — D5 adds an assignment, not a `const` re-declaration; the plan states this and it checks out.

Coverage: **12/12 on-target, zero off-target, zero dropped.** 19 agents, 0 errors. Run `wf_4505cd9e-00d`. Escape guard exit **0**, worktree clean, HEAD unmoved.

## Executed proof

- **D6 arm-symmetry pin is structurally vacuous as specified** — built and run: correctly red pre-fix, green post-fix, but **green against a mirrored third arm lacking the assignment**, the one property the plan sells it on.
- **Five of six OLD-absent guards false-negate** on a re-cased or re-wrapped copy with the retired claim still live.
- End state 2's quoted retirement phrase is **not a byte-run in the file** — it differs from the live text on three axes at once (bold markup, an elided em-dash sub-clause, word order), so a literal grep would have been vacuously green from the start.
- The D9 guard is green on the corrected card and red on flag-first, and does **not** false-red on the legitimately different placeholder names; its dep edge (`1.4 deps: [1.1]`) is genuine — red at the frozen phase base.
- Live census: `.tours/architect-war-system.tour` carries `learningsTarget` at **two** steps (27, 99); `grep -rn 'show --name-only'` finds a third live carrier of the retired probe outside the plan's closed survivor set.

## Findings

### Major

- **The D6 count-keyed pin cannot catch the drift it exists for.** Extraction keyed on two hardcoded dispatch-label literals; a third arm carries a third label, is never inside an extracted region, and the count stays 2 == 2 forever. Verified against the live template: exactly two re-land arms (`…:environment-proceed`, `…:baseline-proceed`) plus a suffix-less initial land. **Resolution:** key on the dispatch-label **shape** (`land:phase-` + `${ph.id}` + `:` + any `-proceed` flavor, excluding the initial land by construction), plus an explicit region boundary and a `>= 2` region-count floor so a degenerate 0 == 0 green is impossible.
- **The Gate-2 revert arm has no convergence path.** Once condemnation is range-scoped, `git revert` does not remove the condemned commit from `@{upstream}..HEAD` — it appends a second commit touching the same escaping paths — so the next pass condemns both, the bounded-retry sentence fires, and the one re-entry shape the fix is written for deterministically ends in escalation instead of a push. The Purpose's first half is unmet. **Resolution:** new End state 18 — exempt a commit reverted later in the same range (linked by git's own `This reverts commit <sha>.` token) and the revert commit with it; threaded into D2/D3 with an explicit termination sentence.
- **Every OLD-absent guard is case- and whitespace-brittle** (five of six reproduced). This is the **third recurrence of this class in this campaign** — plan 3 shipped a case-brittle anchor, then its fixed guard was proven whitespace-brittle at its own landed tip. **Resolution:** one compliant guard form stated in Method and inherited by all six — case-insensitive, newline-tolerant, mid-sentence-keyed, whitespace-collapsing for multi-word phrases, plus a recorded pre-fix hit count `>= 1` so a vacuously-green grep is impossible.
- **End state 8 is literally false about the corrected file.** After the plan's own fix, `--declared` still precedes both positionals in byte order twice in the same bullet (the "pass `--declared`" lead-in and the "refused even with `--declared`" parenthetical), so a file-wide absence check fails and a faithful End state 9 predicate false-reds on plan-mandated text. **Resolution:** scope both to the invocation code span; enumerate the two bare mentions as sanctioned survivors.
- **End state 12's replacement clause is itself false.** `SKILL.md`'s Resume paragraph is a trigger pointer **plus** an inline restatement of three discipline clauses, so "keeps only the trigger pointer" would retire one imprecision and land another in the same bullet — the self-defeating class this plan exists to end. **Resolution:** the clause now says mechanics live in the reference file while `SKILL.md` keeps the pointer plus the precedence-chain/one-way-repair/unexplained-commit summary.
- **The tour carries the same falsehood in a second step.** Step 4 ("4 · The Lead and the invariants") says the servitor writes "only to `learningsTarget`" — identical to the step-16 claim being fixed. **Resolution:** new End state 17, whole-file tour hand-scan, with the source-spec §9 scope override recorded.
- **Only one of the range-probe arm's two fragments has a both-ways proof.** The `..HEAD` fragment is load-bearing but droppable with zero test signal. **Resolution:** a third unwired negative reference (c) carrying `git log --name-only` without any range token, red through the same live key.

### Minor (auto-fixed in the plan)

Deviation 17 stated a resolved gap in the present tense (the roadmap's row 3 already records `Depends on: 1, 2`) — reworded to past tense. The `#1240` slice's parenthetical claim that the note "keeps `docs/` clear of anything the census could ever be widened onto" contradicts End state 11's own mandate to name `ARGS_FALLBACK_ANCHOR` verbatim; the census walks `skills/` only, so the ADR is safe today and the conclusion stands — recorded, not re-litigated.

## Resolutions applied (grill decisions)

`--afk`: no operator; every decision is Lead-self-adjudicated per ADR 0014.

| Finding | Decision | Plan ref patched |
|---|---|---|
| D6 pin structurally vacuous | key on dispatch-label **shape** + region floor `>= 2` | End state 6, Task 1.2 D6 slice |
| Revert arm never converges | exempt the reverted/revert pair; explicit termination | **new End state 18**, Task 1.4 D2 + D3 |
| OLD-absent guards case/whitespace-brittle | one compliant guard form in Method, inherited by all six | Method; End states 2, 4, 7, 8, 12, 14 |
| End state 8 false about the fixed file | scope to the invocation code span + survivor set | End states 8, 9 |
| End state 12 clause false about `SKILL.md` | mechanics-vs-summary wording | End state 12 |
| Tour step 4 carries the twin falsehood | fix in-task, §9 override recorded | **new End state 17**, deviation 15, Task 1.3 slice |
| `..HEAD` fragment unproven | third negative reference (c) | End state 3 |
| Learnings file carries the retired probe | follow-up, not in-task | **6th backstop row**; End state 2 survivor set |

## Adjudications

<!-- Machine-readable: the WAR Lead reads these rows and threads them into the auditor prompts (auditPrompt() and the gate-audit seats). Version precedence: task instruction > red-team adjudication > plan body literal. -->

1. The D6 arm-symmetry pin extracts re-land regions by the dispatch-label **shape** (`land:phase-` + `${ph.id}` + `:` + any `-proceed` flavor), **never** the two hardcoded label literals — the literal form is structurally vacuous (proven by execution). The pin also asserts the extracted region count is `>= 2`. A seat must reject a literal-keyed implementation even though earlier plan drafts described one.
2. End state 18 governs the Gate-2 revert arm's termination: a commit reverted later in the same probed range is exempt from condemnation, linked by git's own `This reverts commit <sha>.` body token, and the revert commit is exempt with it. The alternative ("push the revert first") was considered and **rejected** — it needs an exception to the do-not-push clause and sends a poisoned-then-reverted pair to origin. Do not re-open.
3. Every OLD-absent check in this plan inherits the Method block's compliant guard form: case-insensitive, newline-tolerant, mid-sentence-keyed, whitespace-collapsing for multi-word phrases, with a recorded pre-fix hit count `>= 1`. A retirement clause quoting a phrase verbatim is naming the **subject**, not prescribing a byte-literal pattern. This is the third recurrence of this class in this campaign — treat a whitespace-literal or sentence-initial anchor as a defect on sight.
4. End states 8 and 9 are scoped to the **invocation code span**, never file-wide. The bullet's bare `--declared` lead-in and its trailing `--declared` parenthetical are sanctioned survivors; an implementation that reds on them is wrong.
5. End state 12's mandated clause is "mechanics live in `resume-and-recovery.md`; `SKILL.md` keeps the trigger pointer **plus** the precedence-chain / one-way-repair / unexplained-commit summary". The phrase "only the trigger pointer" is **retired** and must not be landed — it is false about the live file.
6. Tour step 4 is fixed in-task under End state 17, overriding source spec §9's "step 16 only" non-goal. The §9 non-goal bars creep into *unrelated* steps; step 4 carries the identical falsehood in a file already in Task 1.3's `Files:`, so the diff census is unaffected.
7. End state 3 mandates **three** unwired negative references, not two — (c) gives the `..HEAD` fragment its own both-ways proof.
8. `docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md`'s stale present-tense description of the retired HEAD-only probe is a **follow-up**, never an in-task edit: a repo-root learnings write by a worker contradicts the two-root split this plan asserts, and End state 15's nine-file census stays closed. It is a sanctioned survivor of the End state 2 retirement grep.

## Residual risk

- **Single round by operator instruction.** The patches above were verified by the Lead against live measurements (the label census in `workflow-template.js`, the two-hit tour grep, the third `show --name-only` carrier, the `SKILL.md` Resume paragraph) but were **not** re-probed by a second adversarial round. Every prior plan in this campaign had 2–3 defects introduced *by* its round-1 patches, and plan 3's round-1 patch left a whitespace axis open that only surfaced at its landed tip; that class is unscreened here.
- Backstops are **AI-declared** (ADR 0014). Row 6 is Lead-authored at red-team time.
- Backstop 5 carries a Lead duty at phase close: spot-reproduce at least one recorded fail-first proof (Task 1.2's or Task 1.4's).

## Safety

- Escape guard exit **0**; the red-team worktree is clean and `HEAD` is unmoved at `e379e90`.
- The scaffold was copied from the **branch checkout**, not the plugin cache — the branch carries plan 2's End state 18 sandbox fix (`git clone --no-hardlinks` for any probe that runs `git`, and the explicit warning that a `cp -R` of a linked worktree is not git-isolated). The plugin-cache copy still lacks it; that gap is what let plan 3's spine probe escape. The executed probes here reported cloning, and the guard confirms nothing leaked.
- Guard caveat recorded: without a `--baseline` snapshot the ref checks are a name heuristic, so a probe-invented ref name could slip. The working-tree half is exact.
