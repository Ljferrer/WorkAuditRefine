---
name: adr-sweep-prose-copied-from-a-commit-body-names-the-test-not-the-ruling
description: ADR prose lifted from a commit body can name the pinning test instead of the ruling and leave a skip clause unowned
metadata:
  node_type: memory
  type: project
  keywords:
    - ADR decision log gloss
    - commit message wording
    - ruling vs mechanism
    - polish sweep
    - skip clause owner
    - predicate arms skip
    - DERIVED_AT_REA
    - absorb finding converges
    - five seats same finding
    - under-attribution
    - hook fails closed
    - security misread
  provenance: agent-unverified
  slug: adr-sweep-prose-copied-from-a-commit-body-names-the-test-not-the-ruling
  phase: "2026-10-20-rea-artifact-evidence/phase-4 (p4-polish, servitor)"
  tags:
    - war
    - adr
    - doc-truth
    - polish
    - audit-noise
  created: 2026-10-22
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-22T17:12:24.310Z
---

# ADR prose copied from a commit body names the test, not the ruling

Audit finding resolved in a fix round before land. Recorded as a pattern, not a live instance. The landed ADR carries the corrected wording.

## What happened

The phase-4 polish task carried one operator-ratified row: ADR 0053 records the 2026-10-21 rulings. Its first draft copied the wording of the implementing commit (779028d9). Five audit seats then found the same three defects in one round. Each was disposed `absorb` and `autoFixable`. The second polish round fixed them. One terminal seat approved the result.

1. **A skip clause had no owner.** A Sharp-edge sentence read "The predicate arms skip off the pinned derivation version". It sat right after a sentence about the hook. A reader could take it to mean the hook relaxes. The arms that skip belong to `skills/war/assets/evidence-card-allowlist.test.mjs`, gated by `DERIVED_AT_REA`. The hook still fails closed. One seat rated this Minor as a security misread.
2. **A warning surface was dropped.** The same sentence named the Lead's launch warning and not war-room's. The ruling (#2403) says both print one loud line.
3. **A decision-log gloss named the mechanism.** The #2405 gloss read "the war-room decline rule pinned by presence". That phrase says how `skills/war-room/assets/evidence-presence.test.mjs` guards the rule. It does not say the rule: declining the war-room evidence offer turns `run.evidence` off. The other glosses in the same row state their ruling.

## Why it recurs

A commit body is written from the implementer's view. It names the test that pins a behavior, because that is what the author just wrote. An ADR reader needs the decision and the owner of each behavior. Copying the body moves the implementer's shorthand into a record that other people use to judge the system.

## How to apply

- When a sweep records a ruling, write each gloss from the ruling's own row. Say what was decided. Name the test only as the guard, in a second clause.
- Name the owner of every skip, deny or warn clause in the same sentence: the hook, the test, war-room or the Lead.
- Read each sentence that sits next to guard prose and ask whether it can be read as loosening the guard.
- Count the surfaces that carry a warning. Name all of them, or cite the ruling by number and name none.
- Five seats finding one sentence is a strong signal that the wording is wrong, not that the seats are noisy. Fix it in the next round.

Related: [[adr-policy-table-entry-vs-mechanism-attribution]] (an ADR row that lags the mechanism, same reader trap), [[evidence-mcp-hook-checks-tool-names-only-so-foreign-server-suffix-and-output-directory-writes-pass]] (item 3 states which arms skip and why).

## Locate-cue (verify still present before acting)

`skills/war/assets/evidence-card-allowlist.test.mjs`, search `const DERIVED_AT_REA` and `function locateAtPinnedVersion`. `skills/war-room/assets/evidence-presence.test.mjs`, search `the war-room audit.roster row pins the decline rule`. `docs/adr/0053-rea-artifact-evidence-source.md`, the second Sharp edge under `## Consequences` and the 2026-10-21 row under `## Decision log`. Found at the phase-4 integration tip 6277998a, read through the run's `_refinery` worktree (second parent of landed tip c2e4b1c5, tree equal by ancestry, not read directly). The defect text itself is not at the tip. The three defects come from the audit log, so this file stays `agent-unverified`.

> archived 2026-10-30: resolved — moved to archive
