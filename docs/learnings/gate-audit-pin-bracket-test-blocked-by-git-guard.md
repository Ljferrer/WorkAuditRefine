---
name: gate-audit-pin-bracket-test-blocked-by-git-guard
description: "Pin blocker FIXED; keep decoy-sha recovery tips"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  phase: dead-phase-halt/t1 + 30 recurrences (through diagnosis-preflight-self-confound-gate/p1t1)
  date: 2026-06-30
  updated: 2026-07-07
  keywords:
    - gate-audit pin mismatch
    - rev-parse HEAD differs from gateHeadSha
    - ancestor check benign forward advance
    - stacked task landed on top
    - SOFT not a land-halt
    - mapped-file byte-identity diff
  tags:
    - gate-audit
    - pin-confirmation
    - git-guard
    - tooling
  originSessionId: fa4a98d9-e917-4fc2-8838-f98e4a473a1a
---

# Gate-audit bracket pin test blocked by git guard — FIXED; decoy-sha recovery catalogue survives

**Was:** the gate-audit prompt mandated `[ "$(git -C <refinery> rev-parse HEAD)" = "<gateHeadSha>" ]`,
which the auditor's read-only git guard denied on two grounds (`-C` not allowlisted; bracket/`$()` chars
forbidden), so the pin could never run in-seat. 20+ confirmed instances, always SOFT, never a land-halt.

**Fixed end-to-end:** the guard peels a leading `-C <path>` (the `-C\ *)` arm in
`hooks/validate-auditor-git.sh`); the gate-audit prompt in `skills/war/assets/workflow-template.js`
now emits a `git -C ${refineryPath} cat-file -t ${gateHeadSha}` existence check followed by the bare
`git -C ${refineryPath} rev-parse HEAD` comparison (no brackets/`$()`); and the `pinOrSentinel()`
helper collapses malformed gateHeadSha values to a sentinel at both copy sites. Scope boundaries
(no verb widening, `git fetch` tracked as #310): [[guard-c-peel-resolves-pin-blocker-but-scoped-to-read-verbs-only]].

**Surviving recovery catalogue** (for a desynced seat where the pin still cannot be confirmed):
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
  as grounding rather than re-running the gate (target-repo-agnostic-execution/p3t1, 2026-07-07: diff touched
  only 3 unrelated docs files, none of the task's 4 mapped files; diagnosis-preflight-self-confound-gate/p1t1,
  2026-07-07: the sole intervening commit touched only `CLAUDE.md`, `CONTEXT.md`, and a new ADR file, none of
  p1t1's mapped `skills/red-team/diagnosis-preflight.test.sh` — mapped test confirmed present and non-vacuous,
  17 assertions, at both the pinned and current sha; graded Minor/note, not a land-halt).

**Recurrences (30+, through diagnosis-preflight-self-confound-gate/p1t1, 2026-07-07):** a stale pin is
near-guaranteed once >= 2 tasks land in sequence on one integration branch — each task's gate
necessarily runs before its siblings' follow-on commits land. Every observed mismatch resolved as
benign forward advance via the ancestor check, with the mapped test content re-verified at the true
tip by direct read; reach for `merge-base --is-ancestor` immediately, never treat a sha mismatch as
a stop-the-line signal.

**Why:** pin-confirmation mismatches are almost always seat/bookkeeping artifacts, not code regressions.
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
