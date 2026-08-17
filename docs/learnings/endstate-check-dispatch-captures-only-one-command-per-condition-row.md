---
name: endstate-check-dispatch-captures-only-one-command-per-condition-row
description: "Endstate-check dispatch artifacts one command per condition row — a two-command `check:`'s second half goes unrecorded"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - endstate-check
    - endStateAttestations
    - land barrier
    - artifact-first
    - multi-command check
    - gate evidence
    - evidence capture gap
    - two-command condition
    - workflow-template.js
    - empty stdout exit 0
    - systemic pattern
    - doc-cli-consistency-corpus
  provenance: code-verified
  slug: endstate-check-dispatch-captures-only-one-command-per-condition-row
  phase: 2026-08-06-done-when-floor-wiring/1.4
  tags: 
    - engine
    - evidence-capture
    - gate-audit
    - plan-authoring
  relates:
    - "[[endstate-check-fixed-context-window-undercaptures-growing-enumerated-block]]"
  created: 2026-08-15
  modified: 2026-08-17T05:52:07.269Z
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
---

# A plan End state's `check:` field naming two mandatory commands only gets one captured artifact

## The gap

The land-barrier endstate-check dispatch (`skills/war/assets/workflow-template.js`, verify
still present before acting — the `endstate-check:phase-<id>` dispatch and its
`ENDSTATE_CHECK_RESULT` schema, D2/F5) runs each claimed `check:`-tagged End-state condition
**once**, teeing its output to exactly one artifact:
`<_refinery>/.war/endstate-<phaseId>-<n>.log` (n = the condition's 1-based claim number) —
one command, one row, one file. This is correct for a condition whose `check:` is a single
command.

But a plan can (and, in `2026-08-06-done-when-floor-wiring`, repeatedly did) phrase an
End-state condition's check as **two independently mandatory commands** joined by prose
"AND" — e.g. End state 1's `-TERM -"$cmd_pid"` grep returning 1 *and* its `-KILL` sibling
also returning 1; End state 3's plain `grep -ci` form *and* a wrap-tolerant
leader-strip/join companion the red-team report explicitly flagged as load-bearing. Only the
**first** command of each such pair produced a captured artifact
(`endstate-1-1.log` held a single '1', `endstate-1-3.log` held a single '0') — the second,
equally load-bearing half never ran through the dispatch at all.

**The auditor's mitigation, and its limit:** in both observed instances the gate-audit seat
caught the gap and re-grounded the missing half directly on the pinned blob
(`git show <sha>:<path>`) before attesting "met" — so the conditions were still correctly
verified. But that re-grounding is a manual, unrecorded step; a downstream consumer that
trusts the artifact log as the *complete* evidence trail for a condition (rather than
re-deriving the missing half itself) would score a half-verified condition as fully
artifact-backed.

## Durable rule

1. **As a plan author:** when an End state's `check:` genuinely requires two (or more)
   independently mandatory commands, either (a) combine them into ONE shell command whose
   own exit status reflects both (e.g. `cmd1 && cmd2`, or a single script), so the dispatch's
   one-command-per-row artifact actually covers the whole condition, or (b) split it into two
   separate numbered End-state conditions, each with its own `check:` and its own artifact.
   A prose "AND" inside a single `check:` field's *description* does not make the dispatch
   run more than the one command that field's `check:` key actually holds.
2. **As an auditor/servitor reading endstate artifacts:** never assume a `.war/endstate-*.log`
   artifact is the complete evidence trail for a condition whose stated check names more than
   one command — check what the artifact's single logged command actually was, and if the
   condition's check prose names a second command, re-verify it directly against the pinned
   blob rather than trusting the artifact's silence about it.

## Locate cue

`skills/war/assets/workflow-template.js`: the `endstate-check:phase-<id>` dispatch (~line
1707-1718, `ENDSTATE_CHECK_RESULT` schema ~line 164-166) builds one prompt row per condition
(`r.n`, `r.check`) and expects one artifact per row — confirmed one-command-per-row by
construction, not a bug in that dispatch itself; the gap is in how a plan's `check:` field
gets authored when the underlying verification is genuinely multi-command.

## Companion gap: a SINGLE-command check can also capture zero stdout despite exit 0

Observed in phase 2 of `2026-08-06-gate-audit-finding-routing` (landed tip
`06020944b884d2e2860ccf2fe698ef3d5ba4868e`, code-verified — the two artifacts below still exist
in the `_refinery` worktree at that tip): `endstate-2-2.log` (End state 16, two `grep -Fc`
invocations) and `endstate-2-6.log` (End state 13, `git log --no-merges --format=%s <base>..<tip>
| grep -vc '#[0-9]'`) are BOTH tip-stamped at the correct SHA with `exit_code: 0`, but capture
**zero stdout** — literally just `tip_sha: ...` and `exit_code: 0`, nothing else. This is distinct
from the two-commands-in-one-field cause above: each of these is (arguably) a single check
expression, and BOTH declared checks are commands that always print something (`grep -Fc` always
prints a count; the `git log | grep -vc` pipeline prints a count and additionally exits 1 when
the count is 0) — so `exit 0` with empty stdout is not reconcilable with either command's own
documented shape. Sibling conditions in the same run (`endstate-2-1.log`, `endstate-2-3.log`)
captured full output normally, so this isn't a systemic capture failure — it correlates with the
check being a **pipeline / compound shell expression** rather than a single bare command.

**Durable rule (extends the one above):** an `endstate-*.log` artifact that is tip-stamped and
`exit_code: 0` but carries NO command output is not evidence that the check passed "by exit
code" — reconcile the artifact's shape against what its OWN declared check would actually print;
if they don't match (e.g. a `grep -c`/pipeline check that should always emit a count but the
artifact is silent), treat the artifact as **non-substantiating** and fall back to a direct
content-at-pin read, exactly as for the multi-command gap above. This risk is highest for
`check:` fields that are shell pipelines/compound expressions rather than a single bare command
or `node --test` invocation.

