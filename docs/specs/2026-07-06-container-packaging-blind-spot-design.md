# Container-packaging blind spot — packaging floor, opt-in docker gate, ratified backstops

Ratified 2026-07-06 (grill-with-docs session). Companion ADR:
[0017](../adr/0017-packaging-floor-docker-gate-ratified-backstops.md).

## 1. Context — the gap / problem

Field incident (external WAR user, 2026-07-06): a WAR-executed PR added `case_metadata.py` beside
`loader.py`; the loader's Dockerfile COPYs its Python deps **individually** and was never updated.
Unit gate green, unanimous audit, merged — then the *image* crash-looped in the deploy pipeline
(`FileNotFoundError: /app/case_metadata.py`, 244 failed tasks, a CFN stack hung ~95 min). Unit tests
passed because in the repo tree the file sits next to `loader.py`; only the container exposes the
miss.

Two distinct failures:

1. **No mechanism exercises the deployable artifact.** WAR's gate is repo-unit-scoped (lint + unit
   suites + discovered `*.test.sh`). A Docker image whose Dockerfile enumerates `COPY` lines
   file-by-file is a surface nothing pre-merge ever touches.
2. **"Out of scope" had no forcing function.** The Lead flagged Docker/integ testing as out-of-scope
   backstop in free prose. Nothing ratified that waiver, nothing scheduled the backstop, nothing
   surfaced it at land time. Declared ≠ scheduled ≠ surfaced.

## 2. Pivotal constraints

- **Auditors are read-only** (`validate-auditor-git.sh` fail-closed guard) — they can never run
  `docker build`. Execution evidence belongs to worker/refiner only.
- **The gate is one string run verbatim** — one resolved string, no per-site variants. The literal
  string is threaded into the worker, refiner merge-task, no-test retry, polish, and land prompts;
  fix-worker and ace prompts are instructed to "keep the gate green" against that same string.
  Per-task or per-phase gate variance breaks the refiner's run-VERBATIM contract; docker in the
  gate is all-or-nothing per run.
- **Daemon absence is environmental.** A gate containing `docker build` on a machine with no docker
  daemon would report `gate_failed` — blaming the *code*. Environment failures must classify as
  environment (`env-blocked` / backstop), mirroring the existing provision doctrine.
- **Floors are tested shell** (ADR 0006 idiom): the Workflow sandbox has no shell, self-reports are
  circular, so enforcement is a deterministic script with the `0` pass / `1` routed-miss / `2`
  git-error exit contract, run by the refiner who already has shell at merge-task.
- **Status-enum widening ripples** — a new merge outcome must land in *both* hand-mirrored
  `HARD_ESCALATION_REASONS` copies (`workflow-template.js`, `land-decision.mjs`) plus the drift
  guard, or it silently widens/narrows the land path.
- **Plans carry no backstop slot today.** Out-of-scope exists only at spec level (`## 9. Non-goals /
  deferred`); the plan template's nearest home is `## Notes / conscious deviations` — marked
  "(ratify in /red-team)", but red-team has no specific check for it and nothing surfaces it at
  land time.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| D1 | Enforcement layers | All three: **packaging floor** (deterministic, always-on) + **opt-in docker-build gate** (definitive, operator-accepted) + **ratified backstop** (honesty layer). A built-in `packaging` audit lens was considered and **not built** — the lens namespace is already open; the Lead may mint one ad hoc. |
