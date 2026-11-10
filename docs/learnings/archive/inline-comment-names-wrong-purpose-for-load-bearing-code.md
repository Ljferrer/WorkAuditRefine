---
name: inline-comment-names-wrong-purpose-for-load-bearing-code
description: "Guard comments must name the crash prevented; 'handled above' can mask null-deref"
metadata:
  node_type: memory
  type: project
  slug: inline-comment-names-wrong-purpose-for-load-bearing-code
  phase: worker-test-floor/p2-t2
  date: 2026-06-29
  tags:
    - workflow-template
    - null-deref
    - comments
    - guard
  originSessionId: fa4a98d9-e917-4fc2-8838-f98e4a473a1a
---

# An inline comment can name the wrong purpose for load-bearing guard code

Rule: for any `if (cond) continue/return/break` guard, ask what the NEXT statement does if the guard is absent and `cond` is true. If the answer is crash / null-deref / wrong-branch, the comment must name THAT — not a secondary reason like "escalation already pushed above" or "belt-and-suspenders". A comment framing a crash-shield as bookkeeping invites its deletion, creating a latent production-path TypeError that passes all tests.

Fixed: the `reAuditFailed` guard comment in `skills/war/assets/workflow-template.js` now names the real purpose ("Null-deref guard: both reAuditFailed=true sites set noTestMr=null; skip before the unconditional noTestMr.status deref below").

Distinct from [[source-comment-lags-emitted-prompt-after-rewrite]] (stale comments describing an old model); this covers a live comment ascribing the wrong purpose to currently-correct code.

**Why:** "safely removable" is exactly what a mislabeled crash-guard is not.
**How to apply:** when auditing a guard whose comment says "already handled above", trace what the code below does to the guarded variable; if it would throw, file a Nit to correct the comment and never accept the guard as deletable.

> archived 2026-07-04: resolved — moved to archive
