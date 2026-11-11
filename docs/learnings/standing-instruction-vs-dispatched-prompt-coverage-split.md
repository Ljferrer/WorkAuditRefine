---
name: standing-instruction-vs-dispatched-prompt-coverage-split
description: A WAR directive lives in the standing agents/*.md card AND the dispatched prompt; mirror it into both or document the single-layer choice
metadata:
  node_type: memory
  slug: standing-instruction-vs-dispatched-prompt-coverage-split
  phase: guard-hermeticity/tC → RESOLVED dispatched-gate-run-tmpdir-pin-parity/t1; recurrence 2026-11-08-model-routing-and-prompt-byte-budgets/phase-2
  type: project
  provenance: code-verified
  promoted: dev/2026-08-25-engine-reliability-and-filing-fidelity@phase-7
  keywords: [prompt parity, two-layer directive, agent markdown, per-task override, mirror clause, single-layer gap, prompt drift, FINDING-PATH FORM, war-auditor.md headroom, budget-raise trailer, DISPOSITION WIDENINGS, disposition-eligibility mirror, staged headroom, FIX_GATE_RULE, carries it verbatim, ADR attribution, layer removal]
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
    - agents/war-worker.md
    - skills/war/assets/workflow-template.js
    - docs/adr/0013-commanders-intent-and-disposition-routing.md
  relates:
    - "[[source-comment-lags-emitted-prompt-after-rewrite]]"
    - "[[bsd-mktemp-ignores-tmpdir-gnu-only]]"
    - "[[template-defers-runtime-values-to-agent-via-literal-placeholder]]"
    - "[[verbatim-mirror-directive-context-mismatch-at-destination]]"
    - "[[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]]"
    - "[[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]]"
    - "[[default-flip-must-audit-all-doc-surfaces]]"
  created: 2026-06-26
  updated: 2026-11-10
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
  modified: 2026-11-10T22:39:01.896Z
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
diff. Before adding a mirror to `agents/war-auditor.md`, check its byte count against its hard ceiling in
`skills/war/assets/prompt-surface-budgets.test.mjs`; headroom is well under 1 KB, so a new mirror may need an
ADR 0042 eviction or a `Budget-Raise:` trailer.

**Closed gaps:** the `TMPDIR` gate-run pin is mirrored into the merge-task and land-phase clauses of
`workflow-template.js` and the gate steps of `agents/war-refiner.md`; the dispatched merge-task prompts split
floor exit 1 (`no-test`) from exit 2 (`status: 'error'`), matching the card. See
[[floor-script-exit-codes-1-vs-2-route-differently]]. Residual inert Nit: the land-phase clause's copied cwd
prose, carried by [[verbatim-mirror-directive-context-mismatch-at-destination]]. The `FINDING-PATH FORM`
directive (finding `file` values are repo-relative) is mirrored since #2124: the `**FINDING-PATH FORM:**`
bullet in `agents/war-auditor.md`, and the `FINDING_PATH_FORM_CLAUSE` constant in `workflow-template.js`,
interpolated into `auditPrompt()` and the three gate-audit-family prompt builds.

**Locate-cue:** search `FINDING-PATH FORM` in `agents/war-auditor.md` and `FINDING_PATH_FORM_CLAUSE` in
`workflow-template.js`; both should hit.

Recurrences: 4. (1) Gate-audit inline prompts bypass `auditPrompt()`, accepted by design, see
[[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]]. (2) The `FINDING-PATH FORM`
gap above, now closed. (3) Late-defects-fixed-in-run, task 4.1: the cold reference
`skills/war/references/disposition-eligibility.md` claims its widenings are mirrored in the dispatched
`auditPrompt` DISPOSITION WIDENINGS block, but a new sentence there was never mirrored, deferred for
staged-byte headroom. For the staged-byte cost model (full-line comments cost zero staged bytes, prompt
literals cost full bytes), see
[[workflow-template-growth-is-capped-by-the-staged-copy-headroom-floor-not-just-file-size]]. The ace
culprit compare normalizes path form with the `aceRelPath` helper; see
[[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]].
(4) Model-routing-and-prompt-byte-budgets, phase 2, task 2.1 (PIN-6, #2633): a deliberate two-layer to
single-layer move. To pay for the rule once, `agents/war-worker.md` step 4 dropped the `FIX_GATE_RULE` body
and kept only a trigger sentence. The task's grep sweep used rule-body tokens, so it missed the ADR 0013
2026-11-05 amendment, whose attribution clause said the card "carries it verbatim". Two audit seats caught the
stale ADR line, and a late-fix appended a 2026-11-10 single-layer amendment. Lesson: when you remove one
layer, also grep ADRs and docs for attribution wording (the card filename next to the rule name, "verbatim",
"mirrored"), not only the rule text. ADR amendments are append-only, so add a dated line and keep the old one.
Locate-cue (verify still present before acting, found @ phase 2 landed tip 323079bd): `const FIX_GATE_RULE`
in `skills/war/assets/workflow-template.js`, the "follow the gate rule your prompt states" sentence in
`agents/war-worker.md`, and the 2026-11-10 amendment line in
`docs/adr/0013-commanders-intent-and-disposition-routing.md`.

Related: [[source-comment-lags-emitted-prompt-after-rewrite]],
[[template-defers-runtime-values-to-agent-via-literal-placeholder]], [[bsd-mktemp-ignores-tmpdir-gnu-only]],
[[default-flip-must-audit-all-doc-surfaces]].
