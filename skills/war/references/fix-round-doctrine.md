# Fix-round doctrine

The fixer's rules for a fix round or an ace commit. A seat's finding names one site. The defect is a rule missed at that site. The rules below scope the diff, not the site. Operator ruling 2026-09-07 (#2097) makes this file the canonical home of the rules. Prompts in `skills/war/assets/workflow-template.js` carry the `## The rules` section byte-equal. They are the FIX_NEEDED fix prompt, the ACE BISECTION SUBSET prompt and the ACE RE-ENTRY BATCH prompt. By the #2127 ruling, the ADVISORY POLISH (--ace) prompt, the PHASE-CLOSE COHERENCE SWEEP prompt and the TERMINAL PASS prompt carry it too. So does the LATE-FIX PASS prompt (plan 2026-11-04-late-defects-fixed-in-run, Task 3.1). The `workflow-template.engine-1.test.mjs` fixture `fix-round doctrine: every fix-applying build mirrors the reference` pins the copies. The worker card, `/snipe` and `/zero-in` carry the trigger pointer only. The lesson `docs/learnings/fix-the-finding-class-not-the-site-and-prove-every-new-guard-red-before-commit.md` is the instance record, never the home.

## The rules

1. Sibling sweep before commit: grep every sibling site of the fixed construct (same registry, push, judgment, restated value, doc or comment claim) and apply the rule there, or state in the commit why that site differs.
2. The seat's `fix:` is a floor: ask what the seat did not check (the other arm, the other order, the empty input, the boundary value, the flag the example did not pass) and add the mirror fixture.
3. Every new guard gets an oracle that does not share the code under test.
4. Prove each guard red by mutation, enumerating the arms from the code's own branches, never from the seat's list, and name the proof in the commit body.
5. Bind or de-mirror every restated value: pin it with an extraction-and-equality row and a bare-rendering ban, or replace it with a pointer to its source.
6. Extract the helper on the second hand copy, not the fourth.
7. No count words or ordinals in comments a diff can invalidate: name the members.
8. One consequence sentence per fix commit.
9. Per finding, state the cause, then the class, then the fix: a finding is a rule missed at one site.
10. A `note`-rated finding on a surface the same commit edits is an absorb, never left for the next round.
11. A byte-cap breach on a prompt surface is a signal to evict, never to reword: move conditionally needed prose byte-identical to its `references/` file, leave a `when <trigger>, read references/<file>` pointer (ADR 0042), and never delete an operative rule.

## The bug class limit

Operator ruling on PR #2577: the ADVISORY POLISH, PHASE-CLOSE COHERENCE SWEEP and TERMINAL PASS prompts also carry `FIX_ROUND_SCOPE_CLAUSE`. Those workers fix each sibling site of a listed finding's defect class, and list any other defect under `Ignore for now:`. `fixRoundFenceClause` names the files another task, plan or the release slot owns, and a sibling site there goes on that list. All three lists reach the phase report's `notes`. ADVISORY POLISH runs beside its wave peers, so `POLISH_FILES_CLAUSE` limits where its sibling fixes go. They stay in its task's own files, the listed rows' files, and files no task of its wave lists and no fence names. Its list of other siblings reaches the phase report for a ruling.

The polish claim rule (D19, ADR 0061; operator ruling on #2578). The engine reads each polish commit's files from the tip probe, in return order. The first same-wave commit to touch a file no wave task lists claims that file for the wave: first commit wins. The engine forward-reverts a later commit that touches a claimed file or a file a wave peer lists. Its rows go to the phase-close sweep queue. Later peers see each claimed file in their `FIX-ROUND FENCE` line. A claim ends only when the merge slot can drop the claiming commit and its revert (ADR 0061). The clash commit and its revert form the net-zero clash range. At the merge slot, the clashed task's pin-transfer probe rebases only through the approved sha. It does so when the range above that sha is the net-zero clash range. The rule is not for `/zero-in`.

## Ace commit messages

Source: plan 2026-11-08-engine-findings-ace-and-late-fix D24 (#2669). An ace-family commit is ONE commit. The ace family is the ACE BISECTION SUBSET, ACE RE-ENTRY BATCH, ADVISORY POLISH (--ace) and TERMINAL PASS prompts. Its message ends with `Ace-Subset:` (subset and re-entry only) and `Ace-Charge:` (every ace-family commit) in one final trailer block. A commit without them has a wrong commit message. The engine logs the missing trailer, and a relaunch's ABSORB-CHARGE READ does not count the commit.

Two causes recur in the field:

- `Co-Authored-By` in its own paragraph after the trailer block. git parses trailers only from the last paragraph, so it reads the attribution alone and drops both ace trailers. Put the attribution line inside the trailer block, never after it.
- An `Ace-Subset:` value edited away from the one the prompt gives. Copy that value verbatim: it names the listed findings' files, so fix each of them; never rewrite it to list the files the commit touches.

Before you push, check the trailers parse: `git show -s --format='%(trailers:key=Ace-Charge,valueonly)' HEAD` prints the value (and the `Ace-Subset` key likewise when the prompt asks for it). Amend an unpushed commit that lacks one. Report a pushed one in `blocked_reason`, naming the missing trailer, and never force-push.

The engine records a finding aced only when the commit reaches its file. A listed finding whose file the commit never changes goes to the phase-close sweep as a failed absorb. So fix each listed finding in its own file.

## Editing the rules

Edit the `## The rules` section here first, then the mirrored block in `workflow-template.js` (the shared constant the fix-applying builds interpolate). The fixture reds on any byte drift between the section and a rendered fix-applying prompt, and on a build that drops the block.
