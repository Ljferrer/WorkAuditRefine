# Red-team report — docs/plans/2026-08-06-handoff-schemas-contract.md

- **Verdict:** ADJUDICATED (gate-emitted; ADR 0043 — every blocker patched and adjudication-rowed, not probe-re-verified)
- **Rounds:** 1
- **Date:** 2026-08-17 · **Round limit:** 3 · **routeUpstream:** false
- **Base:** stacked tip `7d1d304` (plan 8, PR #1466 open). **Byte-identity of every plan-9 target file between master `94ea0cb` and the stacked base was verified BEFORE launch** — probes at the master checkout are valid by the recorded rule, established pre-emptively this time.
- **artifactKind:** impl-plan (AI-Commander's Intent — the `--afk`-converted arm; this pass is where its self-adjudicated deviations get ratified)
- **Escape guard:** pre-run `--snapshot` exit 0 · post-run `--baseline` exit 0
- **ff-topology:** vacuous — no merge-commit anchors.

## Attack surface / Executed proof

14/14 probes on target, 0 dropped: 6 spine + 8 bespoke (`stacked-base-drift`, `entry-validation-1430`,
`provisioning-leaf-arms`, `engine-mirror-sync`, `endstate-command-diff` over all 33 End states,
`default-flip-old-absent`, `unguarded-new-mirror`, `guard-split-deps-edge`). 27 agents, 0 errors.

Gate accounting: **32 blockers + 15 needsDecision + 20 minors → 32 distinct roots**, all patched.
The campaign's heaviest pass — expected for its biggest plan (1,241 lines, 3 phases, 33→36 End states)
whose Part 1 predates four landed engine rewrites and whose Phase 2 was folded post-authoring.

## The Critical — `env-died` (#1411): incoherent home, misleading semantics

Task 2.1(c)(ii) said `env-died` lands "canonical beside the existing enums in `land-decision.mjs`" —
but the module exports exactly **two** arrays (`HARD_ESCALATION_REASONS`, `KNOWN_LAND_DECISIONS`) and
`env-died` belongs in **neither**: it is a task-level `reason`, not a landDecision. Meanwhile
"(retryable, not a hard escalation)" hid what soft actually does: **Lead-verified against
`decideLand` at the base**, a phase whose only unmerged tasks carry soft reasons **LANDS minus those
tasks**.

The probe read that as a landing-work-silently defect; source verification shows it is the **ratified
`env-blocked` precedent** — worker unspawned/dead, siblings proceed, never a phase halt, the dead task
recorded and re-run via the Recovery-relaunch runbook. The genuine defects were the incoherent
canonical home and the unnamed recovery path.

**Adjudicated:** `env-died` joins a **new exported `SOFT_ENV_REASONS = ['env-blocked', 'env-died']`**
in `land-decision.mjs` (hand-mirrored in the template, drift-guard extended in the same diff — the
#236 census extended, never bypassed); the plan states lands-minus-task **honestly** and names the
Recovery-relaunch entry point as the re-run path; `HARD_ESCALATION_REASONS` untouched, ADR 0005's
line not approached. ES29 restated and its check fused on the 0-at-base `SOFT_ENV_REASONS` literal.

## Amendment-coherence roots

- **The fail-open Pivotal constraint predated the amendment** and flatly contradicted Phase 2's own
  Files list (`land-decision.mjs untouched` vs Task 2.1 editing it). Scoped to Phase 1 + an explicit
  Phase-2 carve-out. (4 probes converged on this one.)
- **Purpose/Method predated Phase 2 entirely** — End states 27–33 had no Intent anchor. Purpose
  extended with the engine-truth clause covering #1395/#1408/#1410/#1411/#1413/#1430.
- **#1410 was an orphan deliverable**: absent from the header issue map, from ES25's enumeration,
  and from every End state. All three fixed; new **ES34** pins the retirement on all three sites
  (base counts 1 + 2).

## Entry-validation roots (#1430/#1413 — the operator's own fold)

- **(f)(i)'s "ungated" `plan.file` class reds two committed tests** that pin an absent `plan` object
  as a deliberately-supported zero-task launch shape. Gated on `(tasks || []).length > 0` — refuses
  every real dispatching launch that omits it (including the observed 7-task incident) while both
  plan-less contracts stay green unmodified.
- **(f)(iii)'s pt-throw reclassification DROPPED.** The live suite pins the opposite by title
  (`criterion 3 — … escalates the task`), and `held:workflow-error`'s only producer is the top-level
  catch, which a thunk **cannot reach** — the live `parallel` NULLS a rejected thunk (the
  wave-loop-thunk-catch lesson), so the prescribed mechanism would silently drop the task. The
  incident class is closed at the front door by (f)(i); the catch now appends a diagnostic hint with
  classification byte-unchanged. ES33 rescoped to match.
- **ES30's own-token floor would have refused every legal intent-less run** — `intent` is optional by
  ratified, criterion-pinned contract. Null-intent carve-out added; the check gains a 0-at-base
  provenance-floor literal plus an intent-less-accepted row.

## Provisioning root

**D19's hygiene repair could destroy legitimate work**: "dirty + SHA-matched" is indistinguishable
from a submodule-content worker's real uncommitted edits, and `--force` erases them. Narrowed to the
**corruption signature** (staged-deletions-only porcelain, or a stale submodule `index.lock` — the
killed-populate residue); anything else is `detected`-only, tree untouched. The mimicking residual is
accepted and documented — `detected` hands the call to the relaunching Lead, never to `--force`.

## Budget roots

- Refiner card re-measured at the live tip: **33,345 B, 1,471 B of hard headroom** (the plan said
  32,368/≈2.4 KB) — for **five** card additions. Relocation fallback added (references/ + trigger
  pointer, the hot/cold law) the worker may take without escalating.
- **A third hard budget the plan never named**: `WORKFLOW_LITERAL_BUDGET` (hard 62,464 B) governs
  exactly the dispatched-prompt prose both template tasks add — ≈4.1 KB combined headroom. Re-measure
  duty + the same fallback added for both tasks.

## Mirror/guard roots (ADR 0025)

`file-followups` card↔prompt gains a both-surfaces registry row (ES4 now pins both surfaces — a
presence grep is not a drift guard); the `WORKTREE_HYGIENE` marker + action set are **plan-defined
literals** (D20 is the canonical source; both same-wave tasks copy from Part 1, the plan-8 precedent)
with a STALE_REMOTE-style registry row; the A1 registry row must **grow an anchor** for the redefined
D5-tag sentence (its existing anchors bind the old framing — backstop row); new **ES35** pins the
otherwise-unpinned `ghUser` threading on all three surfaces; new **ES36** ratifies A2 and pins the
degenerate-timestamp guard.

## Check-quality roots

Two-command pairs fused across ES18/20/21/23/28/29/31/32 (the one-command-per-row dispatch contract);
ten suite-only checks gained base-red discriminating halves — **every token verified 0 at base by
execution** (`file-followups`, `war-<date>-<slug>`, `--working`, `WORKTREE_HYGIENE`, `worktreeHygiene`,
`environmental`, `SOFT_ENV_REASONS`, `foreign docs/plans`, `JSONL`, `requires plan.file`, `ghUser`,
`degenerate`); ES28's `environment` grep was vacuous (3 hits at base, none in the row); **ES27's
first-draft replacement floor was itself vacuous** (`run.provision` pre-exists) and was re-pinned to
the plan-defined literal `provision-before-checks` — caught by executing my own patch, the ES8 lesson
applied. ES20 is deliberately green at base (a byte-unchanged preservation pin).

## Adjudications

| # | Adjudicated value | Supersedes | Provenance |
|---|---|---|---|
| 1 | `env-died` ∈ new `SOFT_ENV_REASONS` export; lands-minus-task stated honestly; Recovery-relaunch named | "canonical beside the existing enums" + "retryable" | AI-declared (2026-08-17), Lead-verified vs `decideLand` + the env-blocked precedent |
| 2 | Fail-open constraint scoped to Phase 1 + carve-out; Purpose extended; #1410 mapped + ES34 | amendment-blind Part 1 | AI-declared (2026-08-17) |
| 3 | (f)(i) gated on `tasks.length > 0`; (f)(iii) reclassification dropped (hint only); ES30 null-intent carve-out | ungated class / pt-reclassification / unconditional floor | AI-declared (2026-08-17), pinned-contract-preserving |
| 4 | D19 narrowed to the corruption signature; `detected`-only otherwise | dirty+SHA-matched `--force` | AI-declared (2026-08-17) |
| 5 | Budgets re-measured (card 33,345 B; `WORKFLOW_LITERAL_BUDGET` surfaced); relocation fallbacks | stale figures / unnamed budget | AI-declared (2026-08-17) |
| 6 | Registry rows for file-followups + WORKTREE_HYGIENE; plan-defined literals; A1 anchor growth; ES35/ES36 | presence greps / unpinned threading | AI-declared (2026-08-17), ADR 0025 |
| 7 | All pair-checks fused; ten base-red halves added (tokens executed 0-at-base); ES27/ES28 re-pinned | suite-only and vacuous checks | AI-declared (2026-08-17) |

## Residual risk (20 minors, auto-noted)

- The D19 residual (corruption mimicking real edits → `detected`, Lead adjudicates) is accepted and documented.
- `SOFT_ENV_REASONS` is a new export other consumers could later read — its drift-guard rides the same diff; the shared-enum-widening lesson stands watch.
- Note 4's sibling-plan enumeration and the "unconverted spec" framing are stale provenance (both siblings are now committed plans); load-bearing halves verified still true.
- The refiner-card headroom (1,471 B) is tight; the relocation fallback is the pressure valve.

## Verdict

**ADJUDICATED** — gate-emitted at rounds 1 of 3, `routeUpstream: false`, coverage whole (14/14).
All 32 roots patched and stamped `adjudicated: true`; none probe-re-verified. Every rewritten check
executed at the base; one of my own replacement floors was caught vacuous by that execution and
re-pinned.
