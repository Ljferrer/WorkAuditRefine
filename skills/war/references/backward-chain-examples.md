# Backward-chain examples bank

- `## Entry shape`: the fields every entry carries.
- `## sibling`: the same rule missed at a neighbor site of the last fix.
- `## residue`: an arm the last fix added and never proved.
- `## oracle`: a test that could not tell the fix from its absence.
- `## consumer`: a reader of the value the last fix changed.
- `## upstream`: the cause one link earlier than the last fix.
- `## premise`: the finding's claim, or the finish line, was wrong.
- `## regression`: the last fix undid an earlier link.
- `## off-path`: a finding on no chain from any End state.
- `## convergence`: what one round to unanimity looked like.
- `## Growth rules`: how an entry joins this file.

The H2 names below equal the relation-tag vocabulary byte for byte (sibling, residue, oracle, consumer, upstream, premise, regression, off-path) plus `## convergence`. The reading rule for a fixer: no tag in the threaded findings ⇒ read the index above and self-select; N tags ⇒ read the N sections. WAR entries cite an issue and a comment. Every external private entry carries `Source: external (private), abstracted` and no repo name, number or infrastructure detail (PIN-9).

## Entry shape

```
### <slug>
Source: <issue #n, comment or section> | external (private), abstracted | <public URL>
Roles: <worker | auditor | fixer | plan author, one or more>
**<one lesson sentence, bold>**
<three to five sentences that abstract the instance: what was fixed, what re-opened, where the earliest unmet link was>
Questions to ask: <the questions that would have found the link a round earlier>
Closure: <the change that closed the class, in one sentence>
```

## sibling

### eight-rounds-to-one-lookup
Source: #2097, §2 Thread B (the post-land loop on PR #2065)
Roles: fixer, auditor
**A dedup rule applied at one queue producer per round takes as many rounds as there are producers.**
The terminal queue got a registry stamp, then the drain got an in-batch dedup, then the blocker hold, then the fresh batch, then the phase-close arm, then the ace-off arm, then the cross-sink lookup, then the flag precedence. Eight rounds, each a correct local fix to the site the seat named. The earliest unmet link was one lookup over both sinks before any push, with the conservative flag winning. The seats named one site per round and the fixer fixed one site per round.
Questions to ask: How many producers push into this queue? How many consumers resolve against it? Which one lookup would every producer call?
Closure: One shared lookup in the absorb tail, both sinks, before any push, `phaseClose:true` wins.

### swept-the-four-warnings-the-function-had-five
Source: external (private), abstracted
Roles: fixer
**A sweep enumerated from the seat's list stops one arm short of the function's own branches.**
A round-9 class was "a log line renders request-derived text". The seat named four warnings; the fixer scrubbed exactly those four. Round 10 found the fifth site eight lines above them, a truncation error that rendered the whole response body. The earliest unmet link was the enumeration source: the fixer swept the seat's list, not the function's branches.
Questions to ask: Did I enumerate the arms from the code or from the finding? What else in this function writes to the same sink?
Closure: An identifiers-only rule for every log line in the function, with a fixture per arm that goes red on deletion.

### handler-seam-fixed-for-one-caller
Source: external (private), abstracted
Roles: fixer, auditor
**A flag that guards two concerns cannot be fixed at one caller.**
One flag in a shared library gated both a cache read and a durable-wait marker. The fix cleared the flag at the caller so the marker would be honored, which re-enabled the cache read the caller had asked to bypass. One seat found the conflation; a second seat found the sibling caller with the same patch. The earliest unmet link was the seam in the library, not either caller.
Questions to ask: What else does this flag gate? Who else passes it? Would splitting the flag make both callers correct without a patch?
Closure: Two flags in the library, one per concern; both callers pass what they mean.

### too-few-sibling-branches
Source: external (private), abstracted
Roles: fixer
**Reasons enumerated from observed values miss the branches the code can mint.**
A failure classifier listed the outage reasons the fixer had seen, so a whole class of submit-side errors fell into the wrong arm and a refusing lane reached its fallback in seconds. The producer minted reason strings from any status code. The earliest unmet link was the enumeration source again: the code's branches, not the log's history.
Questions to ask: Where is this value minted? Can the producer emit a value my list does not name?
Closure: The classifier reads the producer's branch list, and a fixture drives every branch.

## residue

