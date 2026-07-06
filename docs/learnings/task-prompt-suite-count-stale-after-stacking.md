---
name: task-prompt-suite-count-stale-after-stacking
description: "Hardcoded suite count in prompt stales; self-discover"
metadata:
  node_type: memory
  slug: task-prompt-suite-count-stale-after-stacking
  phase: servitor-confinement-memory/p4
  type: project
  keywords: [hardcoded number, find loop, test.sh discovery, literal enumeration, self-discovering gate, wrong test count]
  tags:
    - gate
    - stacking
    - plan-drift
    - task-prompt
    - self-discovery
    - suite-count
  relates:
    - "[[plan-gate-enumeration-stale-after-stacking]]"
    - "[[gate-under-covers-after-cross-branch-merge-new-runner]]"
  created: 2026-06-26
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Task prompt suite count goes stale faster than plan doc — and is more dangerous

## Durable rule

**Never hardcode a `*.test.sh` suite count in a task prompt.** Write the directive as "run ALL
discovered `*.test.sh` suites" or reference the self-discovery mechanism by name (`resolveGate`
in `skills/war/assets/war-config.mjs`, or the `find`-loop). A specific number becomes stale the
moment any stacked task adds a runner, and the prompt is the last place a wrong number gets
caught. (Instance: servitor-confinement-memory/p4 prompt said "ALL FIVE" when six suites
existed — one added by the same phase, one by a stacked plan; the self-discovering `find` loop
in the candidate saved the gate run.)

## Why task-prompt staleness is worse than plan-doc staleness

A plan doc is reference material the worker may consult; a task **prompt** is the operative
directive the worker executes against. Prompts are followed literally — a wrong count in the
prompt makes the worker stop at that count instead of discovering the real set.

This is the agent-directive analog of [[plan-gate-enumeration-stale-after-stacking]] (same
problem in plan documentation). The fix is identical at every level (plan doc, task prompt,
merge checklist): prefer self-discovery references over literal enumerations.

## What the Lead/refiner must do at merge

Run the self-discovering form, never a fixed list derived from plan text or the task prompt:

```sh
find . -type f -name '*.test.sh' | sort | while read f; do bash "$f"; done
```
