---
name: scope-hook-relative-path-loop-hang
description: "A dirname ancestor walk gated only on [ \"$d\" != \"/\" ] never terminates for a relative path; add a prev progress guard"
metadata: 
  node_type: memory
  type: project
  keywords: [infinite loop, dirname walk, progress guard, PreToolUse stall, faithful deviation, parent dir traversal, never terminates]
  slug: scope-hook-relative-path-loop-hang
  phase: 1
  title: Ancestor-walk while-loop hangs on relative paths; needs a progress guard
  tags: 
    - war
    - hooks
    - bash
    - gotcha
    - plan-code-mismatch
  date: 2026-06-25
  originSessionId: 53421d17-5351-48da-baf8-7d315d56c7b5
---

## Fact

The phase-1 plan ("Scope hook rewrite", Task 1 Step 3) pasted a worker-arm ancestor walk shaped as:

```sh
while [ "$d" != "/" ] && [ -n "$d" ]; do ... d="$(dirname "$d")"; done
```

This **never terminates for a relative path**: `dirname` of a relative path converges to `.`, and `dirname .` == `.` — it never reaches `/`, so the loop spins forever and hangs the PreToolUse hook (which would stall every Write/Edit). The worker deviated from the pasted shape and used a progress guard instead:

```sh
prev=""
while [ -n "$d" ] && [ "$d" != "$prev" ]; do
  [ -e "$d/.war-task" ] && exit 0
  [ "$d" = "/" ] && break
  prev="$d"; d="$(dirname "$d")"
done
```

The `prev` guard bounds the loop (it stops once `dirname` stops making progress, i.e. at `.` or `/`), while keeping the deny semantics identical. A regression test covers the relative-path case.

## Why it matters

The plan's shape compiled and looked right but had a latent infinite loop. The audit ruled the worker's deviation intent-preserving and faithful, not a violation (the plan slice is the floor, intent the ceiling).

## Remedy pattern

For any `dirname`-based ancestor walk in shell, never gate solely on `[ "$d" != "/" ]`. Either:
- normalize to an absolute path up front, or
- add a `prev`/progress guard so the loop terminates when `dirname` stabilizes (handles relative paths, `.`, and `/` uniformly).

Plans that paste runnable shell should not assume inputs are absolute; the hook payload's `file_path` can be relative.

Related: [[scope-hook-servitor-pattern-residuals]] (other residuals in the same hook), [[scope-guard-needs-agent-type]] (why the hook keys on `agent_type`).

> archived 2026-08-30: resolved — moved to archive
