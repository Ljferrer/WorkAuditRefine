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
(`SKILL_SEATS` in `war-config.mjs`) to a `{ model, effort }` tier. By operator ruling (2026-10-30), plan
conversion runs on the stronger models: every war-machine seat runs above the survey readers, and the
revise pass runs the strongest model. The survey critic and the roles that write or regroup an
artifact also run above the reading roles. The values live in `war-config.mjs` and the `/war-room`
skill seats bullets. `thorough` runs each seat one model tier higher, capped at fable. `economy` runs
a little lower, but plan drafting, clustering and spec synthesis keep opus. Each skill reads them fail-open: a missing config
file uses the balanced defaults, and an invalid config leaves the agents on the session model.

## Consequences

- A run with no config file now spends less on workers and auditors. A missed finding on a
  boundary-heavy task is the main risk: the Lead must route those seats to opus.
- The engine fallbacks (`ROLE_MODEL`, `WORKER_TIER_DEFAULTS` in `workflow-template.js`) and the
  agent card frontmatter follow `DEFAULTS`, bound by the existing drift guards.
- Automatic routing by task class, a sampled opus review of clean sonnet approvals and per-model
  telemetry are not part of this decision. Issue #2534 tracks them.
