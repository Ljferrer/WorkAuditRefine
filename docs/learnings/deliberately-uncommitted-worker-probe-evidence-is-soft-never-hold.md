---
name: deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold
description: "A plan can deliberately validate an end state via an in-task worker probe (done-report evidence only) instead of a committed test; gate-audit treats the resulting cannot-confirm as SOFT, never a hold"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - worker probe
    - done report
    - sandbox probe
    - gate-audit
    - cannot-confirm
    - SOFT finding
    - committed test
    - cwd-independence
    - repo-doc-reading test
    - gate-1.1.log
  provenance: agent-unverified
  slug: deliberately-uncommitted-worker-probe-evidence-is-soft-never-hold
  phase: Contract-on-both-sides/1.1 (2026-07-12)
  tags: 
    - audit-pipeline
    - gate-audit
    - plan-authoring
    - test-strategy
  related: 
    - auditor-cannot-execute-the-tests-it-must-verify-pass
  created: 2026-07-12
  originSessionId: 3e7df1e1-5759-4eb0-9cb3-db7f6b90a91d
---

# A plan end state can be validated by a worker probe deliberately left OUT of the committed test suite

Plan authors sometimes validate a real-world integration claim (e.g. "`init --roadmap` on this
specific committed roadmap doc now succeeds with N entries") via an in-task worker probe whose
evidence lives only in the done report, explicitly NOT a committed test — because a test that
reads a specific repo doc by path would rot as that doc changes, and would break the asset's
cwd-independence (a unit test that depends on the invoker's cwd matching a specific repo layout).

**Consequence for gate-audit:** the post-merge gate-audit re-runs the task's MAPPED tests from the
captured gate log; a done-report-only probe never appears there, so gate-audit cannot confirm the
end state from execution evidence alone. This is the CORRECT, expected outcome for a deliberately
uncommitted probe — record it as a SOFT (Nit-level, disposition `note`) cannot-confirm finding,
never a HARD hold, and never demand the probe be retrofitted into a committed test (that would
reintroduce the exact rot/cwd-coupling the plan was avoiding). Confirm instead that the *enabling*
mechanism the probe exercises (e.g. the underlying parser fix) has its own committed unit tests
that DID run and pass in the captured gate log — that's the real load-bearing evidence; the
probe is corroborating color, not the proof.

**How to apply:** when a plan's End state cites "in-task worker probe, evidence in done report,
NOT a committed test" as its validation method, gate-audit should (1) check the probe's premise is
supported by the mapped committed tests that DID run, (2) record the probe itself as SOFT/note if
it cannot be re-verified from execution evidence, and (3) never treat the absence of a committed
test for that specific probe as a plan-faithfulness gap.

Related: [[auditor-cannot-execute-the-tests-it-must-verify-pass]] (same family: a seat's capability
ceiling — here, the gate-audit's captured-log-only visibility — bounds what it can confirm, and the
prompt/plan should ask only for what that ceiling allows).
