# Backward-chain doctrine — the auditor

The auditor's chain for a re-audit. The seat stays read-only: it reads the pinned sha, the fix commit body and the threaded history with the allowlisted git read verbs, and it writes only a verdict. From corrective round 2 the seat is the classifier and the oracle. Classifier: every re-block carries one `relation:` tag that names how the new blocker relates to the last fix, and that tag selects the fixer's examples. Oracle: the seat runs its own chain from the cited End state and judges the fixer's chain against it; the fixer's markers are self-reports, never evidence.

The `## The rules` section rides byte-equal in the roster-seat audit prompt built by `skills/war/assets/workflow-template.js` at corrective round 2 or later, pinned by the `workflow-template.test.mjs` fixture `backward-chain: audit rules gated on corrective round`. Round-1 audit prompts are unchanged, byte for byte (PIN-10): a first audit has no fix to relate to. The three gate-audit-family seats (per-task, integrated-tip, end-state) judge executed gate evidence, never a fix, and carry no backward-chain clause. The depth sections below are read by pointer: the prompt names the section for the corrective round it dispatches.

## The rules

1. Chain from the cited End state to the tip YOURSELF first. Then read the fix commit body (`Outcome:` `Chain:` `Bottleneck:` `Fix:` `Ignore for now:`). Then diff the two chains: a link in yours that the fixer's chain skips is the finding.
2. Check the outcome citation. A `fix:` that cites no End state number or `Done when:`, or cites one the diff does not serve, is a finding whose severity follows its consequence: Major when the diff serves nothing on any chain, Minor when the citation is wrong and the diff still serves a chain.
3. Write exactly one line `relation: <tag>`, lowercase, as the LAST line of the rationale on every blocking finding. The tag is one of: sibling, residue, oracle, consumer, upstream, premise, regression, off-path. No other value, no second tag line.
4. Name the bottleneck. The earliest unmet link on your chain is the one finding on the chain you file as blocking; findings downstream of it are notes that cite it, and you re-check each at the new sha. A downstream note that survives the bottleneck's fix becomes a sibling finding in that round.
5. Thin evidence lowers certainty and severity together. A claim you could not verify at the pin (the file you did not open, the branch you did not trace, the fixture whose assertions you did not read) is stated as unverified and rated at most Minor.
6. Off the chain lowers no Critical. A defect that breaks a landed behavior stays Critical wherever it sits. An off-chain Minor or Nit never holds a task: dispose it per your card's disposition rule, never request_changes.
7. Audit the `Ignore for now:` list with severity by consequence. An ignored item that is a link on your chain is a finding at that link's severity; an ignored item that is off every chain is a note.
8. State what your own `fix:` does to the thing it does not mention: the neighbor state, the other caller, the reader of the value. A `fix:` that widens what a consumer receives names that consumer.

## Round 2

The prompt carries the threaded prior round: the history digest (each prior blocker's title, file, severity, `relation:` tag and `upstream link:` line; the fixer's `Fix:` and `Ignore for now:` lines; the task's relation-tag sequence) and the worker's round-1 `Critical path:` block. Read the worker's chain as a claim about the task, not as your chain; run yours from the same End state and diff them.

Peer count is not evidence (ADR 0041). A finding three seats share is three claims to verify at the pin, not one verified claim. A peer finding you cannot reproduce at the sha is stated as unverified in your rationale, never carried forward on the strength of its authors.

Write `upstream link:` in the rationale before the `relation:` line: the link on your chain the new blocker descends from, in one sentence.

## Round 3 and later

The prompt carries every prior round's digest lines and the task's relation-tag sequence, in order. Read the history as one chain, not as a list of rounds. The sequence itself is evidence: sibling, then residue, then consumer on one construct says the fixes landed at named sites and the common ancestor is still open.

Name the common ancestor in `upstream link:`: the one link every prior blocker descends from. Your `fix:` names the class-level change at that link (a shared predicate, a helper, a proof), never the newest site. A `fix:` that names a site the fixer already patched once is a round wasted.

## Round 5 and later

Disclosed only at corrective round 5 or later (PIN-3). Everything above still applies first.

Test the End state yourself with the read verbs and the Read/Grep/Glob tools only. Read its `check:` or `Done when:` command, then trace at the pin each link that command measures. The seat never executes the command. If the check cannot be made true by any change inside the task's `Files:`, or contradicts the code it measures, file one finding tagged `relation: premise` whose title names the End state number and whose rationale quotes the check's command and the pinned content that cannot satisfy it. That finding tells the fixer the outcome is the defect, and the fixer's `PLAN-DEFECT:` return is the completed outcome.

Never file that finding before this tier: at rounds 2 to 4 a class that keeps re-opening is a shape signal for the fixer, not evidence against the End state. The slice-level `PLAN-DEFECT:` route (a plan that contradicts the code) is unchanged and stays available at every round; it is the worker's return, not a seat's finding.

## Variants

- Delta-scaled re-audit: the seat re-runs `git diff --name-only <sha>^ <sha>` itself and chains only over the files the ace commit touched; a changed file outside the claimed set is `scopeBreach: true` and the full panel re-runs. The `relation:` tag is still owed on every re-block.
- Pin-content re-audit: the seat judges the pinned content against the approved tree, with no threaded findings and no corrective round; it is round 1 by definition and carries no backward-chain clause.

## Worked examples

The lone-dissenter splits live here, never in the rules. Read [backward-chain-examples.md](backward-chain-examples.md); the entries whose `Roles:` line names the auditor are the ones for this file. Every external private entry is abstracted: no repo name, number or infrastructure detail (PIN-9).

- One seat blocked on an off-chain doc sentence while three approved, and the split rule, not the severity, escalated the phase: `## off-path`, `one-sentence-nit-held-a-phase` and `round-zero-escalations-on-specified-majors`. The split was a claim to verify, not a vote to count.
- A seat's count-only repair was refuted by a second graph with equal counts: `## oracle`, `count-equal-counterexample-forced-tree-equality`.
- A recommendation cited an issue and contradicted its own comments: `## premise`, `recommendation-cited-the-issue-and-contradicted-its-comments`.
- Two seats agreed on a Major the field-keyed rule missed, and the producer was the unnamed link: `## upstream`, `round-four-rule-undid-the-round-one-clock`.
