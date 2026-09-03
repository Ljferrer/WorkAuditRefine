---
name: ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed
description: "Before touching `aceBisect`, read its filed issues: the ladder shipped with follow-up-routed fragilities and some stay open."
metadata: 
  promoted: dev/2026-08-19-realized-absorb-rate@phase-1
  node_type: memory
  type: project
  provenance: code-verified
  slug: ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed
  phase: "realized-absorb-rate/phase-1 task 1.1 (landed dev/2026-08-19-realized-absorb-rate, tip 291943e); addendum realized-absorb-rate/phase-4 task 4.1 (landed tip 5cbf08d); addendum 2026-08-25-engine-reliability-and-filing-fidelity/phase-7 tasks 7.1+7.2 (landed dev/2026-08-25-engine-reliability-and-filing-fidelity, tip fb732ef)"
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
    - prompt-mandated vs code-enforced
    - resume idempotency contract unverified
    - no engine-side trailer assert
    - floor-retry reserve
    - roundLimit minus 2
    - aceRelPath
    - FINDING-PATH FORM
    - doc cascade budget exhaustion vs floor-retry reserve
    - parkAsk exactly-once object identity
  tags: 
    - war
    - engine
    - workflow-template
    - ace
    - known-gap
  created: 2026-08-20
  originSessionId: d1c9bd01-e7da-46af-a12d-d59dbd7a69d1
  modified: 2026-08-26T22:42:10.252Z
---

# The `aceBisect` ladder shipped with filed-not-fixed fragilities; check what is still open before touching it

**Rule:** the bisection ladder in `skills/war/assets/workflow-template.js` (`aceBisect`) landed with
audit findings routed `follow-up` and filed as issues, not fixed. A task touching `aceBisect` must
read the filed issues for current status first, and treat every still-open item as a known
constraint, not a fresh discovery.

**Current state of the original five (verified against `aceBisect` on master):**

1. Trailer prefix ambiguity and final-paragraph isolation (#1560): fixed in prompt text. The subset
   dispatch prompt mandates EXACT whole-string equality on the `Ace-Subset:` value and requires the
   trailer as the commit's own final paragraph. Still prompt-mandated, not engine-enforced: nothing
   re-reads `%(trailers:)` on the returned `head_sha`. Issue still open.
2. Culprit attribution by exact file string (#1561): fixed. The `aceRelPath` helper normalizes
   both sides of `culpritFiles.has(...)`, and it is hoisted above `aceGroups` so the grouping key
   and the trailer file set use the same form (#1813). Issue still open.
3. Unwrapped subset and batch dispatches: STILL OPEN (#1481 corroboration). The `const sw = await
   dispatch(` subset call and the `const ace = await dispatch(` batch call go through `dispatch`
   (the semaphore seam), not `dispatchAgent` (the try/catch that stamps `warDispatchDeath`). A
   harness death mid-ladder still turns a mergeable task into a HARD `held:workflow-error`.
4. Shared `fixRounds` starvation (#1562): mitigated. Subset commits stop at the floor-retry reserve
   (`if (r.task.fixRounds >= roundLimit - 2)`), holding two slots for the merge-floor retry loop.
   Residual: the batch ace keeps its own `< roundLimit` gate, and `run.roundLimit <= 3` makes the
   ladder inert from its first iteration. Issue still open.
5. Failing-subset re-audit Minor/Nit findings dropped (#1563): fixed via `minorsOf` routing inside
   the loop. Its `parkAsk` object-identity residual is also fixed: `parkAsk` now dedups by
   `askContentKey` and records corroborators (#1790).

The doc cascade (ADR 0013, `CONTEXT.md`, `skills/war/SKILL.md`, `references/design.md`) now
narrates the floor-retry reserve; that residual is closed.

Recurrences: 2 (phase 4 release addendum; engine-reliability phase 7 addendum).

**Locate-cue:** `aceBisect` in `workflow-template.js`: the `culpritFiles`/`culprits` split, the
`roundLimit - 2` reserve check, the `trailer` const, and the `dispatch(` calls inside the
`while (queue.length)` loop.

## Related

[[env-died-classification-wraps-only-impl-and-fix-dispatch-not-provision-or-audit-or-null-return]]
[[committed-repo-config-can-shadow-a-flipped-engine-default]] (sibling `roundLimit` shadowing)
[[release-blurb-overstates-guard-semantics]] (prompt-mandated trailer sold as a commit guarantee)
[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] (why the doc cascade first shipped stale)
[[parkask-object-identity-dedup-breaks-under-per-round-fresh-copy-minorsof]] (the #1563-fix residual, since fixed)
[[standing-instruction-vs-dispatched-prompt-coverage-split]] (FINDING-PATH FORM landed dispatched-prompt-only)
