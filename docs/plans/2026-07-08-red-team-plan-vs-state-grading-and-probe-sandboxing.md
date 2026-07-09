# Red-team future-work grading + probe sandboxing — implementation plan

**Source spec:** `docs/specs/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing-design.md`
**Slug:** `red-team-plan-vs-state-grading-and-probe-sandboxing` (shares the spec's slug, drops `-design`).
**Repo version at authoring:** 0.14.14 — version literals below are non-authoritative; resolve the next free patch from the four release slots at land time.
**Roadmap ordering:** no hard dependency, but heavy shared-file contention (see notes) — the roadmap serializes; every task rebases onto landed content.

## Commander's Intent

**Purpose.** `/red-team` proves a plan *can be applied*, not that it already was — future-work grading, executed-probe sandboxing, the pass-demote contract, and adjudicated versions each become mechanically enforced invariants instead of preamble prose that a probe's ambient context, a cwd reset, or an out-of-band edit can defeat.

**Method.** The Lead pre-flight classifies the artifact into an **artifactKind** (`impl-plan`/`tdd-plan`/`design-doc`/`prd`; default `impl-plan` — the suppression-safe choice) and threads it into every probe (the `fingerprint.titleLine` fail-loud precedent). The analyzed-only `preconditionRule` generalizes into an artifact-kind-aware **futureWorkRule** prepended to executed probes too — for a `tdd-plan`, a shipped test running red pre-implementation is a `pass`, not a defect — preserving the retained-findings carve-out (a false claim about EXISTING code still blocks). A typed **`deliverableAbsence`** finding flag that `classify()`/`verdict()` never count as a blocker kills the 16-false-findings BLOCKED misfire at the gate layer with zero prose parsing (the gate stays pure). A new post-run **`assert-no-repo-escape.sh`** (0/1/2 floor contract) runs between the Workflow return and the gate — stray working-tree files or junk sandbox refs quarantine the verdict through the existing **self-confound gate**, which already cites the cwd-reset escape as its in-repo precedent; the hardened `git -C` scope-lock is the prevention layer, the guard is the detection authority (Layer-2/3 doctrine). A **D7 drift-guard** pins the pass-only demotion set and the two-contract sentence on both surfaces. The red-team report gains a machine-readable **`## Adjudications`** block the WAR Lead threads into `auditPrompt()` as an `adjudicationClause` (precedent: `intentClause`) — version precedence is task instruction > red-team adjudication > plan body literal — mirrored VERBATIM into `agents/war-auditor.md`. No probe jail (ratified non-goal); back-compat byte-for-byte when the new args are absent. ADRs 0032 + 0033 ratify.

**End state** (each individually checkable):
1. `workflow-scaffold.test.mjs` asserts `args.artifactKind` appears in every emitted probe prompt (spine + bespoke) and defaults to `impl-plan` when absent. (spec criterion 1)
2. The scaffold test asserts `executable-proof` (executed) carries the future-work clause; for `tdd-plan` the clause states a pre-implementation red test is `status:"pass"`; the retained-findings carve-out ("false claim about EXISTING code") is still present on analyzed probes. (spec criterion 2)
3. A `red-team-gate.test.mjs` case: a Critical finding with `deliverableAbsence:true` is absent from `blockers` and the verdict is not `BLOCKED` on it alone. (spec criterion 3)
4. A synthetic `impl-plan` fixture claiming to add an absent symbol, run through the scaffold-prompt + gate-classify path, yields a verdict not `BLOCKED` purely on that absence — the regression for the recorded 16-false-findings misfire. (spec criterion 4)
5. `assert-no-repo-escape.test.sh`: exit 0 on a clean repo; exit 1 on a stray working-tree file; exit 1 on a junk sandbox ref (local and via a stubbed remote); exit 2 on a git error / non-repo — the 2-vs-1 distinction never collapses. (spec criterion 5)
6. `skills/red-team/SKILL.md` runs `assert-no-repo-escape.sh --repo <repo>` between the Workflow return and the gate, and a nonzero result routes the verdict through the self-confound gate — never `CLEARED`. (spec criterion 6)
7. The scaffold test asserts the executed scope-lock emits the `git -C <sandbox>` directive and the explicit no-bare-`git push` / cwd-reset warning. (spec criterion 7)
8. The D7 drift-guard asserts: (a) the only status demoting a Critical/Major in `classify()` is `'pass'` (a `warn`/`fail`/absent-status Critical lands in `blockers`; a `pass`-status Critical does not); (b) the two-contract sentence is present in both `workflow-scaffold.js` and `references/lenses.md`; removing either turns it red. (spec criterion 8)
9. The `lenses.md` report template contains a `## Adjudications` section; `auditPrompt()` emits the version-precedence clause when adjudications are threaded (empty ⇒ no behavior change); a both-surfaces test asserts the clause on both `workflow-template.js` and `agents/war-auditor.md`, anchored on a stable mid-sentence phrase. (spec criteria 9–10)
10. `docs/adr/0032-*.md` (artifact-kind grading) and `docs/adr/0033-*.md` (post-run escape guard) exist; `CONTEXT.md` carries the four new terms. (spec §6/§7; renumbered — see deltas)
11. Full suites green: `node --test 'skills/**/*.test.mjs'`, every `hooks/` + `skills/` `*.test.sh`, `war-memory.mjs lint docs/learnings/`; all pre-existing cases byte-unchanged (back-compat constraint).
12. The four release slots move together to the resolved next patch.

## Build order (for /war)

### Phase 1 — Kind-aware grading, gate typing, escape guard, adjudications

Six file-disjoint tasks, no intra-phase deps — run in parallel.

**Task 1.1 — Scaffold: artifactKind, futureWorkRule, deliverableAbsence, scope-lock hardening**
- Files: `skills/red-team/assets/workflow-scaffold.js`, `skills/red-team/assets/workflow-scaffold.test.mjs`
- Plan slice: **(artifactKind)** New arg joining `{ planFile, repo, sourceSpec, probes, fingerprint, provision }`; default `'impl-plan'` when absent (back-compat: absent arg reproduces today's suppression-biased behavior; the `provision:[]` precedent). **(futureWorkRule)** Generalize the `preconditionRule` preamble (#311) into an artifact-kind-aware rule prepended to ALL probes at the composition site in `runProbe` — analyzed AND executed — guarding the analyzed-vs-executed wording variants: for `impl-plan`/`tdd-plan`, a claimed-but-unbuilt symbol/test/file is the expected deliverable baseline, never a finding; for `tdd-plan`, a shipped test red pre-implementation is `status:"pass"`. PRESERVE the retained-findings carve-out (missing anchor / wrong signature / drifted line / contradiction about EXISTING code still blocks) — the existing asserts on it stay green. **(deliverableAbsence)** Add optional `deliverableAbsence: { type: 'boolean' }` to the FINDINGS schema; prompt instructs: set `true` only when the "absent" symbol is mapped by `coverage-vs-source` to a plan task. **(scope-lock)** In `scopeLock('executed')`, replace the loose "`cd` into that copy" with: the Bash tool resets cwd between calls — use `git -C <abs-sandbox>` for every git call, absolute paths throughout, never rely on a prior `cd`, never run a bare `git push`; comment cites the recorded cwd-reset escape. Tests: end states 1, 2, 7 (+ the analyzed carve-out control), delete-and-trace each. **Cross-plan note:** plan 6 (Task 1.5) tightens the `executable-proof` prompt gist in this same file pair — roadmap serializes; rebase onto its landed content, compose the futureWorkRule with (not over) its extraction directive.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject (this repo)

**Task 1.2 — Gate: deliverable-absence exclusion + D7 drift-guard pin**
- Files: `skills/red-team/assets/red-team-gate.mjs`, `skills/red-team/assets/red-team-gate.test.mjs`
- Plan slice: **(D3)** In `classify()`: a finding with `deliverableAbsence === true` is excluded from `blockers` regardless of severity or probe status (it may still surface as a `minor`/note); `verdict()` therefore never returns `BLOCKED` purely on deliverable-absence counts. Keys on the typed flag only — no `reality`-string parsing (the gate stays pure). The existing pass-demote rule (`probeStatus !== 'pass'` blocks) is byte-unchanged. **(D7)** Add the drift-guard pin: (a) behavioral — a `warn`/`fail`/absent-status Critical lands in `blockers`, a `pass`-status Critical does not, and the demoting set is exactly `{'pass'}`; (b) textual — the two-contract sentence present in BOTH `workflow-scaffold.js` (CONTRACTS comment) and `references/lenses.md` (the two-contract summary at its recorded construct), read-only greps. **(end state 4)** The synthetic 16-false-findings regression fixture: findings from an `impl-plan` run where every "absent symbol" carries `deliverableAbsence:true` → verdict not `BLOCKED`. Delete-and-trace each.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.3 — Escape guard script + test (new)**
- Files: `skills/red-team/assets/assert-no-repo-escape.sh` (new), `skills/red-team/assets/assert-no-repo-escape.test.sh` (new)
- Plan slice: Bash-3.2-safe, cwd-independent, floor-family exit contract: 0 = clean, 1 = escape detected, 2 = git error — never collapsed into 1. Given `--repo <abs>`: (a) `git -C <repo> status --porcelain` must be empty (exact half); (b) no local ref (`for-each-ref`) and no `ls-remote --heads origin` ref matches the throwaway-sandbox junk pattern (`refs/heads/redteam-*`, `*-sandbox-*`) — `# ponytail:` the pattern is a heuristic ceiling (a probe inventing an unrelated ref name slips it; the porcelain half is exact and the common escape — a bare push — is caught); full ref-diff snapshot is the named upgrade path. Test: clean → 0; stray working-tree file → 1; junk local ref → 1; junk ref on a stubbed remote → 1; non-repo/git error → 2 asserted ≠ 1; delete-and-trace.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.4 — Red-team SKILL + lenses: pre-flight, guard wiring, Adjudications**
- Files: `skills/red-team/SKILL.md`, `skills/red-team/references/lenses.md`
- Plan slice: **(SKILL Step 2)** The Lead pre-flight classifies `artifactKind` alongside the fingerprint (documented heuristic, not clever: `docs/plans/` file with per-task `Files:`/`## Build order` ⇒ `impl-plan`, red-first `requiresTest` tasks ⇒ `tdd-plan`; `docs/specs/*-design.md` ⇒ `design-doc`; external PRD ⇒ `prd`; undeterminable ⇒ `impl-plan`, the conservative default) and passes it in `args`. **(guard wiring)** Between the Workflow return and the gate: run `assert-no-repo-escape.sh --repo <repo>`; nonzero routes the verdict through the existing self-confound gate (the Diagnosis pre-flight section — which already cites the cwd-reset escape as precedent), never `CLEARED`, until the state is clean. **(grill loop)** Step 5 records any authoritative-value change (especially version) into the report's `## Adjudications` block when it patches the plan. **(lenses.md)** Artifact-kind + deliverable-absence documentation rows; mark the two-contract summary as pinned by the D7 guard; add the `## Adjudications` machine-readable section to the report template (rows: adjudicated literal + the plan literal it supersedes); rewrite the "(Optional, deferred) deterministic execution harness" bullet to point at the ratified post-run guard. **Cross-plan note:** plan 3 (Task 1.7) adds two spine probes to these same files — roadmap serializes; append, never reword its lines.
- requiresTest: false (prose surfaces; the mechanics they wire are tested in Tasks 1.1–1.3)
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.5 — Auditor adjudication clause, both surfaces**
- Files: `skills/war/assets/workflow-template.js`, `agents/war-auditor.md`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: `auditPrompt()` gains an `adjudicationClause` appended alongside the existing `intentClause` construct: "VERSION-PRECEDENCE RULE: the authoritative version is task instruction > red-team adjudication > plan body literal. Before scoring a version/release-slot mismatch as a defect, consult the adjudicated rows below; a value matching the adjudication is correct even when it differs from the plan body literal." — followed by the threaded rows; empty/absent adjudications ⇒ empty clause, byte-identical prompt (back-compat). The WAR Lead's duty to read `docs/red-team/<plan-slug>.md`'s `## Adjudications` block and thread the rows rides the dispatch construct in `workflow-template.js` (a Lead-read arg, like `intent`). Mirror the identical sentence VERBATIM into `agents/war-auditor.md`. Test: both-surfaces drift assert anchored on a stable mid-sentence phrase (never a quote-bearing byte literal — the recorded anchor-fragility lesson), plus an empty-adjudications control (prompt byte-identical to today). **Cross-plan note:** the auditor surfaces are shared with plans 1/2/3/5/6; this clause composes with plan 2's stacked-lag clause and plan 6's calibration rule 1 (three complementary authorities on version-mismatch scoring); roadmap serializes and this task appends.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.6 — Doctrine docs: ADR 0032 + ADR 0033 + CONTEXT.md**
- Files: `docs/adr/0032-red-team-grades-by-artifact-kind.md` (new), `docs/adr/0033-executed-probes-behind-escape-guard.md` (new), `CONTEXT.md`
- Plan slice: ADR 0032 (renumbered from the spec's "0023" — plans 1–7 claim 0023–0031; re-resolve against `docs/adr/` at land time): deliverable-absence is a non-defect for impl/tdd plans, enforced by the typed flag + a gate that never blocks on it — supersedes the analyzed-only `preconditionRule` scope; refines, does not replace, ADR 0013's severity model. ADR 0033 (from the spec's "0024"): executed probes are trusted only behind the post-run escape guard — the SCOPE-LOCK preamble is prevention, never the sole barrier; ratifies the previously-deferred harness as detection, not a jail (D6 non-goal recorded). Frictions D7/D8 are guarded-invariant additions to existing surfaces — no ADR; note the coupling in the ADR 0013 mechanism rows (the recorded ADR-policy-table under-attribution duty applies). CONTEXT.md: the four terms verbatim from spec §6 — **Artifact-kind**, **Deliverable-absence**, **Sandbox-escape guard**, **Adjudication (red-team)**.
- requiresTest: false (docs only)
- requiresPackaging: false
- deps: none
- target repo: superproject

### Phase 2 — Release bump (trailing)

Phase edge on Phase 1. **(Operator-ratified delta: the spec's surface list omits the release slots; repo law requires the trailing bump phase.)**

**Task 2.1 — Version bump across the four slots**
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Resolve the next free patch from the four slots at land time (authoring baseline 0.14.14 — non-authoritative; earlier campaign plans will have advanced it). Lockstep: `plugin.json` `version`; `marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status` (replace-in-place, no badge). Keep the blurb plain.
- requiresTest: false (metadata only)
- requiresPackaging: false
- deps: none (single task)
- target repo: superproject

## Deferred validations (backstops)

- **Escape-guard junk-ref pattern is a heuristic ceiling** (an invented unrelated ref name slips it) · why deferred: the porcelain half is exact and the recorded escape shape (bare push) is caught; a full ref-diff snapshot is the named upgrade path, built only if a second escape slips the pattern · runner: the guard's own output each `/red-team` run + the lessons feed.
- **`deliverableAbsence` self-tagging trust** (a probe wrongly tagging a genuine precondition-missing anchor would hide a real defect) · why deferred: the flag is honored only for `impl-plan`/`tdd-plan` kinds and the retained-findings carve-out is not absence-shaped; full adjudication of tag honesty is a judgment act · runner: the confirm loop (SKILL Step 4 adversarial confirm) on each tagged finding + `/red-team` of this plan.
- **`artifactKind` misclassification** (an impl-plan tagged `design-doc` would re-open the false-Critical misfire) · why deferred: the heuristic is documented and defaults to `impl-plan` (suppression-safe); the reverse direction is benign · runner: the Lead pre-flight reports the computed kind in the run header; operator eyeballs it per run.
- **Live adjudication threading** (the WAR Lead actually reading `## Adjudications` and threading rows) · why deferred: Lead-side prose duty; the both-surfaces test proves the clause, not the threading · runner: the first stacked campaign run after landing + `/red-team` prose check.

## Notes / conscious deviations

- **Three operator-ratified conversion deltas (2026-07-08 volley):** (1) ADRs renumbered **0032/0033** — the spec's 0023/0024 predate plans 1–7 claiming 0023–0031; (2) trailing **release phase added** — spec §5 omits the release slots, repo law requires them; (3) heavy cross-plan contention acknowledged and serialized by the roadmap rather than restructured here.
- **Cross-plan contention (for the roadmap table):** `workflow-scaffold.js` + `workflow-scaffold.test.mjs` shared with plan 6 (its `executable-proof` prompt tightening — Task 1.1 composes with it); `skills/red-team/SKILL.md` + `references/lenses.md` shared with plan 3 (its two spine probes — Task 1.4 appends); `workflow-template.js` + `workflow-template.test.mjs` + `agents/war-auditor.md` shared with plans 1/2/3/5/6 (Task 1.5's clause composes with plan 2's stacked-lag rule and plan 6's calibration rule 1 — three complementary authorities on version-mismatch scoring); `red-team-gate.mjs` + test and the new escape-guard pair are unique to this plan; `CONTEXT.md`, `docs/adr/`, release slots shared with all.
- **The gate stays pure** (spec constraint 2): the deliverable-absence demotion keys on the typed flag a probe sets — `classify()` does no NLP on `reality` strings.
- **No probe jail** (spec D6/§9): a confinement hook keyed on a new red-team-probe agent_type is ratified as disproportionate; the post-run guard closes the trust gap. Deferred, not planned.
- **Back-compat is a hard constraint** (spec constraint 4): absent `artifactKind`/`adjudications` reproduce today's prompts and behavior byte-for-byte — asserted by the empty-adjudications control and the default-kind test.
- **`requiresPackaging: false` on every task** — this repo ships no Dockerfile; the packaging floor is vacuous here.

## Open decisions

None — resolved interactively at conversion (operator volley, 2026-07-08): intent + all three deltas approved as-is.
