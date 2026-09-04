---
name: dedup-registry-must-cover-every-queue-producer-and-every-resolver-consumer
description: "Adding a new content-key dedup registry (queuedKeys) over a shared queue (phaseCloseQueue / r.reentryQueue) landed incomplete on BOTH sides: the header comment claimed queuedKeys is stamped at 'BOTH phaseCloseQueue entry points' but a THIRD producer (the ruledAsks intake loop) already pushed into the same queue unstamped, and the pre-existing companion resolver (corroborateSurvivor) that merges a re-raising seat onto a finding's surviving row was never extended to search the queue containers at all — so a queued survivor's cross-seat corroboration silently drops even though the queue itself correctly refuses to double-queue"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: dedup-registry-must-cover-every-queue-producer-and-every-resolver-consumer
  phase: 2026-08-27-in-run-finding-resolution/phase-1
  keywords: 
    - dedup registry
    - queuedKeys
    - corroborateSurvivor
    - phaseCloseQueue
    - content-key registry
    - remintBlock
    - third entry point
    - companion resolver lag
    - terminalQueue
    - terminal pass
    - unstamped producer
    - sweepMinors
    - p5-polish
    - in-band-absorb-default phase-5
    - registry expansion regresses same rule
  tags: 
    - workflow-template
    - engine-reliability
    - audit-finding
    - registry-completeness
  created: 2026-08-27
  originSessionId: c878d5da-ed5a-4614-8006-47e692e60042
  modified: 2026-09-04T19:18:55.056Z
---

# A new dedup registry can leave BOTH a producer and a consumer uncovered

## What happened

Phase 1 ("in-run-finding-resolution") of `workflow-template.js` added a fourth content-key
registry, `queuedKeys`, to stop a re-audit-born finding from double-queuing into
`phaseCloseQueue` / `r.reentryQueue`. The declaring comment states it is stamped at "BOTH
`phaseCloseQueue` entry points (`routeToSweep` and the round-1 approve arm's direct push) and at
`reentryQueue.push`."

Verified at the landed tip (`faa76d6415bdf61ba87a0cd82235d386020eb7f5`, read via the
`_refinery` worktree whose `gitdir` physical path names this plan's slug — HEAD exactly equal to
the landed tip):

- **Producer side**: `skills/war/assets/workflow-template.js`'s `ruledAsks` intake loop (the
  D15(b) interactively-ruled-ask vehicle, around the `for (const ra of ruledAsks)` block) pushes
  a new row straight into `phaseCloseQueue` **without** `queuedKeys.add(remintKey(...))` — a
  third entry point the comment's "BOTH" undercounts. `queuedKeys`/`remintKey` are declared later
  in the file than this loop, so a straight fix requires hoisting the declarations or moving the
  intake below them.
