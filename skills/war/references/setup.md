# /war Setup — branch-gated procedures

Verbatim evictions from `skills/war/SKILL.md` (prompt-surface simplification, spec §4.3; the moved
blocks below are byte-identical to their pre-eviction SKILL.md text at eviction time, except where a block carries a
noted in-place amendment — currently the § `--afk` sanity floor block). Each block is read on the
trigger named at its eviction site; the surrounding Setup / launch steps stay in the SKILL. Positional
words inside the moved blocks ("above", "below") refer to their original SKILL.md positions.
§ Run root is new doctrine authored here, never an eviction: it is the one canonical statement of the
run-root rule ([ADR 0059](../../../docs/adr/0059-run-root-follows-the-launch-checkout.md)), and every
other surface points at it and restates nothing.

## Run root

Trigger: you resolve where a run's worktrees, staged scripts, args files or manifest live, or you read
them back (`/war-review`, resume, relaunch).

**The rule.** The run root is the checkout whose `.claude/war/` holds a run's worktrees, staged
scripts, args files and manifest. A launch from a linked worktree (`git rev-parse --git-dir` differs
from `--git-common-dir`) uses the launch checkout's top level. A launch from the main checkout uses
`$MAIN`. Resolve it once at Setup, from the launch checkout:
```bash
G=$(git rev-parse --path-format=absolute --git-dir) && C=$(git rev-parse --path-format=absolute --git-common-dir) || exit 1
MAIN=$(dirname "$C"); RUN=$MAIN; [ "$G" = "$C" ] || RUN=$(git rev-parse --show-toplevel)
```
If either read fails, stop: never fall back to the cwd or to a guessed path.

- **`worktreeRoot`** is `<run root>/.claude/war/worktrees`.
- **Run folder.** The manifest is `<run root>/.claude/war/runs/<runId>.json`. The staged scripts and
  the args files live in the sibling directory `<run root>/.claude/war/runs/<runId>/`.
- **Untracked-ness.** Thread `mainCheckout` as `$MAIN`, never the run root. `ensure-exclude` then
  writes the `.claude/` line into the shared common git dir, which covers every worktree, a
  linked-worktree run root included. A linked worktree's own git dir holds no `info/exclude` that git
  reads.
- **Readers.** `/war-review`, resume and relaunch look under the launch checkout first, then under
  `$MAIN`, so a run started from either place is found.
- **What stays at `$MAIN` on purpose.** The audit-tamper record (`$MAIN/.claude/war/audit-fingerprints/`,
  which the fingerprint hook anchors on `--git-common-dir`), the REA evidence bundles
  (`$MAIN/.claude/war/evidence/<plan-slug>/`), and all campaign and survey state. The run-root rule
  does not move them.

**Host-guard note.** In a desktop-app worktree session, the host guard refuses an Edit or Write
outside the session's own worktree, and subagents inherit that guard. A run root under the launch
checkout keeps every task worktree, staged script, args file and manifest inside the session's tree,
so worker writes pass it. The same guard can also refuse a git command aimed at a worktree other than
the session's own (for example a refiner's or an auditor's `git -C` into a task worktree or
`_refinery`). If it refuses one, quote the refusal in the phase report and file it: the fallback is to
launch from the main checkout. A record directory under `$MAIN/.claude/war/audit-fingerprints/` (a
Lead probe, a finished seat) is removed with
`bash ${CLAUDE_PLUGIN_ROOT}/hooks/audit-tree-fingerprint.sh --prune <name>` (or `--prune --stale`),
never a hand `rm`, which the host rm guard refuses from a worktree session; if the guard refuses the
prune too, run it from a main-checkout session.

## Crash-heal pre-flight (Setup step 2)

Trigger: `git worktree list` shows a leftover `p*-publication` path or the desired working branch
checked out anywhere unexpected.

