# Red-team — 2026-07-24-gate-evidence-and-release-integrity

**Verdict: CLEARED** (after 3 rounds, 2026-07-26). `/war` may execute this plan. The history
below is retained for provenance; rounds 1–2 read as written at the time.

---

**Round 1–2 verdict: BLOCKED.** Terminal for that pass — the Lead has **stopped patching**
and is escalating the residual open questions below to the operator, per the ≤2-rounds-per-blocker
rule. **Update 2026-07-26: all five residual questions are operator-RULED (see Adjudications) and
the plan is patched accordingly (the round-3 patch set). Round 3 RAN and returned **BLOCKED** on
ONE real blocker — the new whitespace-normalization does not survive a comment-leader reflow (see
Round 3 below). That blocker is escalated to the operator; the ≤2-rounds self-patch budget is
spent. Two further round-3 blockers were refuted as stale-base self-confounds.** Plan: `docs/plans/2026-07-24-gate-evidence-and-release-integrity.md` · Source spec:
`docs/specs/2026-07-24-gate-evidence-and-release-integrity-design.md` · `artifactKind`: `impl-plan`
· repo: dedicated worktree `_redteam-plan5` @ `93b1c2d` · Campaign plan 5 of 6.

## Why this stopped rather than continuing

Round 1 found 4 blockers over 3 roots. The Lead reproduced each, patched, and re-ran. Round 2 came
back with **5** blockers — and the majority were defects **the round-1 patch itself introduced**:

- a measurement the Lead got wrong (wrote "6 version values from 6 commits"; the real full-window
  figure is **49 from 50** — a `-n 6` sample mis-recorded as the window);
- a **causal claim that was simply false** — the Lead wrote that the *path filter* is what makes the
  `rev-list` mechanic return non-merge commits. Three independent probes measured otherwise, and the
  Lead then confirmed it directly: `git rev-list --first-parent -n 50 HEAD -- <slot path>` returns 50
  commits **all with 2 parents**, the same command without `--first-parent` returns 50 **all with 1
  parent**. **`--first-parent` is the discriminator, not the path filter.** The Lead's original
  sample simply omitted `--first-parent` and the effect was credited to the wrong cause;
- a **floor contradiction** introduced by ratifying an alternative that cannot satisfy the "ONE
  bounded git invocation" floor stated in the same paragraph;
- an **overstated citation** (`workflow-template.test.mjs:6692` was cited as pinning a plan-less
  phase that *claims End-state conditions*; that test carries no `endState` key, so it does not
  exercise the path described).

Two wrong Lead explanations in a row on one paragraph is the signal the rule exists for. Continuing
to self-patch would accumulate Lead errors into the plan rather than shed them. **The wrong text has
been withdrawn** (not replaced with a third theory) and the paragraph now carries the measured facts
plus an explicit "do not implement from this paragraph" marker.

## Attack surface

| round | run | probes | verdict | blockers / nd / minors |
|-------|-----|--------|---------|------------------------|
| 1 | `wf_7cfa48ca-b5b` | 15 (6 spine + 9 bespoke) | BLOCKED | 4 / 0 / 19 |
| 2 | `wf_a481e297-4c9` | 9 (6 spine + 3 bespoke) | **BLOCKED** | **5 / 1 / 11** |
| 3 | `wf_89c5f40a-e37` | 10 (6 spine + 4 bespoke) | **BLOCKED** | **3 / 0 / 8** (2 of the 3 refuted as stale-base self-confounds; 1 real) |

33 agents, 0 errors, every round 100% on-target (no off-target, no dropped probes). Escape guard run
after both rounds; the only stray was the plan file itself — the one file `/red-team` may write.

## Resolved in round 1 (verified)

**`${plan.file}` in `endStateBlock` was a phase-level crash (Major → resolved).** The plan mandated
interpolating the plan path into the gate-audit prompt on the reasoning that "`endStateBlock` has
`plan` in scope". True but insufficient: `plan` is destructured with **no default** and is **never
entry-validated** (`workflow-template.js:231`) — which is exactly why `:484` reads
`if (plan) plan.gate = …` — and `endStateBlock` is built at **top-level, unconditionally** (`:1497`),
unlike the two existing `${plan.file}` reads that sit inside the work thunk where a throw degrades to
one task's `held:escalation`. `pt` throws on an undefined interpolated value by contract (`:191`).
So the bare form would take a plan-less zero-task phase from a clean route to `held:workflow-error`
**phase-wide**. Patched to the guarded `${(plan && plan.file) ?? '<unset>'}` at all three mandate
sites (prompt text, Task 1.2, the Notes grill-Q4 bullet — that last one found only by the Lead's own
propagation sweep, the same stale-copy pattern that cost the sibling plan three rounds), plus a
mandated regression test. Round 2 confirmed the substance; two Minors remain (below).