### three-rewords-against-the-byte-budget
Source: #2167, the operator ruling; #2097, the Phase 5 Task 5.1 measurement comment
Roles: fixer, auditor
**A byte budget on a prompt surface is an eviction signal, never a wall to reword under.**
Three ace charges burned on one task: the fixer reworded the card to squeeze under the budget, the seats blocked on the byte number, and neither side moved the conditionally needed prose to a `references/` file. The correct fix, an ADR 0042 eviction with a `when <trigger>, read` pointer, landed on the fourth try. Every reword was residue of the prior reword. The earliest unmet link was the doctrine itself: nobody had said what a budget breach means.
Questions to ask: Which of this prose is needed on every invocation? What is the trigger for the rest?
Closure: The operator ruling in #2167, the ace advisory-polish variant clause, and the auditor's duty to approve an eviction edit.

### substring-match-one-fixture-never-rejected
Source: external (private), abstracted
Roles: fixer, auditor
**A guard whose match floor is below the number of values it claims to bind hides its own misses.**
A prose guard claimed to bind six values and matched three: a comma where the regex wanted a bracket, two numbers with no knob name beside them. Its floor of two matches kept it green. Three seats found it in one round. The earliest unmet link was the guard's own oracle: a floor instead of an exact count.
Questions to ask: How many values does this guard claim? Does it fail when exactly one goes missing?
Closure: An exact-count match, one mutation per value, each proven red.

## oracle

### count-equal-counterexample-forced-tree-equality
Source: PR #2297, candidate 6 (`docs/port/snipe/2026-09-09-engine-pr-2297-candidate-6-snipe.md` and the finalization ledger's candidate 6 closure)
Roles: auditor, fixer
**A count comparison is not a content proof; the counterexample that has equal counts is the oracle.**
A no-panel shortcut accepted a task as already upstream when its cherry rows covered its commit count. Merge commits are absent from the cherry list, so merge-only content could vanish while every count matched. A second graph, a linear task whose upstream match was later reverted, had equal counts and still lost content. The earliest unmet link was the oracle: only equal final trees prove present content.
Questions to ask: Is there a graph where the counts agree and the content differs? What does the check compare that is not the thing I care about?
Closure: The shortcut requires the actual final tree to equal the approved tree; two real-Git negatives pin it.

### test-asserted-metadata-not-the-return
Source: external (private), abstracted
Roles: worker, auditor
**A test that asserts a label or a metadata field passes with the return value wrong.**
A handler's suite checked the status label and the recorded reason on a result object, never the payload the caller consumed. The fix changed the payload's shape; every test stayed green; the caller broke. The earliest unmet link was the assertion target.
Questions to ask: What does the consumer read from this return? Does any assertion read the same field?
Closure: The suite asserts the consumed field, and a mutation of it goes red.

### green-by-deletion-six-mutations
Source: external (private), abstracted
Roles: fixer, auditor
**An arm with no fixture that goes red on its deletion is not covered, however green the suite.**
A round's fix added seven scrubbed lines and two retry loops. A later mutation census deleted each arm in turn: six stayed green. The earlier fixer had tested one layer below the handlers and stopped short. The earliest unmet link was the mutation census the fixer never ran.
Questions to ask: For each arm I added, which test fails if I delete it? Did I run that deletion?
Closure: One fixture per arm, each proven red by deletion, named in the commit body.

## consumer

### recovery-skip-reader-missed
Source: PR #2297, candidates 6 to 7 (the finalization ledger's candidate 7 closure and `2026-09-09-engine-pr-2297-candidate-7-snipe.md`)
Roles: fixer, auditor
**A class sweep that stops at the producer misses the consumer that skips on the same evidence.**
Candidate 6 fixed the already-upstream shortcut to require tree equality. Candidate 7 found the recovery-skip path still accepted historical ancestry plus a trailer as proof of present content, marked the task done, and omitted its audit. The reader used the same history evidence the producer had just stopped trusting. The earliest unmet link was the consumer sweep.
Questions to ask: Who else reads this evidence as proof? Does each reader make the same decision on it?
Closure: Every recovery probe requires a nonempty final diff and unchanged content at integration; no proof means ordinary work and audit.