**Crash-heal pre-flight (before `resolve-working-branch`):** scan `git worktree list` for a leftover `p*-publication` path (a Gate-2 publication worktree a prior crash left behind) or the desired working branch checked out anywhere unexpected — clean ⇒ `bash ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/provision-worktrees.sh remove-publication-worktree <path>`; dirty ⇒ escalate to the operator. A leaked publication checkout would otherwise make `resolve-working-branch` see a collision and silently fork a fresh `dev/<date>-<slug>` branch (the silent-campaign-fork hazard). 

## `--afk` sanity floor (Setup step 3 — test-floor proposal)

Trigger: an `--afk` run is about to take the proposed test-floor glob set.

*In-place amendment (2026-08-15, #1343 finding 1): the residual backstop sentence below was narrowed —
this block is no longer byte-identical to its pre-eviction SKILL.md text (see the header caveat).*

     - **`--afk` sanity floor.** Take the proposal only if **each token matches ≥ 1 existing repo file** (the same `Glob` sample); otherwise fall back to `null` with a ledger note that records the **rejected proposal verbatim** (the full proposed token set) plus its **zero-match tokens** (which tokens matched no file) — this pending-proposal record is exactly what the per-phase launch re-check (below) reads, and adopts once every token matches and the value re-passes the validator's `overrides.testPattern` check. The residual — an over-wide but file-matching pattern that admits a test the gate ignores — has only a narrowed downstream backstop: the post-merge gate-audit **`execution-evidence`** **HARD** catch holds only where the captured gate log enumerates test file paths (the `.test.sh` half); for a pattern admitting a non-`.test.sh` file the gate ignores, the mapped-path grep is **SOFT** cannot-confirm — so the **≥ 1-file sanity floor** plus the **floor ⊆ gate** discipline is the operative guard.

## Per-phase pending-proposal re-check (phase launch)

Trigger: at a phase launch, the ledger carries a pending rejected `testPattern` proposal (the `--afk`
sanity floor's fallback note) and the value to thread is still `null`.

**Per-phase pending-proposal re-check.** `overrides.testPattern` is **per-phase-resolved**, not decided once at Setup and pinned unchanged for the run: before threading it, when the ledger carries a **pending rejected proposal** (the `--afk` sanity floor's fallback note, above) **and** the value to thread is still `null`, re-run the sanity floor's own rule — **each token matches ≥ 1 existing repo file** (the same `Glob` sample) — against the **current** tree. Every token now matching ⇒ before adopting, **re-assert the validator's full `overrides.testPattern` check** — the glob-safe charset rule `war-config.mjs`'s `validate()` enforces (only `[A-Za-z0-9_.*?/[] -]`; no quotes, `;`, backticks, `$`, or newlines; non-empty) together with its per-token glob-**shape** checks, all surfaced by one run with one non-zero exit — against the proposal string, e.g. `node ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/war-config.mjs --stdin` on `{"overrides":{"testPattern":"<proposal>"}}`: the proposal never rode that key while rejected, so `validate()` never saw it, and it is about to be embedded single-quoted into agent shell lines — the exact surface the guard exists for. Validator-clean ⇒ **adopt** the proposal as this and every subsequent phase's `plan.testPattern`, appending an **adoption note** to the ledger. Validator-**failing** (any error — charset or per-token shape) ⇒ the proposal is **never** adopted — the ledger note records the failure and **closes** the proposal (a validator violation is a property of the proposal string, not the tree — it cannot self-heal, so it is never re-checked again). Not every token matching ⇒ keep `null`; the proposal stays pending for the next phase launch. Adoption is **monotonic** (`null` → the Setup proposal, once) — never a freshly minted pattern, never a revocation, and never a new interactive ask; scoped entirely to the `--afk` sanity-floor fallback path (interactive Setup has no mechanical rejection to re-check). Like every other ledger note, this one is a **lagging record, not a resume authority** (git > labels > ledger, ADR 0008). 
