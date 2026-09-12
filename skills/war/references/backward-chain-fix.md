# Backward-chain doctrine — the fixer

The fixer's chain for every fix-applying build: a FIX_NEEDED fix round, an ace charge, a floor correction, the phase-close sweep, the terminal pass. A seat's finding names one site. The site is one link on a chain that ends at a cited End state. The fixer walks that chain backward from the outcome, finds the earliest unmet link, and fixes the class there. This file composes with [fix-round-doctrine.md](fix-round-doctrine.md): the chain comes first, then the ten rules of that file apply to the diff. Nothing here restates them.

The `## The rules` section rides byte-equal in every fix-applying dispatched prompt built by `skills/war/assets/workflow-template.js`, pinned by the `workflow-template.test.mjs` fixture `backward-chain: fixer rules byte-equal on all seven builds`. The depth sections below (`## Round 1` through `## Round 5 and later`) are read by pointer: the prompt names the section for the corrective round it dispatches. A corrective round is one fix round or one ace charge, counted 1-based per site (see `CONTEXT.md`). The bounded round count is a safety precaution: a chain that has not closed by the last round is a completed measurement of the task, and the round-5 tier below says what to return.

## The rules

1. Lock the outcome first. Write one `Outcome:` line that cites the End state number or the `Done when:` command the finding chains from. A fix with no cited outcome is a site patch.
2. Chain backward from the outcome to the tip. Each link is a condition that must hold for the next link to hold, ending at the pinned sha. Number the links.
3. Place the finding on the chain and find the earliest unmet link. The finding's site is usually a later link; the fix goes at the earliest link that is false, and the class at that link is what you fix.
4. Ask the Focusing Question over all open findings together: what is the one change such that, by making it, the other findings become unnecessary or easier? Fix that one change first.
5. Verify the finding's premise before you act on it, and state what the seat's `fix:` does to the thing it does not mention: the neighbor state, the other caller, the queued job, the reader of the value.
6. Write `Ignore for now:` in the commit body: the open findings and neighbors you saw and chose not to touch this round, each with one reason.

## Round 1

The first fix round after the first audit. The prompt carries the seat findings for this task and nothing older.

Commit body shape, one block, in this order:

```
Outcome: <End state number or Done when: command>
Chain: <link 1> <- <link 2> <- ... <- tip
Bottleneck: <the earliest unmet link, and the class at it>
Fix: <the one change, and the sibling sites it reaches>
Ignore for now: <finding or neighbor> - <reason>; ...
```

Write this block into the commit body AND echo the same block, byte for byte, into `WorkerResult.notes`. The Workflow sandbox has no git, so the engine reads only `notes`; the auditor reads the commit body with its own read-only git. Both readers must see one text.

Then apply the ten rules of [fix-round-doctrine.md](fix-round-doctrine.md) to the diff: the sibling sweep, the mirror fixture, the independent oracle, the proven-red mutation, the bound or de-mirrored value, the early extraction, no count words, one consequence sentence, cause then class then fix, the absorbed note.

The markers are self-reports. The auditor runs its own chain from the cited End state and diffs it against yours. A chain that reads well but skips the unmet link is caught there, not by the marker's presence.

## Round 2

