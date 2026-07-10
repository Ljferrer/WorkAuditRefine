# Engine ingest guards return named clean errors; the provision exit-code catalogue is the single source of non-zero meanings

**Status:** accepted (design ratified 2026-07-08; the undefined-render guard revised to the `pt` tagged-prompt form 2026-07-10 after this plan's first `/war` audit; implemented by the spec and plan below)

WAR's engine seams converted imperfect input and half-run state into raw crashes and dangerous manual
recovery. `war-config.mjs` `validate()` had no guard on `overrides`, so a hand-edited `overrides: null`
threw an uncaught `TypeError` ([[overrides-loop-lacks-nonobject-type-guard-unlike-memory-block]]) instead
of a clean validation error. Both sandbox `args`-parse sites destructured whatever `JSON.parse` returned,
so a scalar `args` (`'null'`/`'true'`/`'5'`) crashed the Workflow with a raw `TypeError`/`SyntaxError`
rather than the named `held:workflow-error`. Every dispatched prompt interpolated fields with no check
that they were defined — a missing input shipped `undefined` silently to a sub-agent (the #586
derivation-path incident, generalized). And a half-run that orphaned its integration branch left the
operator hand-editing git refs, because the Provision barrier's foreign-branch die was the only path
([[provision-nonidempotent-orphan-integration-branch-blocks-relaunch]]). Full mechanics:
[the design spec](../specs/2026-07-08-war-execution-engine-input-and-lifecycle-hardening-design.md) §3–§8
and [the plan](../plans/2026-07-08-war-execution-engine-input-and-lifecycle-hardening.md).

## Decision

**Every engine trust boundary returns a *named* clean error, never a raw crash; the provision script's
non-zero exit meanings live in one catalogue with an "any non-zero = halt" surfacing contract; and the
Provision barrier heals only its own provably-safe orphans, never destroying work.**

1. **Config ingest is guarded like its siblings.** `validate()` rejects a non-object `overrides` with
   `overrides must be an object` and skips the `KNOWN_OVERRIDES` loop, byte-mirroring the `memory` block's
   `if (!isObj(...)) { errors.push(...) } else { ... }` shape. No new export, no `main()` `try/catch` (a
   catch there masks the class instead of naming it).

2. **Both sandbox `args`-parse sites are guarded, hand-mirrored.** The template **throws**
   `workflow-template: args must be a JSON object` on a non-null-object `A`, routing to the existing
   `held:workflow-error` catch (never a new enum member); the scaffold falls back to `{}` so its existing
   `args.fingerprint.titleLine is required` refusal fires cleanly. The two guards cannot be a shared module
   — the Workflow sandbox cannot import — so they are hand-mirrored and pinned by a both-sites drift-guard
   test, following the `HARD_ESCALATION_REASONS` mirroring discipline. The catch renders `phase: null` via
   a hoisted `phaseId` fallback so a scalar arg that throws before the destructure never triggers a
   secondary `TypeError` on an unassigned `ph`.

3. **The undefined-render guard checks value identity, not prompt text.** A `pt` tagged prompt template
   throws at build time (before spawn, naming the adjacent literal fragment) when any interpolated **value**
   is `=== undefined`; every prompt-rendering template literal is tagged, and optional fields carry explicit
   `?? '<unset>'` defaults. Because the check is value identity and never scans the rendered text, quoted
   prose "undefined" in a finding title, test name, or code sample can never trip it — **zero false
   positives by construction**. *(Revised 2026-07-10, Option B: this plan's first `/war` run held at audit
   proving the originally-ratified whole-prompt `\bundefined\b` scan false-positived on legitimate content;
   the operator chose zero false positives over pattern-tightening. The residual is coverage — a future
   prompt literal added without the tag — not false positives.)*

4. **The provision exit-code catalogue is the single source of non-zero meanings.** `provision-worktrees.sh`
   declares `readonly EX_FOREIGN=3 EX_DIRTY_UNREG=4 EX_OUT_OF_RUN=5 EX_WRONG_BRANCH=6 EX_DIVERGED=7` with a
   comment block naming each code's meaning and governing ADR; every coded `die` uses its constant, and a
   test forbids any uncatalogued numeric literal. Code 3 (`EX_FOREIGN`) is deliberately overloaded across
   the foreign-branch and no-advance/escalation dies — halt-semantics are identical, and the surfacing
   contract is **"any non-zero = halt,"** so the constant name records the dominant meaning while the grep
   assertion enforces catalogued constants, not per-site semantic uniqueness.

5. **The empty-orphan reclaim is opt-in, same-namespace, and two-proof-gated.** With
   `--reclaim-empty-orphan` (Lead-supplied only on a sanctioned recovery relaunch), the Provision barrier
   deletes and re-cuts a half-run's orphaned integration branch **only** after proving `git log <base>..<branch>`
   is empty **and** `git ls-remote --exit-code origin <branch>` is absent; either proof failing ⇒ the
   unchanged `EX_FOREIGN` die. This **extends ADR 0003** (the foreign-branch fail-loud default is unchanged;
   the reclaim is an opt-in exception behind two proofs) and **ADR 0008** (repair moves toward git, never a
   work-destroying reset — deleting a branch proven to carry no unique commits and absent from origin resets
   no work). Distinct from ADR 0021's owned-file-continuity relaunch, which *reuses* a branch carrying
   landed commits.

6. **ADR 0005's enum sets are explicitly untouched.** No `MERGE_RESULT`, `HARD_ESCALATION_REASONS`, or
   `KNOWN_LAND_DECISIONS` member is added anywhere; every wrong-class ingest failure routes to the existing
   `held:workflow-error`, which is never added to `HARD_ESCALATION_REASONS`.

## Considered options

- **A shared parse-guard module (rejected).** The sandbox-can't-import constraint makes the mirrored
  one-liner + drift-guard test the correct shape, not a new file — the same reasoning that keeps
  `HARD_ESCALATION_REASONS` hand-mirrored.
- **A whole-prompt `\bundefined\b` scan for the undefined-render guard (rejected — ratified then disproved
  2026-07-10).** It false-positived on legitimate content (quoted prose "undefined", `Sub-issue #undefined`
  from an absent optional field) at this plan's own first audit. Value-identity checking via the `pt` tag is
  zero-false-positive by construction.
- **A `main()` `try/catch` around config validation (rejected).** It masks the failure class instead of
  naming it; the per-field guard reports `overrides must be an object` explicitly.
- **An unconditional / force reclaim of orphaned branches (rejected).** Either proof failing must fail loud
  (ADR 0003); deleting a branch with unique commits or one published to origin would destroy work (ADR 0008).
  The reclaim is opt-in and two-proof-gated precisely so it can never fire unattended or lose work.
- **Per-site unique exit codes (rejected).** Overloading `EX_FOREIGN`=3 across halt-identical dies is
  honest: the surfacing contract is "any non-zero = halt," so a differentiated code buys nothing the halt
  contract does not already give, and the catalogue stays small.

## Consequences

- **Ingest failures are legible.** A malformed config, a scalar `args`, a missing prompt input, and a
  half-run orphan each surface as a named error a reader can act on, not a stack trace.
- **The two args guards drift unless co-maintained.** They are hand-mirrored across sandbox files; the
  both-sites drift-guard test is load-bearing
  ([[standing-instruction-vs-dispatched-prompt-coverage-split]]).
- **The undefined-render guard's residual is coverage, not correctness.** A future prompt-rendering literal
  added without the `pt` tag is unguarded; the grep floor catches bare spawn-site literals mechanically,
  helper-internal literals rely on the convention plus the auditor's cascading-impact lens (named backstop
  in the plan).
