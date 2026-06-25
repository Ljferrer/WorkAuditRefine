# Worktree / Sandbox Provisioning — Design

**Status:** proposed (targets **v0.5.0** — a new capability spanning `/war` + `/red-team` + the config schema; confirm vs a smaller v0.4.3). Spec of record for making the isolated worktrees/sandboxes that WAR workers and red-team executed-probes run in **gate-ready** by deriving each repo's bootstrap **from that repo's own declared setup** — not from ecosystem rules baked into the plugin.

Affected surface: the WAR worker provisioning in [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js), the config schema [`skills/war/assets/war-config.mjs`](../../skills/war/assets/war-config.mjs), the red-team sandbox creation in [`skills/red-team/assets/workflow-scaffold.js`](../../skills/red-team/assets/workflow-scaffold.js), the runbooks [`skills/war/SKILL.md`](../../skills/war/SKILL.md) / [`skills/war-room/SKILL.md`](../../skills/war-room/SKILL.md) / [`skills/red-team/SKILL.md`](../../skills/red-team/SKILL.md), and a new setup-scout + a thin validator `skills/_shared/provision.mjs`.

## 1. Problem — fresh worktrees are not gate-ready (observed 2026-06-25)

Both flagship skills create an **isolated copy of the repo** and immediately expect to run the project's gate in it:

- **`/war`** — each worker is told (template, [`workflow-template.js:114`](../../skills/war/assets/workflow-template.js)): *"Create a git worktree at `<path>` on branch `<branch>` cut from the tip of `<integrationBranch>`; … cd there; work only inside it. Gate: `<gate>`."* That is a bare `git worktree add`.
- **`/red-team`** — every `executed` probe's scope-lock says *"first copy the repo into a throwaway sandbox (`cp -R <repo> <tmp>` or `git -C <repo> worktree add <tmp>`) and `cd` into that copy."* Same bare worktree/copy.

Neither does any **provisioning** beyond the checkout, and — critically — neither has any way to know what *this* repo needs to become gate-ready. For any repo whose checkout is not self-sufficient, the gate cannot run: git submodules (a bare `git worktree add` leaves them empty), monorepo install, codegen, a vendored package that must be built, `.env` materialization, and so on. What that list contains is **repo-specific**.

**Concrete incident (2026-06-25).** Red-teaming an external pnpm+turbo monorepo (Otto) whose `apps/engine` depends on a **private git submodule** (`@sequoiaport/llm-workspace`, a workspace package): the executed baseline probe **proved `@otto/db` (76 tests) and `@otto/contract` (60) green on pglite**, but **could not run `pnpm --filter @otto/engine test` or full `pnpm test`** — `pnpm install` aborted with `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` because the fresh worktree's `vendor/llm-workspace` was uninitialized. The probe (correctly, by hand) downgraded this to an *environment gap → warn*, not a red baseline — but it left a real acceptance unproven, and a `/war` worker building those phases would have hit the identical wall.

**The trap to avoid.** The obvious fix — teach the plugin to detect `.gitmodules` and run `git submodule update --init`, detect `pnpm-lock.yaml` and run `pnpm install`, and so on — just relocates the hard-coding. It bakes a fixed table of ecosystem heuristics into work-audit-refine that must grow forever (poetry, cargo, gradle, bundler, go workspaces, nix, devcontainers…) and still won't match a given repo's actual conventions. **The provisioning a worktree needs is a property of the target repo, so it must be read from the target repo — not from the plugin.**

**Today's only lever is also the wrong one.** The config exposes no setup/provision field ([`war-config.mjs`](../../skills/war/assets/war-config.mjs) has only `agents`, `audit`, `run`, `overrides.{gate,workingBranch,landingBranch,learningsTarget}`). The single place provisioning *could* be smuggled is `overrides.gate` — but the gate is **one string for all phases**, whereas a real plan's gate is per-phase (`pnpm --filter <changed-pkg> test`, filter varying by phase, final phase = full suite). Folding setup into the gate breaks that fidelity and conflates *provision* with *verify*.

