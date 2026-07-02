# Open-Issue Remediation Roadmap — 15 issues → 5 design specs

Index for the design specs that close the **15 currently-open issues** in `Ljferrer/WorkAuditRefine`. Grouping
decided 2026-06-26 by an inspect → cluster → spec → completeness-critic agent run (22 agents). Each open issue was
re-verified against HEAD (live repo is **v0.6.5**) before clustering; every cited file/anchor was confirmed (or
re-anchored by construct where line numbers had drifted). **Per-spec version bump, landed in series.**

The specs live in [`../specs/`](../specs/):

| # | Spec | Issues | Sev | Ver (assigned) | Validity at HEAD |
|---|------|--------|-----|----------------|------------------|
| 1 | [Red-team verdict integrity](../specs/2026-06-26-red-team-verdict-integrity.md) | #49, #50, #85 | HIGH | **v0.6.6** | all still-valid |
| 2 | [Scheduler & land bookkeeping correctness](../specs/2026-06-26-scheduler-land-bookkeeping-correctness.md) | #99, #113, #115 | HIGH | **v0.6.7** | all still-valid |
| 3 | [Guard fidelity & test hermeticity](../specs/2026-06-26-guard-and-test-hermeticity.md) | #95, #102 | MED | **v0.6.8** | still-valid (#95 partial — see below) |
| 4 | [Audit-fidelity doc-drift & test-polish sweep](../specs/2026-06-26-audit-fidelity-doc-test-polish-sweep.md) | #117, #125, #127, #136, #151, #160 | LOW/NIT | **v0.6.9** | mostly still-valid; #117/#136/#160 partially-swept |
| 5 | [Committed provisioning manifest (Part B D4)](../specs/2026-06-26-committed-provisioning-manifest.md) | #51 | FEATURE | **v0.7.0** | feature-design-needed |

> **Authoritative version source.** Each spec internally proposes a standalone `v0.6.6` (the bump it would take if
> it landed directly on the current `v0.6.5`). That literal is a *proposal* — exactly as the F01–F12 specs each
> proposed a version that the [prior roadmap](2026-06-25-audit-remediation-roadmap.md) sequenced. **This roadmap's
> `Ver (assigned)` column is authoritative.** Because all five specs REPLACE-in-place the same four canonical
> version slots (`.claude-plugin/plugin.json` `version`; `.claude-plugin/marketplace.json` `metadata.version` AND
> `plugins[0].version`; `README.md` `## Status`), only one spec can be any given version — they MUST land serially,
> each Release task taking the next number and stacking its `## Status` paragraph on the prior. Do **not** run them
> as concurrent WAR branches: they would rebase-conflict on the four shared version slots.

## Grouping principles

1. **Co-group same-subsystem / same-root-cause findings** so each spec is one cohesive WAR run and same-file
   findings serialize as dependent *tasks* (not cross-spec rebase conflicts).
