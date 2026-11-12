# Run-scoped staged phase scripts — per-phase dispatch identity via a write-if-absent, fail-loud stager

**Status:** accepted (design ratified 2026-07-16; implementation tracked by the spec and plan below)

Every `/war` phase dispatches the same file, `assets/workflow-template.js`, whose `export const meta`
block carries the static literal `name: 'war-phase'` and a fixed `description`. Operator evidence (a
`/workflows` UI screenshot) shows a completed per-phase run renders title `workflow-template` with
description `WAR per-phase execution: Work, Audit, Refine, Land, …` — every phase of every plan, in
every campaign, despite carrying different `args` per dispatch (a different `phase.id`, a different task
list), renders identically. That rules out `args` as the title's source and points at the dispatched
script's own static content — its basename and `meta.description` — as what the harness's title renderer
actually reads. Neither the renderer nor the `meta` shape is editable from this repo, so the fix has to
feed the renderer a better input: a run-scoped copy whose basename and `meta` literals are stamped with
the plan slug and phase number before dispatch. A future reader will ask why WAR dispatches a copy
instead of the shipped file, and why that copy is reused rather than regenerated on every relaunch; this
records why. Full mechanics: [the design spec](../specs/2026-07-16-land-failure-recovery-design.md) §3
(decisions 6–10), §7, and [the plan](../plans/2026-07-16-land-failure-recovery.md) Task 1.1 (the stager),
Task 1.2 (launch/resume prose), Task 1.5 (this ADR).

This ADR's scope is deliberately narrow: the companion fix in the same plan — a terminal `else` arm
routing a dead or unrouted `land:phase-<N>` dispatch to `held:land-failed` — needs **no** ADR of its own.
It reuses an existing `KNOWN_LAND_DECISIONS` member and operates entirely inside
[ADR 0005](0005-dead-phase-halts-the-dag.md)'s enum-reuse discipline; nothing about that fix is a design
decision this repository has not already ratified.

## Decision

**A per-phase dispatch runs a run-scoped, identity-stamped *copy* of the shipped template — never the
shipped file itself — produced by a fail-loud, write-if-absent staging helper whose output is the sole
sanctioned surface for both display identity and approved stage injection.**

1. **Dispatch identity is a file, not an argument.** The evidence above rules out threading identity
   through `args`; the only lever that reaches the harness's title renderer is *which file* gets
   dispatched. The staged basename is `war-[c<K>-]<planSlug>-p<N>.js` (`K` = the plan's 1-based
   campaign-queue position, omitted outside a campaign); `meta.name` is that basename minus `.js`;
   `meta.description` is `WAR phase <N> of <planSlug>[ (campaign plan <K>)]: Work, Audit, Refine, Land,
   then Wrap-up learnings.` `planSlug` passes through verbatim — long dated slugs produce long
   basenames, and UI truncation beats a lossy shortening that could collide two different plans' titles.