## Third instance — confirmed systemic across three separate phases/plans

Phase 1 of `2026-08-06-doc-cli-consistency-corpus` (landed tip
`c809b77fee45630b19b195bf80f13743168a7857` on `dev/2026-08-06-doc-cli-consistency-corpus`; the
gate-audit's own `auditSha` was `32e1b4b774d88f95949826df9fd6247fa05acce1`) shows the identical
shape a third time: `.war/endstate-1-5.log` (End state 5, a `grep -n` check) and
`.war/endstate-1-9.log` (End state 9, a two-`grep -c` compound check) both read exactly
`tip_sha: 32e1b4b774d88f95949826df9fd6247fa05acce1` / `exit_code: 0` with **no output body** —
code-verified by direct Read of both files in the `_refinery` worktree at the landed tip
(`.claude/war-worktrees/2026-08-06-doc-cli-consistency-corpus-2026-08-16/_refinery/.war/endstate-1-5.log`
and `endstate-1-9.log`, repo-relative: `skills/_shared/doc-cli-consistency.test.mjs` is condition
5's subject, `docs/adr/0046-specs-are-posterity-skills-cite-maintained-surfaces.md` is condition
9's). The gate-audit seat correctly treated both as non-substantiating and re-grounded on
`git show <sha>:<path>` before attesting "met", exactly per the durable rule above — the
condition verdicts were still correct, only the artifact's self-sufficiency was not.

Three independent phases (`2026-08-06-gate-audit-finding-routing`, and now
`2026-08-06-doc-cli-consistency-corpus`) reproducing the exact same empty-stdout-despite-exit-0
shape confirms this is a **systemic property of the endstate-check dispatch for grep-based
conditions**, not a one-off fluke — treat "artifact present, exit 0, empty body" as the expected
shape for a grep/pipeline-style check in this engine version, and always re-ground on the pinned
blob rather than treating the empty artifact as a gap unique to one run.