- **Concurrent same-plan runs vs reclaim is an accepted residual.** Two concurrent runs of the same
  plan+phase are already undefined behavior today; the two proofs guarantee nothing is lost even then, and
  the opt-in flag never fires unattended.
- **`ensure-exclude` explicit-target and the reclaim are exercised together only at a live run.** The gate
  proves each half; composition is a deferred backstop (the next live Provision / sanctioned relaunch).

## References

- Design spec: [`docs/specs/2026-07-08-war-execution-engine-input-and-lifecycle-hardening-design.md`](../specs/2026-07-08-war-execution-engine-input-and-lifecycle-hardening-design.md)
  §3 (design tree), §4 (mechanics), §6 (domain terms), §7 (this ADR), §8 (open risks), §10 (criteria).
- [ADR-0003 — plan-namespaced branches](0003-plan-namespaced-branches.md) — the same-plan foreign-branch
  fail-loud default this reclaim opts out of behind two proofs.
- [ADR-0008 — git is the resume source of truth](0008-git-is-the-resume-source-of-truth.md) — the
  repair-toward-git, never-destroy-work rule the empty-orphan proofs honor.
- [ADR-0005 — a dead phase halts the DAG](0005-dead-phase-halts-the-dag.md) — the `held:workflow-error`
  class and `HARD_ESCALATION_REASONS` enum set this plan leaves untouched; the existing catch every ingest
  failure routes to.
- [ADR-0021 — run-lifecycle provision contract](0021-run-lifecycle-provision-contract.md) — the
  owned-file-continuity relaunch the empty-orphan reclaim is distinct from.
