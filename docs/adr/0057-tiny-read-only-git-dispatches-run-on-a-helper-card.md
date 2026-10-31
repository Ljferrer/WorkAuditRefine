# Tiny read-only Git dispatches run on a helper card at haiku

**Status:** accepted (operator ruling of 2026-10-30 on issue #2497)

Issue #2497 found that `audit-pin` and `diff-probe` dispatches run a median of two tool calls yet
use 78k to 80k API tokens each, excluding cache reads. The cause is the context these dispatches
load, not their work. `agents/war-refiner.md` has no `tools:` line, so every refiner dispatch also
loads the full tool list. The analysis advised changing context and model in separate trials. The
operator ruled to make both changes together.

## Decision

**A new `war-helper` card runs these two dispatches.** Its `tools:` line holds Bash alone, and its
body is about 1 KB. It carries no refiner doctrine.

**The helper defaults to haiku at low effort.** `agents.helper` sets the tier. It is not a phase
role, and every preset inherits it. A config without the key spawns haiku through `ROLE_MODEL`.

**The auditor git guard also confines the helper.** `validate-auditor-git.sh` allows one read-only
git command with no shell syntax. The dispatched prompts therefore spell their commands in forms
the guard admits: `<rev>^0` in place of `<rev>^{commit}`, and `<base>...<tip>` in place of a
`$(git merge-base ...)` substitution. Each new spelling resolves the same object or range.

**A word the guard cannot pass bare routes that one dispatch to the refiner.** A worktree path with
a space needs quotes, and the helper card's no-shell-syntax rule denies them (the guard itself admits a
quoted value since ADR 0029 Amendment 2026-10-30). `helperOpts` checks the words before dispatch,
and the prompt quotes them on that arm through `shq`, so these repos run at the old cost. The repeat `audit-pin` lookup stays on the recovery
refiner tier.

## Consequences

The engine cannot prove that a helper reports Git truthfully. It checks SHA shape, and for pins it
checks that a resolved SHA starts with the reported value. This is the same check a refiner had.
The operator accepted this risk.

Merges, lands, `ace-gate`, `ace-revert`, provisioning and recovery stay on the refiner. Snapshot
and confirm dispatches also stay there, because they need `ls-remote` and other verbs the guard
denies.

One run cannot separate the context saving from the model saving. Compare the token use of these
two dispatches with the #2497 baseline as one combined change.
