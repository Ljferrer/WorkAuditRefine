---
name: zero-commit-polish-records-every-queued-absorb-aced-panel-sees-only-the-count
description: A zero-commit phase-close sweep records every queued absorb aced; the polish panel sees only the count
metadata:
  node_type: memory
  type: project
  keywords:
    - phase-close sweep
    - polish
    - zero-commit
    - queued findings
    - phaseCloseQueue
    - recordAced
    - ace_diff_files
    - sweepOverlap
    - no edit needed
    - polish panel
    - ruled residual
  provenance: code-verified
  slug: zero-commit-polish-records-every-queued-absorb-aced-panel-sees-only-the-count
  phase: 2026-10-20-rea-artifact-evidence/phase-1 p1-polish
  tags:
    - war
    - engine
    - phase-close
    - audit-gap
    - workflow-template
  created: 2026-10-20
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-21T07:00:08.675Z
---

# A zero-commit polish sweep cannot be checked finding by finding

**What the panel sees.** The polish task's `planSlice` carries only the queue length: "drain the phase-close queue (N finding(s)) + cross-task coherence". The queued finding bodies go only into the sweep worker's dispatch (`queuedFindingRow`, verbatim). The panel call adds `citationSoundnessClause`, which renders only citation-resolved rows.

**What the engine does with a no-op.** On a merged sweep, a queued finding is recorded aced on the panel's re-approval alone. The one exception is a changed-file report that overlaps the queue footprint and misses a row's file. With zero commits the report is empty, so `sweepOverlap` is false and every queued row goes to `recordAced` at the sweep head. The code comment names this a ruled residual (#1944-class). The handoff was not in my input, so this follows the code path.

**What happened in phase 1.** The sweep worker made no commit. The polish branch equalled the integration tip, and the merge was "Already up to date". The worker claimed none of the three queued findings needed an edit. Four polish seats each said they could not check any no-edit claim, and found no queue in the refinery `.war` directory or the run directory (seat claim, not re-verified). They re-audited cross-task coherence at the integrated tip and approved.

**Consequence.** The worker can decline an absorb finding, and the panel cannot tell a justified no-op from a skipped fix. The finding is still recorded aced.

**What to do.** At phase close, if the sweep made zero commits, read the handoff's aced rows against the queued findings yourself. If a no-op claim looks wrong, route that finding by hand to a follow-up. A fix would thread the queued rows into the polish panel's prompt. No such change was filed in this phase.

**Locate-cue (verify still present before acting).** `skills/war/assets/workflow-template.js`: search `drain the phase-close queue`, `RESIDUAL, ruled (#1944-class)` and `citationSoundnessClause`. Found at landed tip 4e33b6db.

**Related.** [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] covers the polish round that has no successor.

> archived 2026-10-30: resolved — moved to archive
