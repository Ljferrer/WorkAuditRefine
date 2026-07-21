---
name: weak-test-assertion-passes-without-feature-being-exercised
description: "Delete feature mentally; assert must fail w/o it"
metadata:
  node_type: memory
  type: project
  keywords: [vacuous test, false green, contains substring match, shared exit code, delete and trace, dead regex branch, negative match on undefined, temp-break RED proof, aggregate threshold count, inflated count, padding intro line, single-item removal slack, qualifier lock, anchor-derived region, region includes anchor substring, self-satisfying token, sliced-from-anchor window, hardcoded empty field, inert tiebreak, coincidental fixture ordering, localeCompare no-op]
  provenance: agent-unverified
  slug: weak-test-assertion-passes-without-feature-being-exercised
  phase: audit-scheduler-integrity/t4 +11 recurrences (latest lessons-learned-tighten/phase-1 task 1.1, 2026-07-21)
  date: 2026-07-21
  tags:
    - testing
    - assertion-strength
    - threading
    - workflow-template
    - guard-test
  promoted: weak-test-assertion-passes-without-feature-being-exercised
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
  modified: 2026-07-21T21:01:52.650Z
---

# Weak assertions pass without the feature being exercised

**Rule:** before trusting a green test, mentally delete the guard/feature and trace whether every assertion still passes. If it does, the test proves "no crash," not "feature works." Failure shapes (11 instances across 11 phases, all fixed or recorded in-repo; this slug is cited by test headers, e.g. `war-pipeline-structure.test.sh`):

