# Verification-Layer Integrity Implementation Plan (F07 · F12)

**Goal:** make WAR's own verification layer trustworthy — (F12) the gate must run **every** test runner present,
not silently skip a whole class; (F07) the template's inline **logic** mirrors must be guarded against drift, not
just its constants. Foundation plan: every later remediation plan relies on a gate that actually covers their tests
and a drift guard that catches mirror divergence.

**Scope:** F12 (multi-runner gate) + F07 (mirror-logic drift guard). Both are **v0.6.2 test/hardening** — additive
tests + a pure resolver + doc/contract updates; **no behavioral change to the orchestration loop.**

> **Baseline-drift note (2026-06-25 red-team):** this plan was drafted at v0.5.1; it now STACKS on the
> audit-scheduler-integrity plan (v0.6.1), so the release is **v0.6.2** (not the drafted v0.5.3) and the live
> `workflow-template.js` mirror line numbers have MOVED: the inline spawn-opts mirror is ~95-99 (not 94-98),
> covenSeats ~166-169 (not 158-166), and the `decideLand` ternary + inline `HARD_ESCALATION_REASONS` are at
> **367-374** (not 291-295) — and the array now has 6 members (`…land_stale, dep-failed, gate-evidence`). The
> drift tests regex-extract by construct (not by line), so they adapt; the line cites below are advisory. The F07
> spec's own `292-295` cite is likewise stale (back-port the 367-374 fix into the spec).

