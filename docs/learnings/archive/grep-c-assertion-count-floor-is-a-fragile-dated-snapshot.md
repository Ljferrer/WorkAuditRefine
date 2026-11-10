---
name: grep-c-assertion-count-floor-is-a-fragile-dated-snapshot
description: "A grep -c End-state count floor is a dated snapshot that counts lines, not items: recount the base, scope the grep to rows, and check each named item separately"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: grep-c-assertion-count-floor-is-a-fragile-dated-snapshot
  phase: 2026-08-06-doc-cli-consistency-corpus/phase-1
  keywords: 
    - grep -c count floor
    - dated snapshot
    - End state check
    - assertion message count
    - must be flagged
    - comment line false inclusion
    - conversion-time literal
    - stale plan literal
    - land-barrier endstate check
    - row-scoped predicate
    - whole-file grep
    - marker literal in prose
    - do_verify
    - shared title prefix
    - ace-reentry
    - enumerated named sub-case
    - fixture coverage gap
  tags: 
    - plan-authoring
    - audit-calibration
    - gate-audit
    - comment-lag
    - lint-design
    - fragile-check
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T05:52:30.641Z
---

# A grep -c count floor in a plan End state is fragile in both directions

## What happened

Phase 1 of `2026-08-06-doc-cli-consistency-corpus`'s End state 3 mandated:
`grep -cF 'must be flagged' skills/_shared/doc-cli-consistency.test.mjs` grow from 8 to 10 (the
plan's own dated snapshot, taken at conversion time, of two new fixtures each carrying the
literal assertion message). The task-1.1 auditor traced the pinned diff by hand at the
task's own `audit_sha` and found the diff added exactly 2 matching lines and removed none,
yet the pinned candidate carried only 8 total matching lines — concluding the plan's base-count
assumption (8) was itself wrong (the real pre-diff base was 6), so the floor of `>= 10` could
never be satisfied by correct work, and filed a `phaseClose:true` Nit recommending the Lead
correct the floor to `>= 8` rather than "pad the suite with extra assertion messages to reach
10 — that is exactly the comment-line false-green the red-team already flagged."

**Re-verified at the actual landed tip:** `grep -c 'must be flagged'
skills/_shared/doc-cli-consistency.test.mjs` returns **10**, not 8. Two of those 10 matching
lines are **comments** ("`-> must be flagged unresolved`" /
"`(both grep forms) -> must be flagged`") near an unrelated verb-scan test, not assertion
messages — `grep -c` counts every matching *line*, comments included, while the plan's own
mental model ("two new fixtures, two new assert messages") only tracked assertion lines. So at
the landed tip the plan's original `-ge 10` floor is in fact satisfied — the audit finding's
"cannot pass" conclusion held only at the earlier `audit_sha`, not at land.

This is recorded as a **generic pattern**, not a live instance — a fix round or a
comment-scope miscount could equally explain the delta between `audit_sha` and the landed tip,
and no Bash access was available in this session to `git diff` between the two SHAs and confirm
which. Per the finding-match discipline, do not treat this file/line as a currently-broken
instance.

## Durable rule

1. A plan-authored `grep -c <phrase> <file> >= N` End-state floor is a **dated snapshot**: N is
   only as good as the plan author's count of the base file at conversion time. Before treating
   a shortfall against N as an implementation defect, recompute the actual base count from the
   phase-base commit rather than trusting the plan's arithmetic.
2. `grep -c` (and `grep -cF`) counts **matching lines**, not matching assertions — if the target
   phrase can also appear in a comment, a doc string, or an unrelated fixture, the floor is
   measuring a coarser surface than the plan author likely intended. A count-floor check is
   weaker evidence than a structural assert (e.g. counting `assert.*'<phrase>'` call sites) and
   should be read as "at least this many lines mention the phrase," not "at least this many
   fixtures were added."
   - **Authoring corollary:** a check that detects a dropped marker must grep structural rows,
     never run a whole-file `grep -c`, because prose can mention the marker. A surviving prose
     mention (e.g. a sentence about "the `[repo]` row") keeps a whole-file count green after every
     real row is gone. Require the line to look like a table row first:
     `grep -E '^\|' | grep '\[\[' | grep -c '\[repo\]'`. The model to mirror is
     `skills/lessons-learned/assets/safe-swap.sh`'s `do_verify`, whose extraction pipe is
     `grep -E '^\|' "$mem" | grep '\[\[' | grep -v '\[repo\]'`.
3. When auditing a count-floor finding, re-run the grep at the **actual landed tip**, not just
   the task's own `audit_sha` — a phase-close checkpoint, a later task in the same phase, or a
   fix round can change the count between task-level audit and phase land.
4. **A floor over a shared title prefix cannot tell which named item is covered.** A
   `grep -c '<shared-prefix>' <file> >= N` floor over a set of enumerated named items stays green
   while one named item lacks a fixture, and it admits unrelated fixtures that share the prefix.
   Example: an End state named three re-entry origins behind `grep -c 'ace-reentry' ... >= 3`.
   Five `ace-reentry` fixtures existed, so the check stayed green, but the third named origin (a
   later-round re-audit) never got a fixture. When authoring, prefer one named check per
   enumerated item (for example `grep -c 'ace-reentry (End state 1, later-round re-audit)'`).
   When auditing, list the matching titles and map each named item to one.

## Related

[[endstate-check-fixed-context-window-undercaptures-growing-enumerated-block]] — a sibling
fragile-literal-floor family (fixed grep context window instead of a bare count), same root
cause: a plan-authored numeric/structural check computed against a snapshot that later commits
can legitimately move past.

[[archive-subcommand-rerender-drops-repo-rows-and-verify-cannot-catch-it]] — the concrete defect
the row-scoped `[repo]` check was built to close.

> archived 2026-08-30: resolved — moved to archive