- **Consumer side**: `corroborateSurvivor` (the function that merges a re-raising seat onto a
  finding's surviving row when `remintBlock` refuses a re-mint) resolves the survivor via
  `minorsFiled.find(...)` or `aced.find(...).finding` only — it never searches `phaseCloseQueue`
  or `r.reentryQueue`. When `remintBlock`'s refusal reason is "already queued," the lookup misses
  and the function silently returns, so the second seat's attribution is never merged onto the
  queued row's `seats` list.

Both gaps were independently raised by multiple audit seats across the phase (task 1.1's
correctness/plan-faithfulness/cascading-impact lenses, repeated at successive shas) and shipped
to land as `absorb`-disposition findings that did not make it into a fix round before the phase
closed — i.e. the registry's headline property (no double-queue) landed correct, while its two
side-effects (complete producer coverage, complete consumer coverage) did not.

## Durable rule

1. When adding an Nth content-key dedup registry over a shared queue/array, **grep every
   push-site of that queue** before writing the "stamped at every entry point" comment — a
   comment claiming completeness is not proof of it; a later or earlier code path that already
   pushes into the same container is easy to miss, especially one added in the *same* diff
   (here, ruledAsks and queuedKeys landed in the same commit).
2. Separately, **grep every function that already resolves/looks up entries in that container**
   (a survivor-merge helper, an existing dedup check, a rendering pass) and extend each one to
   search the new registry's container(s) too — a registry only prevents double-write; the
   read-side helpers that predate it do not automatically gain visibility into it.
3. Treat "stamped at BOTH X and Y" language in a guard comment as a claim to verify, not a fact —
   count the actual push-sites in the file before trusting the enumeration.

## Related

[[gate-audit-family-seat-disposition-ask-silently-dropped]] — a sibling case where a shared enum
widening reached further call sites than the author accounted for.

## Recurrence — the SAME `queuedKeys` registry gains a fourth container and repeats the identical
## gap, `2026-09-03-in-band-absorb-default`/phase-5 p5-polish (landed
## `dev/2026-09-03-2026-09-03-in-band-absorb-default` @ `01d98a743980d3900e9f35388855dba804c84e16`,
## 2026-09-04)

**Code-verified** — landed-tip grounding reached rung 2 (worktree lookup): the `_refinery45`
worktree's `gitdir` physical path is
`<repo-root>/.claude/war-worktrees/2026-09-03-in-band-absorb-default-2026-09-03/_refinery/.git`
(contains this plan's slug) and its `HEAD` reads `01d98a743980d3900e9f35388855dba804c84e16`
verbatim (detached, not a branch ref) — exactly the threaded landed tip, so a direct Read there is
`code-verified`-capable.

Phase 5 added the terminal pass (a one-hop re-audit after the phase-close polish merge). The
merged-arm phase-close sweep's `sweepMinors` loop routes each polish-panel finding by disposition:
an `ask` parks, a registry hit (`remintBlock`) corroborates, a `follow-up` files through
`fileFollowUp` (stamps `filedKeys`), a `note` queues — and everything else falls through to a bare
`else terminalQueue.push(f)`, with no `queuedKeys.add(remintKey(f))` stamp. Every sibling producer
of a phase-close container (`routeToSweep`, `carryPhaseClose`, the round-1 approve arm,
`routeReauditMinors`'s re-entry push) stamps `queuedKeys` at push time; this one new producer does
not. `p5-polish`'s own gate-audit caught it independently from two seats (`simplicity`,
`performance`): two polish seats raising the identical absorb produce two `terminalQueue` rows, so
`recordAced` records the finding twice at land.

**It never was fixed — confirmed at the landed tip.** The merged-arm `sweepMinors` loop in
`skills/war/assets/workflow-template.js` still ends `else terminalQueue.push(f)` with no preceding
`queuedKeys.add(...)` call. The sibling terminal-pass routing function, `routeTerminalMinors`, DOES
consult the registry before every route (confirmed present at the same tip) — only the one producer
that first populates `terminalQueue` from the polish panel's own findings is uncovered.

**Sharpens the durable rule with a second instance on the SAME registry:** this lesson's rule 1
("grep every push-site of a queue before writing a completeness comment") was violated again, on
the very `queuedKeys` registry this lesson names. The registry gained a fourth backing container
(`terminalQueue`, alongside `phaseCloseQueue`, `r.reentryQueue`, `carriedPhaseClose`) in the diff
that built the terminal pass, and the new container's own producer was not checked against the
existing rule. A registry landing correct once does not mean its next expansion re-applies the same
discipline — re-cite this lesson whenever a `queuedKeys`-style registry gains a new backing array,
not only when the registry is first introduced.

**Compounding factor — no round left to drain it.** `p5-polish` was phase 5's own terminal
phase-close round; see
[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] for the general
"a terminal polish task's own audit has nowhere to land its findings" shape this instance also
matches, including a hypothesis about why the newly-built terminal pass could not rescue its own
birth phase.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`, the
phase-close sweep's merged arm, the `for (const f of sweepMinors)` loop that computes `const d =
dispositionOf(f, null)` and ends `else terminalQueue.push(f)` (immediately before the `// ----
TERMINAL PASS` comment block).

> archived 2026-09-03: resolved — moved to archive
