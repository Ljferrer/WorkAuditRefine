# Run-lifecycle robustness + servitor write path + fail-loud ingest — 3 plans

Survey manifest: `.claude/aot/2026-07-08-survey.json` (issues #582–#587). All plans authored by `/war-machine` (interactive, operator-ratified intents) on 2026-07-08, grounded on master `2f6250d` (v0.14.10).

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [war-run-lifecycle-robustness](../plans/2026-07-08-war-run-lifecycle-robustness.md) | `skills/war/assets/` (workflow-template + test, war-config.test), `agents/war-refiner.md`, `skills/war/SKILL.md`, `skills/war/references/` (schemas, design), `CONTEXT.md`, `CLAUDE.md`, `docs/adr/0020-*` (floats), release slots | v0.14.11 † | — |
| 2 | [servitor-learnings-write-path](../plans/2026-07-08-servitor-learnings-write-path.md) | `skills/war/assets/` (workflow-template + test, provision-worktrees + test, war-config.test), `agents/war-servitor.md`, `hooks/validate-worktree-scope.*`, `hooks/validate-servitor-provenance.*`, `skills/war/SKILL.md`, `skills/war/references/` (schemas, design), `CONTEXT.md`, `CLAUDE.md`, `docs/adr/0021-*` (floats), release slots | v0.14.12 † | 1 (entire plan, landed first) |
| 3 | [fail-loud-ingest-boundaries](../plans/2026-07-08-fail-loud-ingest-boundaries.md) | `skills/war-campaign/assets/` (campaign-ledger + test), `skills/red-team/` (red-team-gate + test, SKILL.md step 4), release slots | v0.14.13 † | — (release-slot serialization only) |

† Version literals are non-authoritative — resolve the next free patch from the four slots at land time (lesson `stacked-release-plan-version-literal-lags-operator-target`).

## Dependency spine (strict landing order)

```
1 → 2
3 (free — no content edge; only the trailing release phases serialize)
```

The 1 → 2 edge is on plan 1 **in its entirety** (through its release), never interleaved: plan 2's anchors are grounded against plan 1's end state — the `p3-*` phase-scoped fixture paths and ENV_OUTCOME harness in `workflow-template.test.mjs`, adjacent doc-lock blocks in `war-config.test.mjs`, and an ADR number that resolves after plan 1 claims its own. Plan 3 shares no content file with either sibling; its queue position is free and only its release phase must land serially (the four version slots).

**External precondition (no edge, rebase-mechanical):** [diagnosis-preflight-self-confound-gate](../plans/2026-07-07-diagnosis-preflight-self-confound-gate.md) is merged but **unexecuted**. It appends one sentence to `agents/war-servitor.md`'s D3 block (plan 2 deliberately avoids D3) and inserts a new `skills/red-team/SKILL.md` section between `## Backstop-legitimacy check` and `## Invariants (never violate)` (plan 3 edits only step 4 in `## Steps`; it never touches `red-team-gate.mjs`). Recommended order: execute that campaign first; in either order the collisions are disjoint-construct rebases, never semantic.

## Shared-file contention

| File | Plans | Risk |
|------|-------|------|
| `skills/war/assets/workflow-template.js` + `workflow-template.test.mjs` | 1, 2 | Disjoint constructs — 1: `provisionStep` evidence gate, `taskWorktree`/`polishWorktree` keying, entry validation, ENV_OUTCOME dispatches; 2: Wrap-up gate + `memoryLocalRoot` threading. Spine serializes; plan 2 writes against plan 1's end state. |
| `skills/war/SKILL.md` | 1, 2 | 1: launch step, `env-blocked`/`held:workflow-error` bullets, recovery-relaunch subsection; 2: Setup step 4, Gate 2 promotion + heals, sweep bullets. Disjoint sections; spine serializes. |
| `skills/war/assets/war-config.test.mjs` | 1, 2 | Both append doc-contract locks (additive blocks); spine serializes. |
| `skills/war/references/schemas.md` | 1, 2 | 1: provisioning-args rows + ENV_OUTCOME contract; 2: ServitorResult scope paragraph. Disjoint constructs. |
| `skills/war/references/design.md` | 1, 2 | 1: `p<N>-polish` rename; 2: servitor role bullet. Disjoint. |
| `CONTEXT.md` | 1, 2 | Term additions in different sections. |
| `CLAUDE.md` | 1, 2 | ADR-range literal bumped twice (strict order) + 2's servitor guard sentence. |
| `docs/adr/` numbering | 1, 2 | 1 claims the next free number (0020 at authoring); 2 takes the one after; both float. Plan 3 adds no ADR. |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` | 1, 2, 3 | All trailing release phases touch the four version slots. Strict serial; each resolves its version from the slots at land time. |
| `agents/war-servitor.md` | 2 + external diagnosis-preflight | D3 append vs plan 2's non-D3 edits — rebase-mechanical, token-disjoint (verified: plan 2's absence assertions cannot be perturbed by the D3 sentence). |
| `skills/red-team/SKILL.md` | 3 + external diagnosis-preflight | Step 4 (`## Steps`) vs a new section elsewhere — disjoint constructs; adjacency only, no edge. |

No other file is touched by two plans: plan 3's subsystems (`skills/war-campaign/`, `skills/red-team/`) are disjoint from plans 1–2's (`skills/war/`, `agents/`, `hooks/`).