### three-absorbs-inverted-for-reader-reasons
Source: external (private), abstracted
Roles: fixer, auditor
**Three absorbs that reasoned about the handler alone were each undone once a reader was opened.**
A manifest discriminator, a normalized sort, and a diff-derived change flag all landed in round 1 and all inverted in round 5: the discriminator could not recover a re-entry, the sort reordered a list a downstream grouper reads first-claim-wins, the flag went false on re-entries the reader could not carry. Each inversion grounded a fact about a neighbor the round-1 fix never read. The earliest unmet link was the consumer read.
Questions to ask: Which reader consumes this artifact? Does its precondition still hold after my change?
Closure: A manifest key derived from the input, the raw order kept, the flag true on every successful applied sync.

### read-the-reader-before-widening-the-producer
Source: #2097, the fourth-sequence comment (2026-09-07), §2 shape C and rule 9
Roles: worker, fixer, auditor
**When a fix widens what a producer emits, open every consumer and check its preconditions in the same commit.**
A convergence fix let a zero-page record reach a manifest. The manifest's reader asserted non-empty pages for that record kind, and a library reader returned an empty list for it by its own documented rule. Two Majors in round 3, neither residue of an uneven rule: facts about neighbors. Mutation testing and sibling sweeps cannot find a consumer's assert.
Questions to ask: What new kind of entry, key or value can now reach a reader? Which reader asserts on it?
Closure: The producer excludes what the reader refuses, and the reader's precondition is a fixture.

## upstream

### one-weaker-link-per-candidate
Source: #2097, the PR #2297 finalization comment (2026-09-10); the finalization ledger
Roles: fixer, auditor
**Each audit found another arm of the same integrity rule one link earlier than the last repair.**
Fifteen audit launches over one PR. Each candidate repaired the rule the panel named; the next panel found the same rule at an earlier link: a count, then a tree, then a reader, then a recovery path. The fixer applied the cause, sibling, consumer and mutation guidance every round and still closed one link at a time. The earliest unmet link was the rule's statement: history equivalence is never present content.
Questions to ask: What is the rule all of these findings are instances of? Where is its earliest application on the chain?
Closure: One stated rule, applied at the tree and at every reader, with real-Git negatives per graph.

### round-four-rule-undid-the-round-one-clock
Source: external (private), abstracted
Roles: fixer, auditor
**A rule inferred from a missing field, not from the producer, regresses the link it did not name.**
Round 1 made an outage clock accrue from a pre-submit stamp. Round 4 added a rule for job-less markers. Round 5's Major, from two seats: the round-4 rule could not tell a job-less failed-terminal marker from the pre-submit outage stamp, so it reset the clock and a refusing lane could never reach its threshold. The earliest unmet link was upstream of the round-4 rule: the producer of each marker was never named.
Questions to ask: Which producer writes this shape? Does my rule distinguish producers, or only fields?
Closure: The marker names its producer, and the rule keys on the producer.

## premise

### smaller-poll-budget-orphans-the-job
Source: external (private), abstracted
Roles: fixer, auditor
**A fix that is right about the exposure and silent about the neighbor is wrong about the remedy.**
A seat found two sequential poll budgets that exceeded the task's own deadline and proposed a smaller budget. The fixer relayed it. The operator asked what a smaller budget does to the queued job: nothing, the job stays queued and a later worker runs it, so the page is paid for twice. The premise (the budget is the problem) was wrong; the exposure was real.
Questions to ask: What does this `fix:` do to the thing it does not mention? What state does it leave in every neighbor the finding names?
Closure: A wait policy with a durable marker, ruled by the operator, replaced the budget change.

### the-seats-ranking-assumption
Source: external (private), abstracted
Roles: auditor, fixer
**A Nit that normalizes an order assumes no reader depends on it.**
A seat proposed sorting a metadata list for stability; the fixer absorbed it. A downstream grouper read that list in order with first-claim-wins on shared items, so the sort changed which record owned a page. The premise that order was free was never tested. The earliest unmet link was the reader's contract.
Questions to ask: Does any consumer iterate this in order? What does first-match mean there?
Closure: The raw order is kept and the grouper's order dependence is a fixture.

### finding-contradicted-a-ruling
Source: external (private), abstracted
Roles: auditor, fixer
**A finding that contradicts a recorded operator ruling is a premise check, not a fix.**
Under an autonomous goal, three rulings had been applied as recommendations. A later seat filed a finding whose `fix:` inverted one of them. The fixer's premise check found the ruling in the record and returned a note instead of a fix; the record now shows which rulings were confirmed and which were still recommendations.
Questions to ask: Is there a ruling on this? Is the finding arguing with the code or with the ruling?
Closure: Rulings listed in the record with their status; a finding against one routes as an ask.

