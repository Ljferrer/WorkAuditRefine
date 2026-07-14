---
name: decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome
description: "Test decoy comment must match real throw order"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome
  phase: fail-loud-ingest-boundaries/t1
  keywords: 
    - decoy fixture
    - assertOrderable
    - unparseable footprint
    - test comment mechanism mismatch
    - layered validator preempts assertion
    - extraction precision test
    - throw order vs outcome
    - branch-ordering anchor comment
    - delete-and-trace overclaim
    - envGap
    - move-X-and-this-reds
  tags: 
    - test-authoring
    - audit-grading
    - campaign-ledger
    - red-team-gate
  created: 2026-07-08
  updated: 2026-07-12
  originSessionId: 67b9a13b-7f13-4b27-bc54-8459e04f97b5
---

# Decoy-fixture comments must name the actual throw path, not just the end outcome

**Instance (fail-loud-ingest-boundaries/t1, 2026-07-08):** `setupCanonicalRoadmap` in
`skills/war-campaign/assets/campaign-ledger.test.mjs` writes a decoy
`roadmaps/notes/decoy.md` to disk and comments that a regressed extractor grabbing backticked
cell tokens "would resolve it to a real file and return 3 plans, so the exactly-2 assertions
(not an ENOENT) are what catch a precision failure." That's not what actually happens: the
decoy fixture has no `Files:` block, so a mis-ingested decoy makes `assertOrderable` (in
`skills/war-campaign/assets/campaign-ledger.mjs`; its call sites are in `init` and `sweep`)
throw `unparseable footprint for <decoy> — explicit position required` **before**
the `length === 2` assertion ever runs. The test still goes RED on a regression exactly as
intended (delete-the-feature holds) — but via that throw, not via the named assertion. On-disk
placement is a red herring too: absent-on-disk would ENOENT-throw instead, present throws
unparseable-footprint; both fail the test, just through different call frames.

**Why durable:** whenever a test stacks multiple layered validators (extraction → ordering/
footprint check → shape assertion), the validator that actually fires on a given decoy is not
always the one nearest the assertion in the test's own prose. A comment describing "assertion X
is the discriminator" needs to be checked against the real call order, not just against whether
the test goes red — both are true here, but for different reasons, and a future editor trusting
the comment could give the decoy a `Files:` block "to make the described discriminator real,"
silently changing which failure mode the test proves.

**How to apply:** when auditing or writing a decoy/negative-fixture test comment that names a
specific assertion as "the thing that catches it," trace the actual function-call order the
regression scenario would hit (grep for validators like `assertOrderable` that run ahead of the
final assertion) rather than trusting that a correct outcome implies a correct mechanism
description.

## Recurrence 2 (phase "Enforcement + hygiene", task 1.1, 2026-07-12)

Same generic pattern, different mechanism — a "delete-and-trace"/"move-X-and-this-reds" test
comment can overclaim the SPECIFIC refactor that would flip a case red. Per the phase-1 auditor's
Nit finding (disposition `note`, not autoFixable, not phase-close-blocking, `fixRounds:0` — left
as-is at land) against `skills/red-team/assets/red-team-gate.test.mjs`'s branch-ordering-anchor
cases 1c and 1e:

- 1c's comment claimed "move the envGap check after `KNOWN_SEVERITIES` and this goes RED"; the
  only executable position "after `KNOWN_SEVERITIES`" still precedes the unconditional
  force-promotion `return`, so a severity-less env-gap finding is demoted to Minor before ever
  reaching force-promotion — the case stays GREEN there. Only DELETING the branch reds it (which
  the worker's delete-and-trace already exercises) — the comment named the wrong refactor, not a
  wrong assertion.
- 1e's comment claimed it "anchors `deliverableAbsence` wins by order" over `envGap`; a
  both-flags finding demotes to one Minor under EITHER branch order, so swapping the two demotion
  checks keeps 1e green too — the relative order between those two demotion branches is not
  outcome-load-bearing (unlike the envGap-before-`KNOWN_SEVERITIES` order in 1c, which IS
  load-bearing).

**Re-verified at master (2026-07-13):** `envGap` is present in
`skills/red-team/assets/red-team-gate.test.mjs` at the current tip (18 occurrences), and case
1c's comment ("move the envGap check after `KNOWN_SEVERITIES` and this goes RED") is still in the
tree as described — consistent with the Nit's left-as-is-at-land disposition. The earlier
cannot-verify was only the lagging-checkout effect recorded in
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]].

**Generalized rule (now 2-for-2 across unrelated subsystems):** a "delete-and-trace" or
"move-X-and-this-reds" test comment must be checked against the actual nearest-preceding-return
control flow, not the comment author's mental model of "the next branch down" — an intervening
early return (here: the severity-less-but-flagged demotion that fires before the unconditional
force-promotion) can make a described refactor a no-op RED-wise even though the underlying
assertion is genuinely failable via a different edit (deletion, not reordering).

[[red-team-env-gap-warn-is-agent-directive-not-code-enforced]]
