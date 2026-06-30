# Test-floor `assert-test-in-diff.sh`: multi-glob `--pattern` fix + `--repo` doc/signature reconciliation

**Status:** proposed — targets **v0.7.12** (latent-correctness + doc-fidelity). **Severity: LOW.**
**Source:** issues #231 (`--pattern` collapses a multi-glob set into one never-matching literal), #232 (`--repo` test-only flag absent from plan/spec usage signatures). Memory: [[floor-script-discovery-set-must-mirror-gate-exclusions]], [[floor-script-exit-codes-1-vs-2-route-differently]], [[weak-test-assertion-passes-without-feature-being-exercised]], [[task-prompt-suite-count-stale-after-stacking]].

Two pure nits, both in the single M2 floor script. One is a real (but dormant) capability bug in a code path no production caller exercises; the other is documentation lagging the landed interface. Smallest correct change for each — no behavior change on the wired default path.

## Problem

Both defects live in [`skills/war/assets/assert-test-in-diff.sh`](../../skills/war/assets/assert-test-in-diff.sh). Live repo is v0.7.7; both confirmed at HEAD.

### #231 — `--pattern` override never matches a multi-glob set

The script's header and usage string advertise a plural glob *set*: the [`Usage:` block](../../skills/war/assets/assert-test-in-diff.sh) says `[--pattern <glob-set>]`, and the [arg-count `die` string](../../skills/war/assets/assert-test-in-diff.sh) repeats `[--pattern <glob-set>]`. But the custom-pattern match arm runs a **single** `case` glob:

```sh
case "$f" in
  $custom_pattern) found=1; break ;;
esac
```

Bash `case` honors only the first token after word-splitting `$custom_pattern` as the pattern (additional tokens are not alternatives unless `|`-separated). A set like `--pattern '*.test.js *.spec.js'` is therefore treated as the literal pattern `*.test.js *.spec.js` (with an embedded space), which can never match a single filename. The inline comment [`# ponytail: one-glob custom path; add multi-pattern support when needed.`](../../skills/war/assets/assert-test-in-diff.sh) documents this as a deliberate single-glob ceiling — so the contract (`<glob-set>`) over-promises what the code delivers.

**Latent, not active.** No production caller passes `--pattern`: [`war-refiner.md` step 4](../../agents/war-refiner.md) invokes the script bare, and the test suite ([`assert-test-in-diff.test.sh`](../../skills/war/assets/assert-test-in-diff.test.sh) cases 1–5) exercises only the default `match_default` path. The override path has **zero** coverage — so the bug is also untested.

### #232 — `--repo` test-only flag absent from the design-doc signatures

The script accepts `--repo <git-dir>`, which plumbs `git -C $repo_dir` so the `.test.sh` can point git at mktemp fixture repos without `cd`-ing the gate runner. The [`--repo)` parse arm](../../skills/war/assets/assert-test-in-diff.sh) and the [`git -C` selection](../../skills/war/assets/assert-test-in-diff.sh) are load-bearing for fixture isolation — every fixture case in [`assert-test-in-diff.test.sh`](../../skills/war/assets/assert-test-in-diff.test.sh) invokes `bash "$SCRIPT" "$BASE" "$TASK" --repo "$R"`.

The script's **own header is self-consistent** (it lists `--repo`). The drift is in the design docs: the usage signatures in [`docs/plans/2026-06-29-worker-test-floor.md` Task 1](../plans/2026-06-29-worker-test-floor.md) (`<integration-base> <task-branch> [--pattern <glob-set>]`) and [`docs/specs/2026-06-29-worker-test-floor-design.md` §3.1](./2026-06-29-worker-test-floor-design.md) (same) list **only** `--pattern`, never `--repo`. ADR-0006 carries no usage signature (prose only — verified), so it needs no edit. The flag is purely additive and inert in production (unknown args are `die`-gated, the sole production caller never passes it), so this is a cosmetic doc-fidelity gap: script interface ⊃ documented interface.

## Decisions

| # | Issue | Decision | Choice | Rejected alternative |
|---|-------|----------|--------|----------------------|
| 1 | #231 | Make the override deliver the advertised set | Iterate the override tokens: `for pat in $custom_pattern; do case "$f" in $pat) found=1; break 2 ;; esac; done` (`break 2` exits both the inner `for` and the outer file-read `while`, matching the existing single-pattern `break` semantics). | Keep the one-glob ceiling and instead **narrow the docs** to `<glob>` (singular). Rejected: the test suite would still have zero override coverage, and the header already promises a set — fixing the code is the same-size diff and honors the contract. |
| 2 | #231 | Make the override path load-bearing-tested | Add one case to `assert-test-in-diff.test.sh` exercising `--pattern '*.test.js *.spec.js'`: a branch adding `foo.test.js` matches (exit 0), a branch adding only `foo.txt` does not (non-zero). Trace: with the old single-arm code the multi-token branch fails (literal-with-space never matches) → the new test is load-bearing. | No test (ship code only). Rejected: an untested override path is how this bug shipped silent ([[weak-test-assertion-passes-without-feature-being-exercised]]). |
| 3 | #231 | Update the stale ceiling comment | Replace the [`# ponytail: one-glob custom path; …`](../../skills/war/assets/assert-test-in-diff.sh) comment to state multi-glob support (e.g. `# ponytail: space-separated glob set; each token matched independently.`). | Leave the comment. Rejected: it would then mis-describe the new loop. |
| 4 | #232 | Reconcile docs to the real interface, don't delete the flag | Append `[--repo <git-dir>]` to the usage signatures in [`docs/plans/2026-06-29-worker-test-floor.md`](../plans/2026-06-29-worker-test-floor.md) Task 1 and [`docs/specs/2026-06-29-worker-test-floor-design.md`](./2026-06-29-worker-test-floor-design.md) §3.1 (matching the `<git-dir>` token the script header already uses), AND annotate `--repo` test-only in the script header so a reader knows production never passes it. | (a) Delete `--repo` — rejected, it is load-bearing for `.test.sh` fixture isolation. (b) Annotate header only, leave the doc signatures stale — rejected, the plan/spec are the surfaces an implementer copies from; reconcile all three so they agree. |

