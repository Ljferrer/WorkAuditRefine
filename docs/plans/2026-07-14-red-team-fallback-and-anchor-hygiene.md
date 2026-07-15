# Red-team fallback and anchor hygiene — sticky analyzed-agent pin, Lead pre-flight, durable trace stamps; gate-test anchor-comment corrections

Plan file: `docs/plans/2026-07-14-red-team-fallback-and-anchor-hygiene.md`
Source spec: docs/specs/2026-07-14-red-team-fallback-and-anchor-hygiene-design.md
Issues addressed: #890, #895
Stacks on: campaign-decided (ADR 0011 stack order); the 2026-07-14 siblings share only the four
release slots with this plan — see Build order contention.

## AI-Commander's Intent

- **Purpose:** The #727 analyzed-agent fallback recovers coverage but is per-dispatch, invisible,
  and pre-emptable: in a harness whose agent registry lacks `Explore`, every analyzed probe and
  confirm first dies on the dead preferred type before recovering — 15 zero-token `Error` rows in
  the recorded 0.14.38 run — the engagement survives only in the ephemeral `log()` stream, and
  `skills/red-team/SKILL.md` Step 3 never tells the Lead the scaffold accepts
  `args.analyzedAgentType` to pre-empt the whole dance. Make the fallback **sticky per run** (one
  dead preferred dispatch, not one per slot), stamp a **durable trace** onto the result objects the
  scaffold already returns, and add the **Lead pre-flight** (#890). Separately, two anchor comments
  in `red-team-gate.test.mjs` misname the edit that would red their cases — 1c claims a
  branch-move reds it when only *deleting* the envGap branch does (a severity-less finding falls
  through the `KNOWN_SEVERITIES` membership check), and 1e anchors a branch order that is
  outcome-unobservable (both branches return the identical Minor demotion) — recurrence 2 of the
  decoy-comment lesson; correct them so a future editor cannot act on a false redding claim (#895).
- **Method:** Layered per the spec's resolved design tree — the SKILL.md Step 3 pre-flight is the
  primary (zero dead dispatches when the Lead can see `Explore` is absent from its harness agent
  registry), the scaffold-scope sticky pin is the in-run backstop for Leads that skip it,
  non-enumerable registries, and mid-session registry changes; both land together because the
  pre-flight is prompt-enforced only. The pin is a scaffold-scope `let` declared beside
  `dispatchAgent`, consulted and set **only inside `dispatchAgent`'s analyzed path**
  (`opts.agentType !== undefined`); `ANALYZED_AGENT` stays `const`; the `runProbe`/`confirmStage`
  call sites are untouched. Guardrails, all binding: #727 semantics preserved — the preferred type
  still gets one chance per run, the exhausted path still RETHROWS (never returns null) into the
  Layer-4 dropped-marker → gate-INCOMPLETE path, the redundant-dispatch guard (preferred ===
  fallback, keyed on the *effective* type so a pinned death rethrows without an identical
  re-dispatch) is not widened, and executed dispatches (`agentType: undefined`) are never wrapped,
  re-dispatched, or stamped. The `analyzed-agent fallback engaged:` log token is never renamed
  (greppably load-bearing, asserted by existing tests). Trace = result-field stamps
  (`dispatchedOn`, `fallbackEngaged`) applied in `dispatchAgent` after the harness schema-validates
  the answer — the gate tolerates and ignores extra probe-result keys (verified against
  `classify()`/`verdict()`; re-proven by a pass-through test). The deliberately hardcoded
  `'Explore'`/`'general-purpose'` literals in the test file stay (a future default change must
  loudly break tests). Existing #727 cases must stay green **unmodified** — one redding under
  implementation is a design-review trigger, never a test to loosen. Comment/code lock-step: the
  scaffold's "Bound:" arithmetic, the `ANALYZED_AGENT` declaration comment, and the updated test's
  count comment restate one fact and change in the same commit. #895 is prose-only with a zero
  behavioral diff — the corrected comments must name the edit that actually reds each case, modeled
  on the corrected #816 sibling in `skills/war-campaign/assets/campaign-ledger.test.mjs`;
  `red-team-gate.mjs` itself is untouched (its "adjacent to and AFTER the deliverableAbsence check"
  source comment states code order factually and stays). Every grep sweep is a floor with a
  mandatory manual same-scope survey recorded in the commit body. Every mapped test takes the
  mentally-delete check (delete the feature — the case must fail).
- **End state:**
  1. **Sticky pin:** in `workflow-scaffold.test.mjs`, a run on a **serial** pipeline mock whose
     every `'Explore'` dispatch dies dispatches `'Explore'` exactly ONCE across all analyzed probes
     AND a fired confirm (counted over the captured dispatch opts), every analyzed slot recovers on
     `'general-purpose'`, and zero `dropped` markers are emitted. RED against the pre-change
     scaffold (which dispatches `'Explore'` once per analyzed slot).
  2. **Worst-case bound updated:** the existing "a dropped probe is retried once…" case asserts the
     sticky both-dead bound — 3 dispatches (preferred + fallback on the first pipeline pass, then
     pinned-fallback + redundant-guard rethrow on the Layer-4 retry) — and its assertion message,
     its lead-in comment, and the scaffold `dispatchAgent` "Bound:" comment state the same
     arithmetic.
  3. **Trace stamps — all four result states, one assertion each:** a fallback-recovered analyzed
     probe result carries `fallbackEngaged: true` and `dispatchedOn: 'general-purpose'`; a
     **pinned entry-swap** success (dispatched after the pin, no re-dispatch) carries the same two
     stamps; a preferred-type success carries `dispatchedOn` equal to the preferred type and NO
     `fallbackEngaged` key (asserted as key absence — `!('fallbackEngaged' in r)` — not
     falsiness); the executed probe's result carries neither field. Additionally a
     confirm-downgraded probe result retains its stamps through `confirmStage`'s `{ ...res }`
     spread.
  4. **Gate pass-through:** a stamped scaffold output piped through the real gate
     (`spawnSync` on `red-team-gate.mjs --stdin`, the idiom already in this test file) exits 0 and
     yields the same verdict as the identical output with the two stamp fields stripped — the extra
     fields are inert.
  5. **Preserved #727 behavior:** the existing recovery (throw + null shapes), both-dead-INCOMPLETE,
     confirm-site both-dead, executed-bypass, override, preferred===fallback, and confirm-site
     parity cases pass **unmodified**.
  6. **Lead pre-flight:** `skills/red-team/SKILL.md` Step 3 instructs the harness-agent-registry
     check with all three arms (`Explore` present ⇒ omit the arg, the preferred type works;
     absent ⇒ pass `args.analyzedAgentType: 'general-purpose'` so zero dead dispatches occur;
     registry not enumerable ⇒ omit the arg — the sticky pin backstops in-run), and its
     `Workflow(...)` args literal includes `analyzedAgentType`. A new **Step-3 presence lock** in
     `workflow-scaffold.test.mjs` (the ff-topology cross-file region idiom already in that file)
     anchors both: `analyzedAgentType` present inside the Step 3 args literal, and the pre-flight
     clause present via a case-tolerant mid-sentence anchor in the surrounding region. The
     ff-topology presence-pair test and every other existing SKILL.md-reading assertion stay
     green.
  7. **Comment lock-step:** the `ANALYZED_AGENT` declaration comment, the `dispatchAgent` block
     comment (new Bound: arithmetic; the transient-death-pinning residual; "at most the in-flight
     window" — never "exactly one" — for dead dispatches under concurrency), and the header SAFETY
     paragraph are updated in the same commit as the code they describe.
  8. **1c corrected:** the 1c comment names **deleting the envGap demotion branch in `classify()`**
     as the redding edit and states the real mechanism (a severity-less finding falls through the
     `KNOWN_SEVERITIES` membership check, so the demotion holds at any executable position before
     the force-promotion return); the title's parenthetical no longer attributes the GREEN outcome
     to branch order. `grep -in 'goes red' skills/red-team/assets/red-team-gate.test.mjs`
     (case-insensitive, mid-sentence anchor — the sentence-case-guard lesson) and the order-claim
     tokens (End state 10) show no comment or title claiming that moving the envGap demotion after
     the `KNOWN_SEVERITIES` check reds a case.
  9. **1e corrected:** the case is KEPT (both-flags-one-Minor is real regression coverage) but
     retitled/reworded to what it proves — a finding carrying both `deliverableAbsence: true` and
     `envGap: true` demotes to exactly one Minor — with the order-anchoring claim dropped or
     explicitly qualified as outcome-unobservable. Assertions byte-unchanged;
     `node --test skills/red-team/assets/red-team-gate.test.mjs` passes with a **zero behavioral
     diff** (prose-only change).
  10. **Straggler sweep done:** the grep floor over the claim tokens (`goes RED`, `RED (`,
      `first in order`, `wins by order`, `precedes`) ran with every match dispositioned — including
      the three known innocent `CLEARED (`-substring hits — AND the mandatory manual same-scope
      survey of the full test file's titles/comments (incl. 1f/1g and the D-series) was performed,
      recorded as a `Survey:` block in the task's commit body, stragglers listed as survey-derived
      corrections (or an explicit none-found note).
  11. Full gates green at each phase's land (`node --test 'skills/**/*.test.mjs'` plus the composed
      gate's shell-suite discovery loop); all four release slots bumped together to the next free
      patch (Phase 2), `skills/war/assets/version-slots.test.mjs` green.

## Build order (for /war)

- **Contention (verified):** campaign plan 1 (`docs/plans/2026-07-14-gate-evidence-and-prose-truth.md`)
  touches `skills/war/**`, `agents/war-refiner.md`, `CONTEXT.md`, `docs/adr/`, `docs/specs/*.md`,
  one landed 2026-07-12 plan, and two `docs/learnings/` files — **zero overlap** with this plan's
  `skills/red-team/**` footprint except the four release slots (three files), which are serial by
  stack order and resolved from the live tip at land time. This plan needs neither `CONTEXT.md`
  (spec §6: no new terms) nor `docs/adr/` (spec §7: none), so those plan-1 surfaces stay
  uncontended.
- **Why one content phase:** the spec records no ordering between the two issue groups and their
  file sets are disjoint (#890: `workflow-scaffold.js` + its test + `SKILL.md` (+ `lenses.md` as a
  sweep re-verify target); #895: `red-team-gate.test.mjs` only) — two parallel, file-disjoint
  tasks; no deps, no waves.

1. **Phase 1 — Sticky fallback + anchor hygiene (#890, #895)** (Task 1.1 ∥ Task 1.2, file-disjoint)
2. **Phase 2 — Release** (four version slots, lands last)

## Phase 1 — Sticky fallback + anchor hygiene (#890, #895)

### Task 1.1: Sticky pin + trace stamps + worst-case bound + Lead pre-flight (#890)

- Files: `skills/red-team/assets/workflow-scaffold.js`, `skills/red-team/assets/workflow-scaffold.test.mjs`, `skills/red-team/SKILL.md`, `skills/red-team/references/lenses.md`
  (`lenses.md` is a sweep re-verify target — may be zero-diff; see the sweep bullet)
- Plan slice:
  - **Sticky pin (`workflow-scaffold.js`):** declare a scaffold-scope mutable pin (e.g.
    `let analyzedFallbackPinned = false`) beside `dispatchAgent` (scaffold-scope `let` is the
    established idiom — see the `let A` args guard). Inside `dispatchAgent`, analyzed path only:
    - **Entry swap — flows through `opts`:** when the pin is set, reassign at entry
      (`opts = { ...opts, agentType: ANALYZED_AGENT_FALLBACK }`) so every downstream read — the
      first `agent()` call, the redundant-dispatch guard, the log line, and both error messages —
      sees the EFFECTIVE type from one place. A pinned dispatch that dies then hits the existing
      guard (`opts.agentType === ANALYZED_AGENT_FALLBACK`) and rethrows into Layer 4 — no
      identical re-dispatch; exactly today's preferred===fallback path. The spread changes an opts
      *value* only, never the key set (see the stamps bullet).
    - **Pin-set condition = reached the fallback re-dispatch path:** on a dead dispatch (the
      existing throw-or-nullish detection), the existing guard has already peeled both the
      operator-override preferred===fallback case AND the pinned-swap death — so the pin-set sits
      just past the guard, immediately before the existing `analyzed-agent fallback engaged:` log
      line (token byte-unchanged) and the fallback re-dispatch. Consequence, stated in the Bound
      comment: in a preferred===fallback run the pin is never set and the existing
      preferred===fallback case stays green unmodified.
    - **Trace stamps — the four result states**, applied to the returned result after the
      `agent()` call (post harness-side schema validation — no schema change):
      1. preferred-type success (pin unset): `{ ...r, dispatchedOn: <effective type> }`, no
         `fallbackEngaged` key;
      2. re-dispatch recovery: `{ ...r2, dispatchedOn: ANALYZED_AGENT_FALLBACK, fallbackEngaged: true }`;
      3. pinned entry-swap success: same two stamps as state 2 (produced on the fallback while the
         run's preferred type ≠ the fallback);
      4. executed bypass: `agent()`'s result returned untouched — neither key.
      Confirm-site stamps are consumed internally by `confirmStage` and do not survive into
      `probeResults` — accepted residual; confirm engagement stays visible via the log token.
      **Stamps are result-spread only — no new dispatch-opts key is ever added:** the model/effort
      suite's exact-key `deepEqual(Object.keys(o).sort(), ['agentType','label','phase','schema'])`
      byte-shape lock is the standing guard and must stay green untouched.
    - Verified at survey base: no existing assertion deep-equals a probe-result object (that
      byte-shape lock reads *dispatch opts* key sets, not results), so the stamps break no
      existing case — re-verify at the dispatch base.
  - **Comment lock-step (same commit — comments lag rewritten code). The fallback model is
    restated at exactly FIVE sites; all five move together:**
    1. the scaffold header SAFETY paragraph (where its wording implies a per-dispatch retry);
    2. the `ANALYZED_AGENT` declaration comment;
    3. the `dispatchAgent` block comment, including: the "Bound:" arithmetic — a both-dead
       analyzed probe is preferred + fallback on the first pipeline pass, then pinned-fallback +
       redundant-guard rethrow on the Layer-4 retry, i.e. **3 dispatches, not 4** (2 for any slot
       dispatched after the pin; in a preferred===fallback run the pin is never set); the
       transient-death-pinning residual (a single flaky preferred dispatch pins the rest of the
       run onto the fallback: accepted, NO unpin logic — confinement is type-independent, the
       scope-lock preamble + `assert-no-repo-escape.sh` ride every probe/confirm unconditionally;
       the pin is run-scoped by construction, the scaffold body re-evaluates per Workflow run);
       one pin-race sentence (a plain boolean set idempotently under JS's single-threaded
       microtask model — no torn state; several in-flight preferred dispatches may die before the
       first observer pins, so dead dispatches are "at most the in-flight window", never
       "exactly one");
    4. the worst-case bound test's lead-in comment + assertion message (End state 2);
    5. `SKILL.md` Step 3 (the pre-flight bullet below).
    **Explicit do-not-touch:** the `analyzed-agent fallback engaged:` log token is frozen
    byte-for-byte (greppably load-bearing; asserted by existing tests).
  - **Tests (`workflow-scaffold.test.mjs`), same commit — each new case must go RED against the
    pre-change scaffold (mentally-delete discipline; record in the done-report):**
    - **Serial-pipeline harness knob:** the in-file `fakePipeline` is `Promise.all`-concurrent —
      every item's first dispatch fires synchronously before any death is observed (verified), so
      the exactly-one assertion is only deterministic on a serial pipeline (spec §8). Extend the
      `runScaffold` helper with an optional pipeline implementation (default: the existing
      `fakePipeline`, all existing callers byte-unchanged) and add a `serialPipeline` that runs
      items one at a time through all stages. Production Workflow `pipeline()` semantics are
      untouched — this is a test-harness knob only.
    - **Sticky pin (End state 1):** on `serialPipeline`, every `'Explore'` dispatch dies (use one
      failure shape; the throw-vs-null pair is already covered by the existing recovery cases);
      one probe's fallback result is a blocking fail so a confirm fires. Assert: captured prompts
      with `agentType === 'Explore'` number exactly 1 across the whole run; every other analyzed
      dispatch (probes and the confirm) carries `agentType === 'general-purpose'`; zero dropped
      markers; every probe slot yields a real result; AND every post-pin analyzed result carries
      the pinned-swap stamps (`dispatchedOn: 'general-purpose'`, `fallbackEngaged: true`) — the
      state-3 trace arm rides this serial case, where pinned swaps deterministically occur.
    - **Worst-case bound (End state 2):** update the existing "a dropped probe is retried once…"
      case: `assert.equal(calls, 3, …)` with the message and lead-in comment restating the sticky
      arithmetic (assertion semantics changed ⇒ message/comment move in the same edit). The title
      stays (its named behavior — retried once, then a dropped marker — is unchanged).
    - **Trace stamps (End state 3), three per-field assertions in one concurrent-pipeline case:**
      kill `'Explore'` for one probe label only; assert (i) the recovered result carries
      `fallbackEngaged: true` + `dispatchedOn: 'general-purpose'`, (ii) a sibling analyzed success
      carries `dispatchedOn: 'Explore'` AND `!('fallbackEngaged' in r)` (key absence, not
      falsiness), (iii) the executed probe's result carries neither key (both key-absence checks).
      Plus a **downgrade-survival arm**: the killed-Explore probe returns a blocking fail on the
      fallback and its confirm returns `reproduced: false` — assert the downgraded (`status:
      'warn'`) result still carries both stamps through `confirmStage`'s `{ ...res }` spread.
    - **Step-3 presence lock (End state 6):** the ff-topology cross-file region idiom over
      `skills/red-team/SKILL.md` — the Step 3 region around `analyzedAgentType` must contain it
      inside the `Workflow({ … args: { … } })` literal and carry the pre-flight clause via a
      case-tolerant mid-sentence anchor (registry check + `'general-purpose'`). Mentally-delete:
      drop the arg from the literal or the pre-flight sentence ⇒ red.
    - **Gate pass-through (End state 4):** pipe the stamped output through
      `spawnSync(process.execPath, [GATE, '--stdin'], …)` twice — once as-is, once with the two
      stamp fields stripped from every probe result — assert both exit 0 with equal verdicts.
    - **Red-proof duty:** every new case above is proven RED by stash-and-rerun against the
      pre-change scaffold (stash the scaffold edits, run the suite, record the failing output),
      logged in the task done-report — the in-file #727 precedent (its header comment records
      exactly this discipline).
    - **Existing #727 cases stay green unmodified (End state 5)** — the spec's own sentence is
      binding: "Any that unexpectedly reds under implementation is a design-review trigger, not a
      test to loosen." Auditor duty: verify the recovery (throw + null), both-dead-INCOMPLETE,
      confirm-site both-dead, executed-bypass, override, preferred===fallback, and confirm-site
      parity cases are byte-unmodified in the diff.
  - **SKILL.md Step 3 (same commit — the pre-flight is prompt-enforced; the pin is its code
    backstop):** add the pre-flight directive with all THREE arms explicit: before launching the
    Workflow, check the harness agent registry the Lead's own system prompt enumerates —
    (1) `Explore` **present** ⇒ omit the arg (the preferred type works; today's behavior);
    (2) `Explore` **absent** ⇒ pass `args.analyzedAgentType: 'general-purpose'` so zero dead
    dispatches occur; (3) registry **not enumerable** ⇒ omit the arg — the sticky pin backstops
    in-run. Add `analyzedAgentType` to the Step 3 `Workflow({ scriptPath, args: { … } })` args
    literal (currently omits it — verified; no test locks the literal at survey base, and the new
    Step-3 presence lock above becomes its standing guard).
  - **Sweep (grep floor + mandatory survey):** `grep -rn -i 'fallback' skills/red-team/` — handle
    every match: any prose implying a per-dispatch retry model is corrected to the sticky/pinned
    model. Known hits to adjudicate: the scaffold's own header + block comments (edited above);
    the `references/lenses.md` report-template line
    `Fallback: <none | analyzed-agent fallback engaged on: probe names>.` — under stickiness the
    per-probe enumeration comes from the `dispatchedOn`/`fallbackEngaged` result stamps, not one
    log token per probe; reword only if it misleads, else disposition as accurate (may be
    zero-diff). **Grep is a completeness floor, not a ceiling — after the grep, hand-scan the
    same-scope surfaces (the scaffold's full header/inline prose, SKILL.md Steps 3–4, the
    `lenses.md` report template and provision bullet, and `workflow-scaffold.test.mjs`
    titles/comments) for per-dispatch-retry phrasings the token misses, and list each straggler as
    a survey-derived correction in the commit-body `Survey:` block.**
  - Non-goals restated (spec §9): no journal event for dead dispatches (harness-owned, unreachable
    from the sandbox); no report/gate surfacing of the stamps (forensic, deferred); no renaming of
    the log token; no widening of the exhausted/rethrow semantics or the redundant-dispatch guard;
    no cross-run pin persistence (each run re-tries the preferred type once — preserved #727
    semantic).
- requiresTest: true (mapped evidence: the new and updated cases in
  `workflow-scaffold.test.mjs` in this diff — sticky-pin, trace-stamp + downgrade arm, gate
  pass-through, Step-3 presence lock, bound update; suite runs under the plan gate
  `node --test 'skills/**/*.test.mjs'`)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: 1c/1e anchor-comment corrections + straggler sweep (#895)

- Files: `skills/red-team/assets/red-team-gate.test.mjs`
- Plan slice:
  - **Prose-only, zero behavioral diff** — assertions, fixtures, and `red-team-gate.mjs` are all
    byte-untouched (spec constraint 4; the `classify()` source comment "adjacent to and AFTER the
    deliverableAbsence check" states the code order factually and stays). Model both rewrites on
    the corrected #816 sibling comment in `skills/war-campaign/assets/campaign-ledger.test.mjs`
    (it names the actual FIRST-LINE catch and the backstop behind it). Specify semantics, not
    bytes — the worker phrases the replacement prose (the plan-bullet byte-literal trap is the
    recorded failure mode this avoids):
  - **1c:** rewrite the comment to name **deleting the envGap demotion branch in `classify()`** as
    the edit that reds the case, and correct the mechanism: a severity-less finding does NOT
    early-return at the `KNOWN_SEVERITIES` membership check
    (`KNOWN_SEVERITIES.includes(f.severity)` is false for `severity: undefined`), so the envGap
    demotion holds at any executable position before `classify()`'s final force-promotion return —
    moving it after `KNOWN_SEVERITIES` does NOT red this case. Adjust the title's parenthetical
    ("(envGap check precedes KNOWN_SEVERITIES)") so it no longer attributes the GREEN outcome to
    branch order; the true code-order fact stays available in `classify()`'s own source comment
    and need not be restated here.
  - **1e:** KEEP the case (a both-flags finding demoting to exactly one Minor is real regression
    coverage — deleting it was rejected by the spec); retitle/reword the title and the
    `'deliverableAbsence wins by order'` assertion message to what the case actually proves — a
    finding carrying both `deliverableAbsence: true` and `envGap: true` yields exactly one Minor —
    dropping the "first in order"/"wins by order" load-bearing claim (or qualifying it as
    outcome-unobservable: both branches return the identical `severity:'Minor'` demotion, so the
    order cannot be anchored by outcome). The assertion *expressions* stay byte-unchanged; only
    title and message prose move.
  - **Sweep (grep floor + mandatory survey):**
    `grep -n -i 'goes RED\|RED (\|first in order\|wins by order\|precedes' skills/red-team/assets/red-team-gate.test.mjs`
    — handle every match. Known adjudications at survey base: the 1c comment/title and the 1e
    title/message (corrected above), plus three innocent hits where `RED (` substring-matches
    `CLEARED (` (the two INCOMPLETE-verdict titles and the pass-probe-filter comment) —
    disposition as accurate, do not edit. **Grep is a completeness floor, not a ceiling — after
    the grep, hand-scan the full test file's same-scope titles and comment blocks (including the
    1f/1g cases and the D-series) for any other comment that misnames its redding edit or anchors
    an outcome-unobservable order, and list each straggler as a survey-derived correction in the
    commit-body `Survey:` block** (or an explicit none-found note). Corrections are bounded to
    this file — a straggler pointing anywhere else routes to a Lead-filed follow-up issue
    (file-disjointness with Task 1.1 holds by construction). **Two known EXTERNAL restatements
    are deliberately untouched** (named so the sweep doesn't chase them and no future pass
    "fixes" them): the landed plan `docs/plans/2026-07-12-red-team-enforcement-hygiene.md` —
    End-state item (e) and its Notes both state the 1e order-anchoring intent ("wins by order",
    "first in order") — landed plans are historical record, never retro-edited; and
    `docs/learnings/decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome.md` —
    the lesson documents the defect class this task instantiates fix #2 of, and its text is the
    pattern record, not a drifted claim.
  - In-task check: `node --test skills/red-team/assets/red-team-gate.test.mjs` green, and the
    diff touches only test titles, comments, and assertion *message strings* — never a compared
    expression, fixture, or import (zero behavioral diff is End state 9's checkable core). Note
    the precision: the 1e order claim lives inside an `assert.equal(...)` **message argument**
    (verified), so a naive "no `assert.` lines changed" check is unmeetable — the honest predicate
    is expressions-unchanged, not lines-untouched.
- requiresTest: false — prose-only comment/title corrections inside an existing test file; no
  assertion or behavior changes, so there is no new test to map (the no-test route's justification,
  recorded here for the floor; the suite staying green IS the check)
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: This plan changes a shipped skill's scaffold, tests, and SKILL.md prose — users only
  receive it via a release. Bump all four release slots together to the **next free patch above
  the live integration base at land time** (never a resolved semver literal in this plan, per the
  /war-strategy §2 next-free-patch convention): `plugin.json` `version`, `marketplace.json`
  `metadata.version` AND `plugins[0].version`, and the `README.md` `## Status` line
  (replace-in-place, never emptied, no badge). Expected integration base: the working-branch tip
  after this plan's Phase 1 lands; if campaign siblings land first, their bumps advance the base —
  version literals anywhere are non-authoritative. Standalone fallback: a run of this plan through
  plain `/war` resolves the next free patch from the four slots themselves.
  `skills/war/assets/version-slots.test.mjs` is the lock-step arbiter — a partial bump is a red
  test.
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- Live-run confirmation in a real Explore-less harness: dead preferred dispatches per run are at
  most the in-flight concurrency window (practically 1 — no wall of red `Error` rows), and the
  `dispatchedOn`/`fallbackEngaged` stamps are readable in the persisted workflow output for
  post-hoc forensics · why deferred: the unit cases prove stickiness on a serial mock pipeline and
  the stamps on the mock harness; the real harness's dispatch concurrency and its UI rendering are
  only observable in a live run · runner: operator of the next `/red-team` run in an Explore-less
  harness (the recorded 0.14.38-class environment), via the run UI + the persisted task-output
  file.
- Lead pre-flight obedience: the SKILL.md Step 3 registry check → `args.analyzedAgentType`
  hand-off is prompt-enforced with no code gate (no code can read the Lead's harness registry) ·
  why deferred: by design — the sticky pin is the shipped in-run enforcement backstop, which is
  why both land in one task rather than pre-flight alone · runner: the sticky pin (code, this
  plan) + the operator of the next `/red-team` run observing zero dead dispatches when the arg was
  passed.

## Notes / conscious deviations

- **All calls below are AFK self-adjudicated (ADR 0014) — what an operator volley would have
  settled, with the ruling and its ground.**
- **Serial-pipeline test knob (would-be grill Q1):** the exactly-one-Explore assertion is only
  deterministic on a serial pipeline — verified: the in-file `fakePipeline` is
  `Promise.all`-concurrent and every item's first dispatch fires synchronously before any death
  is observed, so the pre-pin window spans all analyzed slots on the mock. Spec §8 pre-resolves
  this ("the sticky-pin test's exactly-one assertion holds on the serial mock harness"). Ruling:
  extend `runScaffold` with an optional pipeline parameter (default `fakePipeline`; existing
  callers byte-unchanged) + a `serialPipeline` helper, rather than reordering `SPINE` or weakening
  the assertion to a range. Production `pipeline()` semantics untouched.
- **`fallbackEngaged` stamp semantics (would-be grill Q2):** the spec pins the re-dispatch
  recovery case only. Ruling: stamp `fallbackEngaged: true` on any analyzed result produced on
  `ANALYZED_AGENT_FALLBACK` while the run's preferred type ≠ the fallback — covering both the
  re-dispatch recovery and the pinned-swap successes (uniform forensics: every analyzed row of an
  Explore-less run reads `dispatchedOn: 'general-purpose', fallbackEngaged: true`), and excluding
  the operator-override preferred===fallback case (there `general-purpose` IS the preferred type —
  consistent with End state 3's "preferred-type success carries no fallbackEngaged").
- **Pin-set logging (would-be grill Q3):** the `analyzed-agent fallback engaged:` token keeps
  firing exactly where it does today — on a dead preferred dispatch's re-dispatch. Pinned swaps do
  NOT re-emit it (the pin is already engaged; per-slot forensics ride the stamps). Under the
  concurrent window several tokens may fire (one per in-flight death) — existing `.some()`/
  `length > 0` assertions hold; the serial case emits exactly one.
- **`lenses.md` added beyond the spec's Surface-changes table** as a sweep re-verify target (its
  report-template `Fallback:` line is the one known cross-file fallback-prose surface) — may be
  zero-diff; the plan-affected-file-list lesson: a listed re-verify target with a zero-diff
  outcome is correct, not an omission.
- **Task 1.2 `requiresTest: false` (would-be grill Q4):** the diff touches only a `.test.mjs`
  file, so `requiresTest: true` would be trivially satisfiable — but there is no new test to map
  and the change is deliberately zero-behavioral; honest routing is the justified no-test route
  (precedent: plan-1's Task 2.2 comment-only reword). The suite-green + assertions-byte-unchanged
  checks are the task's evidence.
- **Sweep-token false positives pre-adjudicated:** `RED (` substring-matches `CLEARED (` at three
  sites in `red-team-gate.test.mjs` (verified at survey base: the two INCOMPLETE-verdict titles
  and the pass-probe-filter comment) — dispositioned accurate in Task 1.2's sweep, listed so the
  worker doesn't "fix" them.
- **1c/1e replacement prose specified semantically, never byte-literally** — the recorded
  plan-bullet-replacement lesson: a plan's literal replacement text can contradict its own End
  state; here the End state pins the checkable predicates (names the deleting edit; no
  order-attribution) and the worker owns the phrasing, modeled on the #816 sibling.
- **Worst-case arithmetic (End state 2) verified by trace:** first pass = preferred + fallback
  (2), Layer-4 retry = pinned-fallback + redundant-guard rethrow (1) ⇒ 3 for the pin-engaging
  slot; 2 for any slot dispatched after the pin. The existing bound test's mock (only
  `claims-vs-reality` dies, all agent types) yields exactly 3 under the concurrent default
  pipeline — no serialization needed for that case.
- **Stamps verified against existing assertions:** no `deepEqual` locks a probe-result object at
  survey base (the model/effort byte-shape lock reads dispatch-opts key sets; stamps ride results,
  not opts); the pinned swap changes an opts *value* (`agentType`), never the key set. Re-verify
  at the dispatch base.
- **One task for all of #890 (would-be grill Q5):** scaffold + its test are same-commit by
  discipline; SKILL.md rides along because pre-flight and pin are one layered defense the spec
  lands together (pre-flight alone is prompt-only; pin alone leaves the Lead uninformed). No
  same-file collision results — Task 1.2 owns only `red-team-gate.test.mjs`.
- **No CONTEXT.md term, no ADR** — spec §6/§7 record None ("sticky pin" is a local mechanic of
  the established analyzed-agent fallback; #727's decision envelope is refined, not amended). A
  conscious divergence from the sibling plans that carry ADR/CONTEXT tasks — spec-ratified.
- **Hardcoded agent-name literals stay** in the test file (spec constraint 5) — a future default
  change must loudly break tests; the new cases keep the posture.
- **requiresPackaging: false on all tasks** — meta-repo JS/prose changes; no Dockerfile in the
  footprint.
- **Anchors by named construct throughout** — never line numbers (they rot across the serial
  merge queue).
- **Grill round (26 questions, AFK self-adjudicated — rulings not already covered above):**
  - **Entry swap flows through `opts` (Q1):** reassign `opts = { ...opts, agentType:
    ANALYZED_AGENT_FALLBACK }` at entry so guard/log/errors all read the effective type from one
    place — folded into the task slice; value change only, key set untouched (Q5 guard).
  - **Pin-set when preferred===fallback (Q3):** the pin-set sits past the redundant-dispatch
    guard, so it is unreachable in a preferred===fallback run — the pin is never set there, the
    existing case stays green unmodified, and the Bound comment states this. Verified against the
    guard's position in the live `dispatchAgent`.
  - **Stamps never touch dispatch opts (Q5):** the exact-key `deepEqual` byte-shape lock in the
    model/effort suite (verified: `['agentType','label','phase','schema']`) is the standing guard;
    named in the slice as must-stay-green-untouched.
  - **Pin race (Q8):** plain boolean, idempotent set, JS single-threaded microtasks — no torn
    state possible; the residual is the in-flight window, already the scaffold-comment wording.
    One comment sentence, no locking code.
  - **No unpin (Q9):** a transient death pins the rest of the run — accepted residual in the
    block comment; NO unpin logic (speculative machinery for an unobserved case); the pin is
    run-scoped by construction (scaffold body re-evaluates per Workflow run), which also
    discharges the spec's no-cross-run-persistence non-goal.
  - **Stale scratch copies (Q10):** the grill's copy-identity premise is false by design — each
    run copies the scaffold to a scratch path, and pre-existing copies retain per-dispatch
    behavior until re-copied. No mechanism; throwaway by design (the 2026-07-12 plan recorded the
    same class as a no-backstop residual).
  - **Downgrade-survival arm (Q11):** verified `confirmStage`'s downgrade returns `{ ...res, … }`
    — stamps survive the spread; a cheap arm added to the trace case proves it.
  - **Per-field mentally-delete + red-proof (Q12/Q13):** three key-level assertions (including
    `!('fallbackEngaged' in r)` on the preferred-success arm) + the stash-and-rerun red-proof
    duty recorded in the done-report (in-file #727 precedent).
  - **End state 4 two-pipe comparison (Q14):** already the End-state wording — stamped vs
    stripped, equal verdicts, both exit 0.
  - **Spec sentence quoted + auditor byte-check (Q15):** the "design-review trigger, not a test
    to loosen" sentence is quoted verbatim in the slice; the auditor verifies the seven named
    #727 cases byte-unmodified.
  - **Sweep scope + named untouched externals (Q16):** corrections bounded to
    `red-team-gate.test.mjs`; the landed 2026-07-12 plan's item (e)/Notes restatements and the
    decoy-fixture lesson are named do-not-touch externals with the why (history; pattern record).
  - **#895 evidence precision (Q17):** the grill's "no `assert.` lines changed" is unmeetable —
    verified: the 1e order claim is an `assert.equal` message argument — corrected to
    "expressions/fixtures/imports unchanged; only titles, comments, and message strings move";
    grep guards run `-i` with mid-sentence anchors (End state 8 updated to `grep -in`).
  - **Healthy-harness delta (Q18):** in an Explore-present harness the ONLY observable change is
    the two stamp fields on analyzed results (same dispatch counts, same prompts); existing tests
    tolerate them because none deep-equals a probe-result object (verified, re-verify at base).
  - **No override trace arm (Q19):** skipped — `dispatchedOn` reads the same effective-type
    variable the dispatch itself uses, and the preferred-success arm already proves
    stamp-equals-effective-type; an override arm would re-prove it with a different literal.
    YAGNI, logged.
  - **Step-3 doc lock adopted (Q21/Q22):** criterion 6 would otherwise be unguarded prose; the
    cross-file region idiom already lives in `workflow-scaffold.test.mjs` (ff-topology), and both
    files are already Task 1.1's — one lock test, args-literal membership + case-tolerant
    pre-flight anchor, added to the mapped tests.
  - **Task 1.2 requiresTest stays false (Q23, re-weighed):** `true` would be *vacuously*
    satisfied by the very file under prose repair — the floor would report test evidence for a
    change that deliberately adds none, which misleads the auditor; the justified no-test route
    states the truth (prose-only, zero behavioral diff) and the auditor grades that claim
    directly.
  - **Backstops (Q24):** already two honest AI-declared entries with named runners (live
    Explore-less behavior; pre-flight obedience) — never a bare None.
  - **Five restatement sites enumerated (Q25):** SAFETY header, `ANALYZED_AGENT` declaration
    comment, `dispatchAgent` block comment (incl. Bound), worst-case test comment/message,
    SKILL.md Step 3 — the lock-step bullet lists all five; the log token is an explicit frozen
    do-not-touch. (`lenses.md`'s report-template line is a sweep target, not a restatement of the
    retry model.)
  - **Q20 not relayed** by the coordinator's digest; every draft section was re-checked in this
    round regardless — no further change surfaced.
- **Spec non-goals → named landing spots (Q26):**
  | Spec §9 non-goal | Landing spot in this plan |
  |---|---|
  | No change to `red-team-gate.mjs` | Task 1.2 slice (byte-untouched; source comment stays); file absent from every task's `Files:` |
  | No journal event for dead dispatches | Task 1.1 non-goals bullet (harness-owned, sandbox-unreachable) |
  | No report/gate surfacing of the stamps | Task 1.1 non-goals bullet (forensic, deferred) + End state 4 proves gate inertness |
  | No renaming of the log token | Task 1.1 lock-step bullet's frozen do-not-touch + Method |
  | No widening of exhausted/rethrow or the redundant guard | Method guardrails + Task 1.1 entry-swap/pin-set bullets |
  | No cross-run pin persistence | Task 1.1 non-goals bullet + block-comment "run-scoped by construction" (Q9) |
- **Predecessor-consistency:** intent heading is `## AI-Commander's Intent` (AFK-drafted, ADR
  0014), matching the 2026-07-12 AFK set (red-team-enforcement-hygiene et al.); plan 1 of this
  campaign (gate-evidence-and-prose-truth) uses the operator heading — it had an operator
  conversion volley (its "Ratified decisions" section), this plan does not; both headings are
  recognized by extraction surfaces. Tone/scope match: delete-the-feature test discipline,
  region/comment lock-step, sweep + `Survey:` block convention, directive-form trailing release
  phase, backstops with named runners.
- **Contention (this campaign):** shared with plan 1 — only the four release slots
  (`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` ×2 slots, `README.md`), serial
  by stack order, resolved from the live tip at land time. Plan 1 also touches `CONTEXT.md` and
  `docs/adr/` — this plan touches neither (roadmap-ordering input: no edge needed beyond the
  release-slot serialization).

## Open decisions

None — the spec's resolved design tree settled pin locus/semantics, trace shape, pre-flight
layering, the bound-assertion change, and the 1e keep-vs-delete call; the drafter's latitude
(serial test harness, `fallbackEngaged` uniformity, pin-set logging, sweep scope) and all 26
adversarial-grill questions are self-adjudicated in Notes per ADR 0014 (AFK — no operator volley;
conservative rulings where spec + code underdetermine).
