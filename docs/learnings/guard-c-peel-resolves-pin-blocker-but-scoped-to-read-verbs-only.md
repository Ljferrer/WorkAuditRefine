---
name: guard-c-peel-resolves-pin-blocker-but-scoped-to-read-verbs-only
description: "-C peel landed; verb allowlist unwidened, no fetch"
metadata:
  node_type: memory
  type: project
  keywords: [git -C flag, readonly allowlist, cwd relocation, fetch excluded, auditor hook, injection defense, single-shot]
  provenance: code-verified
  slug: guard-c-peel-resolves-pin-blocker-but-scoped-to-read-verbs-only
  phase: auditor-git-guard-readonly-c-flag/phase-1-t1 (#222)
  date: 2026-06-30
  tags:
    - gate-audit
    - pin-confirmation
    - git-guard
    - validate-auditor-git.sh
    - scope-boundary
  related:
    - gate-audit-pin-bracket-test-blocked-by-git-guard
    - printf-json-escaping-vacuous-test-case
    - plan-line-number-refs-stale-use-construct-locator
  originSessionId: 1bd064e5-a8af-4b1f-91d5-638887067351
---

# `-C <path>` peel in the auditor git-guard: read verbs only

Rule: the guard peels exactly ONE leading global `-C <path>`, then the peeled command re-enters the existing read-only subcommand allowlist UNCHANGED. Two deliberate scope boundaries — do not over-widen on a future touch:

1. Verb allowlist NOT widened — `git -C <path> commit` still denies (H3).
2. `git fetch` deliberately excluded (writes `.git` / hits network); tracked separately as #310.

Edge (H6, intentional): `git -C -C rev-parse HEAD` peels the first `-C`, the path-drop eats the second → ALLOW (harmless read in ambient cwd). The bracket/`$()`/quote char-denial is untouched (H5 preserves the C5 injection defense); the pin blocker was resolved by prompting the bare print-and-compare form instead — see [[gate-audit-pin-bracket-test-blocked-by-git-guard]].

Fixed/landed in the `-C` peel `case` block of `hooks/validate-auditor-git.sh` (code-verified on master).

**Why:** `-C` only relocates cwd; treating its support as verb-widening reopens the write-path hole the guard exists to close.
**How to apply:** when touching this guard, keep the peel single-shot and the allowlist unmodified; build embedded-quote deny tests with `jq -nc --arg` per [[printf-json-escaping-vacuous-test-case]]; anchor by construct per [[plan-line-number-refs-stale-use-construct-locator]].
