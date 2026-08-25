# The strategy-verifier charter

The adversarial counterweight for the one seat in the pipeline that had none: the
`/war-strategy` interviewer's `Recommended:` beats. Every other WAR seat already has one —
workers get auditors, red-team probes get adversarial confirms, aces get re-audit panels.
This charter defines when a beat **arms**, what the dispatched verifier is told, how its
output rides the beat, how a refutation resolves, what the degraded modes look like, how
skips are recorded, and the state-leak shapes the ledger machinery exists to kill.

Consumers: the bare-invoke `/war-strategy` interview (armed beats in Stage 2, per the
trigger pointer in [plan-interview.md](plan-interview.md)) and `/war-machine`'s grill agent
(the AFK authoring path — its charter carries a consumption pointer here). Both paths read
this file; neither path re-derives the arming rule.

Motivating incident: issue #1548 (2026-08-20) — during the #1547 interview, an external
reviewer session falsified subtle-but-load-bearing errors in six consecutive `Recommended:`
beats that the interview's own recon (~300k output tokens, zero reads outside the plugin
worktree) had not caught. The worked-example table below preserves that incident as the
in-repo calibration data for borderline arming calls.

## The arming principle and its four arms

**Arm any beat whose wrong branch surfaces only at run time.** A doc-track beat whose wrong
branch a reader catches on the page stays unarmed; a beat whose wrong branch shows up as a
mid-run merge conflict, a silently-vacuous guard, or a budget arithmetic error gets the
verifier. Four arms — a beat matching **any** one of them arms:

1. **Engine-semantics change** — the recommendation changes merge, resume, audit, budget,
   or filing semantics.
2. **Mechanism floored into guardrails** — the beat promotes a mechanism into the intent's
   `Binding guardrails:` (floored literals and duties bind every downstream seat; a wrong
   floor is enforced wrongness).
3. **Decomposition/skeleton beat** — always armed on engine-target plans (the phase → task →
   `Files:` skeleton is where same-file collisions, red-tip-illegal splits, and guard-split
   deps edges hide).
4. **Placing or explicitly declining an enforcement layer** — where a guard, floor, lint, or
   duty lives (or the decision that none is needed) determines what a whole class of future
   wrong branches does at run time.

Arming is **by rule, dispatch-without-asking**: the interviewer never asks permission to arm
a matching beat. Skips flow the other way — see WAIVE semantics below.

## The refute charter (what the dispatched verifier is told)

One read-only verifier agent per armed beat, loaded with the run-history corpus (the Stage-0
recon lane's four classes: run manifests · epic phase reports · the war-followup corpus ·
`docs/learnings/` — plus any issue-linked evidence artifacts), dispatched **before the beat
is shown** to the operator, with a single charter:

> Refute this recommendation. Check it against the motivating instances in the linked
> evidence; walk the engine dynamics it touches (integration-tip states between merges,
> resume/journal replay, budget arithmetic, grep-ability of every literal it floors, reader
> journeys for every doc/ADR it places); name what breaks on the wrong branch and which
> existing layer would catch it.

**Output contract** — surviving output rides the beat's `Recommended:` line as exactly one
line:

```
if wrong: <consequence> · caught by: <layer or NOTHING>
```

`caught by: NOTHING` is a legal and load-bearing answer: it tells the operator the beat has
no downstream net, which is precisely when bare assent is most expensive. The verifier feeds
the human; it never auto-accepts, never blocks, and never converts the beat into a question
on its own.

## Refute-flow bounds

- **Successful refutation** ⇒ the interviewer amends the recommendation and **re-arms once**
  — one fresh verifier pass over the amended beat, and that is the bound. The re-armed pass
  does not itself re-arm.
- **Unresolved refute** — the re-armed pass still refutes, or the interviewer cannot amend —
  ⇒ the disagreement becomes a **live fork in the beat**, put to the operator with both
  branches on the record. Never dropped, never looping: the flow is at most
  dispatch → amend → re-arm → fork.

## Degraded modes (three inline stamps)

Fail-open throughout: a degraded verifier never blocks the interview, and degradation is
always **visible inline on the armed beat**, never silent. Exactly three stamps:

- `verifier: corpus-empty — doctrine-only refutation` — the run-history corpus resolved to
  nothing (fresh repo, no runs, no learnings); the verifier still ran, refuting from doctrine
  and code alone. `corpus-empty` counts as the verifier firing.
- `verifier: corpus-partial — missing: <classes>` — some corpus classes resolved and some
  did not; the missing classes are named inline on the beat (e.g.
  `missing: run manifests, epic phase reports`), so the operator can weigh what the
  refutation could not have seen.
