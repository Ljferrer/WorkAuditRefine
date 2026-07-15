# Red-team report — 2026-07-14-red-team-fallback-and-anchor-hygiene

- **Plan:** `docs/plans/2026-07-14-red-team-fallback-and-anchor-hygiene.md`
- **Source spec:** `docs/specs/2026-07-14-red-team-fallback-and-anchor-hygiene-design.md`
- **artifactKind:** `impl-plan` (per-task `Files:` under `## Build order`; not red-first)
- **Run:** 2026-07-16, campaign `2026-07-14-survey-debt` (plan 2 of 4), self-adjudicating under AFK
  (zero operator volleys — no blocker or needsDecision surfaced)
- **Verdict:** **CLEARED** (gate: `CLEARED-WITH-NOTES` — round 1: 12/12 probes on-target,
  0 blockers / 0 needsDecision / 2 Minors, both resolved below)

## Attack surface / executed proof

One Workflow round (`wf_e713d44f-a19`), model opus / effort high (run config `agents.redteam`),
provision `[]` (no manifest, structural fallback empty). 6 spine lenses + 6 bespoke probes
(baseline-repro, anchor-check-scaffold, anchor-check-gate-test, command-diff, snippet-fidelity,
default-flip-old-absent); 5 executed / 7 analyzed; coverage whole (`onTarget == expected == 12`,
no off-target, no dropped).

- **Baseline:** both target suites green at base in a sandbox worktree (scaffold suite + gate
  suite). Note: the sandbox was cut from the main checkout's detached HEAD (`0a42e34`, plan-1
  pre-phase-1) rather than plan 2's branch tip `c5bdd77d` — equivalent for these suites, since
  plan 1's landed footprint is disjoint from `skills/red-team/**` (verified by the campaign
  contention table and plan 1's diffs).
- **`ff-topology` derivation: not triggered** — token grep plus hand-read of the evidence prose
  found no merge-commit-topology anchors (every `...` hit is JS spread syntax; End state 5's
  byte-unmodified check and End state 11's gates-at-land are not first-parent/`^1` anchors).
  Recorded, not skipped.
- **`unguarded-new-mirror` (Lead-run): vacuous pass** — the plan adds no inline mirror to
  `workflow-template.js` (its code footprint is the red-team scaffold only).
- **`default-flip-old-absent` (executed): pass** — the probe simulated a completed Task 1.1 with
  one enumerated surface left stale and adjudicated the five-site lock-step + sweep as the plan's
  deliberate, adequate closure under ADR 0025 (the comment surfaces are prompt-protected by
  same-commit discipline with the sweep as the floor; the mechanically-locked surfaces — the
  bound test message and the Step-3 presence lock — red on their own).

**Escape guard:** exit 1, routed through the diagnosis pre-flight (action-provenance first) and
cleared — the only stray files were the two campaign-boundary materializations
(`docs/plans/2026-07-15-campaign-state-anchor.md` + its design spec), written by the campaign
Lead's own sanctioned materialize step before this run launched, untracked by design until plan
4's branch is provisioned. No probe artifacts, no tracked-file mutations. Not an escape.

## Findings and resolutions applied

1. **CONTEXT.md:740 glossary drift — sweep-scope gap** (command-diff, `warn`, Minor). The
   existing `**analyzed-agent fallback**` glossary entry defines the mechanism as a per-item
   "reactive re-dispatch of an analyzed probe/confirm" — a framing the sticky pin makes stale
   (post-pin dispatches are proactive entry-swaps, not re-dispatches). The entry sits outside the
   sweep's `skills/red-team/` scope and outside all five lock-step sites, so the plan's own
   OLD-absent doctrine structurally could not reach it. **Patched (AFK self-adjudicated,
   auto-fix):** `CONTEXT.md` added to Task 1.1's `Files:`; the lock-step enumeration widened
   FIVE → SIX with the glossary entry as site 6 (definitional touch-up, explicitly NOT a new
   term — spec §6's "no new terms" holds); the sweep grep widened to
   `grep -rn -i 'fallback' skills/red-team/ CONTEXT.md`; the Notes bullet retitled
   "No NEW CONTEXT.md term"; the Q25 enumeration updated.
2. **AI-declared intent provenance** (intent-vs-plan, probe `pass`, Minor — confirmation
   artifact). The intent block is `## AI-Commander's Intent` (ADR 0014): all 11 End-state
   conditions are individually checkable, task-mapped, and collectively sufficient, but no
   operator ratified them. **Auto-noted** (standing ADR 0014 posture for `--afk` plans); the
   human upgrade path is `/war-strategy <plan>`.

## Backstop-legitimacy (AI-declared section — heading variant recognized)

Both entries are legitimate; each carries the mandatory **AI-declared** Minor marker (an AI
drafted these waivers; no human has ratified them — flagged for operator attention at the `/war`
approval gate, which under `--afk` is this note):

- **Live Explore-less-harness confirmation** — justified (unit cases prove stickiness on a serial
  mock; real dispatch concurrency and UI rendering are only observable live); runner + timing
  named (operator of the next `/red-team` run in an Explore-less harness, via run UI + persisted
  task output); no cheaper pre-merge proxy exists. *(This run itself cannot discharge it — this
  harness has `Explore` in its registry, so the fallback never engages.)*
- **Lead pre-flight obedience** — justified by design (no code can read the Lead's harness
  registry; the sticky pin is the shipped in-run backstop, which is why both land in one task);
  runner named (the pin itself + the next `/red-team` operator observing zero dead dispatches).

## Adjudications

None — no operator volleys; no authoritative values (versions, release slots) were changed. The
one plan patch (finding 1) is an AFK Lead self-adjudication recorded above, not an operator
adjudication; version precedence for the release phase remains directive-form (next free patch
above the live base).

## Residual risk

- The four comment-only lock-step surfaces (SAFETY header, `ANALYZED_AGENT` declaration comment,
  `dispatchAgent` block comment, CONTEXT.md glossary entry) are same-commit-discipline +
  sweep-floor protected, not mechanically OLD-absent-locked — adjudicated adequate by the
  drift-guard probe (the recorded comments-lag-code class is accepted with the sweep as floor).
- The plan's two AI-declared backstops (above) ride into `/war` as `args.backstops` with
  `aiDeclared: true` and surface at every land.