| D2 | Floor trigger rule | COPY-sibling heuristic: flag an **added/renamed** file that sits in a Dockerfile's build context, whose Dockerfile COPYs ≥1 of the file's directory-siblings **individually**, where no COPY/ADD source covers the file and `.dockerignore` does not exclude it. |
| D3 | Floor clearances | Three, all one-line: add the `COPY` line; add the path to `.dockerignore` (repo-native — docker itself respects it); or Lead sets `requiresPackaging: false` at decompose. |
| D4 | Floor placement | New tested shell guard `assert-packaging-in-diff.sh`, sibling of `assert-test-in-diff.sh`, run by the refiner at merge-task, exit contract 0/1/2. |
| D5 | Floor-miss routing | New merge outcome **`unpackaged`**, mirroring `no-test`: bounded fix-worker + **full** re-audit + re-merge on the shared `fixRounds` budget; exhaustion escalates `unpackaged` as a hard reason. |
| D6 | Docker gate declaration | Extend `/war` Setup's existing ask-once gate detection: Dockerfiles present → probe `docker info`; reachable → propose appending `docker build -f <each> <ctx>` to the **declared base** (operator confirms/trims); stored in `overrides.gate`. **No new config key**; `resolveGate()` untouched. |
| D7 | Daemon unreachable | The docker gate **degrades into an auto-recorded backstop** ("docker build — daemon unavailable at setup"), surfaced like any other unexecuted backstop. Never `gate_failed`. Under `--afk`: include all buildable Dockerfiles when the daemon answers; auto-backstop when it doesn't. |
| D8 | Backstop declaration | Plan template gains a **required** section `## Deferred validations (backstops)` — entries carry *check / why deferred / external runner*; explicit `None` allowed — locked by `war-strategy-structure.test.sh`. |
| D9 | Backstop enforcement | Full depth: `/red-team` backstop-legitimacy check; mandatory "Unexecuted backstops" line in every phase report + the final PR body; Lead never-waive rule; **machine-readable** `backstops[]` on the handoff block and aggregated by the campaign ledger. |
| D10 | Fail direction | An unparseable `.dockerignore` pattern (incl. `!` negations) is treated as **not excluding** — the floor flags when unsure. Fail-closed, self-correcting via the one-line clearances. |
| D11 | Naming | `requiresPackaging` (positive, default-on — the `requiresTest` convention), `unpackaged` (outcome), **Packaging floor**, **Backstop** (glossary terms applied to CONTEXT.md with this spec). |

## 4. Mechanics

### 4.1 Packaging floor — `assert-packaging-in-diff.sh`

Interface mirrors `assert-test-in-diff.sh`: `assert-packaging-in-diff.sh <integrationBranch>
<taskBranch>`, diff = `git diff --name-status <base>...<branch>` (three-dot), **added (`A`) and
rename-target (`R`) paths only** — deletions and pure modifications never flag (removing a file a
Dockerfile still COPYs is a *build* failure the docker gate or CI catches).

Per added file `F`, per Dockerfile `D` (any file matching `Dockerfile` / `Dockerfile.*` /
`*.Dockerfile`, excluding `node_modules/` and `.git/`) whose directory is an ancestor of (or equal
to) `F`'s directory:

1. **Enumerated-COPY style?** `D` contains ≥1 `COPY`/`ADD` instruction whose source is a **literal
   file path** (no wildcard, not a directory) resolving into `F`'s directory. No such line → this
   `D` never flags `F` (whole-dir `COPY dir/ .` and `COPY . .` styles are self-maintaining).
2. **Covered?** `F` is matched by any `COPY`/`ADD` source in any stage — literal, wildcard glob
   (`COPY *.py .`), or a directory copy whose tree contains `F`. Covered → pass.
3. **Excluded?** the context root's `.dockerignore` matches `F` under the supported subset: literal
   paths, directory prefixes, single-segment `*` globs, `**`. Unsupported/unparseable lines (incl.
   `!` negations) are treated as not excluding (D10). Excluded → pass.
4. Otherwise **flag** `F → D`.

