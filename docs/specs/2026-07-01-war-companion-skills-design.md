# WAR companion skills — `/war-help`, `/war-strategy`, `/war-campaign`

Three new skills that make WAR self-teaching and self-driving: an orientation card, an authoring primer for
war-shaped docs, and an autonomous multi-plan campaign runner. Designed together in one `/grill-with-docs`
session; they share a domain vocabulary (below) and a single organizing boundary (**reference vs. generative
vs. operational**). This spec is the design of record; the runnable surface will be `skills/war-help/`,
`skills/war-strategy/`, `skills/war-campaign/`.

## 1. Context — the three gaps

WAR today ships four skills (`/war`, `/war-room`, `/red-team`, `/lessons-learned`) and rich reference docs
(`README.md`, `skills/war/references/design.md`, `CONTEXT.md`). But three things a new or returning operator
needs have no home:

1. **Orientation.** "What is WAR, what are the roles, what's the command trilogy?" lives scattered across the
   README and `SKILL.md`. There's no one-shot in-chat card.
2. **Authoring shape.** WAR is only as good as the plan it executes, and a war-shaped plan has a *specific*
   shape (phases/tasks carved along code boundaries). That shape is implicit in `docs/plans/` examples and
   scattered memories — never written down as a template the chat can work *from*.
3. **Running many plans.** The overnight "hopper" (a `/loop` over `/red-team` + `/war --afk --ace` mediated by
   a roadmap file) is a real, high-value workflow the author runs by hand — with error-prone branch stacking
   that memory shows has bitten real runs. Nothing automates it.

Each gap is a *different kind* of help, which is why this is three skills, not one card.

## 2. Pivotal constraints

- **In-chat output must be self-contained** — a skill's value is what it prints; it can't assume the user opens
  files. But **duplicating README/`SKILL.md`/`CONTEXT.md` creates a drift surface** (this repo has a long
  memory of mirrored-value drift bugs). Resolution: the cards **link out** for anything canonical and only
  *author new* content that exists nowhere else (the templates, the decomposition rule).
- **Dependency-free.** WAR is a portable, dependency-free plugin (`lessons-learned` bundles its own
  `safe-swap.sh` rather than depending on anything). The new skills must not hard-depend on ECC or Matt
  Pocock's skills — they may *link* to install instructions, or *bundle* behavior.
- **`/war-campaign` is a big outward-facing action** — it pushes branches, opens PRs, files issues, unattended.
  It must never auto-trigger and must fail safe (halt-and-hold).
