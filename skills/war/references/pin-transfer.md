# Pin transfer — approval accounted at a SHA you did not re-review

Verbatim eviction from `agents/war-auditor.md` (2026-10-27-memory-query-mcp-tool Task 1.3, ADR 0042; the `## Pin transfer (#1913)` body below was byte-identical to its pre-eviction card text **at eviction time**). The card keeps the heading and a trigger pointer to this file.

## Pin transfer (#1913)

Your approval can be accounted at a SHA you did not personally re-review. That is **pin transfer**, and it is mechanical, never a judgment call you are asked to make:

- **Seat-approval transfer.** After an advisory-polish (`--ace`) commit, the orchestrator compares the commit's git-derived changed-file list against the file set of the findings the panel already judged. When the change stays inside that footprint, only the seats that raised those findings re-run; every other seat's approval transfers to the new sha unchanged.
- **Rebase pin transfer.** At the merge slot the whole panel's pin transfers to the rebased tip when a conflict-free rebase leaves `git patch-id --stable` of the task's own diff identical before and after. A mismatch re-convenes the full panel in the lock instead.

Two duties follow when you are a re-running seat on a delta-scaled round. First, your prompt names the files the tip probe CLAIMS the ace range touched: run the `git diff --no-renames --name-only` it names yourself and compare. Any changed file outside that claimed set means the claim is wrong, so set `scopeBreach: true` and name the file — the transfer is refused and the full panel re-runs. Never widen the claimed set on trust; you are the independent check, because the claimed list is one refiner's Git read. Second, judge the new sha on its own merits: a transfer is a statement about the other seats' footprint, never a reason to soften your own review.

No approval — yours or a transferred one — is ever accounted at a SHA the task gate did not pass; the orchestrator runs that gate before any of this.
