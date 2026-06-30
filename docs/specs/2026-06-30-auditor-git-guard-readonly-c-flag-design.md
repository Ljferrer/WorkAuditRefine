# Auditor git-guard blocks its own pin test: teach the guard read-only `git -C <path>`, reword the prompt off the bracket form

**Status:** proposed — targets **v0.7.11** (tooling-guard). **Severity: MEDIUM.**
**Source:** issue #222. Memory: `gate-audit-pin-bracket-test-blocked-by-git-guard`, `audit-worktree-pre-impl-tip-stale-verdict`, `auditor-cannot-execute-the-tests-it-must-verify-pass`.
Group: standalone (Group 3). Stacks after Groups 1/2 — the guard file `validate-auditor-git.sh` and the gate-audit pin region (`workflow-template.js` ~L451-452) are disjoint from the land block (~L518) and the no-test loop (~L329-422). Live repo is v0.7.7; landOrder 4.

## Problem

The post-merge gate-audit prompt orders the read-only auditor to confirm its worktree is at the integration tip *by running an exact command*: the [gate-audit pin "bracket test"](../../skills/war/assets/workflow-template.js) prompt mandates

```
[ "$(git -C ${refineryPath} rev-parse HEAD)" = "${gateHeadSha}" ]
```

But the auditor runs under [`validate-auditor-git.sh`](../../hooks/validate-auditor-git.sh), a deliberately fail-closed read-only Bash guard, which denies that command on **two independent grounds**:

1. **Char allowlist.** The [residue check](../../hooks/validate-auditor-git.sh) (`tr -d 'A-Za-z0-9 ./_=:,@^-'` → `[ -n "$residue" ] && deny`) permits none of `$ ( ) [ ] "`. The `$(...)`, the brackets, and the quotes all trip the residue deny — the *same* path test [`C5: git log $(evil) → denied (subst)`](../../hooks/validate-auditor-git.test.sh) exercises as the command-substitution injection defense this guard exists to enforce.
2. **`-C` is orphaned.** Even a hypothetically char-clean `git -C <path> rev-parse HEAD` would still fail: the [global-flag deny block](../../hooks/validate-auditor-git.sh) (`-c`, `--output`, `--paginate`, `--no-pager`, `--pager=`, leading `-p`) has **no `-C` arm**, and the [subcommand extractor](../../hooks/validate-auditor-git.sh) (`diff|log|show|merge-base|rev-parse|status|ls-files|cat-file|blame`) has none either — so `rest` beginning `-C ...` falls to the `*)` default, which mis-reports `-C` as the subcommand and denies. No test asserts `-C` behavior either way.

Net effect: the in-seat pin test **always exits non-zero**, which the prompt's [stale-tip SOFT-downgrade fallback](../../skills/war/assets/workflow-template.js) (L458-461) reads as "cannot confirm the pin" → every gate-audit downgrades a would-be HARD execution-evidence finding to a SOFT note. The guard is working as designed; the prompt asks for a shape the guard is built to forbid. The recurring SOFT Nit is the symptom (memory: `gate-audit-pin-bracket-test-blocked-by-git-guard`); the stale-tip false-negative class it exists to defuse is `audit-worktree-pre-impl-tip-stale-verdict`; the structural reason the auditor can't just run the gate itself is `auditor-cannot-execute-the-tests-it-must-verify-pass`.

## Decisions

