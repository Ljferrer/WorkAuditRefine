---
name: endstate-check-cmd-artifact-can-double-quote-a-single-quoted-plan-literal
description: "An endstate-check .cmd artifact can double-quote a single-quoted `${...}` plan literal — bash dies 'bad substitution'"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: endstate-check-cmd-artifact-can-double-quote-a-single-quoted-plan-literal
  phase: 2026-08-06-handoff-schemas-contract/2
  keywords: 
    - bad substitution
    - endstate check cmd
    - double quote
    - plan.file
    - dollar brace plan literal
    - environmental-red
    - unverified never unmet
    - land-barrier check dispatch
    - JS template literal token in shell
    - endstate-N.cmd
  tags: 
    - war
    - endstate-check
    - land-barrier
    - shell
    - plan-authoring
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T15:22:44.239Z
---

# An endstate-check `.cmd` artifact can double-quote a plan literal the plan itself single-quoted

**Code-verified via gate-audit artifact evidence, pinned `auditSha`/`gateHeadSha`
`71ddc088fb558add6d92aab1ec4ec773b9881cd8` on `dev/2026-08-06-handoff-schemas-contract` phase 2
(`gateEvidence: true`).** Two independent gate-audit seats (task 2.1's and task 2.2's) each read the
executed artifact `<session-worktree>/.war/endstate-2-4.log` directly and quoted it verbatim: the
artifact is correctly tip-stamped and present/readable, but its companion `.cmd` file died —
`.war/endstate-2-4.cmd: line 1: Plan file: ${plan.file}: bad substitution`, `exit_code: 1`. One
seat traced the actual `&&`-chained command that was WRITTEN into the `.cmd` file:
`grep -qF "requires plan.file" … && ! grep -qF "Plan file: ${plan.file}" … && node --test …` —
**double**-quoted. Bash therefore tries to expand `${plan.file}` as a parameter (illegal — the `.`
makes it an invalid bash identifier) and the whole `&&` chain dies at the second clause, before
`node --test` ever runs. The same seat separately confirmed the *plan's own* `check:` literal for
this row (End state 32/condition 4, `docs/plans/2026-08-06-handoff-schemas-contract.md`) uses
**single** quotes — the correct form per the sibling lesson
[[check-command-literal-dollar-in-grep-pattern-needs-dash-f]]. So the plan author did the right
thing; the quoting was lost somewhere between the plan's `check:` field and the generated `.cmd`
file that the land-barrier endstate-check dispatch actually executes.

**Why this is a distinct mechanism from the `-F` lesson:** the `-F` lesson is about `grep`'s own
BRE interpretation of a literal `$` inside an already-correctly-single-quoted pattern (a reader-side
hazard). This one is about the **dispatch/execution step itself** re-rendering a plan's
single-quoted literal into a double-quoted shell line before running it (a writer-side/transcription
hazard) — bash's parameter expansion fires on `${...}` regardless of what grep would have done with
it, because the shell evaluates the line before grep ever sees it.

**Consequence — soft, not blocking, but permanently unattestable:** per the #1395 amendment
(End states 27–28 this same phase), a present/readable/tip-stamped-but-environmentally-red artifact
attests `unverified`, never `unmet` — so this never held the phase. But it also means the row can
**never** be machine-proven met until the `.cmd`-generation quoting bug is fixed; both gate-audit
seats had to fall back to independently corroborating the underlying claim from the diff/other
green artifacts rather than from this designated check.

**How to catch/avoid it:** treat ANY plan `check:` literal containing a `${...}`-shaped substring
(a JS template-literal token being matched as source text, not a real shell variable) as
high-risk for this failure regardless of how carefully it is quoted in the plan body — the risk is
downstream of the plan, in whatever writes the `.cmd` file. Prefer a quoting-agnostic anchor for
such patterns (e.g. a fixed-string match on a shorter substring that avoids the `${` sequence
entirely, or splitting the brace so no single grep argument contains an unescaped `${identifier}`
run) rather than relying on the plan's own quote character surviving to execution.

**Related:** [[check-command-literal-dollar-in-grep-pattern-needs-dash-f]] (grep-side `$` hazard,
different mechanism); [[template-defers-runtime-values-to-agent-via-literal-placeholder]] (a related
`$`-in-template hazard on the emitter side of workflow-template.js prompts).

**Disposition at land:** filed `follow-up` (not absorbable — fixing the `.cmd`-generation quoting
is outside a single task's file scope and needs a decision on how the dispatch preserves
shell-literal quoting byte-verbatim), so this defect was still live at phase-2 land.

> archived 2026-08-25: resolved — moved to archive
