---
name: decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome
description: "A test comment that names the assertion or refactor that reds a case must match the real call and return order, not just the red outcome"
metadata:
  type: project
  provenance: code-verified
  slug: decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome
  phase: fail-loud-ingest-boundaries/t1 +2 recurrences (latest Sticky fallback + anchor hygiene/1.2, 2026-07-15)
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
    - deleting the envGap demotion branch
    - KNOWN_SEVERITIES membership check
    - outcome-unobservable order
  tags:
    - test-authoring
    - audit-grading
    - campaign-ledger
    - red-team-gate
  created: 2026-07-08
  updated: 2026-07-15
  originSessionId: 67b9a13b-7f13-4b27-bc54-8459e04f97b5
---

# Decoy-fixture comments must name the actual throw path, not just the end outcome

**Rule:** a test comment that says "assertion X catches it" or "move X and this goes RED" must be
checked against the real call order and the nearest preceding return. A correct red outcome does
not prove the comment names the right mechanism. A future editor who trusts a wrong comment can
change which failure mode the test proves.

**How to apply:** trace the function-call order the regression scenario would hit. Grep for
validators that run ahead of the final assertion (like `assertOrderable`) and for early returns
between the moved branch and the outcome.

**Instance 1 (fail-loud-ingest-boundaries/t1):** `setupCanonicalRoadmap` in
`skills/war-campaign/assets/campaign-ledger.test.mjs` writes a decoy `roadmaps/notes/decoy.md` and
says the exactly-2 assertions catch a precision failure. The decoy has no `Files:` block, so a
mis-ingested decoy makes `assertOrderable` (in `skills/war-campaign/assets/campaign-ledger.mjs`)
throw `unparseable footprint for <decoy> — explicit position required` before the
`length === 2` assertion runs. The test still goes RED, but through the throw.

**Instance 2 (red-team gate, 2026-07-12):** case 1c in
`skills/red-team/assets/red-team-gate.test.mjs` claimed "move the envGap check after
`KNOWN_SEVERITIES` and this goes RED". `KNOWN_SEVERITIES.includes(f.severity)` is `false` for
`severity: undefined`, so the envGap demotion still fires ahead of the final force-promotion
return, and the case stays GREEN. Only deleting the branch reds it. Case 1e claimed an order
anchor between two demotion branches whose order is outcome-unobservable. Both comments were later
corrected in a prose-only task.

[[red-team-env-gap-warn-is-agent-directive-not-code-enforced]]

> archived 2026-08-30: resolved — moved to archive
