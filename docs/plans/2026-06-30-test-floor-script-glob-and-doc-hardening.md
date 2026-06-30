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

- **Target version:** **v0.7.12** · **landOrder 5** · **severity LOW.**
- **Closes:** issues **#231** (latent `--pattern` multi-glob bug) and **#232** (test-only `--repo` flag absent from doc signatures).
- **Integration base (stacked roadmap — operator-confirmed):** war this plan on the **landed tip of Spec 4 (v0.7.11)**,
  the auditor-git-guard plan — NOT plain `master`/`dev` (memory `audit-baseline-must-pin-integration-branch-not-main-checkout`).
  Read that landed tip's **actual** version-slot values before the release task; do not assume the prior slot reads `0.7.11`
  (it is whatever Spec 4 left — verify by hand). **This run lands serially on the prior spec's tip.**
- **Four canonical version slots — REPLACE-in-place, land serially:** `.claude-plugin/plugin.json` `version`;
  `.claude-plugin/marketplace.json` `metadata.version` **AND** `plugins[0].version`; `README.md` `## Status` paragraph.
  No badge. No cross-slot consistency test exists (memory `version-slots-no-cross-slot-consistency-test`) — verify all
  four by hand at the release commit.
- **Isolated lane.** Per the roadmap shared-file table, `skills/war/assets/assert-test-in-diff.sh` is Spec 5's sole lane —
  no other spec in the stack touches it. The only cross-spec contention is the four version slots (handled by the ordered
  versions). No drift-guard / mirrored-constant cascade; no version-slot consumer logic is touched.
- **Standalone fallback.** If run off current `master` (**v0.7.7**) instead of the stack, re-baseline the release to the
  **next free patch** off the live tip (next number by construct, memory `stacked-per-branch-releases-make-main-lag-cumulative`)
  and drop the prior-tip pin. The two code/doc tasks are unaffected; only the release task's number changes.

## Operator decisions — RESOLVED (baked in, authoritative)

- **#231 — iterate the override tokens (don't narrow the docs).** Replace the single-pattern
  `case "$f" in $custom_pattern) found=1; break ;; esac` arm with token iteration:
  `for pat in $custom_pattern; do case "$f" in $pat) found=1; break 2 ;; esac; done`. **`break 2` is required** (not
  `break`) — the `for` nests inside the file-read `while IFS= read -r f` loop; a plain `break` exits only the `for` and
  keeps scanning files. Update the `ponytail:` one-glob comment to describe the multi-glob loop. **Add a
  `--pattern '*.test.js *.spec.js'` test (red-first)** — the override path has ZERO coverage today. *Rejected:* keep the
  one-glob ceiling and narrow the header to `<glob>` (singular) — leaves the override untested and contradicts the
  `<glob-set>` header; the iterate-tokens fix is the same diff size and honors the contract.
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
  `while IFS= read -r f` loop — anchor by that construct, not a line number) with a `for pat in $custom_pattern` loop
  using **`break 2`**; update the `# ponytail: one-glob custom path; …` comment immediately above it.
