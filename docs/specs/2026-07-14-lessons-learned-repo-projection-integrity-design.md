# Housekeeping repo-projection integrity — archive re-renders with `--repo`, safe-swap verify gains a repo-row completeness hard fail

Source issues: #891
Date: 2026-07-14
Plan-converter note: no internal ordering constraint — this is a single coherent fix across
`skills/lessons-learned/SKILL.md`, `skills/lessons-learned/assets/safe-swap.sh`, and
`skills/lessons-learned/assets/safe-swap.test.sh`. One phase suffices; carve tasks only by file
disjointness if parallelism is wanted.

## 1. Context — the gap / problem

Two coupled defects let a `/lessons-learned` housekeeping run swap a projection that has silently
lost every repo-root lesson row:

1. **The Phase 5 archive step re-renders local-only.** The "Archive" bullet in
   `skills/lessons-learned/SKILL.md` (§ "5 — Archive, merge-source removal, index render")
   invokes `war-memory archive --local "$STAGING" <slug>...` without `--repo`. `cmdArchive` in
   `skills/_shared/war-memory.mjs` ends by calling `cmdRenderIndex(argv)` on the *same argv*, and
   `resolveRoots(argv)` only walks the roots it is told about — so on a repo-adopted store the
   trailing re-render regenerates the staged `MEMORY.md` from the local root alone and drops every
   `[repo]`-marked row (observed 2026-07-13: ~24 KB / 144 lines → ~4 KB / 30 lines). The later
   explicit `render-index --local "$STAGING" --repo "$REPO_ROOT"` step restores the rows, but a run
   interrupted between archive and render carries the incomplete projection into the swap gate.

2. **The swap gate cannot detect the loss.** `do_verify` in
   `skills/lessons-learned/assets/safe-swap.sh` checks only *internal* consistency: its row→file
   hard fail deliberately excludes `[repo]`-marked rows (the load-bearing Rule 2 — their files live
   in the repo root, not the staged local dir), and it has no completeness check against a repo
   root it is never told about. A projection with **zero** `[repo]` rows on a repo-adopted store
   prints `VERIFY: PASS`, and `commit` (which reuses `do_verify`) swaps it live.

Backing lesson (code-verified, adopted in the learnings-adoption merge of 2026-07-14):
`docs/learnings/archive-subcommand-rerender-drops-repo-rows-and-verify-cannot-catch-it.md`.

## 2. Pivotal constraints

- **`do_verify` is the single shared gate.** Both the `verify` subcommand and the `commit`
  pre-swap re-verify route through `do_verify` — the completeness check must land there once, so
  the final gate that actually guards the swap enforces it too.
- **bash 3.2.57 compatibility** (script header contract: no globstar, no associative arrays, no
  `${,,}`) — the check must use the script's existing idioms (`ls -1 *.md`, `grep -c`).
- **Fail-closed on presence, fail-open on absence.** A store may legitimately be local-only;
  verify cannot invent a repo root. The hard fail may fire only when a repo root is explicitly
  supplied, resolves to a directory, and contains hot lessons.
- **Rule 2 must survive intact.** The `grep -v '\[repo\]'` exclusion feeding the row→file hard
  fail (proven load-bearing by the `temp-break1` case in `safe-swap.test.sh`) is untouched — the
  new check is additive, a *different* predicate over the same marker.
- **The evict re-render is deliberately local-only** (the "Dropping `--repo`…" bullet in SKILL.md
  § "Common mistakes" records the exception). The evict playbook never runs `safe-swap.sh`, and
  post-evict the repo root is emptied, so the new check must be shaped to not conflict with it
  (the hot-lesson predicate makes an emptied repo root a skip, not a fail).
- **One root-resolution convention.** `resolveRoots` in `skills/_shared/war-memory.mjs` already
  reads `CLAUDE_MEMORY_REPO` as the `--repo` fallback; the shell gate should reuse that exact
  variable name rather than mint a second convention.
