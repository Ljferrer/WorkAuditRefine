---
name: weak-test-assertion-passes-without-feature-being-exercised
description: "Delete feature mentally; assert must fail w/o it"
metadata:
  node_type: memory
  type: project
  keywords: [vacuous test, false green, contains substring match, shared exit code, delete and trace, dead regex branch, negative match on undefined, temp-break RED proof]
  provenance: code-verified
  slug: weak-test-assertion-passes-without-feature-being-exercised
  phase: audit-scheduler-integrity/t4 + worker-test-floor/t1 + fix-worker-result-binding/p2-t2 + land-advance-origin-propagation/p2-t2 + auditor-git-guard-readonly-c-flag/phase2-t2 + ace-nit-autofix/phase2-t3 + submodule-servitor-hygiene-sweep/phase1-t1 + test-assertion-hygiene-sweep/t3 + pipeline-skills/task10
  date: 2026-07-02
  tags:
    - testing
    - assertion-strength
    - threading
    - workflow-template
    - guard-test
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Weak assertions pass without the feature being exercised

**Rule:** before trusting a green test, mentally delete the guard/feature and trace whether every assertion still passes. If it does, the test proves "no crash," not "feature works." Failure shapes (9 instances across 9 phases, all fixed in-repo; this slug is cited by test headers, e.g. `war-pipeline-structure.test.sh`):

- **Contains-assertion** matching text already in the base string → assert a token unique to the threaded value (a serialized key/number, a clause heading).
- **Shared exit code:** guard-fired and fallback path (e.g. empty diff) both exit 1 → build a fixture where only the guard produces that exit.
- **Multi-step guard:** a case satisfied by step N masks all steps >N → add a case only the target step can satisfy; a fixture detail inert for the pass-path can still be load-bearing for the temp-break RED proof — judge against both.
- **Dead regex alternate:** a branch embedding a literal `${...}` placeholder never matches rendered output — drop it or test the template pre-render.
- **Negative match on a keyed lookup:** `/x/.test(undefined)` returns false → add an `assert.ok(x)` presence guard before any negative match.
- **Substring-of-old-form:** after a reword, a positive `includes` on a substring of the removed form is vacuous alone → pair with a negative absence assert on the superset form.
- **Wrong loop-exit path:** a test titled for a guard term may exit via a different branch entirely; trace end-to-end — unreachability may mean the guard is defensive-dead, not that the fixture is wrong.
- **Stale audit prose:** a finding's rationale can narrate a pre-fix draft — re-Read the file at HEAD before recording a "gap" (see [[audit-log-finding-can-be-stale-by-land-time]]).

**Why:** green no-op tests survive feature deletion and rot silently. **How to apply:** run the delete-and-trace check on every new guard/threading assertion; pair positives with negatives and negatives with presence guards.

Related: [[gitmodules-working-tree-read-vs-ref-snapshot]], [[land-local-follower-ref-can-lag-sync-before-next-phase]], [[gate-audit-pin-bracket-test-blocked-by-git-guard]]
