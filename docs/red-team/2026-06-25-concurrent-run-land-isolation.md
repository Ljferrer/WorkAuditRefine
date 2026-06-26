# Red Team — Concurrent-Run Land Isolation (2026-06-25)

**Verdict:** CLEARED-WITH-NOTES — every executed git-mechanics claim reproduced green and full
spec→plan coverage confirmed; two Minor hardening patches applied. *(The mechanical gate returned
`BLOCKED`, driven entirely by a `claims-vs-reality` lens misfire on an implementation plan — see
**Gate output vs Lead adjudication**.)*

Plan: [`docs/plans/2026-06-25-concurrent-run-land-isolation.md`](../plans/2026-06-25-concurrent-run-land-isolation.md)
· Source spec: [`docs/specs/2026-06-25-concurrent-run-land-isolation-design.md`](../specs/2026-06-25-concurrent-run-land-isolation-design.md)
· Run: `wf_dc24a18b-e7e` (11 agents, ~597k tokens) · 8 probes, all on-target, none dropped.

## Attack surface
- **Spine (4):** `claims-vs-reality`, `coverage-vs-source`, `consistency-placeholders`,
  `dependency-feasibility`. `executable-proof` deliberately dropped — the plan ships TDD prose, not
  runnable code+Expected blocks; the bespoke executed probes are the real executable proof.
- **Bespoke (4):** `git-mechanics-cas` *(executed)*, `teardown-blindness` *(executed)*,
  `anchor-check` *(analyzed)*, `root-and-land-stale-sync` *(analyzed)*.
- **Executed in throwaway sandboxes:** `git-mechanics-cas`, `teardown-blindness` (fresh `git init`
  bare-origin + two-clone repos under the scratchpad).

## Executed proof
- **Push-first CAS** (Task 2 / spec §5.3) — reproduced on git 2.50.1: a no-force push of a
  non-descendant against an out-of-band-advanced `origin/<working>` is **rejected**, and the
  **local ref is left unchanged**; the opposite ordering (local `update-ref` first) **diverges**
  local from origin. Confirms the plan's push-first design.
- **Rebase of a checked-out branch** (Task 5 / spec §5.2) — `git rebase <integ> <task-branch>`
  fails (`already used by worktree`); `git rebase --onto` fails **identically** (does not dodge it);
  `git -C <task-worktree> rebase` succeeds and leaves the worktree clean. Confirms the merge-task
  split (rebase in the task worktree, merge in `_refinery`).
- **Detached land** (Task 2 / spec §5.3) — `worktree add --detach` → `merge --no-ff` →
  `update-ref` CAS succeeds with the correct old, fails (exit 128) with the wrong old.
- **Teardown blindness** (Task 3) — reproduced exactly: a `_refinery` worktree on
  `integration/<slug>/phase-N` (and a detached one) is **not** selected by the
  `war/<slug>/p<N>-` branch-prefix filter; `git branch -D` of a checked-out branch is **refused**
  and a `… || warn` wrapper **swallows** it (overall exit 0). Path-based reap
  (`git worktree remove --force` + `prune`) verified to reap both states.
- **Coverage / consistency / feasibility** — all pass: every spec section maps to a task, no
  name/signature drift or contradictions, step ordering sound (no step consumes a later output).
- **Anchors** — all hard citations correct: `land-decision.mjs:6` (HARD_ESCALATION_REASONS),
  `plugin.json:4`, `marketplace.json:7`/`:14`, README `## Status` @159–161 (0.5.1), and the
  workflow-template `~L197–204` / `~L271–273` / `~L298–300` agent() anchors.

## Findings

### Minor (genuine — both auto-fixed)
- **[Minor] Push-rejection classifier token.** Task 2 keyed classification on
  `non-fast-forward`/`[rejected]`. Reality (reproduced): the literal `non-fast-forward` is **not
  emitted** for the bare-SHA push refspec — only `[rejected]` is reliably present, and the bare-SHA
  form can intermittently report `src refspec … does not match any` instead of a clean rejection.
  **Resolution:** patched Task 2 to push a **named source** (`git push origin HEAD:refs/heads/<working>`,
  where `HEAD` in the detached `_refinery` *is* `<new-sha>`) and to classify strictly on the
  **`[rejected]`** token. (Corroborates the spec-verification's earlier "prefer a named source" note.)
- **[Minor] Reap command unspecified.** Task 3 said "reap by path" without naming the mechanism.
  **Resolution:** pinned it to `git worktree remove --force <path>` + `git worktree prune`
  (branch-agnostic; verified to reap both the on-integration and detached `_refinery`).

### Not defects (lens misfire — recorded, not patched)
The `claims-vs-reality` spine probe (16 findings) and `root-and-land-stale-sync` (4 of 5 findings)
flagged, as Critical/Major, that the plan's target code is *absent from the codebase today*
(`ensure-refinery-worktree` missing, `land_stale` not in the enum, versions not bumped, ADR absent,
…). These are **not defects** — they are the plan's *intended work*. Each was checked against its
task: all 16 map exactly to a task that creates precisely that artifact, and `coverage-vs-source`
independently confirmed every spec requirement maps to a task. The probe applied a present-tense
lens to a future-tense implementation plan. `root-and-land-stale-sync` itself concluded the
reconciliation is *"coherent … and sound"* and all three `land_stale` mirror sites exist today — its
`fail` status reflects only the "not-yet-implemented" mis-grade. No `needsDecision` holes surfaced.

## Resolutions applied (grill decisions)
- Classifier token + named-source push → patched **Task 2** (push command + step 2 classify).
- Branch-agnostic reap command → patched **Task 3** (reap bullet).
- *(No user grilling required: zero `needsDecision` holes; the two genuine findings were unambiguous
  Minor auto-fixes, consistent with the user's standing "I mostly defer" instruction.)*

## Gate output vs Lead adjudication
- **Mechanical gate:** `BLOCKED` — 17 Critical/Major (16 `claims-vs-reality` + 1
  `root-and-land-stale-sync` Critical), plus Majors that are the same "not-yet-built" class.
- **Lead adjudication:** `CLEARED-WITH-NOTES`. All "blockers" are confirmed-true facts about
  pre-implementation state, every one mapped to an explicit task and cross-confirmed by
  `coverage-vs-source`; they are not plan defects. The genuine output is two Minor hardening patches,
  now applied. Coverage was whole (8/8 probes on-target, none dropped), so the verdict is not
  `INCOMPLETE`.

## Residual risk
- **Probe sandbox escape (red-team harness hygiene — not a plan defect).** `git-mechanics-cas`
  self-disclosed that one stray git command escaped its sandbox (the Bash tool resets cwd between
  calls + an empty shell variable), running `git push origin :refs/heads/working` against the **real**
  `github.com:Ljferrer/WorkAuditRefine` remote and leaving `pp_out.txt`/`pp_err.txt` in the working
  tree. **Verified impact: zero** — the real remote now holds only `master` + the three legitimate
  `claude/*` branches (all at expected SHAs); the stray `working` ref was a sandbox placeholder that
  was created+deleted (net-zero), and the two litter files were removed. Mitigation for future runs:
  executed probes must use absolute sandbox paths and `git -C <sandbox>` for **every** git call,
  never relying on cwd persistence.
- **Prompt-enforced isolation (accepted, spec §10).** The Refinery's "never the main checkout"
  invariant is prompt + clean-surface-gate enforced, not hook-enforced (the scope hook fail-opens for
  `war-refiner`). Out of scope here; tracked as a conscious deviation in the plan's Notes.