- **Existing test fixtures must pass byte-for-byte unchanged** when no repo root is supplied —
  the check is invisible to legacy invocations.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| How the repo root reaches verify | Env var `CLAUDE_MEMORY_REPO`, read inside `do_verify` — not a positional arg. It reaches both `verify` and `commit` with zero argument-parsing changes and reuses the variable `resolveRoots` already honors. |
| Completeness predicate | **Hard fail** iff all three hold: `CLAUDE_MEMORY_REPO` is set and resolves to a directory, that directory contains ≥ 1 top-level `*.md` hot lesson (excluding `MEMORY.md`; `archive/` is cold and not counted), and the staged `MEMORY.md` contains **zero** rows carrying the `[repo]` marker. |
| Env var set but directory missing | WARN line, never a hard fail (misconfiguration signal; the store may still be internally consistent). |
| Env var unset/empty | Check silently skipped — no new output, legacy behavior byte-identical. |
| Archive invocation fix | The Phase 5 archive command gains `--repo "$REPO_ROOT"` under the *same* conditional as the existing render bullet: pass it when the repo root resolves, omit only when none does. |
| Prose threading | The Phase 6 `verify` and Phase 7 `commit` command blocks in SKILL.md gain a conditional `CLAUDE_MEMORY_REPO="$REPO_ROOT"` prefix, and the Phase 6 "It checks:" sentence lists the new hard check (script and prose move together, per the standing-instruction/dispatched-prompt drift lesson). |
| Test shape | One new case block in `safe-swap.test.sh` with a FAIL arm (repo root with a hot lesson + zero-`[repo]`-row projection → `VERIFY: FAIL`, nonzero exit, FAIL line) and a PASS arm (same repo root + a `[repo]` row → `VERIFY: PASS`). The FAIL arm *is* the rule-fires proof, so no temp-break script copy is needed. Plus ambient-env sanitation at the top of the file. |
| Depth of completeness | Zero-row wholesale-drop detector only. Per-slug reconciliation of `[repo]` rows against repo-root files is out of scope (see §9). |

## 4. Mechanics

### `skills/lessons-learned/assets/safe-swap.sh` — `do_verify`

