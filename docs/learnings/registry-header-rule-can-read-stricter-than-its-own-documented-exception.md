---
name: registry-header-rule-can-read-stricter-than-its-own-documented-exception
description: "A grep-able registry header rule can read as an absolute prohibition while the classification rationale immediately below it documents a narrower, deliberate carve-out — read the rationale, not just the header, before flagging a row as inconsistent"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: registry-header-rule-can-read-stricter-than-its-own-documented-exception
  phase: structural-test-integrity/1.1
  keywords: 
    - registry header rule
    - default-deny classification
    - documented exception
    - rationale below header
    - LITERAL_REGISTRY
    - audit false positive
    - carve-out
  tags: 
    - audit
    - registry
    - classification
    - plan-faithfulness
  created: 2026-07-16
  originSessionId: 655475be-a01b-4702-b846-b2c53bbde3d3
---

# A registry's grep-able header rule can read stricter than its own documented exception

## What happened

`LITERAL_REGISTRY` in `skills/war/assets/workflow-template.test.mjs` (verify still present
before acting — found near the const declaration a few lines below the header comment, at
structural-test-integrity/1.1) carries a header rule written for auditors: "a literal that FEEDS
agent() prompt text is NEVER registered here — tag it with `pt`." Read literally, this is an
absolute rule: any registered row whose value ends up inside an `agent()` prompt is a violation.

But rows like `testPatternArg` (a git/shell flag-builder literal) ARE registered here even though
their composed value is spliced into `agent()` prompt text. This is not a bug — the classification
rationale documented in the paragraph *immediately below the header* narrows the rule: a literal
belongs in this value-composition registry (not tagged `pt`) when its own interpolations are
ternary-guarded/derived-and-validated AND it is spliced into an *already-`pt`-tagged carrier* that
guards the spliced value — so no undefined can ever render into the final prompt. The header's
"feeds agent() prompt text" phrasing means "is the value `pt` directly reads," not "ends up
inside a prompt string via any number of intermediate carriers."

## The durable rule

When a default-deny/classification registry has a terse, grep-able header rule written as an
absolute one-liner, check the rationale text immediately following it before treating a
registered row as a violation of the header. Terse headers are written for grep-ability, not
completeness — the real classification boundary usually lives in the surrounding rationale
comment, and it is often narrower or more structurally specific (e.g. "the literal I directly
read" vs. "anything downstream of me"). This generalizes beyond this one registry: any codebase
allowlist/classification table with a one-line header comment should be read together with its
adjacent rationale before flagging an entry as inconsistent.

## Cross-links

- [[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]] —
  same phase, the census technique this registry is half of.