- `verifier: unavailable (<reason>)` — the dispatch itself failed (no Agent tool in this
  harness, dispatch error); the beat proceeds unverified with the reason on the record.

## WAIVE semantics (the skip channel)

The default is armed-by-rule; skips are **operator utterances**, never interviewer
inferences:

- A skip may be uttered **anytime** — before the dispatch, mid-beat, or as a **class-scoped
  standing skip** ("skip the verifier on doc-placement beats for this interview"), which must
  carry a **scope** (which beat class) and a **reason**.
- Every waive is recorded as a `WAIVE-<n>` row in the artifact's fix-or-waive channel —
  `WAIVE-<n>` is the skip token; the `PIN-` prefix carries reconciliation join keys only and
  is never used for skips. Each row records **the arming arm that fired** (which of the four
  arms armed the beat being skipped), the beat, the scope, and the reason — the fired arm is
  what makes waive-rate-per-arm telemetry (`/war-review`) able to detect a consistently
  skipped arm and narrow the checklist.
- **Gate-1 enumeration**: at gate 1 (the echo-back-1 confirm gate) every waive — one-shot
  and standing alike — is enumerated aloud before the confirm counts. A standing skip is
  ratified once but read back with every beat it silenced.
- **AFK runs armed-by-rule unwaived.** The `--afk` drafter+grill path has no operator to
  utter a skip, so no waive can exist there: every arming beat arms, every dispatch happens
  (or stamps a degraded mode). A `WAIVE-<n>` row in an AFK-authored plan is a defect.

## The three leak shapes + the duty-class twice-read rule

Ratified interview state leaks between beats and gates in three recorded shapes — the
checklist the echo-back reconciliation reads:

1. **Half-floored pair** — a ratified pair (a literal and its guard, a duty and its pin, a
   lint and its gate half) where only one half reached the floor list; the unfloored half is
   substitutable-without-deviation by the plan's own latitude definition.
2. **Ratified-but-homeless deliverable** — an accepted amendment with no landing place in the
   artifact (no slice, no guardrail, no End state, no non-goal row) — it exists only in the
   transcript, which no downstream seat reads.
3. **Unvalidated join-executor claim** — a beat resolved by asserting some existing seat or
   lens "already reads/joins" the artifact in question, with the claim never checked against
   that seat's actual charter.

**Duty-class twice-read rule**: pins whose landing class is a duty or fence (marked ‡ in the
design tree) are read **twice** at echo-back reconciliation — once in the echo-back's own
sweep, once against the floor list. Motivating instances, from the very interview that
ratified this charter: **echo-back 1 of the authoring-side-verification interview shipped
four duty/fence-class pin leaks**, caught only by operator reconciliation; **echo-back 2,
run under the ledger machinery, shipped zero** — the field trial is its own before/after.

## Worked example: the six-beat incident table (arming calibration)

The #1548 incident, re-read through the four arms — each beat's wrong branch surfaced only
at run time, and each arms under exactly the rule above. The two-arm draft of the arming
rule (engine-semantics + floored-mechanism only) missed beats 3 and 5; they are why the
enforcement-layer and decomposition arms exist. Use this table to calibrate borderline
arming calls: find the row your beat resembles.

| # | Incident beat (#1548) | Firing arm |
|---|----------------------|------------|
| 1 | Ace bisection shape — culprit-first excision, same-file partition, budget arithmetic under the shared `fixRounds` ledger | engine-semantics change (audit/budget) |
| 2 | Consolidation floor — exact title+file dedup keying catches none of the motivating paraphrase-dupes | engine-semantics change (filing) |
| 3 | Touched-doc duty placement — authoring+red-team-only enforcement is pipeline-strength, not run-strength; decompose is the only chokepoint every run passes | placing or explicitly declining an enforcement layer |
| 4 | Absorb eligibility / ADR strategy — no presence guard on the new unmirrored passage; ADR 0012↔0013 discoverability | placing or explicitly declining an enforcement layer |
| 5 | Decomposition — the T1.1/T1.2 split is red-tip-illegal if any drift guard binds the fallback; same-wave same-file doc edits risk a rebase-conflict fix round | decomposition/skeleton beat |
| 6 | Latitude vs guardrails — three operator-ratified pins absent from the floor list; anything not floored is substitutable-without-deviation | mechanism floored into guardrails |

Beats 3 and 5 are the calibration anchors: neither changes engine semantics and neither
floors a mechanism, yet both wrong branches surface only at run time — which is the arming
principle doing the work the two-arm enumeration could not.
