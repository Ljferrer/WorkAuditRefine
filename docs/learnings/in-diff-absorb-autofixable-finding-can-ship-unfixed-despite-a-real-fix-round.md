---
name: in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round
description: "A Minor/Nit finding disposed absorb + autoFixable:true, inside the task's own Files diff, can still ship unfixed once the task's verdict reaches approve"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-5 (task 5.1), landed fc9cf8c1099156f551c414ef99d34d277451da25 on dev/2026-09-06-engine-and-audit-verdict-integrity"
  keywords: 
    - absorb disposition
    - autoFixable
    - fixRounds
    - unfixed finding
    - approve verdict
    - PARTIAL_LOG_RULE
    - byte-identical eviction claim
    - Minor never blocks
    - fix round did not cover finding
    - gate-log stamp
  tags: 
    - war
    - audit-findings
    - process
    - workflow-template
  created: 2026-09-07
  originSessionId: a2a576b1-d8af-4c79-ad1a-af3d3e5c5c91
  modified: 2026-09-08T01:54:26.618Z
---

# An in-diff `absorb`/`autoFixable:true` finding can ship unfixed even after a real fix round ran

**Found (code-verified — landed tip `fc9cf8c1099156f551c414ef99d34d277451da25` on
`dev/2026-09-06-engine-and-audit-verdict-integrity`, read via the run-scoped `_refinery` worktree
whose `HEAD` is directly on this tip:
`<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/`).**

Task 5.1's audit log entry shows one fix round already ran (`fixRounds: 1`) before its final
`verdict: approve`. That same final audit entry carries nine findings, several `severity: Minor`,
`disposition: absorb`, `autoFixable: true`, naming defects **inside** the task's own Files
(`skills/war/assets/workflow-template.js`, `agents/war-refiner.md`, `skills/war/references/refiner-recovery.md`
— all in Task 5.1's Files list). Three of them are confirmed **still present, unfixed, at the
landed tip**:

1. `PARTIAL_LOG_RULE`'s remedy clause still reads "first stop any backgrounded gate job **you
   started** and truncate the gate log" — on a re-dispatch the fresh agent started no job, so the
   clause names an owner it never has. Verbatim, byte-equal, on both
   `skills/war/assets/workflow-template.js` (the `const PARTIAL_LOG_RULE = pt\`...\`` literal) and
   `agents/war-refiner.md` (its merge-task step, PIN-1 byte-equal mirror).
2. The baseline-proceed re-merge build (`skills/war/assets/workflow-template.js`, the
   `BASELINE-PROCEED re-merge` dispatch inside the `cls === 'baseline'` branch) never calls
   `gateCaptureClause`, so `PARTIAL_LOG_RULE`'s "read the stamped gate log **named above**" has no
   antecedent in that one prompt — the other three merge-task sites (initial, floor-retry,
   environment-proceed) do name the path there.
3. `skills/war/references/refiner-recovery.md`'s header still claims unqualified byte-identity
   ("each moved block was **byte-identical** to its pre-eviction card text at eviction time") for
   a block (the `## MergeResult merge-task-only fields` parenthetical) that gained a brand-new
   `gate_segment` clause in the SAME commit — and the paired assert message in
   `skills/war/assets/workflow-template.test.mjs` (`'refiner-recovery.md § MergeResult
   merge-task-only fields carries the 617 B evicted parenthetical byte-identical'`) repeats the
   same unqualified claim.

**Why this matters:** all three findings were tagged `autoFixable: true` and disposed `absorb`
with no `phaseClose: true` — the shape that normally signals "cheap, mechanical, will be picked up."
None of the three landed. The mechanism: Task 5.1's fix round (round 1) evidently addressed OTHER
findings from the round-1 audit; the round-2 audit (the one quoted above) then surfaced/retained
these, but since none is Critical/Major, the verdict went straight to `approve` — **Minor/Nit never
blocks approval, so nothing forces a third round**, even for a finding that is in-diff, mechanical,
and marked auto-fixable.

**Pattern to watch for:** `disposition: absorb` + `autoFixable: true` is informational, not a
guarantee. Once a task's verdict reaches `approve`, any remaining non-blocking finding from that
same audit round ships as-is unless a later task or phase-close polish independently happens to
touch the same construct. Before trusting a `suggested_fix` was applied, re-Read the named
construct at the landed tip — do not infer from the disposition tag or from `fixRounds > 0`.

**Related:** [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] — the
much larger, heavily-recurring instance of this same root fact for **terminal/polish** tasks
specifically (no further round exists structurally); this lesson generalizes it to an ordinary,
non-terminal task that DID get a fix round, showing the guarantee gap is not limited to terminal
rounds. [[audit-log-finding-can-be-stale-by-land-time]] — the complementary caution (a finding CAN
be fixed before land, so don't assume it is still live either) — together they say: never trust the
audit-log disposition alone in either direction, always re-Read at the landed tip.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`,
search `const PARTIAL_LOG_RULE` and the `BASELINE-PROCEED re-merge` prompt literal inside the
`cls === 'baseline'` branch; `agents/war-refiner.md`, search "any backgrounded gate job you
started"; `skills/war/references/refiner-recovery.md`, the file's opening paragraph ("Verbatim
evictions from..."); `skills/war/assets/workflow-template.test.mjs`, search "617 B evicted
parenthetical byte-identical".
