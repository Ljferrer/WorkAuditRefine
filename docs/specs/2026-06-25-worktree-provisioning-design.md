# Worktree Provisioning — Design

**Status:** proposed — targets **v0.5.0** (confirm vs a smaller v0.4.3). **Spec of record**, unifying
two same-day designs that landed at this path: **Part A — the container** (the git-topology
lifecycle: owned, tested, scoped) and **Part B — the contents** (making a fresh worktree
*gate-ready* by deriving its bootstrap from the target repo's own declared setup). They compose:
Part A's owned **Provision barrier** is exactly where Part B's derived bootstrap runs.

**Glossary:** [CONTEXT.md](../../CONTEXT.md) · **Decisions:** [docs/adr/](../adr/) (0001–0003).

## Problem — a fresh worktree is not ready to work in

Two independent gaps on one surface, both observed 2026-06-25:

- **Container gap (Part A).** Worktree creation/scoping/teardown is implicit, scattered through
  Workflow prose, untested, and **worker-self-created**
  ([workflow-template.js:113-115](../../skills/war/assets/workflow-template.js)) — which violates the
  container/contents boundary. The `WAR_WORKTREE` write-scope guard is a **proven NO-OP**
  (experiment E1). Failures (a half-made worktree, a stale branch, a guard that doesn't guard, a ref
  collision between concurrent runs) surface mid-run.
- **Contents gap (Part B).** Even once a worktree exists, a bare `git worktree add` is **not
  gate-ready**: submodules empty, monorepo install / codegen / vendored builds / `.env` missing.
  What's needed is **repo-specific**, so it must be read from the target repo — not baked into the
  plugin (Otto incident, §B.1).

Vocabulary: the **container** is the branch + worktree directory (refiner-owned); the **contents**
are the files/commits *and the bootstrapped environment* inside it.

---

# Part A — Container: the owned git-topology lifecycle

The refiner (the git-topology owner) runs a wave-start **Provision barrier** that calls one tested
shell asset, `provision-worktrees.sh`, owning the whole git topology: cut/reuse the plan-namespaced
integration branch, create each task's worktree on the integration tip with a `.war-task` marker,
idempotent "ensure" with conservative heal, run-scoped teardown, and `.git/info/exclude` upkeep.
Write-scope is enforced by a rewritten hook keyed on `agent_type` (not an env var).

## A. Decisions

- **D1 — Goal.** Worktree provisioning becomes a *deterministic, owned lifecycle*, not implicit
  scattered steps.
- **D2 — Form.** Delivered as **a single tested provisioning script asset** (one script, with
  tests), not inline Workflow prose.
- **D3 — Owner.** The **refiner** owns it (the git-topology owner). Provisioning runs as a
  **wave-start "Provision" stage that is a barrier** before workers fan out.
- **D4 — Mechanism.** **Explicitly-managed worktrees** (`git worktree add/remove`), *not* harness
  `isolation: 'worktree'` ([ADR 0001](../adr/0001-explicitly-managed-worktrees.md)). **Carve-out:**
  the red-team throwaway sandboxes and the servitor stay on harness `isolation: 'worktree'`.
- **D5 — Scope mechanism.** Retire the `WAR_WORKTREE` env-var guard (proven NO-OP, E1) and replace
  it with an **`agent_type`-driven structural guard**: workers confined to a `.war-task`-marked
  worktree, servitor to the learnings target, auditors no writes, refiner / main session
  unrestricted. Exact per-worktree confinement is **unattainable in this harness** and is explicitly
  dropped (accepted residual: sibling-worktree writes).
  [ADR 0002](../adr/0002-scope-by-agent-type.md).
- **D6 — Path convention.** Task worktrees live at an **absolute path under the run's ledger dir**:
  `<repo-root>/.claude/teams/<run-id>/worktrees/<task-id>`. The refiner's Provision stage creates
  them (not the worker). Provisioning ensures `.claude/` is git-excluded via **`.git/info/exclude`**
  (local, idempotent) — see E2 — so nested worktrees never pollute the working branch's `git status`.
- **D7 — Idempotency & resume.** Provisioning is idempotent **"ensure"** semantics keyed to the
  ledger: ensure `integration/…` exists (reuse if present — **never re-cut**), ensure git-exclude,
  ensure each worktree on the integration tip with its marker — created **serially** in the barrier
  (dissolves parallel `git worktree add` / `index.lock` hazards). **Conservative heal:** never
  destroy a worktree whose branch carries un-merged commits; prune+recreate only empty/unregistered
  no-commit dirs; an unregistered dir that *has* changes → **fail loud**.
- **D8 — Branch namespacing.** Integration and task branches are namespaced by a **plan slug**
  (`integration/<plan-slug>/phase-N`; tasks `<plan-slug>/phase-N/<task-id>`) so concurrent WARs
  don't collide on refs (a real `integration/phase-N` collision occurred between v0.4.1 and v0.4.2).
  The "ensure" step uses the ledger to tell a **resume** (this run owns the branch → reuse) from a
  **foreign collision** (exists but not ours → fail loud).
  [ADR 0003](../adr/0003-plan-namespaced-branches.md).
- **D9 — Teardown.** Refiner-owned, **strictly run-scoped** — never touches another run-id's
  refs/worktrees (an unrelated run's branch may be **paused on an escalation**). Task land → remove
  worktree + delete merged branch; phase land → remove integration branch + remaining phase
  worktrees; escalation/block → **keep** for inspection; provision-start → `git worktree prune` (own
  registry only). Cross-run cleanup is **manual / out-of-scope**.
- **D10 — Rewritten scope hook.** An `agent_type`-keyed guard replaces `validate-worktree-scope.sh`:
  `war-worker` → allow only inside a `.war-task`-marked dir; `war-servitor` → learnings-target path
  pattern; `war-auditor` → hard-deny; `war-refiner` / no `agent_type` → unrestricted; **unknown
  `agent_type` → fail-open**. Strip the no-op `export WAR_WORKTREE=…` lines from the template + agent
  docs.
- **D11 — Testing.** **Throwaway-repo tests** (the E2 pattern), plain-bash assertions: each case
  `mktemp -d`s a fresh repo and asserts on real git state. The hook gets its own stdin-fixture unit
  tests. Both run without the live Claude harness.

## A. Solution shape (container)

The refiner's Provision barrier calls `provision-worktrees.sh`:
1. `ensure-integration <plan-slug> <phase-N> <working-tip>` — create `integration/<plan-slug>/phase-N`
   if missing (reuse if ours per the ledger; fail loud on a foreign branch); ensure `.claude/` in
   `.git/info/exclude`.
2. `ensure-worktree <task-path> <task-branch> <integration-tip>` — serially per task: create on the
   integration tip with branch + `.war-task` marker; reuse if valid; **conservative heal** otherwise.
3. `teardown-task` / `teardown-phase` / `prune` — run-scoped removal on land; keep-on-escalation.

The rewritten `validate-worktree-scope.sh` (D10) enforces write-scope by `agent_type` + `.war-task`.

---

# Part B — Contents: making the worktree gate-ready (repo-derived bootstrap)

> Spec of record for making the isolated worktrees/sandboxes that WAR workers and red-team
> executed-probes run in **gate-ready** by deriving each repo's bootstrap **from that repo's own
> declared setup** — not from ecosystem rules baked into the plugin.

Affected surface: WAR worker provisioning in
[`workflow-template.js`](../../skills/war/assets/workflow-template.js), the config schema
[`war-config.mjs`](../../skills/war/assets/war-config.mjs), red-team sandbox creation in
[`workflow-scaffold.js`](../../skills/red-team/assets/workflow-scaffold.js), the runbooks
(`skills/war/SKILL.md`, `skills/war-room/SKILL.md`, `skills/red-team/SKILL.md`), and a new
setup-scout + a thin validator `skills/_shared/provision.mjs`.

## B.1 Problem — fresh worktrees are not gate-ready (observed 2026-06-25)

Both flagship skills create an **isolated copy of the repo** and immediately expect to run the
project's gate in it:

- **`/war`** — each worker is told (template, [`workflow-template.js:114`](../../skills/war/assets/workflow-template.js)):
  *"Create a git worktree … cd there; work only inside it. Gate: `<gate>`."* A bare `git worktree add`.
- **`/red-team`** — every `executed` probe's scope-lock says *"first copy the repo into a throwaway
  sandbox (`cp -R` or `git worktree add`) and `cd` into that copy."* Same bare worktree/copy.

Neither does any **provisioning** beyond the checkout, nor has any way to know what *this* repo needs
to become gate-ready: git submodules (a bare `git worktree add` leaves them empty), monorepo install,
codegen, a vendored package that must be built, `.env` materialization. That list is **repo-specific**.

**Concrete incident (2026-06-25).** Red-teaming an external pnpm+turbo monorepo (Otto) whose
`apps/engine` depends on a **private git submodule** (`@sequoiaport/llm-workspace`): the executed
baseline probe **proved `@otto/db` (76 tests) and `@otto/contract` (60) green on pglite**, but
**could not run `pnpm --filter @otto/engine test` or full `pnpm test`** — `pnpm install` aborted with
`ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` because the fresh worktree's `vendor/llm-workspace` was
uninitialized. The probe (correctly, by hand) downgraded this to an *environment gap → warn*, not a
red baseline — but it left a real acceptance unproven, and a `/war` worker building those phases
would have hit the identical wall.

**The trap to avoid.** The obvious fix — teach the plugin to detect `.gitmodules` → `git submodule
update --init`, `pnpm-lock.yaml` → `pnpm install`, … — just relocates the hard-coding. It bakes an
ever-growing ecosystem table into work-audit-refine (poetry, cargo, gradle, bundler, go workspaces,
nix, devcontainers…) and still won't match a given repo's real conventions. **The provisioning a
worktree needs is a property of the target repo, so it must be read from the target repo.**

**Today's only lever is also the wrong one.** The config exposes no setup/provision field; the single
place provisioning *could* be smuggled is `overrides.gate` — but the gate is **one string for all
phases**, whereas a real plan's gate is per-phase. Folding setup into the gate breaks that fidelity
and conflates *provision* with *verify*.

## B.2 Goal / Non-goals

**Goal.** A fresh WAR worker worktree and a fresh red-team probe sandbox are made gate-ready by
**provisioning steps derived from the target repo's own declared setup**. work-audit-refine carries
**no ecosystem-specific knowledge**: a repo in an ecosystem the plugin has never seen still
provisions correctly. A provisioning failure is reported **distinctly from a gate/baseline failure**.

**Non-goals.** Replacing the worker's own `install → green` loop (provisioning covers the *pre-install*
steps a bare checkout lacks); a general remote-CI provisioner (scope is local worktrees/sandboxes
sharing the superproject's object store); changing audit/grill/merge semantics.

## B.3 Design — derive contextually once, pin, then run deterministically

Separate a **contextual (fuzzy, one-time) derivation** from **deterministic (verbatim, every-time)
execution** — keeps repo-specific intelligence out of the plugin while preserving the "tested
deterministic module" value downstream.

- **B.3.1 Derive** — during Setup, a **read-only setup-scout** (`Explore`-class agent) inspects the
  target repo and emits an ordered list of shell commands (+ rationale + `source` tag) taking a bare
  checkout to gate-ready, consulting in **descending authority**: (1) **explicit operator intent**
  (`run.provision` or a committed manifest — authoritative, stop); (2) **the repo's CI**
  (`.github/workflows/*.yml` — what maintainers actually run; extract pre-test setup); (3)
  **dev-onboarding** (`.devcontainer` `postCreateCommand`, `Makefile`/`Justfile` `setup`,
  `package.json scripts.{setup,bootstrap,prepare}`, CONTRIBUTING/README); (4) **structural fallback**
  only when 1–3 are silent (`.gitmodules` → `submodule update --init --recursive`; lockfile → its
  install). The 2026-06-25 submodule step is reached at level 2 or 4 — because the scout *read Otto's*
  signals, never because the plugin special-cases submodules.
- **B.3.2 Pin** — write the scout's output to a new **`run.provision: string[]`** (+ `provisionSource`
  + rationale), owned/validated by `war-config.mjs`, operator-reviewable. Derivation is decoupled from
  use; the list is a deterministic, inspectable artifact.
- **B.3.3 Run** — every worktree executes the pinned list verbatim, **before** install/gate.
  *(Integration: in WAR this runs inside Part A's refiner Provision barrier — see Integration.)*
  Red-team executed-probes run the same list (Lead passes it in like the fingerprint), so a repo
  scouted once provisions identically for both skills. *Git note:* linked worktrees share the
  superproject's `$GIT_COMMON_DIR`, so once the main checkout has fetched a submodule the worktree's
  `submodule update --init` is **offline and instant**; network/auth only for the first cold fetch.
- **B.3.4 Provisioning failure is its own outcome (not a red gate).** WAR worker → a distinct
  **`env-blocked`** verdict (Lead halts the task, no FIX rounds burned); red-team probe → `status:"warn"`
  with an env-gap note. Never scored as a red baseline.
- **B.3.5** `/war-room` Setup runs the scout, shows the proposed `provision` + source + rationale, and
  writes the confirmed list into `config.json`.
- **B.3.6** Optional deeper layer — a **committed repo manifest** both skills read (level 1 made
  first-class); larger surface, sequenced last.

## B.4 Schema & contract changes
- `war-config.mjs`: add `run.provision: string[]` (default `[]`), `run.provisionSource: string`
  (`explicit|manifest|ci|onboarding|structural|none`), `run.provisionAuto: boolean` (default `true`).
  Validate `provision` as an array of non-empty strings.
- **setup-scout**: read-only agent returning `{ provision, source, rationale }`; holds **no** ecosystem
  table.
- **`provision.mjs`** (new, thin + tested): `validateProvision(list)` + a minimal
  `structuralFallback(repo)` (ecosystem-agnostic floor only).
- **WAR worker result schema**: add `env-blocked`.
- **WAR workflow args**: thread the resolved `provision` list into worker + fix-worker setup, run after
  worktree creation, before install/gate.
- **red-team scaffold**: executed-probe scope-lock runs the passed-in list; failure → `warn`.

## B.5 Affected files
`skills/_shared/provision.mjs` (+ test) — new; setup-scout — new read-only agent / Setup procedure;
`war-config.mjs` (+ test); `workflow-template.js`; `skills/war/references/schemas.md`;
`skills/war/SKILL.md`; `skills/war-room/SKILL.md`; `workflow-scaffold.js`; `skills/red-team/SKILL.md`
+ `references/lenses.md`; `.claude-plugin/plugin.json` + `README.md`.

## B.6 Alternatives considered
- **Hard-coded ecosystem detectors in the plugin** — **rejected, the anti-goal**: an ever-growing
  table that never matches real conventions and silently no-ops for unknown ecosystems. Reading the
  repo's own CI/onboarding is more accurate and zero-maintenance; structural detectors survive only as
  a tiny last-resort floor.
- **Fold provisioning into `overrides.gate`** — rejected: breaks per-phase gate fidelity; conflates
  verify with provision.
- **Rely on the worker to infer setup from plan prose** — fragile; provisioning should derive from the
  repo, not each plan author's diligence.
- **`git worktree add --recurse-submodules`** — not uniform across git versions, submodule-only.
- **Full `git clone` per worktree** — heavier; loses the shared-object-store win.

---

# Integration — one Provision barrier, two layers

Part A and Part B are the same Setup→Provision pipeline at two layers, and they meet at the refiner's
**Provision barrier**:

1. **Container (Part A):** the refiner ensures the integration branch and, serially per task, creates
   each worktree on the integration tip with its `.war-task` marker (idempotent, conservative heal).
2. **Contents (Part B):** in the same barrier, before the worker fans out, the refiner runs the pinned
   `run.provision` list inside each freshly created worktree.

This resolves Part B's open "where does the provision list run" — it moves out of the worker (D3:
the worker no longer self-creates *or* self-provisions the container) and into the owned barrier. Two
distinct failure modes stay distinct: a **git-topology** failure → fail-loud heal (D7); a
**provision-step** failure → `env-blocked` / `warn` (B.3.4). The worker still drives its own
`install → green` loop on top.

## Experiment log

- **E1 — Hook-identity probe (2026-06-25).** Instrumented the live cache hook to log its PreToolUse
  payload. The payload carries `agent_type`/`agent_id` **only for subagents**; a subagent's
  `session_id`/`cwd` are **identical to the parent's**; a subagent's `export` does **not** survive its
  next Bash call; a worker **cannot read its own `agent_id`**. ∴ `WAR_WORKTREE` cannot scope workers
  and `agent_type` is the only reliable per-role signal (basis for D5/D10). Probe non-destructive;
  hook restored byte-exact (md5 verified).
- **E2 — Nested-worktree git-status (2026-06-25, throwaway repo).** `git worktree add` at
  `.claude/teams/.../task1` made the parent `git status` show `?? .claude/`; adding `.claude/` to
  git-exclude made status clean. Git does *not* auto-exclude nested worktree paths (basis for D6).

## Deliverables (merged)

**Container (Part A):**
- NEW `skills/war/assets/provision-worktrees.sh` (+ `.test.sh`).
- REWRITE `hooks/validate-worktree-scope.sh` (+ NEW `.test.sh`).
- MODIFY `skills/war/assets/workflow-template.js` — refiner Provision barrier; remove worker
  self-create + no-op `export WAR_WORKTREE`; thread `plan-slug` + `run-id`.
- DONE this session — [CONTEXT.md](../../CONTEXT.md), ADRs 0001 / 0002 / 0003, this spec.

**Contents (Part B):**
- NEW `skills/_shared/provision.mjs` (+ test); setup-scout agent; `war-config.mjs` fields (+ test);
  `env-blocked` verdict; red-team scaffold provisioning; doc updates (schemas/SKILLs/lenses).

## Build order (for `/war`)

- **Phase 1 — Scope hook rewrite** (container core): rewrite hook + unit tests.
- **Phase 2 — Provisioning script** (container core): `provision-worktrees.sh` + throwaway-repo tests.
- **Phase 3 — Workflow integration**: refiner Provision barrier; remove worker self-create + no-op
  exports; thread plan-slug/run-id; **run the pinned `provision` list in the barrier** (the seam).
- **Phase 4 — Contents derivation**: setup-scout + `provision.mjs` + `war-config.mjs` fields +
  `env-blocked` verdict + red-team scaffold provisioning.
- **Phase 5 — Docs & retire**: agent docs/SKILL/schemas/design/lenses; assert no lingering
  `WAR_WORKTREE`.
- **Phase 6 — Release & verify**: version bump per README's file list (v0.5.0); all tests green.

> **Part A** (Phases 1–3 + 5, the container) → [docs/plans/2026-06-25-worktree-provisioning-part-A.md](../plans/2026-06-25-worktree-provisioning-part-A.md), ships **v0.5.0**.
> **Part B** (the contents / repo-derived bootstrap) → [docs/plans/2026-06-25-worktree-provisioning-part-B.md](../plans/2026-06-25-worktree-provisioning-part-B.md), ships **v0.5.1**. The Open decisions below were resolved in the 2026-06-25 grilling; the committed-manifest follow-up (D4) is tracked in [issue #51](https://github.com/Ljferrer/WorkAuditRefine/issues/51).

## Validation criteria

**Container:** fresh create · idempotent re-run · conservative-heal (reuse a worktree with commits) ·
foreign-branch fail-loud · task-land teardown · keep-on-escalation · exclude idempotency · hook exit
codes per `agent_type`.
**Contents:** no ecosystem hard-coding (a Makefile/Bazel repo provisions from *its* CI/Makefile) ·
the Otto submodule+install steps derived from CI/`.gitmodules` with the right `source` · explicit
`run.provision` honored verbatim and suppresses scouting · the pinned list runs verbatim, in order,
before the gate · a failing step → `env-blocked` (WAR) / `warn` (red-team), no FIX rounds · config
validates `provision` as an array of non-empty strings · provisioning idempotent across re-runs ·
**incident replay**: the Otto baseline probe, re-run with scouted provisioning, runs
`pnpm --filter @otto/engine test` + full `pnpm test` green.

## Open decisions

1. **Scout: agent vs deterministic.** Recommend a read-only scout agent + a tiny structural floor.
2. **Pin vs derive-every-time.** Recommend pin once into `run.provision`, re-scout on explicit refresh.
3. **Signal priority.** Recommend explicit → CI → onboarding → structural; confirm CI-above-onboarding.
4. **Manifest first-class now or later.** Recommend scout + config first; manifest follow-up.
5. **Shared scout/floor location.** Recommend one scout + one `provision.mjs` in `skills/_shared/`.
6. **Version label.** Recommend **v0.5.0** vs v0.4.3.
7. **(Merge) Where the provision list runs.** Recommended: inside the refiner Provision barrier
   (Integration), not the worker — since D3 moves container creation to the refiner. Confirm.
8. **(Merge) Ledger-ownership handshake.** How `provision-worktrees.sh` is told which refs the current
   run owns (a flag or a ledger path under `.claude/teams/<run-id>/`) — pin during Phase 2.
