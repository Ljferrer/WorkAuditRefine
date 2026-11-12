---
name: a-sentence-splitting-prose-pass-changes-rules-and-claims-false-freeze-reasons
description: "A sentence-splitting prose pass can change a rule, add a count word, or claim a false freeze"
metadata:
  node_type: memory
  type: project
  keywords:
    - vale
    - prose pass
    - sentence split
    - meaning drift
    - freeze reason
    - count word
    - no behavior change
    - mirrored verbatim
  provenance: code-verified
  slug: a-sentence-splitting-prose-pass-changes-rules-and-claims-false-freeze-reasons
  phase: 2026-11-08-doc-truth-drift-and-adr-hygiene/phase-4 (tasks 4.1 to 4.6)
  tags:
    - prose
    - docs
    - audit
  created: 2026-11-12
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-12T22:26:28.085Z
---

**Pattern (agent-unverified).** Audit findings resolved in fix rounds before land, recorded as pattern, not live instance.
Splitting long sentences to meet a 25-word limit changed doctrine in five ways across the phase.
- A conditional trigger ("If X cannot be made true, file a finding") became a possibility ("X may not be made true. Then file"). A seat could then act on suspicion.
- A qualifier became the claim ("a ref that fails the gate and lands in this bucket" became "a ref that fails the gate lands in this bucket"). The paragraph then contradicted the bullets below it.
- A scope phrase fell out ("every fact in that doc" became "every fact"), so a doc-local duty read as repo-wide.
- A joint guarantee ("the tool restriction plus the guard guarantee X") became one leg plus a backup.
- New snapshot count words appeared ("Three edits", "one of three tags", "Three seats"). One count was already false, and they rot with the next addition.
An ace fix of one twin sentence also missed the same defect in its sibling file. Sweep every twin when you fix one.

**Review rule.** For each split sentence, ask: is a condition still a condition, is each qualifier still a qualifier, and is each scope still stated?
Reject any new count word the original text did not carry.

**Live instance: a false freeze reason (code-verified).** Task 4.3 left the findings in `skills/war/references/file-followups.md` unsplit as "mirrored verbatim in the dispatched prompt".
That is false for the "Ruled-ask filing parity" paragraph. `skills/war/assets/workflow-template.js` holds only a code comment that names filing parity, no prompt twin.
A seat caught it as a Major late defect. The phase already held on task 4.5, so the late-fix pass never ran, and the paragraph shipped unsplit.
Before you freeze a block as mirrored or pinned, grep the engine and the tests for the twin. A file header that says "evicted" is not a byte-identity claim.

**Locate-cue.** At the phase-4 landed tip a5a30fe5 (rung 2, the run-scoped `_refinery` worktree), the "Ruled-ask filing parity" paragraph was still one unsplit paragraph. Verify still present before acting.
Related: [[a-hard-end-state-whose-observable-needs-a-non-git-tool-has-no-seat-that-can-judge-it]], [[release-blurb-headline-count-word-can-mismatch-its-own-enumeration]].
