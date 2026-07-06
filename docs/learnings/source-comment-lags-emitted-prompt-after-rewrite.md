---
name: source-comment-lags-emitted-prompt-after-rewrite
description: Comments lag rewritten code; grep old terms same diff
metadata: 
  node_type: memory
  slug: source-comment-lags-emitted-prompt-after-rewrite
  phase: F03/p1-t1 + submodule-inc2/T2 + servitor-provenance-gate-robustness/t1
  type: project
  keywords: [stale comment, JSDoc drift, code doc mismatch, behavior rewrite sweep, silent documentation debt, old term grep]
  provenance: agent-unverified
  severity: Minor
  tags: 
    - documentation
    - auditor
    - workflow-template
    - baseline-model
    - gate-design
  relates:
    - "[[yaml-extraction-indent-coupling-in-shell-gate]]"
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Source comment lags emitted prompt after rewrite

**Rule:** when a rewrite changes what a function emits or what a regex/token matches, grep the file header, JSDoc, and the surrounding ~5 lines for comments naming the old behavior in concrete terms (a literal indent count, a literal value, an old approach) and update them in the same diff. Tests assert emitted output, never comments — a stale comment survives green and invites a future "fix" back to the old model. Do not rely on an issue's named diff scope to catch a comment that fell just outside it.

All 3 recorded instances fixed in the live repo (3 independent recurrences — a real pattern): the `auditPrompt` header in `skills/war/assets/workflow-template.js` (now states the three-dot model, see [[audit-baseline-must-pin-integration-branch-not-main-checkout]]), the awk-collect comment in `skills/war/assets/assert-no-submodule-mutation.sh` ("use read with IFS" removed), and the locator comment in `hooks/validate-servitor-provenance.sh` (now "any leading whitespace", see [[yaml-extraction-indent-coupling-in-shell-gate]]).

**Why:** comment drift is silent documentation debt with zero test coverage.

**How to apply:** after any behavior-changing rewrite, grep the same file for the old behavior's concrete terms before committing.
