# Red Team — 2026-08-06-escape-guard-exit-contract (2026-08-15)
**Verdict:** ADJUDICATED — every root finding patched in place; nine findings adjudicated without re-run (all analyzed-probe findings or policy calls, none re-measurable by an executed probe whose subject the patch changed). Coverage whole: 16/16 probes on target, none off-target, none dropped.
**Rounds:** 1
<!-- Cumulative grill sweeps: the Step-1 seed + this run's sweeps. Strict form — the next run's seeding re-reads exactly this line; an integer, nothing else. -->

Run under `/war-campaign` (campaign `2026-08-06-survey-batch`, plan 2 of 14), `--afk` — the Lead
self-adjudicated every decision below; no operator was consulted. **Base: `1655b98` — plan 1's landed
tip, NOT the plan's authoring base `6fff2ee`** (which is an ancestor). Artifact kind: `impl-plan`.
Merged arm — Part 1 is the plan's own source of truth.

## Attack surface

Spine (6): `claims-vs-reality`, `executable-proof`, `coverage-vs-source`, `consistency-placeholders`,
`dependency-feasibility`, `intent-vs-plan`.

Bespoke (9): `stacked-base-drift`, `awk-degeneracy-repro`, `minus-s-fix-and-backcompat`,
`gitignored-pin-feasibility`, `doc-lock-survival`, `default-flip-old-absent`, `guard-split-deps-edge`,
`anchor-check-constructs`, `backstop-legitimacy`, `cross-plan-and-adr-convention`.

Executed in sandbox (7). All used `git clone --no-hardlinks` — the repo is a linked worktree, so it is
the only isolating form.

Drift-guard spine probes: `default-flip-old-absent` **ran** (non-vacuous — it produced R3, the run's
sharpest finding); `guard-split-deps-edge` **ran** (non-vacuous — the plan splits a doc guard across
tasks); `unguarded-new-mirror` **vacuous** by Lead inspection (no inline `const` mirror of a canonical
export). `ff-topology` **not derived** — no per-task merge-commit topology anchors (token grep plus a
hand-read of the evidence prose).

Provision `[]`. Fallback: none — `Explore` present. Model/effort `opus`/`high`. Round limit 3.
Escape guard: pre-run snapshot 294 refs (exit 0); post-run `--baseline` **exit 0** — no residue, no ref
added/removed/moved. No containment required.

## Executed proof

- **Central premise reproduced.** A zero-byte `--baseline` really does degenerate the two-file awk
  ref-diff: every live ref is absorbed into `base[]`, `live[]` stays empty, and the END block emits
  `removed: <ref>` for refs that exist right now — exit **1** (a false escape with an inverted message)
  instead of **2**. D3's soundness claim also holds: snapshot mode's `printf '%s\n'` write yields at
  least one byte even for an empty ref set, so `-s` can never reject a legitimate snapshot.
- The `-s` fix behaves as specified: zero-byte → exit 2 and explicitly not 1 even with an escape-worthy
  `rogue` branch present; no-baseline invocations stay byte-identical; the existing suite stays green.