**The `--diff-merges` display-default hazard (Major → resolved).** All 50 slot-touching first-parent
commits on a campaign branch are merges, so the primary mechanic's entire signal rides git's
*implied* `--diff-merges=first-parent`. Suppress the implication and the same command yields **zero**
versions. Since `version-slots.test.mjs` runs in **every** refiner-dispatched gate, a zero-parse
would have bricked the gate campaign-wide. The flag is now pinned explicitly.

## Residual open questions — RULED by the operator (2026-07-26)

1. **The `rev-list` + `git show` alternative: keep, fix, or drop?** Its correct form is
   `rev-list` **without** `--first-parent` (path filter is irrelevant to merge-ness), which
   contradicts the paragraph's own framing, and it cannot satisfy the "ONE bounded git invocation /
   never spawn per-commit" floor stated in the same sentence. Options: (a) drop it and mandate the
   single `git log --first-parent --diff-merges=first-parent` form; (b) keep it and restate the
   floor as "at most two bounded git invocations, never one spawn per commit". The Lead recommends
   **(a)** — the primary form is proven and one mechanic is one thing to get wrong.
   **RULED: (a) — dropped.** The plan now mandates the primary form as the sole sanctioned
   mechanic and directs re-measurement at the implementation base.
2. **The four §4.4 sweeps still false-negate on a semantics-preserving line reflow.** Round 1 made
   them case-insensitive; round 2 reproduced reflow false-negatives against the **real landing
   sites** (e.g. reflowing `the only automated check` across a line makes sweep 1.1 report
   `memory-audit.yml` clean while the retired claim is still there verbatim). The anchors are
   multi-word clauses and hyphenated compounds; the Method rule the Lead added says "prefer the
   shortest stable mid-sentence token" but the four shipped commands were not shortened to comply.
   Needs each sweep re-anchored on a single short stable token, with a control proving the matcher
   fires.
   **RULED: whitespace-normalization, not token-shortening.** Every sweep now runs
   `tr -s '[:space:]' ' ' < <file> | grep -io '<clauses>'` (reflow structurally irrelevant, full
   discriminating clauses kept) and carries a named known-present CONTROL that must fire — a
   zero-hit run with an absent control is a broken matcher, never a clean PASS.
3. **One of the spec's six §4.4 dispositions is owned by no task.** Only five of the numbered
   survey items map to a task slice; End state 9 nonetheless asserts all six are re-confirmed.
   **RULED: disposition 5 (ADR 0024) is assigned to Task 1.1** — its sweep now lists the ADR
   file and carries the re-confirm-only disposition; a plan Notes bullet maps all six
   dispositions to owners (1–4 → Task 1.2; 5 → Task 1.1; 6 → by construction, file-anchored
   sweeps).
4. **needsDecision — the `agents/war-auditor.md` both-surfaces registry row (grill Q9).** Whether a
   D3-style byte-shared registry row is the right instrument for two deliberately different-format
   surfaces is unsettled in the plan's own Notes.
   **RULED: per-surface bounded ordered pins ratified; the D3 registry row is rejected** — the
   registry asserts unordered presence-anywhere per surface, strictly weaker than End state 3's
   boundedness/order requirement; the plan's Notes resolution stands, stamped operator-ratified.
