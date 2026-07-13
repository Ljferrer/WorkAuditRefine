---
name: gate-artifact-capture-repeatedly-node-only-despite-combined-gate-command
description: "HYPOTHESIS: every captured .war/gate-<taskId>.log this phase contained only the node --test half of the resolved gate; the shell *.test.sh discovery loop's output was absent from all six audit-log gate-audit entries"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: gate-artifact-capture-repeatedly-node-only-despite-combined-gate-command
  phase: "Floor fixes (plan 2026-07-12-floor-script-correctness, landed dev/2026-07-12-floor-script-correctness)"
  keywords: 
    - gate-taskId.log
    - resolveGate
    - self-discovering gate
    - node --test
    - shell test loop
    - war-config.mjs
    - tee full gate output
    - SOFT cannot-confirm
    - artifact capture
    - war-refiner merge-task step 7
  tags: 
    - gate-audit
    - gate-evidence
    - test-visibility
    - hypothesis
  related: 
    - "[[gate-output-curated-excerpt-obscures-mapped-test-evidence]]"
    - "[[floor-script-discovery-set-must-mirror-gate-exclusions]]"
  created: 2026-07-12
  originSessionId: 3e7df1e1-5759-4eb0-9cb3-db7f6b90a91d
---

# HYPOTHESIS — captured gate artifacts may structurally omit the shell-test-loop half of a resolved gate

**Observed symptom (all agent-monologue, from the audit log — not independently confirmed against
code):** in this phase, **every one of six gate-audit entries** (tasks 1-4 individually, plus the
`phase-1-integrated-tip` gate-audit covering all four) noted the same SOFT cannot-confirm finding:
the captured `.war/gate-<taskId>.log` / `.war/gate-phase-1.log` artifact contained **only** the
`node --test 'skills/**/*.test.mjs'` run (760-787 lines, per-test tallies, exit 0) with **zero**
shell-test-loop output (no `== gate(bash): ... ==` banners, no per-suite PASS lines) — even though
every task in this phase had its mapped acceptance test in a `.test.sh` file
(`assert-packaging-in-diff.test.sh`, `assert-no-submodule-mutation.test.sh`,
`assert-guard-specificity-in-diff.test.sh`).

**Why this is surprising:** `war-config.mjs`'s `resolveGate(declaredGate)` (verify still present
before acting — found at `skills/war/assets/war-config.mjs` around the `resolveGate` export, this
checkout, 2026-07-12) explicitly builds a **combined** command string —
`` `${declaredGate} && ${discovery}` `` — where `discovery` is the `for f in $(find . -name
'*.test.sh' ...)` loop. If the refiner's step-2 gate run actually invokes `resolveGate`'s combined
string and step 7 tees "the FULL step-2 gate stdout+stderr" (per `agents/war-refiner.md`), the
captured artifact **should** contain both halves. Six-for-six node-only captures in one phase is
either (a) evidence the dispatched gate command in this phase's run config was the bare
`declaredGate` without `resolveGate` wrapping it, (b) an artifact-capture mechanism that silently
truncates a compound `&&` command after its first clause, or (c) coincidental/session-specific and
not a code defect at all. **No inward refute pass was performed** — this file does not have the
evidence trail (primary evidence + ruled-out alternatives) the self-confound gate requires for a
root-cause claim, so it is recorded as an explicitly-labeled hypothesis, not a diagnosed defect.

**Why potentially durable:** if (a) or (b) holds, this is systemic — **every** future phase whose
mapped acceptance tests live in `.test.sh` files will generate the same repeated SOFT
cannot-confirm gate-audit finding, phase after phase, for a gap that (per the phase's own auditor)
"the mapped test is present and uncompromised... the phase merged and landed under BENIGN-ADVANCE"
— i.e. never a land-halt, but a permanent evidentiary blind spot on the shell half of every gate.

**How to apply / next step:** before this recurs a second time, check (with Bash, which the
servitor role lacks) whether the actual dispatched gate command for a `requiresTest:true` shell-test
task is `resolveGate(declaredGate)` or the bare `declaredGate`, and whether
`<_refinery>/.war/gate-<taskId>.log` genuinely contains both halves when the gate is run manually
with `tee`. If confirmed as a real gap, the fix is likely either wiring `resolveGate` into whatever
constructs the step-2 gate command for tasks with shell-mapped tests, or having the refiner
explicitly run the shell-test-loop as a second teed command into the same artifact file.

Related: [[gate-output-curated-excerpt-obscures-mapped-test-evidence]] (the general
artifact-vs-curation lesson this refines — that lesson already established the tee-to-file
mechanism as the fix for curated excerpts; this note flags that the mechanism itself may not be
capturing the full compound command).
