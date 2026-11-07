# Finding class — behavior or cosmetic, and the stale-looking-but-correct calibration

The `## Finding class` section is born cold here (plan 2026-11-04-late-defects-fixed-in-run, Task 2.1, D2/D7/D24). The `### Stale-looking-but-correct calibration` block under `## Moved from the auditor card` is a verbatim eviction from `agents/war-auditor.md` (same task, ADR 0042): it was byte-identical to its pre-eviction card text **at eviction time** (2,516 B, heading through the trailing blank line). The card keeps the same `###` heading over one trigger pointer to this file, and the dispatched `STALE-LOOKING-BUT-CORRECT CALIBRATION` skeleton in `workflow-template.js` still carries rules 1 to 4. The `late-defect: class` rows in `skills/war/assets/reference-link-integrity.test.mjs` pin the block by digest, so a sanctioned later edit re-pins the digest in the same commit with its rationale.

## Finding class

Set `findingClass` on each Minor and Nit. The values are the `FINDING_CLASSES` export in `skills/war/assets/land-decision.mjs`. The class is orthogonal to severity and to `disposition`.

- **Behavior:** the change does the wrong thing when it runs, or a doc teaches a rule the code does not follow. Examples: a wrong branch, a dropped case, a guard that never fires, a prompt that names the wrong route, a test that cannot fail.
- **Cosmetic:** only wording, layout, naming or a comment is off, and no run or reader acts differently because of it.
- **The test:** ask whether a run, or a reader who follows the text, acts differently once the fix lands. Yes is behavior. No is cosmetic.

How the engine routes the class:

- A behavior defect this task adds stays a finding even when the slice pins its mechanism. The latitude rule licenses the pinned mechanism, never a defect inside it. Route the finding `absorb` or `ask`, never `note`.
- The intake floor turns a behavior `note` with a fix on a named file into `absorb`. In the task diff it joins the task's ace batch. Outside the diff, or with no diff probe, it rides `phaseClose:true` to the behavior-row sort (PIN-21), which sends it to the late-fix pass or demotes it naming the owner. Any other behavior `note` parks as an ask for the Checkpoint ruling. The gate-audit floor pass applies the same rule, always through the behavior-row sort.
- A cosmetic row, or a row with no class, keeps today's route. Intake drops a value outside the export, so that row reads as classless.

## Pre-ace probe

A regressed ace re-audit dispatches one PRE-ACE PROBE seat per Critical or Major blocker, before the engine names culprits or reverts a range (plan 2026-11-04-late-defects-fixed-in-run, D3/D11, PIN-3/PIN-11). The seat is read-only and judges one question: does this blocker already exist at the pre-ace tip, the tip the ace commit was cut from? That tip is the approved tip, or the post-revert tip at an `aceBisect` subset or an `aceReentry` batch.

- Read the pre-ace tip through git only, with `git show <pre-ace sha>:<file>` and `git diff <pre-ace sha> <ace sha>`. The task worktree sits at the ace tip, so a plain file read shows the wrong commit.
- Return `{ exists: 'yes' | 'no' | 'unknown', evidence }`. `evidence` names the lines you read.
- `yes`: the same defect is there at the pre-ace tip. The engine keeps the ace's absorbs, counts your seat as approving that blocker for that re-audit (the batch, the subset or the re-entry batch), and sends the blocker to the late-fix pass.
- `no`: the ace commit added it. Today's regression arms run: culprit excision, halving, or the whole-range revert.
- `unknown`: git cannot settle it. The engine reverts as today, and the blocker still joins the late-fix pass as a `behavior` row. A dead seat or a malformed answer reads as `unknown`.
- Never answer `yes` to save an absorb. A wrong `yes` keeps a regression on the branch until the late-fix pass fixes it.

## Moved from the auditor card

### Stale-looking-but-correct calibration

Five authoring patterns read as drifted but are correct-by-construction; do not re-litigate them. Each rule demotes **only when the live artifact confirms** the candidate — this is a confirmation-gated floor, never a blanket amnesty (absent the confirmation, judge the pattern on its merits):

1. **Literal-vs-candidate drift.** A plan literal diverging from the candidate on a line range, a suite count or enumeration, or a version bump is a Nit at most — never a hold — only when the live artifact confirms the candidate correct: the enclosing construct (the locator symbol or comment header), the self-discovery gate (`resolveGate` in `war-config.mjs`), or the worktree release baseline; absent that confirmation, judge the divergence on its merits.
2. **Dangling cross-slice ref.** A reference dangling at a task tip — a field, constant, or prose ref not yet emitted — is a defect only if the plan lacks the defined-but-not-yet-emitted, produced-in-Task-N cross-link; with that cross-link present and the referent confirmed at the post-merge integration tip it is a Nit or note, and you treat it as a hold only when the live artifact confirms the referent is genuinely absent at that landed tip.
3. **Untouched plan file-list entry.** A plan file-list naming a file the diff never touches is a finding only when the live artifact confirms the guard has no other real home — grep the sibling or precedent first; a location gap or a drift-guard-forced cascade touch elsewhere is a faithful deviation (Nit), and you block only on a claim demonstrably untrue at the tip.
4. **Grep-sweep floor.** A grep sweep is a floor, not a ceiling — treat a surviving sibling as the worker's omission only when the live artifact confirms the plan carried the same-scope manual title and comment survey and the sibling fell inside it; a straggler outside the swept scope is a survey-derived correction, not a regression.
5. **Deliberately-unwired marker.** A construct that reads as dead code — a function, constant, or branch never called — is **not** a dead-code finding when an adjacent `ponytail:` / `deliberately-unwired:` comment states *why* it is intentionally uncalled (invariant documentation, a deliberate ceiling, a mirror kept in sync by hand); re-flagging such a marked construct is out of scope. The confirmation is the marker itself: absent a `ponytail:`/`deliberately-unwired:` rationale comment on the construct, dead-code findings proceed as usual.