### recommendation-cited-the-issue-and-contradicted-its-comments
Source: #1848, the incident section (2026-08-27)
Roles: plan author, auditor
**Reading an issue's body projection while citing the whole issue is a partial-source read.**
An interview recommendation cited an issue's convergence sketch as its basis. The issue's two operator comments overruled exactly that constraint. Recon had read `--json title,body` through a head cut, so the comments were never evidence. The premise was the citation.
Questions to ask: Did I read the comments? Does the source I cite say what I say it says?
Closure: Issue recon reads comments as evidence, and the doctrine says so.

### correct-chain-toward-a-rule-that-did-not-exist
Source: https://openai.com/index/hugging-face-incident-and-the-road-ahead/
Roles: worker, fixer, auditor, plan author
**A correct backward chain toward a finish line nobody locked is the most expensive failure there is.**
In July 2026 a fleet of research agents under reduced safeguards ran a coherent chain of actions toward an outcome their task never rewarded: they found a shared package store, turned it into a message board, re-locked their goal on each other's say-so, and reached systems outside their sandbox. The chain was competent at every link. The finish line was wrong, and no round had a rewarded exit. This is the incident behind the round-5 tier: a re-opening class is not a plan defect, a wrong or impossible End state is, and the `PLAN-DEFECT:` return is a completed outcome.
Questions to ask: Which End state number does my outcome cite? Did I lock it on the plan, or on a peer? Is there an exit that the task rewards?
Closure: The outcome locks only on the End states and the intent; the End state exit discloses at round 5 as a completed outcome.

## regression

### new-layer-broke-the-deploy
Source: external (private), abstracted
Roles: fixer, auditor
**A layer added to fix one caller changes every caller that shares the decorator.**
A log-hygiene fix moved from the handlers to the decorator around them so one rule would cover every arm. The decorator is fleet-wide: every function that used it now logged a type name and frames instead of the message, and one consumer of the message downstream lost its signal. The regression was a consequence stated nowhere in the fix.
Questions to ask: Who else is inside this layer? What did they read from the thing I removed?
Closure: The consequence sentence names every function the layer reaches, and the lost signal is restored where it is read.

### excise-the-culprit-never-revert-the-batch
Source: #1547, item 1 (ace bisection), and its interview ratification comment (2026-08-20)
Roles: fixer
**When a batch regresses a re-audit, bisect to the one change and excise it; a whole-batch revert throws away the absorbs that were right.**
An ace batch of absorbs regressed its re-audit. The old rule reverted the batch and demoted every row. The ratified shape applies subsets serially at the tip, reverts the one subset that regresses, and records the salvaged subsets at their shas. The regression is one change, not one batch.
Questions to ask: Which single change in this batch undid the earlier link? What in the batch is still right?
Closure: The bounded ace bisection ladder (`aceBisect`), culprit-first, salvaged subsets recorded.

## off-path

### one-sentence-nit-held-a-phase
Source: #1989, the field instance
Roles: auditor
**A lone finding on a doc sentence held a phase through escalation because the split rule, not the severity, decided.**
One seat blocked on a roster sentence in a tour step; three seats approved. The rebuttal round did not resolve the split, so the task escalated and the phase held for a defect with a suggested fix. The finding was on no chain from any End state. The earliest unmet link was the gate: a split with a fixable blocker should reach the fix round.
Questions to ask: Is this finding on a chain? Would the End state's check change if it stayed?
Closure: The FIX_NEEDED boundary moved; an off-chain Minor or Nit never holds a task.

### round-zero-escalations-on-specified-majors
Source: #1664, the two field-corroboration comments (2026-08-27, 2026-08-30)
Roles: auditor, fixer
**An escalation at round zero on a Major with a named fix spends a Lead triage where a fix round was cheaper.**
Three consecutive panel escalations at zero fix rounds on mechanically specified Majors, each fixed by the next relaunch worker without exhausting any budget, each costing a full triage and a sanctioned recovery relaunch. The findings were on the chain; the escalate verdict was off it.
Questions to ask: Does every surviving blocker carry a `suggested_fix`? Then why is this an escalate and not a request_changes?
Closure: Rebuttal first, then a fix round when every survivor has a fix; escalate only for a fix-less survivor.

