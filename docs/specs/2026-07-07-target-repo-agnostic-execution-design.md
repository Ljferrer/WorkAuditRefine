# Target-repo-agnostic execution — derive the test-floor pattern, docker-gate feasibility, gate-failure class, and provision base from the target repo

Source: `/survey-corps` 2026-07-07, from epic #579 and its four children — all filed from one live
`/war-campaign` on an external TypeScript monorepo (arm64 dev host). Not yet a plan — convert with
`/war-strategy`, then validate with `/red-team`.

**Issues addressed: #579 (epic) · #574 · #576 · #577 · #578.**

## 1. Context — the gap / problem

Four separate frictions from one real campaign all trace to a single root assumption: WAR's gate,
floors, docker gate, and provision base are tuned to the WAR-skill repo's own conventions and
degrade on any target repo that differs. Each premise is verified against the current tree (v0.14.9):

1. **Test floor false-negatives every non-`.mjs`/`.sh` test (#574).** `assert-test-in-diff.sh`
   supports a `--pattern <glob-set>` override, but its defaults hardcode the WAR repo's own gate
   discovery set (`skills/**/*.test.mjs` + `**/*.test.sh`), and nothing ever passes `--pattern`:
   both merge-task invocation sites in `workflow-template.js` (the initial merge-task dispatch
   prompt and the fix-round re-merge prompt) and the standing `agents/war-refiner.md` step 4 all
   invoke bare. On a vitest repo, a task shipping a real, gate-passing `.test.ts` is refused
   `no-test` after full Work+Audit approval; the add-test loop cannot legitimately satisfy the
   floor (only a dead `*.test.sh` stub would match), the task escalates, dependents dep-fail —
   maximum spend before the hold. Sibling `assert-packaging-in-diff.sh` has no override either.
2. **Docker gate reads a host-arch mismatch as broken code (#576).** The opt-in docker gate
   (`skills/war/SKILL.md` Setup step 3) probes only `docker info` reachability before appending
   `docker build` segments to the gate. Daemon reachability does not imply buildability: on an
   arm64 host a Dockerfile hard-pinning an x64-only dep fails mid-build (`EBADPLATFORM`), and the
   `docker info` provision pin only classifies *pre-spawn daemon absence* as `env-blocked` — the
   deterministic arch failure surfaces as `gate_failed` (a code verdict) on every task and every
   land, on diffs that never touch the Dockerfile. SKILL.md itself documents the post-provision
   collapse to `gate_failed` as an accepted residual; the live run shows the calibration is wrong
   for the deterministic platform class.
3. **The gate has no baseline notion (#577).** `resolveGate` composes declared-gate `&&`
   `*.test.sh` discovery with no baseline capture; the refiner returns a bare `gate_failed` on any
   non-zero exit; `MergeResult` has `gate_output` but no baseline-vs-introduced labeling. Whole-repo
   lint/typecheck/test failures already present on the integration base — or produced by local
   dependency-hoisting nondeterminism across worktrees (observed: the same content passed the task
   gate in one worktree and failed the land gate in another, while the project's CI was green at
   the same base) — block lands whose diff never touched the failing files.
4. **Provision cuts the phase base from a stale local ref (#578).** The Provision prompt runs
   `ensure-integration <slug> <N> <workingBranch>` against the *local* working-branch ref with no
   fetch, and `cmd_ensure_integration` in `provision-worktrees.sh` cuts from that base with no
   local-vs-origin divergence check (the land path fetches origin; provision does not, and the
   post-land opportunistic resync runs only after *automated* lands). After an out-of-band manual
   land, phase N's integration branch is cut pre-N−1: observed live, one worker correctly escalated
   on missing prior-phase symbols while a sibling landed anyway because the refiner's merge-time
   fetch+rebase silently pulled fresh content — one phase, two effective bases.

The instances **compound**: #576/#577 force manual out-of-band lands, which then trigger #578's
stale provision base. The uniform direction (epic #579): **derive each value from the target repo,
with today's behavior as the fallback.**

## 2. Pivotal constraints

- **Floor ⊆ gate (ADR 0006 / CLAUDE.md guard architecture).** The test-floor's match set must
  mirror the gate's discovery set — a floor pattern matching tests the gate never runs would let a
  dead test satisfy the floor. Any target-repo pattern must be pinned *together with* that repo's
  gate, as one Setup decision.
- **Both-surfaces rule.** Refiner behavior lives in two prompt surfaces — dispatched prompts
  string-built in `workflow-template.js` and standing instructions in `agents/war-refiner.md` —
  and every behavioral change must land in both in the same commit (they drift silently otherwise).
- **The Workflow sandbox cannot import `war-config.mjs`.** Per-run values reach the Workflow only
  as threaded args (the `plan.gate` precedent); any shared constant is hand-mirrored with a
  drift-guard test.
- **Enum discipline (ADR 0005; issue #236 lesson).** Widening a shared status enum silently widens
  the land path. New classifications must be orthogonal fields, not new `MergeResult` statuses;
  `HARD_ESCALATION_REASONS` / `KNOWN_LAND_DECISIONS` stay untouched.
- **Never-waive rule (ADR 0017).** A validation in neither the gate, a floor, nor the backstop set
  may not be waived in prose. "Treat the local gate as advisory" is only legitimate if the un-run
  validation becomes a recorded backstop entry — the existing `source: 'auto'` docker-gate
  precedent is the vehicle.
- **`provision-worktrees.sh` is the single tested owner of git-topology mutation** (macOS bash
  3.2-safe); base-derivation logic belongs there, not in prompt prose.
- **Resume doctrine (ADR 0008): repair toward git.** A true local/origin divergence is a halt, not
  a silent pick.
- **`--afk` autonomy and push-first CAS (never force)** are preserved on the common path.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| **A. Test-floor pattern source (#574)** | **Pinned per-run config value, threaded end-to-end** — new `overrides.testPattern` (string of space-separated globs \| `null`). Setup's gate-detection step proposes it alongside the declared gate (e.g. a vitest repo → `'**/*.test.ts **/*.test.tsx'`); operator confirms both together (floor ⊆ gate); `--afk` takes the proposal. **Not** derived by parsing the declared gate command — the globs live in vitest/jest/pytest configs, not the command line, so parsing is a false promise. `null` (default) = today's bare invocation and hardcoded gate-mirror defaults, byte-identical. |
| **B. Pattern threading (#574)** | The Lead threads `testPattern` into the phase Workflow args like `plan.gate`; `workflow-template.js` appends `--pattern '<value>'` at **both** `assert-test-in-diff.sh` call sites (initial merge-task prompt *and* fix-round re-merge prompt); `agents/war-refiner.md` step 4 gains the same clause. Both surfaces, same commit, drift-guarded. |
| **C. Packaging-floor audit (#574 item 4)** | **No override added — audited and documented.** `assert-packaging-in-diff.sh`'s discovery key is Dockerfile *naming* (`Dockerfile` / `Dockerfile.*` / `*.Dockerfile`), a target-agnostic convention, and its COPY analysis is path-derived from the target's own Dockerfiles. Nothing in it encodes a WAR-repo-specific convention. Record the audit result in the script header. |
| **D. Docker-gate feasibility (#576)** | **Prevent at Setup with a definitive build probe.** When composing docker-gate segments, probe-build each discovered Dockerfile once (the first gate run would pay this cost anyway; the layer cache amortizes it). A probe failure whose output matches the platform-mismatch signature set (`EBADPLATFORM`, `no matching manifest for <platform>`, `exec format error`) → **auto-defer that image to a backstop** (`source: 'auto'`, runner: the target repo's CI) instead of adding it to the gate — the daemon-unreachable precedent, per-image. Any other probe failure → interactive: surface to the operator (include / trim / defer); `--afk`: auto-defer with the failure recorded (it could be #577 baseline debt; never bake a known-red segment into every task's gate). |
| **E. Gate-failure classification vehicle (#576 + #577)** | **New orthogonal `MergeResult` field `gate_failure_class: 'introduced' \| 'baseline' \| 'environment'`**, populated only when `status: "gate_failed"`. Absent/omitted ⇒ treated as `'introduced'` (today's routing — fail-safe fallback). The status enum is untouched (constraint: enum discipline). Precedent: finding `disposition` is orthogonal to severity. |
| **F. Baseline mechanism (#577)** | **On-failure base re-run, not a per-phase baseline capture.** When the gate fails at merge-task or land, the refiner re-runs the *failing* gate at the phase's integration base (detached in `_refinery` at the base SHA) and classifies: (1) base run red with the same failing identifiers → `'baseline'`; (2) base run green *and* every failing file is disjoint from the task diff → `'environment'` (suspect worktree/hoisting nondeterminism); (3) otherwise → `'introduced'`. The predicate is prompt-enforced refiner judgment (the refiner is an agent), spelled out verbatim in both surfaces. Cost lands only on the failure path — green gates pay nothing. |
| **G. Routing per class (#576 + #577)** | `'introduced'` → today's bounded fix-worker loop, unchanged. `'environment'` → escalate with **0 fix rounds**, keep the worktree, siblings proceed — the exact `env-blocked` Lead doctrine, applied at gate time (a broken environment is never fixed by a fix-worker). `'baseline'` → **does not block**: the merge/land proceeds and the debt is auto-recorded as a backstop entry (`baseline gate debt: <failing surface> — pre-existing at <base sha>; runner: target repo CI / operator`, `source: 'auto'`), surfaced at every land per the backstop doctrine (ADR 0017-compliant: the un-run validation becomes a ratified-backstop-shaped record, never prose). Interactive runs confirm at the phase report; `--afk` proceeds with the label + backstop. |
| **H. Operator allowlist tier (#577)** | **Rejected as a separate config knob.** The on-failure base re-run *derives* the allowlist fresh each time; a hand-maintained known-baseline-failure list is a second source of truth that rots. The operator's lever remains `overrides.gate` (narrow the gate) plus the recorded backstop. |
| **I. Provision base derivation (#578)** | **`cmd_ensure_integration` gains fetch + divergence assertion** (in the script — the single tested owner — so every caller is fixed at once). Before cutting: `git fetch origin <base>`; if `origin/<base>` resolves — local == origin → proceed; local strictly behind (ancestor of origin) → cut from the **origin tip** and fast-forward the local follower ref; local strictly ahead → proceed from local (legitimate un-pushed operator work; the land pushes it); **true divergence (neither is an ancestor) → fail loud** (die, distinct message carrying both SHAs — the Lead halts and escalates, repair toward git per ADR 0008). Fetch failure / no origin → today's local-base behavior plus a warning line (offline fallback = current behavior). |
| **J. Doctrine (epic #579)** | One new ADR: **execution values are target-derived with current behavior as the fallback** — the floor pattern, docker-gate composition, gate-failure class, and provision base each read the target repo first and fall back to today's exact behavior when derivation is impossible. |

## 4. Mechanics (per component/role)

### Lead — Setup (`skills/war/SKILL.md`)
- **Gate detection step**: alongside the declared gate, detect/propose the target's test-file
  convention and record it as `overrides.testPattern` (confirm together with the gate; `--afk`
  takes the proposal; unknown convention → leave `null`).
- **Docker gate step**: after `docker info`, probe-build each discovered Dockerfile (D). Platform-
  class failures auto-defer that image to the run's backstop set; the residual sentence ("a daemon
  that dies after provision still surfaces as `gate_failed`") is superseded — post-provision docker
  *environment* failures now classify via `gate_failure_class: 'environment'` (E/G).

### Lead — phase dispatch and outcome handling (`skills/war/SKILL.md`, `workflow-template.js`)
- Thread `testPattern` into the per-phase Workflow args (the `plan.gate` precedent).
- REFINE routing on `gate_failed` branches on `gate_failure_class`: `'introduced'` → fix-worker
  loop (unchanged); `'environment'` → escalate, 0 fix rounds, worktree kept; `'baseline'` →
  proceed + append the auto backstop entry to the merged backstop set (flows through
  `handoff.backstops[]` untouched, rendered at every land and in the final PR body).

### Refiner — merge-task / land-phase (`workflow-template.js` dispatched prompts + `agents/war-refiner.md`, same commit)
- Both `assert-test-in-diff.sh` invocations carry `--pattern '<testPattern>'` when set; bare when
  `null`.
- On any gate failure: run the classification procedure (F) — re-run the failing gate at the
  integration base SHA detached in `_refinery`, compare failing identifiers, populate
  `gate_failure_class` in the returned `MergeResult`, and include the base-run evidence in
  `gate_output` (uncurated, per the existing gate-evidence rule).

### `skills/war/assets/war-config.mjs` (+ test)
- `DEFAULTS.overrides.testPattern: null`; validation: `null` or non-empty string (the existing
  overrides string|null rule covers it — add the key and an explicit test).
- `resolveGate` is unchanged — the pattern rides config, not the gate string.

### `skills/war/assets/provision-worktrees.sh` (+ test)
- `cmd_ensure_integration`: implement I. New behavior activates only when `origin/<base>` resolves
  after a fetch; divergence uses `git merge-base --is-ancestor` both ways; the fail-loud path uses
  the existing `die` idiom with stderr captured per the `_tmp_err` convention (not the
  `ensure-origin` stderr-swallowing anti-pattern).

### Schemas (`skills/war/references/schemas.md`, `MERGE_RESULT` in `workflow-template.js`)
- Add `gate_failure_class?` to `MergeResult` (both the schema doc and the inline schema constant).

### `skills/war-room/SKILL.md`
- The overrides enumeration line gains `testPattern` (null = today's floor defaults; a string pins
  the target's test glob set).

## 5. Surface changes (files touched)

- `skills/war/assets/war-config.mjs` + `war-config.test.mjs` — `overrides.testPattern`.
- `skills/war/assets/workflow-template.js` + `workflow-template.test.mjs` — `--pattern` threading
  at both merge-task call sites; `gate_failure_class` in `MERGE_RESULT` and classification prose in
  both merge prompts; class-based REFINE routing; Provision prompt describing the fetch+divergence
  base derivation.
- `skills/war/assets/provision-worktrees.sh` + `provision-worktrees.test.sh` — `ensure-integration`
  fetch + divergence assertion (+ offline fallback).
- `agents/war-refiner.md` — step-4 `--pattern` clause; gate-failure classification procedure;
  land-phase classification (both-surfaces rule; same commit as the template changes).
- `skills/war/SKILL.md` — Setup (testPattern detection; docker probe-build + platform auto-defer;
  supersede the post-provision `gate_failed` residual sentence), Checkpoint/outcome-handling
  (class routing; baseline backstop entry).
- `skills/war/references/schemas.md` — `MergeResult.gate_failure_class`.
- `skills/war/assets/assert-test-in-diff.sh` — header note only (the `--pattern` mechanism already
  exists and is tested; defaults unchanged).
- `skills/war/assets/assert-packaging-in-diff.sh` — header note recording the C audit (no override
  needed; discovery is target-agnostic).
- `skills/war-room/SKILL.md` — overrides enumeration line.
- `CONTEXT.md` — new terms (§6); `docs/adr/` — new ADR (§7).

## 6. New domain terms (CONTEXT.md)

- **test-floor pattern** — the per-run glob set (`overrides.testPattern`) the test floor matches
  task diffs against; pinned at Setup together with the gate so floor ⊆ gate holds on any target
  repo; `null` = the built-in WAR-repo gate-mirror defaults.
- **gate-failure class** — the orthogonal `MergeResult` label on a `gate_failed`
  (`introduced` | `baseline` | `environment`) that routes the failure: fix-worker loop, backstop
  record, or 0-round environment escalation. Class routes; status stays `gate_failed`.
- **baseline gate debt** — a gate failure proven pre-existing at the phase's integration base by
  the refiner's on-failure base re-run; never blocks the diff that didn't cause it; always recorded
  as a `source: 'auto'` backstop entry.
- **provision base divergence** — the local working-branch ref and `origin/<working>` are neither
  equal nor ancestor-related at `ensure-integration` time; a fail-loud halt, never a silent pick.

## 7. Recommended ADRs

- **New ADR (next free number): "Execution values are target-derived with current behavior as the
  fallback."** Covers all four instances (floor pattern from config, docker-gate composition from a
  probe build, gate verdict from a base re-run, provision base from fetched origin) and the routing
  doctrine that class — not status — selects the recovery path. Extends ADR 0006 (floor/gate
  alignment: the pattern and gate are pinned as one decision) and ADR 0008 (divergence repairs
  toward git); deliberately does **not** touch ADR 0005's enum set.

## 8. Open risks / implementation notes

- **Failing-identifier comparison is judgment, not parsing.** The refiner compares failing
  runner/test identifiers between the task run and the base run; a flaky test red in both runs
  misclassifies as `baseline` (recorded in the backstop, so never silent). The predicate must be
  spelled out verbatim in both prompt surfaces.
- **Platform-signature list is a heuristic.** Unmatched variants fall through to `'introduced'` —
  worst case is exactly today's behavior, never a new false-pass.
- **`'baseline'` proceeds on a locally-red gate under `--afk`.** Bounded by: base provably red with
  the same failures, the backstop entry recorded and surfaced at every land and in the final PR,
  and interactive confirmation when not `--afk`.
- **Setup probe builds can be slow** (first build is uncached). Interactive: the operator trims;
  `--afk`: bound each probe with a timeout — on timeout, defer the image to a backstop (never wedge
  Setup).
- **Pattern quoting**: `testPattern` is a space-separated glob token set passed as one
  single-quoted `--pattern` argument inside a string-built prompt; the template test must assert
  the exact rendered string (and the drift-guard must anchor on tokens, not full-line bytes — see
  `shared-string-constant-quote-literal-byte-anchor-fragility`).
- **`ensure-integration` gains a network call.** Fetch failure falls back to today's local-base cut
  with a warning; the test must cover the offline path.
- **Manual-land hygiene remains documented** (a Lead pre-phase sync note in Checkpoint), but
  correctness no longer depends on it — I makes the provision base right even when the operator
  forgot to sync.

## 9. Non-goals / deferred

- **No qemu/`--platform` passthrough** (#576's option 3) — deferred until a real need; the backstop
  defer covers the arch case.
- **No parsing of gate commands to derive test globs** — the pattern is pinned config, proposal-
  assisted at Setup.
- **No CI-status integration** (querying the target's CI to arbitrate gate divergence) — the base
  re-run arbitrates locally; CI remains the named backstop runner.
- **No packaging-floor pattern override** — audited (C); its discovery is already target-agnostic.
- **No new `MergeResult` statuses, land decisions, or hard-escalation reasons.**
- **No retro-editing of the 2026-07-06 container-packaging spec** — it is a decision record; the
  new ADR notes that its §8 post-provision residual is superseded for the environment class.

## 10. Validation criteria (concrete, testable)

1. **`war-config.test.mjs`**: `overrides.testPattern` defaults to `null`; a string validates; a
   non-string/non-null value produces an error naming the key.
2. **`workflow-template.test.mjs` — threading**: with `testPattern` set, **both** merge-task prompt
   strings (initial dispatch and fix-round re-merge) contain `--pattern '<value>'`; with it unset,
   both are byte-identical to today's bare invocations.
3. **`assert-test-in-diff.sh` fixture**: a diff adding only `foo.test.ts` exits 1 bare and exits 0
   with `--pattern '**/*.test.ts'` (regression-guards the existing `--pattern` machinery this spec
   makes load-bearing).
4. **`provision-worktrees.test.sh` — base derivation** (local fixture remote): (a) local behind
   origin → integration branch cut at the origin tip and the local follower fast-forwarded;
   (b) local == origin → behavior unchanged; (c) local ahead → cut from local; (d) diverged →
   non-zero exit with both SHAs in the die message, no branch created; (e) fetch fails / no origin
   → local-base cut succeeds with a warning on stderr.
5. **Schema + routing**: `MERGE_RESULT` and `schemas.md` list `gate_failure_class` with exactly the
   three values; a `workflow-template.test.mjs` routing test shows `gate_failed` +
   `'environment'` → escalation with no fix-worker prompt built (0 rounds), and `gate_failed` +
   `'baseline'` → merge proceeds and a `source: 'auto'` baseline entry appears in
   `handoff.backstops[]`; absent class → today's fix-loop routing (delete-the-feature check: each
   assertion fails if the classification branch is removed).
6. **Both-surfaces drift guard**: a test asserts `agents/war-refiner.md` names `--pattern`, the
   three `gate_failure_class` values, and the base re-run step wherever the dispatched prompts do
   (token-anchored, sentence-case-tolerant).
7. **Deferred validations (backstops for the eventual plan)**: on a live external-repo
   `/war-campaign` — (a) arm64 host + x64-pinned Dockerfile: Setup defers the image to a backstop
   and no task returns a docker `gate_failed`; (b) a repo with pre-existing typecheck debt: phases
   land with `baseline` labels and rendered backstop entries, no manual out-of-band land;
   (c) an operator manual land between phases: the next phase's provision cuts from the origin tip
   and no worker starts without prior-phase code. Runner: the next `/war-campaign` against an
   external target repo (needs a live multi-phase run; not unit-testable).
