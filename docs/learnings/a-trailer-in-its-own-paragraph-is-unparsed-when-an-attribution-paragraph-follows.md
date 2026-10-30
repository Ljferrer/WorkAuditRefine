---
name: a-trailer-in-its-own-paragraph-is-unparsed-when-an-attribution-paragraph-follows
description: A trailer set as its own paragraph is lost once an agent appends a Co-Authored-By paragraph
metadata:
  node_type: memory
  type: project
  keywords:
    - git trailers last paragraph
    - Ace-Charge unparsed
    - Co-Authored-By paragraph
    - own final paragraph
    - one final trailer block
    - interpret-trailers
    - absorb-charge seed reads 0
    - commit message shape
  provenance: code-verified
  slug: a-trailer-in-its-own-paragraph-is-unparsed-when-an-attribution-paragraph-follows
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-3 (task 3.1)
  tags:
    - war-engine
    - git
    - prompt-surface
    - ace
  created: 2026-10-30
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-10-30T07:47:17.276Z
---

# A trailer in its own paragraph is unparsed when an attribution paragraph follows

**The git fact.** `%(trailers:...)` and `git interpret-trailers` read trailers only from the last paragraph of a commit message.
A trailer line in any earlier paragraph is plain body text to git.

**The trap.** Older ace prompts told the worker to put the `Ace-Charge:` (or `Ace-Subset:`) trailer in its "OWN final paragraph".
Agents then append a separate `Co-Authored-By` paragraph after it.
The engine trailer is no longer in the last paragraph, so every trailer read returns nothing.

**Instance.** Ace commit d1e7e090 on task 3.1 carried `Ace-Charge: 3.1:1`, then a blank line, then a `Co-Authored-By` paragraph.
Three audit seats confirmed that `%(trailers:key=Ace-Charge,valueonly)` returns nothing for it.
A relaunch absorb-charge seed for 3.1 therefore reads 0, not 1.
The later ace commit a86f8a6c kept `Ace-Charge: 3.1:2` in the same block as `Co-Authored-By`, so it parses.

**The fix shape (plan #2485 ES11).** Ask for "one final trailer block" that holds every trailer, attribution lines included.
Never ask for a trailer "paragraph" of its own.
The run still executes from the installed plugin, so a fixed prompt does not reach the run that lands it (see [[engine-change-landed-this-run-cannot-exercise-itself-same-run]]).

**Rule.** If a machine reads a trailer, ask for one final block with all trailers.
If you test a trailer read, include a fixture with an attribution paragraph after the trailer.

Related: [[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]] (its fragility-1 fix introduced the "own final paragraph" wording), [[a-shell-command-inside-a-prompt-string-needs-a-test-that-runs-the-exact-prompt-spelling-through-bash]].

Locate-cue: verify still present before acting. At landed tip 8c1a7a51, `skills/war/assets/workflow-template.js` holds "one final trailer block" at six sites and no "own final paragraph" text.
`agents/war-worker.md` step 5 says git parses trailers only from the last paragraph.
`absorbChargesClause` in `skills/war/assets/workflow-template.js` reads `%(trailers:key=Ace-Charge,valueonly)`.
