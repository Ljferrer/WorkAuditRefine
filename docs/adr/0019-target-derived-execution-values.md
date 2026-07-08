# Execution values are target-derived with current behavior as the fallback

**Status:** accepted (design ratified 2026-07-07; implementation tracked by the spec below)

Four separate frictions from one live `/war-campaign` against an external TypeScript monorepo on an
arm64 host — a test floor that refused a real, gate-passing `.test.ts` after full Work+Audit approval
(#574), a docker gate that read a host-arch mismatch as broken code (#576), a gate with no notion of
failures already red at the base (#577), and a provision step that cut a phase base from a stale local
ref (#578) — all trace to **one** root assumption: WAR's gate, floors, docker gate, and provision base
were tuned to *this* repo's conventions and degrade on any target repo that differs. Each burned maximum
spend before the hold. A future reader will ask why four mechanisms that look unrelated landed under one
ADR, and why the fix is "read the target, fall back to today" rather than four independent patches. This
records it. Full mechanics: [the design spec](../specs/2026-07-07-target-repo-agnostic-execution-design.md).

## Decision

**Every execution value WAR derived from *this* repo's conventions instead reads the target repo first
and falls back to today's exact behavior when derivation is impossible.** The fallback is not a degraded
mode — it is byte-identical to current behavior, so an absent or unresolvable target value never changes
what WAR does. Four instances:

1. **Test-floor pattern — from config, threaded like the gate.** The test floor's match set is a per-run
   `overrides.testPattern` glob set, proposed at Setup *together with* the declared gate (one decision,
   so floor ⊆ gate holds) and threaded into the phase Workflow args like `plan.gate` — never parsed out
   of the gate command (the globs live in the target's vitest/jest/pytest config, not the command line).
   `null` (the default) = today's hardcoded gate-mirror defaults, byte-identical. The gate's unconditional
   `*.test.sh` discovery arm is unioned into any custom pattern, so a `.test.sh` suite always satisfies
   the floor and floor ⊆ gate survives.

2. **Docker-gate composition — from a probe build.** Setup probe-builds each discovered Dockerfile once
   (bounded by the Lead's Bash-tool timeout) before appending its `docker build` segment to the gate. A
   failure matching the platform-mismatch signature set (`EBADPLATFORM`, `no matching manifest for
   <platform>`, `exec format error`) auto-defers *that image* to a `source: 'auto'` backstop (runner: the
   target repo's CI) rather than baking a doomed segment into every task's gate. Any other probe failure
   is surfaced (interactive) or deferred with the failure recorded (`--afk`); unmatched signatures fall
   through to today's behavior — never a new false-pass.

3. **Gate-failure verdict — from an on-failure base re-run.** When the gate fails at merge-task or land,
   the refiner re-runs the *failing* gate at the classification base and labels the failure
   `introduced` | `baseline` | `environment` (see the class-routes doctrine below). Green gates pay
   nothing; the cost lands only on the failure path.

4. **Provision base — from fetched origin.** `cmd_ensure_integration` fetches `origin/<base>` before
   cutting a phase's integration branch. Equal → unchanged; local behind → cut at the origin tip with a
   guarded follower fast-forward; local ahead → cut from local; **true divergence → a fail-loud halt**
   carrying both SHAs and the two repair directions, no branch created (ADR 0008: repair toward git,
   never a silent pick). Fetch failure / no origin → today's local cut plus a stderr warning (the offline
   fallback = current behavior).

**Class routes the recovery, status does not.** The gate-failure verdict is carried in a new
*orthogonal* `MergeResult.gate_failure_class` field, not a new status: `introduced` (absent/default) →
today's bounded fix-worker loop, byte-identical; `environment` → soft-escalate reusing the `env-blocked`
reason with **zero** fix rounds (a broken environment is never fixed by a fix-worker); `baseline` → the
merge/land proceeds and the debt is recorded as a deduped `source: 'auto'` backstop entry, surfaced at
every land and in the final PR (ADR 0017: an un-run validation becomes a ratified-backstop record, never
prose). This mirrors the finding-`disposition` precedent (ADR 0013): the routing signal is an orthogonal
field, so the `MergeResult` status enum, `HARD_ESCALATION_REASONS`, and `KNOWN_LAND_DECISIONS` are
**deliberately untouched** (ADR 0005 enum discipline — a widened shared status enum silently widens the
land path, the #236 lesson).

**Scope.** This ADR **extends** [ADR 0006](0006-deterministic-test-floor.md) (floor/gate alignment — the
pattern and the gate are pinned as one Setup decision) and [ADR 0008](0008-git-is-the-resume-source-of-truth.md)
(a local/origin divergence repairs toward git, never a silent pick). It **does not touch**
[ADR 0005](0005-dead-phase-halts-the-dag.md)'s enum set. It **supersedes, for the environment class
only**, the container-packaging spec's §8 "mid-run daemon death" residual — a docker daemon dying between
provision and a merge/land gate reading `gate_failed`, which that spec explicitly left as a future
refinement: such a post-provision docker *environment* failure now classifies `gate_failure_class:
'environment'` and routes as `env-blocked`, not a code verdict. Per that spec's decision-record status it
is **not retro-edited** — this ADR records the supersession.

**Reversal path.** The **absent-class ⇒ `'introduced'` fallback is a permanent fail-safe** — it is never
removed. Because the recovery path is selected by an orthogonal field whose default is byte-identical to
today, reverting the riskiest instance (baseline-proceed, which proceeds over a locally-red gate) is
purely subtractive: **remove the classification prose from the dispatched merge/land prompts and
`agents/war-refiner.md`**, and every `gate_failed` again routes as `'introduced'` — today's behavior —
with no enum, schema, or status change to unwind. Any `source: 'auto'` baseline entries already recorded
**remain** as the debt ledger; they are data (a record of what was proceeded over), not behavior, so a
behavioral revert never erases them.

## Considered options

- **Four independent ADRs, one per friction (rejected).** The four share one root assumption and one
  doctrine; recording it four times would fragment the "target-first, today-as-fallback" rule and hide
  that the instances *compound* (#576/#577 force manual out-of-band lands, which then trigger #578's
  stale provision base). One ADR states the doctrine once.
- **New `MergeResult` statuses / hard-escalation reasons for the baseline and environment cases
  (rejected).** Direct, but a widened shared status enum silently widens the land path (the #236 lesson);
  the orthogonal-field vehicle (the `disposition` precedent, ADR 0013) routes without touching the enum
  set ADR 0005 governs.
- **An operator-maintained baseline-failure allowlist (rejected, spec H).** A hand-kept list of
  "known-red" checks is a second source of truth that rots. The on-failure base re-run derives the
  allowlist fresh each time; the operator's lever stays `overrides.gate` (narrow the gate) plus the
  recorded backstop.
- **A per-phase baseline capture (rejected, spec F).** Capturing a baseline on every phase pays the cost
  on green runs too. The on-failure base re-run pays only when the gate is already red.
- **qemu / `--platform` passthrough for the docker arch case (deferred, #576 non-goal).** Real need
  unproven; the per-image backstop defer covers the arch mismatch today.

## Consequences

- `overrides.testPattern` joins `DEFAULTS.overrides` (default `null`, glob-safe-validated); the Lead
  threads it into the Workflow args, and `--pattern '<value>'` is appended at both `assert-test-in-diff.sh`
  call sites plus `agents/war-refiner.md` step 4 — bare and byte-identical when `null`.
- `MergeResult` gains an optional `gate_failure_class` (`introduced` | `baseline` | `environment`) in
  both the inline `MERGE_RESULT` constant and `references/schemas.md`; no status, hard-escalation reason,
  or land decision is added or changed (`land-decision.mjs` untouched).
- `cmd_ensure_integration` gains a fetch + a four-way equal/behind/ahead/diverged resolution; a true
  divergence dies non-zero before any worker spawns (the Lead surfaces it like today's foreign-branch
  exit).
- Setup probe-builds discovered Dockerfiles and per-image auto-defers platform-mismatched ones to
  backstops; docker-gate composition becomes target-feasibility-derived, not daemon-reachability-derived.
- The four standing "never merge/land on a red gate" invariant sentences (SKILL.md Invariants, the
  `held:land-failed` line, war-refiner.md's Gate contract + Never-list) gain the narrow baseline
  carve-out — proceed only over the *same* failures proven pre-existing at the classification base, debt
  always recorded; an `introduced` red never proceeds.
- `CONTEXT.md` gains four terms (test-floor pattern, gate-failure class, baseline gate debt, provision
  base divergence); the repo `CLAUDE.md`'s ADR range is corrected.
- Everywhere, the fallback path is byte-identical to today — an absent or unresolvable target value is a
  no-op, never a behavior change.

## References

- Design spec: [`docs/specs/2026-07-07-target-repo-agnostic-execution-design.md`](../specs/2026-07-07-target-repo-agnostic-execution-design.md)
  — the four instances, the resolved design tree, and the validation criteria.
- Implementation plan: [`docs/plans/2026-07-07-target-repo-agnostic-execution.md`](../plans/2026-07-07-target-repo-agnostic-execution.md).
- Epic **#579** and its children **#574** (test-floor pattern never threaded), **#576** (docker arch
  mismatch misclassified `gate_failed`), **#577** (gate has no baseline notion), **#578** (provision cuts
  from a stale local ref) — the originating campaign frictions.
- [ADR 0006](0006-deterministic-test-floor.md) — the floor/gate-alignment consequence this ADR extends
  (pattern + gate pinned as one decision).
- [ADR 0008](0008-git-is-the-resume-source-of-truth.md) — repair toward git; the provision-base
  divergence halt applies it at `ensure-integration` time.
- [ADR 0005](0005-dead-phase-halts-the-dag.md) — the enum discipline deliberately left untouched (no new
  status / reason / land decision).
- [ADR 0013](0013-commanders-intent-and-disposition-routing.md) — the orthogonal-routing precedent
  (`disposition` routes independently of severity) the class-routes-not-status doctrine follows.
- [ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md) — the `source: 'auto'`
  ratified-backstop vehicle that baseline debt and the docker auto-defer both use.
- Container-packaging design spec: [`docs/specs/2026-07-06-container-packaging-blind-spot-design.md`](../specs/2026-07-06-container-packaging-blind-spot-design.md)
  — its §8 "mid-run daemon death" residual is superseded for the environment class (not retro-edited).