`COPY --from=…` sources are not build-context reads — ignored. Build context is assumed to be the
Dockerfile's own directory (`# ponytail: context = Dockerfile dir; pipelines passing a foreign
context root mis-scope — the docker gate is the definitive check`).

Exit `0` = nothing flagged (incl. the trivial no-Dockerfile case); exit `1` = flagged pairs listed
on stdout; exit `2` = git/ref error (never misclassified as a miss). Ships with its own
`assert-packaging-in-diff.test.sh`.

**Refiner merge-task**: runs the floor alongside the existing pre-merge checks whenever
`requiresPackaging !== false` (independent of `requiresTest`; like the submodule floor it is not
coupled to the test flag). Exit 1 → status `unpackaged`, do NOT merge.

### 4.2 `unpackaged` routing

`no-test`-shaped routing: a bounded fix-worker dispatch ("package it or dockerignore it — never
delete the file to satisfy the floor") sharing the task's `fixRounds` budget → **full** audit-panel
re-audit (the floor cannot judge whether dockerignoring the file was *right*; the panel can) →
re-merge with the floor re-run. Budget exhaustion → hard escalation reason `unpackaged`, added to
**both** `HARD_ESCALATION_REASONS` mirrors + the drift guard. `requiresPackaging: false` skips are
logged, never silent (the `requiresTest:false` logging idiom).

**Cross-floor composition** — not a blind copy of the `no-test` sub-loop: today that loop's retry
merge hard-escalates any unexpected status verbatim, so a task tripping **both** floors (adds a
source file with no test *and* no COPY — the plausible worker-omission shape) would clear one floor
and then hard-escalate on the other, never getting its bounded fix. The implementation therefore
uses **one combined floor-retry sub-loop**: a retry merge returning *either* floor status routes
another bounded fix-worker (same shared budget, same full re-audit) until both floors pass or the
budget exhausts. Every dispatched retry-merge prompt re-instructs **all** floor invocations —
test, packaging, submodule — keeping the dispatched prompts in sync with the standing
`war-refiner.md` steps (the standing-vs-dispatched coverage-split lesson).

**Polish sweep**: the phase-close polish merge skips the packaging floor exactly as it skips
`assert-test-in-diff.sh` (a coherence sweep has no task fields to consult) — the skip is explicit
in the polish merge prompt, not left to fall into the discard arm.

### 4.3 Opt-in docker gate — Setup extension

`/war` Setup gate-detection gains: after resolving the declared base, discover Dockerfiles; if any
exist, probe `docker info` (short timeout).

- **Reachable** → propose appending `docker build -f <dockerfile> <its dir>` per Dockerfile to the
  declared base; the operator confirms or trims the image list (slow images are the trim case); the
  accepted string is recorded in `overrides.gate` and flows through `--resolve-gate` untouched. The
  gate stays **one string, verbatim, everywhere**; docker's layer cache keeps repeat builds cheap.
  When accepted, also offer pinning `docker info` as the first `run.provision` step — daemon
  absence **before a worker spawns** then classifies as `env-blocked` (environment), not
  `gate_failed` (code). Residual: a daemon that dies *after* provision (mid-merge, at land) still
  surfaces as `gate_failed` — see §8.
- **Unreachable** → do not add it; auto-record a backstop entry *"docker build (daemon unavailable
  at setup)"* into the run's backstop set, surfaced with the plan-declared ones (§4.4).
- `--afk`: no ask — include all buildable Dockerfiles when the daemon answers; auto-backstop when it
  doesn't.

The floor (§4.1) and this gate share one Dockerfile discovery expression, mirroring the ADR 0006
floor/gate-alignment consequence.

### 4.4 Ratified backstop

**Declaration** — plan template (war-strategy §2) gains a required section:

```
## Deferred validations (backstops)   ← ratify in /red-team; surfaced at every land
  - <check — command or description> · why deferred: <reason> · runner: <what executes it, when>
  (or exactly: None)
