---
name: full-gates-green-end-state-soft-without-threaded-gate-log-artifact
description: "Split a 'gates green' End state: confirm the structural half directly, and grade the execution half SOFT unless a stamped gate log at the tip proves it"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: full-gates-green-end-state-soft-without-threaded-gate-log-artifact
  phase: "red-team-fallback-and-anchor-hygiene/phase-2 (Release, task 2.1) +24 recurrences (latest 2026-10-26-interview-fork-trials-and-pair-beats/phase-2)"
  keywords:
    - full gates green
    - gate-log artifact
    - pin_status
    - end-state audit
    - gate-audit
    - SOFT finding
    - cannot-confirm
    - refiner-owned
    - version-slots
    - release phase
    - version-slots.test.mjs arbiter
    - lock-step equality
    - integrated-tip gate-audit
    - self spot-verify
    - phase-close polish commit
    - gate captured pre-polish
    - GATE_EXIT terminal stamp
    - gate-phase-N.log
    - met via corroboration
    - second corroborating artifact
    - tip-correspondence without stamp
    - fast-forward range
    - linear range no merge commit
    - git branch --contains
    - tip_sha first-line stamp
    - exit_code last-line stamp
    - gate_log_path unthreaded
    - endStateAttestations
    - GATE_LOG_STAMP
    - refiner-agent compliance
    - gate-only End state no endstate artifact
    - backstop-owned End state out-of-scope note
  tags:
    - audit-pipeline
    - gate-audit
    - end-state
    - release
    - test-strategy
  created: 2026-07-15
  updated: 2026-10-26
  originSessionId: e11422bd-1b49-4d13-9840-37a67306b3f5
---

# "Full gates green" as an End-state condition is SOFT, not HARD, without a threaded gate-log artifact

**The rule.** Many End states bundle a structural clause with an execution clause, for example "all four release slots bumped together, and full gates green at land." Running the gate is the refiner's job during Refine and Land. An end-state or gate-audit seat often gets no gate-log path and no `pin_status` token for it. Split the condition:

- Confirm the structural half directly (`git show` at the pinned SHA).
- Record the execution half as a Nit, `disposition: note`, SOFT cannot-confirm. Never hold the land only because the artifact is missing.

A missing artifact in this seat's prompt is a capability gap, not proof that the claim is false. Same family as [[deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold]].

**Release-phase variant.** For a version-bump End state, the structural half is the four slots (`plugin.json` `version`, `marketplace.json` `metadata.version` and `plugins[0].version`, README `## Status`) reading the same next free patch at the pinned SHA, plus `skills/war/assets/version-slots.test.mjs` present as the lock-step arbiter. That is the load-bearing evidence. The runtime gate log is refiner-owned color.

**Earning `met` without a stamp.** A seat can still attest `met` when it proves both legs below and records the proof in its evidence field. If either leg is missing, SOFT stays the default.

1. Tip identity. Use any one of these:
   - The log's own paths are rooted in a worktree whose branch you `git rev-parse` to the confirmed tip.
   - The phase range `<phase-base>..<tip>` is linear with no merge commit (a fast-forward), and `git branch --contains=<tip>` lists the task branch and the working branch. This proves the gated tree is the integrated tree, not just reachable from it.
2. A second artifact from the same round, stamped with `tip_sha:` at the same tip, that re-runs at least one of the same assertions green (for example an `endstate-<phase>-<n>.log` that re-runs `version-slots.test.mjs`).

A bare SHA match alone does not earn HARD. With no token and no second leg, the seat still records SOFT.

**A gate captured before a polish commit.** A present, used gate log is not automatically tip evidence. Check which tree it ran over. A per-task `gate-<id>.log` captured before a phase-close `--ace` polish commit does not cover the post-polish tip, and no `gate-phase-<n>.log` may exist. A seat may corroborate only the files the polish touched, through other tip-stamped artifacts, and must say so. A polish commit that touches behavior should trigger a fresh `gate-phase-<n>.log` at the post-polish tip ([[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]]).

**An unstamped log forces inference.** Without a `tip_sha:` first line and an `exit_code:` last line, a seat infers green from the absence of `not ok` markers and the presence of the last suite's header. `GATE_LOG_STAMP` in `skills/war/assets/workflow-template.js` now orders the stamp and a fixture tests the prompt, but live refiner captures have still shipped unstamped. Check the artifact itself; a green fixture does not prove the next capture complies.

**Gate-only End states attest `unverified`.** A `check:` End state gets its own `endstate-<phase>-<n>.log`. A gate-only End state gets none, so it depends on the threaded `gate_log_path` alone. When the path is not threaded (even if the Lead's merge and land records hold one), the seat attests `unverified` with a Nit note. A backstop-owned End state also attests `unverified` with an "out-of-scope" note. That is information, not a defect.

**Read `endStateAttestations`, not only `findings`.** A seat can return `findings: []` and put the whole SOFT reasoning in `endStateAttestations[].evidence`. An empty `findings` array does not prove the gap went unnoticed.

The four `pin_status` states and how each grades live in [[audit-gate-anti-cheat-spine-pin-equality-benign-advance-verdict-hard]].

**History.** Recurred 24 times, 2026-07-17 to 2026-10-26. The fix (thread a stamped gate log and `pin_status` to every gate-audit and end-state dispatch) has been recommended since the tenth recurrence and is still a recurring Nit, so a Lead should take it out of the Nit lane.

Related: [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]], [[version-slots-no-cross-slot-consistency-test]], [[endstate-check-dispatch-captures-only-one-command-per-condition-row]], [[engine-change-landed-this-run-cannot-exercise-itself-same-run]].