## Surface changes

| File | Change |
|------|--------|
| [`skills/war/assets/assert-test-in-diff.sh`](../../skills/war/assets/assert-test-in-diff.sh) | (#231) Replace the single-arm custom-pattern `case` with a `for pat in $custom_pattern` loop using `break 2`; update the `ponytail:` comment. (#232) Annotate `[--repo <git-dir>]` as test-only in the `Usage:` header block (e.g. `# (--repo is test-only: points git at a fixture repo; production invokes from the task-worktree cwd)`). |
| [`skills/war/assets/assert-test-in-diff.test.sh`](../../skills/war/assets/assert-test-in-diff.test.sh) | (#231) Add one case: `--pattern '*.test.js *.spec.js'` matches a `foo.test.js`-adding branch (exit 0) and rejects a non-test-adding branch (non-zero). Keep the existing 11 `--repo` fixture call sites. |
| [`docs/plans/2026-06-29-worker-test-floor.md`](../plans/2026-06-29-worker-test-floor.md) | (#232) Append `[--repo <git-dir>]` to the Task 1 usage signature. |
| [`docs/specs/2026-06-29-worker-test-floor-design.md`](./2026-06-29-worker-test-floor-design.md) | (#232) Append `[--repo <git-dir>]` to the §3.1 signature. |

No code-behavior change on the default (production) path. No mirrored-constant / drift-guard cascade. No version-slot consumer logic touched.

## Alternatives considered

- **Status quo (do nothing).** Rejected for #231: the header promises `<glob-set>`; the first repo that actually needs a `.test.js` + `.spec.js` override would silently get a never-matching floor (the floor reports no-test for a branch that *does* add a test). Rejected for #232: the doc/script interface drift is exactly the [[task-prompt-suite-count-stale-after-stacking]] family — the design-doc literal goes stale against the landed asset.
- **`run.testPattern` plumbing (out of scope).** The spec §3.1 / plan prose mention an overridable `run.testPattern`; nothing in the production wiring currently passes `--pattern` from config. Wiring that is a separate feature, not a fix for these nits — not in scope.
- **Narrow `--pattern` to a single glob in docs instead of fixing code (#231).** Smaller-looking but leaves the override untested and contradicts the `<glob-set>` header; the iterate-tokens fix is the same diff size and is correct.

## Validation criteria

1. **#231 (capability):** In a fresh fixture repo, a branch that adds only `pkg/foo.test.js` run as `assert-test-in-diff.sh <base> <branch> --pattern '*.test.js *.spec.js' --repo <fixture>` exits **0**; the same invocation against a branch that adds only `pkg/foo.txt` exits **non-zero**. Reverting the `for`-loop to the old single-arm `case` flips the first assertion to non-zero (proving the new test is load-bearing). The new `.test.sh` case encodes exactly this.
2. **#232 (doc-fidelity):** `grep -- '--repo' docs/plans/2026-06-29-worker-test-floor.md docs/specs/2026-06-29-worker-test-floor-design.md` returns a hit in each (the appended `[--repo <git-dir>]`), and the script's `Usage:` header contains a test-only annotation naming `--repo`. The three usage signatures (script header, plan, spec) then list the same flag set: `[--repo <git-dir>] [--pattern <glob-set>]`.

## Coverage

| Issue | Decision(s) | Validation |
|-------|-------------|------------|
| #231 | 1, 2, 3 | 1 |
| #232 | 4 | 2 |

## Version serialization

Targets **v0.7.12**, landOrder 5 in the audit stack (below the substantive workflow-template specs; above the cosmetic sweep — #231 is a real capability bug, but dormant). Bump the four canonical slots in the same commit, replace-in-place: [`plugin.json`](../../.claude-plugin/plugin.json) `version`, both `version` fields in [`marketplace.json`](../../.claude-plugin/marketplace.json), and the README [`## Status`](../../README.md) block (replace-slot, not append). Lands serially on the prior plan's landed tip.

## Gate

`node --test "skills/**/*.test.mjs"` plus the 6 `skills/**/*.test.sh` runners (incl. the modified `assert-test-in-diff.test.sh`) and the other workflow `*.test.sh` runners — 12 `*.test.sh` runners total across the gate. The new `--pattern` case is discovered by the gate's `*.test.sh` find, so it runs in CI without extra wiring.

## Open risks / non-goals

- **Non-goal:** wiring `run.testPattern` → `--pattern` from config. These nits only fix the flag's own correctness and its documentation; no production caller passes `--pattern` after this change.
- **Risk (negligible):** `for pat in $custom_pattern` relies on IFS word-splitting of the override string — intended (the set is space-separated by contract). A caller wanting a literal space in a single glob is not a supported case (no test type uses spaces in filenames); the `<glob-set>` contract is space-separated tokens.
