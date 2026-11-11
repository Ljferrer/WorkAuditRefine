---
name: release-blurb-that-restates-a-code-comment-inherits-its-overclaim
description: "A blurb restating a code comment copies its overclaim. Fixing it can stale a pin"
metadata:
  node_type: memory
  type: project
  keywords:
    - release blurb
    - CHANGELOG head entry
    - README Status twin
    - universal quantifier
    - header comment lag
    - gate pin STALE-MISMATCH
    - release task ace
    - absorb eligibility
  provenance: agent-unverified
  slug: release-blurb-that-restates-a-code-comment-inherits-its-overclaim
  phase: 2026-10-20-rea-artifact-evidence/phase-8 task 8.2
  tags:
    - war
    - release
    - docs
    - audit
    - prose-precision
  created: 2026-10-26
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-26T21:26:35.260Z
---

# Check the code, not the comment, before a release blurb states what a mechanism does

**Status.** RESOLVED instance (task 8.2 of `2026-10-20-rea-artifact-evidence`, phase 8): two ace rounds fixed it before land. The corrected wording is confirmed present in the 0.21.17 CHANGELOG blurb and the `hooks/audit-tree-fingerprint.sh` header. This is the generic pattern.

**Instance in one line.** The head blurb said a directory operand is walked "only under `git diff --no-index`", but the code also walks a directory outside the base's work tree; then it said a SIGTERM "reads as a git error", copied from the hook's own header comment, while one caller maps it to an unreadable blob instead. Both were `Nit` / `absorb`; see [[release-slot-files-exempt-from-in-run-ace-and-sweep-machinery]] for why blurb prose is absorb-eligible.

**Rules.**
1. When a blurb restates a code comment, read the code. If the comment is wrong, fix the comment and the blurb in one commit.
2. A universal word (`only`, `always`, `never`, `no`) on a branchy mechanism needs each branch listed first. Compare [[release-blurb-overstates-guard-semantics]] and [[release-blurb-headline-count-word-can-mismatch-its-own-enumeration]].
3. A release task's ace edit to a file another task owns is safe when it is comment-only, but it stales that task's gate pin. The owning task's gate-audit then reports STALE-MISMATCH, which downgrades execution evidence to SOFT. Expect that downgrade and a diff-across-pins check, not a hold.

## Folded in

**A blurb that restates a plan's no-change guardrail.** The same overclaim happens when the source is a plan guardrail, not a code comment. The 0.21.44 blurb said a config setting none of the new keys got byte-identical prompts. The guardrail (PIN-14) covered only three absent keys, and its test swaps old helpers in rather than comparing against the prior release. Name the test's comparator in the blurb. List every change that applies with no config key set. Check words like "every" or "proven" against the rows the test covers. Agent-unverified. (Merged from the archived lesson release-blurb-that-restates-a-no-change-guardrail-claims-more-than-its-test-compares.)