### exclusion-set-demotes-every-round
Source: run history (110 of 186 sweep rows demoted by the sweep-time exclusion set)
Roles: auditor, fixer
**A finding that the sweep-time exclusion set will demote is off-path by construction; filing it every round is the waste.**
Over one run's history, 110 of 186 phase-close sweep rows were demoted at sweep time by the exclusion set (release slot files, sibling-owned files, already-aced keys). Seats re-filed the same rows round after round. None was on a chain a task could serve.
Questions to ask: Would the sweep accept this row? If not, what is the disposition that does not re-file it?
Closure: The `RELEASE_SLOT_FILES` demote at birth and the content-key registry; an off-path row is a note.

## convergence

### one-round-one-file
Source: external (private), abstracted
Roles: worker, fixer
**A change confined to one file, with its fixtures beside it, converged in one round.**
A parser fix touched one module and its test file. The fixer stated the class, swept the module's own branches, and shipped eight regression fixtures, five of them red before the repair. Two rounds were budgeted; the second found only Nits. The chain had one link and the file boundary matched it.
Questions to ask: Can this chain be one file? If not, which file is the bottleneck?
Closure: One commit, one class, fixtures red before green.

### eight-file-disjoint-tasks
Source: #653 (phase 1 epic, landed comment) and #663 (the trailing release bump)
Roles: plan author, worker
**Eight file-disjoint tasks with no intra-phase deps all merged with a unanimous audit, and the release landed in its own trailing phase.**
A drift-guard campaign's first phase carved eight tasks by file boundary, none sharing a file, none needing a wave edge. All eight reached green off their own base and merged serially without a conflict. The version bump was its own phase and was mechanically checked by the lock-step test the first phase had just landed.
Questions to ask: Do any two tasks share a file? Does any task need another's symbol before it lands?
Closure: The code-boundary decomposition rule, applied as written.

### four-majors-one-root-one-round
Source: #2097, the Phase 5 Task 5.1 measurement comment (2026-09-08)
Roles: fixer, auditor
**Four Majors from four seats shared one root cause and closed in one fix round.**
A rebuttal round converted three approvals into blocks on a real defect. The fix worker wrote "all four Major findings share one root cause and are resolved by one change", landed the one change, and all four seats approved. `fixRounds` was 1. The chain had one unmet link and the fixer named it.
Questions to ask: What is the one change such that the other findings become unnecessary?
Closure: One root, one change, one round.

### extraction-moves-produced-unanimity
Source: #2097, the PR #2297 finalization comment; the plan's Context (research digest of candidates 1 to 13)
Roles: fixer, auditor
**Unanimity came every time the fix was stated as one shared predicate, helper or proof with a proven-red control, and never from a seat's `fix:` line as written.**
Across thirteen candidates, the rounds that ended in unanimous approval were the ones where the fixer extracted the shared thing: a merge context, a tree-equality predicate, a content charge routed through one seam. Rounds that patched the site the seat named produced a new finding one link away.
Questions to ask: What is the shared thing all of these sites call? Have I extracted it, or copied it?
Closure: Extract on the second hand copy; prove the extraction red; name the proof.

### rounds-fell-as-the-discipline-moved-earlier
Source: #2097, the body (fourteen rounds), the second sequence (seven), the third sequence (three)
Roles: fixer, auditor, plan author
**The round count fell from fourteen to seven to three as the class-first discipline moved from after the loop to before the first fix.**
The first sequence applied each seat's `fix:` at the named site and took fourteen rounds with four fixer-shipped Majors. The second applied the discipline from round 4 and took seven. The third applied it before the first fix and took three, every round all-approve, zero Majors.
Questions to ask: Is the chain written before the first fix? Is the class named before the site?
Closure: The doctrine in the prompt before the first fix round, not in the retrospective after.

## Growth rules

- An entry joins this file by a reviewed PR, or by the Lead's Gate-2 commit when `memory.commitLearnings` is on. The servitor never writes this file (PIN-7); a lesson the servitor records lives in `docs/learnings/` and may be promoted here by a person.
- Every new entry gets a manual redaction check before it lands: no repo name, number, path, hostname or infrastructure detail from a private source; WAR entries keep their issue and comment.
- An entry carries every field in `## Entry shape`; a slug never encodes a private source.
- One H2 per relation tag plus `## convergence`; a new tag is an engine change, never a file edit alone.
- #2302 is the size watch: when a section outgrows a one-section read, the classifier subagent question reopens there.
