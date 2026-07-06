---
name: fail-open-design-bounds-xargs-word-split-blast-radius
description: "xargs ls -t splits on spaces; fail-open = silence"
metadata: 
  node_type: memory
  type: project
  keywords: [spaces in filenames, whitespace splitting, silent skip, ls -t mtime sort, while read loop, hook no-op]
  provenance: code-verified
  slug: fail-open-design-bounds-xargs-word-split-blast-radius
  phase: campaign-compaction-survival/phase-1-task1
  tags: 
    - shell
    - xargs
    - fail-open
    - word-splitting
    - hook-design
  created: 2026-07-03
  originSessionId: 9c57c14a-92ed-4fc9-92d1-27be3d4dbad5
---

# Fail-open design bounds an xargs word-split blast radius to silence

## What happened

`hooks/inject-campaign-state.sh` (line ~76, `campaign-compaction-survival` phase, Task 1)
collects candidate `ledger.json` paths into a newline-joined string, then sorts by mtime via
`printf '%s' "$candidates" | xargs ls -t`. `xargs` word-splits on **all** whitespace, not just
newlines — so a scan root (`$CLAUDE_PROJECT_DIR` or the hook's input `cwd`) or a campaign
directory name containing a space fragments into multiple `ls` arguments, breaking the sort.
The inline comment at line 63 justifies newline-splitting ("no newlines in our dir names") but
never addresses spaces, and the root is externally supplied (session cwd), so this isn't fully
within the hook's control.

Confirmed via Read: `hooks/inject-campaign-state.sh` line 76 is the `xargs ls -t` sort call;
line 63 carries the newline-only rationale comment (audit finding, task1, Minor, disposition
`note` — not blocking).

## Why it's a `note`, not a fix-now

The hook is fail-open by design end to end: `ls` on garbage/fragmented paths errors (suppressed
via `2>/dev/null`), so the loop finds no active ledger and the hook exits 0 **silently** — the
SessionStart injection simply doesn't fire for that session. It degrades to **no injection**,
never to a wrong or corrupted injection. Given the hook's stated contract ("silent + harmless in
non-campaign sessions"), a space-in-path failure mode still satisfies "harmless" — it just also
loses "should have injected." Space-bearing project paths are atypical for this tooling, so the
audit disposition was `note`, not a required fix.

## How to apply

When reviewing any shell script that (a) builds a newline-joined path list from a glob/discovery
step and (b) pipes it through `xargs` for a second pass (sort, filter, batch-invoke):
1. Check whether the comment justifying newline-splitting also covers spaces — usually it
   doesn't, because `IFS`-based newline splitting and `xargs` word-splitting are different
   mechanisms with different blast radii.
2. Before flagging as blocking, check the script's overall failure mode: if a broken split routes
   through an already-suppressed-stderr command whose failure is itself handled (loop finds
   nothing, exits cleanly), the defect degrades to *silent inaction*, which may be acceptable for
   a fail-open hook/guard. If the same pattern feeds a command whose failure is NOT handled
   (aborts, corrupts, or silently substitutes wrong data), escalate it — the bounding logic here
   does not generalize to code that's fail-closed or side-effecting.
3. If ever tightened: iterate the newline list directly (`while IFS= read -r`) instead of
   `xargs`, or sort via `ls -t` fed a here-string, to avoid the word-splitting seam entirely.
