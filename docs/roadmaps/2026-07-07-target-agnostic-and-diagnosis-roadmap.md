# Target-agnostic execution + diagnosis discipline — 2 plans

Survey manifest: `.claude/aot/2026-07-07-survey.json` (issues #574–#579). Both plans authored by `/war-machine` (interactive, operator-ratified intents) on 2026-07-07.

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [target-repo-agnostic-execution](../plans/2026-07-07-target-repo-agnostic-execution.md) | `skills/war/assets/` (war-config, provision-worktrees, assert-test-in-diff, assert-packaging-in-diff, workflow-template + tests), `agents/war-refiner.md`, `skills/war/references/schemas.md`, `skills/war/SKILL.md`, `skills/war-room/SKILL.md`, `docs/adr/0019-*`, `CONTEXT.md`, `CLAUDE.md`, release slots | v0.14.10 † | — |
| 2 | [diagnosis-preflight-self-confound-gate](../plans/2026-07-07-diagnosis-preflight-self-confound-gate.md) | `skills/red-team/` (SKILL, assets/workflow-scaffold.js, references/lenses.md, new diagnosis-preflight.test.sh), `agents/war-worker.md`, `agents/war-servitor.md`, `skills/war/SKILL.md`, `docs/adr/0020-*`, `CONTEXT.md`, `CLAUDE.md`, release slots | v0.14.11 † | 1 (entire plan, through its release) |

† Version literals are non-authoritative — resolve the next free patch from the four release slots at land time (lesson `stacked-release-plan-version-literal-lags-operator-target`).

## Dependency spine (strict landing order)

```
1 → 2
```

The edge is on plan 1 **in its entirety** (through its Phase 4 release), never interleaved: plan 2's `skills/war/SKILL.md` bullet is written to consume plan 1's `gate_failure_class` classifier, its ADR number resolves after plan 1 claims 0019, and its release patch resolves after plan 1's bump. The manifest's `dependsOn` hint is confirmed by the file footprints below.

## Shared-file contention

| File | Plans | Risk |
|------|-------|------|
| `skills/war/SKILL.md` | 1 (phases 2–3), 2 (phase 1) | Section-level collision in `## Invariants (never violate)`: plan 1 rewords existing bullets (baseline carve-out); plan 2 end-appends one bullet anchored on the heading. Serialized by the spine; plan 2's end-append rebases trivially. |
| `CONTEXT.md` | 1 (phase 3), 2 (phase 1) | Plan 1 adds terms to existing subsections; plan 2 adds a new `### Diagnosis discipline` subsection. Disjoint constructs, same file — spine serializes. |
| `CLAUDE.md` | 1 (phase 3), 2 (phase 1) | Plan 1 fixes the `docs/adr/` range to 0019; plan 2 bumps it to include its own ADR. Same token, strict order required. |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` | 1 (phase 4), 2 (phase 2) | Both trailing release phases touch all four version slots. Strict serial; each resolves its version from the slots at land time. |
| `docs/adr/` numbering | 1, 2 | Plan 1 claims 0019; plan 2 claims the next free number (0020 at authoring, non-authoritative). |

No other file is touched by both plans (plan 1 never touches `skills/red-team/`, `agents/war-worker.md`, or `agents/war-servitor.md`; plan 2 never touches `skills/war/assets/`, `agents/war-refiner.md`, `skills/war/references/schemas.md`, or `skills/war-room/SKILL.md`).