- modify `skills/war/assets/assert-test-in-diff.test.sh` — add **Case 6** following the existing `setup_repo` /
  cwd-`mktemp` idiom (cases 1–5), and add a `6.` entry to the header case-list comment block (currently cases 1–5,
  lines 9–22) so it stays self-consistent (matches the file's existing convention).

**`requiresTest`: true** — the new Case 6 is #231's mapped, load-bearing test; covers spec Validation #1.

- [ ] **Step 1 — Write Case 6 (failing first).** In `assert-test-in-diff.test.sh`, add Case 6 mirroring the cases 1–5
  `setup_repo` + per-case cwd-`mktemp` idiom (`( cd "$cwdN" && bash "$SCRIPT" "$BASEn" "$TASKn" --pattern '*.test.js *.spec.js' --repo "$Rn" )`):
  - **6a** — a branch that adds `pkg/foo.test.js`, invoked with `--pattern '*.test.js *.spec.js'` → assert **exit 0**.
  - **6b** — a branch that adds only `pkg/foo.txt`, same flags → assert **non-zero**.
  Use `.test.js` deliberately — the **default** pattern rejects it (existing Case 3d proves `foo.test.js` → NO-MATCH), so
  only a working override can make 6a pass; this keeps the test load-bearing rather than vacuously matched by the default
  arm (memory `weak-test-assertion-passes-without-feature-being-exercised`). Add the `6.` line to the header case-list
  comment.
- [ ] **Step 2 — Run `bash skills/war/assets/assert-test-in-diff.test.sh` → RED.** Case 6a FAILS against the unmodified
  single-arm script: the old code treats `*.test.js *.spec.js` as one literal-with-space pattern that never matches
  `pkg/foo.test.js` → exit 1, while 6a expects 0. This proves the test is load-bearing (reverting the loop to the old
  single-arm `case` must re-fail 6a).
- [ ] **Step 3 — Implement the fix in `assert-test-in-diff.sh`.** Replace the single-arm
  `case "$f" in $custom_pattern) found=1; break ;; esac` with:
  ```sh
  for pat in $custom_pattern; do
    case "$f" in $pat) found=1; break 2 ;; esac
  done
  ```
  `break 2` exits both the inner `for` and the outer file-read `while` (matching the existing single-pattern `break`
  semantics). Relies on bash IFS word-splitting of the unquoted `$custom_pattern` — intended (the set is space-separated
  by contract) and bash 3.2.57-safe (no globstar / associative arrays).
- [ ] **Step 4 — Update the stale `ponytail:` comment.** Replace `# ponytail: one-glob custom path; add multi-pattern
  support when needed.` with `# ponytail: space-separated glob set; each token matched independently.` so the comment
  describes the new loop, not the retired single-glob ceiling (memory `source-comment-lags-emitted-prompt-after-rewrite`).
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

## Phase 2 — Release v0.7.12

### Task 3 — Version bump v0.7.12 + full gate green

**Files:** `.claude-plugin/plugin.json` (`version`); `.claude-plugin/marketplace.json` (`metadata.version` **AND**
`plugins[0].version`); `README.md` `## Status` (REPLACE-in-place; no badge).

- [ ] **Step 1 — Bump all FOUR canonical slots → `0.7.12`, replace-in-place, verifying each by hand** (memory
  `release-bump-slots-canonical-no-badge`, `version-slots-no-cross-slot-consistency-test` — no gate catches a partial
  bump; the second `marketplace.json` field `plugins[0].version` is distinct from `metadata.version`). Read the prior
  landed tip's **actual** slot value first and bump from there to `0.7.12` (do not assume the prior reads `0.7.11`).
  Replace the `README.md` `## Status` paragraph (currently `**0.7.7** — … Builds on v0.7.6.`) with the v0.7.12 copy and
  update the **"Builds on vX"** clause to the prior landed version. **Standalone fallback:** if run off `master`
  (v0.7.7), use the next free patch off the live tip instead of `0.7.12` and set "Builds on" accordingly.
  Status copy (gist): test-floor `--pattern` now iterates a space-separated glob set (multi-glob override); `--repo`
  documented test-only and reconciled across the plan/spec usage signatures.
- [ ] **Step 2 — Run the full self-discovering gate → GREEN.**
- [ ] **Step 3 — Commit.** `chore(release): v0.7.12 — test-floor --pattern multi-glob fix + --repo signature reconciliation (#231, #232)`

---

## Gate

The self-discovering multi-runner — quote the `.mjs` glob (bash 3.2 under-covers unquoted):

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

- **6** `skills/**/*.test.mjs` files + **12** `*.test.sh` runners at HEAD (6 `hooks/` + 6 `skills/`), incl. the modified
  `assert-test-in-diff.test.sh`. The new Case 6 is discovered by the gate's `*.test.sh` `find` — runs in CI with no extra
  wiring. Self-discovered via `skills/war/assets/war-config.mjs --resolve-gate`; never assert a literal runner count
  (memory `task-prompt-suite-count-stale-after-stacking`).
- Run the **full** gate (not `--test-name-pattern` subsets) before each commit.

## Coverage

| Issue | Task | Test |
|---|---|---|
| **#231** — `--pattern` multi-glob override (real, dormant capability bug) | **Task 1** — `for pat in $custom_pattern` loop (`break 2`) + ponytail comment + new Case 6 | `assert-test-in-diff.test.sh` Case 6 (6a `.test.js` override → exit 0; 6b `.txt` → non-zero); red-first, load-bearing (Validation #1) |
| **#232** — test-only `--repo` absent from doc signatures (doc-fidelity) | **Task 2** — header annotation + plan/spec signature append | none (doc/comment); `grep -- '--repo'` hits plan + spec (Validation #2) |

## Out of scope / Deferred (deliberate simplifications)

- **`run.testPattern` → `--pattern` config plumbing.** No production caller passes `--pattern` (the sole caller —
  `war-refiner.md` step 4 — invokes the script bare). Wiring config-driven patterns is a separate feature, not a fix for
  these nits. Non-goal (spec Open-risks).
- **Literal-space-inside-a-single-glob `--pattern`.** `for pat in $custom_pattern` relies on IFS word-splitting; the
  `<glob-set>` contract is space-separated tokens and no test type uses spaces in filenames. Unsupported and untested by
  design (negligible — spec Open-risks).
- **No drift-guard / mirrored-constant cascade, no version-slot consumer logic touched.** `assert-test-in-diff.sh` is an
  isolated lane and `--pattern` is inert on the production path; low blast radius — the lowest-risk spec in the stack.
- **No new ADR.** ADR-0006 (the floor-script ADR) carries no usage signature and needs no edit; this plan implements the
  spec without a new architectural decision.
