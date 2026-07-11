---
name: weak-test-assertion-passes-without-feature-being-exercised
description: "Delete feature mentally; assert must fail w/o it"
metadata:
  node_type: memory
  type: project
  keywords: [vacuous test, false green, contains substring match, shared exit code, delete and trace, dead regex branch, negative match on undefined, temp-break RED proof, aggregate threshold count, inflated count, padding intro line, single-item removal slack, qualifier lock]
  provenance: agent-unverified
  slug: weak-test-assertion-passes-without-feature-being-exercised
  phase: audit-scheduler-integrity/t4 +9 recurrences (latest 2026-07-09)
  date: 2026-07-09
  tags:
    - testing
    - assertion-strength
    - threading
    - workflow-template
    - guard-test
  promoted: weak-test-assertion-passes-without-feature-being-exercised
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

# Weak assertions pass without the feature being exercised

**Rule:** before trusting a green test, mentally delete the guard/feature and trace whether every assertion still passes. If it does, the test proves "no crash," not "feature works." Failure shapes (10 instances across 10 phases, all fixed or recorded in-repo; this slug is cited by test headers, e.g. `war-pipeline-structure.test.sh`):

- **Contains-assertion** matching text already in the base string → assert a token unique to the threaded value (a serialized key/number, a clause heading).
- **Shared exit code:** guard-fired and fallback path (e.g. empty diff) both exit 1 → build a fixture where only the guard produces that exit.
- **Multi-step guard:** a case satisfied by step N masks all steps >N → add a case only the target step can satisfy; a fixture detail inert for the pass-path can still be load-bearing for the temp-break RED proof — judge against both.
- **Dead regex alternate:** a branch embedding a literal `${...}` placeholder never matches rendered output — drop it or test the template pre-render.
- **Negative match on a keyed lookup:** `/x/.test(undefined)` returns false → add an `assert.ok(x)` presence guard before any negative match.
- **Substring-of-old-form:** after a reword, a positive `includes` on a substring of the removed form is vacuous alone → pair with a negative absence assert on the superset form.
- **Wrong loop-exit path:** a test titled for a guard term may exit via a different branch entirely; trace end-to-end — unreachability may mean the guard is defensive-dead, not that the fixture is wrong.
- **Stale audit prose:** a finding's rationale can narrate a pre-fix draft — re-Read the file at HEAD before recording a "gap" (see [[audit-log-finding-can-be-stale-by-land-time]]).
- **Aggregate-threshold count inflated by a padding line (new, plan-and-prompt-literal-brittleness-and-auditor-calibration/t1.4):** a test meant to lock "N distinct items each retain property P" (e.g. "each of the 4 calibration rules keeps its confirmation qualifier") is written as a single occurrence-count assertion (`count >= N`) against the whole surface. If the surface also carries an unrelated line that legitimately repeats the same phrase (a section-intro sentence restating the qualifier before the enumerated rules), the true occurrence count is N+1. A regression that silently drops the property from exactly *one* of the N items still leaves the count at N — at or above the threshold — so the assertion stays green while the specific defect it was written to catch (single-item silent widening) slips through undetected. The test's own comment can misstate this as "one occurrence per rule (N)," miscounting the intro line. **Fix:** either raise the threshold to the true total (N+intro), or — stronger — assert the property is present *within each item's own anchored span* (pair each item's anchor regex with a trailing property-match on the same slice) rather than a single whole-surface count.

**Why:** green no-op tests survive feature deletion and rot silently. **How to apply:** run the delete-and-trace check on every new guard/threading assertion; pair positives with negatives and negatives with presence guards; for "each of N items has property P" assertions, count every legitimate occurrence of P's phrase on the surface (including intro/summary lines) before picking a threshold, or switch to a per-item anchored check.

**Verification note (this write):** the specific referent for the new bullet — `skills/war/assets/workflow-template.test.mjs`'s `QUALIFIER` regex / `>= 4` threshold test, and the "only when the live artifact confirms" qualifier in `agents/war-auditor.md` / the built `auditPrompt()` — was **not independently re-Grep-verified** in this write; this checkout (`.claude/worktrees/sad-sutherland-141916`) predates the phase's landed changes on `dev/2026-07-08-plan-and-prompt-literal-brittleness-and-auditor-calibration` (same known worktree-staleness pattern as [[audit-worktree-pre-impl-tip-stale-verdict]] and [[process-recipe-lesson-body-is-not-drift-guarded-by-any-test]]). The fact is sourced from a Minor, disposition-`absorb` audit finding at the confirmed `audit_sha` for t1.4, not from my own Read/Grep. **Before applying, re-Read `workflow-template.test.mjs` on the landed branch to confirm the QUALIFIER regex, its threshold, and whether the absorb fix (raise to >=5 or per-rule anchoring) has already landed.**

Related: [[gitmodules-working-tree-read-vs-ref-snapshot]], [[land-local-follower-ref-can-lag-sync-before-next-phase]], [[gate-audit-pin-bracket-test-blocked-by-git-guard]], [[shared-string-constant-quote-literal-byte-anchor-fragility]], [[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]].
