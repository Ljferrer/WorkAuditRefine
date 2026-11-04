# Default seat models follow the #2497 routing; ace, roster seats and skill seats route on their own

**Status:** accepted (operator ruling of 2026-10-30 on issues #2497 and #2519; refines
[ADR 0050](0050-preset-tiers-order-by-model-capability.md), whose rank rule still holds)

Issue #2497 asked whether WAR over-provisions its seats. Its analysis found fable overkill for
bounded worker, fix and ace work, and found sonnet/high a good routine auditor. It also warned that
opus finds more extra mechanisms on boundary-heavy work. One field run (PR #2529) applied that
routing by hand, with a patch to each staged phase script. Issue #2519 asked for the routing as
config.

## Decision

**The balanced defaults (`DEFAULTS.agents` in `war-config.mjs`) move down one model tier.** The
base and fix worker tiers run opus, docs-only tasks run sonnet, and auditors run sonnet. The
values live in `war-config.mjs` and the `/war-room` preset bullets, never restated here.

**`thorough` pins its worker tiers at fable**, so it stays at or above `balanced` on every tier.
**`economy` moves its docs tier to sonnet**, so `balanced` stays at or above it. The
model-rank test in `war-config.test.mjs` checks both.

**Ace work gets its own tier.** `agents.worker.ace` drives the `--ace` dispatches and the terminal
pass. It has no default: an absent ace tier uses the fix tier, so ace runs opus by default.

**A roster seat can carry its own `model` and `effort`.** They replace the auditor tier for that
seat only. This is how the Lead keeps opus on a boundary-heavy seat (security, parsing, Git or
filesystem, recovery, state machines) while routine seats run sonnet.

**Amended 2026-10-31 (0.21.25): every subagent role in `/war-machine`, `/survey-corps` and `/lessons-learned` gets a skill seat.**
`agents.machine`, `agents.survey` and `agents.lessons` each map that skill's role names
(`SKILL_SEATS` in `war-config.mjs`) to a `{ model, effort }` tier. By operator ruling (2026-10-30), the
balanced defaults put plan conversion on the stronger models: every war-machine seat runs above the
survey readers, and the revise pass runs the strongest model. The survey clusterer, synthesizer and
critic and the lessons editor also run above the reading roles. The lessons retype and keyword
passes write only short metadata, so they stay with the reading roles. `thorough` runs each seat one
model tier higher, capped at fable. `economy` runs a little lower. The values for each preset live in
`war-config.mjs` and the `/war-room` skill seats bullets, never restated here. Each skill reads them
fail-open: a missing config file uses the balanced defaults, and an invalid config leaves the agents
on the session model.

**Amended 2026-10-31 (0.21.25): a rebuttal round can take its own tier.** A configured
`agents.auditor.rebuttal` replaces each rebuttal-round seat's tier, the seat's own roster
`model`/`effort` included. Every preset sets it one model above its auditor tier, capped at fable. A
hand-written config that omits it keeps each seat's usual tier.

**Amended 2026-11-03 (#2534, #2545): the Lead picks each audit seat's tier.** By operator ruling, the
Lead picks a tier for each audit seat the same way it picks the seat's lens and depth, under every
roster policy, and states the choice in a one-line rationale. Sonnet on every seat missed real
behavior bugs in the field, and opus on every seat cost too much on routine seats. A roster seat
names `tier: 'low'` or `tier: 'high'`. `agents.auditor.high` is defaulted, and
`agents.auditor.low` is not: a seat with no tier, or with tier low and no low block, runs the base
auditor model and effort, so an old config runs as before. A high tier whose model ranks below the
base auditor model resolves to the base tier, so a config written before this amendment never drops
a high seat below its other seats. The values for each preset live in
`war-config.mjs` and the `/war-room` preset bullets, never restated here. The boundary rule is the
floor: a boundary-heavy seat takes the high tier and never runs below opus, an explicit seat pin below
opus rises, and a `fable` tier stays. A seat that widening adds from a valid nomination runs on the
high tier, because widening fires only on a Critical or a low-confidence finding. A default-fallback
widening adds the config roster rows as they are. The approval gate prints each seat's resolved
model, and the launch check warns, never refuses, when a task with a boundary signal has no seat at
opus or above.

**Amended 2026-11-03 (#2534 item 23b): /snipe and /zero-in seats step down a rung.** By operator ruling,
the two rungs let the Lead step a lens down gracefully between audit rounds, before it narrows the panel.
`agents.snipe` is the high rung and the defaulted `agents.snipe.low` is the low rung. A low model that ranks
above the snipe model runs as the snipe tier. The Lead picks each seat's rung and depth with its lens, and a
boundary-heavy seat takes the high rung at deep. In `/zero-in`, a lens that found a Critical, Major or Minor
stays high at deep and is never dropped, and a quiet lens steps down one rung per round: high at deep, low
at deep, low at neighbors, then dropped. Every preset steps down the same way, and `thorough` starts from a
higher budget. The default config runs no fable audit seat. The values live in `war-config.mjs` and the
`/war-room` preset bullets, never restated here.

## Consequences

- A run with no config file now spends less on workers and auditors. A missed finding on a
  boundary-heavy task is the main risk: the Lead must route those seats to opus.
- The engine fallbacks (`ROLE_MODEL`, `WORKER_TIER_DEFAULTS` in `workflow-template.js`) and the
  agent card frontmatter follow `DEFAULTS`, bound by the existing drift guards.
- Automatic routing by task class, a sampled opus review of clean sonnet approvals and per-model
  telemetry are not part of this decision. Issue #2534 tracks them.
