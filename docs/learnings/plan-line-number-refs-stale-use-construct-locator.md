---
name: plan-line-number-refs-stale-use-construct-locator
description: "Plan :N-M line refs go stale under churn. Anchor by named construct instead"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  keywords: [line drift, integration churn, enclosing symbol, anchor by function name, benign mismatch, scope creep false alarm]
  slug: plan-line-number-refs-stale-use-construct-locator
  phase: F05/p3-t5
  tags: 
    - plan-drift
    - line-numbers
    - integration-churn
    - auditor-nit
  related: "[[plan-array-literal-lags-canonical-export]], [[drift-guard-pin-for-task-split-intermediate-state]]"
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Plan line-number references go stale under integration churn; use construct locators

**RESOLVED (instance) — kept as concept anchor.** The rule is now doctrine in CLAUDE.md "Known traps": "Anchor references by named construct, not line number — line numbers rot across the serial merge queue."

**Rule.** A `:N-M` line range in a plan or spec goes stale as soon as an earlier task on the same integration branch adds or removes lines above it. Cite the file plus the enclosing function, comment header or export instead, for example "the `war-servitor` spawn under the `// ---- WRAP-UP — capture durable learnings` comment in `workflow-template.js`". Keep raw ranges for files with no named construct, and then say "approximately" and name the base commit.

**Auditor note:** when the plan and the diff differ only in line numbers but the construct is clearly the intended target, rate it a Nit, not scope creep. Block only when the change is in the wrong construct.

Related: [[plan-array-literal-lags-canonical-export]], [[drift-guard-pin-for-task-split-intermediate-state]].
