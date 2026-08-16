# Red-team rounds are budgeted, and chronic under-specification routes upstream — by arithmetic, never a verdict

**Status:** accepted (design ratified 2026-08-05 — red-team F3/F4 + D3/D10, operator-ratified;
implemented by the plan below)

[ADR 0043](0043-adjudicated-clear-distinct-terminal-verdict.md) landed `ADJUDICATED` as a
gate-emitted proceed verdict with the stamp-never-remove mechanic, and Step 5 bounded
re-verification at ≤ 2 attempts per blocker — but nothing counted rounds cumulatively across
`/red-team` invocations, no config key bounded them, and no exit routed chronic
under-specification back to the interview: a plan that could not stop churning in verification
had nowhere to go but another sweep. `/war-campaign`'s step 3 hid the gap behind one undefined
word ("Unresolvable → halt-and-hold"). The round census behind the calibration: across the 12
newest reports (2026-07-26 →) the median is 2 invocation-rounds; the 7-round outlier
(`2026-07-24-runbook-and-standing-record-coherence`, just outside that window) had rounds 2 and 4 entirely patch-induced —
pre-ADR-0043 behavior the stamping mechanic already retired. This ADR ratifies the loop-budget +
route-upstream contract. Full mechanics:
[the precision-chain & loop-breaker plan](../plans/2026-08-05-precision-chain-and-loop-breaker.md)
(D3/D4/D10, Phase 4, Tasks 5.1/5.5).

## Decision

**Rounds are counted cumulatively per plan against a configured budget, and the gate emits a
typed `routeUpstream` output field — computed by pure arithmetic over the unstamped subset —
that routes chronic under-specification back to the `/war-strategy` interview. It is never a
verdict.**

1. **The rounds unit.** A **round** is one full grill sweep — one pass through the open
   blockers/`needsDecision` set. That is the only unit "round" carries; the per-blocker bound
   `/red-team`'s Step 5 already imposed is counted in **re-verify attempts (≤ 2 per blocker)**, a
   deliberately distinct term so the two bounds can never be conflated. Rounds count
   cumulatively across `/red-team` invocations of the same plan: the churn the loop-breaker
   exists to stop spans runs, and a counter that resets per invocation cannot see it.
2. **Seeding — the Rounds header.** Every report carries a dedicated `**Rounds:** <integer>`
   line directly under the Verdict line. The **Lead** seeds the cumulative count at Step 1 by
   the strict-form rule: glob `docs/red-team/*-<plan-slug>.md`, take the newest by filename
   date, read its first line matching `^\s*[-*]?\s*\*\*Rounds:\*\*\s*(\d+)`. Anything else —
   no prior report, no matching line, a non-integer value, every legacy variant — seeds **0**:
   fail-open, clean slate (no legacy report matches the strict form; cumulative counting starts
   fresh with new-template reports). The gate stays integers-only and never parses markdown —
   report reading is Lead work, arithmetic is gate work.
3. **The budget knob.** `run.redteamRoundLimit` — integer ≥ 1, default 3 (one round above the
   census median), economy preset 2 — lives in the run config beside `run.roundLimit`, never
   inside `agents.redteam` (that key is a validated `{model, effort}` tier). Step 3's fail-open
   config read resolves it; absent or invalid ⇒ the default 3. The limit is never unset —
   config only overrides it.
4. **The typed output field.** `red-team-gate.mjs` accepts optional `rounds` / `roundLimit`
   (input keys, or `=`-attached flags `--rounds=<n>` / `--round-limit=<n>`), echoes both in the
   output, and emits `routeUpstream: boolean` by pure arithmetic over the **unstamped** subset
   (`adjudicated !== true`) of the existing typed buckets:
   `(rounds ≥ roundLimit && open.some(unstamped)) || (rounds ≥ 2 && needsDecision.some(unstamped))`,
   where `open` is the gate's existing blockers+`needsDecision` union and an `INCOMPLETE`
   coverage gap short-circuits to `false` first. The second arm routes chronic
   under-specification earlier than the general limit: an under-specified decision that survives
   one adjudication attempt is interview material, not sweep material. No NLP, no text
   classification; absent inputs ⇒ absent outputs (byte-compat for every caller that threads no
   rounds). Every gate computation of a run — the first pipe and every re-pipe — carries
   `--rounds=<n> --round-limit=<resolved>`.