## 2. Goal / Non-goals

**Goal.** A fresh WAR worker worktree and a fresh red-team executed-probe sandbox are made gate-ready by **provisioning steps derived from the target repo's own declared setup**. work-audit-refine carries **no ecosystem-specific knowledge**: a repo in an ecosystem the plugin has never seen still provisions correctly. A provisioning failure is reported **distinctly from a gate/baseline failure** — never mistaken for "the code is broken."

**Non-goals.**
- Replacing the worker's own `install → green` loop. Provisioning covers the **pre-install** steps a bare checkout lacks; the worker still installs and drives the gate green.
- A general remote-CI provisioner. Scope is local worktrees/sandboxes that share the superproject's object store.
- Changing the audit/grill/merge semantics of either skill.

## 3. Design — derive contextually once, pin, then run deterministically

The design separates a **contextual (fuzzy, one-time) derivation** from **deterministic (verbatim, every-time) execution**, which keeps the repo-specific intelligence out of the plugin while preserving the project's "tested deterministic module" value for everything downstream.

### 3.1 Derive — a setup-scout reads *this repo's* bootstrap contract
During Setup (before any worker/probe spawns), a **read-only setup-scout** (an `Explore`-class agent — the natural fit, since both skills are already agent-driven) inspects the target repo and emits an ordered list of shell commands that take a bare checkout to gate-ready, plus a one-line rationale and a `source` tag. It consults, in **descending authority**:

1. **Explicit operator intent** — `run.provision` already set in the config, or a committed repo manifest (see 3.6). Authoritative; the scout stops here.
2. **The repo's CI** — `.github/workflows/*.yml` (or other CI) already encodes exactly how a clean machine goes from checkout to tests: `actions/checkout` with `submodules: recursive`, the install command, any codegen/build that precedes the test job. This is the most authoritative *existing* signal — it's what the maintainers actually run. The scout extracts the pre-test setup steps.
3. **Dev-onboarding declarations** — `.devcontainer/devcontainer.json` (`postCreateCommand`/`onCreateCommand`), a `Makefile`/`Justfile` `setup`/`bootstrap` target, `package.json` `scripts.{setup,bootstrap,prepare}`, or a `CONTRIBUTING.md` / `README` "Development setup" section.
4. **Structural fallback** — only when 1–3 are silent: generic, ecosystem-agnostic signals (`.gitmodules` → `git submodule update --init --recursive`; a lockfile → its matching install). This is the floor, kept deliberately tiny, **not** the design centerpiece.

The submodule step in the 2026-06-25 incident is reached at level 2 or 4 — because the scout *read Otto's* `.gitmodules`/CI — never because the plugin special-cases submodules. A Rust or Bazel repo provisions from *its* CI/Makefile with the same machinery and zero plugin change.

### 3.2 Pin — freeze the derived list into the config
The scout's output is written to a new **`run.provision: string[]`** (with `provisionSource` + rationale for transparency), owned/validated by `war-config.mjs` and reviewable/editable by the operator. Derivation (fuzzy, one-time) is thus decoupled from use: the list becomes a deterministic, inspectable artifact.

### 3.3 Run — every worktree executes the pinned list verbatim, before the gate
- **WAR worker** ([`workflow-template.js`](../../skills/war/assets/workflow-template.js)): after `git worktree add`, `cd`, and **before** install/gate, run each `provision` command in order. Idempotent by contract (safe across FIX rounds in the same worktree).
- **red-team executed-probe** ([`workflow-scaffold.js`](../../skills/red-team/assets/workflow-scaffold.js)): the scope-lock gains "after creating the sandbox, run the provisioning commands `<list>`." The Lead passes the resolved list in like the fingerprint, so a repo scouted once provisions identically for both skills.

