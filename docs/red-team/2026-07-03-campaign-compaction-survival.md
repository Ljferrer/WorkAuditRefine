# Red-team — Campaign compaction survival (write-ahead CAMPAIGN-STATE.md + post-compact re-injection hook)

**Plan:** `docs/plans/2026-07-03-campaign-compaction-survival.md`
**Spec:** `docs/specs/2026-07-03-campaign-compaction-survival.md`
**Date:** 2026-07-03 · **Repo baseline:** `dev/2026-07-03-campaign-compaction-survival` @ `c55ace4` (cut from plan-5's tip; v0.14.1)
**Verdict: CLEARED** — 8/8 probes on-target, zero findings, none dropped.

## Attack surface
8 probes: 5 spine (claims-vs-reality/preconditions, coverage-vs-source [spec present], consistency, dependency-feasibility, intent-vs-plan) + 3 bespoke (hook-idiom-fidelity, adr-number-anchor, construct-anchor-check). `executable-proof` dropped — the hook + its test are the plan's DELIVERABLES (described in prose, no shipped runnable code block to prove); their feasibility is covered by the executed hook-idiom-fidelity probe instead.

## Executed proof
- **hook-idiom-fidelity** (executed, sandboxed): confirmed the preconditions for building `hooks/inject-campaign-state.sh` + sibling test — existing `hooks/` scripts already use the stdin-JSON + `jq` idiom the plan mirrors, `hooks/hooks.json` parses and carries the `PreToolUse` groups the plan leaves untouched while adding a `SessionStart` group, `jq` is on PATH, and `ls -t` mtime ordering works (the plan correctly forbids `stat -f`/`-c`). PASS.

## Analyzed proof
- **adr-number-anchor:** `docs/adr/0016-*` is free (expected number holds); `docs/adr/0015-*.md` exists as the house-format template to mirror. PASS.
- **construct-anchor-check:** every named edit anchor exists verbatim on the base — SKILL.md's `## State & resume — spec §7.2` heading, the `**Context hygiene.**` lifecycle step 6, the trailing `<!-- bundled-routine note:` comment, and the literal ``built-in `/compact` `` string; the design spec's §7.1 step-6 / §7.2 resume bullet / §10 self-`/compact` bullet; CONTEXT.md's `### Campaigns (multi-plan orchestration)`; README's `### Run a campaign` section. PASS.
- **coverage-vs-source, consistency, dependency-feasibility, intent-vs-plan, claims-vs-reality:** all PASS, no findings. The plan's four End-state conditions are individually checkable and each maps to a task; the version bump is correctly specified as land-time-current + 0.0.1 with no literal.

## Residual risk
None blocking. Two conscious deviations are documented in the plan and sound: (1) spec validation criterion 8 (a live-session `/compact` smoke test) is an operator PR-checklist item, not a worker deliverable — the `.test.sh` proves the script's stdin→stdout contract, the harness-fires-the-matcher half is manual; (2) the write-ahead protocol is a prompt directive (the hook is the code-enforced half). Both are honest boundaries, not gaps.
