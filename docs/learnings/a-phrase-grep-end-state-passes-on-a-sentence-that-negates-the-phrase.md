---
name: a-phrase-grep-end-state-passes-on-a-sentence-that-negates-the-phrase
description: "A grep -c End state on a doctrine phrase stays green when the doc negates it"
metadata:
  promoted: dev/2026-11-08-engine-findings-ace-and-late-fix@phase-3
  node_type: memory
  type: project
  keywords:
    - grep oracle
    - End state check
    - negated phrase
    - doctrine wording
    - plan authoring
    - Ace-Subset trailer
    - engine-dictated value
    - exact match
  provenance: code-verified
  slug: a-phrase-grep-end-state-passes-on-a-sentence-that-negates-the-phrase
  phase: 2026-11-08-engine-findings-ace-and-late-fix/phase-3 (task 3.1)
  tags:
    - plan-authoring
    - red-team
    - end-state
    - doctrine
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-10T03:08:37.447Z
---

# A phrase-grep End state passes on a sentence that negates the phrase

**The trap.** A plan End state can check doctrine with `grep -c '<phrase>' <file>` prints `1`.
The grep counts the phrase, not its meaning.
A sentence that says "never do <phrase>" satisfies it as well as one that says "do <phrase>".

**Instance.** Plan `docs/plans/2026-11-08-engine-findings-ace-and-late-fix.md` End state 34 greps `skills/war/references/fix-round-doctrine.md` for `files the commit touches`.
The plan slice said an `Ace-Subset` trailer "must name exactly the files the commit touches".
That rule was wrong for the engine.
The engine builds the trailer value from the listed findings' files (`const trailer = r.task.id + ':' + ...` in `skills/war/assets/workflow-template.js`).
The subset and re-entry PREFLIGHT compares that value by exact string equality.
A fixer that rewrote the trailer to match its own touched files would break the resume match and get a second charge.
An audit seat caught it, and the fix round reworded the doctrine to "Copy that value verbatim ... never rewrite it to list the files the commit touches".
The grep still printed `1`, so End state 34 attested `met` on the negated sentence.

**Rules.**
- Plan authors: if an End state greps a phrase, pick a token only the correct rule contains.
- Plan authors: before a slice states a rule about an engine-built value, read how the engine builds and compares it.
- Auditors: a green phrase-grep proves presence, not that the doc states the rule the plan meant.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]], [[a-slice-that-retires-a-refusal-check-flips-every-case-only-that-check-refused]].

Locate-cue: verify still present before acting. At phase 3 landed tip aabdfe42 (read in the run's `_refinery` worktree, HEAD equal to that tip), `skills/war/references/fix-round-doctrine.md` holds the "Copy that value verbatim" bullet, and `skills/war/assets/workflow-template.js` holds `const trailer = r.task.id + ':'` and the `Ace-Subset: ${trailer}` prompt lines.
