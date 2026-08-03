# Red Team — 2026-08-02-redteam-doctrine-and-guards (2026-08-02)

**Verdict:** BLOCKED (advisory) — every root finding across three rounds is patched in the plan and carries an adjudication row; the campaign proceeds per the ratified operator directive (`redteam-blocked-is-advisory-once-patched-and-adjudicated`). Rounds were bounded by operator instruction after round 3; two residual items are recorded below rather than driven to a fourth round.

Source spec: [2026-08-02-redteam-doctrine-and-guards-design](../specs/2026-08-02-redteam-doctrine-and-guards-design.md).
Plan authored by `/war-machine --afk` (ADR 0014) — its `## AI-Commander's Intent` and AI-declared backstops had no operator ratification entering this pass.

## Attack surface

Spine (all six, round 1): `claims-vs-reality`, `executable-proof`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan`.

Bespoke, round 1 (7): `anchor-check-live-constructs`, `gate-verdict-arm`, `escape-guard-modes`, `default-flip-old-absent` (mandatory drift-guard probe), `release-and-adr-number`, `deps-graph-and-disjointness`, `snippet-fidelity`.
Round 2 (5, re-verify only): `verdict-enumeration-v2`, `region-scope-v2`, `refdiff-idiom-and-containment-v2`, `weak-pin-and-has-i-v2`, `patch-coherence-sweep`.
Round 3 (4, re-verify only): `verdict-guard-exactness-v3`, `adjudicated-pin-strength-v3`, `sandbox-idiom-and-refdiff-scope-v3`, `final-coherence-sweep`.

`ff-topology` was **deliberately not run** — a token grep plus a hand-read of the evidence-pipeline prose found zero merge-topology anchors in this plan (no `^1`, no `--first-parent` per-task diff, no three-dot floor base, no per-task "merge commit" claim). The mandatory trigger never fired. `unguarded-new-mirror` (Lead-run) was **vacuous at round 1** and became **live at round 2** — the round-1 patch itself introduced an unguarded two-surface mirror, caught and closed (adjudication 11).

Coverage: 13/13, 5/5, 4/4 probes on-target — zero off-target, zero dropped, every round. `Explore` was present, so `analyzedAgentType` was omitted and no sticky pin engaged.

Runs: `wf_8d79829b-23e`, `wf_c70fb5f2-236`, `wf_e1328e8a-bbb`. 40 agents, 0 errors.

## Executed proof

- End state 9's guard, built verbatim after patching: **GREEN**, extracting all five verdicts; full `node --test 'skills/**/*.test.mjs'` **1017/1017** on the patched copy; `red-team-gate.test.mjs` 67/67 unchanged (the no-flag back-compat table holds byte-for-byte).
- End state 2's pin list after both fixtures: **14/14 green** on the specified union-scoped implementation and **red** on the union-gated scan-all survivor — six wrong implementations tried, all six caught.
- Region scope: the section-delimited region and the file-wide precise phrase family both behave; the precise pattern hits **exactly the three live count instances** and nothing else, and the bold-split Step-2 revert REDs (the proof a ±window scope cannot produce).
- Sandbox idiom: bare `git worktree add` writes `refs/heads/<basename>` that **survives `rm -rf`**; `--detach` writes none but leaves a prunable admin entry; `cp -R` of a **linked worktree does not isolate git at all** (its `.git` is a file) — a branch made in the "sandbox" landed in the real repo; `git clone --no-hardlinks` is fully isolating but **carries committed state only**.
- Ref-diff scoping: a plain `git fetch` produces a `refs/remotes` delta (excluded → 0); a probe-invented branch and a probe-invented tag both → 1; a branch created by another worktree of the same repo → 1 (the residual over-detection class).
- Containment: macOS `mktemp -d` returns the `/var/folders/…` alias of `/private/var/folders/…`, so one-sided normalization breaks the plan's own in-tree case in one direction and is vacuous in the other.
- Third ceiling: `git status --porcelain` reports nothing for a gitignored leak; `--ignored` shows it.
- Live anchors: ADR **0043 free** (0042 highest); deviation 8's `run_guard`-discards-output claim **verified**; `has()` = `grep -qF` (case-sensitive, reserved for flag literals) vs `has_i()` = `grep -qiF` (documented for prose); `check '^### Drift-guard coverage'` is a prefix regex blind to the count word.
- Escape guard: exit 0 (round 1). Rounds 2–3 not re-run per the bounded-rounds instruction; the target was independently verified clean mid-pass (see Safety).

## Findings

### Critical

- [Critical] End states 9 and 10 were mutually unsatisfiable. `verdict()`'s body contains `'INCOMPLETE'`, so the mandated extraction includes it, while End state 10 pinned a report-template verdict line without it — the guard would land **RED on the very commit that introduces it**, failing the plan's own gate. Found independently by 8 of 13 probes. **Resolution:** widen the template line to carry `INCOMPLETE` (it is a live doc-truth straggler — `verdict()` has emitted it since the coverage layer landed) rather than carve an exception into a brand-new guard. Re-verified green with mutation proofs.

### Major

- [Major] End state 8's region scope was unsatisfiable as written: measured at the base, the Step-2 count sentence sits **7,455 chars** from the section heading and the sections are 2,472 / 1,175 chars, so the cited `ff-topology` ±320 window reaches neither — the markdown-normalization clause (added *because* the Step-2 token is bold-split) was inoperative. **Resolution:** two scopes — heading-delimited section for presence/NEW-count, file-wide for OLD-absent with a precise phrase family.
- [Major] The name-agnostic ref-diff would fire on its **own sanctioned sandbox idiom**. **Resolution:** no allowlist (that would reopen the #1244 hole); change the idiom instead — new End state 18.
- [Major] `cp -R` does not isolate a linked worktree — **this campaign's exact shape**. Caught only at round 2, after the round-1 patch had re-ratified `cp -R` unqualified. **Resolution:** `git clone --no-hardlinks` when git runs, with the committed-state-only caveat; `cp -R` for read/edit work with an explicit non-isolation clause.
- [Major] The unscoped ref-diff is a live false-positive generator: `for-each-ref` covers `refs/remotes/*`, and the repo shares one ref store across **47 linked worktrees / 137 refs**, so any background fetch or concurrent WAR activity reads as an escape and — via the containment rule — makes `CLEARED` unreachable. **Resolution:** scope to `refs/heads/` + `refs/tags/`; name the residual over-detection class; settle its precedence against the containment rule.
- [Major] End state 2's zero-blocker pin was vacuous — a probe built a wrong implementation, ran the pin list verbatim, and got **the whole list green while End state 1's invariant was violated**. The first patch closed that shape but a second (union-gated scan-all) still survived, and would make `ADJUDICATED` unreachable whenever any unstamped Minor exists. **Resolution:** two discriminating fixtures; verified 14/14 vs red.
- [Major] End state 9's guard was vacuity-prone two independent ways: a behaviour-preserving constant-hoist **empties the extraction and the presence loop passes with zero verdicts checked** (an undocumented sixth verdict went unnoticed), and plain containment lets `CLEARED-WITH-NOTES` satisfy standalone `CLEARED`. **Resolution:** non-empty floor + exact-set `deepEqual` + token-set compare.
- [Major] **My own round-2 patch was wrong**: I prescribed `\b` word-boundary matching to close the substring hole, but `-` is a non-word character, so `/\bCLEARED\b/` matches inside `CLEARED-WITH-NOTES` and the mandated mutation proof stayed green under the prescribed technique. **Resolution:** delimiter-split token-set compare (hyphen-aware lookaround accepted as equivalent). Independently reproduced before patching.
- [Major] End state 13 mandated `has` — the file's case-**sensitive** helper, documented as reserved for flag literals — for a **prose** phrase whose capital is a heading artifact. **Resolution:** `has_i`, mid-sentence anchor.
- [Major] Task 5's count flip claimed coverage by presence pins, which cannot assert an old phrase absent; the only live guard is a prefix regex matching "two" and "three" identically. **Resolution:** its own OLD-absent assert.
- [Major] Round-2 patches introduced their own defects, all caught by the coherence sweeps and fixed: an unguarded new mirror (self-inflicted `unguarded-new-mirror`, with the pre-existing `/cp -R|worktree add/` pin matching both forms); three task slices lagging their patched End states (Task 2's idiom text, Task 4's guard list, Task 4's presence-loop wording); an orphaned Step-4 triage rule no task was told to write; End state 4 carrying no case for the namespace scoping (deletable filter, list stays green).

### Minor (auto-fixed in the plan)

Backstop 1 was stale — it described three siblings as "unconverted specs" when all four are converted plans and the roadmap it deferred to already exists (marked **discharged** with the live-state restatement) · the `3a.` list marker was not a valid CommonMark ordinal (renumbered to End state 18) · a `backstop 3` ordinal citation went off-by-one after a bullet was appended (both citations converted to subject-naming; deviation 5's ordinal likewise) · "both residual ceilings" stale against a three-ceiling enumeration · deviation 11 still prescribing `has` · deviation 3's "Both mechanical guards" against three · my own "8 unrelated places" miscount (8 total, 5 unrelated) · End state 18 mis-describing SKILL.md as offering `cp -R` (it has none) · "and the advisory says so" naming a surface that cannot carry the text in `--baseline` mode · a missing `--detach` disposal clause · Method's "every mirror and its guard travel together" falsified by End state 18 · two undeclared design-tree departures (the namespace narrowing; the `workflow-scaffold.js` footprint expansion) added as deviations 9(d)/(e).

## Resolutions applied (grill decisions)

`--afk`: no operator; every decision is Lead-self-adjudicated per ADR 0014.

| Finding | Decision | Plan ref patched |
|---|---|---|
| End state 9 vs 10 INCOMPLETE | widen the template line; no carve-out | End states 9, 10 |
| End state 8 region scope | split scopes — section region + file-wide precise family | End state 8, Task 4, deviation 4 |
| Ref-diff fires on sanctioned idiom | change the idiom, never allowlist the diff | new End state 18, Task 2 Files+slice, Task 4 |
| `cp -R` not isolating a linked worktree | clone-first when git runs; caveat `cp -R` | End state 18 |
| Ref-diff over-detection | namespace-scope to heads+tags; name the residual | End state 3, End state 4, Task 2 |
| Containment vs provenance precedence | provenance-cleared foreign delta does not block CLEARED | End state 6, Task 4 |
| Containment path normalization | resolve both sides `pwd -P`; extend `..` refusal | End state 3, Task 2 |
| Third ceiling (gitignored) | name it; qualify "This half is EXACT."; new backstop | End state 3, Task 2, backstops |
| End state 2 weak pin | two discriminating Minor fixtures | End state 2, Task 1 |
| End state 9 vacuity | non-empty floor + exact-set + token-set compare | End state 9, Task 4 |
| `\b` does not close the substring hole | token-set compare; `\b` explicitly forbidden | End state 9, Task 4 |
| `has` on a prose phrase | `has_i`, mid-sentence anchor | End state 13, Task 5, deviation 11 |
| Unguarded count flip | own OLD-absent assert | End state 13, Task 5, deviation 10 |
| Self-inflicted unguarded mirror | sandbox-idiom drift guard + tighten the loose pin | End state 8, Task 4 |

## Adjudications

<!-- Machine-readable: the WAR Lead reads these rows and threads them into the auditor prompts (auditPrompt() and the gate-audit seats). Version precedence: task instruction > red-team adjudication > plan body literal. -->

1. The report-template verdict line **carries `INCOMPLETE`** — `CLEARED | CLEARED-WITH-NOTES | ADJUDICATED | BLOCKED | INCOMPLETE — <one line>`. This supersedes the plan's original four-verdict literal and is what makes End state 9's guard satisfiable. SKILL.md Step 6's "reported as its own line" governs an additional detail line, not membership in the enumeration.
2. End state 8 uses **two different scopes**: heading-delimited section region for the arm name, its clauses, and the three-arms NEW-count assert; **file-wide** markdown-normalized matching for the OLD-count-ABSENT assert with the precise family `two\s+(?:universal\s+)?(?:doctrine|drift-guard spine)\s+probes`. The `ff-topology` ±320 window idiom is **not** the model and must not be copied — measured, it reaches neither the Step-2 sentence nor a whole section.
3. The ref-diff is **never** softened by a name allowlist. The sanctioned sandbox idiom changes instead (End state 18). An auditor must not accept a name-pattern exclusion as a fix.
4. The ref-diff is **namespace-scoped** to `refs/heads/` + `refs/tags/`, excluding `refs/remotes/*` — a deliberate departure from spec row 11's "regardless of name", which remains true *within* those namespaces. Deviation 9(d) records it.
5. The rewritten ponytail names **three under-detection ceilings** (b2 origin-side; pre-baseline pattern-slipping refs; gitignored leak paths) **plus**, separately and not counted among them, the over-detection class and the End-state-18 residual.
6. End state 2 requires **two** discriminating Minor fixtures — the adjudicated-Minor zero-blocker case and the unadjudicated-Minor all-adjudicated-blockers case. One alone is provably non-discriminating.
7. End state 13/Task 5 pins use **`has_i`** with a mid-sentence anchor, never `has`; the `two authoring rules` flip carries its **own** OLD-absent assert.
8. Task 5's count flip is **not** covered by presence pins — that claim was false and is retired.
9. End state 9's guard is a **default-deny exact compare**: non-empty floor + `assert.deepEqual` on the sorted five + token-set equality per surface. A presence loop is not acceptable.
10. End state 9's two documentation surfaces are **single lines**, named exactly (the `- **Verdict:**` enumeration bullet inside `## Severity & gate`, and the report template's `**Verdict:**` line) — not the enclosing sections.
11. `\b` word-boundary matching is **forbidden** for the verdict comparison (`-` is a non-word char, so it matches inside `CLEARED-WITH-NOTES`). Use the token-set compare or a hyphen-aware lookaround.
12. `skills/red-team/assets/workflow-scaffold.js` is in **Task 2's** footprint (deviation 9(e)); `workflow-scaffold.test.mjs` stays Task 4's. Sibling paths, different files, ordered by Task 4's `deps: [2]`.
13. On a nonzero escape guard, **action-provenance triage precedes the containment rule**: the containment rule binds probe-authored deltas only, and a provenance-cleared foreign delta is recorded and **does not block `CLEARED`**. "Clean" means no probe-authored residue, not a byte-identical ref set in a shared repo.
14. Backstop 1 (cross-plan contention) is **discharged**, not deferred — verified against the siblings' landed plan footprints and the existing roadmap contention table.

## Residual risk

- **Recorded, not driven to a fourth round** (rounds bounded by operator instruction): (a) `git clone --no-hardlinks` carries committed state only, so a probe needing the uncommitted working tree must overlay it — the plan states this, but no mechanical check enforces that a probe did so; (b) the over-detection class survives namespace scoping by construction in a shared ref store — adjudication 13 makes it non-blocking via provenance triage, which is prompt-enforced, not mechanical.
- Backstops are **AI-declared** (ADR 0014) — no human ratified them. Backstop 1 is discharged; the gitignored-leak-paths backstop is new this pass and names a real, reproduced gap.
- The `--ignored` widening of check (a) is deliberately deferred; a demonstrated ignored-path escape reopens it immediately.
- Three plan-lint advisories (`literal-suite-list`) are intentional: the plan names the two shell suites it edits, and the resolved gate self-discovers `*.test.sh` regardless.

## Safety

- No probe mutated the target repo across three rounds. Verified directly mid-pass: the only porcelain entry was `docs/plans/2026-08-02-redteam-doctrine-and-guards.md` — my own sanctioned plan patch — and of 137 refs the sole `probe`-matching name was the pre-existing `refs/heads/docs/aftermath-no-probe-residue`; 47 worktrees, **0 prunable**. Round-1 escape guard exit 0.
- Rounds 2–3 ran under a known hazard the pass itself discovered: probes were instructed to `cp -R` the target, which for a **linked worktree does not isolate git**. No probe actually exercised it — the round-3 probes were warned and used `git clone --no-hardlinks` or ran no git against their copies. The hazard is recorded as **latent and reproduced in a fixture**, never as a live escape in this run.
- Three of the Majors were defects in **my own patches** (the re-ratified `cp -R`, the `\b` prescription, and the first weak-pin fix), each caught by the bounded re-verify loop and each central measurement independently reproduced before the corrective patch.