5. **Never a verdict — ADR 0043 precedence untouched.** `routeUpstream` is a typed gate *output
   field* riding beside the verdict — never a sixth verdict, never a `KNOWN_LAND_DECISIONS`
   member, never Lead-invented prose. The verdict set and its precedence
   (`INCOMPLETE` > `BLOCKED` > `ADJUDICATED` > `CLEARED-WITH-NOTES` > `CLEARED`) are a closed
   contract this ADR does not reopen; routing is orthogonal metadata, the same pattern as
   `defectClass` and `gate-failure class` (ADR 0005 enum discipline). Because both arms key on
   unstamped members and the coverage gap short-circuits first, the invariant
   **`routeUpstream: true` ⇒ verdict `BLOCKED`** holds and is test-pinned: a stamped-out
   `ADJUDICATED` run never routes upstream (patched-and-adjudicated is a *proceed*, per the
   2026-07-28 operator directive ADR 0043 implements), and an `INCOMPLETE` run re-runs its
   probes instead of routing — the coverage gap, not the plan, is what is broken.
6. **The routing taxonomy.** The doctrine the arithmetic backstops lives in
   `skills/red-team/references/loop-budget.md`, behind the ADR 0042 trigger pointer ("when the
   first gate computation returns `BLOCKED`, read it"). Each open finding routes by class
   before another sweep is spent on it: **factual error → patch in place**;
   **under-specification (`needsDecision`) → one adjudication attempt, then upstream** (the
   gate's rounds ≥ 2 arm is this rule typed); **scope-expanding patch → upstream immediately**
   (scope is authored in the interview, never accreted mid-verification); **two consecutive
   patch-cascade sweeps → upstream regardless of budget** (prose-advisory — Lead-judged, not
   gate-typed). Patch style: patches state the final rule; genealogy lives in the report's
   `## Adjudications` rows. On a route-upstream terminal, Step 6 emits the `## Route upstream`
   block — the residual open questions verbatim as the `/war-strategy` regrill agenda, plus the
   exact re-entry command — the handoff artifact `/war-campaign`'s halt arm
   (`stopPoint: redteam-route-upstream`) surfaces in CAMPAIGN-STATE.md, never
   skip-and-continue ([ADR 0011](0011-campaign-stack-and-plow-branch-model.md)).

## Relationship to prior ADRs

- **[ADR 0043](0043-adjudicated-clear-distinct-terminal-verdict.md).** The verdict set stays
  closed at five; this ADR adds an output field beside it, and its invariant (routeUpstream ⇒
  BLOCKED) is what keeps the two composable — a proceed verdict can never carry a routing
  signal, so `/war-campaign`'s triage arms never collide.
- **[ADR 0005](0005-dead-phase-halts-the-dag.md) (enum discipline).** No enum is widened
  anywhere on the land path: `routeUpstream` joins no verdict set, no
  `HARD_ESCALATION_REASONS`, no `KNOWN_LAND_DECISIONS` — the orthogonal-metadata pattern of
  `defectClass` and `gate-failure class`.
- **[ADR 0042](0042-prompt-surface-budgets.md).** The routing taxonomy is branch-gated doctrine
  (read only when a run goes `BLOCKED`), so it lives in `references/loop-budget.md` behind a
  fixed-shape trigger pointer; `skills/red-team/SKILL.md` carries only the pointer and the
  mechanics lines.
- **[ADR 0011](0011-campaign-stack-and-plow-branch-model.md).** A campaign never skips past a
  held plan — the route-upstream halt arm is that rule's loop-breaker case, with the regrill
  agenda as the resume artifact.

## Considered options

- **A sixth verdict (`ROUTE-UPSTREAM`) (rejected).** The verdict precedence chain is a closed
  contract one ADR old; every consumer switching on verdicts would need a new arm, and a
  routing signal is not an evidence judgment — it is metadata about *where the plan goes
  next*, exactly the class ADR 0005 keeps out of enums.
- **NLP / text classification of churn (rejected).** Violates the gate's pure/typed posture
  (the `deliverableAbsence`/`envGap`/`adjudicated` typed-flag lineage): the arithmetic reads
  typed buckets and a strict `adjudicated === true` stamp, nothing parses finding prose.
- **Per-blocker-only accounting as the budget (rejected).** `/red-team` Step 5's ≤ 2 re-verify
  attempts bounds one blocker in one run; the observed failure mode (the 7-round outlier) spans
  invocations and findings. Only a cumulative per-plan counter sees it, which is why the unit
  is the full grill sweep and the seed crosses runs.
- **Gate-side report parsing for the seed (rejected).** The gate takes integers and emits
  arithmetic; handing it a markdown glob-and-regex duty would smuggle filesystem state into a
  pure function. The Lead — who already reads reports — seeds, and the strict line form keeps
  the read deterministic.
- **Lenient / multi-form seeding over legacy reports (rejected).** Every legacy variant
  (`**Rounds: 4**` with the colon inside the bold, unbolded `Rounds:` lines) seeds 0 by design:
  the legacy counts measured pre-ADR-0043 patch-induced churn the stamping mechanic already
  retired, so inheriting them would charge new-regime plans for an old-regime disease.

## Consequences

- A plan that cannot converge now exits with an actionable artifact — the regrill agenda —
  instead of grinding sweeps; `/war-strategy` gets the residual questions verbatim, and
  re-entry re-seeds from the report so the budget stays honest across the loop.
- **Acknowledged residual: the limit can fire on a plan that would have converged in one more
  sweep.** The route is a halt-with-agenda, never a discard — the regrill is cheap, the plan
  file keeps every patch already applied, and re-entry after the interview continues the same
  cumulative count. The default of 3 sits one above the census median precisely so the common
  case never sees the limit.
- The fast-fail threshold (≥ 3 `needsDecision` in round 1 ⇒ recommend routing upstream) stays
  prose-advisory in `loop-budget.md` pending a campaign of field data — its gate-typing is a
  ratified deferred backstop of the plan, not part of this contract.
- Cumulative counting starts fresh with new-template reports (the clean-slate seed): a
  re-red-teamed legacy plan begins its count at that run.

## References

- Implementation plan:
  [`docs/plans/2026-08-05-precision-chain-and-loop-breaker.md`](../plans/2026-08-05-precision-chain-and-loop-breaker.md)
  — D3 (budget typing), D4 (campaign consumption), D10 (rounds seeding), A2 (clean slate),
  Tasks 4.1–4.3 (gate arithmetic, loop doctrine, config knob), 5.1 (step-3 triage + ledger
  `redteamRounds`), 5.5 (doc-guard rows), End states 8/10/11/12.
- Red-team report:
  [`docs/red-team/2026-08-05-precision-chain-and-loop-breaker.md`](../red-team/2026-08-05-precision-chain-and-loop-breaker.md)
  — F3 (unstamped-subset predicate + the routeUpstream ⇒ BLOCKED invariant), F4 (strict-form
  Rounds line, Lead-seeded, legacy-seeds-0), the round census correction.
- [ADR 0043](0043-adjudicated-clear-distinct-terminal-verdict.md) — the verdict contract this
  ADR rides beside, and the stamping mechanic the unstamped-subset arithmetic reads.
- Mechanics: `skills/red-team/assets/red-team-gate.mjs` (`routeUpstream()`),
  `skills/red-team/references/loop-budget.md` (the taxonomy + the `## Route upstream` block
  template), `skills/red-team/SKILL.md` Steps 1/3/5/6, `skills/war/assets/war-config.mjs`
  (`run.redteamRoundLimit`), `skills/war-campaign/SKILL.md` step 3 +
  `assets/campaign-ledger.mjs` (`redteamRounds`).