- The gitignored ceiling-pin case is buildable and the fixture-ordering trap is real.
- **Stacked-base drift: none material.** Plan 1's landed changes to `lenses.md` and
  `red-team-gate.test.mjs` do not invalidate this plan's measured claims; the 4 live `unreadable
  baseline` carriers, the single retired-opener hit and the single ADR over-claim all still hold at
  `1655b98`.
- **Doc-lock survival confirmed** — Task 1.2's rewrite leaves plan 1's newly-landed doc-guard rows green,
  including plan 1's own End state 9 byte-identity between the two Route-upstream blocks.

## Findings

### Major (all patched)

- **[R1, executed]** End states 5, 7 and 9's retirement greps are **case-sensitive and line-based**, and
  all three returned the PASS value (zero hits) on copies where the retired wording was merely re-cased
  mid-sentence, or split across a line break. These are the *only* mechanical verification Task 1.2
  (`requiresTest:false`) and Task 1.3 (`Done when: None`) carry. Aggravating: the ADR is hard-wrapped at
  ~132 cols and the guard header at ~85, and Task 1.1 **lengthens two header lines**, forcing a re-wrap —
  so the wrap hazard is not hypothetical for this very change. Resolution: all retirement greps are now
  `-i`, plus a leader-strip/whitespace-normalize pass for the two hard-wrapped carriers.
- **[R2, needsDecision]** The Purpose promises *every* live prose surface routes each exit code, but no
  End state checked `lenses.md` — one of the plan's own named carriers. Resolution: End state 5 extended
  with a `lenses.md`-scoped pair.
- **[R3, needsDecision, executed]** **The OLD-absent half had no mechanical guard anywhere.** A probe
  implemented Tasks 1.1+1.2, put `unreadable baseline` back into the `lenses.md` bullet, and all three
  task gates stayed **GREEN**. Resolution: new design-tree row **D11** — a fail-closed retired-wording
  doc-guard row in `red-team-gate.test.mjs` (already run by End state 6, so no new runner), NEW-present
  anchors asserted first, needles built from runtime-split fragments because the row sits inside End
  state 9's own grep scope. Directly mirrors plan 1's D8b, which is landed in this plan's base.
- **[R4, needsDecision]** Backstop entry 1 deferred "only the manual survey halves", implying the
  mechanical halves were covered. They were not. Resolution: R3 supplies the mechanical half; the entry
  now defers only genuinely unforeseen rewordings.
- **[R5, needsDecision]** Backstop entry 3 is a deferred **feature**, not a validation — no seat, no
  timing, and the plan closes #1369 at phase close, which would **orphan** the ceiling with no successor
  artifact while still occupying the backstop ledger. Resolution: a `war-followup` successor issue is now
  a named phase-close duty, filed **before** #1369 closes.
- **[R6, needsDecision]** **The plan's ADR-convention argument was falsified by the corpus.** D5/A5
  claimed the corpus repairs false-when-written claims in place and reserves appended notes for decision
  changes and true-then-stale claims. `docs/adr/0016`'s `## Amendment (2026-07-19)` corrects a
  *description that was wrong when written*, via an **appended** note, and says so explicitly; `0019` and
  `0023` share the shape. Resolution: **D5/A5 reversed** — Task 1.3 now appends a dated
  `## Correction (2026-08-15, #1268)` note with the Context sentence's bytes intact. This is strictly more
  conservative and satisfies the plan's own byte-unchanged constraint. End state 7 rewritten accordingly:
  it now asserts the note is **present** and that the original sentence **survives** (`grep -ciF` returns
  **1**, not 0 — a 0 means someone edited in place against D5).

### Minor (auto-fixed)

- **[R7]** End state 9's survey spans the guard header — a Task 1.1 file — but the runner map assigned
  End state 9 only to Task 1.2, which does not open that file. That half had no runner. Fixed.
- **[R8]** End state 12 was commandable-but-judged with no stated reason — the unpatched boilerplate that
  plan 1 was patched for at its own round 1. Justification added.
- **[R9]** End state 13's `check:` tag seated only one of its two undecidable halves. Both now seated.
- **[R10]** End state 1's check embeds an unescaped `$` mid-pattern. Measured: the `grep` actually in
  scope in this environment is a ugrep shim that treats `$` as an anchor anywhere, so the check returns
  **no match against the correctly-landed line** and reads End state 1 as unmet. Direction is fail-loud
  (a false red, not a false pass) but it burns a round on correct work. Fixed to `grep -nF`.

## Resolutions applied (grill decisions)

- R1 → case-insensitive retirement greps + wrap-hazard handling → End states 5, 7, 9.
- R2 → `lenses.md`-scoped routing check → End state 5.
- R3 → new row **D11** + Task 1.2 slice + `Files` widened to carry `red-team-gate.test.mjs` + Done-when
  extended → design tree, Task 1.2, End state 9.
