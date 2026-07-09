---
name: war-strategy
description: Two modes. Bare invoke loads the WAR-shaped spec/plan/roadmap templates and the code-boundary decomposition rule into the chat, then hands off to the installed authoring skills (grill-with-docs, domain-modeling). Invoked with an existing draft (spec, plan, roadmap, design doc) it reviews the artifact for war-shape gaps and converts it — war-strategy converts; /red-team validates and never converts. Use when the user is about to write a spec, plan, or roadmap for WAR, asks how a war-shaped plan should be structured, or brings an existing draft to review or convert to WAR shape.
---

# /war-strategy — the authoring primer & converter

Two modes, keyed on whether the invocation brings an artifact:

- **Bare invoke** — primer + handoff: print the templates and the rule below, then route authoring (§4).
- **With-artifact invoke** (the user brings a draft spec/plan/roadmap/design doc) — **review & convert**:
  run the war-shape gap review and conversion yourself (§4).

Honest boundary: this skill **never authors a spec from scratch** — deep from-scratch interviewing stays
with `grill-with-docs`.

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
## Commander's Intent              ← operator-authored; intent ceiling, plan floor
  - Purpose: <why — the operator's goal in one breath>
  - Method: <how — the approach and its judgment guardrails>
  - End state: <numbered list — each condition individually checkable>
## Build order (for /war)          ← the phase list, in DAG order
## Phase 1 — <name>
### Task 1: <name>
  - Files: <exact paths this task touches>
  - Plan slice: <what to implement>
  - requiresTest: true|false
  - requiresPackaging: true|false  ← default true; Lead may set false at decompose to skip the packaging floor
  - deps: [<task ids>]             ← wave edge: the worker rebases onto the merged dep (see the rule)
  - target repo: <superproject|submodule-path>
### Task 2: <name>  …
## Phase 2 — <name>  …
## Deferred validations (backstops)   ← required; ratify in /red-team; surfaced at every land
  - <check> · why deferred: <reason> · runner: <what executes it, when>   (or exactly: None)
## Notes / conscious deviations   (ratify in /red-team)
## Open decisions                 (resolved by /red-team)
```

**Backstop heading:** the operator-ratified form is `## Deferred validations (backstops)`. A plan authored
by `/war-machine --afk` has no operator to ratify, so its drafter uses the AI-declared variant
`## Deferred validations (backstops — AI-declared)` (ADR 0014 provenance rule) — the marker survives
extraction and every land-time surfacing renders it, never as operator-ratified.

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
2. **Dependency ⇒ wave edge.** If B imports/extends/calls A's new symbols, declare `deps: [A]` — B dispatches
   in a later **wave** of the **same phase**, and its worker's first action is a rebase onto the integration
   tip, so A's merged code is visible. Phase edges remain for what must be **landed** first — cross-repo
   (submodule content before its gitlink bump) and release. Every task still reaches a green gate
   **independently**, off its own dispatch base.
3. **One task = one repo.** A submodule content change + its superproject gitlink-bump are **two tasks in two
   phases** (`repo-per-phase`).
4. **Release = its own trailing phase.** The version bump touches shared slot files and must land last.

Heuristics: grep each task's file set — any overlap → merge the tasks or split across phases; *"add X"* +
*"call X from Y"* = **one phase, two waves** (declare `deps`); a cross-cutting rename touching N files =
**one task**, not N. Intra-phase `deps`/waves order *when* a worker runs **and** what base it sees — the
dep-wave worker rebases onto the integration tip and sees the merged dep's code; never use them to dodge a
same-file collision (same file → same task, waved or not). The same rule scales up: phases within a plan,
and plans within a roadmap (the shared-file-contention table is this rule applied across plans).

### Drift-guard coverage — two authoring rules

> **Mechanics (why):** a fact WAR duplicates across surfaces, or asserts in prose about a canonical code
> construct, rots silently unless a mechanical guard binds it to its canonical source by **extraction +
> equality** (the drift-guard discipline, ADR 0025). Carving work so the guard travels with the fact it
> guards is a plan-authoring duty, same footing as file-disjointness above.

5. **New mirror ⇒ its registry row, same task.** A task that lands a **new inline mirror** of a canonical
   export (a constant or helper hand-copied into `workflow-template.js` because the Workflow sandbox can't
   `import`) MUST also land its **mirror-registry row** in `workflow-template.test.mjs` in the **same task** —
   one row asserting the inline copy equals its canonical source. An **unguarded mirror is a plan defect**,
   never a follow-up: split the row into a later task and the mirror ships a phase naked. The registry grows
   by row, never by scanner (`// ponytail:` — the AST scanner is the rejected ceiling).
6. **Default-flip ⇒ enumerate every surface, assert OLD absent.** A task that flips a default or narrows a
   scope MUST **enumerate every doc surface** carrying the old value in its `Files:`, and its gate MUST assert
   the **OLD value absent** across all of them — asserting only the new value present is the recorded failure
   ([[default-flip-must-audit-all-doc-surfaces]]): a stale surface the new-present check never reads sails
   through green.

## 4. Handoff & convert

**Pipeline doctrine:** war-strategy **converts**; `/red-team` **validates** plans and never converts — route
conversion here, ratification there. This skill never authors a spec from scratch — deep from-scratch
interviewing stays with `grill-with-docs`.

### Bare invoke — handoff

Route the user to `/grill-with-docs` + `/domain-modeling` to author the spec/plan/roadmap from scratch, and
ship this **HANDOFF DIRECTIVE** with the route — the authoring skill executes it:

> **Intent interview:** draft the plan's `## Commander's Intent` block **only from the operator's answers**
> (Purpose / Method / numbered checkable End state — never invented), echo the drafted block back, and get an
> **explicit confirm** before moving on.

### With-artifact invoke — review & convert

1. **Gap review** against the templates + the rule (§2, §3): missing sections, same-file collisions,
   phase-edge violations, one-task-one-repo violations, release placement, **unguarded new mirrors and
   default-flips lacking an OLD-absent gate** (the two drift-guard rules in §3), and — at roadmap scale —
   plan count and landing order.
2. **Gap-driven interview:** one question at a time, **recommendation first** ("I recommend X because Y —
   accept?").
3. **Structural fixes** applied with the operator's confirmation.
4. **Given a SPEC:** author the war-shaped plan into `docs/plans/` yourself, running the intent echo-back
   **inline** (draft `## Commander's Intent` from the operator's answers, echo it back, explicit confirm)
   instead of shipping the directive.

## 5. Closing offer

Optionally point at `/survey-corps` — the pipeline's survey step: it inspects open issues, clusters
them, and synthesizes war-shaped specs into `docs/specs/`, optionally seeded by `ponytail-audit` or
`ecc:repo-scan` as *optional* seeds, never a hard dependency.