2. **Split bundle issues by theme.** The six follow-up bundles (#117/#125/#127/#136/#151/#160) each enumerate
   several nits; their sub-items were assigned individually. In this clustering all of them landed in the single
   audit-fidelity sweep (spec 4) because every sub-item is doc-drift or test-polish on `war-config.test.mjs` /
   `workflow-template.js` / agent-docs — one cohesive sweep beats scattering nits across four specs.
3. **Behavioral correctness before cosmetic drift.** The two HIGH specs (red-team verdict, scheduler bookkeeping)
   fix happy-path-blocking / silent-wrong behavior; they land before the LOW polish sweep.
4. **Feature last.** #51 is the only net-new capability (a committed provisioning manifest); it needs its own design
   ratification (`/red-team` on the spec's Phase 0) and takes the minor bump.

## Spec summaries

### Spec 1 — Red-team verdict integrity {#49, #50, #85} · v0.6.6 · *unblocks `/red-team`; land first*
- **#49 (MAJOR):** `workflow-scaffold.js:36` destructures `args` as an object, but the Workflow tool can deliver it
  as a **JSON string** → fingerprint guard throws before any probe runs. Fix: parse-if-string normalize (try/catch,
  guard message preserved).
- **#50 (MAJOR), defense-in-depth:** probes file *confirmations* as Critical/Major findings AND `red-team-gate.mjs`
  `classify()` counts every Critical/Major as a blocker without consulting parent-probe `status` → clean plans
  report BLOCKED. Fix: (a) reword `runProbe`/`FINDINGS` so a finding means a **defect** (clean probe ⇒ `findings:[]`);
  (b) thread parent `status` through `allFindings()`; (c) `classify()` blocks a Critical/Major finding **only** when
  parent `status !== 'pass'` (absent ⇒ blocks, back-compat); `needsDecision:true` always blocks.
- **#85** is the umbrella; the spec **consolidates its already-written solution/decision doc** rather than re-deriving.
- **Files:** `skills/red-team/assets/{workflow-scaffold.js, red-team-gate.mjs}` + their `*.test.mjs`, `SKILL.md`.
  **No file overlap with specs 2–5** except the four version slots. **Clean isolated lane.**

### Spec 2 — Scheduler & land bookkeeping correctness {#99, #113, #115} · v0.6.7
- **#99 (MAJOR):** `landDecision` stays `'landed'` when the land STEP returns `error`/`gate_failed` → Lead is told a
  failed land succeeded. Fix: demote to `held:land-failed` on those statuses.
- **#115 (MAJOR):** a phantom / out-of-phase `dep` id silently prevents a task from ever running (never escalated).
  Fix: post-loop, surface any `!done.has(t.id)` task as an `unrunnable-deps` escalation.
- **#113 (NIT):** `auditLog.requested` is `undefined` for env-blocked / worker-blocked early returns. Fix: add
  `expected:0` so rows record `requested:0`.
- **Files:** `skills/war/assets/workflow-template.js` (phase-loop + LAND regions) + `workflow-template.test.mjs`.
  **Shares `workflow-template.js` with spec 4** (disjoint regions) — see contention table.

### Spec 3 — Guard fidelity & test hermeticity {#95, #102} · v0.6.8
- **#95 (MAJOR, test-fidelity):** `validate-worktree-scope.test.sh` case 11 is non-hermetic — it finds a `.war-task`
  ancestor when the refiner runs the gate in-worktree, flipping the relative-path denial to ALLOW → spurious
  `gate_failed`. Fix: make case 11 hermetic (run from a temp dir guaranteed to have no `.war-task` ancestor).
  **PARTIAL by design** — see Coordination decisions.
- **#102 (MINOR):** `refinery-surface.test.sh` absence-guard scans `checkout origin/` without `--detach` but misses
  the equivalent `git switch origin/<working>` (no `--detach`). Fix: also scan `switch ` lines referencing
  `origin/<working>`.
- **Files:** `hooks/validate-worktree-scope.test.sh`, `skills/war/assets/refinery-surface.test.sh`. **No overlap
  with specs 1/2/4/5** except version slots. **Clean isolated lane.**

### Spec 4 — Audit-fidelity doc-drift & test-polish sweep {#117, #125, #127, #136, #151, #160} · v0.6.9
- One drift sweep retiring every residual nit/minor from the F03–F12 wave: tighten loose test assertions to
  structural forms (#117 worker-tests threading, #136 git-stderr token, #127 allowlist catch-all + decideLand
  matrix cells), narrow the node-breadth walk to `.test.mjs` and prune `.claude/worktrees` (#125, #127), delete dead
  imports/vars (#125 `statSync`), correct stale comments/titles/attribution (#160 `workflow-template.js:26`,
  validate-auditor-git.sh `tr` escape, #117 drift-guard comment, #151 ADR row), and reconcile `covenPolicy: auto→all`
  doc-drift (#160: `SKILL.md:27`, `war-room-design.md`).
- **Files:** `skills/war/assets/war-config.test.mjs`, `workflow-template.js` (**only the `:26` header comment** —
  disjoint from spec 2), `SKILL.md`, `validate-auditor-git.sh`, `docs/specs/2026-06-18-war-room-design.md`, ADR 0002.
- **Partially-swept at HEAD:** #117/#136/#160 each had a sub-item already addressed by the merged wave; the spec's
  inspection re-confirmed which sub-items remain live.

### Spec 5 — Committed provisioning manifest {#51} · v0.7.0 · *feature; design-first; land last*
- Promote a **committed, repo-owned provisioning manifest** to a first-class authority-level-1 signal that both
  `/war` and `/red-team` read directly (`provisionSource: 'manifest'`). The Part B groundwork is **already live** —
  `PROVISION_SOURCES` reserves `'manifest'`, `resolveProvision`/scout/`env-blocked` exist — so `'manifest'` is a
  *reserved-but-unemitted* enum today. Undecided pieces: manifest **format + location + authority semantics**.
- **Phase 0 of the spec must be ratified via `/red-team` before `/war`.**
- **Files:** `skills/war/assets/war-config.mjs` (`PROVISION_SOURCES`/scout), `skills/_shared/provision.mjs`, manifest
  reader + tests, docs. Minor bump (net-new capability).

## Dependency spine (strict landing order)

```
Spec 1 ──► Spec 2 ──► Spec 4        (Spec 3 independent; Spec 5 last)
red-team   scheduler   doc-sweep
```

- **2 → 4:** both write `workflow-template.js`. Spec 2 rewrites the phase-loop + LAND body; spec 4 rewords the
  `:26` file-header comment. Regions are **disjoint** (no semantic conflict) but it is the same file — land spec 2
  first so spec 4's comment reword stacks cleanly with zero rebase churn.
- **1, 3** are file-independent of everything except the four version slots; their position is fixed only by the
  version-serialization rule (1 land first to unblock `/red-team`; 3 after 2 by severity).
- **5** lands last: it is a feature (minor bump v0.7.0) and is design-first (ratify Phase 0 before building).

Roadmap order (1, 2, 3, 4, 5) satisfies the spine and the version stack.

## Shared-file contention

| File | Specs that edit it | Conflict risk |
|---|---|---|
| four version slots (`plugin.json`, `marketplace.json` ×2, `README ## Status`) | **1, 2, 3, 4, 5** | 🔴 REPLACE-in-place — MUST serialize (handled by ordered versions) |
| `skills/war/assets/workflow-template.js` | 2 (loop/LAND), 4 (`:26` comment) | 🟠 disjoint regions — land 2 before 4 |
| `skills/red-team/assets/*` | **1 only** | 🟢 isolated lane |
| `hooks/validate-worktree-scope.test.sh`, `refinery-surface.test.sh` | **3 only** | 🟢 isolated lane |
| `skills/war/assets/war-config.test.mjs` | **4 only** | 🟢 (intra-spec task serialization) |
| `skills/war/assets/war-config.mjs`, `skills/_shared/provision.mjs` | **5 only** | 🟢 isolated lane |

Apart from the version slots (resolved by ordered versions) and the disjoint `workflow-template.js` touch (resolved
by landing 2 before 4), the five specs are **file-independent** — much cleaner than the F01–F12 wave, which had four
plans fighting over `workflow-template.js` core functions.

## Coordination decisions (from the completeness critic)

1. **Version serialization — RESOLVED.** Ordered versions assigned v0.6.6 → v0.7.0 (table above). Each Release task
   takes its roadmap-assigned number, not the spec's literal `0.6.6`. Land in roadmap order so each `## Status`
   replace stacks on the prior. (Memory: `stacked-per-branch-releases-make-main-lag-cumulative`,
   `release-status-is-replace-slot-not-empty-field`.)
2. **#95 is PARTIAL by design — DECISION: defer the refiner-cwd bullet.** Issue #95 lists three fix options; the
   author's own preference is **(a) make case 11 hermetic** (delivered by spec 3) and only **"consider"** (b) moving
   the refiner's gate to a non-`.war-task` location (`war-refiner.md` — "Run the gate in `<taskWorktree>`"). The
   test-hermeticity fix fully removes the spurious `gate_failed`. **Spec 3 closes #95's test bullet; the refiner-cwd
   change is deferred to a tiny follow-up** (file it at spec-3 close — do **not** silently drop it). *Operator may
   override to pull the refiner change into spec 3 if a fully-closed #95 is preferred.*
3. **Deferred sub-items kept open-with-note, not silently closed.** Spec 4 marks two sub-items deferrable — #117's
   optional `war-auditor.md` execution-evidence-lens doc note, and #160 T2b (reorder `hooks.json` so the auditor-git
   guard precedes the warn-hook; functionally irrelevant). The WAR run must close those issues **with a note** on the
   deferred bullet rather than implying full coverage.

## Coverage proof (all 15 open issues addressed)

| Issue | Spec | Coverage |
|---|---|---|
| #49 | 1 | full |
| #50 | 1 | full |
| #85 | 1 | full (umbrella) |
| #99 | 2 | full |
| #113 | 2 | full |
| #115 | 2 | full |
| #95 | 3 | full (test) + deferred refiner-cwd follow-up |
| #102 | 3 | full |
| #117 | 4 | full (1 optional sub-item deferred-with-note) |
| #125 | 4 | full |
| #127 | 4 | full |
| #136 | 4 | full |
| #151 | 4 | full |
| #160 | 4 | full (1 nit sub-item deferred-with-note) |
| #51 | 5 | full (design-first; ratify Phase 0) |

No issue is recommend-close: the critic re-verified every cited defect is still live at HEAD (or a genuinely
deferred feature). No spec needlessly re-fixes already-shipped work.

## How each spec gets built
- House format (Summary / Problem statement with verified anchors / Design / Decision record / Phase→Task /
  Test plan / Out of scope / Coverage table), strict TDD slices (failing test → run → implement → run → commit).
- **Gate** = the full self-discovering multi-runner (the F12 lesson):
  `node --test 'skills/**/*.test.mjs'` (quote the glob — bash 3.2 under-covers unquoted) + every `*.test.sh` runner.
- Each spec re-anchors line-refs by **construct** at draft time; workers re-confirm at execution.
- **Ratify each spec with `/red-team` (operator-run) before `/war`.** Spec 5 especially — its Phase 0 design (manifest
  format/location/authority) is the only undecided surface.

## Execution recommendation
- **Run serially in roadmap order via WAR** (`/war <spec> --working dev --landing master`), 1 → 2 → 3 → 4 → 5. WAR
  is the agent-team + merge-queue; it parallelizes **within** each spec (task waves) at the correct granularity for
  this contention profile.
- The two clean isolated lanes (spec 1 = `skills/red-team/*`; spec 3 = the two `hooks` test files) could in
  principle run concurrently with the spine — but the shared version slots make true concurrency not worth the
  coordination cost; serial-by-version is simpler and conflict-free.
