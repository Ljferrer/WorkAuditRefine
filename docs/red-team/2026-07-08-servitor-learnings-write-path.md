# Red-team — 2026-07-08-servitor-learnings-write-path

**Verdict: CLEARED-WITH-NOTES** (no patch round needed for blockers; 2 Minor stale-literals auto-fixed).
Source spec: `docs/specs/2026-07-08-servitor-learnings-write-path-design.md`.
Repo: superproject, verified against `dev/2026-07-08-servitor-learnings-write-path` @77e11f5 (stacked on the landed sibling). Run: `wf_f1d0930d-eff` (10 probes, 10 agents, 0 errors).

## Attack surface

6 spine lenses + 4 bespoke probes (`anchor-check:existing-constructs`, `baseline-green`, `backstop-legitimacy`, `sibling-grounding`). Coverage whole: 10/10 on-target, 0 off-target, 0 dropped. Executed proof: 2 (`executable-proof`, `baseline-green` — both ran in throwaway sandboxes).

## Findings

**9/10 probes pass clean.** The single `warn` (`sibling-grounding`) surfaced 2 **Minor** stale-literals — the same stale-grounding class the sibling plan hit, all plainly hedged non-authoritative in the plan:

1. **Minor (CONFIRMED)** — Task 5 Files named the new ADR literally `docs/adr/0021-servitor-…`; `0021-run-lifecycle-provision-contract.md` (the landed sibling's) already occupies 0021 → next free is **0022**.
2. **Minor (CONFIRMED)** — Phase-2 version literal `0.14.10 at authoring`; all four live slots read 0.14.12 (sibling's release) → next free **0.14.13**.

`sibling-grounding` also confirmed clean: the CLAUDE.md `docs/adr/` range is already correctly hedged (anchor-by-text, resolve-at-time); the diagnosis-preflight D3 append is present in `agents/war-servitor.md` and disjoint from this plan's edits (no `phase-<N>.md` / else-append tokens to perturb this plan's absence assertions); `workflow-template.test.mjs` fixtures already carry the sibling's phase-scoped `p<N>-` worktree paths.

**Pass:** `claims-vs-reality`, `coverage-vs-source` (spec fully mapped), `consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan` (End-state 1–8 individually checkable, claimed, sufficient), `anchor-check:existing-constructs` (all named constructs present verbatim — `cmd_ensure_refinery_worktree`, `workerSelfQueryRepoFlag`, servitor Wrap-up dispatch, `*war-servitor*` case with both globs, `MEMORY.md` basename exemption, `readDoc` + the three Gate-2 locks, design.md either/or, schemas.md glob pair, war-servitor.md D1/D2/Routing/Never), `baseline-green` (workflow-template + war-config JS suites and the three touched shell suites all green at baseline), `backstop-legitimacy` (all 6 entries justified, non-overlapping with pre-merge gates/floors, runner + timing named).

## Resolutions applied

Patched plan literals on `dev/2026-07-08-servitor-learnings-write-path` @`c91599f`: new ADR **0022**; version note resolved to **0.14.13** (still hedged resolve-at-land). Pushed.

## Residual risk

None blocking. Six plan-declared backstops carried forward (live end-to-end publication; personal-memory immutability sweep; working-branch hygiene; untagged-file migration stamping pass; files_written absolute-path assertion executes; escalated-push leak + heal) — all genuinely non-unit-testable, runner + timing named, legitimacy-checked.