*Git mechanics design note (the common case):* `git worktree add` deliberately leaves submodules unpopulated. Because linked worktrees **share** the superproject's `$GIT_COMMON_DIR` (config + `modules/<name>` object store), once the main checkout has fetched a submodule the worktree's `submodule update --init` is **offline and instant — no remote, no credentials**; network + auth are needed only for the first cold fetch (CI supplies them).

### 3.4 Provisioning failure is its own outcome (not a red gate)
Provisioning runs *before* the worker touches code, so a failure is an **environment** problem. Codify what the 2026-06-25 probe did by hand:
- **WAR worker**: a provisioning failure returns a distinct `env-blocked` verdict (worker schema gains it) — "task blocked: environment — `<cmd>` failed" — not an audit/gate red; the Lead halts the task instead of burning FIX rounds.
- **red-team probe**: maps to `status:"warn"` with an env-gap note (the FINDINGS schema already has `warn`), so the gate never scores it as a `fail`/red baseline.

### 3.5 `/war-room` shows the derived list
`/war-room` Setup runs the scout, shows the proposed `provision` + its `source` + rationale (*"From `.github/workflows/ci.yml`: `git submodule update --init --recursive`, `pnpm install --frozen-lockfile`. Accept / edit / replace?"*), and writes the confirmed list into `config.json`.

### 3.6 Optional deeper layer — a committed repo manifest
The cleanest long-term source is the repo declaring its own bootstrap once in a committed file both skills read (level 1 above, made first-class). It makes provisioning a property of the *repo*, removes even the scout's fuzziness, and is the canonical place a maintainer pins setup. Larger surface; sequenced last.

## 4. Schema & contract changes
- **`war-config.mjs`**: add `run.provision: string[]` (default `[]`), `run.provisionSource: string` (`explicit | manifest | ci | onboarding | structural | none`, informational), `run.provisionAuto: boolean` (default `true`, gates whether the scout runs when `provision` is empty). Validate `provision` as an array of non-empty strings. Presets inherit defaults.
- **setup-scout**: a read-only agent (or a documented Setup step) that returns `{ provision: string[], source, rationale }` for a repo. Holds **no** ecosystem table — it reads the repo's CI / onboarding / structural signals. The only deterministic piece is the tiny structural fallback in `provision.mjs`.
- **`provision.mjs`** (new, thin + tested): `validateProvision(list)` and a minimal `structuralFallback(repo) → string[]` (the ecosystem-agnostic floor only). Decision intelligence lives in the scout; this module just validates and provides the last-resort floor.
- **WAR worker result schema**: add an `env-blocked` verdict.
- **WAR workflow args**: thread the resolved `provision` list into worker + fix-worker setup, run after worktree creation, before install/gate.
- **red-team scaffold**: executed-probe scope-lock runs the passed-in `provision` list; provisioning failure → `warn`.

## 5. Affected files
- `skills/_shared/provision.mjs` (+ `provision.test.mjs`) — **new**: `validateProvision` + the tiny ecosystem-agnostic `structuralFallback`. (Intentionally thin — the contextual logic is the scout, not this module.)
- setup-scout — a new read-only agent (`skills/_shared/` or per-skill) or a documented Setup procedure that derives `provision` from the repo's own signals.
- `skills/war/assets/war-config.mjs` (+ `war-config.test.mjs`) — `provision` / `provisionSource` / `provisionAuto` fields + validation.
- `skills/war/assets/workflow-template.js` — worker + fix-worker run provisioning after worktree creation; `env-blocked` verdict.
- `skills/war/references/schemas.md` — document the fields + `env-blocked`.
- `skills/war/SKILL.md` — Setup runs the scout, pins `provision`, threads it.
- `skills/war-room/SKILL.md` — run the scout; show derived list + source + rationale; let the operator accept/edit/replace.
- `skills/red-team/assets/workflow-scaffold.js` — executed-probe sandbox runs the passed-in `provision`; failure → `warn`.
- `skills/red-team/SKILL.md` + `skills/red-team/references/lenses.md` — document sandbox provisioning + "env gap ≠ red baseline."
- `.claude-plugin/plugin.json` + `README.md` (`## Status`) — version bump.

