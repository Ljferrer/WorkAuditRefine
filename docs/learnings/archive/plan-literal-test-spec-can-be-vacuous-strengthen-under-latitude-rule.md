---
name: plan-literal-test-spec-can-be-vacuous-strengthen-under-latitude-rule
description: "A plan's literal test-spec can be provably vacuous — a worker's stronger substitute is a latitude-rule win, not a plan-faithfulness deviation"
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

**Instance:** a plan asked for a **static** count of `parse_dockerfile` call sites to lock a loop inversion in `assert-packaging-in-diff.sh`, but the pre-change script also had exactly one call site, so that lock could never go RED on a revert. The worker wrote a **runtime** `bash -x` xtrace invocation count instead, which does RED on a revert, and the auditor graded it Nit/`note` under the latitude rule: intent is the ceiling, the plan slice is the floor.

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

> archived 2026-07-27: resolved — moved to archive
