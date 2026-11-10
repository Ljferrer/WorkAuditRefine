---
name: drift-guard-extraction-regex-unions-comparisons-with-assignments
description: "[RESOLVED] A drift-guard regex that extracts assignments must not also match comparisons: `={1,3}` matched ===, so use `=(?![=])|:`"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: drift-guard-extraction-regex-unions-comparisons-with-assignments
  phase: landdecision-drift-guard/t1 (#271)
  keywords:
    - drift-guard
    - workflowEmitted
    - assignment-only regex
    - comparison vs assignment
    - landDecision
    - emitted-set deepEqual
  tags:
    - drift-guard
    - regex
    - test-construction
    - latent-bug
  related:
    - plan-array-literal-lags-canonical-export
    - gate-evidence-severity-not-verdict-gates-hard-path
  created: 2026-07-01
  originSessionId: 1bd064e5-a8af-4b1f-91d5-638887067351
---

# Drift-guard extraction regex unions comparisons with assignments

**RESOLVED** — the `workflowEmitted()` helper in `skills/war/assets/land-decision.test.mjs` uses the assignment-only alternation `landDecision\s*(?:=(?![=])|:)\s*`; fix re-verified in place on master (v0.14.6).

**Durable rule:** in a "what does this code emit" drift-guard built on source-text regex extraction, an assignment alternation that also matches comparisons (`={1,3}` matches `=`/`==`/`===`) unions two semantically different site classes: a comparison against a canonical-but-never-emitted value spuriously satisfies the emitted-set `deepEqual` (masking a real gap) AND spuriously fails the non-emitted gap assertion (false drift signal) — silent in both directions. Restrict to assignment-only (`=(?![=])|:`), or comment the deliberate union and why it's currently safe.

**Grading:** Nit/non-blocking while every compared literal is independently emitted elsewhere — but flag it; a false drift signal is exactly the bug class the guard exists to prevent.

