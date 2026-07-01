# Test-floor `assert-test-in-diff.sh` — multi-glob `--pattern` fix + `--repo` signature reconciliation Implementation Plan

**Goal:** the floor script's `--pattern` override advertises a plural glob *set* (`<glob-set>`) but the match arm
runs a **single** `case` glob, so `--pattern '*.test.js *.spec.js'` is treated as one literal-with-space pattern that
can never match a real filename — a latent capability bug on a path with **zero** coverage (#231). Separately, the
test-only `--repo` flag is in the script header but **absent** from the plan/spec usage signatures, so the documented
interface lags the landed one (#232). Two pure nits in one isolated-lane file. Smallest correct change for each; no
behavior change on the wired default (production) path.

**Source spec:** [`docs/specs/2026-06-30-test-floor-script-glob-and-doc-hardening-design.md`](../specs/2026-06-30-test-floor-script-glob-and-doc-hardening-design.md).
**Roadmap:** [`docs/plans/2026-06-30-open-issue-remediation-roadmap.md`](2026-06-30-open-issue-remediation-roadmap.md) — Spec 5, the authoritative version source.

Relevant memory: [[floor-script-discovery-set-must-mirror-gate-exclusions]], [[floor-script-exit-codes-1-vs-2-route-differently]],
[[weak-test-assertion-passes-without-feature-being-exercised]], [[task-prompt-suite-count-stale-after-stacking]],
[[source-comment-lags-emitted-prompt-after-rewrite]], [[release-bump-slots-canonical-no-badge]],
[[version-slots-no-cross-slot-consistency-test]], [[audit-baseline-must-pin-integration-branch-not-main-checkout]],
[[stacked-per-branch-releases-make-main-lag-cumulative]], [[war-phase-up-front-provisioning-conflicts-same-file-serial-tasks]].

## Coordination

- **Target version:** **v0.8.5** · **landOrder 5** · **severity LOW.**
- **Closes:** issues **#231** (latent `--pattern` multi-glob bug) and **#232** (test-only `--repo` flag absent from doc signatures).
- **Integration base (stacked roadmap — operator-confirmed):** war this plan on the **landed tip of Spec 4 (v0.8.4)**,
  the auditor-git-guard plan — NOT plain `master`/`dev` (memory `audit-baseline-must-pin-integration-branch-not-main-checkout`).
  Read that landed tip's **actual** version-slot values before the release task; do not assume the prior slot reads `0.8.4`
  (it is whatever Spec 4 left — verify by hand). **This run lands serially on the prior spec's tip.**
- **Four canonical version slots — REPLACE-in-place, land serially:** `.claude-plugin/plugin.json` `version`;
  `.claude-plugin/marketplace.json` `metadata.version` **AND** `plugins[0].version`; `README.md` `## Status` paragraph.
  No badge. No cross-slot consistency test exists (memory `version-slots-no-cross-slot-consistency-test`) — verify all
  four by hand at the release commit.
- **Isolated lane.** Per the roadmap shared-file table, `skills/war/assets/assert-test-in-diff.sh` is Spec 5's sole lane —
  no other spec in the stack touches it. (Note: as of v0.8.0 master there are now TWO floor scripts —
  `assert-test-in-diff.sh` and the newly-landed sibling `assert-no-submodule-mutation.sh`; this spec touches only the
  former. See ## Gate for the implication on the runner count.) The only cross-spec contention is the four version slots
  (handled by the ordered versions). No drift-guard / mirrored-constant cascade; no version-slot consumer logic is touched.
- **Baseline (re-grounded 2026-07-01).** master / this stacked base is now **v0.8.4** (Specs 1–4 landed; README `## Status`
  reads `**0.8.4** — … Builds on v0.8.3.`, all four slots `0.8.4`). Target **v0.8.5**, "Builds on v0.8.4". **Standalone
  fallback:** if somehow run off a different tip, re-baseline the release to the **next free patch** off that live tip
  (next number by construct, memory `stacked-per-branch-releases-make-main-lag-cumulative`) and set "Builds on" to that
  tip's actual version. The two code/doc tasks are unaffected; only the release task's number changes.

## Operator decisions — RESOLVED (baked in, authoritative)

- **#231 — iterate the override tokens under `noglob` (don't narrow the docs).** Replace the single-pattern
  `case "$f" in $custom_pattern) found=1; break ;; esac` arm with a **noglob-guarded** token iteration:
  ```sh
  set -f                                       # noglob: word-split $custom_pattern WITHOUT pathname (glob) expansion
  for pat in $custom_pattern; do
    case "$f" in $pat) found=1; break ;; esac  # plain break — see below; break 2 would skip the set +f restore
  done
  set +f                                       # always reached (break exits only the for) — no global noglob leak
  [ "$found" = 1 ] && break                    # propagate the match out of the file-read while
  ```
  **`set -f`/`set +f` is required, not optional.** Unquoted `for pat in $custom_pattern` is subject to BOTH
  word-splitting (intended — the set is space-separated by contract) AND **pathname (glob) expansion** (a NEW hazard this
  rewrite introduces: the OLD `case "$f" in $custom_pattern)` used `$custom_pattern` in a **case-pattern** position, which
  is never filename-expanded; moving it into a `for … in` **word-list** position activates globbing). Without `set -f`, a
  token like `*.test.js` glob-expands against the **invocation cwd** (the refiner runs this script from the task worktree,
  a real checkout) — e.g. `*.test.js` → `app.test.js` — silently corrupting the token and mis-matching. `set -f` keeps
  IFS word-splitting while suppressing pathname expansion. **Use plain `break` (not `break 2`)** inside the `for`: with
  `break 2` the restore `set +f` after the loop would be skipped on a match (break 2 exits the `while` too), leaking
  `noglob` into the rest of the process — instead the plain `break` exits only the `for`, `set +f` always runs, and
  `[ "$found" = 1 ] && break` propagates the match out of the outer `while`. bash-3.2.57-safe (`set -f`/`+f` predate 3.2;
  no arrays, so no bash-3.2 empty-array-under-`nounset` trap). Update **both** stale single-glob comments to describe the
  noglob-guarded multi-glob loop (Step 4). **Add `--pattern '*.test.js *.spec.js'` tests (red-first): 6a/6b in a clean
  cwd + a load-bearing 6c in a cwd seeded with a real `*.test.js` file** that catches the glob-expansion regression an
  empty cwd cannot (the override path has ZERO coverage today). *Rejected:* (a) keep the one-glob ceiling and narrow the
  header to `<glob>` (singular) — leaves the override untested and contradicts the `<glob-set>` header; (b) the
  quoted-array form (`read -ra pats <<< "$custom_pattern"; for pat in "${pats[@]}"`) — also glob-safe, but `"${pats[@]}"`
  on an empty split (`--pattern '   '`) trips bash-3.2's unbound-variable-under-`nounset` and crashes where the old code
  cleanly non-matched; the `set -f`/`break`/flag form has no such edge.
  **Provenance:** the plain `for pat in $custom_pattern; do … break 2 … done` form (no `set -f`) was the original
  operator decision; a WAR audit coven (correctness seat, held through rebuttal) escalated it as a **Major** latent
  glob-expansion regression on 2026-07-01. The red-team's executed TDD probe ran in an empty mktemp cwd and was
  structurally blind to it. This decision is the Lead's adjudication of that escalation — the noglob guard + Case 6c
  are the fix.
- **#232 — reconcile docs to the real interface; do NOT delete `--repo`.** Append `[--repo <git-dir>]` to the usage
  signatures in the plan + spec **AND** annotate `--repo` test-only in the script header so a reader knows production
  never passes it. `--repo` is **load-bearing** for `.test.sh` fixture isolation (every fixture case invokes
  `bash "$SCRIPT" "$BASE" "$TASK" --repo "$R"`). ADR-0006 carries no usage signature (prose only) — no edit. **Doc/comment
  task, no behavioral test.** *Rejected:* (a) delete `--repo` — it is load-bearing; (b) annotate header only and leave the
  doc signatures stale — the plan/spec are the surfaces an implementer copies from; reconcile all three.
- **Decomposition — TWO tasks, strictly serial, both in Phase 1.** #231 (script body + new test) and #232 (script header
  annotation + plan/spec signatures) both touch `assert-test-in-diff.sh`, so they serialize on that file
  (memory `war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`). Task 1 (#231) lands first; Task 2 (#232)
  reads Task 1's landed tip. One task per phase: Phase 1 holds the two serial code/doc tasks; Phase 2 is the release.

---

## Phase 1 — Fix the override + reconcile the signatures (`assert-test-in-diff.sh`, serial tasks)

### Task 1 — `--pattern` iterates the glob set + load-bearing override test (#231, code + test)

**Files:**
- modify `skills/war/assets/assert-test-in-diff.sh` — replace the **single-arm custom-pattern `case`** (the
  `case "$f" in $custom_pattern) found=1; break ;; esac` arm inside the `if [ -n "$custom_pattern" ]` branch of the
  `while IFS= read -r f` loop — anchor by that construct, not a line number) with the **noglob-guarded token loop**
  (`set -f` / `for pat in $custom_pattern` / plain `break` / `set +f` / `[ "$found" = 1 ] && break`) per the #231
  operator decision above — **`set -f`/`set +f` around the loop is mandatory** (unquoted `for pat in $custom_pattern`
  glob-expands against the cwd without it); and update **both** single-glob comments this fix makes stale (Step 4): the
  `# ponytail: one-glob custom path; add multi-pattern support when needed.` comment immediately above the arm, **and**
  the block comment `# A custom --pattern string is matched via a single case glob (caller controls).` (~L103).
- modify `skills/war/assets/assert-test-in-diff.test.sh` — add **Case 6 (6a/6b/6c)** following the existing `setup_repo` /
  cwd-`mktemp` idiom (the file's **5 top-level cases 1–5**, with case 3 sub-lettered **3a–3g**), and add a `6.` entry to
  the header case-list comment block (lines 9–22 — it lists the 5 top-level cases with 3a–3g under case 3) so it stays
  self-consistent (matches the file's existing convention).

**`requiresTest`: true** — the new Case 6 is #231's mapped, load-bearing test; covers spec Validation #1.

- [ ] **Step 1 — Write Case 6 (failing first).** In `assert-test-in-diff.test.sh`, add Case 6 mirroring the existing
  top-level cases 1–5 (case 3 is sub-lettered 3a–3g) `setup_repo` + per-case cwd-`mktemp` idiom (`( cd "$cwdN" && bash "$SCRIPT" "$BASEn" "$TASKn" --pattern '*.test.js *.spec.js' --repo "$Rn" )`):
  - **6a** — a branch that adds `pkg/foo.test.js`, invoked with `--pattern '*.test.js *.spec.js'` from a **clean (empty)**
    mktemp cwd → assert **exit 0**.
  - **6b** — a branch that adds only `pkg/foo.txt`, same flags, clean cwd → assert **non-zero** (negative control).
  - **6c** — same branch/flags as 6a (adds `pkg/foo.test.js`, `--pattern '*.test.js *.spec.js'`), but run from a cwd
    **seeded with a real file matching a pattern token** — `touch "$cwd6c/app.test.js"` after the `mktemp -d` and before
    the invocation → assert **exit 0**. This is the **load-bearing glob-expansion guard**: without the `set -f` noglob
    guard, `*.test.js` glob-expands to `app.test.js` in that cwd, the token is corrupted, `pkg/foo.test.js` no longer
    matches → exit 1 ≠ 0. 6a/6b run in empty cwds and are structurally **blind** to this defect
    (memory `weak-test-assertion-passes-without-feature-being-exercised`); 6c is the fixture that fails iff the noglob
    guard is absent.
  Use `.test.js` deliberately — the **default** pattern rejects it (existing Case 3d proves `foo.test.js` → NO-MATCH), so
  only a working override can make 6a/6c pass; this keeps the test load-bearing rather than vacuously matched by the
  default arm. Add the `6.` line to the header case-list comment.
- [ ] **Step 2 — Run `bash skills/war/assets/assert-test-in-diff.test.sh` → RED.** Cases 6a **and 6c** FAIL against the
  unmodified single-arm script: the old code treats `*.test.js *.spec.js` as one literal-with-space pattern that never
  matches `pkg/foo.test.js` → exit 1, while 6a/6c expect 0. 6c additionally fails against a **naive** `for pat in
  $custom_pattern` that omits `set -f` (glob-expands `*.test.js` → `app.test.js` in the seeded cwd → mis-match), so it is
  load-bearing for the noglob guard specifically. This proves both the multi-glob fix and its noglob guard are load-bearing
  (reverting either must re-fail 6c).
- [ ] **Step 3 — Implement the fix in `assert-test-in-diff.sh`.** Replace the single-arm
  `case "$f" in $custom_pattern) found=1; break ;; esac` with the **noglob-guarded token loop**:
  ```sh
  set -f                                        # noglob: word-split the set, do NOT pathname-expand the tokens
  for pat in $custom_pattern; do
    case "$f" in $pat) found=1; break ;; esac   # plain break — break 2 would skip the set +f below
  done
  set +f
  [ "$found" = 1 ] && break                     # a match ends the file-read while (old single-arm break's reach)
  ```
  **Both `set -f`/`set +f` and the plain-`break`+flag structure are load-bearing** (see the #231 operator decision for
  the full rationale): unquoted `for pat in $custom_pattern` word-splits (intended) AND pathname-globs (a new hazard vs.
  the old case-pattern position) — `set -f` suppresses the glob while keeping word-splitting; a plain `break` (not
  `break 2`) exits only the `for` so `set +f` always runs (no global `noglob` leak), and `[ "$found" = 1 ] && break`
  propagates the match out of the outer `while`. bash-3.2.57-safe (`set -f`/`+f` are POSIX; no arrays, so no bash-3.2
  empty-array-under-`nounset` trap).
- [ ] **Step 4 — Update BOTH stale single-glob comments** (memory `source-comment-lags-emitted-prompt-after-rewrite`;
  neither is asserted by any test, so the gate stays green): **(i)** replace `# ponytail: one-glob custom path; add
  multi-pattern support when needed.` with `# ponytail: space-separated glob set; each token matched independently.`;
  **(ii)** replace the block comment `# A custom --pattern string is matched via a single case glob (caller controls).`
  (~L103) with `# A custom --pattern string is matched by iterating its space-separated glob tokens (caller controls).`
  — both otherwise lag the new loop, not the retired single-glob ceiling.
- [ ] **Step 5 — Run the full self-discovering gate → GREEN** (see ## Gate). Case 6 now passes; cases 1–5 and all other
  runners stay green.
- [ ] **Step 6 — Commit.** `fix(war): assert-test-in-diff.sh --pattern iterates the glob set instead of one literal (#231)`
  — code + comment + test land in **one commit** so the gate on the landed tip is green.
- **Closes:** #231 — the override now delivers the advertised `<glob-set>`, with a load-bearing test on a path that had zero coverage.

### Task 2 — Reconcile usage signatures with the test-only `--repo` flag (#232, doc/comment) · deps Task 1

**Files:**
- modify `skills/war/assets/assert-test-in-diff.sh` — add a **test-only annotation** for `--repo` in the `Usage:` header
  block (anchor by the `Usage:` comment carrying `[--repo <git-dir>] [--pattern <glob-set>]`): a new comment line
  immediately under that signature line, e.g.
  `# (--repo is test-only: points git at a fixture repo; production invokes from the task-worktree cwd)`.
- modify `docs/plans/2026-06-29-worker-test-floor.md` — append `[--repo <git-dir>]` to the Task 1 usage signature
  (anchor by the `assert-test-in-diff.sh <integration-base> <task-branch> [--pattern <glob-set>]` line in the
  `new skills/war/assets/assert-test-in-diff.sh` bullet), placed **before** `[--pattern <glob-set>]` to match the script
  header order `[--repo <git-dir>] [--pattern <glob-set>]`.
- modify `docs/specs/2026-06-29-worker-test-floor-design.md` — append `[--repo <git-dir>]` to the §3.1 signature
  (anchor by the `assets/assert-test-in-diff.sh <integration-base> <task-branch> [--pattern <glob-set>]` line), same order.
- **ADR-0006** carries no usage signature (prose only — verified) → **no edit.**

**`requiresTest`: false** — pure doc/comment reconciliation; no executable behavior changes. The gate stays green.

- [ ] **Step 1 — (no behavioral test — doc/comment.)** Annotate `--repo` test-only in the `assert-test-in-diff.sh`
  `Usage:` header (new comment line under the signature). Do **NOT** delete the flag — it is load-bearing for `.test.sh`
  fixture isolation.
- [ ] **Step 2 — Append `[--repo <git-dir>]` to the plan signature** in `docs/plans/2026-06-29-worker-test-floor.md`
  Task 1 bullet, before `[--pattern <glob-set>]`.
- [ ] **Step 3 — Append `[--repo <git-dir>]` to the spec §3.1 signature** in
  `docs/specs/2026-06-29-worker-test-floor-design.md`, before `[--pattern <glob-set>]`.
- [ ] **Step 4 — Verify (spec Validation #2).** `grep -- '--repo' docs/plans/2026-06-29-worker-test-floor.md docs/specs/2026-06-29-worker-test-floor-design.md`
  returns a hit in each; the three signatures (script header, plan, spec) now list the same flag set
  `[--repo <git-dir>] [--pattern <glob-set>]`.
- [ ] **Step 5 — Run the full self-discovering gate → GREEN** (docs/comment don't change executable behavior; the suite stays green).
- [ ] **Step 6 — Commit.** `docs(war): reconcile assert-test-in-diff.sh usage signatures with the test-only --repo flag (#232)`
- **Closes:** #232 — the script interface and the plan/spec signatures agree; `--repo` retained and annotated test-only.

---

## Phase 2 — Release v0.8.5

### Task 3 — Version bump v0.8.5 + full gate green

**Files:** `.claude-plugin/plugin.json` (`version`); `.claude-plugin/marketplace.json` (`metadata.version` **AND**
`plugins[0].version`); `README.md` `## Status` (REPLACE-in-place; no badge).

- [ ] **Step 1 — Bump all FOUR canonical slots → `0.8.5`, replace-in-place, verifying each by hand** (memory
  `release-bump-slots-canonical-no-badge`, `version-slots-no-cross-slot-consistency-test` — no gate catches a partial
  bump; the second `marketplace.json` field `plugins[0].version` is distinct from `metadata.version`). Read the prior
  landed tip's **actual** slot value first and bump from there to `0.8.5` (do not assume the prior reads `0.8.4`).
  Replace the `README.md` `## Status` paragraph (**this stacked base reads `**0.8.4** — … Builds on v0.8.3.`** — Specs
  1–4 have landed; verify the actual slot value before editing) with the v0.8.5 copy and update the **"Builds on vX"**
  clause to `v0.8.4`. **Standalone fallback:** if somehow run off a different tip, use the next free patch off that live
  tip instead of `0.8.5` and set "Builds on" to its actual version accordingly.
  Status copy (gist): test-floor `--pattern` now iterates a space-separated glob set (multi-glob override); `--repo`
  documented test-only and reconciled across the plan/spec usage signatures.
- [ ] **Step 2 — Run the full self-discovering gate → GREEN.**
- [ ] **Step 3 — Commit.** `chore(release): v0.8.5 — test-floor --pattern multi-glob fix + --repo signature reconciliation (#231, #232)`

---

## Gate

The self-discovering multi-runner — quote the `.mjs` glob (bash 3.2 under-covers unquoted):

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

- **6** `skills/**/*.test.mjs` files + **13** `*.test.sh` runners at HEAD (6 `hooks/` + 7 `skills/`), incl. the modified
  `assert-test-in-diff.test.sh`. (The 13th `*.test.sh` is the v0.8.0 sibling floor script's
  `skills/war/assets/assert-no-submodule-mutation.test.sh` — not touched here, but it raised the runner count from 12.)
  The new Case 6 is discovered by the gate's `*.test.sh` `find` — runs in CI with no extra wiring. Self-discovered via
  `skills/war/assets/war-config.mjs --resolve-gate`; never assert a literal runner count
  (memory `task-prompt-suite-count-stale-after-stacking`, `floor-script-discovery-set-must-mirror-gate-exclusions`).
- Run the **full** gate (not `--test-name-pattern` subsets) before each commit.

## Coverage

| Issue | Task | Test |
|---|---|---|
| **#231** — `--pattern` multi-glob override (real, dormant capability bug) | **Task 1** — `set -f`-guarded `for pat in $custom_pattern` token loop (plain `break` + `[ "$found" = 1 ] && break`) + both stale comments + new Case 6 | `assert-test-in-diff.test.sh` Case 6 (6a `.test.js` override → exit 0; 6b `.txt` → non-zero; **6c** seeded cwd → exit 0, guards the noglob regression); red-first, load-bearing (Validation #1) |
| **#232** — test-only `--repo` absent from doc signatures (doc-fidelity) | **Task 2** — header annotation + plan/spec signature append | none (doc/comment); `grep -- '--repo'` hits plan + spec (Validation #2) |

## Out of scope / Deferred (deliberate simplifications)

- **`run.testPattern` → `--pattern` config plumbing.** No production caller passes `--pattern` (the sole caller —
  `war-refiner.md` step 4 — invokes the script bare). Wiring config-driven patterns is a separate feature, not a fix for
  these nits. Non-goal (spec Open-risks).
- **Literal-space-inside-a-single-glob `--pattern`.** The `set -f`-guarded `for pat in $custom_pattern` relies on IFS
  word-splitting (with pathname expansion suppressed by `noglob`); the `<glob-set>` contract is space-separated tokens and
  no test type uses spaces in filenames. Unsupported and untested by design (negligible — spec Open-risks).
- **No drift-guard / mirrored-constant cascade, no version-slot consumer logic touched.** `assert-test-in-diff.sh` is an
  isolated lane and `--pattern` is inert on the production path; low blast radius — the lowest-risk spec in the stack.
- **No new ADR.** ADR-0006 (the floor-script ADR) carries no usage signature and needs no edit; this plan implements the
  spec without a new architectural decision.
