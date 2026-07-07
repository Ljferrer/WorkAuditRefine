---
name: standing-instruction-vs-dispatched-prompt-coverage-split
description: Standing .md vs dispatched prompt; mirror into both
metadata:
  node_type: memory
  slug: standing-instruction-vs-dispatched-prompt-coverage-split
  phase: guard-hermeticity/tC → RESOLVED dispatched-gate-run-tmpdir-pin-parity/t1
  type: project
  keywords: [prompt parity, two-layer directive, agent markdown, per-task override, mirror clause, single-layer gap, prompt drift]
  tags:
    - war
    - refiner
    - prompt-architecture
    - standing-instruction
    - dispatched-prompt
    - coverage
    - workflow-template
    - audit-finding
  files:
    - agents/war-refiner.md
    - skills/war/assets/workflow-template.js
  relates:
    - "[[source-comment-lags-emitted-prompt-after-rewrite]]"
    - "[[bsd-mktemp-ignores-tmpdir-gnu-only]]"
    - "[[template-defers-runtime-values-to-agent-via-literal-placeholder]]"
    - "[[verbatim-mirror-directive-context-mismatch-at-destination]]"
    - "[[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]]"
  created: 2026-06-26
  updated: 2026-07-06
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
---

# Standing instruction file and dispatched prompt are separate coverage surfaces

**Rule:** WAR agent behavior lives in two independent layers — the standing `agents/war-refiner.md` (read once at session start) and the per-task prompt fragments dispatched from `skills/war/assets/workflow-template.js`. Changes to one NEVER propagate to the other: a per-task override prompt supersedes the standing file for that call, and a dispatched-only directive is absent when the agent runs from its standing file. For a correctness guarantee (not just defense-in-depth) a directive must appear in BOTH layers; single-layer placement is a conscious trade-off that must be documented.

Both tracked gaps are closed in the live repo: the TMPDIR pin is mirrored into the merge-task and land-phase gate-run clauses (dispatched-gate-run-tmpdir-pin-parity/t1), and the dispatched merge-task prompts now split exit 1 (no test in diff → `no-test`) from exit 2 (git/ref error → `status: 'error'`, never `no-test`), matching the standing file — see [[floor-script-exit-codes-1-vs-2-route-differently]]. Residual inert Nit: the land-phase clause's verbatim-copied cwd prose, carried by [[verbatim-mirror-directive-context-mismatch-at-destination]].

**Why:** the two surfaces have independent lifecycles, so a green audit of one says nothing about the other.

**How to apply:** when auditing or authoring a WAR directive, identify which layer carries it and mirror it into the other (or document the single-layer choice).

Related: [[source-comment-lags-emitted-prompt-after-rewrite]], [[template-defers-runtime-values-to-agent-via-literal-placeholder]], [[bsd-mktemp-ignores-tmpdir-gnu-only]].

**Recurrence (audit-calibration-and-graduation/t1):** a variant of this split within a single agent
type — gate-audit seats (`execution-evidence`, `end-state` lenses) build prompts inline rather than
through the shared `auditPrompt()` builder, so a new base-prompt rule (CALIBRATION RULE, COST-CLAIM
RULE) reaches them only via the standing `agents/war-auditor.md` file, never the dispatched path.
Accepted by design (gate-audit is SOFT evidence review, not severity-graded diff judgment) — see
[[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]].
