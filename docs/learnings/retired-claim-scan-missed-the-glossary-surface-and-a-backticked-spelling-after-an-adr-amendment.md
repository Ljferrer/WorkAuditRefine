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

**Blind spot 1: surface scope (LIVE at land).** The scan skipped `CONTEXT.md`. ADR 0029's own Consequences section names the **Committed-tree grounding** glossary term as the decision's glossary home. Three seats (correctness, cascading-impact, plan-faithfulness) raised it as Minor, absorb, `phaseClose: true`. The ace fixer put it on its Ignore-for-now list, since `CONTEXT.md` is outside the task's Files. The phase-close polish task `p6-polish` then returned no result (`polish-discarded`, blocked "worker returned no result"), so the queue never drained. At the landed tip the entry still reads "The auditor allowlist is **not** widened — `git grep` stays denied" (found at `CONTEXT.md`, verify still present before acting). No later task's Files list holds `CONTEXT.md`, so the Lead must route it by hand, as in [[polish-worktree-provisioning-death-drains-phase-close-queue-fail-open-lead-must-re-route-by-hand]].

**Blind spot 2: spelling (resolved before land, pattern only).** The first regex, `/git grep stays denied/i`, never matched the card's old bullet `**`git grep` stays denied**`, because a backtick sits between "grep" and "stays". A restored old bullet would have passed. The fix made the backticks optional and added unwired negative-reference samples that must match their own retired-claim regex. The constants are in `skills/war/assets/workflow-template.test.mjs`. Audit finding resolved in a fix round before land, recorded as pattern, not live instance.

**Rule.** When an ADR amendment retires a standing claim:
- Seed the scan's surface list from the ADR's Consequences section, not only from the task's Files.
- Add a history grep of the claim's key phrase over the whole repo (`git log -G`) to find every home.
- Make each retired-claim regex tolerate markdown spelling.
- Prove each regex fires on a sample of the old text.

Related: [[default-flip-must-audit-all-doc-surfaces]], [[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]].
