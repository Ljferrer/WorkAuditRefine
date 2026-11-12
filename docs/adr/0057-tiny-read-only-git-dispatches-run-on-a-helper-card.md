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
git command with no shell syntax beyond quoted values at admitted token positions (ADR 0029 (2026-10-30), its Decision 5), and its helper arm also admits one pipe between two git commands (Decision log 2026-11-10). The dispatched prompts therefore spell their commands in forms
the guard admits: `<rev>^0` in place of `<rev>^{commit}`, and `<base>...<tip>` in place of a
`$(git merge-base ...)` substitution. Each new spelling resolves the same object or range.

**A word the guard cannot pass bare routes that one dispatch to the refiner.** A worktree path with
a space needs quotes, and the helper card's no-shell-syntax rule denies them (the guard itself admits a
quoted value since ADR 0029 (2026-10-30), its Decision 5). `helperOpts` checks the words before dispatch,
and the prompt quotes them on that arm through `shq`, so these repos run at the old cost. The repeat `audit-pin` lookup stays on the recovery
refiner tier.

## Consequences

The engine cannot prove that a helper reports Git truthfully. It checks SHA shape, and for pins it
checks that a resolved SHA starts with the reported value. This is the same check a refiner had.
The operator accepted this risk.

Merges, lands, `ace-gate`, `ace-revert`, provisioning and recovery stay on the refiner. The five
Git relays (`merge-snapshot`, `pin-snapshot`, `merge-confirm`, `pin-confirm` and `tip-probe`) run
on the helper under its own guard arm, which admits `ls-remote`, `rev-list`, `patch-id`,
`hash-object`, `cherry` and one pipe between two git commands. A relay's repeat attempt and a word
the helper cannot pass bare stay on the refiner.

One run cannot separate the context saving from the model saving. Compare the token use of these
two dispatches with the #2497 baseline as one combined change.

[ADR 0060](0060-enforce-each-rule-at-the-highest-level-that-can-express-it.md) ranks the enforcement
levels this card relies on, and plans the move of the snapshot, confirm, pin and tip-probe relays here.

## Decision log

- 2026-11-10 · the five Git relays move to the helper on their first attempt; each moved prompt spells only commands the helper arm admits and inlines the Exact Git diff identity command without its `set -o pipefail` line; a null for a 40-hex request value is a malformed reply in the relays and in `audit-pin`, so a 40-hex value that names no commit now costs one re-dispatch and then takes the dropped-seat arm · issues #2784, #2497 (plan 2026-11-08-model-routing-and-prompt-byte-budgets, Task 5.3)
- 2026-11-11 · the ADR 0029 citations name its folded Decision 5 in the dated form · #1850 (ADR 0063)
