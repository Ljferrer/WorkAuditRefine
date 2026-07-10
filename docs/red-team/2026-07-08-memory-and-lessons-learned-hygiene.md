# Red-team report — Memory-store hygiene (memory-and-lessons-learned-hygiene)

**Plan:** `docs/plans/2026-07-08-memory-and-lessons-learned-hygiene.md`
**Source spec:** `docs/specs/2026-07-08-memory-and-lessons-learned-hygiene-design.md`
**Date:** 2026-07-09 · **Base:** `dev/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization` @ `d366371` (plans 1–4 landed; ADRs 0023–0027 present, plan-2 `audit_sha` machinery present)
**Verdict:** **CLEARED-WITH-NOTES** (self-adjudicated under AFK campaign)

## Attack surface
- **11 probes** (6 spine + 5 bespoke), all on-target (0 off-target, 0 dropped), coverage whole.
- **Executed proof:** 2 executed probes in throwaway sandboxes (`executable-proof`, `guard-verb-admissibility`); 9 analyzed (read-only).
- Bespoke: `anchor-check-cited-constructs`, `guard-verb-admissibility` (executed), `drift-guard-unguarded-new-mirror`, `drift-guard-default-flip-old-absent`, `backstop-legitimacy`.

## Results
- **pass 9 / warn 2 / fail 0.** No Critical, no Major, no `needsDecision`.
- **guard-verb-admissibility (executed, pass):** confirmed `hooks/validate-auditor-git.sh` already ALLOWS `git show <sha>:<path>` (incl. the `-C` peel) and DENIES `git grep` — Task 1.4 / End-state 8's "allowlist byte-unchanged, `git show` accepted" claim holds against the live guard.
- **anchor-check (pass):** every cited existing construct present — `cmdArchive`/`archiveCandidates`/`buildProjection`/`walkCorpus`/`argv._.slice(1)` in `war-memory.mjs`; `resolves_in()` archive-arm in `safe-swap.sh`; `memClause`/`auditPrompt()` in `workflow-template.js`; D3 in `war-servitor.md`; the three existing test files; allowlist with no `grep` verb.
- **drift-guard-unguarded-new-mirror (pass):** Task 1.4 ships both-surfaces drift-guards in `workflow-template.test.mjs` for both new mirrored clauses (servitor finding-match, auditor committed-grounding).
- **backstop-legitimacy (pass):** all 4 deferred validations carry a concrete why + named runner + timing; none over-broad; heading is the plain (operator-ratified) variant.

## Findings & resolutions applied (2 Minor, non-blocking)
1. **[Minor · consistency-placeholders]** Task 1.1's call-site-sweep parenthetical misattributed the `--candidates` prohibition to `SKILL.md`; it actually lives in `references/migration.md:188`. **Fixed:** reworded the attribution in the plan (patch commit).
2. **[Minor · drift-guard-default-flip-old-absent]** Task 1.1 rewords `war-memory.mjs`'s `refuse`/`warn` messages (mutating→lists) but criteria 1–4 asserted only new behavior — a partial reword leaving `archives ALL of these` would pass silently (ADR 0025 old-absent gap; the pattern was applied to Task 1.3's SKILL flip and Task 2.1's blurb but omitted here). **Fixed:** added an OLD-absent grep to Task 1.1's test set asserting the retired phrasing is gone. **Collateral note added to plan Notes:** `docs/learnings/lessons-learned-tooling-traps.md` carries a stale sentence describing the old message — flagged for post-land servitor/housekeeping refresh (out of Task 1.1's code+test scope).

## Residual risk
None blocking. The two Minors are resolved in-plan; the collateral learning-doc line is tracked as a post-land housekeeping item, not a merge blocker. The 4 deferred backstops (live trichotomy obedience, servitor finding-match obedience, auditor committed-grounding in a real VERIFY, `--candidates` call-site sweep completeness) carry named runners and roll into the campaign aggregate.
