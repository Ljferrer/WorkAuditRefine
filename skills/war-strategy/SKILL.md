---
name: war-strategy
description: Loads the WAR-shaped spec/plan/roadmap templates and the code-boundary decomposition rule into the chat, then hands off to the installed authoring skills (grill-with-docs, domain-modeling, or /red-team convert). Use when the user is about to write a spec, plan, or roadmap for WAR, or asks how a war-shaped plan should be structured.
---

# /war-strategy — the authoring primer

You print the templates and the rule below, then **hand off** — you do not run your own grilling loop.

## 1. Dependency check

Before handing off, run:

```sh
find -L ~/.claude/skills ~/.claude/plugins .claude/skills -maxdepth 6 -type d \
  \( -name grill-with-docs -o -name domain-modeling \) 2>/dev/null
```

`-L` because installed skills are routinely symlinks; `-maxdepth 6` because plugin-cache skills live at
`plugins/cache/<mkt>/<plugin>/<ver>/skills/<name>` (depth 6); `2>/dev/null` because missing roots (most repos
have no `.claude/skills`) error noisily. Judge emptiness on **stdout only — never the exit code**.

Empty stdout → print a warning (why this matters: WAR is only as good as the plan it executes — these skills
interview you down every decision branch until the plan is unambiguous and cleanly phase-decomposable) and
link to the README's [Grill Me install](https://github.com/mattpocock/skills/tree/main#quickstart-30-second-setup)
pro-tip — one link covers `grill-with-docs`, `grilling`, and `domain-modeling`.

## 2. The three templates

### Spec template

```
# <Title — the change in one line>
## 1. Context — the gap / problem
## 2. Pivotal constraints
## 3. Resolved design tree        (table: decision → resolution)
## 4. Mechanics                   (per component/role)
## 5. Surface changes             (files touched)
## 6. New domain terms (CONTEXT.md)
## 7. Recommended ADRs
## 8. Open risks / implementation notes
## 9. Non-goals / deferred
## 10. Validation criteria        (concrete, testable)
```

### Plan template

```
# <Title>
## Build order (for /war)          ← the phase list, in DAG order
## Phase 1 — <name>
### Task 1: <name>
  - Files: <exact paths this task touches>
  - Plan slice: <what to implement>
  - requiresTest: true|false
  - deps: [<task ids>]             ← intra-phase ordering only (see the rule)
  - target repo: <superproject|submodule-path>
### Task 2: <name>  …
## Phase 2 — <name>  …
## Notes / conscious deviations   (ratify in /red-team)
## Open decisions                 (resolved by /red-team)
```

### Roadmap template

```
# <Title> — <N> plans
| # | Plan | Files owned | Ver | Depends on |
| 1 | [<slug>](../plans/<file>.md) | <file family> | v0.x.y | — |
## Dependency spine (strict landing order)   ← ASCII: 1 → 2 → 5 → …
## Shared-file contention                     ← table: file → plans → risk
```

**Rev 1 note:** the roadmap is authoring input + an on-demand committable snapshot of a campaign — it is
**never** the live queue. The live queue is the campaign ledger (`/war-campaign`'s
`assets/campaign-ledger.mjs`), which is uncommitted and multi-writer-safe via an `inbox/` drop-dir.

## 3. The code-boundary decomposition rule

> **Mechanics (why):** at phase start the refiner cuts every task worktree off one **frozen** integration tip;
> workers run concurrently; the refiner rebases each approved task onto the **advancing** tip and merges
> serially. Two consequences bind how you carve work.

1. **Parallel ⇒ file-disjoint.** Tasks in one phase must touch **disjoint file sets** — two tasks editing the
   same file rebase-conflict at the serial merge. One file / cohesive unit → one task.
2. **Dependency ⇒ phase edge.** A worktree is frozen at the phase-start tip, so a task **cannot see a sibling's
   new code.** If B imports/extends/calls A's new symbols, B goes in a **later phase** depending on A's. Every
   task must reach a green gate **independently**, off the start tip.
3. **One task = one repo.** A submodule content change + its superproject gitlink-bump are **two tasks in two
   phases** (`repo-per-phase`).
4. **Release = its own trailing phase.** The version bump touches shared slot files and must land last.

Heuristics: grep each task's file set — any overlap → merge the tasks or split across phases; *"add X"* +
*"call X from Y"* = **two phases**; a cross-cutting rename touching N files = **one task**, not N. Intra-phase
`deps`/waves order *when* a worker runs, **not** what base it sees — don't use them for code visibility or to
dodge a same-file collision. The same rule scales up: phases within a plan, and plans within a roadmap (the
shared-file-contention table is this rule applied across plans).

## 4. Handoff

Route the user to `/grill-with-docs` + `/domain-modeling` (or `/red-team convert` to turn an existing design
doc into a plan) to actually author the spec/plan/roadmap. This skill runs **no grilling loop of its own**.

## 5. Closing offer

Optionally point at the real README Pro-Tip pattern: spin up a workflow to inspect open issues, cluster them,
and synthesize war-shaped specs into `docs/specs/` — optionally seeded by `ponytail-audit` or `ecc:repo-scan`
as *optional* seeds, never a hard dependency (**not** `/improve-codebase-architecture` — it isn't part of the
recommended install set and isn't portable across machines).
