---
name: scope-hook-relative-path-loop-hang
description: "Ancestor walk hangs on rel paths; add prev guard"
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

This is a **plan↔code mismatch where the deviation was the correct call** — the audit explicitly ruled it intent-preserving and faithful, not a violation. It's the kind of "copy the pasted snippet verbatim" trap a worker can fall into: the plan's shape compiled and looked right but had a latent infinite loop. Worth recording because (a) it justifies a deviation from a literal plan paste, and (b) it's a reusable bash gotcha for any ancestor/parent-dir walk in a hook.

## Remedy pattern

For any `dirname`-based ancestor walk in shell, never gate solely on `[ "$d" != "/" ]`. Either:
- normalize to an absolute path up front, or
- add a `prev`/progress guard so the loop terminates when `dirname` stabilizes (handles relative paths, `.`, and `/` uniformly).

Plans that paste runnable shell should not assume inputs are absolute; the hook payload's `file_path` can be relative.

Related: [[scope-hook-servitor-pattern-residuals]] (other residuals in the same hook), [[scope-guard-needs-agent-type]] (why the hook keys on `agent_type`).

## Lineage: faithful deviations (other entries)

A faithful deviation is a divergence from the plan's *letter* that preserves (or strengthens) its *intent*, and is ruled intent-preserving by audit rather than flagged as a violation. Other instances:

- **Phase B1 / `structuralFallback` defensive guard** (`skills/_shared/provision.mjs`): the plan asked for a tiny `structuralFallback(repoDir)` that "never throws on a missing dir". The worker added a guard beyond the plan's letter — `if (typeof repoDir !== 'string' || repoDir === '') return []` — so a non-string/empty `repoDir` yields `[]` instead of throwing in the dirname/fs path. This is a **harmless superset** fully consistent with the stated never-throw intent (audited as a Nit, not a deviation-of-concern). The reusable lesson: when a plan specifies a robustness intent ("never throw on X"), hardening the *input* edge in the same spirit is faithful, not scope creep.
