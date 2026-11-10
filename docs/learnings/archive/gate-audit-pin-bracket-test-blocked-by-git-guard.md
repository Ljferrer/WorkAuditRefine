---
name: gate-audit-pin-bracket-test-blocked-by-git-guard
description: "A gate-audit pin mismatch is almost always benign forward advance: check cat-file, then merge-base --is-ancestor, then read content, and grade SOFT"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: gate-audit-pin-bracket-test-blocked-by-git-guard
  phase: dead-phase-halt/t1 + 31 recurrences (through fail-loud-ingest-boundaries/t1)
  date: 2026-06-30
  updated: 2026-07-08
  keywords:
    - gate-audit pin mismatch
    - rev-parse HEAD differs from gateHeadSha
    - ancestor check benign forward advance
    - stacked task landed on top
    - SOFT not a land-halt
    - mapped-file byte-identity diff
    - file-disjoint sibling task advanced tip
  tags:
    - gate-audit
    - pin-confirmation
    - git-guard
    - tooling
  originSessionId: fa4a98d9-e917-4fc2-8838-f98e4a473a1a
---

# Gate-audit pin mismatch: recover with the ancestor check and grade SOFT

**Rule:** a gate-audit pin mismatch (`rev-parse HEAD` differs from `gateHeadSha`) is almost always a
seat or bookkeeping artifact, not a code regression. Reach for `git merge-base --is-ancestor`
immediately, and grade SOFT. Never treat a sha mismatch as a stop-the-line signal.

The original blocker (the auditor git guard denying the bracket pin test) is fixed; for its scope
boundaries see [[guard-c-peel-resolves-pin-blocker-but-scoped-to-read-verbs-only]].

**Recovery catalogue** (for a desynced seat where the pin still cannot be confirmed):
- Object-store read: `git show <sha>:<path>` crosses worktrees; closes content-presence at the exact sha.
- Ref-file walk: read the worktree `.git` pointer → `.git/worktrees/<name>/HEAD` → `refs/heads/<branch>` (pure Read tool, no git).
- `git rev-parse <branch-name>` (allowlisted, no `-C`) resolves a named branch tip for sha-equality checks.
- Ancestor check: `git merge-base --is-ancestor` — forward divergence (gate at parent/base of tip) is benign → SOFT.
- Decoy shas: a bare cwd `rev-parse HEAD` can equal a sha visible elsewhere in the gate log (FF base, rebase base,
  or direct parent of gateHeadSha) — cross-check the source line before treating it as any confirmation;
  occasionally the cwd IS the tip and closes the pin directly.
- Malformed sha: run `git cat-file -t <gateHeadSha>` FIRST — a non-resolvable/repeating-tail sha is Lead-side
  bookkeeping breakage (flag it back), not a stale-but-real decoy.
- requiresTest:false tasks (esp. release bumps) make the HARD provably-unrun path structurally unavailable → SOFT ceiling.
- An auditor rationale claiming "the landed fix is absent" may itself be on a stale seat — verify against the real
  landed tip first ([[land-local-follower-ref-can-lag-sync-before-next-phase]], [[audit-worktree-pre-impl-tip-stale-verdict]]).
- Mapped-file byte-identity diff: `git diff <gateHeadSha>..<observedHead> --stat` (or `--name-only`) — if the
  task's mapped/plan files appear in **neither** side of the diff, the gate output captured at `gateHeadSha`
  is still reliable for those files even though the seat's HEAD moved on; downgrade to SOFT and cite the diff
  as grounding rather than re-running the gate. Example: the only intervening commit was a file-disjoint
  sibling task that touched none of the task's mapped files.

**Recurrences:** 31+ through fail-loud-ingest-boundaries/t1 (2026-07-08); a stale pin is near-guaranteed once
two or more tasks land in sequence on one integration branch, and every one resolved as benign forward advance.

**Why:** each task's gate necessarily runs before its siblings' follow-on commits land, so the pin goes stale by construction.
**How to apply:** on any pin mismatch: cat-file existence → ancestor check → object-store content read → grade SOFT.

Related: [[auditor-cannot-execute-the-tests-it-must-verify-pass]],
[[gate-evidence-severity-not-verdict-gates-hard-path]],
[[weak-test-assertion-passes-without-feature-being-exercised]],
[[gate-output-curated-excerpt-obscures-mapped-test-evidence]],
[[retrofit-site-existing-tests-as-regression-guard]],
[[source-comment-lags-emitted-prompt-after-rewrite]],
[[release-status-is-replace-slot-not-empty-field]],
[[release-bump-slots-canonical-no-badge]],
[[drift-guard-extraction-regex-unions-comparisons-with-assignments]]

> archived 2026-07-15: resolved — moved to archive
