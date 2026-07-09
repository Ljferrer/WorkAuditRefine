# Red-team report — land-path-integrity-and-status-enum-discipline

**Plan:** `docs/plans/2026-07-08-land-path-integrity-and-status-enum-discipline.md`
**Source spec:** `docs/specs/2026-07-08-land-path-integrity-and-status-enum-discipline-design.md`
**Repo:** `/Users/ljf/GitHub/WorkAuditRefine` @ `origin/master` `1e83448`
**Date:** 2026-07-09 · **Adjudication:** AFK self-adjudicated (campaign `2026-07-08-memory-frictions`)

## Verdict: **CLEARED**

## Attack surface

10 probes in round 1 — 5 spine analyzed (`claims-vs-reality`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan`; `executable-proof` dropped — plan ships no complete runnable artifacts) + 5 bespoke:

| probe | technique | round-1 |
|-------|-----------|---------|
| git-primitive-semantics | executed | pass |
| die-exit-code-fidelity | executed | pass |
| adr-version-slots | executed | pass |
| precondition-anchors | analyzed | pass |
| backstop-legitimacy | analyzed | pass |

## Executed proof

Three executed probes ran the mechanical claims in throwaway sandboxes and all passed:
- **git-primitive-semantics** — `git ls-remote` empty-vs-sha (first-land signal / absent-origin detector), `git rev-list --left-right --count <merge-sha>...origin/<working>` right-count 0-vs-nonzero (transient-vs-divergence discrimination), and `git merge-base --is-ancestor` exit codes (the absent-origin trustworthiness predicate) all behave exactly as the plan's land-truth guard and reland discrimination require.
- **die-exit-code-fidelity** — `die()` in `provision-worktrees.sh` (`printf … >&2; exit "${2:-1}"`) honors a second positional arg as the exit code; `die "<msg>" 3` yields 3, `die "<msg>"` yields 1. The exit-3 phantom contract is sound.
- **adr-version-slots** — ADR 0023 free; four release slots consistent at `0.14.14` (next free patch `0.14.15`, resolved at land time).

## Findings & resolutions applied

**Round 1 — BLOCKED (D7 mis-anchor; 3 concurring probes).** `claims-vs-reality` (warn), `dependency-feasibility` (fail), `intent-vs-plan` (fail) all proved Task 1.3 D7's "rewrite SKILL.md escalation-completion prose so it stops enumerating raw push/rev-parse/ls-remote/update-ref steps" was false — SKILL.md carries **no** such enumeration; the raw 6-step `--force-with-lease` dance lives in the memory lesson `docs/learnings/held-escalation-lead-manual-completion.md` (steps 4–6), which no task touched, leaving a live contradiction with the ADR 0023 this plan introduces.
- **Resolution:** D7 re-anchored to **both** surfaces — SKILL.md gets a concrete-prose **ADD** (not a rewrite) routing escalation-completion through `land-advance`, and the memory lesson is added to Task 1.3's `Files` with its steps 4–6 rewritten to the same `land-advance` routing (retiring the raw `--force-with-lease` recipe), keeping the lesson's teaching intact. End state 4, the D7 backstop, and a Notes entry updated accordingly.

**Round 2 — BLOCKED (phantom-tiebreak premise; `claims-vs-reality` fail, adversarially confirmed).** Task 1.1's stated premise "a fresh `--no-ff` merge commit cannot already be the follower's tip (the follower only advances inside `land-advance`)" is factually false: `cmd_ensure_integration`'s behind-case fast-forwards `refs/heads/<working>` via `git update-ref` (the `do_follower_ff` branch) at the next phase's Provision. On a cross-resume of an interrupted land, this can make `follower == new_sha` in a benign already-landed case, which the plan's tiebreak classifies as phantom → exit 3.
- **Adjudication (verified against `cmd_land_advance` lines 702–754 + spec §4 D1 / criterion 1 / glossary):** the plan's **behavior is correct and fail-safe**. The plan's origin-anchoring is a genuine improvement over the spec's `pre_push_local` guard (which *masks* a phantom when the follower lags). The one "broken" case degrades to a **safe false-escalation** (the work is already on origin; resolved via the now-`land-advance`-routed escalation path) that **matches the ratified spec's own behavior** (the spec also escalates it, having no exit-0 branch), and it does **not** touch the exit-0 reconciliation that is load-bearing for Task 1.2's in-loop transient recovery (follower genuinely lags there). Auto-reconciling it would require phase-base context that breaks the deliberately-stable 2-arg `land-advance` contract.
- **Resolution:** corrected the false premise prose, documented the fail-safe residual as a conscious deviation (test case (1) already pins the `origin==follower==new_sha ⇒ exit 3` behavior). No land-path redesign.
- **Companion Minor (needsDecision, same probe):** Phase-2 split rationale cited a same-file collision on `workflow-template.js`, but post-grill-Q7 Task 2.1 only **parses** that file (its D8 test reads the land block) and does not edit it. **Resolution:** dropped `workflow-template.js` from Task 2.1's `Files`, re-justified the phase edge on the parse-order dependency (D8 needs the finalized Phase-1 land block); ordering conclusion unchanged.

**Minors (auto-fixed, round 1).** Drift-guard mis-attribution across Task 2.1 D8, End state 5/7, and Notes: `land-decision.test.mjs` owns the `KNOWN_LAND_DECISIONS` doc-surface drift-guard; the `HARD_ESCALATION_REASONS` inline-mirror guard lives in `war-config.test.mjs` (per the comment at the `workflow-template.js` `.includes(landResult.status)` site). Corrected; the new D8 reachability test still co-locates in `land-decision.test.mjs` (it imports `HARD_ESCALATION_REASONS`). Opportunistic-resync-bullet location corrected (`agents/war-refiner.md`, not SKILL.md).

**Backstop legitimacy.** The `## Deferred validations (backstops)` section (D6, D7 — not AI-declared) passed all three checks (deferral justified: operator-facing prose, no test surface designated by spec §5; no existing pre-merge proxy; runner + timing named). D7's backstop was expanded to cover the added memory-lesson surface.

## Residual risk

- **Phantom vs. already-landed tiebreak (conscious residual, fail-safe):** a cross-resume already-landed whose follower was ff'd by `cmd_ensure_integration` escalates (exit 3) instead of auto-reconciling. Safe (work is on origin; operator confirms via the `land-advance`-routed escalation path), rare (needs a cross-invocation resume of an interrupted land), matches the source spec's behavior. Documented in the plan's Notes.
- **D6/D7 prose (backstops):** validated by human review + this red-team read; no automated test surface (spec §5 designates none).

## Re-verify trail
- R1: 10 probes → BLOCKED (D7). R2: `{claims-vs-reality, dependency-feasibility, intent-vs-plan, consistency-placeholders}` → BLOCKED (new phantom-tiebreak Major; D7 confirmed resolved). R3: `{claims-vs-reality, dependency-feasibility, consistency-placeholders}` → all pass → **CLEARED** (bounded, ≤2 rounds per blocker).
