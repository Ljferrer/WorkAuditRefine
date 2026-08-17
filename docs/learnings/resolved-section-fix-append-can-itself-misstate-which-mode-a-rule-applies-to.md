---
name: resolved-section-fix-append-can-itself-misstate-which-mode-a-rule-applies-to
description: "An appended ## RESOLVED fix section is not self-verifying; it can misstate which mode a rule applies to"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: resolved-section-fix-append-can-itself-misstate-which-mode-a-rule-applies-to
  phase: "red-team-gate-cli/p2-polish (phase-2 close), landed dev/2026-08-06-red-team-gate-cli @ 8064a3c603bffd462ea616f877954bfe0bf332f2"
  keywords:
    - RESOLVED section
    - fix appendix wrong
    - correction channel not self-verifying
    - mode inversion
    - lesson-stamp convention
    - appended fix section bug
    - stdin mode bare token
    - which mode a rule applies to
    - RESOLVED stamp gotcha
    - servitor recurrence edit
    - docs/learnings drift
    - own fix wrong
  tags:
    - memory-system
    - lesson-hygiene
    - process-pattern
    - red-team
    - cli
  created: 2026-08-14
  modified: 2026-08-15T01:52:06.048Z
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
---

# The appended `## RESOLVED` fix section is itself not self-verifying — it can misstate which mode a rule applies to

**Pattern (code-verified — confirmed against both the landed repo lesson and the code it describes,
at the landed tip `8064a3c603bffd462ea616f877954bfe0bf332f2`, `_refinery8` worktree whose `HEAD` is
byte-equal to that tip):** this repo's convention for closing a stamped lesson is to prefix the
`description` with `RESOLVED (...)` and append a `## RESOLVED` section below the frozen historical
prose, documented and recommended by [[resolved-lesson-stamp-freezes-body-so-it-can-contradict-the-new-description]]
as the sanctioned correction channel — the place a servitor or worker is *supposed* to write the
accurate, current statement of the fix. That assumption — that the appended section is where the
truth lives — does not hold automatically. In `docs/learnings/stdin-mode-cli-parser-silently-drops-space-separated-flag-with-no-positional-fallback.md`,
the appended `## RESOLVED (red-team-gate-cli/1.2, ...)` section itself states the fix dies "on
anything not `--stdin`, a `--rounds=`/`--round-limit=` `=`-attached flag, or (in `--stdin` mode)
the sole recognized bare token" — i.e. it names `--stdin` mode as the one that tolerates a bare
token. The landed code does the **opposite**: `main()`'s default-deny loop in
`skills/red-team/assets/red-team-gate.mjs` has `else if (stdinMode) { die(...'--stdin mode takes no
positional arguments'...) }` — `--stdin` mode refuses **every** bare token, none are "recognized";
the bare-token allowance belongs to **file mode** (`args.find(a => !a.startsWith('--'))` picks the
first bare token as the positional results path; a surplus bare token there is the one case that
stays silently ignored, by design). The same lesson file's own `description` line — the field this
repo's projection (`MEMORY.md`) actually renders — states the rule *correctly* ("and, in --stdin
mode, a bare non-flag token" is refused), so the file **contradicts itself between its two most
load-bearing fields**: the description a reader scans first is right, and the body section a reader
trusts as "the current truth" is backward.

**Why it slipped through:** the fix-append convention exists precisely because a plan mandates the
historical body stay byte-frozen — but nothing in that convention, nor in the audit lens that judges
the task shipping the fix, treats the *new* appended prose as itself requiring the same D3
verify-on-write discipline a servitor applies when first writing a lesson. It was caught here by the
phase-2 `p2-polish` task's own audit (Minor, `disposition: absorb`, `phaseClose: true`) — but the
finding was against a task whose own diff (a prior commit, `e0874a4`, phase 1) had already landed;
by the time phase-2 closed, no round remained to apply the fix, and it is still uncorrected in the
repo file at the landed tip.

**How to apply:**
1. Treat an appended `## RESOLVED` section as new prose subject to the *same* D3 verify-on-write
   check as any newly-written lesson fact — re-derive the rule from the actual landed code, don't
   paraphrase from memory of "roughly what the fix did."
2. When a `RESOLVED`-stamped lesson names two (or more) modes/branches/cases, verify the
   correction's claim against the code construct that discriminates them directly (here: the
   `if (t.startsWith('--')) {...} else if (stdinMode) {...}` branch pair) rather than trusting the
   fix-append author's summary of "which side got which behavior" — the two sides are easy to swap
   when writing from memory of a just-finished implementation.
3. When a lesson's `description` and its body/appended-section prose disagree on a factual claim
   about current code, the `description` is not automatically the correct one — check the code
   directly; here the description happened to be right and the appendix wrong, but nothing
   structurally guarantees that ordering.
4. A servitor holding a `metadata.promoted`-stamped local copy of the affected lesson (D1's
   canonical recurrence-edit target) can and should fix an appended `## RESOLVED` section's own
   error in that local copy immediately, same as fixing any other stale fact — the next Gate-2
   promotion overwrites the same-slug repo file with the corrected text.

Related: [[resolved-lesson-stamp-freezes-body-so-it-can-contradict-the-new-description]] (the
sibling fact this pattern extends — that lesson is about the *frozen historical body* going stale;
this one is about the *supposedly-current fix appendix* being wrong from the start, not merely
aging). The corrected instance:
[[stdin-mode-cli-parser-silently-drops-space-separated-flag-with-no-positional-fallback]] (local
copy fixed in the same phase-close pass that produced this lesson).