- **The scale-free rule.** [Code-boundary decomposition](#8-new-domain-terms-contextmd--landed-this-session)
  governs task→task, phase→phase, *and* plan→plan. `/war-strategy` teaches it once; `/war-campaign` enforces
  its top scale (the roadmap).

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| 1 | One skill or many? | **Three**, cut on **reference / generative / operational** |
| 2 | `/war-help` shape | Static curated card (`/ponytail-help`-shaped); links out, doesn't restate |
| 3 | `/war-strategy` shape | Static **primer + handoff** — templates + the rule, then route to existing authoring skills; **not** its own grilling engine |
| 4 | Dedup strategy | Cards are a **map**, not a copy; canonical facts link to README/`design.md`/`CONTEXT.md` |
| 5 | Authoring-dep check | `/war-strategy` verifies `grill-with-docs` + `domain-modeling` are installed; if absent, warn + link to README's Grill Me install |
| 6 | Closing offer target | Real README **Pro-Tip** pattern (workflow → inspect issues → synthesize specs); **not** the non-existent `/improve-codebase-architecture` |
| 7 | `/war-campaign` exists? | Yes — a third **operational** skill (the hopper), distinct from help/strategy |
| 8 | Campaign branch model | **Stack-and-plow, stacked PR targets** (default); `--wait-for-merge` = base-off-master (Mode A). [ADR 0011](../adr/0011-campaign-stack-and-plow-branch-model.md) |
| 9 | Campaign survival | **Resumable re-entry** — roadmap = authored index; runtime progress in an **uncommitted campaign ledger**; `strategic-compact` behavior **bundled**, not ECC-dependent |
| 10 | Campaign failure | **Halt-and-hold** on any plan that can't CLEAR (`/red-team`) or doesn't fully land (`/war`); defer `--keep-going` (YAGNI) |
| 11 | Campaign feed | **Re-read the roadmap every plan boundary** (`git fetch` + read); git is the transport; reconcile shared-doc drift via `merge --theirs` only when needed |
| 12 | Auto-invocation | help/strategy **allowed**; campaign **`disable-model-invocation: true`** |
| 13 | Deliverable | One design spec (this file) + ADR 0011; execution = one plan (3 skill phases + release phase) |

## 4. The three skills at a glance

| Skill | Answers | When invoked | Nature | Auto-invoke |
|-------|---------|--------------|--------|-------------|
| `/war-help` | "What is WAR? How do I run it?" | new / confused | static reference card | yes |
| `/war-strategy` | "Help me author a war-shaped spec/plan/roadmap." | about to write a doc | static primer + handoff | yes |
| `/war-campaign` | "Run this sequence of plans unattended." | starting an overnight run | operational orchestrator | **no** |

They form a pipeline: `/war-strategy` teaches you to write the roadmap → `/war-campaign` executes it →
`/war-help` orients newcomers to the whole thing and points at the other two.

## 5. `/war-help` — the orientation card

A `/ponytail-help`-shaped static card. Sections:

1. **One-liner** — WAR = Work·Audit·Refine; a phase-gated, multi-agent executor for a multi-phase plan.
2. **Commands** (compact table) — the trilogy `/war-room` (configure) → `/red-team` (harden) → `/war`
   (execute), plus `/lessons-learned` (tidy memory), `/war-strategy` (author a plan), `/war-help` (this).
3. **Roles** (one line each) — Lead · Worker · Auditor · Refiner · Servitor.
4. **How a run flows** (5 beats) — decompose+approve → work → audit → refine+land per phase → one PR.
5. **Prerequisites** — clean tree, `gh` auth, a detected gate.
6. **Footer — go deeper.** Offers three live deep-dives — *"how does auditing work in detail?"*,
   *"how do I run a hopper of plans in one chat?"* (→ **`/war-campaign`**), *"what do the roles hand off?"* —
   plus the handoff line *"Ready to write a plan? Run `/war-strategy`."* and links to `README.md` +
   `references/design.md`.

**Dedup rule:** every factual claim links to the canonical doc rather than restating it; the card is a map.
No runtime logic (keeps it a pure card).

## 6. `/war-strategy` — the authoring primer

Static primer that loads the WAR-shaped templates + the decomposition rule into the chat, then **hands off to
the existing authoring skills** (it does not run its own grilling loop — `/grill-with-docs`, `/domain-modeling`,
and `/red-team convert` already do that well).

### 6.1 Dependency check (on handoff)

Before routing to the authoring skills, run:

```sh
find ~/.claude/skills ~/.claude/plugins .claude/skills -maxdepth 4 -type d \
  \( -name grill-with-docs -o -name domain-modeling \) 2>/dev/null
```

Empty → print a warning: *why* they matter (WAR is only as good as its plan; these interview you down every
decision branch until it's unambiguous and cleanly phase-decomposable) + link to the README's **Grill Me**
install (one link covers `grill-with-docs`, `grilling`, and `domain-modeling` — all from `mattpocock/skills`).

### 6.2 The three templates (the core value)

**Spec template** (house design-spec format):

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

**Plan template** (what `/war` decomposes):

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

**Roadmap template** (what `/war-campaign` executes — a meta-plan indexing plans):

```
# <Title> — <N> plans
| # | Plan | Files owned | Ver | Depends on |
| 1 | [<slug>](../plans/<file>.md) | <file family> | v0.x.y | — |
## Dependency spine (strict landing order)   ← ASCII: 1 → 2 → 5 → …
## Shared-file contention                     ← table: file → plans → risk
```

### 6.3 The code-boundary decomposition rule (the headline)

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
*"call X from Y"* = **two phases**; a cross-cutting rename touching N files = **one task**, not N. Footnote:
intra-phase `deps`/waves order *when* a worker runs (and gate failed-deps), **not** what base it sees — don't
use them for code visibility or to dodge a same-file collision. **The same rule scales up:** phases within a
plan, and plans within a roadmap (the shared-file-contention table is this rule across plans).

### 6.4 Closing offer

Point at the real README **Pro-Tip** pattern — spin up a workflow to inspect open issues, cluster them, and
synthesize war-shaped specs into `docs/specs/` — optionally seeded by `ponytail-audit` / `ecc:repo-scan`.
(**Not** `/improve-codebase-architecture`, which does not exist.)

## 7. `/war-campaign` — the hopper

Executes a roadmap of plans unattended. Invocation:

```
/war-campaign <plan…|roadmap-path> [--wait-for-merge]
```

Takes either an explicit plan list (creates/updates the roadmap) or an existing roadmap path. Passes
`--afk --ace` to `/war` by default.

### 7.1 Lifecycle (per plan, in roadmap order)

1. **Sync + select.** `git fetch origin`, re-read the roadmap, pick the next un-done plan (progress from the
   campaign ledger).
2. **Provision the branch (stack-and-plow — [ADR 0011](../adr/0011-campaign-stack-and-plow-branch-model.md)).**
   Plan 1: `dev/<slug-1>` off fresh `origin/master`. Plan N: `dev/<slug-N>` off `dev/<slug-(N-1)>`'s tip.
   `--wait-for-merge` → wait for PR N-1 to merge, base off fresh `origin/master`.
3. **Harden.** `/red-team <plan>` (self-adjudicates under AFK; halt-and-hold if unresolvable).
4. **Execute.** `/war <plan> --working dev/<slug-N> --landing dev/<slug-(N-1)> --afk --ace`
   (plan 1 lands to `master`).
5. **Record.** Write outcome (branch / PR# / landed SHA / status) to the campaign ledger; check the plan off.
6. **Context hygiene.** Bundled **checkpoint-and-compact** at the boundary (flush ledger → built-in `/compact`).
7. **Loop.** Next plan.

### 7.2 State & resume (feature #5, done by architecture)

- **Roadmap** = clean authored index (the plan list + order + contention). Not churned with runtime status.
- **Campaign ledger** = uncommitted per-run state (`.claude/campaigns/<id>/`, mirroring `/war`'s
  `.claude/teams/<run>/`): per-plan status, branch, PR#, SHA, stop point.
- **Resume** re-reads roadmap + ledger and continues — the real guarantee. `strategic-compact` behavior is
  **bundled** (no ECC dependency); if the window still fills mid-plan, `/clear` + re-invoke resumes.

### 7.3 Failure & feed

- **Halt-and-hold** when a plan can't CLEAR `/red-team` (truly unresolvable in AFK) or `/war` hard-halts
  (audit-blocked, conflict, dead phase, `land_stale`, `held:submodule-pr`). Checkpoint → record stop point →
  `PushNotification` → stop. Everything below the failed plan already landed as stacked PRs.
- **Live feed** — re-read the roadmap each boundary; a second chat appends rows + merges to master and the
  campaign picks them up. Reconcile shared-doc drift via `merge --theirs`-on-docs only when a fetch shows
  master advanced under the stack base (memory `stacked-pr-shared-doc-conflict-fix-merge-theirs`).

## 8. New domain terms (CONTEXT.md) — landed this session

Four terms were added to `CONTEXT.md` during this grill:

- **Frozen phase base** — the single integration tip every task worktree in a phase is cut from; `deps`/waves
  order *when* a worker runs, never *what base it sees*.
- **Code-boundary decomposition** — the authoring rule of §6.3, forced by the frozen base + serial merge.
- **Roadmap** — the ordered index of plans (dependency spine + shared-file contention); code-boundary
  decomposition across plans.
- **Hopper** — the autonomous loop executing a roadmap via `/war-campaign` (stack-and-plow default;
  `--wait-for-merge` = base-off-master; live-appendable).

## 9. Recommended ADRs

- **[ADR 0011 — Campaign stack-and-plow branch model](../adr/0011-campaign-stack-and-plow-branch-model.md)**
  (written this session): why the campaign stacks and points each PR at the prior plan's branch, the
  `--wait-for-merge` alternative, and halt-and-hold. Clears the bar (surprising + real trade-off + moderately
  hard to reverse). No other decision here is ADR-worthy — the help/strategy shapes are easily reversible.

## 10. Open risks / implementation notes

- **Programmatic self-`/compact` may be limited.** The harness doesn't guarantee a skill can compact its own
  window under a hard ceiling. Mitigation baked in: **resume is the guarantee, compaction is best-effort.**
- **GitHub PR retarget-on-delete** is the mechanism the bottom-up merge relies on. Verify it in `/red-team`
  (it's standard behavior, but the campaign's final report should still spell out the exact merge order).
- **Roadmap creation from a bare plan list** must apply the contention analysis (§6.2) — otherwise it emits a
  spine that lets same-file plans run non-serially. The create path should refuse to leave two shared-file
  plans unordered.
- **Do not restate canonical content** in the cards — CI-free drift risk. If a card must mention a fact that
  lives in README/`design.md`, link it.

## 11. Non-goals / deferred

- `--keep-going` / independent-lane continuation past a failed plan (needs dependency-spine reasoning; YAGNI
  until a real run is bottlenecked).
- A background poller for stacked-PR merges (the human merges bottom-up; no watcher).
- ECC-`strategic-compact` detection/preference (bundle our own, stay flat).
- `/improve-codebase-architecture` (referenced in early discussion; does not exist — use the README Pro-Tip
  pattern). If ever built, it's a separate skill, out of scope here.
- Building a new grilling engine in `/war-strategy` (it hands off to existing skills).

## 12. Validation criteria

- `/war-help` prints the six sections; every canonical fact is a link, not a restatement; footer names
  `/war-strategy` and `/war-campaign`.
- `/war-strategy` prints all three templates + the code-boundary rule; runs the dependency check and warns
  with a working install link when `grill-with-docs`/`domain-modeling` are absent.
- `/war-campaign` is `disable-model-invocation: true`; never auto-triggers.
- A campaign over a 2-plan roadmap in AFK produces `dev/<slug-1>` (PR → master) and `dev/<slug-2>` based on
  `dev/<slug-1>` (PR → `dev/<slug-1>`); the final report states the bottom-up merge order.
- Killing a campaign mid-run and re-invoking it resumes from the campaign ledger without re-running landed
  plans.
- A plan that can't CLEAR `/red-team` or hard-halts `/war` holds the campaign; no plan above it starts.
- No new runtime dependency: `grep -r "strategic-compact\|ecc:" skills/war-campaign` finds only the *bundled*
  routine, no external invocation.
- Release phase bumps all four version slots together; the three skill dirs are added to `plugin.json`.