```

`war-strategy-structure.test.sh` locks the section into the template. Explicit `None` keeps absence
unambiguous.

**Extraction** — the Lead parses the section's entries and threads `args.backstops` as
**array|null** of `{ check, why, runner, source: 'plan' | 'auto' }` — the Lead is the single
normalization point: plan-declared entries (an unparseable line is carried whole as `check`, never
dropped) **plus** any Setup auto-recorded entries (§4.3) are merged here before threading, and the
Workflow passes the array through to `handoff.backstops[]` untouched. A legacy plan without the
section → `null`, and the phase report notes "no backstop section (pre-ratified-backstop plan)";
interactive runs ask at the approval gate.

**`--afk`-authored plans** — a plan authored by `/war-machine --afk` has no operator to ratify its
backstops. Mirroring ADR 0014's AI-Commander's Intent provenance rule, its backstop section is
**AI-declared**: the drafter marks the section heading (`## Deferred validations (backstops —
AI-declared)`), the marker survives extraction (`source: 'plan'` entries carry `aiDeclared: true`),
and every surfacing renders it — an AI-declared waiver is never displayed as operator-ratified.

**Ratification** — `/red-team` gains a backstop-legitimacy check: per entry, is the deferral
justified, does a cheap pre-merge proxy exist (e.g. the packaging floor covers the COPY half of a
deferred "docker build"), and are runner + timing named? Failures route through the normal
plan-patch loop.

**Surfacing** — the phase report template and the final PR body gain a mandatory **"Unexecuted
backstops"** line rendering `args.backstops` plus any auto-recorded entries (§4.3). The handoff
block gains `backstops[]` (schemas.md), and the campaign ledger aggregates them across plans so a
Hopper run's final state shows every validation the whole campaign deferred.

**Never-waive rule** (Lead prose, `/war` SKILL): a validation that is in neither the gate, a floor,
nor the plan's backstop section may not be waived in prose mid-run — escalate to the operator
instead. This is the behavioral fix for failure (2) in §1.

## 5. Surface changes

| Surface | Change |
|---------|--------|
| `skills/war/assets/assert-packaging-in-diff.sh` (+ `.test.sh`) | **New** floor guard + its suite |
| `skills/war/assets/workflow-template.js` | **every** dispatched merge prompt — main + each floor-retry (the template has more than one) — gains the floor invocation + `unpackaged` status; combined floor-retry sub-loop (§4.2), `HARD_ESCALATION_REASONS`, `requiresPackaging` resolution + logged skip, polish-merge explicit floor skip, `args.backstops` pass-through to handoff `backstops[]` |
| `skills/war/assets/land-decision.mjs` | `HARD_ESCALATION_REASONS` mirror + drift-guard expectation |
| `agents/war-refiner.md` | merge-task step for the floor; MergeResult status enum gains `unpackaged`; step-5 "two fail-closed pre-merge gates" note becomes three |
| `skills/war/SKILL.md` | Setup docker probe/offer + provision `docker info` offer, decompose `requiresPackaging`, backstop extraction, never-waive rule, phase-report "Unexecuted backstops" |
| `skills/war/references/schemas.md` | task `requiresPackaging`, MergeResult `unpackaged`, handoff `backstops[]` |
| `skills/war-strategy/SKILL.md` (+ structure test) | plan template backstop section + `requiresPackaging` task field |
| `skills/red-team/SKILL.md` | backstop-legitimacy check |
| `skills/war-campaign/` (ledger + SKILL) | `backstops` aggregation across plans |
| `skills/war-machine/SKILL.md` | `--afk` drafter authors the backstop section with the AI-declared marker (§4.4) |
| `CONTEXT.md` | 4 glossary entries — **applied with this spec** (operator-accepted that the glossary briefly leads the implementation) |
| `docs/adr/0017-…` | authored with this spec |

Exact intra-file anchors are re-verified at `/war-strategy` conversion (plan line-number refs go
stale; use construct locators).

## 6. New domain terms (CONTEXT.md)

`Packaging floor`, `requiresPackaging`, `unpackaged`, `Backstop` — full entries applied to
CONTEXT.md § Test discipline in this change (see D11).

## 7. Recommended ADRs

[ADR 0017 — packaging floor, opt-in docker gate, ratified backstops](../adr/0017-packaging-floor-docker-gate-ratified-backstops.md),
authored alongside this spec (trade-off live: heuristic floor + opt-in gate + ratified backstop
vs. a mandatory docker-build gate).

## 8. Open risks / implementation notes

- **`.dockerignore` subset semantics** — fail-closed by D10; ceiling documented in the script;
  upgrade path is a fuller parser only if false positives annoy in practice.
- **Context-root assumption** (context = Dockerfile's dir) — a pipeline building with `-f` from a
  foreign context root mis-scopes the floor. Deliberate ceiling; the docker gate is the definitive
  check when enabled.
- **Floor is heuristic by design** — the ADR 0006 posture: the floor catches the enumerated-COPY
  class; wholesale-COPY Dockerfiles are self-maintaining; everything else is the docker gate's or a
  declared backstop's job. A floor pass is *not* proof the image builds.
- **Enum widening** — `unpackaged` must land in both mirrors + drift guard + tests in the same task
  (prior lesson: shared enum widening silently widens the land path).
- **Fix-worker anti-cheat** — the `unpackaged` fix prompt must forbid deleting the added file to
  clear the floor (sibling of never-delete-tests-to-green-the-gate).
- **Gate slowness on large images** — operator trims at the Setup ask; layer cache bounds repeats.
- **Legacy plans** — no backstop section → `args.backstops = null`, surfaced note; the structure
  test binds newly authored plans only.
- **Mid-run daemon death** — the `docker info` provision pin classifies daemon absence only
  *before* a worker spawns; a daemon dying between provision and a merge-task/land gate still
  reads `gate_failed`. Accepted residual (rare, self-evident from the gate output); an env-vs-code
  triage at gate failure is a future refinement, not in scope.
- **Term collision** — "backstop" already names the ace's release-slot *string backstop* (ADR 0013
  D5), an in-run deterministic check. The glossary entry disambiguates; prose touching the
  never-waive rule must say *deferred validation* or *plan backstop section* where ambiguity bites.

## 9. Non-goals / deferred

- Running integration tests, compose stacks, or deploy smoke tests pre-merge — true backstop
  territory; declare them.
- A built-in `packaging` roster lens (namespace is open; mint ad hoc if wanted).
- Image push/pull, registry auth, image scanning, runtime health checks.
- Full `.dockerignore` / BuildKit semantics (`!` negations, `--mount`, heredocs).
- Non-Docker packaging manifests (pip `MANIFEST.in`, npm `files`, cargo `include`) — the same
  failure class; candidate future floors, covered meanwhile by declared backstops.

## 10. Validation criteria

1. `assert-packaging-in-diff.test.sh` — each case fails without the feature (delete-it-mentally
   check): incident repro (added file beside enumerated COPYs, no COPY → exit 1, pair listed);
   `test_loader.py` excluded via `.dockerignore` → exit 0; wildcard `COPY *.py .` coverage → exit 0;
   `COPY . .` whole-dir → exit 0; `COPY --from` source ignored; no Dockerfile → exit 0; bad ref →
   exit 2; unparseable `.dockerignore` line → still exit 1.
2. `workflow-template` suite — `requiresPackaging:false` skips the floor with a logged skip;
   `unpackaged` routes fix-worker + full re-audit + re-merge on the shared budget; exhaustion →
   `held:escalation`; a task tripping **both** floors gets bounded fixes for each (combined
   sub-loop — no immediate hard escalation on the second floor's status); the polish merge prompt
   carries the explicit packaging-floor skip.
3. `land-decision` suite + drift guard — `unpackaged` present in both mirrors.
4. `war-strategy-structure.test.sh` — plan template carries the backstop section + `requiresPackaging`.
5. Gate-string invariance — the resolved gate with docker appended is byte-identical at every
   execution site (no per-site variants).
6. Phase report / PR body render "Unexecuted backstops" whenever `args.backstops` is non-empty
   (auto-recorded entries are merged in by the Lead before threading, so one rendering path covers
   both); handoff block carries `backstops[]`; AI-declared entries render their marker.
