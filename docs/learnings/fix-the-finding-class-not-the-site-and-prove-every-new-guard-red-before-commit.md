---
name: fix-the-finding-class-not-the-site-and-prove-every-new-guard-red-before-commit
description: "Treat an audit finding's fix text as a floor: sweep every sibling site of the same rule, give each new guard an independent oracle and a proven-red mutation, bind restated values with a pin, and extract on the second copy — or the next review round finds the mirror case."
metadata: 
  node_type: memory
  type: project
  provenance: user-confirmed
  slug: fix-the-finding-class-not-the-site-and-prove-every-new-guard-red-before-commit
  keywords: 
    - finding class not site
    - sibling sweep
    - fix text is a floor
    - prove the guard red
    - mutation proof
    - independent oracle
    - self-referential test
    - restated value pin
    - extract on the second copy
    - count words in comments
    - consequence line
    - review round count
    - snipe absorb
    - post-audit fix loop
  tags: 
    - review-discipline
    - test-fidelity
    - drift-guard
    - doc-truth
  created: 2026-09-06
---

# Fix the finding class, not the site, and prove every new guard red before you commit

## The rule

A reviewer's `fix:` text names one site. The defect is a rule that was applied at that site and
missed elsewhere. Fix the rule everywhere it applies, or the next review round finds the mirror
case. Before each commit of a review-driven fix, run this checklist:

1. **Sibling sweep.** Grep for every other site that carries the same construct: the same
   registry, the same push, the same judgment, the same restated value, the same claim in a doc
   or a comment. Apply the rule there too, or write in the commit why that site differs.
2. **The fix text is a floor.** Ask what the reviewer did not check: the other arm, the other
   order, the empty input, the boundary value (`>` against `>=`), the path with a flag the
   reviewer's example did not pass. Add the mirror fixture.
3. **Give every new guard an oracle that does not share the code under test.** A test that
   compares the output of a function against a value computed by the same function is
   self-referential and stays green on the bug it is meant to catch. Find a second mechanism
   (a different scanner, a compiler, a census of names) and make the guard rest on that.
4. **Prove each guard red.** Mutate the thing it guards (delete the arm, flip the comparison,
   change one digit in a restated value) and watch the exact assertion fail. A guard that was
   never red is a hope. Enumerate the arms from the code's own branches, never from the
   reviewer's list. Name the proof in the commit body.
5. **Bind or de-mirror every restated value.** A number or a tier written by hand into prose
   rots silently. Either pin it (extract the restatement and compare it to the constant, and
   ban a bare rendering outside the pinned grammar) or replace it with a pointer to its source.
6. **Extract on the second copy.** If a fix creates a second hand copy of a rule or a scanner,
   move it into one helper in the same commit and migrate both callers. The fourth copy is
   three review rounds too late.
7. **No count words the diff can invalidate.** Never write "two", "both", "the fourth" in a
   comment or census header that the same change can make false. Name the members.
8. **One consequence line per commit.** State what else the change touches and why that is
   unaffected. It forces the sweep the fixer otherwise skips.

The canonical home of these rules is `skills/war/references/fix-round-doctrine.md` (operator ruling
2026-09-07, #2097), which carries the full set mirrored into the fix-applying dispatched prompts;
this file is the instance record.

The reviewer's fix scopes the site. The rule scopes the diff.

## Instance

Emergency patch 0.21.12 (issue #2099, PR #2100), a comment stripper for the staged per-phase script.
Eight site edits became a class fix: a second scanner (`ptSpanRanges`) as an independent oracle, every
scanner arm proven red (arms enumerated from the reviewer's list missed four more, which is rule 4's
second sentence), and a pin on a cap restated by hand on three doctrine surfaces. Issue #2097 records
the round count this saves (fourteen rounds against seven, then one).

## Locate-cue (verify still present before acting)

`skills/war/assets/stage-workflow.test.mjs`: the `assertStripKeptPromptBytes` helper and its
synthetic negative (rule 3), the `STRIP_FIXTURE` block comment listing the lines per arm (rule 4),
the `DOC_CAP_PINS` arm (rule 5). The commit bodies on PR #2100 carry the proven-red list and the
consequence lines (rules 4 and 8).
