# Verification-Layer Integrity Implementation Plan (F07 · F12)

**Goal:** make WAR's own verification layer trustworthy — (F12) the gate must run **every** test runner present,
not silently skip a whole class; (F07) the template's inline **logic** mirrors must be guarded against drift, not
just its constants. Foundation plan: every later remediation plan relies on a gate that actually covers their tests
and a drift guard that catches mirror divergence.

**Scope:** F12 (multi-runner gate) + F07 (mirror-logic drift guard). Both are **v0.5.3 test/hardening** — additive
tests + a pure resolver + doc/contract updates; **no behavioral change to the orchestration loop.**

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

**Gate (for `/war`):** the full multi-runner command (this plan's own dogfood of F12):
```
node --test skills/**/*.test.mjs && bash hooks/validate-worktree-scope.test.sh \
  && bash hooks/clean-surface-war-worktree.test.sh && bash skills/war/assets/provision-worktrees.test.sh
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
- **Phase 3 — Release:** Task 4 — v0.5.3 + full gate. Depends on all.

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
    bash suite cannot be silently orphaned. (Mirror of the `WAR_WORKTREE` clean-surface gate's spirit.)
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
  - **spawnOpts drift (D1):** regex-extract the inline spawn-opts mirror (`workflow-template.js:94-98`) from
    `templateText`, rebuild it via `new Function('agents','ROLE_MODEL', 'return (' + extracted + ')')`, and assert
    its output equals the imported `spawnOpts(config, role)` across an input table: each role × {default effort,
    non-default effort, missing model}. (`ROLE_MODEL` is already constant-drift-guarded.)
  - **covenSeats drift (D1):** extract the inline lens/seats logic (~158-166) and assert it equals
    `covenSeats(config, task)` across: `coven:false`; `coven:true` with custom `task.lenses`; `covenSize` > and <
    `lenses.length` (rotation/wrap).
  - **decideLand drift (D1):** extract inline `HARD_ESCALATION_REASONS` + `hardEscalation` + the `landDecision`
    ternary (`291-295`); assert the verdict equals `decideLand({landed, escalated})` across: empty/non-empty
    `landed` × `escalated` with/without a hard reason. Reconcile signatures by computing `hardEscalation` from the
    same `escalated` the canonical receives.
  - **Meta-guard (D3):** scan `templateText` for every `Keep in sync` / `Mirror of` marker; assert each maps to a
    registered drift test (a literal registry in the test). A new mirror marker without a test ⇒ this fails.
- [ ] **Step 2: Run gate → pass** (mirrors are currently in sync, so the new tests are green).
- [ ] **Step 3: Prove the guards bite** — temporarily mutate `spawnOpts`/`covenSeats`/`decideLand` canonical (or the
  inline copy) in a scratch edit and confirm the matching drift test **fails**; revert. Add a `Keep in sync` marker
  with no test and confirm the meta-guard **fails**; revert. (Validation, not committed.)
- [ ] **Step 4: Run gate → pass** (clean tree).
- [ ] **Step 5: Commit** — `git commit -am "test(war): behavioral drift guards for spawnOpts/covenSeats/decideLand mirrors + meta-guard (F07)"`

---

## Phase 3 — Release & verify

### Task 4: Version bump v0.5.3 + full multi-runner gate green

**Files:** the README-documented bump list.

- [ ] **Step 1:** Bump to **v0.5.3** across the bump list (`.claude-plugin/plugin.json` `version`, README badge/status,
  any `vX.Y.Z` strings).
- [ ] **Step 2:** Run the **full** gate (all runners) → green. With F12 landed, also sanity-check
  `war-config.mjs --resolve-gate "node --test skills/**/*.test.mjs"` discovers all three `*.test.sh` suites.
- [ ] **Step 3: Commit** — `git commit -am "chore(release): v0.5.3 — verification-layer integrity (multi-runner gate, mirror drift guards)"`

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

## Open decisions (for `/red-team`)

1. **Node-test breadth:** the declared `node --test skills/**/*.test.mjs` glob could itself under-cover (`*.test.mjs`
   outside `skills/`, or `*.test.js`). Should the coverage meta-test **also** assert every `*.test.{mjs,js}` is
   reachable by the declared node glob, or is bash-suite coverage sufficient for v0.5.3? (Recommend: add the node
   breadth assertion too — cheap, closes D1 fully.)
2. **`overrides.gate` + discovery:** when a user pins `overrides.gate`, should `resolveGate` still append bash-suite
   discovery (safer — can't accidentally skip suites) or treat the override as fully authoritative? (Recommend:
   still append; document it.)
3. **Release granularity** confirmed per-plan (v0.5.3); confirm vs batching.
