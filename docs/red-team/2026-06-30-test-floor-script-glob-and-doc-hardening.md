# Red-team report — Test-floor `--pattern` multi-glob fix + `--repo` signature reconciliation

**Plan:** [`docs/plans/2026-06-30-test-floor-script-glob-and-doc-hardening.md`](../plans/2026-06-30-test-floor-script-glob-and-doc-hardening.md)
**Source spec:** [`docs/specs/2026-06-30-test-floor-script-glob-and-doc-hardening-design.md`](../specs/2026-06-30-test-floor-script-glob-and-doc-hardening-design.md)
**Date:** 2026-07-01 · **Target:** v0.8.5 (landOrder 5) · **Base:** `origin/master` `bfaa124` (v0.8.4, stacked on Spec 4) · **Closes:** #231, #232

## Verdict: **CLEARED** (one remediation round)

Both **executed** probes passed on the first run — the plan's core changes land green. The initial gate was BLOCKED only on **analyzed** prose-accuracy findings (`consistency-placeholders` `needsDecision`), all patched in place; one was refuted as intentional.

## Attack surface

8 probes, all on-target: 5 spine + 3 bespoke.
- **Executed (throwaway sandboxes):** `executable-proof` (warn), `tdd-231` (pass), `repro-232` (pass).
- **Analyzed:** `claims-vs-reality` (pass), `coverage-vs-source` (pass), `consistency-placeholders` (fail→patched), `dependency-feasibility` (pass), `anchor-231-232` (fail→patched).

### Executed proofs (the core is sound)
- **`tdd-231`** (pass): reproduced the #231 TDD — Case 6 (`--pattern '*.test.js *.spec.js'`: 6a `.test.js` → exit 0, 6b `.txt` → non-zero) FAILS RED against the single-arm `case` (space-joined literal never matches), PASSES GREEN after the `for pat in $custom_pattern; …; break 2` loop; load-bearing (reverting the loop re-fails 6a).
- **`repro-232`** (pass): appending `[--repo <git-dir>]` to the plan + spec signatures yields a `--repo` grep hit in each; `--repo` confirmed load-bearing in the test fixtures; full gate stays green. (Methodology note: a `cp -R` sandbox spuriously failed the node gate by dragging in untracked `.claude/war-wt/**` `*.test.mjs` files that trip `war-config.test.mjs`'s "outside skills/" walk — a **git-worktree** sandbox gates green. The WAR worker uses a git worktree, so this is not a plan risk.)

## Findings & resolutions applied

| # | Probe | Severity | Finding | Resolution |
|---|-------|----------|---------|------------|
| 1 | `consistency-placeholders` | Major (`needsDecision`) | Task 2 references `docs/plans/2026-06-29-worker-test-floor.md` / `…-design.md` (dated 2026-06-29 vs the plan's 2026-06-30). | **REFUTED** by adversarial-confirm — these are the prior-spec files Spec 5 legitimately *modifies* (intentional stacking; "lands on the prior spec's tip"). No change. |
| 2 | `consistency-placeholders` | Major/Minor (`needsDecision`) | Plan calls the test's cases "1–5", but the file has 5 top-level cases with case 3 sub-lettered 3a–3g (11 labels). | Reworded Task 1 (Files bullet + Step 1) to "the 5 top-level cases 1–5 (case 3 sub-lettered 3a–3g)". |
| 3 | `consistency-placeholders` | Major | Files bullet's `# ponytail: one-glob custom path; …` ellipsis won't anchor to the real comment (`…; add multi-pattern support when needed.`). | Replaced the ellipsis with the full comment text (Step 4 already had it). |
| 4 | `anchor-231-232` | Minor (CONFIRMED) | A **second** stale comment — `# A custom --pattern string is matched via a single case glob (caller controls).` (~L103) — also lags after the fix; Task 1 only updated the ponytail comment. | Added line-103 to Task 1's scope (Files bullet + Step 4 now update **both** comments, with exact old/new text). No test asserts on either. |
| 5 | `executable-proof` | Minor (CONFIRMED, warn) | Plan framed HEAD as v0.8.0 / "Builds on v0.7.8" (stale); HEAD/master is v0.8.4. Release number still lands correctly via the plan's own "read the actual slot" guardrail. | Re-grounded the baseline prose (Coordination + Task 3 Step 1) to v0.8.4 → target v0.8.5, "Builds on v0.8.4". |

## Residual risk

None blocking. Lowest-risk plan in the stack: `assert-test-in-diff.sh` is an isolated lane, `--pattern` is inert on the production path (no caller passes it), and the fix is a bash-3.2-safe token-iteration loop with a load-bearing red-first test. `--repo` retained (load-bearing) and reconciled across the three signatures.

## Post-clearance addendum (2026-07-01) — a Major the executed probe was blind to

The WAR audit coven (Phase 1, task t1) escalated a **Major** the red-team missed: the plan's prescribed
`for pat in $custom_pattern` (no `set -f`) reintroduces **pathname (glob) expansion** — the old
`case "$f" in $custom_pattern)` never globbed (case-pattern position), so moving `$custom_pattern` into a `for … in`
word-list position is a new latent regression. The `tdd-231` probe was structurally blind to it: it ran Case 6a/6b in an
**empty** mktemp cwd, where the unquoted tokens have nothing to glob-expand against, so the defect stays green in the
happy env (exactly the `weak-test-assertion-passes-without-feature-being-exercised` blind-spot). **Lesson for the probe
catalog:** a glob/word-splitting fix must be exercised from a cwd **seeded** with a file matching a pattern token, not a
clean one. The Lead adjudicated the escalation by amending the plan: `set -f`/`set +f` noglob guard (plain `break` +
`[ "$found" = 1 ] && break`, since `break 2` would skip the restore) + a load-bearing **Case 6c** (seeded cwd). Phase 1
was re-run on the amended plan.

## Coverage summary

`{ probes: 8, executed: 3, analyzed: 5, expected: 8, onTarget: 8, offTarget: [], dropped: [] }` — coverage whole. Executed proofs green on first run; analyzed prose findings patched (one refuted). No `INCOMPLETE` condition.
