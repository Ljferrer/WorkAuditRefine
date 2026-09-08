---
name: in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round
description: "A Minor/Nit finding disposed absorb + autoFixable:true, inside the task's own Files diff, can still ship unfixed once the task's verdict reaches approve"
metadata: 
  promoted: dev/2026-09-06-engine-and-audit-verdict-integrity@phase-5
  node_type: memory
  type: project
  provenance: code-verified
  slug: in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-5 (task 5.1), landed fc9cf8c1099156f551c414ef99d34d277451da25 on dev/2026-09-06-engine-and-audit-verdict-integrity +1 recurrence (2026-09-06-engine-and-audit-verdict-integrity/phase-7 task 7.1, landed 2694f617c02b8ae0a527086792355331c5cc5a79 on dev/2026-09-06-engine-and-audit-verdict-integrity)"
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
    - zero fix rounds
    - fixRounds 0
    - citationOf
    - schemas.md drift
    - phaseClose queue not drained
  tags: 
    - war
    - audit-findings
    - process
    - workflow-template
  created: 2026-09-07
  originSessionId: a2a576b1-d8af-4c79-ad1a-af3d3e5c5c91
  modified: 2026-09-08T09:02:45.943Z
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

**Recurrence 2 (code-verified — landed tip `2694f617c02b8ae0a527086792355331c5cc5a79` on
`dev/2026-09-06-engine-and-audit-verdict-integrity`, phase 7 "Citations", task 7.1, read via the
run-scoped `_refinery` worktree whose `HEAD` is directly on this tip:
`<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/`).**
Task 7.1's own audit round approved with `fixRounds: 0` — the task never ran a fix round at all,
because every finding topped out at Minor/Nit (Minor/Nit never blocks). At least three findings
tagged `disposition: absorb`, `autoFixable: true` (two of them also `phaseClose: true`) are
confirmed still present, unfixed, at the landed tip:

1. `skills/war/references/schemas.md` line 63 still enumerates the durable citation shape as
   `{ row, threadedRow, rationale }`; `citationOf` in `skills/war/assets/workflow-template.js`
   actually returns `{ row: threadedRow, threadedRow, cited: row, rationale }` and `recordAced`
   spreads that fourth `cited` key onto the durable `aced` record. Two seats flagged this
   (Nit + Minor, both `phaseClose: true`); neither landed.
2. `skills/war/assets/workflow-template.js`, the `queuedFindingRow` header comment (search
   `citationStamp reached only the sweep copy`), still writes the drift-fixing commit's sha with a
   leading `#` (`#3f55b04`) — in this file `#NNNN` denotes a GitHub issue, so it misreads as a
   nonexistent issue. Flagged Nit, `phaseClose` absent (an in-diff, not phase-close-routed, fix);
   unfixed anyway.
3. `skills/war/assets/workflow-template.test.mjs` line 12846 (the `CITE_ARGS` header comment) is
   still ~137 characters against its own neighbor lines' ~95-character wrap. Flagged Nit, in-diff;
   unfixed.

The `phaseClose: true` pair depended on a later phase-close/polish sweep touching those files; the
phase's one polish task (`p7-polish`) touched only `docs/adr/0035-...md`, so the queue never
drained them. **The reinforced rule: `disposition: absorb` + `autoFixable: true` is a routing tag,
not a completion guarantee — and `fixRounds: 0` (an all-Minor/Nit round-1 approve) means NONE of
that round's absorb findings were ever mechanically applied, `phaseClose` or not.** Always re-Read
the named construct at the landed tip before trusting a `suggested_fix` landed.

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
parenthetical byte-identical". Recurrence 2: `skills/war/references/schemas.md`, search `citation?`
near line 63; `skills/war/assets/workflow-template.js`, search `citationStamp reached only the
sweep copy` (the `queuedFindingRow` header) and `const citationOf`; `skills/war/assets/workflow-template.test.mjs`,
search `Args for the citation family` (the `CITE_ARGS` header, around line 12846).
