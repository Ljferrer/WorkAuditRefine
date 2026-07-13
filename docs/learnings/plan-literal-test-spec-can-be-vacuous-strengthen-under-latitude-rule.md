---
name: plan-literal-test-spec-can-be-vacuous-strengthen-under-latitude-rule
description: "A plan's literal test-spec wording can be provably vacuous both before and after the change — a worker's stronger substitute is a latitude-rule win, not a plan-faithfulness deviation"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: plan-literal-test-spec-can-be-vacuous-strengthen-under-latitude-rule
  phase: "Floor fixes/task-1 (plan 2026-07-12-floor-script-correctness, landed dev/2026-07-12-floor-script-correctness)"
  keywords: 
    - static call-site count
    - runtime invocation trace
    - xtrace
    - vacuous test lock
    - delete-the-feature
    - latitude rule
    - intent is the ceiling
    - plan-faithfulness
    - structural assertion
    - loop inversion lock
  tags: 
    - test-fidelity
    - plan-faithfulness
    - auditing
    - shell-testing
  related: 
    - "[[weak-test-assertion-passes-without-feature-being-exercised]]"
    - "[[dockerfile-shell-form-parser-heuristic-ceiling]]"
  created: 2026-07-12
  originSessionId: 3e7df1e1-5759-4eb0-9cb3-db7f6b90a91d
---

# A plan's literal test-spec can itself be vacuous — check before grading a deviation as a fidelity gap

**Instance:** the plan slice for a loop-inversion lock ("delete-the-inversion" — invert
`assert-packaging-in-diff.sh`'s scan loop so `parse_dockerfile` is called once per Dockerfile
instead of once per (file, Dockerfile) pair) called for "a structural assertion counting
`parse_dockerfile` invocation sites in the script (definition excluded)" — i.e. a **static**
call-site count. The pre-change script *also* has exactly one static call site (the inversion only
relocates it from the inner loop to the outer loop) — so a static count-of-1 assertion would pass
identically on a revert. The literal spec, taken at face value, is a vacuous lock: it can never go
RED against the regression it exists to catch.

The worker instead wrote a **runtime** invocation-count trace (`bash -x` xtrace counting actual
`parse_dockerfile` calls at execution time: 2 for 2 Dockerfiles post-fix vs 5 for a 5-pair
pre-fix fixture) — strictly stronger, and it genuinely REDs on a revert. The auditor traced through
*why* the literal spec would have been vacuous, confirmed the runtime version is intent-consistent
(the plan's actual goal — "delete-the-inversion lock" — is served, just not by the literal
mechanism named), and graded it Nit/`note`, not a plan-faithfulness violation, citing the
"latitude rule": intent is the ceiling, the plan slice is the floor, and a worker may exceed the
letter of a test-spec clause when the letter is demonstrably weaker than what it was meant to lock.

**Why durable:** a plan author writing a test-spec clause in prose ("assert X is true") can
unknowingly describe a check that is vacuous under the specific before/after states in play — this
is not rare when the "before" state already happens to satisfy a naive reading of the "after"
assertion (here: one call site existed both before and after; only its *location* changed).

**How to apply (worker):** before implementing a plan-literal test assertion verbatim, mentally run
it against the pre-change code — if it would also pass there, it does not lock anything; find the
smallest strengthening (here: static → runtime count, or count → count-plus-location) that
genuinely REDs on a revert, and note the substitution + reasoning in the done-report/commit body so
the auditor doesn't have to re-derive it from scratch.

**How to apply (auditor):** when a test's mechanism diverges from a plan's literal wording, don't
grade on wording-match alone — check whether the *literal* wording would itself have been vacuous;
if so, the worker's substitute isn't a deviation to flag, it's the plan's actual intent finally
being served. Record it as a reviewed `note`, not a Minor/Major finding, so a later reader knows the
divergence was traced and adjudicated, not overlooked.
