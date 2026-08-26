---
name: standing-instruction-vs-dispatched-prompt-coverage-split
description: Standing .md vs dispatched prompt; mirror into both
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

**Recurrence (2026-08-25-engine-reliability-and-filing-fidelity/phase-7 "aceBisect robustness", task
7.1, landed `dev/2026-08-25-engine-reliability-and-filing-fidelity`) — a new `auditPrompt()`-only
directive shipped with a same-file rationale comment asserting "no standing-card behavior change,"
which is imprecise: the directive changes what auditors are TOLD TO EMIT, which is auditor behavior,
not merely engine plumbing.** **Code-verified** at the gate-audit-pinned tip
`b5c54b58be788017647aaad446bde204de8d395e` (task 7.2, `gateEvidence: true`; the terminal `p7-polish`
task that could have closed this gap was **discarded** with zero commits, so this pin is the landed
content). `skills/war/assets/workflow-template.js`'s `auditPrompt()` gained a **FINDING-PATH FORM**
directive ("report every finding's `file` as a repo-relative path — never absolute, never
`./`-prefixed; these values feed exact-string routing compares downstream"); confirmed absent from
`agents/war-auditor.md` at the same pin (no `repo-relative`/`FINDING-PATH` text anywhere in the
file). Judged an accepted, scoped trade-off, not a violation — the task's plan `Files:` list named
only `workflow-template.js` and the plan slice said "the re-audit prompt" — but the coverage gap is
real: the three gate-audit-family prompt builds (outside `auditPrompt()`) never receive the mandate
either, and their `file` values feed the same follow-up-consolidation collapse key
(file+line window), which has no path-form normalization unlike the ace culprit compare's new
`aceRelPath` helper (see [[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]]).

**Concretely actionable for whoever closes this gap:** at the pinned tip, `agents/war-auditor.md`
was reported (by the auditing seat, not independently re-measured byte-for-byte by this write) at
~26,287 B against its 28,672 B hard ceiling in `skills/war/assets/prompt-surface-budgets.test.mjs` —
roughly 2,385 B of headroom, comfortably enough for a one-sentence mirror without needing an ADR
0042 eviction or a `Budget-Raise:` trailer. Verify the current byte count before relying on that
headroom figure; it will drift as the card gains other content.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`, the
`auditPrompt()` builder's `FINDING-PATH FORM` line (search `FINDING-PATH FORM`); `agents/war-auditor.md`
(search `repo-relative` — should be absent until this gap is closed).
