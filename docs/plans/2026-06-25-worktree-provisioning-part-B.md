# Worktree Provisioning — Part B Plan: repo-derived bootstrap (v0.5.1)

**Goal:** Make every fresh WAR worker worktree and red-team probe sandbox **gate-ready** by running
provisioning steps **derived from the target repo's own declared setup** (CI → dev-onboarding →
structural fallback) — work-audit-refine carrying **zero ecosystem-specific knowledge**. A
provisioning failure is surfaced **distinctly** from broken code (`env-blocked` / `warn`), never
scored as a red baseline.

**Architecture:** Separate a **fuzzy one-time derivation** (a read-only setup-scout agent reads
*this repo's* signals and emits an ordered command list) from **deterministic every-time execution**
(the pinned `run.provision` list runs verbatim before the gate). Repo-specific intelligence lives in
the agent (not asserted in tests); everything downstream is a tiny tested module (`provision.mjs`) +
validated config + a refiner-barrier step. Mirrors the repo's "judgment in the agent, mechanics in
the tested module" split (cf. the red-team gate/scaffold).

**Tech Stack:** Node ESM (`.mjs`), `node:test` + `node:assert/strict` (colocated `*.test.mjs`, no
`package.json`); Workflow scaffolds are plain JS compiled as an `AsyncFunction` and exercised with
mocked Workflow globals; the setup-scout is a Markdown agent prompt (no automated assertion — see
**Scout validation**).

**Source of truth:** [docs/specs/2026-06-25-worktree-provisioning-design.md](../specs/2026-06-25-worktree-provisioning-design.md)
— **Part B** + Integration. Part A (the container / git-topology lifecycle) is planned in
[2026-06-25-worktree-provisioning-part-A.md](2026-06-25-worktree-provisioning-part-A.md).

**Resolved decisions (grilling, 2026-06-25):**
- Scout = **hybrid** — agent derivation + thin tested `provision.mjs` floor [Q1/D1].
- Part B is **mostly Part-A-independent**; only **Task 6** is gated on **Part A Phase 3 landing** [Q2].
- `env-blocked` is a **refiner-barrier per-task outcome** (the worker is never spawned on a provision
  failure), added to the **shared task-outcome union** — *not* the worker-only schema. This corrects
  the spec's B.3.4/B.4 wording ("worker result schema") [Q3].
- Pin: a non-empty `run.provision` is **explicit intent → used verbatim, no re-scout**;
  `provisionAuto:true` scouts **only when the list is empty**; refresh = clear list / `--refresh-provision` [D2].
- Signal priority: explicit → **CI** → onboarding → structural [D3].
- First-class committed repo manifest **deferred** → **issue #51** [D4].
- One scout + one **`skills/_shared/provision.mjs`**, shared by `/war` + `/red-team` [D5].
- Version **v0.5.1** (Part A ships v0.5.0) [D6]. Ledger handshake is Part A's concern [D8].

## Dependency on Part A
Only **Task 6** depends on Part A — it wires the pinned list into the refiner's Provision barrier
(Part A Phase 3). Tasks 1–5 and 7 are independent and may land before Part A; red-team provisioning
(Task 5) ships value with no refiner at all.

## Scout validation (why Task 3 has no `node:test`)
The setup-scout is an LLM agent — its output is not deterministically assertable. Its safety net is
threefold: (a) `validateProvision` rejects malformed output before it is pinned; (b) the operator
reviews the proposed list + source + rationale during war-room Setup; (c) a checked-in fixture repo
(`skills/_shared/fixtures/provision/<repo>`) + a documented golden-check procedure. The deterministic
`structuralFallback` *is* unit-tested (Task 1).

## Build order (for /war)
- **Phase B1 — Deterministic core:** Task 1 → Task 2.
- **Phase B2 — Derivation:** Task 3 (depends on Task 1's result shape).
- **Phase B3 — Outcome + red-team (independent, parallel):** Task 4, Task 5.
- **Phase B4 — Integration:** Task 6 (**after Part A Phase 3**), Task 7 (depends on Tasks 1–3).
- **Phase B5 — Docs & release:** Task 8 → Task 9.

---

## Phase B1 — Deterministic core

### Task 1: `provision.mjs` — validate + tiny structural floor
**Files:**
- Create: `skills/_shared/provision.mjs` (`validateProvision`, `structuralFallback`)
- Test: `skills/_shared/provision.test.mjs`
- Fixtures: `skills/_shared/fixtures/provision/submodule-repo/.gitmodules`,
  `skills/_shared/fixtures/provision/pnpm-repo/pnpm-lock.yaml`

- [ ] **Step 1 — failing tests.** `validateProvision(list)` → `{ ok, errors }`: accepts an array of
  non-empty, trimmed strings; rejects non-arrays, empty/whitespace strings, non-string entries.
  `structuralFallback(repoDir)` returns `['git submodule update --init --recursive']` when
  `.gitmodules` is present, the lockfile-matched install (e.g. `pnpm-lock.yaml` → `pnpm install
  --frozen-lockfile`) when a known lockfile is present (both, in order, if both), `[]` otherwise.
- [ ] **Step 2 — run, expect FAIL:** `node --test skills/_shared/provision.test.mjs` (module missing).
- [ ] **Step 3 — implement** minimal `provision.mjs`. `structuralFallback` stays a **deliberately
  tiny floor** — submodules + lockfile→install only, **no ecosystem table** (the anti-goal).
- [ ] **Step 4 — run, expect PASS:** `node --test skills/_shared/provision.test.mjs`.
- [ ] **Step 5 — commit:** `feat(provision): shared validateProvision + tiny structural floor (Part B)`

### Task 2: `war-config.mjs` — `run.provision` fields
**Files:**
- Modify: `skills/war/assets/war-config.mjs` (add `run.provision: string[]` default `[]`,
  `run.provisionSource: string` ∈ `explicit|manifest|ci|onboarding|structural|none`,
  `run.provisionAuto: boolean` default `true`; validate `provision` via `validateProvision` from Task 1)
- Test: `skills/war/assets/war-config.test.mjs` (append, or create if absent)

- [ ] **Step 1 — failing tests:** defaults present; `provision` of non-empty strings accepted; a
  non-array / empty-string `provision` rejected with a clear error; `provisionSource` enum enforced;
  `provisionAuto` defaults `true`.
- [ ] **Step 2 — run, expect FAIL.**
- [ ] **Step 3 — implement** the fields + validation (import `validateProvision`).
- [ ] **Step 4 — run, expect PASS:** `node --test skills/war/assets/war-config.test.mjs`.
- [ ] **Step 5 — commit:** `feat(war): config run.provision/provisionSource/provisionAuto (Part B)`

## Phase B2 — Derivation

### Task 3: read-only setup-scout agent (+ fixture)
**Files:**
- Create: `agents/war-setup-scout.md` — read-only (`Read/Grep/Glob`), `Explore`-class. Descending
  authority **explicit → CI (`.github/workflows/*.yml`) → onboarding (`.devcontainer`,
  `Makefile`/`Justfile` `setup`, `package.json scripts.{setup,bootstrap,prepare}`, CONTRIBUTING/README)
  → structural fallback**. Returns `{ provision: string[], source, rationale }`. Holds **no** ecosystem
  table; the structural floor is `provision.mjs`'s `structuralFallback`.
- Create: `skills/_shared/fixtures/provision/ci-submodule-repo/` — a `.github/workflows/test.yml`
  (checkout `submodules: recursive` + install + test) and a `.gitmodules`.
- Create: `skills/_shared/fixtures/provision/EXPECTED.md` — golden: `source: ci`, list contains a
  submodule-init step then the install step.
- Modify: `skills/war/references/schemas.md` — document the scout result shape.

- [ ] **Step 1 — fixture + golden** committed first.
- [ ] **Step 2 — author the agent prompt;** by hand, confirm its instructions resolve the fixture to
  `EXPECTED.md` (documented golden-check procedure — **no automated assertion**, per *Scout validation*).
- [ ] **Step 3 — commit:** `feat(war): read-only setup-scout deriving run.provision from repo signals (Part B)`
  > No red/green node test: deterministic coverage lives in Task 1; the agent's net is validate +
  > operator review + fixture golden.

## Phase B3 — Outcome plumbing + red-team (independent, parallel)

### Task 4: `env-blocked` task-outcome
**Files:**
- Modify: `skills/war/references/schemas.md` — add `env-blocked` to the **task-outcome union** with
  `{ taskId, failedCommand, exitCode, stderrTail, provisionSource }`; note the worker is **not spawned**.
- Modify: `skills/war/SKILL.md` — Lead handling: halt the task, escalate, **0 FIX rounds**, **keep**
  the worktree for inspection; sibling tasks proceed.

- [ ] **Step 1 — write** the schema entry + runbook lines.
- [ ] **Step 2 — commit:** `feat(war): env-blocked task outcome for provision failures (Part B)`
  > schemas.md is prose, so the *behavioral* assertion (barrier emits this shape, worker not spawned)
  > lives in Task 6's test.

### Task 5: red-team executed-probe provisioning
**Files:**
- Modify: `skills/red-team/assets/workflow-scaffold.js` — thread a Lead-supplied `provision` list (like
  `fingerprint`); each executed-probe scope-lock runs the list **before** the baseline; a failing step
  → `status:"warn"` + env-gap note (never a red verdict).
- Modify: `skills/red-team/references/lenses.md` — scope-lock wording.
- Test: `skills/red-team/assets/workflow-scaffold.test.mjs` — compile-as-`AsyncFunction` + mocked
  globals: provision runs before baseline; a failing step yields `warn`, not red; absent list = today's
  behavior (back-compat).

- [ ] **Step 1 — failing tests** (incl. back-compat: no `provision` ⇒ unchanged).
- [ ] **Step 2 — run, expect FAIL.**
- [ ] **Step 3 — implement** scaffold threading + warn-on-failure.
- [ ] **Step 4 — run, expect PASS:** `node --test skills/red-team/assets/workflow-scaffold.test.mjs`.
- [ ] **Step 5 — commit:** `feat(red-team): executed-probe provisioning via passed-in list; failure→warn (Part B)`

## Phase B4 — Integration

### Task 6: refiner Provision barrier runs the pinned list  ⟵ **depends on Part A Phase 3**
**Precondition:** Part A Phase 3 (the refiner Provision barrier + `provision-worktrees.sh`) is landed.
**Files:**
- Modify: `skills/war/assets/workflow-template.js` — in the refiner Provision barrier, after a worktree
  is created and **before** spawning its worker: run each `run.provision` command in order; on failure
  emit `env-blocked` (Task 4), **keep** the worktree, and **do not spawn** the worker; thread the
  resolved `provision` into worker + fix-worker args.
- Test: `skills/war/assets/workflow-template.test.mjs` — mocked globals: provision runs **before** the
  gate; a failing step → `env-blocked` task outcome **and worker not spawned**; success → worker spawned;
  the resolved list reaches fix-worker setup too.

- [ ] **Step 1 — failing tests.**
- [ ] **Step 2 — run, expect FAIL.**
- [ ] **Step 3 — implement** the barrier provisioning step + `env-blocked` emission.
- [ ] **Step 4 — run, expect PASS.**
- [ ] **Step 5 — commit:** `feat(war): run pinned run.provision in the refiner barrier; env-blocked on failure (Part B)`

### Task 7: war-room Setup wires the scout
**Files:**
- Modify: `skills/war-room/SKILL.md` — Setup: when `provisionAuto` **and** `run.provision` is empty →
  run the setup-scout, present the proposed list + source + rationale, write the confirmed list + source
  into `config.json`. `--refresh-provision` clears and re-scouts. A non-empty list short-circuits (no scout).
- Modify: `skills/war/assets/war-config.mjs` — add `resolveProvision(config)` helper if needed (explicit
  non-empty list → verbatim; empty + auto → flagged for scouting).
- Test: `skills/war/assets/war-config.test.mjs` — `resolveProvision`: non-empty → verbatim, no scout;
  empty + `provisionAuto` → scout path flagged; empty + `!provisionAuto` → `[]` + `source:none`.

- [ ] **Step 1 — failing tests** → **Step 2 FAIL** → **Step 3 implement** → **Step 4 PASS**.
- [ ] **Step 5 — commit:** `feat(war-room): Setup runs setup-scout and pins run.provision (Part B)`

## Phase B5 — Docs & release

### Task 8: docs & spec reconciliation
**Files:** `skills/war/references/schemas.md`, `skills/war/SKILL.md`, `skills/war-room/SKILL.md`,
`skills/red-team/SKILL.md`, `skills/red-team/references/lenses.md`, the design spec (fix B.3.4/B.4
wording: `env-blocked` is a **task-outcome**, not a worker-result), `README.md` (provisioning section).
- [ ] Update all; grep for stale "worker result schema … env-blocked" phrasing.
- [ ] **Commit:** `docs(war): Part B provisioning — schemas, runbooks, lenses, spec wording (Part B)`

### Task 9: release v0.5.1 & verify
**Files:** `.claude-plugin/plugin.json` (`version: 0.5.1`) + **every file in README's canonical
version-bump list**.
- [ ] Bump per the README bump-list; run **all** `node --test **/*.test.mjs` + the `*.test.sh` bash
  tests; grep that no lingering provisioning TODOs / stale version strings remain.
- [ ] **Commit:** `chore(release): v0.5.1 — repo-derived worktree provisioning (Part B)`

## Validation criteria (spec, Part B)
- No ecosystem hard-coding — a Makefile/Bazel repo provisions from *its* CI/Makefile.
- The Otto submodule + install steps derive from CI/`.gitmodules` with the right `source`.
- Explicit `run.provision` honored verbatim and suppresses scouting.
- The pinned list runs verbatim, in order, **before** the gate.
- A failing step → `env-blocked` (WAR, worker not spawned) / `warn` (red-team) — **no FIX rounds**.
- Config validates `provision` as an array of non-empty strings; provisioning idempotent across re-runs.
- **Incident replay:** the Otto baseline probe, re-run with scouted provisioning, runs
  `pnpm --filter @otto/engine test` + full `pnpm test` **green**.

## Tracked follow-up
- **D4** — first-class committed repo manifest: **[issue #51](https://github.com/Ljferrer/WorkAuditRefine/issues/51)**.
