---
name: a-grep-c-check-that-expects-zero-exits-1-and-reads-as-red
description: "A grep -c End-state check that expects 0 exits 1, so its artifact reads as red"
metadata:
  node_type: memory
  type: project
  keywords:
    - grep -c
    - exit status
    - zero count
    - End-state check
    - absence check
    - false red
    - endstate artifact
  provenance: agent-unverified
  slug: a-grep-c-check-that-expects-zero-exits-1-and-reads-as-red
  phase: 2026-11-08-model-routing-and-prompt-byte-budgets/phase-4
  tags:
    - plan-authoring
    - end-state
    - shell
  created: 2026-11-10
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-11T03:15:25.766Z
---

`grep -c` prints `0` and exits 1 when nothing matches.

An End-state check that asks "prints `0`" therefore leaves `exit_code: 1` in its artifact even when the condition holds.

Phase 4 End states 7 and 29 used `grep -c 'isDocsTask' ...` for an absence check, and both gate-audit seats had to explain the exit 1 away.

A reader or a future floor that keys on exit codes can mistake it for a red check.

For an absence check, write `! grep -q <pattern> <file> && echo ABSENT` or `test "$(grep -c ...)" -eq 0`.

Related: [[grep-c-assertion-count-floor-is-a-fragile-dated-snapshot]], [[a-semicolon-inside-a-quoted-end-state-check-literal-is-split-by-the-statement-runner]].

Provenance note: sourced from gate-audit notes at auditSha 0ae15244 (gateEvidence true). The plan check literal was not re-read by the servitor.
