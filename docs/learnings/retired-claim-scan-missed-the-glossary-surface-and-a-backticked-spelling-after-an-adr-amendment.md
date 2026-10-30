---
name: retired-claim-scan-missed-the-glossary-surface-and-a-backticked-spelling-after-an-adr-amendment
description: A retired-claim scan after an ADR amendment skipped the glossary entry and first missed a backticked spelling of the claim
metadata:
  node_type: memory
  type: project
  keywords:
    - retired claim
    - OLD-absent scan
    - ADR amendment
    - glossary drift
    - CONTEXT.md
    - git grep stays denied
    - doesNotMatch
    - backtick regex
    - negative-reference sample
    - stale doc
  provenance: code-verified
  slug: retired-claim-scan-missed-the-glossary-surface-and-a-backticked-spelling-after-an-adr-amendment
  phase: 2026-10-20-rea-artifact-evidence/phase-6 task 6.1
  tags:
    - war
    - doc-truth
    - drift-guard
    - adr
    - phase-close
  created: 2026-10-23
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-23T09:44:37.591Z
---

# An OLD-absent scan has two blind spots: which surfaces it reads, and how the old claim is spelled

**Context.** ADR 0029 Amendment 2026-10-22 (plan D21) superseded "`git grep` stays denied" with the admitted form `git grep -F -e <token>`. Task 6.1 added an OLD-absent scan (`doesNotMatch`) over four surfaces: the auditor card, the dispatched literal, `skills/war/references/auditor-teach.md` and the evidence card.

**Blind spot 1: surface scope (closed by 554e0f22).** The scan skipped `CONTEXT.md`, though ADR 0029's Consequences section names the **Committed-tree grounding** glossary term as the decision's glossary home. Three seats raised it as Minor, absorb, `phaseClose: true`. The polish task then died and the queue never drained, the case in [[polish-worktree-provisioning-death-drains-phase-close-queue-fail-open-lead-must-re-route-by-hand]]. Polish commit 554e0f22 fixed the glossary entry. The scan still lists four surfaces and omits `CONTEXT.md`, so the rule below is not mechanized.

**Blind spot 2: spelling (fixed in a round before land).** The first regex, `/git grep stays denied/i`, never matched the card's old bullet `**`git grep` stays denied**`, because a backtick sits between "grep" and "stays". The fix made the backticks optional and added unwired negative-reference samples that must match their own retired-claim regex. `GIT_GREP_STAYS_DENIED_RETIRED` and `GIT_GREP_RETIRED_SAMPLES` are in `skills/war/assets/workflow-template.test-harness.mjs`. The scan is the D21 block in `skills/war/assets/workflow-template.engine-1.test.mjs`.

**Why:** A `doesNotMatch` proves absence only on the surfaces it reads and in the spelling it matches.

**How to apply:** When an ADR amendment retires a standing claim:
- Seed the scan's surface list from the ADR's Consequences section, not only from the task's Files.
- Add a history grep of the claim's key phrase over the whole repo (`git log -G`) to find every home.
- Make each retired-claim regex tolerate markdown spelling.
- Prove each regex fires on a sample of the old text.

Related: [[default-flip-must-audit-all-doc-surfaces]], [[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]].
