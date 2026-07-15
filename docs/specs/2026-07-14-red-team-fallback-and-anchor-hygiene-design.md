# Red-team analyzed-agent fallback: sticky pin, Lead pre-flight, durable trace — plus gate-test branch-ordering anchor-comment corrections

Source issues: #890, #895
Date: 2026-07-14
Status: draft (Survey Corps) — awaiting /war-machine conversion

## 1. Context — the gap / problem

Two contained defects in `skills/red-team/`, both minor, both verified byte-present on the live tree.

**#890 — the #727 analyzed-agent fallback is per-dispatch, invisible, and pre-emptable.**
`workflow-scaffold.js` dispatches analyzed probes/confirms on a preferred read-only agent type
(`ANALYZED_AGENT`, default `'Explore'`, overridable via `args.analyzedAgentType`) and reactively
falls back to `ANALYZED_AGENT_FALLBACK` (`'general-purpose'`) when the preferred dispatch dies
(#727). Three follow-up problems, none affecting coverage or verdict:

1. **Per-dispatch, not sticky.** `ANALYZED_AGENT` is a `const` and `dispatchAgent` holds no
   state, so in a harness whose agent registry lacks `Explore` *every* analyzed probe and confirm
   first dies on the dead preferred type before recovering — 15 zero-token `Error` rows in the
   reported 0.14.38 run (11 analyzed probes + 4 analyzed confirms), instead of 1.
2. **Operator alarm.** A wall of red `Error` rows per red-team run in any Explore-less harness
   reads as a broken run; the reported incident escalated exactly this way.
3. **No durable trace.** Fallback engagement lives only in the ephemeral `log()` stream (the
   `analyzed-agent fallback engaged:` token). The dead dispatches die pre-spawn, so the journal
   records nothing; post-hoc forensics reduce to a UI screenshot plus surviving agents' metadata.

Additionally, `SKILL.md` Step 3's `Workflow(...)` args literal omits `analyzedAgentType` entirely,
even though the scaffold accepts it (shipped as #727's configurability ask) — the Lead is never
told it can pre-empt the whole dance.

**#895 — two gate-test anchor comments misname the edit that would red their cases.**
In `red-team-gate.test.mjs`:

- Case **1c** ("a severity-less envGap note on a non-pass probe lands in minors…") claims in its
  comment that moving the envGap demotion after the `KNOWN_SEVERITIES` check "goes RED". Verified
  against `classify()` in `red-team-gate.mjs`: a severity-less finding does **not** early-return at
  the `KNOWN_SEVERITIES` membership check (`if (KNOWN_SEVERITIES.includes(f.severity)) return f`
  is false for `severity: undefined`), so an envGap branch placed at any executable position before
  the final force-promotion return still demotes to Minor and the case stays GREEN. Only
  **deleting** the envGap branch reds it.
- Case **1e** titles itself an anchor of deliverableAbsence-before-envGap branch ordering, but both
  branches return the identical `severity:'Minor'` demotion, so a both-flags finding yields one
  Minor under either order — the ordering is not outcome-load-bearing and the test cannot anchor it.

A future editor trusting these comments could attempt a "described-safe" reordering that changes
nothing, or misjudge what the suite actually guards. This is recurrence 2 of the pattern recorded
in `docs/learnings/decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome.md`
(code-verified); the corrected sibling in `skills/war-campaign/assets/campaign-ledger.test.mjs`
(#816) is the model.

## 2. Pivotal constraints

1. **The Workflow sandbox cannot introspect the harness.** No imports, no filesystem, no journal
   API; a dropped agent type is observable *only* as a dead dispatch (throw or nullish result).
   Any in-run state must be scaffold-local mutable state, and any durable trace must ride the
   result objects the scaffold already returns.
2. **#727 semantics are preserved.** The preferred type still gets a chance per run (harnesses
   that *do* register `Explore` keep its narrower read-only confinement); the exhausted path still
   RETHROWS (never returns null) into the Layer-4 dropped-marker → gate-INCOMPLETE path; the
   redundant-dispatch guard (preferred === fallback) is untouched.
3. **Executed probes bypass unchanged.** `agentType: undefined` dispatches are never wrapped,
   never re-dispatched, never stamped.
4. **The gate stays untouched.** `red-team-gate.mjs` `classify()`/`verdict()` read named fields
   only and tolerate extra probe-result keys (verified) — trace fields are pass-through, and the
   #895 fix is prose-only inside its test file.
5. **Deliberately hardcoded agent-name literals stay.** The #727 test block hardcodes `'Explore'`
   and `'general-purpose'` so a future default change loudly breaks tests; the new tests keep that
   posture.
6. **Anchor comments must name the edit that actually reds the case** (the backing lesson) — a
   comment describing a safe refactor as a redding one is the defect class under repair.
7. **Confinement is type-independent.** The fallback widens raw capability, but probe confinement
   rides the scope-lock preamble + `assert-no-repo-escape.sh` on every probe/confirm
   unconditionally (scaffold SAFETY header) — so pinning the fallback earlier is safe.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Where does fallback stickiness live? | A scaffold-scope `let` pin (declared beside `dispatchAgent`), consulted and set inside `dispatchAgent`; `ANALYZED_AGENT` stays `const`; `runProbe`/`confirmStage` call sites unchanged. Rejected: threading state through call sites (wider diff); keeping per-dispatch retry (the bug). |
| What sets the pin? | The first dead preferred-type dispatch (throw or nullish) where the preferred type ≠ `ANALYZED_AGENT_FALLBACK`. Accepted residual: a probe-specific transient death also pins the rest of the run onto the fallback — harmless (constraint 7; the fallback recovered a full analyzed workload in the recorded incident). |
| What does the pin do? | At `dispatchAgent` entry, an analyzed dispatch with the pin set swaps its effective agent type to `ANALYZED_AGENT_FALLBACK` before the first `agent()` call — so one dead preferred dispatch per run, not one per probe/confirm. A death after the swap hits the existing redundant-dispatch guard and rethrows into Layer 4. |
| Pre-flight vs sticky pin — one or both? | Both, layered. The Lead pre-flight (SKILL.md Step 3) is the primary: zero dead dispatches when the Lead can see `Explore` is absent from its harness agent registry. The sticky pin is the in-run backstop for Leads that skip it, registries the Lead cannot enumerate, and mid-session registry changes. |
| Durable trace shape | Result-field stamps applied by `dispatchAgent` after the agent answers: `dispatchedOn: <effective type>` on every analyzed result, plus `fallbackEngaged: true` when the fallback re-dispatch produced it. Rejected: a journal event for dead dispatches — the journal is harness-owned, dead dispatches die pre-spawn, and the sandbox has no journal API (constraint 1). |
| Surface the trace in the gate/report? | No. The gate tolerates and ignores the extra fields (constraint 4); the trace is forensic, read from the workflow output. Report surfacing is deferred (§9). |
| Confirm-site trace | The CONFIRM-shape result is consumed internally by `confirmStage`, so confirm-site stamps do not survive into `probeResults`; confirm-site engagement stays visible via the stable `analyzed-agent fallback engaged:` log token. Accepted residual. |
| 1c fix shape (#895) | Rewrite the comment (and the title's order-attributing parenthetical) to name **deleting the envGap demotion branch** as the redding edit, and state that the demotion holds at any executable position before `classify()`'s force-promotion return. Behavior and assertions unchanged. |
| 1e fix shape (#895) | Keep the case — a both-flags finding demoting to exactly one Minor is a real regression check — but retitle/reword to drop the order-anchoring claim (both branches produce identical output; order is not observable). Rejected: deleting the case (loses the both-flags coverage). |
| `classify()` source comments | Untouched. Its "adjacent to and AFTER the deliverableAbsence check" prose states the actual code order factually; only the *test* comments overclaim what reds them. |
| Ordering between the two workstreams | None. #890 touches `workflow-scaffold.js` + its test + `SKILL.md`; #895 touches `red-team-gate.test.mjs` only — disjoint file sets, parallelizable as file-disjoint tasks (recorded for the plan converter). |

## 4. Mechanics

### workflow-scaffold.js (#890 — scaffold)

- Declare a mutable pin (e.g. `let analyzedFallbackPinned = false`) in scaffold scope near
  `dispatchAgent` (the scaffold compiles as a function body; scaffold-scope `let` is the
  established idiom — see the `let A` args guard).
- `dispatchAgent`, analyzed path only (`opts.agentType !== undefined`):
  - Entry: if the pin is set, swap the effective agent type to `ANALYZED_AGENT_FALLBACK` for the
    first `agent()` call (a pinned dispatch that dies then hits the existing redundant-dispatch
    guard and rethrows — no identical re-dispatch, exactly today's preferred===fallback path).
  - On a first dead preferred dispatch (the existing throw-or-nullish detection): set the pin
    before the fallback re-dispatch, alongside the existing `analyzed-agent fallback engaged:` log
    (token unchanged — it is greppably load-bearing).
  - Stamp returned results: preferred-type success returns `{ ...r, dispatchedOn: <effective type> }`;
    fallback recovery returns `{ ...r2, dispatchedOn: ANALYZED_AGENT_FALLBACK, fallbackEngaged: true }`.
    Executed dispatches return `agent()`'s result untouched (constraint 3). Stamping happens after
    the harness validates the agent's output against the FINDINGS/CONFIRM schema, so no schema change.
- Update the co-located prose in the same commit (recorded lesson: comments lag rewritten code):
  the `ANALYZED_AGENT` declaration comment, the `dispatchAgent` block comment (its worst-case
  "Bound:" arithmetic changes — a both-dead analyzed probe is now preferred + fallback on the first
  pipeline pass, then pinned-fallback + redundant-guard rethrow on the Layer-4 retry pass, i.e. 3
  dispatches, not 4), and the header SAFETY paragraph if its wording implies per-dispatch retry.

### workflow-scaffold.test.mjs (#890 — tests)

- The pre-#727 test "a dropped probe is retried once, then emitted as a { probe, dropped:true }
  marker" pins the per-dispatch worst case (`assert.equal(calls, 4, …)`): update the expected
  count and its comment to the sticky bound in the same edit (recorded lesson: changed assertion
  semantics → retitle/re-comment together).
- New behavioral cases (mock-agent harness, delete-the-feature discipline — each must go RED
  against the pre-change scaffold):
  - **Sticky pin:** with every `'Explore'` dispatch dead, exactly ONE `'Explore'` dispatch occurs
    across the whole run (count `prompts` with `agentType === 'Explore'`); every analyzed slot
    recovers on `'general-purpose'`; zero dropped markers.
  - **Trace stamps:** a fallback-recovered probe result carries `fallbackEngaged: true` and
    `dispatchedOn: 'general-purpose'`; a preferred-type success carries `dispatchedOn` equal to
    the preferred type and no `fallbackEngaged`; the executed probe's result carries neither.
  - **Gate pass-through:** pipe a stamped output through the real gate (`spawnSync` on
    `red-team-gate.mjs --stdin`, the End-state-3 idiom) and assert the verdict is computed
    normally — the extra fields change nothing.
- Existing #727 cases were enumerated against the sticky design: the recovery, both-dead,
  confirm-site, executed-bypass, override, and preferred===fallback cases assert via `some()`/
  per-label counts that remain true under stickiness — they must stay green unmodified. Any that
  unexpectedly reds under implementation is a design-review trigger, not a test to loosen.

### SKILL.md Step 3 (#890 — Lead pre-flight)

- Add the pre-flight directive to Step 3: before launching the Workflow, the Lead checks the
  harness agent registry its own system prompt enumerates; when `Explore` is absent, pass
  `args.analyzedAgentType: 'general-purpose'` so zero dead dispatches occur. When the registry is
  not enumerable, omit the arg — the sticky pin backstops in-run.
- Add `analyzedAgentType` to Step 3's `Workflow({ scriptPath, args: { … } })` args literal, which
  currently omits it.

### red-team-gate.test.mjs (#895 — prose only)

- **1c:** rewrite the comment to name deletion of the envGap branch in `classify()` as the edit
  that reds the case, and correct the mechanism: a severity-less finding falls through the
  `KNOWN_SEVERITIES` membership check, so the envGap demotion holds anywhere before the
  force-promotion return. Adjust the title's parenthetical so it no longer attributes the outcome
  to branch order.
- **1e:** retitle/reword to what the case actually proves — a finding carrying both
  `deliverableAbsence:true` and `envGap:true` demotes to exactly one Minor — dropping the
  "deliverableAbsence branch is first in order" load-bearing claim (or qualifying it as
  outcome-unobservable). Assertions unchanged.
- Model both rewrites on the corrected #816 sibling comment in
  `skills/war-campaign/assets/campaign-ledger.test.mjs` (names the actual first-line catch and the
  backstop behind it).
- Sweep for stragglers: grep `red-team-gate.test.mjs` for redding-edit and order claims (e.g.
  `goes RED`, `RED (`, `first in order`, `wins by order`, `precedes`) and handle every match.
  **Grep is a completeness floor, not a ceiling** — after the grep, hand-scan the full test file's
  same-scope titles and comment blocks (including 1f/1g and the D-series cases) for any other
  comment that misnames its redding edit or anchors an outcome-unobservable order, and list each
  straggler found as a survey-derived correction.

## 5. Surface changes

| File | Change |
|---|---|
| `skills/red-team/assets/workflow-scaffold.js` | Sticky fallback pin in `dispatchAgent` scope; `dispatchedOn`/`fallbackEngaged` result stamps; co-located comment updates (declaration, dispatch block "Bound:", SAFETY header) |
| `skills/red-team/assets/workflow-scaffold.test.mjs` | Update the per-dispatch worst-case count assertion + comment; add sticky-pin, trace-stamp, and gate-pass-through cases |
| `skills/red-team/SKILL.md` | Step 3: Lead pre-flight directive + `analyzedAgentType` added to the args literal |
| `skills/red-team/assets/red-team-gate.test.mjs` | 1c/1e comment + title corrections; straggler sweep (prose only, zero behavioral diff) |

`skills/red-team/assets/red-team-gate.mjs` is deliberately untouched (constraint 4).
The two issue groups are file-disjoint; the plan converter may carve them as parallel tasks with
no ordering edge.

## 6. New domain terms (CONTEXT.md)

None. "Analyzed-agent fallback" is already established vocabulary (#727); "sticky pin" is a local
mechanic of that fallback, not a new pipeline concept.

## 7. Recommended ADRs

None. This refines #727's recorded behavior within its existing decision envelope; no new binding
architectural decision is taken.

## 8. Open risks / implementation notes

- **Concurrency window:** `pipeline()` may have several preferred-type dispatches in flight before
  the first death sets the pin; stickiness reduces dead dispatches to at most that in-flight
  window, not strictly 1. In the recorded incident dispatches serialized ahead of each probe's
  start, so the practical count is 1; the sticky-pin test's exactly-one assertion holds on the
  serial mock harness. Do not over-promise "exactly one" in scaffold prose — say "at most the
  in-flight window".
- **Transient-death pinning:** a single flaky preferred-type dispatch pins the remainder of the
  run onto `general-purpose`, trading `Explore`'s narrower confinement for zero further dead
  dispatches. Accepted (constraint 7); note it in the `dispatchAgent` block comment.
- **Comment/code lock-step:** the scaffold's "Bound:" arithmetic, the `ANALYZED_AGENT` declaration
  comment, and the updated test's count comment all restate the same fact — change them in the
  same commit (recurring recorded lesson: comments lag rewritten code).
- **Pre-flight is prompt-enforced only:** the SKILL.md directive has no code gate; the sticky pin
  is its enforcement backstop, which is why both land together rather than pre-flight alone.
- **Stamp placement:** stamp only in `dispatchAgent`'s analyzed path — stamping inside `runProbe`
  would miss the confirm site's log-token parity and touch the executed bypass.
- **1c title wording:** the current parenthetical "(envGap check precedes KNOWN_SEVERITIES)" is a
  true statement of code order; the defect is attributing the GREEN outcome to that order. The
  rewrite must keep the true fact available (the source comment in `classify()` already records
  it) while the test stops claiming a reorder reds it.

## 9. Non-goals / deferred

- No change to `red-team-gate.mjs` (`classify()` branch order, comments, or verdict logic).
- No journal event for dead dispatches (harness-owned; unreachable from the sandbox).
- No surfacing of `dispatchedOn`/`fallbackEngaged` in the red-team report or gate summary —
  deferred until an operator-facing need appears; the fields are forensic.
- No renaming of the `analyzed-agent fallback engaged:` log token (greppably load-bearing,
  asserted by existing tests).
- No widening of #727's exhausted/rethrow semantics or the redundant-dispatch guard.
- No cross-run persistence of the pin (each Workflow run re-tries the preferred type once — that
  is the preserved #727 semantic, and harness registries change between sessions).

## 10. Validation criteria

Each criterion is independently checkable; 1–7 concern #890, 8–10 concern #895.

1. **Sticky pin:** in `workflow-scaffold.test.mjs`, a run whose every `'Explore'` dispatch dies
   dispatches `'Explore'` exactly once across all analyzed probes and confirms (asserted by
   counting captured dispatch opts), with every analyzed slot recovering on `'general-purpose'`
   and zero `dropped` markers. The case goes RED against the pre-change scaffold.
2. **Worst-case bound updated:** the "dropped probe is retried once" test asserts the new sticky
   dispatch count for a both-dead analyzed probe, and its comment plus the scaffold's
   `dispatchAgent` "Bound:" comment state the same arithmetic.
3. **Trace stamps:** a fallback-recovered analyzed probe result carries
   `fallbackEngaged: true` and `dispatchedOn: 'general-purpose'`; a preferred-type success carries
   `dispatchedOn` = preferred type and no `fallbackEngaged`; the executed probe's result carries
   neither field.
4. **Gate pass-through:** stamped scaffold output piped through the real `red-team-gate.mjs`
   (`--stdin`) yields the same verdict as unstamped output — extra fields are inert.
5. **Preserved #727 behavior:** the existing recovery, both-dead-INCOMPLETE, confirm-site,
   executed-bypass, override, and preferred===fallback cases pass unmodified.
6. **Lead pre-flight:** `skills/red-team/SKILL.md` Step 3 instructs the registry check and names
   `args.analyzedAgentType: 'general-purpose'` as the Explore-absent pre-flight, and its
   `Workflow(...)` args literal includes `analyzedAgentType`.
7. **Suite green:** `node --test skills/red-team/assets/workflow-scaffold.test.mjs` passes.
8. **1c corrected:** the 1c comment names deleting the envGap branch as the redding edit; no
   comment or title in `red-team-gate.test.mjs` claims that moving the envGap demotion after the
   `KNOWN_SEVERITIES` check reds a case.
9. **1e corrected:** the 1e title/comment no longer claims the deliverableAbsence-before-envGap
   order is outcome-load-bearing; the both-flags-one-Minor assertions are unchanged, and
   `node --test skills/red-team/assets/red-team-gate.test.mjs` passes with a zero behavioral diff
   (prose-only change).
10. **Straggler sweep done:** the grep sweep of criterion 8/9's claim tokens ran AND the mandatory
    manual same-scope survey of the full test file's titles/comments was performed, with each
    straggler listed as a survey-derived correction in the task's done-report (grep is the floor,
    the hand-scan is the ceiling).