- R4 → deferral narrowed → backstop entry 1.
- R5 → successor-issue duty named → backstop entry 3.
- R6 → **D5/A5 reversed to the appended-note arm** → D5, A5, Note 1, Pivotal constraints, Task 1.3,
  End state 7.
- R7 → End state 9's guard/suite survey half assigned to Task 1.1 → backstop entry 1.
- R8/R9/R10 → judge-tag justification, both halves seated, `-F` on the End state 1 check.

## Adjudications

<!-- Machine-readable: the WAR Lead reads these rows and threads them into the auditor prompts. Version precedence: task instruction > red-team adjudication > plan body literal. -->
- **ADR 0043 is corrected by an APPENDED dated `## Correction (2026-08-15, #1268)` note, with the Context
  paragraph byte-unchanged** — supersedes D5/A5's in-place-edit directive and the plan-body literal "this
  is an in-place correction of a false-when-written claim". Corpus-measured (ADR 0016/0019/0023) —
  **AI-declared**
- **End state 7 asserts the original `*only* mechanic` sentence STILL PRESENT (count 1), not absent
  (count 0)** — supersedes the plan-body literal `grep -cF '*only* mechanic' … returns 0`. A 0 now
  indicates a defect (an in-place edit against D5) — **AI-declared**
- **A fail-closed retired-wording doc-guard row (D11) is REQUIRED in
  `skills/red-team/assets/red-team-gate.test.mjs`, with runtime-split needles** — added where the plan had
  no mechanical OLD-absent guard; Task 1.2's `Files` and `Done when` widened to carry it — **AI-declared**
- **Every retirement grep in End states 5, 7 and 9 is case-INSENSITIVE (`-i`/`-in`/`-rin`/`-inF`)** —
  supersedes the plan-body case-sensitive forms; reproduced re-cased false negative — **AI-declared**
- **End state 1's check is `grep -nF`** — supersedes the unescaped-`$` BRE form, which returns no match
  under the `grep` shim in scope here — **AI-declared**
- **A `war-followup` successor issue for the `--ignored` widening is filed at phase close BEFORE #1369 is
  closed** — supersedes backstop entry 3's `runner: none mechanical here` — **AI-declared**
- **No version literal is adjudicated.** Task 2.1 resolves the next free patch from the four live slots at
  land time; every version literal in the plan and the roadmap remains non-authoritative.

## Residual risk

- **The two hard-wrapped carriers remain line-wrap-fragile against any purely grep-based check.** R1's
  leader-strip/normalize pass is a *survey* instruction, not a gate member; D11's row covers `SKILL.md`
  and `lenses.md`, not the ADR or the guard header comment block. A future re-wrap of those two could
  still slip a retired bigram past a zero-hit assertion. Accepted for this plan; the survey half is the
  only net there.
- Both End state 5/7/8/9 **manual survey halves** stay done-report-only evidence — gate-audit reads them
  SOFT, never a hold. Now narrowed to genuinely unforeseen rewordings (R4).
- The **zero-byte delete-and-trace** remains uncommittable by design; the committed case with its
  `rogue`-branch fixture is the standing non-vacuity guard. Reproduced by this run.
- The **gitignored ceiling itself** is unchanged and deliberately unfixed — `git status --porcelain`
  without `--ignored` stays blind to ignored-path leaks. Now tracked by a named successor issue (R5)
  instead of being orphaned by #1369's close.
- End states 12 and 13 remain judged at audit_sha; both now state why.
- `guard-split-deps-edge` passed: Task 1.2's `deps: [1.1]` correctly covers the guard-header fact, and
  D11's new row reads only `SKILL.md`/`lenses.md` — both Task 1.2's own files — so it adds no new
  cross-task edge. Task 1.3 is genuinely file-disjoint and dependency-free.
- `stacked-base-drift` found no material drift from plan 1's landing, but note the plan's own prose still
  cites `6fff2ee` as its snapshot base throughout; that is accurate as authoring provenance and was
  re-verified at `1655b98` rather than rewritten.