5. **Minor precision items:** End states 3 and 4 do not enumerate the new plan-less guarded-form
   regression case that Task 1.2 mandates; and the `workflow-template.test.mjs:6692` citation
   overstates what that test covers (no `endState` key ⇒ it does not exercise the End-state-claiming
   path).
   **RULED: fixed.** End state 4 now enumerates the plan-less claims-bearing regression case
   (with non-empty `phase.endState`; End state 3's rendered-prompt pins cannot see the source
   literal, so the behavioral case is the guard's sole test — stated in the plan), and the
   citation is re-anchored by construct name with its coverage stated honestly (construct
   anchoring is repo doctrine regardless). **WITHDRAWN (round 3, self-confound):** an earlier
   draft of this bullet claimed the cited test "sits at `:6603` today (line rot)". That was
   measured in the stale Lead worktree. At plan 5's real implementation base the test sits at
   **`:6692` exactly as originally cited** — the line number never rotted. Only the
   round-2 *coverage* half stands: the test carries **no `endState` key**, so it does not
   exercise the End-state-claiming path (re-verified at `master`).

## Adjudications

- **`${plan.file}` in `endStateBlock` MUST be the guarded form `${(plan && plan.file) ?? '<unset>'}`.**
  `plan` is never entry-validated and `endStateBlock` is top-level, so the bare form crashes a
  plan-less zero-task phase phase-wide via `pt`'s throw-on-undefined contract. The two existing bare
  `${plan.file}` reads at the worker dispatch sites are NOT precedent — they sit inside the work
  thunk where a throw is task-scoped. An auditor must not flag the guarded form as inconsistent with
  those sites — Lead-adjudicated 2026-07-25 (round 1, reproduced in source).
- **`--diff-merges=first-parent` is pinned explicitly on the primary monotonic mechanic.** Every
  slot-touching first-parent commit on a campaign branch is a merge (measured 50/50), so the mechanic
  depends entirely on that flag; git's implication of it is a display default the plan may not
  inherit silently — Lead-adjudicated 2026-07-25 (round 1, measured; `--diff-merges=off` yields 0).
- **`--first-parent`, not the path filter, determines merge-ness in a `rev-list` walk.** Measured at
  `93b1c2d`: with `--first-parent`, 50/50 commits have 2 parents; without it, 50/50 have 1 parent.
  Two earlier Lead statements to the contrary are withdrawn. Any surface still attributing this to
  the path filter is stale — Lead-adjudicated 2026-07-25 (round 2, Lead-verified after three probes
  independently corrected the Lead).
- **Operator rulings 2026-07-26 (the round-3 patch set):** (1) the `rev-list` + `git show`
  alternative is DROPPED — the primary `git log --first-parent --diff-merges=first-parent` form
  is the sole sanctioned mechanic; (2) every §4.4 sweep runs against a whitespace-normalized
  read (`tr -s '[:space:]' ' ' | grep -io`), full clauses kept, each paired with a named
  known-present control; (3) §4.4 disposition 5 (ADR 0024) is Task 1.1's; (4) Task 1.2's
  two-surface guard stays per-surface bounded ordered pins — the D3 registry row is rejected
  as strictly weaker; (5) CLEARED only via the bounded round-3 re-verify above. Before ruling,
  the operator session independently reproduced the round-2 measurements at the campaign tip:
  50/50 two-parent commits with `--first-parent`, 50/50 one-parent without; 50 → 0 version
  parses under `--diff-merges=off`; and the cited plan-less test carries no `endState` key.

## Round 3 — RUN 2026-07-26. Verdict: **CLEARED** (1 real blocker, operator-ruled and proven closed)

Run `wf_89c5f40a-e37` · 10 probes (6 spine + 4 bespoke), 15 agents, 0 errors, 10/10 on-target,
0 dropped · gate: 3 Major blockers, 0 needsDecision, 8 minors.

**Blocker (stands, operator-escalated) — the round-3 whitespace-normalization does not survive a
COMMENT-LEADER reflow.** `tr -s '[:space:]' ' '` collapses whitespace but leaves the `#` / `//`
comment leader in place, so a clause reflowed across a comment line break normalizes to
`… staleness is the # CAS retry's job …` and the sweep still false-negates — the exact failure
class the ruling was meant to kill. Reproduced independently by the Lead outside the probe:
a two-line `#`-prefixed reflow of `staleness is the CAS` yields **0** hits under the mandated
pipeline and **1** hit when a comment-leader strip is prepended. Six of the seven swept files
are comment-bearing (shell, JS, YAML), so this is the dominant reflow shape, not an edge case.
The plan's CONTROL discipline does NOT catch it: the controls are single tokens
(`cmd_ensure_publication_worktree`, `lock-step`) that fire on the same run, so the sweep reads
as a clean PASS. Recommended fix (operator's to rule — the ≤2-rounds self-patch budget is
spent): prepend a leader strip,
`sed -E 's@^[[:space:]]*(#+|//+|\*+)[[:space:]]?@@' "$f" | tr -s '[:space:]' ' ' | grep -io …`,
and restate the Method pipeline as leader-strip → whitespace-normalize → case-insensitive grep.

**RESOLVED (operator-ruled 2026-07-26, proven at the real base).** The leader strip
`sed -E 's@^[[:space:]]*(#+|//+|\*+|>+)[[:space:]]?@@'` is now the first stage of the Method
pipeline and of all four sweep commands (`>+` included for markdown blockquotes). Proof, run in
a `git archive master` sandbox — the reflowed `provision-worktrees.sh` doctrine sentence:

| pipeline | hits on the reflowed clause |
|---|---|
| raw line-scoped grep (rounds 1–2 form) | **0** |
| `tr`-only (round-3 v1 — the blocker) | **0** |
| leader-strip → `tr` → `grep -io` (ruled fix) | **1** ✅ |
| control `cmd_ensure_publication_worktree`, same run | **2** ✅ |

All four sweeps were then run end-to-end at the same base with every named control firing:
1.1 CLAUDE.md 1 ✅ · 1.2 `workflow-template.js` 3 ✅ · 1.3 CLAUDE.md 1 + `version-slots.test.mjs`
3 ✅ · 1.4 `provision-worktrees.sh` 3 ✅ (the third hit IS the reflowed clause the old form
missed). No over-strip false-positive inflation; baseline targets on the unmodified file are
unchanged.

**Two blockers REFUTED as stale-base self-confounds (no patch warranted).** Both the
`coverage-vs-source` and `intent-vs-plan` probes flagged Task 1.3's bolded "README carries ZERO
`lock-step` hits — disposition moot" as false. They measured the **stale Lead worktree**
(`f677452`, v0.14.57), which predates plans 2–4 landing. At plan 5's real implementation base
(`master` @ `91104f3`, v0.14.61, identical to `dev/2026-07-24-gate-evidence-and-release-integrity`)
`README.md` carries **0** `lock-step` hits — the plan's claim is accurate at the base the worker
will actually see, and applying the proposed "fix" would replace a true statement with a false
one. The `claims-vs-reality` adversarial-confirm caught this independently and refuted its own
probe. The paired Minor (`endStateBlock` cited at `:1497` "should be `:1491`") falls the same
way: at the real base it **is** `:1497`, exactly as cited.

**Lead self-confound disclosed:** the same stale-worktree error produced a false statement in
this report's own round-3 patch set (the withdrawn `:6603` line-rot claim above). The
pre-ruling measurements that survived re-verification at `master`: 50 `+`-side version parses
with `--diff-merges=first-parent`, **0** with `--diff-merges=off`; the cited plan-less test
carries no `endState` key; ADR 0024 exists.

**Escape guard:** exit 1, resolved as a self-confound — the only stray working-tree entries are
the two files `/red-team` legitimately writes (this report and the plan), carrying the Lead's
own uncommitted round-3 patches. No probe escaped its sandbox; no stray refs.

### Original round-3 scope (as authorized)

Scope is ONLY the round-3 patch surfaces: (i) the four whitespace-normalized sweep commands —
prove each named CONTROL fires, and attempt a reflow false-negative against the normalized
pipeline; (ii) the single-mechanic Task 1.3 paragraph — re-measure at the current base rather
than trusting recorded numbers; (iii) Task 1.1's ADR 0024 addition — the file exists and
nowhere claims the lint is outside gate evidence; (iv) End state 4's regression-case
enumeration and the construct-name citation — the cited test exists by title and still carries
no `endState` key. CLEARED requires zero blockers from this round; any blocker returns to the
operator (the ≤2-rounds self-patch budget stays spent).

## Residual risk

- **Stale-base measurement is this plan's recurring failure mode — it struck again in round 3.**
  Three round-3 probes AND the Lead measured plan facts in the stale Lead worktree (`f677452`,
  v0.14.57) instead of plan 5's real implementation base (`master` @ `91104f3`, v0.14.61,
  identical to `dev/2026-07-24-gate-evidence-and-release-integrity`). That produced two false
  blockers and one false report statement, all withdrawn. **Any future verification of this plan
  must state the base it measured at, and it must be the campaign base, not this Lead worktree.**
- The leader-strip fix is proven on the shape that broke (a `#`-prefixed reflow) and all four
  sweeps' controls fire, but the strip alternation covers `#`, `//`, `*`, `>` only — a swept file
  introducing another comment leader (e.g. `;` or `--`) would need it extended.
- Residual minors from round 3 (8, none blocking) are recorded in the run journal
  `wf_89c5f40a-e37`; they are wording-precision notes on already-adjudicated paragraphs.
- The Lead's own verification greps and measurements were wrong three times across this plan and its
  sibling (a `-n 6` sample read as a window; a causal attribution; a line-wrap-blind sweep). Any
  re-verification of this plan should use multi-line-aware matching **and** a control that proves the
  matcher fires, and should re-measure rather than trust numbers recorded in the plan text.
