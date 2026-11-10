---
name: resolvegate-bash-discovery-loop-aborts-at-first-red-suite-so-later-test-headers-never-print
description: "resolveGate's shell loop with || exit 1 stops at the first red suite, so later mapped suites read absent in the gate log"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - resolveGate
    - exit 1
    - gate(bash)
    - truncated gate log
    - baseline proceed
  provenance: code-verified
  slug: resolvegate-bash-discovery-loop-aborts-at-first-red-suite-so-later-test-headers-never-print
  phase: precision-chain-and-loop-breaker/phase-3 task 3.2
  tags: 
    - gate-audit
    - workflow-template
    - prompt-surface
    - follow-up
  created: 2026-08-06
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-06T18:54:09.715Z
---

A `|| exit 1` inside the gate's discovery loop truncates the log at the first red suite, so a later mapped test reads as absent (false HARD).

**Mechanism:** `resolveGate` in `skills/war/assets/war-config.mjs` composes the bash half as
`for f in $(find . ... -name '*.test.sh' | sort); do printf '\n== gate(bash): %s ==\n' "$f"
&& bash "$f" || exit 1; done` — the `|| exit 1` aborts the WHOLE loop at the first red suite.

**Why it matters:** the gate-audit seat's D7 `mappedTests` rule treats a missing mapped path as
HARD only when the log half **enumerates** test file paths (the `== gate(bash): <path> ==`
headers). On a baseline-proceed merge (a red gate consciously merged over classified `baseline`
debt), every alphabetically-later `.test.sh` never prints its header. The captured log IS
enumerating (earlier headers present), yet a later mapped bash path reads absent — the rule's
condition is satisfied and the seat reads a false HARD land-hold, although the absence is caused by
the abort, not by a fake or unrun test.

**How to apply:** when a rule tests an artifact, check whether the artifact's producer can
short-circuit (an early-abort loop, a truncated capture, a size cap) in a way that satisfies the
rule's premise without satisfying its intent.

RESOLVED (gate-audit-finding-routing, #1377/#1372, 2026-08-15): the seat prompts now carry a
truncation clause that reads a post-abort zero-hit grep as soft cannot-confirm, and `resolveGate`'s
header comment marks the `|| exit 1` abort as coupled to that clause ("Change one, revisit the
other").

See also [[narrowing-a-prompt-trigger-needs-a-whole-prompt-grep-for-contradicting-clauses]] (the
other residual of the same narrowing round).

> archived 2026-08-15: resolved — moved to archive
