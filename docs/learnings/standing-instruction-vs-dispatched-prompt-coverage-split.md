---
name: standing-instruction-vs-dispatched-prompt-coverage-split
description: A WAR directive lives in the standing agents/*.md card AND the dispatched prompt; mirror it into both or document the single-layer choice
metadata:
  node_type: memory
  slug: standing-instruction-vs-dispatched-prompt-coverage-split
  phase: guard-hermeticity/tC → RESOLVED dispatched-gate-run-tmpdir-pin-parity/t1
  type: project
  provenance: code-verified
  promoted: dev/2026-08-25-engine-reliability-and-filing-fidelity@phase-7
  keywords: [prompt parity, two-layer directive, agent markdown, per-task override, mirror clause, single-layer gap, prompt drift, FINDING-PATH FORM, war-auditor.md headroom, budget-raise trailer]
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
    - agents/war-auditor.md
    - skills/war/assets/workflow-template.js
  relates:
    - "[[source-comment-lags-emitted-prompt-after-rewrite]]"
    - "[[bsd-mktemp-ignores-tmpdir-gnu-only]]"
    - "[[template-defers-runtime-values-to-agent-via-literal-placeholder]]"
    - "[[verbatim-mirror-directive-context-mismatch-at-destination]]"
    - "[[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]]"
    - "[[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]]"
  created: 2026-06-26
  updated: 2026-08-26
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
  modified: 2026-08-26T22:42:59.778Z
---

# Standing instruction file and dispatched prompt are separate coverage surfaces

**Rule:** WAR agent behavior lives in two independent layers: the standing card (`agents/war-refiner.md`,
`agents/war-auditor.md`, read once at session start) and the per-task prompt fragments string-built in
`skills/war/assets/workflow-template.js`. A change to one never reaches the other. A dispatched override
supersedes the standing card for that call; a dispatched-only directive is absent when the agent runs from
its card. For a correctness guarantee, a directive must appear in BOTH layers. Single-layer placement is a
conscious trade-off and must be documented (a "no standing-card behavior change" comment is not enough when
the directive changes what the agent is told to emit).

**Why:** the two surfaces have independent lifecycles, so a green audit of one says nothing about the other.

**How to apply:** when auditing or authoring a WAR directive, find which layer carries it and mirror it into
the other, or document the single-layer choice. Grep both files for the directive's key phrase in the same
diff.

**Closed gaps:** the `TMPDIR` gate-run pin is mirrored into the merge-task and land-phase clauses of
`workflow-template.js` and the gate steps of `agents/war-refiner.md`; the dispatched merge-task prompts split
floor exit 1 (`no-test`) from exit 2 (`status: 'error'`), matching the card. See
[[floor-script-exit-codes-1-vs-2-route-differently]]. Residual inert Nit: the land-phase clause's copied cwd
prose, carried by [[verbatim-mirror-directive-context-mismatch-at-destination]].

**Still open:** the `FINDING-PATH FORM` directive in the `auditPrompt()` builder of `workflow-template.js`
(finding `file` values must be repo-relative, never absolute or `./`-prefixed) has no mirror in
`agents/war-auditor.md`. The three gate-audit-family prompt builds outside `auditPrompt()` never receive it
either, and their `file` values feed the same follow-up collapse key, which has no path-form normalization
(the ace culprit compare has the `aceRelPath` helper; see
[[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]]). Before adding the
mirror, check the card's byte count against its hard ceiling in
`skills/war/assets/prompt-surface-budgets.test.mjs`; headroom is now well under 1 KB, so a one-sentence
mirror may need an ADR 0042 eviction or a `Budget-Raise:` trailer.

**Locate-cue:** search `FINDING-PATH FORM` in `workflow-template.js`; search `FINDING-PATH` in
`agents/war-auditor.md` (absent until the gap is closed; the card's one `repo-relative` hit is the unrelated
plugin-root pointer clause).

Recurrences: 2 (gate-audit inline prompts bypass `auditPrompt()`, accepted by design, see
[[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]]; the `FINDING-PATH FORM`
gap above).

Related: [[source-comment-lags-emitted-prompt-after-rewrite]],
[[template-defers-runtime-values-to-agent-via-literal-placeholder]], [[bsd-mktemp-ignores-tmpdir-gnu-only]].