- **Contains-assertion** matching text already in the base string → assert a token unique to the threaded value (a serialized key/number, a clause heading).
- **Shared exit code:** guard-fired and fallback path (e.g. empty diff) both exit 1 → build a fixture where only the guard produces that exit.
- **Multi-step guard:** a case satisfied by step N masks all steps >N → add a case only the target step can satisfy; a fixture detail inert for the pass-path can still be load-bearing for the temp-break RED proof — judge against both.
- **Dead regex alternate:** a branch embedding a literal `${...}` placeholder never matches rendered output — drop it or test the template pre-render.
- **Negative match on a keyed lookup:** `/x/.test(undefined)` returns false → add an `assert.ok(x)` presence guard before any negative match.
- **Substring-of-old-form:** after a reword, a positive `includes` on a substring of the removed form is vacuous alone → pair with a negative absence assert on the superset form.
- **Wrong loop-exit path:** a test titled for a guard term may exit via a different branch entirely; trace end-to-end — unreachability may mean the guard is defensive-dead, not that the fixture is wrong.
- **Stale audit prose:** a finding's rationale can narrate a pre-fix draft — re-Read the file at HEAD before recording a "gap" (see [[audit-log-finding-can-be-stale-by-land-time]]).
- **Aggregate-threshold count inflated by a padding line (plan-and-prompt-literal-brittleness-and-auditor-calibration/t1.4):** a test meant to lock "N distinct items each retain property P" (e.g. "each of the 4 calibration rules keeps its confirmation qualifier") is written as a single occurrence-count assertion (`count >= N`) against the whole surface. If the surface also carries an unrelated line that legitimately repeats the same phrase (a section-intro sentence restating the qualifier before the enumerated rules), the true occurrence count is N+1. A regression that silently drops the property from exactly *one* of the N items still leaves the count at N — at or above the threshold — so the assertion stays green while the specific defect it was written to catch (single-item silent widening) slips through undetected. The test's own comment can misstate this as "one occurrence per rule (N)," miscounting the intro line. **Fix:** either raise the threshold to the true total (N+intro), or — stronger — assert the property is present *within each item's own anchored span* (pair each item's anchor regex with a trailing property-match on the same slice) rather than a single whole-surface count.
- **Anchor-derived region self-satisfies a substring of its own anchor literal (new, learnings-recipe-drift-sweep/1.1 gate-audit, 2026-07-16, disposition `note` — not a hold, worker implemented the plan's literal token list verbatim):** a doc-contract drift-guard test builds its check region as `text.slice(text.indexOf(ANCHOR_PHRASE), end)` — i.e. the region is defined to *always begin with* `ANCHOR_PHRASE` — then separately asserts `region.includes(t)` for a family of "trigger" tokens meant to lock a nearby sentence. If any token `t` is a plain substring of `ANCHOR_PHRASE` itself (e.g. asserting `'retire'` when the anchor is `'retired-token sweep'`), that assertion **cannot fail while the anchor's own presence-assert already passed** — it contributes zero discriminating power, masked behind an unrelated earlier `assert.ok`. A delete-and-trace "RED proof" that deletes the *whole* trigger sentence (including the anchor) still goes red correctly via the surviving discriminating tokens, hiding that some individual tokens in the family are inert; a **partial** reword (dropping only the non-discriminating tokens) passes silently. A second variant of the same trap: a trigger token satisfied by *unrelated* prose elsewhere in the same sliced region (e.g. a routing sentence's own use of "consolidated" satisfying a trigger-family check for `'consolidate'`) is equally non-discriminating, for a different reason (over-broad region, not anchor-overlap). **Fix:** scope trigger-token assertions to the trigger *sentence* (slice from the anchor to the first sentence-terminator), not the whole swept region; or assert an anchored multi-word phrase instead of independent single-word substrings; drop any trigger token that is itself a substring of the anchor phrase — the anchor's own `assert.ok` already covers it.

- **Hardcoded-empty fixture field makes a comparison function's own tiebreak inert, so a
  two-function equivalence assertion passes for a coincidental reason, not a forced one**
  (lessons-learned-tighten/phase-1 task 1.1, 2026-07-21, `disposition: note`, three separate
  auditor findings converged on the same construct — code-verified at the landed tip,
  `skills/_shared/war-memory.test.mjs`'s `rec()` fixture helper, `evictedSlugs`/`archiveCandidates`
  comparison around the "fallback (criterion 5)" test): a test asserts
  `tightenPlan(...).eligible` order equals `archiveCandidates(...)` order as a way to lock the
  fallback (no query-log) eviction ordering. `tightenPlan`'s age axis is a distinct field
  (`effectiveDate`, varied per fixture row); `archiveCandidates`'s age tiebreak reads a *different*
  field (`.date`, `localeCompare`) which the shared `rec()` helper hardcodes to `''` for every
  fixture row — so `archiveCandidates`'s own age comparison is a no-op (stable sort by tier only)
  and the two orders coincide only because the fixture's within-tier input order was **already**
  hand-arranged oldest-first. The test is not fully vacuous — it still catches a broken/removed
  tier sort — but it does **not** discriminate a broken/removed age tiebreak in either function,
  because one side of the equivalence never exercises age at all. **Fix:** give the fixture helper
  a distinct non-empty `date` per row (ideally matching the intended `effectiveDate`) so the
  compared function's own age axis is actually live, or add a dedicated fixture (equal
  hits/tier, divergent age, input order reversed from expected) that only an age-aware sort can
  pass.

**Why:** green no-op tests survive feature deletion and rot silently. **How to apply:** run the delete-and-trace check on every new guard/threading assertion; pair positives with negatives and negatives with presence guards; for "each of N items has property P" assertions, count every legitimate occurrence of P's phrase on the surface (including intro/summary lines) before picking a threshold, or switch to a per-item anchored check; for an anchor-sliced region, check whether any locked token is itself a substring of the anchor literal or satisfiable by unrelated prose already in-region before trusting a whole-sentence delete-and-trace RED proof as evidence every individual token discriminates.

**Verification note (discharged 2026-07-12):** the t1.4 referent is now directly verified at the live tip — the aggregate `>= 4` occurrence count was **retired** and replaced by the stronger fix from the bullet above: per-rule window checks (`qualifierPerRuleWindows` in `workflow-template.test.mjs`, whose comment cites the one-occurrence slack) plus a delete-the-feature companion mutation test that cites this lesson by slug. The tracked gap (#693) is closed COMPLETED; the bullet stands as the durable pattern.

**Verification note (2026-07-16, learnings-recipe-drift-sweep bullet):** sourced from that phase's own `gate-audit:approve` finding (`gateEvidence:true`, pinned `auditSha: c247088d`, Minor/`note`) reading the anchor-slice logic and trigger-token list directly in `skills/war/assets/war-config.test.mjs`. I could not independently Read/Grep-confirm the referent myself — my checkout lags the landed branch (see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]], Recurrence 9) — so this stays `agent-unverified` despite the strong gate-audit evidence trail.

Related: [[gitmodules-working-tree-read-vs-ref-snapshot]], [[land-local-follower-ref-can-lag-sync-before-next-phase]], [[gate-audit-pin-bracket-test-blocked-by-git-guard]], [[shared-string-constant-quote-literal-byte-anchor-fragility]], [[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]], [[process-recipe-lesson-body-is-not-drift-guarded-by-any-test]], [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]].
