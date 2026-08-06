---
name: legacy-arm-checked-first-cannot-discriminate-a-degenerate-new-format-plan
description: "A 'legacy arm, checked first' precedence clause that suppresses an intake-defect refusal on a coarse zero-signal predicate (no Done when: bullets anywhere) is plan-ordained and correct for genuine legacy plans, but cannot distinguish them from a post-contract plan an author simply left unmigrated"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: legacy-arm-checked-first-cannot-discriminate-a-degenerate-new-format-plan
  phase: 2026-08-05-precision-chain-and-loop-breaker/1.1
  tags: 
    - authoring-contract
    - backward-compatibility
    - fallback-precedence
    - ADR-0044
    - intake-defect
    - design-residual
  keywords: 
    - legacy arm checked first
    - Done when intake
    - intake defect
    - "--afk refuses dispatch"
    - byte-identical legacy dispatch
    - degenerate new-format plan
    - authoring-era detector
    - coarse zero-signal predicate
    - ADR 0044
  created: 2026-08-05
  modified: 2026-08-06T00:58:43.667Z
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
---

# A "legacy arm, checked first" precedence fix can be exactly right and still leave a residual: it can't tell a real legacy plan from a degenerate new one

**What happened (code-verified — found at `skills/war/SKILL.md`, the Decompose gate's
"Done-when intake" sub-bullet, verify still present before acting; phase
2026-08-05-precision-chain-and-loop-breaker, Task 1.1):** the sub-bullet states an
intake-defect rule — a `requiresTest: true` task without a `Done when:` command is an
intake defect; interactive runs surface it at the approval gate, `--afk` refuses dispatch
— then adds, in a fix round that closed a prior audit finding: "**Legacy arm (checked
first):** a plan with no `Done when:` bullets anywhere stages unchanged and the
intake-defect rule does not fire — every task's `doneWhen` is `null`, dispatch proceeds,
and downstream prompts stay byte-identical." This precedence clause is deliberate and
plan-mandated (the plan's own Pivotal constraint "Legacy byte-identity" and Commander's
Intent End state 9 both require a pre-ADR-0044 plan to dispatch unchanged, never refused)
and it correctly closes the opposite defect a prior audit round found: without it, every
legacy plan hard-stops under `--afk` because every `requiresTest: true` task trivially
satisfies "no Done when: command".

**The residual, recorded not fixed (multiple audit seats flagged it as an informational
note, not a defect):** the legacy arm's trigger predicate is "no `Done when:` bullets
**anywhere** in the plan" — a coarse, zero-signal test. It cannot distinguish a genuine
pre-ADR-0044 plan (where the bullet never existed) from a post-ADR-0044 plan whose author
simply omitted every `Done when:` bullet (a malformed but current-format plan). Both cases
present the identical signal to the Lead, so both dispatch with `doneWhen: null` and *no*
intake defect surfaced — even though the authoring template (ADR 0044 §4) makes the
bullet required for every `requiresTest: true` task in a current-format plan. The
intake-defect rule only ever fires on a **partially**-migrated plan (some tasks carry the
bullet, one doesn't) — a fully-unmigrated new-format plan escapes it entirely.

**Why this isn't a defect to fix:** the plan slice and the Legacy byte-identity pivotal
constraint explicitly mandate exactly this behavior — the alternative (discriminating
legacy-vs-degenerate) would require an authoring-era marker the plan never defines, and
adding one would be a new design decision, not a bug fix. Recording it here because the
shape recurs: **a "checked first" fallback/legacy arm keyed on a coarse presence-absence
signal will always be unable to distinguish "the old regime, where this signal is
structurally absent" from "the new regime, degenerately producing the same absent
signal."** Any future authoring-contract migration that adds a "legacy plans run
unchanged" escape hatch inherits the same blind spot by construction.

**How to apply:** when designing a legacy/fallback arm gated on a signal's total absence
across a document (not per-item absence), state the residual explicitly in the same
sentence or an adjacent note, and — if the residual later matters in the field — the fix
is a new authoring-era signal (e.g. a plan-level version/contract marker), not a smarter
predicate over the existing absent signal.

Related: [[byte-convergence-plan-can-mandate-per-file-import-style-variant]] (a different
axis of "the plan's own literal is the authority, even when it reads odd"); the value-
boundary companion fix landed in the same commit — the same sub-bullet also had to state
that the staged `doneWhen` value excludes the `Done when:` key prefix itself, else the
staged string renders as a bogus shell command (`assert-done-when.sh` would run
`Done when: node --test ...` verbatim) — a reminder that "extend the line span" and
"define the value boundary" are two separate authoring-doc precision duties.
