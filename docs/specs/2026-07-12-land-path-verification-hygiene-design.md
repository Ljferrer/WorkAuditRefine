# Land-path verification hygiene — ensure-origin stderr capture, receiver-aware D9 leak guard, exit-3 push-error exerciser

Issues addressed: #801, #813, #814

## 1. Context — the gap / problem

Three small fidelity gaps sit on the land/provision shell path and its verification layer. None corrupts a
run; each degrades the diagnostic or coverage signal an operator or auditor relies on.

- **#801 — `cmd_ensure_origin` swallows git stderr.** The subcommand in
  `skills/war/assets/provision-worktrees.sh` runs its `git push -u origin` with `>/dev/null 2>&1` and dies
  with a static guess ("no origin remote, or the remote branch has diverged"). The operator never sees git's
  actual diagnostic and cannot distinguish failure modes. Sibling subcommands in the same file
  (`cmd_ensure_integration`'s fetch, `cmd_resolve_working_branch`'s branch-create) already capture stderr via
  the `_tmp_err` mktemp idiom and cat it into the die message — and a comment inside
  `cmd_ensure_integration` explicitly contrasts itself with this swallow ("NOT swallowed behind a static
  message like cmd_ensure_origin"). Adjudicated `disposition: note` at origin; tracked by the repo lesson
  `ensure-origin-swallows-stderr-unlike-sibling-subcommands`.
- **#813 — D9 leak detector false-trips on equality-form MergeResult prose.** The
  `detectEnumLeaks` pattern-1 regex in `skills/war/assets/land-decision.test.mjs`
  (`phase-token-in-status-equality`) matches `\bstatus\s*===?…` — and `\b` matches after a dot, so
  `mr.status === 'landed'` flags exactly like a genuine task-status leak. Legitimate narration currently
  escapes only via the colon-space-quote object-literal shape (`status: "landed"`); any future equality-form
  MergeResult narration added to `agents/*.md` or `schemas.md` will false-fail the guard. The ceiling is
  documented in the D9 block's `// ponytail: known ceiling` comment.
- **#814 — the exit-3-without-`[rejected]` branch of `cmd_land_advance` has no test exerciser.** The
  unrelated-push-error classification (non-zero push, no `[rejected]` token → exit 3) is reachable in
  production whenever the pre-push `ls-remote` guard passes but the push itself fails (permission denial,
  pre-receive rejection, mid-flight unreachability). T2.3 in `provision-worktrees.test.sh` was deliberately
  reframed to prove the ls-remote rc-guard, which now short-circuits before any push; no fixture reaches the
  push-error classification. Test-only gap — the production branch is correct.

## 2. Pivotal constraints

- **The exit 0/2/3 contract of `cmd_land_advance` is canonical** (its header comment in
  `provision-worktrees.sh` is the authoritative statement): 0 = landed/already-landed, 2 = CAS reland
  (`[rejected]` token seen), 3 = escalate (phantom land, readback failure, unrelated push error). A git
  error never collapses into 0 or 2, and `land_stale` ≠ `conflict`. New coverage MUST exercise the
  exit-3-without-`[rejected]` branch specifically — not another route to exit 3.
- **Never-force invariant (ADR 0004)** — the #801 fix touches only diagnostics; the push command itself and
  its idempotent/no-force semantics stay byte-identical.
- **Never loosen the D9 equality match.** The equality-form pattern is the leak the test exists to catch;
  the fix narrows what counts as a *task-level* `status` LHS, it must not weaken detection of bare
  `status === '<phase-token>'`.
- **Shell tests are bash-3.2-safe and cwd-independent** — new fixtures in `provision-worktrees.test.sh`
  follow the existing `setup_origin_pair` / `run_in_detached` conventions.
- **Comments must stay honest** (lesson `decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome`,
  and #801's own stale-contrast risk): every comment that names the pre-fix behavior is updated in the same
  commit as the behavior change.
- Anchor everything by named construct (subcommand names, test ids, pattern labels) — never line numbers.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| #801: how to surface push stderr | Retrofit the existing `_tmp_err` mktemp idiom (already used twice in the same file): `2>"$_tmp_err"`, cat into the die message. No new helper — reuse the file's own convention. |
| #801: keep or drop the static guidance text | Keep the never-force context ("refusing to force") in the die message, appended with git's captured stderr — guidance plus ground truth, not either/or. |
| #801: stale contrast comment in `cmd_ensure_integration` | Reword in the same commit: the "NOT swallowed behind a static message like cmd_ensure_origin" contrast becomes false once #801 lands; state instead that both use the `_tmp_err` idiom. |
| #813: dotted-receiver rejection vs receiver allowlist | **Receiver allowlist.** Rejecting *all* dotted receivers would let a genuine leak written as `task.status === 'landed'` escape. Pattern 1 instead captures an optional `<receiver>.` prefix and drops the hit only when the receiver is a known MergeResult narration name (`mr`, `mergeResult`). Bare `status` and any unlisted receiver still flag. |
| #813: where the allowlist lives | A named const beside `detectEnumLeaks` in `land-decision.test.mjs` (e.g. `NARRATION_RECEIVERS`), with the ponytail ceiling comment rewritten to name the residual: an unlisted narration receiver (`result.status === …`) still false-trips until added — the allowlist is the knob, never the equality match. |
| #814: fixture shape for exit-3-without-`[rejected]` | A bare origin whose `pre-receive` hook exits non-zero. `ls-remote` succeeds (the rc-guard passes), the push itself fails, and git emits `! [remote rejected] … (pre-receive hook declined)` — which does **not** contain the contiguous `[rejected]` token — so classification falls through to exit 3. This is the one failure shape that provably reaches the final branch. |
| #814: what the fixture asserts | Exit code 3 (not 2, not a die/exit-1 collapse), local follower ref byte-unchanged, origin tip unchanged. |
| Lesson bookkeeping | `docs/learnings/ensure-origin-swallows-stderr-unlike-sibling-subcommands.md` gets a resolution note (archive/retire is `/lessons-learned`'s call, not this change's). |

## 4. Mechanics

### `cmd_ensure_origin` (provision-worktrees.sh) — #801

Inside `cmd_ensure_origin`, wrap the existing `git push -u origin "refs/heads/$resolved:refs/heads/$resolved"`
with the `_tmp_err` capture used by `cmd_ensure_integration`'s fetch: stdout still discarded, stderr to the
temp file; on failure, cat the file into the die message after the existing never-force guidance, then
remove the temp file on both paths. The push command, refspec, and `-u` flag are untouched.

Comment sweep: grep `ensure_origin` and `ensure-origin` across `provision-worktrees.sh`, handle every match
— the known stale one is the contrast clause inside `cmd_ensure_integration`'s pre-cut reconcile comment.
**Grep is a floor, not a ceiling:** after the grep, hand-scan `provision-worktrees.sh`'s comments and
subcommand header blocks in the same scope (the `_tmp_err`-idiom sites and the `ensure-origin` header) for
prose describing the old swallow behavior without using either token, and list each straggler found as a
survey-derived correction in the change.

### `detectEnumLeaks` pattern 1 (land-decision.test.mjs) — #813

Rework the `phase-token-in-status-equality` regex to capture an optional dotted receiver
(`(?:\b(<ident>)\.)?status\s*===?…`). A hit with a captured receiver present in `NARRATION_RECEIVERS`
(`mr`, `mergeResult`) is dropped; everything else — bare `status`, or any other receiver — still flags.
Patterns 2 and 3 (`phase-token-as-status-label`, `task-token-in-landDecision`) are untouched. Rewrite the
`// ponytail: known ceiling` comment above the detector to name the new residual (unlisted narration
receivers) and the knob (extend `NARRATION_RECEIVERS`, never loosen the equality match).

Extend the existing `D9: the leak-guard catches injected leaks and does not false-trip on narration` test:

- must NOT flag: `mr.status === 'landed'` (equality-form MergeResult narration — the #813 case);
- MUST still flag: `status === 'landed'` (bare — existing case stays green) and
  `task.status === 'landed'` (unlisted receiver — proves the allowlist is narrow, not a dotted-receiver hole).

Narration sweep: grep `status ===` and `status ==` across `agents/*.md` and
`skills/war/references/schemas.md`, handle every match (expected: none today — the D9 current-tree test
stays green before and after). **Grep is a floor, not a ceiling:** after the grep, hand-scan the same
surfaces' MergeResult/land-decision sections for equality-phrased status prose spelled without the literal
operator (e.g. "when status equals landed"), and list each straggler as a survey-derived correction —
pattern 1 cannot see those, and they signal narration drift the reword should normalize.

### `cmd_land_advance` push-error exerciser (provision-worktrees.test.sh) — #814

Add one T2-family case beside T2.3, built on `setup_origin_pair` + `seed_working_branch` +
`run_in_detached`:

1. install an executable `pre-receive` hook in the bare origin's `hooks/` that prints a marker to stderr and
   exits 1;
2. commit a new merge sha in the clone, run `land-advance <working> <new-sha>`;
3. assert exit code **3** — the `ls-remote` rc-guard passed (origin reachable), the push failed, and the
   `! [remote rejected]` output contains no contiguous `[rejected]` token, so classification must fall
   through past the reland branch (this pins the exit-3-without-`[rejected]` branch, per the canonical
   0/2/3 contract);
4. assert the local follower ref is byte-identical to its pre-call value and the origin tip is unchanged.

Comment-honesty sweep: grep `PUSH-error` and `push-error` across `provision-worktrees.test.sh` and
`provision-worktrees.sh`, handle every match — T2.3's reframe comment block currently implies no fixture
reaches the push-error classification and must be updated to point at the new case. **Grep is a floor, not
a ceiling:** after the grep, hand-scan the T2.x case-header comments and `cmd_land_advance`'s CLASSIFY
header block for prose describing push-failure coverage in other words, and list each straggler as a
survey-derived correction.

## 5. Surface changes

- `skills/war/assets/provision-worktrees.sh` — `cmd_ensure_origin` stderr capture; stale contrast comment
  inside `cmd_ensure_integration` reworded; any sweep-found comment stragglers.
- `skills/war/assets/provision-worktrees.test.sh` — new failure-path case for `ensure-origin` (real git
  stderr appears in the die output; existing RWB.c covers only success/idempotency); new T2-family
  pre-receive-rejection case for `cmd_land_advance` exit 3; T2.3 comment block updated.
- `skills/war/assets/land-decision.test.mjs` — pattern-1 receiver capture + `NARRATION_RECEIVERS` const in
  the D9 block; ponytail ceiling comment rewritten; three new assertions in the injected-leaks test.
- `docs/learnings/ensure-origin-swallows-stderr-unlike-sibling-subcommands.md` — resolution note.

No behavior change anywhere on the land path itself: #801 is diagnostics-only, #813 and #814 are
verification-layer-only.

## 6. New domain terms (CONTEXT.md)

None. "Narration receiver allowlist" stays a test-local construct, not ubiquitous language.

## 7. Recommended ADRs

None — no binding decision changes. The 0/2/3 contract (already canonical in the script header), ADR 0004
(never-force), and ADR 0005 (floor exit-code discipline) are all left as-is and merely exercised.

## 8. Open risks / implementation notes

- **`[remote rejected]` vs `[rejected]` token distinctness is the fixture's load-bearing fact.** The
  classification grep in `cmd_land_advance` matches the contiguous literal `[rejected]`; git's pre-receive
  rejection line `! [remote rejected] …` does not contain it (a space precedes `rejected]`). The new test
  case is itself the proof; if a future git version changes this output shape, the test fails loud and the
  classification comment must be re-adjudicated — never by widening the grep to bare `rejected`.
- **#813 allowlist scope creep** — the residual ceiling moves from "any dotted receiver false-trips" to
  "any *unlisted* receiver false-trips". That is the intended trade (a `task.status` leak must keep
  biting); the rewritten ponytail comment is the guard against a future editor "fixing" a false-trip by
  loosening the equality match instead of extending the allowlist.
- **#801 die-message length** — captured stderr can be multi-line; the sibling idiom already accepts that
  (fetch diagnostics are catted verbatim), so no truncation logic is added.
- The `ensure-origin` failure-path test should assert on a distinctive fragment of real git stderr (e.g.
  the "does not appear to be a git repository" family from a broken remote URL), not on an exact
  full-message match — git wording varies across versions.

## 9. Non-goals / deferred

- No change to `cmd_land_advance` production code, its exit contract, or the `[rejected]` classification
  (#804's spec-prose fix and #815's prompt reword are separate specs/groups).
- No blocking-mode or shape-widening changes to any hook or floor (that is the #809/#810 confinement
  cluster).
- No D9 pattern-2/3 changes, and no attempt to detect equality-phrased prose without a literal operator —
  that stays a manual-survey concern.
- No archive/retire decision on the source lesson — resolution note only; `/lessons-learned` owns eviction.

## 10. Validation criteria

1. `bash skills/war/assets/provision-worktrees.test.sh` passes, including:
   - a new `ensure-origin` failure case whose die output contains real git stderr (fixture: remote URL
     pointed at a nonexistent path), proving the static-guess-only message is gone;
   - RWB.c (success + idempotency) still green and byte-unchanged in intent;
   - a new pre-receive-rejection case asserting `land-advance` exits **3**, with the local follower ref and
     origin tip unchanged — the exit-3-without-`[rejected]` branch is now exercised (this criterion is the
     #814 acceptance bar);
   - T2.3 still proves the ls-remote rc-guard short-circuit (exit 3 *before* any push) — the two exit-3
     routes are distinct cases and both must exist.
2. `node --test skills/war/assets/land-decision.test.mjs` passes, including the three new D9 assertions:
   `mr.status === 'landed'` no-flag, bare `status === 'landed'` flag, `task.status === 'landed'` flag; and
   the current-tree D9 leak scan stays empty.
3. Grep proof of comment honesty: no comment in `provision-worktrees.sh` still claims `cmd_ensure_origin`
   swallows stderr, and no comment in `provision-worktrees.test.sh` still implies the push-error
   classification is unreached — each of the three §4 sweeps was run AND its mandatory manual same-scope
   survey performed, with stragglers (or "none found") recorded as survey-derived corrections in the
   change description.
4. The D9 ponytail comment names the post-fix residual (unlisted narration receivers) and the extend-the-
   allowlist knob; the old "known ceiling" wording describing the pre-fix false-trip is absent.
5. Full suites stay green: `node --test 'skills/**/*.test.mjs'` and the anchored shell-test loop over
   `hooks/` + `skills/`.
