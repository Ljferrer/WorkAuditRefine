---
name: audit-gate-anti-cheat-spine-pin-equality-benign-advance-verdict-hard
description: "Pattern: pin-equality gate + benign-advance floor + verdict-as-HARD, reusing existing reason codes instead of widening enums"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: 
    - gate-pin-status
    - pin-equality
    - benign-advance
    - stale-mismatch
    - verdict escalate
    - gate-evidence
    - HARD_ESCALATION_REASONS
    - mapped files
    - first-parent
    - anti-cheat
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

# Pattern: deterministic anti-cheat spine — pin-equality, benign-advance, verdict-as-second-HARD-trigger

Phase 1 of `audit-gate-verdict-fidelity` moved three previously-prose anti-cheat checks into Node/shell:

1. **Pin-equality gate (`gate-pin-status.sh`, `pinMismatch()`).** A seat's returned `audit_sha` is compared against its dispatched pin. Four outcomes, never collapsed: CONFIRMED (equal, exit 0), BENIGN-ADVANCE (descendant + none of the task's own `--mapped` files touched in the intervening range, exit 0), STALE-MISMATCH (a mapped file changed or not an ancestor, exit 1), git/ref error (exit 2, never folded into exit 1). The **key discriminator for BENIGN-ADVANCE is "none of the task's OWN changed files touched"** — not "no files changed at all" — so sibling-task commits landing after a seat's pin are provably benign to THAT seat's own claim.

2. **`--mapped`-scoped benign-advance, not repo-wide.** The floor takes an explicit `--mapped <file-list>` of the task's own changed files and only inspects those against the intervening commit range (verify still present before acting — found at `skills/war/assets/gate-pin-status.sh`, invoked with `--mapped` @ phase audit-gate-verdict-fidelity/t1.1). A repo-wide diff would false-flag every gate-audit as stale the moment ANY sibling task lands — the mapped-file scoping is what makes benign-advance usable in a serial merge queue where the tip moves between every task's audit and the final gate-audit re-run.

3. **Verdict-as-second-HARD-trigger via reused reason code, no enum widening.** `isHardGateEvidence` (and the end-state seat's `isHard`) fires on `verdict === 'escalate'` OR any Critical/Major finding — a finding-LESS escalate verdict now also holds the land. This reuses the *existing* `gate-evidence` reason in `HARD_ESCALATION_REASONS`; **no new member was added** to that canonical array (ADR 0005 — the array is hand-mirrored between `land-decision.mjs` and `workflow-template.js` and both copies must move together with a drift-guard test). Verified: `isHardGateEvidence` at `skills/war/assets/workflow-template.js` line 1100-1101 @ phase audit-gate-verdict-fidelity/t1.3.

**Reusable takeaway for future gate/floor work:** when a new HARD-triggering condition is needed, check whether it can ride an *existing* member of a canonical hand-mirrored enum (here `gate-evidence`) before adding a new one — new members require touching both mirrors + the drift-guard test in the same commit, while reusing an existing reason is a same-day, single-surface change.

[[gate-audit-pin-bracket-test-blocked-by-git-guard]]
[[audit-worktree-pre-impl-tip-stale-verdict]]