**Operator decisions (2026-06-25 — these resolve the specs' open decisions):**
- **F07 → tests-only (D1 + D3).** Add behavioral drift tests + the meta-guard; **keep the mirrors**. The D2
  mirror-elimination refactor (compute Lead-side, delete mirrors) is **deferred** — drift tests make the mirrors
  safe regardless, and a refactor carries behavioral risk unfit for a hardening patch.
- **F12 → self-discovering gate, resolved per gate run.** A pure `resolveGate()` in `war-config.mjs` emits a
  portable command that, on **each** invocation, runs the declared gate **and** discovers + runs every `*.test.sh`.
  Because the refiner re-runs the gate on every rebase, a runner that an intra-phase task merge adds is caught
  immediately — re-detection (spec D2) is automatic, not a separate Lead step. `overrides.gate` is the escape hatch.

**Architecture:** `war-config.mjs` is the tested source of truth; the Workflow sandbox **can't `import`**, so
`workflow-template.js` mirrors logic inline. F12 adds a pure function there (consumed Lead-side, since the template
has no shell/fs and WAR runs against **arbitrary target repos** — a committed resolver script wouldn't be general).
F07 adds tests only. Both land in `war-config.test.mjs` → **serialize as tasks**.

**Tech stack:** plain ESM + `node --test`; the existing drift-test pattern (`templateText = readFileSync(...)`,
regex-extract the inline construct, `deepEqual` against the imported canonical) and `new AsyncFunction`/`new Function`
compilation.

**Gate (for `/war`):** the full multi-runner command (this plan's own dogfood of F12). The node glob MUST be
**quoted** (unquoted `**` under macOS bash 3.2 silently under-covers) and the bash suites are **self-discovered**
(the repo has **FOUR** `*.test.sh` suites — `validate-worktree-scope`, `clean-surface-war-worktree`,
`provision-worktrees`, **and `refinery-surface`** — so hardcoding three would itself reproduce the F12 bug):
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Source of truth:** [F07 spec](../specs/2026-06-25-F07-mirror-logic-drift-guard-design.md),
[F12 spec](../specs/2026-06-25-F12-multi-runner-gate-design.md); roadmap
[here](2026-06-25-audit-remediation-roadmap.md). Memory: `gate-under-covers-after-cross-branch-merge-new-runner`,
`run-provision-config-not-yet-mirrored-into-template`.

> **`resolveGate` contract (F12).** Pure, in `war-config.mjs`, plus a `--resolve-gate "<declaredGate>"` CLI the
> Lead calls. Given the declared/`overrides.gate` base command, it returns a single portable shell string:
> ```
> <declaredGate> && for f in $(find . -type f -name '*.test.sh' \
>   -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do \
>   printf '\n== gate(bash): %s ==\n' "$f" && bash "$f" || exit 1; done
> ```
> `&&`-chained so any non-zero ⇒ `gate_failed` (D1). Self-discovers per run ⇒ re-detect is free (D2). The refiner
> runs this resolved string for merge-task / land-phase / release (D3). Threaded as `plan.gate` (still a **string**
> ⇒ **no template change**). Node-test breadth stays the declared gate's job; the coverage meta-test guards it.

## Build order (for `/war`)

- **Phase 1 — F12 gate resolver:** Task 1 (`resolveGate` + CLI + unit tests) → Task 2 (coverage meta-test + doc
  contracts). Independent of F07 except the shared test file.
- **Phase 2 — F07 drift guards:** Task 3 — behavioral drift tests + meta-guard. Depends on Task 2 (same file).
- **Phase 3 — Release:** Task 4 — v0.6.2 + full gate. Depends on all.

---

## Phase 1 — F12 multi-runner gate

### Task 1: `resolveGate()` + `--resolve-gate` CLI

**Files:** Modify `skills/war/assets/war-config.mjs`; Test `skills/war/assets/war-config.test.mjs`.

- [ ] **Step 1: Write failing tests**
  - `resolveGate('node --test x')` returns a string that (a) **starts with** the declared gate, (b) contains a
    `find` for `*.test.sh` with **both** `node_modules` and `.git` prunes, (c) runs each suite as `bash "$f"` and
    aborts on failure (`|| exit 1`), (d) `&&`-chains declared-then-discovery.
  - `resolveGate('')` / `resolveGate(null)` → the discovery clause alone (no leading `&&`).
  - **Idempotent shape:** calling it on an already-resolved string is not required to be stable — assert callers
    pass only the *declared* base (documented).
- [ ] **Step 2: Run gate → fail** (`resolveGate` undefined).
- [ ] **Step 3: Implement** `export function resolveGate(declaredGate)` returning the contract command above; add a
  `--resolve-gate <cmd>` branch to `main()` that prints `resolveGate(arg)` to stdout, exit 0.
- [ ] **Step 4: Run gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "feat(war): resolveGate() — self-discovering multi-runner gate (F12)"`

### Task 2: Coverage meta-test + contract docs

**Files:** Test `skills/war/assets/war-config.test.mjs` (new meta-test); Modify `skills/war/SKILL.md`,
`agents/war-refiner.md`, `skills/war/references/schemas.md`.

- [ ] **Step 1: Write failing tests**
  - **Coverage meta-test (D5):** independently walk the repo for executable `*.test.sh`, and assert **each** is
    matched by `resolveGate`'s discovery pattern (i.e. none sits under a pruned path / none is excluded) — so a new
    bash suite cannot be silently orphaned. (Mirror of the `WAR_WORKTREE` clean-surface gate's spirit.) **There are
    currently FOUR** such suites — `hooks/validate-worktree-scope.test.sh`, `hooks/clean-surface-war-worktree.test.sh`,
    `skills/war/assets/provision-worktrees.test.sh`, **and `skills/war/assets/refinery-surface.test.sh`** — the test
    must assert all four are discovered (a count-or-set assertion, not a hardcoded 3).
  - **Node-test breadth assertion (resolves Open decision #1):** ALSO assert every `*.test.{mjs,js}` under the repo
    (excluding pruned paths) is reachable by the declared `node --test 'skills/**/*.test.mjs'` glob — i.e. flag any
    `*.test.mjs`/`*.test.js` that sits outside `skills/` or that the quoted glob would miss. Cheap; closes D1 fully
    so neither a bash suite nor a node test can be silently orphaned.
  - **Doc-contract assertions:** `grep` `war-refiner.md` for "resolved gate" / "all runners"; `grep` `SKILL.md`
    for the `--resolve-gate` step; `grep` `schemas.md` for the gate-string semantics note.
- [ ] **Step 2: Run gate → fail.**
- [ ] **Step 3: Implement**
  - **SKILL.md** step 3: after detecting the **declared** gate (pyproject/package.json/ask; `overrides.gate` wins),
    resolve it via `node skills/war/assets/war-config.mjs --resolve-gate "<declared>"` and thread the **result** as
    the gate. Note re-detection is automatic (self-discovering); no manual re-detect step.
  - **war-refiner.md**: the gate is a resolved command that **runs all runners**; run it verbatim for merge-task,
    land-phase, and release; any non-zero ⇒ `gate_failed`.
  - **schemas.md**: `overrides.gate` = the *declared base* (string|null); the **resolved** gate run by agents is a
    self-discovering string. (No `string[]` needed — chose self-discovery over a list.)
- [ ] **Step 4: Run gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "feat(war): gate-coverage meta-test + Lead/refiner resolve-all-runners contract (F12)"`

---

## Phase 2 — F07 mirror-logic drift guards

### Task 3: Behavioral drift tests for the inline mirrors + meta-guard

**Files:** Test `skills/war/assets/war-config.test.mjs` (+ optionally `land-decision.test.mjs`). **No source change**
(mirrors kept by decision).

- [ ] **Step 1: Write the tests** (these are the deliverable; prove they CATCH drift in Step 4)
  > Line numbers below are post-plan-1 (verified at the stacked base) and **advisory** — extract by **construct**
  > (regex/marker), not by line, since later merges shift them.
  - **spawnOpts drift (D1):** regex-extract the inline spawn-opts mirror (`workflow-template.js` ~95-99, under the
    line-93 `Mirror of war-config.mjs spawnOpts/covenSeats … Keep in sync` marker) from `templateText`, rebuild it
    via `new Function('agents','ROLE_MODEL', 'return (' + extracted + ')')` — **inject `ROLE_MODEL` and `agents`**
    (the locals the inline closes over) — and assert its output equals the imported `spawnOpts(config, role)` across
    an input table: each role × {default effort, **undefined/falsy effort**, non-default effort, missing model}. The
    inline writes the condition as `a.effort && a.effort !== 'default'` while the canonical uses `effort === 'default'`
    — logically equivalent, so the **undefined-effort** row is the one that proves equivalence; include it.
    (`ROLE_MODEL` is already constant-drift-guarded.)
  - **covenSeats drift (D1):** extract the inline lens/seats logic (~166-169, under the **same** line-93 marker —
    one marker covers BOTH spawnOpts and covenSeats) and assert it equals `covenSeats(config, task)` across:
    `coven:false`; `coven:true` with custom `task.lenses`; `covenSize` > and < `lenses.length` (rotation/wrap). The
    inline **hardcodes** the fallback `['correctness','cascading-impact','plan-faithfulness']` whereas the canonical
    reads `DEFAULTS.audit.lenses` — **inject `DEFAULTS`** when rebuilding so both resolve the same default set (this
    equivalence is already guarded by the existing test at `war-config.test.mjs` ~239-249).
  - **decideLand drift (D1):** extract inline `HARD_ESCALATION_REASONS` + `hardEscalation` + the `landDecision`
    ternary (**~367-374**, under the line-367/368 `landDecision mirrors land-decision.mjs` + `HARD_ESCALATION_REASONS
    mirrors …` markers); assert the verdict equals `decideLand({landed, escalated})` across: empty/non-empty
    `landed` × `escalated` with/without a hard reason. The live array now has **6 members**
    (`escalate, audit-blocked, conflict, land_stale, dep-failed, gate-evidence`). Reconcile signatures by computing
    `hardEscalation` from the same `escalated` the canonical receives.
  - **Meta-guard (D3):** scan `templateText` for every `Keep in sync` / `Mirror of` / `MIRROR of` marker and assert
    each is **accounted for** by a literal registry — but markers are **NOT 1:1 with drift tests**, so the registry
    must **classify** each marker: (a) **logic-mirror** → maps to ≥1 registered behavioral drift test (the line-93
    marker maps to TWO — spawnOpts AND covenSeats; lines 367/368 map to the decideLand test); (b) **data-mirror** →
    explicitly allowlisted, no behavioral test required (the **line-69 `run.provision`/`provisionSource` MIRROR** is
    data-flow, with no canonical *function* to drift-test — it must be in the allowlist, NOT treated as a missing
    logic test). A new marker that is neither registered-as-logic nor allowlisted-as-data ⇒ this fails. (There are
    currently **four** markers: lines 69, 93, 367, 368.)
- [ ] **Step 2: Run gate → pass** (mirrors are currently in sync, so the new tests are green).
- [ ] **Step 3: Prove the guards bite** — temporarily mutate `spawnOpts`/`covenSeats`/`decideLand` canonical (or the
  inline copy) in a scratch edit and confirm the matching drift test **fails**; revert. Add a `Keep in sync` marker
  with no test and confirm the meta-guard **fails**; revert. (Validation, not committed.)
- [ ] **Step 4: Run gate → pass** (clean tree).
- [ ] **Step 5: Commit** — `git commit -am "test(war): behavioral drift guards for spawnOpts/covenSeats/decideLand mirrors + meta-guard (F07)"`

---

## Phase 3 — Release & verify

### Task 4: Version bump v0.6.2 + full multi-runner gate green

**Files:** the README-documented bump list.

- [ ] **Step 1:** Bump to **v0.6.2** (patch over the live v0.6.1 from the stacked audit-scheduler-integrity plan)
  across the COMPLETE bump list: `.claude-plugin/plugin.json` `version`, **`.claude-plugin/marketplace.json`
  `metadata.version` AND `plugins[0].version`** (do NOT omit — stale marketplace.json = silent-no-op release),
  README badge + `## Status` (REPLACE-in-place single-release slot — overwrite the prior paragraph), any `vX.Y.Z` strings.
- [ ] **Step 2:** Run the **full** gate (all runners) → green. With F12 landed, also sanity-check
  `node skills/war/assets/war-config.mjs --resolve-gate "node --test 'skills/**/*.test.mjs'"` discovers all **four**
  `*.test.sh` suites (incl. `refinery-surface.test.sh`).
- [ ] **Step 3: Commit** — `git commit -am "chore(release): v0.6.2 — verification-layer integrity (multi-runner gate, mirror drift guards)"`

---

## Notes / conscious deviations (ratify in `/red-team`)

- **F12 supersedes the spec's open-decision #1** toward **self-discovery** (not a `string[]` list, not a committed
  wrapper script): a list resolved at phase boundaries would miss a runner an intra-phase merge adds; a committed
  script isn't general to arbitrary target repos. Back-port the resolution into the F12 spec.
- **F07 D2 deferred** (operator decision): mirrors kept + guarded, not eliminated. If a future plan does the
  Lead-side refactor, it deletes a mirror **and** its drift test together (the meta-guard enforces the pairing).
- **No template change for F12** — `plan.gate` stays a string (the resolved self-discovering command). The only
  source change is the pure `resolveGate` + CLI; everything else is tests + docs.
- **Drift tests are additive** — zero behavioral risk; safe in any order relative to other plans except the shared
  `war-config.test.mjs` (serialized within this plan).
- **`find $(...)` word-splitting** assumes test paths have no spaces (true today; matches the existing bash suites).
  Noted as an accepted limitation.

## Open decisions — RESOLVED by `/red-team` (2026-06-25, `--afk` autonomous adjudication)

1. **Node-test breadth → YES, add it.** The coverage meta-test ALSO asserts every `*.test.{mjs,js}` (excluding
   pruned paths) is reachable by the declared `node --test 'skills/**/*.test.mjs'` glob (folded into Task 2 Step 1).
   Cheap; closes D1 fully — neither a bash suite nor a node test can be silently orphaned.
2. **`overrides.gate` + discovery → still append.** When a user pins `overrides.gate`, `resolveGate` STILL appends
   the bash-suite discovery clause (can't accidentally skip suites); documented in schemas.md/SKILL.md (Task 2).
3. **Release granularity → v0.6.2, standalone** (patch over the stacked v0.6.1; not batched — matches the per-plan
   0.6.x series).
4. **resolveGate ↔ Part B (F12 spec open-decision #2) → composes cleanly.** `resolveGate` wraps ONLY the test gate
   (declared node glob + self-discovered bash suites); worktree **provisioning** is a separate refiner-owned barrier
   (`run.provision`), not part of the gate string — so there is no interaction to reconcile.
