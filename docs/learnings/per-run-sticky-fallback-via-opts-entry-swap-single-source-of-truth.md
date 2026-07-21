---
name: per-run-sticky-fallback-via-opts-entry-swap-single-source-of-truth
description: "Make a per-dispatch fallback sticky per-run by reassigning the effective value into opts at function entry, not by threading a second parameter"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: per-run-sticky-fallback-via-opts-entry-swap-single-source-of-truth
  phase: "Sticky fallback + anchor hygiene (#890,"
  keywords: 
    - sticky pin
    - sticky fallback
    - entry swap
    - single source of truth
    - opts reassignment
    - redundant-dispatch guard
    - effective type
    - reactive fallback
    - per-run state
    - dispatchAgent
  tags: 
    - pattern
    - red-team
    - workflow-scaffold
    - design
  created: 2026-07-15
  originSessionId: e11422bd-1b49-4d13-9840-37a67306b3f5
---

# Per-run sticky fallback via an opts entry-swap, not a threaded parameter

**The problem shape:** a function has a reactive per-call fallback (try preferred, on death retry
with a fallback value) called from several call sites, with several downstream reads of "which
value actually got used" inside that same function (a guard clause, a log line, two error
messages). Upgrading the fallback from per-call to **sticky for the rest of the run** (once the
preferred value dies once anywhere, use the fallback everywhere thereafter) risks a costly rewrite:
every downstream read would need to consult the sticky flag separately, or every call site would
need a new parameter threaded through.

**The pattern (verified in `dispatchAgent`, `skills/red-team/assets/workflow-scaffold.js`, phase
"Sticky fallback + anchor hygiene" task 1.1 — confirmed present in the phase's own task worktree
after this servitor's own cwd read as stale, see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] Recurrence 6):** declare the sticky
flag as a function-scope (here, module/scaffold-scope) mutable `let` beside the function, and at
the very **top of the function body** — before any other logic — reassign the local `opts`
parameter itself when the flag is set: `if (pinned) opts = { ...opts, agentType: FALLBACK }`. Every
downstream line in the function (the redundant-dispatch guard, the log line, both error message
templates, and the result-stamping logic) then reads `opts.agentType` (or whatever field carries
the value) and automatically sees the **effective** value with zero additional plumbing — no
second parameter, no flag check duplicated at each read site. The flag itself is set later in the
same function, just past the existing guard that would otherwise cause an identical redundant
re-dispatch (so a run where the preferred value already equals the fallback never reaches the
pin-set line, and that pre-existing case's behavior is untouched).

**Why this beats the alternatives:**
- A second parameter (`effectiveType`) threaded alongside `opts.agentType` risks call sites or
  downstream reads consulting the wrong one (the field, not the parameter) — a whole class of "read
  the stale field" bugs the entry-swap makes structurally impossible, because there is only one
  field, ever.
- Checking the sticky flag at each of N downstream sites duplicates the conditional N times and
  invites drift when a new read site is added later without the check.
- The entry-swap changes an opts **value**, never opts' **key set** — a standing byte-shape lock on
  `Object.keys(opts)` elsewhere in the codebase (if one exists) stays green untouched, because no
  key was added or removed.

**When to reach for it:** any function with (a) a per-call reactive fallback, (b) multiple
downstream reads of "which value was actually used" inside the same function, and (c) a
requirement to make the fallback sticky/global without touching call sites. Not applicable if the
downstream reads live outside the function that owns the fallback decision — the entry-swap only
unifies reads *within* the same call frame.