2. **A dedicated stager, not inline Lead logic.** `skills/war/assets/stage-workflow.mjs` reads the
   shipped template and replaces **exactly once** each of the two `export const meta` anchor literals
   (`name: 'war-phase'` and the shipped `description:` string) with the derived identity. With
   `--args <file>` it makes an **optional third exactly-once substitution** (plan
   `2026-07-26-dispatch-args-and-floor-coverage` Task 2.1, #1134): it replaces the template's
   string-arm args fallback tail, so an assembled payload too large to ride the Workflow tool call
   travels with the script instead (dispatched args, when passed, still win). It exits **non-zero with
   a named error** when an anchor is missing or matches more than once — fail-loud, never a silent fork
   onto the wrong text. The derivation lives in two pure, independently-tested exports (`deriveName`,
   `deriveDescription`) so the title format has exactly one authoritative implementation; the stager
   also exports the **three** anchor literals as constants so the anchor-guard test that polices
   `workflow-template.js` imports them rather than hardcoding a second copy
   ([ADR 0025](0025-drift-guard-discipline.md) mirror-registry discipline;
   [ADR 0030](0030-live-artifacts-over-stack-fragile-literals.md) — the derived identity is read from
   the live export, never restated as a literal at each call site).

   **The args ride a sibling args script (D38).** By operator ruling of 2026-11-09 (plan
   `2026-11-08-engine-recovery-relaunch-and-land` Task 1.2) the staged-template cap is funded by moving
   the embedded args out of the staged copy. Under `--args <file>` the stager writes the validated args
   to `<staged basename minus .js>.args.js` beside the staged copy: a meta statement, then `return` of
   the JSON. The staged copy carries one loader line after `meta`. It calls `workflow({ scriptPath })`
   on the sibling only when no args were dispatched, and it stores a load error instead of throwing, so
   nothing above the engine's top-level `try` throws. The rewritten args fallback sits inside that `try`
   and throws a named error for a failed load, so a bad or missing sibling returns `held:workflow-error`
   (no new enum member, ADR 0005). The engine itself never calls `workflow()`, so the one-level nesting
   limit holds (verified: the plan's TRIAL-3, 2026-11-09).

   **The staged copy is stripped to fit the dispatch cap (#2099, #2613).** The staged copy is not the
   shipped template's bytes apart from the substitutions. The Workflow tool refuses a script over its
   524,288-byte `scriptPath` cap, and the shipped template alone crossed that cap at 0.21.11 (measured
   525,209 bytes on 2026-09-06, ~250 KB of it full-line comments), so the stager first blanks every
   full-line `//` comment in code state (each becomes an empty line — line count preserved, so a
   harness line number maps to the template's, plus the loader line an `--args` stage adds after
   `meta`; strings, template literals, regex literals, block and trailing comments pass through
   verbatim, with one scanner residual recorded in `skills/war/references/staged-script.md`). The strip
   also drops the leading spaces and tabs of every line that starts in the top-level code frame. A line
   that starts in a string continuation, a template literal, a `${…}` body or a block comment keeps
   every byte, and no line is removed, so the line count is unchanged. The stager then substitutes,
   then refuses with a named error and writes nothing if the assembled copy would still exceed the cap;
   the size floor checks the staged copy and its args sibling each against `SCRIPT_BYTE_CAP`. The
   shipped template is untouched: its comments and every drift guard over them stay; the strip lives
   only in the staged copy. Lead-facing doctrine: `skills/war/references/staged-script.md`; arbiter:
   `stage-workflow.test.mjs` arms (p), (q), (r) and (s). Arm (p)'s `ARGS_HEADROOM_BYTES` reserves only
   the loader prelude (the loader line and the fallback rewrite), because the args ride the sibling;
   that lowering is part of the D38 ruling and is no precedent for lowering the reserve while args ride
   the staged copy. Arbiter for the sibling: the `args sibling (D38):` rows in
   `stage-workflow.test.mjs`.

3. **Write-if-absent, with a sidecar-checked `--force` restage.** If the derived staged path already
   exists, the stager leaves it **byte-untouched**, prints its absolute path, and exits 0 — the existing
   file *is* the run's script. This is deliberate, not an oversight: an operator may have hand-edited
   the staged copy to inject an **approved** extra stage (decision 5, below), and
   `Workflow({ scriptPath, resumeFromRunId })` needs the *same bytes* across a journal replay for
   identity to hold — silently regenerating on every relaunch would either clobber the injection or risk
   the replayed script drifting from the one the journal was recorded against. A same-journal replay
   therefore reuses the existing file: same run, same phase ⇒ same basename ⇒ the correct script is the
   one already there. A deliberate propagation of a *shipped-template* edit mid-campaign passes
   **`--force`** — a fresh comment- and indent-stripped substitution from the current shipped template.
   Reuse is byte-untouched **unless the existing file is over the Workflow tool's
   524,288-byte `scriptPath` cap** — such a file cannot dispatch, so the stager refuses with an error naming
   `--discard-injections` and never reuses it (#2099).

   **The digest sidecar (#2345, plan `2026-11-08-args-floor-and-launch-preflight` Task 1.3).** Every
   write also leaves a `<staged>.sha256` sidecar holding the sha256 digest of the written bytes.
   `--force` over an existing file overwrites it only when that sidecar matches its current bytes; a
   differing digest (a hand-applied stage) or no sidecar exits 1 with a named error and writes
   nothing, so an injected stage is never lost silently. The override flag `--discard-injections`
   implies `--force` and overwrites regardless. An over-cap file predates the sidecar, so its reuse
   refusal names `--discard-injections` too. The args sibling gets its own `.sha256` sidecar, and
   write-if-absent and `--force` cover both files together: `--force` refuses when either existing
   file's sidecar does not match, and a reuse of a staged file whose loader names a missing sibling
   exits non-zero naming both `--force` and `--discard-injections`. A sibling with no staged file beside
   it is overwritten by the next fresh stage. Arbiter: `stage-workflow.test.mjs` arm (t), the
   `args sibling (D38):` rows and the `staged-script doc:` row.

   **Fresh execution identity (#2300).** The runId is opaque, never date-based. A new WAR run, plain
   rerun, or Recovery relaunch mints a UUID with `skills/war/assets/new-run-id.mjs` in the Lead shell
   and persists it per `skills/war/references/launch-identity.md`. Normal progression to another phase
   retains the ID; same-journal replay retains ID and staged bytes. A fresh attempt of a previously
   launched phase never reuses its prior ID or embedded args. Each fresh run therefore stages into a new
   run-scoped directory; write-if-absent still preserves a journal's existing script. The
   basename/display-name contract is unchanged. Plan/date remain separate manifest metadata. Old
   manifests and stage directories remain readable evidence. The phase coordinate follows
   provisioning's digit-only grammar, not arbitrary string labels.

4. **The staged-copy home is the main-checkout, run-scoped directory, retained like the run
   manifest.** For a main-checkout launch, staged copies live at `$MAIN/.claude/war/runs/<runId>/`, a
   directory sibling of the run manifest (`$MAIN/.claude/war/runs/<runId>.json`), resolved via the
   **same** main-checkout anchor idiom the manifest already uses (`git rev-parse --path-format=absolute
   --git-common-dir`) — no new anchor code, and untracked-ness rides the existing `.claude/`
   `ensure-exclude`. For a launch from a linked worktree, the staged copy follows the run root
   ([ADR 0059](0059-run-root-follows-the-launch-checkout.md), #2351). Retention is
   **manifest-equivalent**: kept, never reaped by this ADR, doubling as dispatch provenance for
   `/war-review`. A recovery relaunch mints a fresh `runId` and therefore a fresh directory, so it never
   collides with the run it is recovering from.

5. **The staged copy is the sole sanctioned home for approved stage injection.** The template's header
   comment ("the Lead may inject APPROVED extra stages by editing a copy of this file") names the staged
   per-phase copy as *the* copy meant (Task 1.2, same commit as the launch-prose change — the
   standing/dispatched split). This unifies what were two separate "edit a copy" reasons — display
   identity, stage injection — into one file.

6. **Resume passes the same staged `scriptPath` the launch used.** `Workflow({ scriptPath,
   resumeFromRunId })` must dispatch the identical script across Lead restarts; write-if-absent
   (decision 3) is what makes this safe — a resume that restages first reuses the existing file rather
   than regenerating it. An over-cap staged file cannot dispatch, so the restage that remedies it
   (`--discard-injections`) forfeits byte identity with any journal recorded against the old file, as
   well as any injected stage; the stager's refusal names both, and a fresh launch, not a
   `resumeFromRunId` resume, follows such a restage (#2099).

7. **The staging CLI stays filesystem-only — no git probe.** `stage-workflow.mjs` takes the template
   path, the staged directory, `planSlug`, `phaseId`, and an optional campaign ordinal as plain
   arguments; it never resolves the main-checkout anchor itself. That anchoring is the Lead's
   launch-prose duty (decision 4) — an unconditional git probe inside the stager would create a
   test-hermeticity coupling (every stager test fixture would need to live outside any git working
   tree) for no benefit the Lead-side anchor doesn't already provide.

## Considered options

- **Thread identity through `args` instead of the dispatched file (rejected).** The observed evidence —
  identical titles across dispatches carrying different `args` — rules this out directly; there is no
  args-shaped lever that reaches the title renderer.
- **Rename or overwrite the shipped template file per dispatch (rejected).** Concurrent phases (a
  campaign, or two plans run side by side) would race on one shared file; mutating the shipped artifact
  also breaks every other caller that expects `assets/workflow-template.js` to be the stable, canonical
  template.
- **Always regenerate the staged copy on every dispatch, including relaunch/resume (rejected — see
  decision 3).** Breaks approved stage-injection survival and risks the replayed script drifting from
  what a journal was recorded against. Idempotent regeneration (same inputs ⇒ same bytes) was considered
  as a middle ground but still overwrites a hand-edited injection; write-if-absent is strictly safer, and
  `--force` covers the one case idempotence was meant to serve — a deliberate propagation — for a
  clean stage, and `--discard-injections` for a hand-edited one.
- **One shared staged script per run, not per phase (rejected).** The harness titles by dispatched
  basename; a single shared script across a multi-phase plan would still render identically per phase,
  reproducing the exact defect this ADR fixes.
- **A stager-internal git probe for the staged-copy home (rejected — see decision 7).** Would couple
  every stager test fixture to living outside a git repository, for an anchor the Lead's launch prose
  already resolves identically to the run-manifest path.
- **A new `held:*` / `MergeResult` enum member for dispatch identity (not applicable).** Dispatch
  identity is a file-selection concern at launch, before any task runs; it has no interaction with the
  land-decision vocabulary, and this ADR adds no enum member anywhere.
- **A date-based `runId` (`<plan-slug>-<YYYY-MM-DD>`) whose same-day recurrence made a restage benign
  reuse (retired, #2300).** A fresh attempt of a launched phase must never reuse its prior ID or
  embedded args, so the ID is a minted UUID.
- **Embed the validated args in the staged copy as a prelude (retired, D38).** It spent the staged
  copy's cap headroom on the args, so the args moved to a sibling script.

## Consequences

- **The live-title rendering is a deferred, operator-run backstop, not an automated criterion.** Nothing
  in this repo can execute the harness's own renderer; the automated proxy is the stager's
  basename/meta-literal assertions, and the actual `/workflows` UI rendering is checked once by an
  operator at the next real phase launch on the released plugin.
- **`stage-workflow.mjs` is a required launch-time step, not an optional convenience.** The
  per-phase launch prose (Task 1.2) must run it and dispatch its **printed** path — a Lead that
  dispatches `assets/workflow-template.js` directly regresses to the pre-fix generic title, silently (no
  test catches a *launch-prose* skip; only the stager's own unit tests are automated).
- **`.claude/war/runs/<runId>/` joins `.claude/war/runs/<runId>.json` as a second per-run artifact class
  under the same untracked, unreaped home.** A future `/aftermath` reaping decision, if one is ever made
  for the manifest, must account for the staged-script directory too — out of scope here; no reaping
  exists for either today.
- **No enum, escalation-surface, or `land-decision.mjs` change.** This ADR is a dispatch-input relocation
  (which file, what its literals say) plus a small helper module; it adds no task or phase status and
  touches none of `HARD_ESCALATION_REASONS`, `KNOWN_LAND_DECISIONS`, or `defectClass`
  ([ADR 0005](0005-dead-phase-halts-the-dag.md)).
- **An anchor-literal mirror joins the repo's existing mirror registry.** The stager's exported
  anchor constants and `workflow-template.js`'s `export const meta` literals are a canonical-source
  ↔ mirror-site pair like any other ([ADR 0025](0025-drift-guard-discipline.md)); the anchor-guard test
  (`stage-workflow.test.mjs`) is that pair's arbiter, not a new detection mechanism. The third exported
  anchor widens the pair: the `const A =` ternary's args-fallback tail in `workflow-template.js` is the
  **canonical source**, and the stager's `ARGS_FALLBACK_ANCHOR` in `stage-workflow.mjs` is the
  **hand-maintained mirror site**, the copy that must be brought back into lock-step whenever that
  tail changes — the *same* direction as the `export const meta` ↔ stager-export pair (#1240).
  Derivation: the `COUPLING (ADR 0037, #1134)` comment beside the ternary, which names the stager as
  the side that mirrors the tail and makes updating the stager the duty a change to the tail
  triggers. That comment is deliberately **referential** — it describes the coupling without
  restating the tail — and this bullet keeps the same discipline.

## References

- Design spec: [`docs/specs/2026-07-16-land-failure-recovery-design.md`](../specs/2026-07-16-land-failure-recovery-design.md)
  §1 (the operator-added per-phase-identity requirement), §2 (pivotal constraints — the sandbox has no
  shell/fs, harness-owned surfaces are immutable from this repo), §3 decisions 6–10, §6 (domain terms),
  §7 (this ADR), §8 (idempotent-restaging / long-title notes), §9 (non-goals), §10 criteria 7–9 and 11.
- Plan: [`docs/plans/2026-07-16-land-failure-recovery.md`](../plans/2026-07-16-land-failure-recovery.md)
  Task 1.1 (`stage-workflow.mjs` + tests — the contract this ADR records), Task 1.2 (launch/resume prose,
  the header-comment update, `--campaign-ordinal`), Task 1.4 (`/war-campaign` threads the ordinal), Task
  1.5 (this ADR + the `GLOSSARY.md` glossary terms).
- [ADR-0005 — a dead phase halts the DAG](0005-dead-phase-halts-the-dag.md) — the enum-reuse discipline
  the companion land-routing fix (same plan) stays inside without a new ADR of its own (see the scope
  note above).
- [ADR-0008 — git is the resume source of truth](0008-git-is-the-resume-source-of-truth.md) — resume's
  git-first posture; the staged-copy write-if-absent contract exists so `resumeFromRunId` always has a
  stable file to point at, never a second, competing source of truth.
- [ADR-0021 — run-lifecycle contract (recovery relaunches are fresh runs over reused git state)](0021-run-lifecycle-provision-contract.md)
  decision (G) — the recovery-relaunch pattern whose fresh `runId` gives it a fresh staged directory.
- [ADR-0025 — every duplicated or asserted fact carries a mechanical drift-guard to its canonical source](0025-drift-guard-discipline.md)
  — the mirror-registry doctrine the stager anchor-constants ↔ template-meta-literals pair follows.
- [ADR-0030 — plans reference live artifacts, never stack-fragile literals](0030-live-artifacts-over-stack-fragile-literals.md)
  — why the derived name/description live in one exported pure function rather than being restated at
  each call site.

## Decision log

- 2026-07-27 · decision 2's two-scoped sentences: an optional third exactly-once substitution, three exported anchors · #1134 (plan `2026-07-26-dispatch-args-and-floor-coverage` Task 2.1) · retired: docs/adr/0037-run-scoped-staged-phase-scripts.md @ 594613d7
- 2026-07-27 · the anchor-literal mirror pair widens to the args-fallback tail · #1134 · retired: docs/adr/0037-run-scoped-staged-phase-scripts.md @ c9d88a35
- 2026-08-02 · Correction: the widened pair's direction — the template tail is the canonical source, the stager anchor the mirror · #1240 · failed because: the 2026-07-27 note had the pair's direction inverted · retired: docs/adr/0037-run-scoped-staged-phase-scripts.md @ 0c10d3f1
- 2026-09-06 · the staged copy is comment-stripped and cap-refused · #2099 · retired: docs/adr/0037-run-scoped-staged-phase-scripts.md @ 2ff64705
- 2026-09-06 · decision 3's two qualifiers (over-cap reuse refused; `--force` restage is comment-stripped) and decision 6's over-cap restage note · #2099 · retired: docs/adr/0037-run-scoped-staged-phase-scripts.md @ 56b8aac7
- 2026-09-11 · fresh execution identity · #2300 · failed because: a date-based runId recurred same-day, so a fresh attempt could reuse a prior ID or its embedded args · retired: docs/adr/0037-run-scoped-staged-phase-scripts.md @ 3d1f218b
- 2026-11-04 · the strip also drops top-level leading indentation · #2613 (plan `2026-11-04-late-defects-fixed-in-run` Task 1.1) · retired: docs/adr/0037-run-scoped-staged-phase-scripts.md @ ed28d04f
- 2026-11-05 · the glossary moved to GLOSSARY.md · #2636 · retired: docs/adr/0037-run-scoped-staged-phase-scripts.md @ b31d2203
- 2026-11-08 · every write leaves a `<staged>.sha256` sidecar; `--force` overwrites only on a matching digest; `--discard-injections` overwrites regardless · #2345 (plan `2026-11-08-args-floor-and-launch-preflight` Task 1.3) · failed because: `--force` overwrote a hand-applied stage silently · retired: docs/adr/0037-run-scoped-staged-phase-scripts.md @ 50aeaf6c
- 2026-11-08 · a linked-worktree launch stages under the run root (ADR 0059) · #2351 · retired: docs/adr/0037-run-scoped-staged-phase-scripts.md @ cac1723c
- 2026-11-09 · the args sibling script · D38 (plan `2026-11-08-engine-recovery-relaunch-and-land` Task 1.2) · failed because: args embedded in the staged copy spent its cap headroom · retired: docs/adr/0037-run-scoped-staged-phase-scripts.md @ 54050bf5
- 2026-11-11 · adopted under the living-ADR law · #1850 (ADR 0063)
