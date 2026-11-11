---
name: ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed
description: "RESOLVED: aceBisect fragilities closed. Check its issues, trailers stay log-only"
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

# The `aceBisect` ladder shipped with filed-not-fixed fragilities

**RESOLVED (instance) — kept as concept anchor.** All issues filed against the ladder (#1481, #1560, #1561, #1562, #1563, #1790, #1813) are closed. Subset dispatches now go through `dispatchSite` inside `aceDispatchProbed`, so a harness death no longer turns a mergeable task into a hard `held:workflow-error`. The `roundLimit - 2` floor-retry reserve is gone; the ladder spends its own `absorbRounds` meter (ADR 0013 amendment), never `fixRounds`.

**Rule:** before touching `aceBisect` in `skills/war/assets/workflow-template.js`, check its filed issues for current status, and treat any still-open item as a known constraint, not a fresh discovery. One residual stays by design: the `Ace-Subset`/`Ace-Charge` trailers are prompt-mandated, and `trailerGapLog` only logs a missing trailer; nothing enforces it.

**Locate-cue:** `aceBisect` in `workflow-template.js`: the `culpritFiles`/`isCulprit` split, the `absorbRounds` budget stop, the `trailer` const, and the `aceDispatchProbed(... dispatchSite(` subset call.

## Related

[[env-died-classification-wraps-only-impl-and-fix-dispatch-not-provision-or-audit-or-null-return]]
[[committed-repo-config-can-shadow-a-flipped-engine-default]] (sibling `roundLimit` shadowing)
[[release-blurb-overstates-guard-semantics]] (prompt-mandated trailer sold as a commit guarantee)
[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] (why the doc cascade first shipped stale)
[[parkask-object-identity-dedup-breaks-under-per-round-fresh-copy-minorsof]] (the #1563-fix residual, since fixed)
[[standing-instruction-vs-dispatched-prompt-coverage-split]] (FINDING-PATH FORM landed dispatched-prompt-only)