| # | Decision | Choice | Rejected alternative |
|---|----------|--------|----------------------|
| 1 | How to make the pin test runnable | **Teach the guard the read-only `-C <path>` global flag**: before subcommand extraction, peel a leading `-C <path>` token off `$rest`, then re-enter normal subcommand validation. A confined `git -C <_refinery> rev-parse HEAD` is then ALLOWED (the char allowlist already permits `-C`, `/`, `.`). | Permit the literal bracket/`$()` form (issue's surface wording) — reopens the C5 command-substitution injection vector; **explicitly rejected**. |
| 2 | Keep `-C` from widening the verb allowlist | **`-C <path>` only relocates the cwd; the peeled `$rest` re-runs the existing subcommand allowlist unchanged.** A write subcommand after `-C` still denies. | Special-case `-C rev-parse` only (too narrow; `-C` is generically read-safe for the read verbs and the auditor also reads via `git -C <path> show`). |
| 3 | Reword the dispatched prompt | **Replace the bracket test with the bare, no-substitution two-step the guard now permits**: instruct the auditor to run `git -C ${refineryPath} rev-parse HEAD` and compare the printed sha to `${gateHeadSha}` itself (the ref-file-walk fallback already documented stays as the no-git escape hatch). | Leave the prompt mandating the bracket form (guard would still deny it). |
| 4 | Scope ceiling | **Convenience/determinism upgrade, not a correctness blocker.** The existing `git show <sha>:<path>` object-store workaround (memory slug) stays valid and needs no guard change; this removes the forced SOFT-downgrade so a genuine provably-unrun test can land as HARD. | Treat as a blocking correctness bug (it isn't — the auditor has a working read path today). |

### Mechanics

**Guard ([`validate-auditor-git.sh`](../../hooks/validate-auditor-git.sh)), one peel before subcommand extraction.** After the global-flag deny block and before the `case "$rest"` subcommand extractor, add:

```sh
# Read-only global -C <path>: relocate cwd, then validate the subcommand normally.
# -C only changes which repo git runs in; it does NOT add a write verb. The peeled
# $rest re-enters the read-only subcommand allowlist below, so a write subcommand
# after -C still denies.
case "$rest" in
  -C\ *)
    rest="${rest#-C }"     # drop "-C "
    rest="${rest#* }"      # drop the <path> token (single path, no spaces — char allowlist forbids them)
    ;;
  -C)
    deny "global -C with no path/subcommand" ;;
esac
```

The single-path assumption holds because the char allowlist already forbids spaces inside a path token via the residue check (a space-containing path can't reach here). Only one `-C` is peeled — a second `-C` would re-route to `*)` default deny in the subcommand extractor, which is correct (the pin test uses exactly one).

**Prompt ([`workflow-template.js`](../../skills/war/assets/workflow-template.js), ~L451-452).** Replace the "run EXACTLY this bracket test" + bracket line with a bare compare the guard allows, e.g.:

```
First confirm your evidence is pinned to the integration tip. Run (read-only git, permitted):
    git -C ${refineryPath} rev-parse HEAD
and compare the printed sha against the gate-HEAD sha ${gateHeadSha}.
Equal ⇒ pin CONFIRMED. Different, or the command cannot run (git unavailable / rev-parse fails) ⇒ you CANNOT confirm the pin.
```

The downstream CONFIRMED / cannot-confirm branches (L453-461), including the SOFT-downgrade rule and the required SOFT-note contents, are unchanged — only the confirmation *mechanism* changes from a guard-denied bracket test to a guard-permitted print-and-compare.

## Affected files

| File | Change |
|------|--------|
| [`hooks/validate-auditor-git.sh`](../../hooks/validate-auditor-git.sh) | Add a `-C <path>` peel (Decision 1/2) before subcommand extraction; re-enter the existing allowlist. |
| [`hooks/validate-auditor-git.test.sh`](../../hooks/validate-auditor-git.test.sh) | Add allow-tests for `git -C <path> rev-parse HEAD` and `git -C <path> show ...`; a deny-test for `git -C <path> commit ...` (proves `-C` does not widen the verb allowlist); a deny-test for `git -C` with no path. C5 stays — it proves the bracket/`$()` form is still denied. |
| [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) | Reword the gate-audit pin prompt (~L451-452) from the bracket test to the bare `git -C … rev-parse HEAD` print-and-compare (Decision 3). |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (×2), `README.md` `## Status` | Version bump to **0.7.11** (see version-serialization rule below). |

## Alternatives considered

- **Permit the literal bracket/`$()` form (issue's surface phrasing).** Rejected — allowing `$()`/`[]`/`"` reopens the C5 command-substitution injection vector the guard exists to close. The `-C` half of the issue's suggestion is the correct and sufficient fix.
- **Status quo (keep the SOFT-downgrade).** Rejected — the in-seat pin test never passes, so every gate-audit forfeits its ability to record a genuinely provably-unrun mapped test as HARD; the downgrade is forced, not earned.
- **Drop the in-seat pin entirely, rely only on `git show <sha>:<path>`.** Rejected — the object-store workaround proves file *content* at a sha but not that the *current worktree HEAD* equals the gate-HEAD; the pin is the cheaper, more direct confirmation, and is what the prompt's branch logic is built around.
- **Broaden the char allowlist to admit `$()[]`.** Rejected — same injection regression as the bracket alternative; the char allowlist is the guard's primary defense.

## Validation criteria

1. **(#222 — guard allows the pin)** `bash hooks/validate-auditor-git.test.sh` passes with a new allow-case asserting `git -C /abs/path/_refinery rev-parse HEAD` exits 0, and a new allow-case for `git -C /abs/path show HEAD:file.txt` exits 0.
2. **(#222 — `-C` does not widen the verb allowlist)** A new deny-case asserts `git -C /abs/path commit -m x` exits 2 with a `WAR:` deny marker (write subcommand after `-C` is still denied), and `git -C` (no path) exits 2 with `WAR:`.
3. **(#222 — injection still denied)** The existing C5 case (`git log $(evil) → denied (subst)`) and a parity case asserting the old bracket form `[ "$(git -C <path> rev-parse HEAD)" = "<sha>" ]` still exit 2 with `WAR:` — proving the reword does not relax injection defense.
4. **(#222 — prompt reworded)** `skills/war/assets/workflow-template.js` no longer contains the substring `[ "$(git -C` in the gate-audit prompt; it emits `git -C ${refineryPath} rev-parse HEAD` as a bare command, and the CONFIRMED / cannot-confirm SOFT-downgrade branches remain present and unchanged in semantics.
5. **(gate)** Full suite green at the release commit: `node --test "skills/**/*.test.mjs"` plus all 12 `*.test.sh` runners (including `validate-auditor-git.test.sh`). Run ALL runners post-merge — a cross-branch merge can add runners the bare `node --test` glob misses (memory: `gate-under-covers-after-cross-branch-merge-new-runner`).

## Open risks / non-goals

- **Non-goal:** changing the SOFT-downgrade *policy* (when a cannot-confirm becomes SOFT). Only the confirmation mechanism changes; the stale-tip defusing rule stays.
- **Non-goal:** the structural `auditor-cannot-execute-the-tests-it-must-verify-pass` gap (auditor can't run tests). Out of scope here — this only fixes the pin-confirmation read path.
- **Risk:** the `-C` peel assumes a single space-free path token. The char allowlist guarantees no spaces reach the peel; documented inline. A pathological `git -C -C rev-parse` peels one `-C` then the second routes to `*)` default deny — safe.

## Coverage

| Issue | Decisions | Validation |
|-------|-----------|------------|
| #222  | 1, 2, 3, 4 | 1, 2, 3, 4 |

**Version-serialization rule:** v0.7.11 replaces the four canonical version slots in one bump — `plugin.json` `version`, `marketplace.json` `metadata.version` **and** `plugins[0].version` (two slots), and the `README.md` `## Status` line (replace-in-place, not append). Lands serially on the prior group's landed tip (landOrder 4); no badge.