## 6. Alternatives considered
- **Hard-coded ecosystem detectors in the plugin** (`if .gitmodules → submodule update; if pnpm-lock → pnpm install; …`). **Rejected — this is the anti-goal.** It bakes an ever-growing ecosystem table into work-audit-refine, never matches a given repo's real conventions (custom install flags, codegen, vendored builds, monorepo task graphs), and silently does nothing for an ecosystem it doesn't know. Reading the repo's own CI/onboarding is both more accurate and zero-maintenance. The structural detectors survive only as a tiny last-resort *floor* (3.1 level 4), never the primary path.
- **Fold provisioning into `overrides.gate`.** Rejected: one gate string for all phases breaks the per-phase gate fidelity (Otto: filter varies by phase, final phase = full suite) and conflates verify with provision.
- **Rely on the worker to infer setup from the plan prose.** Fragile — works only if the plan author hand-added an actionable "Prerequisite" step (the Otto plan needed exactly that patch). Provisioning should derive from the repo, not from each plan author's diligence. (A plan-level note is a fine stopgap until this ships.)
- **`git worktree add --recurse-submodules`.** Not uniform across git versions and submodule-only; the derived-list approach covers any setup. Submodule init remains the structural floor for the common case.
- **Full `git clone` per worktree.** Heavier; loses the shared-object-store win that makes submodule init offline.

## 7. Validation criteria
- **No ecosystem hard-coding (the core criterion):** a repo in an ecosystem with no `.gitmodules` and no recognized lockfile (e.g. a Makefile-driven C project, a Bazel repo) still provisions correctly because the scout reads *its* CI/`Makefile`/README. Proves the plugin holds no ecosystem table. *(scout fixture tests across ≥3 unrelated repo shapes.)*
- The scout derives the submodule + install steps for the 2026-06-25 Otto layout from its CI/`.gitmodules`, tagged with the right `source`. *(scout fixture / incident replay.)*
- An explicit `run.provision` (or committed manifest) is honored verbatim and **suppresses** scouting. *(war-config + template test.)*
- The pinned list runs **verbatim, in order**, in every worker worktree and every red-team sandbox, before the gate. *(template + scaffold test.)*
- A failing provisioning step yields `env-blocked` (WAR) / `warn` (red-team) — never a red gate/baseline; no FIX rounds spent on it. *(unit test per consumer.)*
- `war-config.mjs` validates `provision` as an array of non-empty strings; rejects non-arrays. *(`war-config.test.mjs`.)*
- Provisioning is idempotent across repeated runs in the same worktree. *(test.)*
- **Incident replay:** the Otto baseline probe, re-run with the scouted provisioning, executes `pnpm --filter @otto/engine test` and full `pnpm test` green instead of reporting an env gap. *(confirmed achievable: after `git submodule update --init vendor/llm-workspace`, those gates ran 408 engine / 4-of-4 package green on 2026-06-25.)*

## 8. Open decisions
1. **Scout: agent vs deterministic.** Recommend a read-only **scout agent** (contextual reading of CI/onboarding/README) with a tiny deterministic structural floor — not a deterministic detector trying to parse every CI dialect. Confirm.
2. **Pin vs derive-every-time.** Recommend **pin once** into `run.provision` (reviewable, reproducible, cheap) and re-scout only on explicit refresh. Confirm vs deriving per worktree (more "live", more cost/nondeterminism).
3. **Signal priority.** Recommend the 3.1 ladder (explicit → CI → onboarding → structural). Confirm the ordering, especially CI-above-onboarding.
4. **Manifest first-class now or later.** Recommend shipping scout + config first; promote the committed repo manifest (3.6) to a follow-up. Confirm.
5. **Shared scout/floor for both skills.** Recommend one scout + one `provision.mjs` floor consumed by `/war` and `/red-team` (a repo scouted once serves both). Confirm the `_shared/` location.
6. **Version label.** Recommend **v0.5.0**. Confirm vs v0.4.3.
