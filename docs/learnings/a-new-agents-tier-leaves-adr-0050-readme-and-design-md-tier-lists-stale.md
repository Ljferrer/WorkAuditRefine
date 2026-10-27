---
name: a-new-agents-tier-leaves-adr-0050-readme-and-design-md-tier-lists-stale
description: "Adding an agents.<tier> leaves tier lists in ADR 0050, README and design.md stale, and no test reads them"
metadata:
  node_type: memory
  type: project
  keywords:
    - agents.trial
    - new tier
    - tier list
    - ADR 0050
    - preset tiers
    - README presets
    - design.md helper tiers
    - KNOWN_AGENT_KEYS
    - TIER_PATHS
    - doc cascade
    - refiner recovery
  provenance: code-verified
  slug: a-new-agents-tier-leaves-adr-0050-readme-and-design-md-tier-lists-stale
  phase: "2026-10-26-interview-fork-trials-and-pair-beats/phase-1 (task 1.3, phase-close polish)"
  tags:
    - war
    - war-config
    - doc-drift
    - presets
    - adr
  created: 2026-10-26
  originSessionId: a0630eb5-4cbe-4285-9e36-47dec6a15717
  modified: 2026-10-27T02:34:57.773Z
---

# A new `agents.<tier>` leaves three prose tier lists stale, and no test pins them

**What task 1.3 changed.** It added `agents.trial` to `skills/war/assets/war-config.mjs`:
`KNOWN_AGENT_KEYS`, `DEFAULTS.agents.trial`, the `thorough` and `economy` presets. It added the
`/war-room` bullet and put `trial` in the `TIER_PATHS` list of the monotone-rank test in
`skills/war/assets/war-config.test.mjs`. The code and the test were complete.

**What stayed stale.** The cascading-impact seat found three prose lists that name the tiers. No test
reads them.

1. `docs/adr/0050-preset-tiers-order-by-model-capability.md`: the Decision tier list ("eight tiers")
   and the economy paragraph's inherit list.
2. `README.md`: the sentence that says which tiers `thorough` pins and which tiers `economy` leaves out.
3. `skills/war/references/design.md`: the clause that says which tiers `agentMatrix()` and
   `workerTierMatrix()` do not enumerate.

**A pre-existing gap surfaced too.** The sweep showed that `refiner.recovery`, added earlier, was also
missing from the ADR list and from the README economy clause. Economy leaves that tier to `DEFAULTS`.

**Outcome.** The phase-close polish fixed all of them before land. Verified present at the integrated
tip.

**How to apply.** When you add a tier, grep the name of the previous tier (for example `snipe`) across
`README.md`, `docs/adr/0050-preset-tiers-order-by-model-capability.md`,
`skills/war/references/design.md` and `skills/war-room/SKILL.md`. Also grep for a snapshot count word
such as "eight tiers". The README preset sentence and the ADR sit under a de-mirror row that bans model
and effort words, so name the tier and nothing else.

**Locate-cue (verify still present before acting).** ADR 0050 Decision list (search `refiner recovery`),
`README.md` (search `and the trial tier`), `skills/war/references/design.md` (search `enumerated by
neither helper`). Grounded at the phase-1 integration tip via the run-scoped `_refinery` worktree
(rung 2). The stale instances were resolved before land, so this is a checklist, not a live defect.

Related: [[new-run-config-knob-needs-war-room-whitelist-touch]],
[[default-flip-must-audit-all-doc-surfaces]].
