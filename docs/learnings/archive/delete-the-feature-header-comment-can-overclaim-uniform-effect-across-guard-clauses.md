---
name: delete-the-feature-header-comment-can-overclaim-uniform-effect-across-guard-clauses
description: "A multi-clause drift guard's 'delete-the-feature: X and every clause below goes red' header comment can be wrong for clauses whose own trigger differs from the named scenario X"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: delete-the-feature-header-comment-can-overclaim-uniform-effect-across-guard-clauses
  phase: default-flip-sweep-and-doc-claim-guard/t1
  keywords:
    - delete-the-feature comment
    - guard header comment
    - multi-clause test
    - doc-claim guard
    - test comment overclaim
    - war-config.test.mjs
    - absence sweep clause
    - DEFAULTS flip scenario
  tags:
    - test-authoring
    - audit-grading
    - doc-claim-guard
  created: 2026-07-12
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# A "delete-the-feature: X, and every clause below goes red" header can overclaim when clauses have different triggers

**Finding (default-flip-sweep-and-doc-claim-guard/t1, raised independently by both the task auditor
and the post-merge gate-audit — Nit/note, non-blocking):** a doc-claim guard test in
`skills/war/assets/war-config.test.mjs` (added to bind documented `memory.commitLearnings` default
prose to `DEFAULTS.memory.commitLearnings`, per the phase's End-state #6) carried a header comment
of the shape "Delete-the-feature: revert the DEFAULTS flip to `true` (docs still say false/off) and
every clause below goes red." The guard actually has (at least) three clauses: two
(extraction+equality against `DEFAULTS`) do reference the flipped literal and correctly go red under
that exact scenario; a third is a zero-match **absence sweep** for retired default-`true` doc claims
— its own delete-the-feature trigger is *re-adding* a retired claim to a doc, not the DEFAULTS
revert, so it stays **green** under the scenario the comment names. The guard itself binds
correctly; only the comment's "every clause" claim is imprecise.

**Why durable:** any drift/doc-claim guard that bundles multiple clauses under one delete-the-feature
header risks the same imprecision whenever the clauses don't share a single trigger condition — e.g.
an extraction+equality clause (triggers on the tracked literal changing) bundled with an
absence/pattern sweep (triggers on a *different* mutation, like re-adding retired text). A reader
trusting "every clause goes red" as a coverage proof for the one named scenario would wrongly credit
the absence-sweep clause with coverage it doesn't have for that scenario — even though it has valid,
different coverage of its own. This is the same family of trap as
[[decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome]] (a test comment naming a
mechanism that isn't quite what fires) but scoped to multi-clause guards with heterogeneous triggers
rather than layered-validator throw order.

**How to apply:** when writing or auditing a header comment on a multi-clause guard/test that claims
"scenario X makes every clause below go red," check each clause's actual trigger condition
individually — if any clause detects a *different* mutation (an absence sweep, a separate literal, a
different call path), scope the comment to name which clauses respond to X and note the other
clause's own trigger separately, rather than asserting uniform effect. Grade a bare mismatch here
Nit/note, not blocking — the guard's correctness doesn't depend on the comment's precision, but the
next editor extending the guard will.

Related: [[decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome]],
[[default-flip-must-audit-all-doc-surfaces]],
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]].

> archived 2026-07-12: resolved — moved to archive
