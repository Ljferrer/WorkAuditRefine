---
name: per-site-fanout-throttle-composes-multiplicatively-across-nested-call-sites
description: "RESOLVED (2026-08-30-engine-concurrency-and-pin-transfer, #1897): a pacing knob applied independently at each nested fan-out site yields N² concurrent agents, not N; the fix is one global counting semaphore at the dispatch seam"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - run.maxParallel
    - batched
    - fan-out throttle
    - nested concurrency
    - rate limit pacing
    - workflow-template.js
    - concurrency ceiling
    - per-site throttle
  provenance: code-verified
  slug: per-site-fanout-throttle-composes-multiplicatively-across-nested-call-sites
  phase: "2026-08-25-engine-reliability-and-filing-fidelity/Phase 1 (tasks 1.1, 1.3)"
  tags: 
    - war
    - workflow-template
    - concurrency
    - config
  created: 2026-08-25
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-08-26T06:35:06.903Z
---

# A per-fan-out-site throttle nests multiplicatively, not additively

**RESOLVED (2026-08-30, plan `2026-08-30-engine-concurrency-and-pin-transfer`, issue #1897):**
the per-site group slicing this lesson describes is retired. `run.maxParallel` is now a true
global ceiling: one global counting semaphore at the leaf dispatch seam caps agent dispatches in
flight across the whole run, so nested fan-outs cannot exceed N. The durable rule below still
holds for any *new* multi-site pacing knob; the doc surfaces it names now carry the global
wording, pinned by `skills/war/assets/doc-semantics.test.mjs`.

**Found (code-verified at landed tip `6cfe09a2a475755010c98446389e706171f36c65` on
`dev/2026-08-25-engine-reliability-and-filing-fidelity`, worktree
`.claude/war-worktrees/2026-08-25-engine-reliability-and-filing-fidelity-2026-08-26/_refinery`):**
Phase 1 of this plan added a `run.maxParallel` pacing knob and a `batched(thunks, n)` helper
(`skills/war/assets/workflow-template.js:374`) that each independent fan-out site throttles to
groups of `n`. The knob is threaded into **four** call sites: the per-wave task fan-out
(`:1514`/`:2336`), and — reached from *inside* each in-flight wave-task thunk, via `auditRound` —
the auditor-roster fan-out and its dropped-seat retry (`:1208`, `:1213`). Because the roster
fan-out runs nested inside the wave fan-out, worst-case concurrent agent dispatches compose
**multiplicatively**: `run.maxParallel: N` yields up to `N task-thunks × N audit seats = N²`
concurrent agent dispatches (N=3 → 9, N=5 → 25), not `N` total. Three separate audit seats across
two gate-audit rounds independently flagged this on task 1.1 alone (correctness, auditor-1 ×2) —
faithful to the letter of End state 2 ("at most N task thunks run concurrently"), but a real gap
against the Commander's Intent Purpose ("pace fan-out on rate-limited accounts").

## The durable rule

When a single throttle/pacing config knob is threaded into **more than one fan-out call site**,
and one of those sites is reachable from inside another (nesting, not just sibling sites), the
effective worst-case concurrency is the **product**, not the sum, of the per-site caps. Any
operator-facing doc surface describing such a knob must say **"per fan-out site"** explicitly and
name the nesting (e.g. "a wave of N tasks each running its own N-seat audit roster can hold more
than N sub-agents at once") — never phrase it as a flat/global agent ceiling. This repo's fix
landed in the same phase: `skills/war-room/SKILL.md`'s `run.maxParallel` bullet and
`CONTEXT.md`'s **Batching helper** glossary entry both now carry the "per fan-out site … nested
fan-outs compose" clause. If a future plan wants the Purpose ("pace against a rolling rate
window") satisfied literally rather than per-site, the fix is a **single shared in-flight
semaphore** across all sites, not more per-site group slicing — that is a plan/mechanism decision,
not a bug in this phase's slice (its own End states scoped it to "at most N task thunks").

**Locate-cue (verify still present before acting):** `batched()` at
`skills/war/assets/workflow-template.js:374`; call sites at `:1208`, `:1213`, `:1514`, `:2336`;
doc fix at `skills/war-room/SKILL.md` (the `run.maxParallel` bullet) and `CONTEXT.md`'s
**Batching helper** entry under `### Worker tiers (dispatch)`.
