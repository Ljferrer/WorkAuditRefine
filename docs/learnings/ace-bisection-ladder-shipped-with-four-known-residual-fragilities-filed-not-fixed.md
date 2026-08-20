---
name: ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed
description: "The new aceBisect ladder (workflow-template.js, phase 1.1 of realized-absorb-rate) landed with four known-and-filed-not-fixed residual fragilities: (1) the Ace-Subset trailer value <taskId>:<sorted-files> is prefix-ambiguous across parent/child subsets and can be invisible to git %(trailers:) when not its own final paragraph; (2) culprit attribution keys on exact file-string equality, so path-form drift silently falls back to blind halving; (3) aceBisect's dispatches sit outside dispatchAgent/try-catch, so a harness death converts an approved mergeable task into held:workflow-error; (4) the ladder can starve the merge-floor retry loop's shared fixRounds budget — treat all four as known live gaps in this construct, not resolved, until their filed issues land"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed
  phase: "realized-absorb-rate/phase-1 task 1.1 (landed dev/2026-08-19-realized-absorb-rate, tip 291943e)"
  keywords: 
    - aceBisect
    - Ace-Subset trailer
    - culprit attribution
    - blind halving
    - bare agent dispatch
    - held:workflow-error
    - fixRounds budget starvation
    - bisection ladder
    - trailer prefix ambiguity
    - git trailers valueonly
  tags: 
    - war
    - engine
    - workflow-template
    - ace
    - known-gap
  created: 2026-08-20
  originSessionId: d1c9bd01-e7da-46af-a12d-d59dbd7a69d1
  modified: 2026-08-20T08:54:33.496Z
---

# The new `aceBisect` ladder landed with four known, filed-but-unfixed fragilities

**Found (code-verified — landed tip `291943e` on `dev/2026-08-19-realized-absorb-rate`, verified
in the phase's `_refinery` worktree; all four were audit findings on the NEW bisection code — task
1.1, commits `667b34a` + ace polish `c100869` — routed `follow-up` and filed as issues rather than
fixed pre-land):**

1. **Trailer-shape ambiguity (#1560).** The deterministic `Ace-Subset:` trailer value is built as
   `<taskId>:<sorted,joined,files>` (`workflow-template.js`, the `trailer` const inside `aceBisect`'s
   while-loop: `r.task.id + ':' + [...new Set(sub.findings.map(f => f.file))].sort().join(',')`).
   Because a parent subset's file set is always a superset of its children's, one child's trailer
   value can be a literal string-prefix of a sibling/parent's — the resume-idempotency preflight scan
   (`git log --format='%H %(trailers:key=Ace-Subset,valueonly)' ...`) can match the wrong commit on a
   prefix collision. Also: `%(trailers:)` only recognizes a trailer block that is its own final
   paragraph in the commit message — a trailer line that isn't cleanly isolated can be invisible to
   the very preflight scan meant to find it.
2. **Culprit attribution by exact file-string equality (#1561).** `culpritFiles.has(f.file)` (same
   function) requires byte-exact path match between a blocking regression finding's `file` and an
   aceable finding's `file`. Any path-form drift (relative vs repo-relative, trailing slash, case on
   a case-insensitive fs) between the two makes attribution silently fail closed to the `culprits.length
   === 0` branch — i.e. it falls back to blind halving instead of surfacing the real culprit,
   with no error or log signal that attribution missed.
3. **Bare, unwrapped dispatch sites (corroborates
   [[env-died-classification-wraps-only-impl-and-fix-dispatch-not-provision-or-audit-or-null-return]],
   issue #1481).** `aceBisect`'s subset-fix `agent()` call (up to 6 dispatches across the bisection
   depth) is a bare call with no `dispatchAgent`/try-catch wrapping distinct from the two sites that
   lesson already names — a harness death mid-ladder converts what would otherwise be an approved,
   mergeable task into a HARD `held:workflow-error`, discarding the salvageable ace work already
   accepted at shallower depths.
4. **Shared `fixRounds` budget starvation (#1562).** The ladder's own round-limit check
   (`r.task.fixRounds >= roundLimit`) draws from the *same* counter the merge-floor retry loop (fix
   rounds) and the no-test sub-loop share (see the existing shared-budget test coverage in
   `workflow-template.test.mjs`). A bisection that consumes several subset commits can leave the
   task with zero budget left for an unrelated later fix round, starving it.
5. **(Related, same audit pass, #1563) failing-subset re-audit rounds' own fresh Minor/Nit findings
   are dropped unrouted** in at least one code path inside the ladder's re-audit handling — worth
   checking alongside the four above if touching this code.

**Why record this instead of waiting for the fixes:** all five are `follow-up`-disposed, not
`absorb`, so nothing forced them to be fixed before land — they are real, currently-live gaps in
shipped code, not stale findings. A future task touching `aceBisect` should treat all of them as
known constraints, not surprises, and check the filed issues (#1560-#1563, #1481 corroboration)
for current status before re-diagnosing from scratch.

**Locate-cue (verify still present before acting):** `aceBisect` in
`skills/war/assets/workflow-template.js` — the `trailer` construction, the `culpritFiles`/`culprits`
split, the bare `agent()` dispatch inside the `while (queue.length)` loop, and the
`r.task.fixRounds >= roundLimit` check.

## Related

[[env-died-classification-wraps-only-impl-and-fix-dispatch-not-provision-or-audit-or-null-return]]
[[committed-repo-config-can-shadow-a-flipped-engine-default]] — same phase, sibling task 1.2's
independent `roundLimit` shadowing issue on the budget this ladder also draws from.
