---
name: audit-gate-anti-cheat-spine-pin-equality-benign-advance-verdict-hard
description: "Anti-cheat spine for the gate audit: a pin-equality check plus a benign-advance floor, and the single home of the four pin_status states (only CONFIRMED can carry HARD evidence)"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  keywords:
    - gate-pin-status
    - pin-equality
    - pin_status
    - CONFIRMED
    - benign-advance
    - stale-mismatch
    - ERROR pin_status
    - gate-evidence
    - mapped files
    - first-parent
    - anti-cheat
    - SOFT never hold
  slug: audit-gate-anti-cheat-spine-pin-equality-benign-advance-verdict-hard
  phase: audit-gate-verdict-fidelity/phase-1
  tags:
    - workflow-template
    - gate
    - audit-pipeline
    - pattern
    - adr-0005
  related:
    - gate-audit-pin-bracket-test-blocked-by-git-guard
    - audit-worktree-pre-impl-tip-stale-verdict
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

# Pattern: deterministic anti-cheat spine — pin-equality and benign-advance

Phase 1 of `audit-gate-verdict-fidelity` moved previously-prose anti-cheat checks into Node/shell.

1. **Pin-equality gate (`gate-pin-status.sh`, `pinMismatch()`).** A seat's returned `audit_sha` is compared against its dispatched pin. The **key discriminator for BENIGN-ADVANCE is "none of the task's OWN changed files touched"** — not "no files changed at all" — so sibling-task commits landing after a seat's pin are provably benign to THAT seat's own claim.

2. **`--mapped`-scoped benign-advance, not repo-wide.** The floor takes an explicit `--mapped <file-list>` of the task's own changed files and only inspects those against the intervening commit range (verify still present before acting — `skills/war/assets/gate-pin-status.sh`, invoked with `--mapped`). A repo-wide diff would false-flag every gate-audit as stale the moment ANY sibling task lands — the mapped-file scoping is what makes benign-advance usable in a serial merge queue where the tip moves between every task's audit and the final gate-audit re-run.

## The `pin_status` states

This is the single home of the `pin_status` enum. The four outcomes are never collapsed:

- **CONFIRMED** (exit 0): the returned SHA equals the pin. The only state that can carry HARD execution evidence.
- **BENIGN-ADVANCE** (exit 0): the observed HEAD descends from the pin, and the divergence is only in files the task's `--mapped` test does not read. The seat judges the task's own content from `git show <gate-HEAD>:<path>`, never the advanced working tree.
- **STALE-MISMATCH** (exit 1): the divergence touches a mapped file, or the pin is not an ancestor. The very thing in question (does the mapped test still look the way it did at gate time) changed, so committed-tree reads cannot rescue it.
- **ERROR** (exit 2): a git or ref error. Never folded into exit 1. It can surface as the sentinel `(integration_sha unrecorded/malformed)`.

Each non-confirmed state grades SOFT: a Nit or Minor, `disposition: note`, never a land hold. A missing token is SOFT too, for a different reason (nothing to read), and a bare SHA match does not upgrade it to HARD. How a seat handles a missing or unstamped gate log is in [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]].

[[gate-audit-pin-bracket-test-blocked-by-git-guard]]
[[audit-worktree-pre-impl-tip-stale-verdict]]

> archived 2026-07-27: resolved — moved to archive
