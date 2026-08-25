---
name: new-advisory-lint-rule-batch-can-ship-with-asymmetric-fallback-and-scope-bugs-across-all-four-rules
description: "A freshly-landed batch of advisory (exit-0, report-only) lint rules can carry known, cross-seat-confirmed grammar/scope bugs in every rule of the batch at land time -- WAIVE-row id delimiter weaker than its own PIN sibling, a task-less landing-class cell fanning citation-required out to every task instead of falling back fail-open, and guardrails/end-state citation targets resolving to the document's first bold-label match instead of the intent section"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: new-advisory-lint-rule-batch-can-ship-with-asymmetric-fallback-and-scope-bugs-across-all-four-rules
  phase: authoring-side-verification/phase-1 task 1.3 (audit + gate-audit)
  keywords: 
    - plan-literal-lint
    - advisory lint
    - exit 0 report only
    - WAIVE-<n>
    - right-delimited id
    - lookahead delimiter
    - slice landing class
    - fan-out to every task
    - fail-open fallback
    - class-less pin
    - anywhere-citation
    - GUARDRAILS_MARK
    - END_STATE_MARK
    - document-wide first match
    - bulletRegion
    - findIndex
    - pin-citation
    - section-scoped citation
  tags: 
    - war
    - war-strategy
    - lint
    - plan-literal-lint
    - audit-findings
  created: 2026-08-24
  originSessionId: dcda690d-99d2-4fba-9d28-2a2a858d4676
  modified: 2026-08-25T05:10:53.077Z
---

# A new advisory lint rule batch can ship with the same class of grammar/scope bug in every rule

**Found (code-verified — landed tip `d29d06eee9dee1d7ba57681650c608df02204f30` on
`claude/authoring-side-verification-600a79`, read via the `_refinery25` worktree,
gitdir physical path `<repo-root>/.claude/war-worktrees/authoring-side-verification-2026-08-24/_refinery/`,
`HEAD` byte-equal to the landed tip):** Task 1.3 landed four new advisory rules in
`skills/war-strategy/assets/plan-literal-lint.mjs` (`pin-citation`, `evidence-consumed-form`,
`single-signal-oracle`, `waive-row-form`). At least two auditor seats independently, on separate
rounds, converged on the same three defects — all still present verbatim at the landed tip:

1. **`waive-row-form`'s id delimiter is weaker than its own sibling grammar (line 427).** The row
   detector is `/^\s*(?:[-*]\s+|\|\s*)?[`*]*WAIVE-\d+(?!\d)/` — a digit-only right delimiter — while
   the sibling `pinRe`/`PIN_TOKEN` correctly use `(?!\w)` per the ratified "digits-only,
   right-delimited; letter suffixes illegal" grammar (PIN-3), and the pin rule carries an explicit
   `PIN-1a` negative test proving it. `WAIVE-1a · ...` is therefore silently admitted as a valid
   WAIVE row here, an asymmetry between two implementations of the same phrase in one diff.
2. **`pin-citation`'s `slice` class fans a task-less cell out to every task instead of falling back
   fail-open (line 360).** `const ids = c.tasks?.length ? c.tasks : [...doc.taskMap.keys()]` — the
   ratified class→section map (D1) reads `slice → the named task's slice`, presupposing a named
   task; a bare `slice` cell (no `T<n>`) is outside that grammar entirely. Rather than degrading to
   the anywhere-citation fallback already used for class-less pins (which the file's own "fail-open
   posture throughout" guardrail argues for), it demands the pin be cited in **every** task block,
   emitting up to N-1 spurious advisory hits on an N-task plan.
3. **`GUARDRAILS_MARK`/`END_STATE_MARK` resolve document-wide, not section-scoped (lines 286-289).**
   `lines.findIndex((l) => GUARDRAILS_MARK.test(l))` (and the `END_STATE_MARK` twin) scans the
   *entire* document for the first bold-label match rather than searching within the intent
   section the loop already tracks (`designSpan`/`INTENT_H2`). An earlier bold occurrence anywhere
   in Part 1 — a quoted template fragment, a Context paragraph — would silently redirect every
   guardrail/end-state-class pin's citation target. Zero live impact on the plan under audit (one
   intent block, no earlier bold occurrence), so this is latent, not currently firing.

**Why this matters beyond the three individual bugs:** all three share one shape — a rule that
correctly implements the ratified grammar's happy path but diverges from the file's own stated
fail-open/graceful-degradation posture (or from a sibling rule solving the identical sub-problem)
on the edge case. This is exactly the kind of drift a from-scratch rule batch accumulates when each
rule is authored/reviewed independently rather than against a shared checklist of "what does the
sibling rule do here." All three are `disposition: note` (informational only, advisory/exit-0 so
runtime cost is noise, not breakage) and none were fixed before land — a future task extending
`plan-literal-lint.mjs` should check these before assuming the shipped rules are internally
consistent with each other or with their own doc comments.

**Locate-cue (verify still present before acting):**
`skills/war-strategy/assets/plan-literal-lint.mjs` — the `waive-row-form` rule's `scan` function
(the `WAIVE-\d+(?!\d)` regex), the `pin-citation` rule's `ids` construction inside the `slice`
branch, and `parseDocument`'s `GUARDRAILS_MARK`/`END_STATE_MARK` `findIndex` calls.

## Related

[[lacks-case-sensitive-vs-has-i-presence-pin-asymmetry]] — the same "two implementations of one
ratified grammar phrase diverge on the edge case" shape, in this repo's shell structural-test
family rather than its JS lint family.
[[doctrine-landing-class-token-can-name-a-marker-outside-its-own-ratified-enum]] — same phase, same
plan's landing-class vocabulary, a doc-side (not code-side) instance of the identical
class-boundary confusion the `slice`-fan-out bug above hits on the code side.