The prompt carries the threaded prior round: the history digest (each prior blocker's title, file, severity, `relation:` tag and `upstream link:` line; your own prior `Fix:` and `Ignore for now:` lines; the task's relation-tag sequence; the worker's `Critical path:` block) and the full text of the survival-registry blockers.

Re-run the chain from the outcome before you read the new findings. Do not start from the prior fix. Then read each new finding's `relation:` tag, the auditor's classification of how the new blocker relates to your last fix, and take the first move for that tag:

| relation | first move |
|---|---|
| sibling | Sweep every site of the rule the last fix applied, by grep over the construct, and fix all of them in one commit. |
| residue | Enumerate the arms the last fix added from the code's own branches and prove each one red by mutation before you touch anything else. |
| oracle | Replace the test's oracle with one that does not share the code under test; a count, a label or a metadata field is not the return value. |
| consumer | Open every reader of the value the last fix widened or reshaped and check its preconditions before the producer changes again. |
| upstream | Move the fix one link earlier on the chain: the cause the last fix patched around is the bottleneck now. |
| premise | Test the finding's claim at the pinned sha before any edit; a premise that fails is a note back to the auditor, not a fix. |
| regression | Excise the one change that undid the earlier link; never revert the whole last commit. |
| off-path | Verify the finding is off the chain, then absorb it only if the same commit already edits that surface; otherwise name it under `Ignore for now:`. |

The `## Worked examples` section below points at the examples bank by the same tags. Read the section the tag names; with no tag, read the bank's index and self-select.

## Round 3 and later

The prompt carries the threaded history: every prior round's digest lines and the relation-tag sequence for this task, in order.

A class that re-opens one hop per round (sibling, then residue, then consumer, on the same construct) is a shape signal. It says the fix has been landing at the named site and the chain's earliest unmet link is still open. It is never an escalation (PIN-11). Three moves, in order:

1. Find the common ancestor. Read the history as one chain and name the link every prior blocker descends from. That link, not the newest site, is where this round's fix lands.
2. Re-lock the outcome on the cited End state and the Commander's Intent only. Never on a peer finding, a prior fix, or your own inference about what the seats want.
3. Ask the Focusing Question over the whole history, not over this round's findings. Extract the one change (a shared predicate, a helper, a proof) that closes the class, and prove it red.

The slice-level `PLAN-DEFECT:` route on the worker card stays available at every round: a plan that contradicts the code is a `blocked` return with that prefix, at round 1 or round 4 alike. That route is about the slice. The End state exit at the next tier is about the outcome, and it opens only there.

The accountability stance: the round count is a measurement of the chain, not of the seat. Own the earliest unmet link, name it in `Bottleneck:`, and write the class-level change. A round spent re-arguing a prior finding is a round without a fix.

## Round 5 and later

Disclosed only at corrective round 5 or later (PIN-3). Everything above still applies first.

A re-opening class is not a plan defect. A wrong or impossible End state is. The test: re-run the chain from the cited End state with the task's own tools and files. If every link from the tip to the End state can be made true and the class keeps re-opening, the bottleneck is still yours: go back to the common ancestor. If some link cannot be made true by any change inside the task's `Files:`, or the End state's check contradicts the code it measures, the End state is the defect.

In that case return `status: "blocked"` with `blocked_reason` starting with the literal `PLAN-DEFECT:` and naming the End state number, the link that cannot be made true, and the evidence you ran. This return is a completed outcome, not a failure: it routes the plan to a `/red-team` amendment, which is the only place an End state can change. Never re-lock the finish line on a peer's say-so, and never keep patching a link the test has shown cannot be made true.

One-line incident citation: in 2026 a fleet of agents ran a correct backward chain toward a scoring rule that did not exist and had no rewarded exit; the chain was right and the finish line was wrong (the public OpenAI report is the source cited in the examples bank under `## premise`).

## Build variants

The seven fix-applying builds, each with its own variant clause on top of the rules above:

1. FIX_NEEDED: the outcome is the End state the blocking finding cites; the chain ends at the audit pin; every surviving blocker has a `suggested_fix`, and the fix commit closes all of them at the earliest unmet link.
2. ace subset: the outcome is unchanged; the chain covers only the subset's findings; a subset that regresses the re-audit is excised, never re-argued.
3. ace re-entry: the outcome is unchanged; the batch is the absorbs the last re-audit minted; the sibling sweep runs over the whole batch before one commit.
4. ace advisory polish: the outcome is the surface's byte budget and the advisory findings; prose that no longer fits the byte budget moves to a `references/` file with a `when <trigger>, read` pointer, never a reword loop.
5. floor family (add-test, make-pass, cite-budget, package-it): the outcome is the floor's own check; chain from that check to the tip; the corrective round is 1 by definition, because no audit finding is threaded.
6. phase-close sweep: the outcome is the queued absorb rows outside the task diffs; one chain per row's file; the corrective round is 1 by definition.
7. terminal pass: the outcome is the final polish rows on the integrated tip; the corrective round is 1 by definition; a row that needs a new link on any task's chain is a follow-up, never a sweep edit.

## Worked examples

Read [backward-chain-examples.md](backward-chain-examples.md) by tag. Every entry there is abstracted: WAR entries cite an issue and comment, external private entries carry no repo name, number or infrastructure detail (PIN-9).

- sibling: `## sibling` — the eight-round dedup lookup, the four-of-five warning sweep.
- residue: `## residue` — the three rewords against a byte budget, the fixture that never rejected.
- oracle: `## oracle` — the count-equal counterexample, six arms green by deletion.
- consumer: `## consumer` — the recovery-skip reader, the three absorbs inverted for reader reasons.
- upstream: `## upstream` — one weaker link per candidate, the round-4 rule that undid the round-1 clock.
- premise: `## premise` — the smaller poll budget, the correct chain toward a rule that did not exist.
- regression: `## regression` — excise the culprit, never revert the batch.
- off-path: `## off-path` — the one-sentence nit that held a phase, the round-zero escalations.
- convergence: `## convergence` — what one round to unanimity looked like, five times.