After the existing budget block (or adjacent to the other hard checks — placement inside
`do_verify` is the implementer's call), add the repo-completeness check:

- Read `repo="${CLAUDE_MEMORY_REPO:-}"`.
- Empty → skip, emit nothing (legacy output unchanged).
- Set but not a directory → emit a `WARN` line naming the path; do not set `FAILED`.
- Set and a directory → count top-level hot lessons with the script's existing listing idiom
  (`ls -1 *.md` in `$repo`, excluding `MEMORY.md`; non-recursive, so `archive/` is naturally
  excluded). If the count is ≥ 1 and `grep -c '\[repo\]'` over `$mem` is 0, emit a `FAIL` line
  that names the repo root and hints the recovery (`re-run render-index --local <staging>
  --repo <repo root>`), and set `FAILED=1`. Otherwise emit an `ok` line
  (e.g. `ok    [repo] rows present for a populated repo root`).

No changes to argument parsing, to the `verify`/`commit` subcommand dispatch, or to any existing
check. Because `commit` calls `do_verify` before the swap, an incomplete projection now dies at
`commit: staging FAILED verification — NOT swapping` with the env var threaded.

### `skills/lessons-learned/SKILL.md`

- **Phase 5, "Archive" bullet:** the command becomes
  `war-memory archive --local "$STAGING" --repo "$REPO_ROOT" <slug>...`, with the same
  when-the-repo-root-resolves conditional prose the render bullet already carries. Note in the
  bullet that archive's trailing re-render now walks both roots, so the staged projection keeps
  its `[repo]` rows even if the run dies before the explicit render step.
- **Phase 6 block:** prefix the verify invocation with `CLAUDE_MEMORY_REPO="$REPO_ROOT"` (same
  conditional), and extend the "It checks:" sentence with the fourth hard check: a populated repo
  root with a zero-`[repo]`-row projection is a hard fail.
- **Phase 7 block:** the `commit` invocation gains the same `CLAUDE_MEMORY_REPO="$REPO_ROOT"`
  prefix, since `commit` re-verifies staging itself.
- **"Common mistakes", the "Dropping `--repo` from the Phase 5 render…" bullet:** widen it to
  cover the archive invocation too, and note that the verify gate now backstops the mistake when
  the repo root is threaded (keep the evict-exception sentence exactly as is).

### `skills/lessons-learned/assets/safe-swap.test.sh`

- **Env sanitation:** near the top (after the `SCRIPT` guard, before CASE 1), unset or empty
  `CLAUDE_MEMORY_REPO` so a developer's ambient export cannot inject the new check into the
  pre-existing cases.
- **New case — repo completeness:** build a fresh `mkmem` staging dir with a local hot lesson and
  a projection containing **no** `[repo]` rows; build a second temp dir standing in for the repo
  root containing one hot lesson file. FAIL arm: run
  `CLAUDE_MEMORY_REPO=<repodir> bash "$SCRIPT" verify <dir>` and assert nonzero exit, a `FAIL`
  line mentioning the repo root, and `VERIFY: FAIL`. PASS arm: `add_row` a `gamma`-style
  `[repo]`-marked row (CASE 1's fixture pattern) and assert exit 0 + `VERIFY: PASS`. Optionally a
  third arm: `CLAUDE_MEMORY_REPO` pointing at a nonexistent path → exit 0 with a `WARN` line.
- Existing cases 1–N and both temp-break proofs remain untouched and must still pass.

## 5. Surface changes

| File | Change |
|---|---|
| `skills/lessons-learned/assets/safe-swap.sh` | `do_verify` gains the `CLAUDE_MEMORY_REPO`-driven repo-completeness hard check (+ WARN on a dangling path). |
| `skills/lessons-learned/SKILL.md` | Phase 5 archive command gains `--repo "$REPO_ROOT"`; Phase 6/7 command blocks thread `CLAUDE_MEMORY_REPO`; Phase 6 check list and the Common-mistakes `--repo` bullet updated. |
| `skills/lessons-learned/assets/safe-swap.test.sh` | Ambient-env sanitation + one new repo-completeness case (FAIL arm, PASS arm, optional WARN arm). |

No engine (`workflow-template.js`), hook, or `war-memory.mjs` surfaces change — `cmdArchive`
already accepts `--repo`; only its *invocation* and the shell gate move.

## 6. New domain terms (CONTEXT.md)

None. "Repo-completeness check" is adequately described in situ by the SKILL.md Phase 6 prose;
it does not rise to a glossary term.

## 7. Recommended ADRs

None. This extends an existing gate within the two-root architecture already ratified by ADR 0015;
no new binding decision is introduced.

## 8. Open risks / implementation notes

- **`--repo` on archive widens the archivable set.** With `--repo`, `cmdArchive`'s `bySlug` map
  includes repo-root hot lessons, so a Phase 5 slug typo matching a repo slug would `git mv` it
  into `docs/learnings/archive/` instead of erroring `no hot lesson`. Accepted residual: the
  Phase 3 action plan is operator-surfaced before Phase 5 runs, and archiving is a reversible
  move, never a delete.
- **Ambient `CLAUDE_MEMORY_REPO`** (the migration playbook's env preamble in
  `skills/lessons-learned/references/migration.md` exports it) activates the check wherever verify
  later runs in the same shell. That is the fail-toward-completeness direction and is desired;
  post-evict the repo root is emptied so the hot-lesson predicate skips. A *partially* evicted
  repo root mid-playbook could in principle trip the check, but the evict flow never invokes
  `safe-swap.sh` — residual only.
- **Token sweep (invocations):** `grep -rn 'safe-swap.sh' skills/lessons-learned/` and handle
  every match — each `verify`/`commit` invocation site must either thread `CLAUDE_MEMORY_REPO` or
  be a documented non-gate mention (`recover`, the resume table). Grep is a completeness floor,
  not a ceiling — after the grep, hand-scan the same-scope prose, tests, and comments
  (`SKILL.md` phase headers and Common mistakes, `references/migration.md`, `safe-swap.sh` header
  comment, `safe-swap.test.sh` header comment) and list each straggler as a survey-derived
  correction.
- **Token sweep (archive invocations):** `grep -rn 'archive --local' skills/lessons-learned/` and
  handle every match — the Phase 5 command block is the known site; any other `--local`-only
  archive example must gain the same conditional `--repo`. Grep is a completeness floor, not a
  ceiling — after the grep, hand-scan the target files' same-scope titles, tests, and comments and
  list each straggler as a survey-derived correction.
- The `safe-swap.sh` header comment (the "Subcommands:" block and the `verify` line) should be
  updated in the same commit to mention the optional `CLAUDE_MEMORY_REPO` input — comments lag
  rewritten code otherwise (recorded lesson: grep old terms in the same diff).
- Optionally annotate the backing lesson
  `docs/learnings/archive-subcommand-rerender-drops-repo-rows-and-verify-cannot-catch-it.md` with
  a resolved-by note once landed (existing convention: a "FIXED phase …" provenance line);
  not gating.

## 9. Non-goals / deferred

- **Per-slug repo reconciliation.** The check is a wholesale-drop detector; a projection that
  lost *some* but not all `[repo]` rows still passes. Full row↔file reconciliation against the
  repo root (the repo-side mirror of the local Rule-2 check) is deferred until a partial-drop
  failure mode is ever observed.
- **No `war-memory.mjs` changes.** `cmdArchive` behavior, `resolveRoots`, and the render budget
  axes are untouched.
- **No change to the evict flow's deliberate local-only re-render** or to the migrate playbook.
- **No new positional arguments or flags on `safe-swap.sh`** — the env var is the sole channel.

## 10. Validation criteria

Each criterion is independently checkable:

1. `grep -n 'archive --local "\$STAGING" --repo "\$REPO_ROOT"' skills/lessons-learned/SKILL.md`
   matches the Phase 5 Archive command block (the conditional "omit only when no repo root
   resolves" prose accompanies it).
2. `grep -n 'CLAUDE_MEMORY_REPO' skills/lessons-learned/assets/safe-swap.sh` matches inside
   `do_verify`, and the check appears exactly once (single shared gate, reached by both `verify`
   and `commit`).
3. FAIL arm behaves: a staging dir whose `MEMORY.md` has no `[repo]` rows, verified with
   `CLAUDE_MEMORY_REPO` pointing at a directory containing one top-level `*.md`, exits nonzero,
   prints a `FAIL` line naming the repo root, and prints `VERIFY: FAIL`.
4. PASS arm behaves: the same invocation after adding one `[repo]`-marked row exits 0 and prints
   `VERIFY: PASS` with no `FAIL` line.
5. Absence is invisible: with `CLAUDE_MEMORY_REPO` unset, `verify` output for the pre-existing
   CASE 1 fixture is unchanged from the pre-change script (no new lines).
6. Dangling path warns: `CLAUDE_MEMORY_REPO` set to a nonexistent path yields exit 0 (on an
   otherwise-clean dir) and a `WARN` line, never a `FAIL`.
7. Commit is gated: `commit` with the env var threaded and a zero-`[repo]`-row staging dies with
   `commit: staging FAILED verification` and leaves the live dir untouched.
8. Empty repo root skips: `CLAUDE_MEMORY_REPO` pointing at a directory with no top-level `*.md`
   (e.g. only `archive/` contents) does not fail — the evict-adjacent state is a skip.
9. `bash skills/lessons-learned/assets/safe-swap.test.sh` exits 0 with the new case(s) counted in
   its summary, and the file sanitizes `CLAUDE_MEMORY_REPO` before the pre-existing cases.
10. SKILL.md Phase 6 "It checks:" prose names the repo-completeness hard fail, and the Phase 6
    and Phase 7 command blocks carry the `CLAUDE_MEMORY_REPO="$REPO_ROOT"` prefix.
11. The Common-mistakes `--repo` bullet mentions the archive invocation and the new verify
    backstop while retaining the evict-exception sentence.
12. `node skills/_shared/war-memory.mjs lint docs/specs/` stays clean for this spec (no home
    paths, emails, or handles), and `bash hooks/... ` shell suites are unaffected (no hook files
    touched).
