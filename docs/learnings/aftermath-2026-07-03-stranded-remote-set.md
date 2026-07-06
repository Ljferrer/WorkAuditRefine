---
name: aftermath-2026-07-03-stranded-remote-set
description: "25 remote WAR branches known-stranded; content landed"
metadata: 
  node_type: memory
  type: project
  keywords: [scorched earth sweep, tip-reachability gate, needs-human rows, rewritten SHA, branch deletion bar, orphan origin branches]
  originSessionId: c9826f69-a02b-4f51-b701-a3f4033e1864
---

The 2026-07-03 `/aftermath --scorched-earth` run swept everything local (38 branches, 17 worktrees + 15 husk dirs, `war-worktrees/` root) and 16 evidence-complete remotes. The 26 remote branches left on origin are **stranded originals whose content landed under rewritten SHAs** — they permanently fail the tip-reachability gate and will reappear as needs-human rows in every future aftermath run:

- `integration/pipelineskills/phase-1` + `war/pipelineskills/p1-task1…11` — stranded by the `.war-task` marker amend ([[war-task-marker-committed-by-git-add-a-blocks-refiner-merge]]); landed via PR #473 (equivalents spot-checked: `9d83140`, `4172fbb`).
- `integration/memsub/phase-1+2` + `war/memsub/p1-task1…p2-task7` — stranded by the held-escalation manual completion ([[held-escalation-lead-manual-completion]]); landed via PR #496 (tips carry a real Revert divergence, so content-equivalence was NOT verified per-commit here).
- `war/compaction/p1-task2,3` — landed via PR #508 (equivalents verified: `f473f89`, `80cba8e`).
- `war/followup444/p1-task2` — pre-rebase duplicate of merged `3796d06` (PR #455).
- `claude/frosty-moser-46e719`, `claude/objective-wilbur-571789` — session remotes without a per-branch merged PR.

**Why:** remote deletion never lowers its bar below tip-reachable + PR merged, even under `--scorched-earth`.

**How to apply:** don't re-derive the evidence — treat these as known-stranded. Clearing them requires a deliberate manual `git push origin --delete <branches>` outside aftermath's gates (operator call; memsub is the least-verified family). Also: no `.claude/campaigns/` exists in this repo, and newer run dirs in `.claude/teams/` carry only `owned-refs.txt` (no ledger.json) — active-run reconciliation must go straight to git/PR state.
