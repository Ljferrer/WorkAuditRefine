# Open-Issue Remediation Roadmap — 16 issues → 6 design specs

Index for the design specs that close the **16 currently-open issues** in `Ljferrer/WorkAuditRefine`. Grouping
decided 2026-06-30 by an inspect → cluster → write → verify → completeness-critic agent run (31 agents). Each open
issue was re-verified against HEAD (live repo is **v0.7.7**) before clustering; every cited file/anchor was confirmed
(or re-anchored by construct where line numbers had drifted). **Per-spec version bump, landed in series.**

The specs live in [`../specs/`](../specs/):

| # | Spec | Issues | Sev | Ver (assigned) | Validity at HEAD |
|---|------|--------|-----|----------------|------------------|
| 1 | [Land-advance origin propagation](../specs/2026-06-30-land-advance-origin-propagation-design.md) | #251 | **HIGH (BUG)** | **v0.7.8** | live — the lone behavioral bug |
| 2 | [No-test routing, enum hygiene & gate-evidence](../specs/2026-06-30-no-test-routing-enum-gate-evidence-design.md) | #237, #236, #235, #269, #268 | MED | **v0.7.9** | all live |
| 3 | [Servitor provenance gate robustness](../specs/2026-06-30-servitor-provenance-gate-robustness-design.md) | #247, #248, #249 | LOW | **v0.7.10** | #247/#248 live; **#249 already-remediated → verify-and-close** |
| 4 | [Auditor git-guard read-only `-C`](../specs/2026-06-30-auditor-git-guard-readonly-c-flag-design.md) | #222 | MED | **v0.7.11** | live — recurring SOFT-downgrade |
| 5 | [Test-floor `--pattern`/`--repo` hardening](../specs/2026-06-30-test-floor-script-glob-and-doc-hardening-design.md) | #231, #232 | LOW | **v0.7.12** | both live (#231 real bug, #232 doc) |
| 6 | [workflow-template.test.mjs fidelity sweep](../specs/2026-06-30-workflow-template-test-fidelity-sweep-design.md) | #266, #267, #250, #221 | LOW/NIT | **v0.7.13** | #250/#266 live; **#267 partly-stale** (`t1Log` already gone); **#221 vacuously closeable** |

> **Authoritative version source.** Each spec internally proposes its assigned `v0.7.8`–`v0.7.13` (the bump it would
> take landing on the prior spec's tip). All six **REPLACE-in-place** the same four canonical version slots
> (`.claude-plugin/plugin.json` `version`; `.claude-plugin/marketplace.json` `metadata.version` AND `plugins[0].version`;
> `README.md` `## Status`), so only one spec can hold a given number — they **MUST land serially**, each Release task
> taking the next number and stacking its `## Status` paragraph on the prior. Do **not** run them as concurrent WAR
> branches: they would rebase-conflict on the four shared slots. (memory: `release-bump-slots-canonical-no-badge`,
> `stacked-per-branch-releases-make-main-lag-cumulative` — main lags 6 patches after the full stack.)

## Grouping principles

1. **Co-group same-subsystem / same-root-cause findings** so each spec is one cohesive WAR run and same-file findings
   serialize as dependent *tasks* (not cross-spec rebase conflicts). Specs 2, 3, 5, 6 each own a single file family.
2. **Behavioral correctness before cosmetic drift.** The lone BUG (#251) lands first so every later spec rebases onto
   the corrected land path; the substantive routing/tooling fixes (specs 2, 4, 5#231) precede the pure test-prose sweep
   (spec 6).
3. **One cohesive sweep beats scattering nits.** The four `workflow-template.test.mjs` cosmetics (#266/#267/#250/#221)
   land as a single pass (spec 6) instead of four nits sprinkled across the stack.
4. **Stale issues are verify-and-close, never re-implemented.** #249 (and #267's dead-local half) were already
   remediated; their tasks re-grep and close-with-note rather than re-write (memory:
   `verify-task-no-op-is-correct-when-already-covered`).

## Spec summaries

### Spec 1 — Land-advance origin propagation {#251} · v0.7.8 · *the only BUG; land first*
- **#251 (HIGH/BUG):** dispatched land-advance returns `landed` from a **process exit code, not origin truth**. Two
  compounding causes around step 3 of the land: (a) the land-phase prompt
  ([workflow-template.js step-3 land-advance call](../../skills/war/assets/workflow-template.js)) emits a **bare**
  `provision-worktrees.sh land-advance …` with **no `git -C ${refineryLandPath}` cwd pin** (steps 1–2 *are* pinned) — so
  an ambient-cwd HEAD already on origin pushes a no-op (exit 0, no `[rejected]`) while the local follower still advances
  to the agent-supplied merge-sha; (b) `cmd_land_advance` in
  [provision-worktrees.sh](../../skills/war/assets/provision-worktrees.sh) never reads origin back after the push. Fix:
  one **`git ls-remote` readback == new_sha** guard in `cmd_land_advance` before the local `update-ref` (else exit 3 /
  escalate `land_stale`) **+** pin the step-3 invocation cwd. Regression test must exercise the **un-pre-detached** path
  the current `run_in_detached` harness skips.
- **Files:** `provision-worktrees.sh` (`cmd_land_advance` + `.test.sh`), `workflow-template.js` (land-phase prompt block
  only — disjoint from spec 2's no-test region). (memory: `land-advance-push-first-cas-rejected-token`,
  `land-decision-not-demoted-on-land-step-failure`, `land-local-follower-ref-can-lag-sync-before-next-phase`.)

### Spec 2 — No-test routing, enum hygiene & gate-evidence {#237, #236, #235, #269, #268} · v0.7.9
All five touch the same no-test sub-loop region of `workflow-template.js` + the gate-evidence reporting boundary.
- **#237 (substantive):** the dispatched merge-task prompts collapse **exit 2 (git/ref error)** into `status:'no-test'`,
  diverging from the `war-refiner.md`/`schemas.md` exit-1-vs-2 contract → a flaky ref kicks a pointless add-test loop.
  Fix: split exit 1 → `no-test`, exit 2 → `error`/`gate_failed` in both dispatch prompts.
- **#236 (latent):** narrow the **land-side** `HARD_ESCALATION_REASONS.includes(landResult.status)` check to
  `mode==='merge-task'` so a never-emitted `'no-test'` land result can't spuriously hard-escalate. Do **not** remove
  `'no-test'` from the array (load-bearing on the merge path).
- **#235 (comment):** reword the `if (reAuditFailed) continue` comment to name its **real null-deref-guard** purpose
  (not "already handled above").
- **#269 (reporting):** append a completeness clause to the `gate_output` population sentence (+ `war-refiner.md` step 5)
  so a curated `*.test.sh` excerpt can't be misread as an under-run — paste the full list or total count.
- **#268 (test):** add the missing Site-3 blocked-add-test-worker behavioral test (`buildSeqImpl`-driven).
- **Files:** `workflow-template.js` (no-test loop + land-side check), `workflow-template.test.mjs`, `war-refiner.md`,
  `schemas.md`. **Pin integration base to the post-#251 tip** — #236's land-side edit is adjacent to #251's landed
  land-phase prompt (memory: `audit-baseline-must-pin-integration-branch-not-main-checkout`).

### Spec 3 — Servitor provenance gate robustness {#247, #248, #249} · v0.7.10
One memory-provenance shell-gate sweep over `hooks/validate-servitor-provenance.sh`.
- **#247 (latent):** relax the extractor `/^  provenance:/` (2 literal spaces) to `/^[[:space:]]+provenance:/` so a
  valid 4-space/tab indent isn't fail-closed-denied; add a non-2-space **ACCEPT** fixture so the relaxation is
  load-bearing.
- **#248 (comment):** the `|| true` block-comment over-claims a grep exit-1 rescue, but the pipeline is awk|sed
  (exit 0 on no-match) — the deny path is the empty-string `*)` case arm. Reword to the real mechanism; keep `|| true`
  as cheap defense-in-depth.
- **#249 (already-remediated → verify-and-close):** the plan-prose top-level-vs-nested mismatch was fixed by commit
  `ea5e132` (nested provenance extract). Re-grep `docs/plans/2026-06-29-memory-provenance.md` for any residual
  *top-level-asserting* wording (the remaining mentions are test-case/disclaimer context, verified); otherwise close
  with a note — **do not re-implement**.

### Spec 4 — Auditor git-guard read-only `-C` {#222} · v0.7.11 · *recurring SOFT-downgrade*
- **#222 (tooling):** the gate-audit pin prompt mandates `[ "$(git -C <_refinery> rev-parse HEAD)" = … ]`, but
  [validate-auditor-git.sh](../../hooks/validate-auditor-git.sh) denies it on **two** grounds — the char-allowlist
  forbids `$()[]"` (the C5 injection-defense), and `-C` falls through to default-deny. Fix: teach the guard the
  **read-only `-C <path>` global flag** (peel a leading `-C <path>` token, re-enter normal subcommand validation) + add
  allow-tests **and** a deny-test proving `-C` doesn't widen the verb allowlist; **reword the prompt** to a bare
  no-substitution compare. Explicitly do **not** permit the bracket/`$()` form — that reopens the C5 vector. Defuses the
  stale-tip SOFT-downgrade forced on every release.

### Spec 5 — Test-floor `--pattern`/`--repo` hardening {#231, #232} · v0.7.12
Both edits are in the single floor script `assert-test-in-diff.sh`.
- **#231 (latent bug):** `--pattern` collapses a multi-token glob set into one literal `case` pattern with an embedded
  space that never matches → fix by iterating tokens (`for pat in $custom_pattern; do case "$f" in $pat) …`); update the
  `ponytail: one-glob` comment; add a `--pattern '*.test.js *.spec.js'` test (currently zero coverage on the override
  path).
- **#232 (doc-fidelity):** the test-only `--repo` flag is absent from plan/spec/ADR usage signatures — append
  `[--repo <git-dir>]` to the design-doc signatures **and** annotate it test-only in the script header. Do **not**
  delete it (load-bearing for `.test.sh` fixture isolation).

### Spec 6 — workflow-template.test.mjs fidelity sweep {#266, #267, #250, #221} · v0.7.13 · *cosmetic; land last*
One pass over `workflow-template.test.mjs`, zero production change.
- **#266:** anchor the brittle `blockedReason` extract-and-eval lazy quantifier to the unique terminal token
  (`null\)` → `:\s*null\)`) so a future interior `null)` can't truncate the capture.
- **#250:** rename the stale F05 sites (2 comment lines + 4 test titles at 1168-1169 / 1190 / 1203 / 1239 / 1246) from
  pre-M3 labels `CORRECTION PRIORITY`/`VERIFY-CUE` to `TIER PRECEDENCE`/`VERIFY-ON-WRITE`; leave the semantic-token
  `assert.match` patterns untouched.
- **#267 (partly stale):** the unused `t1Log` local is **already absent at HEAD** (grep returns 0) — verify and confirm;
  reword the bind-deletion-failure-mode comment only if its misprediction text is still present.
- **#221 (vacuously closeable):** the M1 criterion-6 mock throws on the auditor seat, not literally "after a merge" —
  at-HEAD names are already accurate, so this is a one-line deliberate-choice comment **or** close as superseded-by-HEAD.
- Authored on a tip already containing spec 2's #268 test — must **not** re-touch that region.

## Dependency spine (strict landing order)

```
Spec 1 ──► Spec 2 ──► Spec 6           (Specs 3, 4, 5 file-independent; ordered only by version)
 BUG       no-test     test-sweep
```

- **1 → 2:** both write `workflow-template.js`. Spec 1 fixes the land-phase prompt; spec 2's #236 land-side check is
  **adjacent** (same `L504-527` span) — land 1 first and pin spec 2's base to its tip.
- **2 → 6:** both write `workflow-template.test.mjs`. Spec 2 (#268) **adds** a Site-3 test; spec 6 polishes comments/
  titles. Disjoint sub-regions, but land 2 first so 6's sweep is authored on a tip that already contains the new test.
- **3, 4, 5** are file-independent of everything except the four version slots; their position is fixed only by the
  version-serialization rule (severity order: 4 MED before 5 LOW; 3 after 2 by subsystem locality).

## Shared-file contention

| File | Specs that edit it | Conflict risk |
|---|---|---|
| four version slots (`plugin.json`, `marketplace.json` ×2, `README ## Status`) | **1–6** | 🔴 REPLACE-in-place — MUST serialize (handled by ordered versions) |
| `skills/war/assets/workflow-template.js` | 1 (land block), 2 (no-test loop + land-side check), 4 (gate-audit pin prompt) | 🟠 three **disjoint** regions; only the 1↔2 `L504-527` adjacency needs the base-pin |
| `skills/war/assets/workflow-template.test.mjs` | 2 (#268 add test), 6 (comment/title/regex) | 🟠 additive vs cosmetic; land 2 before 6 |
| `agents/war-refiner.md` | **2 only** | 🟢 single owner |
| `hooks/validate-servitor-provenance.sh` | **3 only** | 🟢 isolated lane |
| `hooks/validate-auditor-git.sh` | **4 only** | 🟢 isolated lane |
| `skills/war/assets/assert-test-in-diff.sh` | **5 only** | 🟢 isolated lane |

Apart from the version slots (ordered) and the disjoint `workflow-template.js`/`.test.mjs` touches (resolved by 1→2→6),
the six specs are file-independent.

## Coverage proof (all 16 open issues addressed)

| Issue | Spec | Coverage |
|---|---|---|
| #251 | 1 | full (BUG root-cause: origin-readback guard + cwd pin) |
| #237 | 2 | full (exit-1-vs-2 split) |
| #236 | 2 | full (land-side check scoped to merge-task) |
| #235 | 2 | full (comment reworded to null-deref guard) |
| #269 | 2 | full (gate_output completeness clause) |
| #268 | 2 | full (Site-3 behavioral test added) |
| #247 | 3 | full (indent-agnostic extractor + ACCEPT fixture) |
| #248 | 3 | full (comment corrected to awk/sed mechanism) |
| #249 | 3 | **verify-and-close** (already remediated by `ea5e132`) |
| #222 | 4 | full (read-only `-C` allow + prompt reword; injection vector kept closed) |
| #231 | 5 | full (multi-glob iteration + override test) |
| #232 | 5 | full (signature reconciled; flag annotated test-only) |
| #266 | 6 | full (extract regex anchored to terminal token) |
| #250 | 6 | full (5 stale F05 sites renamed) |
| #267 | 6 | full (`t1Log` already gone — verify; comment reword if present) |
| #221 | 6 | full (comment tweak **or** close superseded-by-HEAD) |

No issue is recommend-close-without-spec: the critic re-verified every cited defect is still live at HEAD, or is a
genuine already-remediated nit handled as verify-and-close. No spec re-fixes already-shipped work.

## Weak validations (flagged by the completeness critic)

- **#249** — verify-and-close with **no durable artifact**: closure rests on a manual grep at land time. Soundness
  confirmed against the live plan, but the weakest validation in the batch. Acceptable for a stale nit.
- **#221** — its validation criterion explicitly accepts the **no-edit** branch ("close superseded-by-HEAD"), so it can
  be satisfied vacuously. Reasoning checks out (at-HEAD names already accurate).
- **#267** — the `t1Log` half is **already done** at HEAD; the comment-reword half is conditional on the misprediction
  text still being present (not found by grep at this tip). Net: near-stale — confirm, then close.

## How each spec gets built
- House format (Status / Problem with verified construct anchors / Decisions / Affected-files table / Validation
  criteria one-per-issue / Alternatives / coverage mapping), strict TDD slices (failing test → run → implement → run →
  commit).
- **Gate** = the full self-discovering multi-runner: `node --test 'skills/**/*.test.mjs'` (quote the glob — bash 3.2
  under-covers unquoted) **+** every `*.test.sh` runner (**12** tracked at HEAD).
- Each spec re-anchors line-refs by **construct** at draft time; workers re-confirm at execution.
- **Ratify each spec with `/red-team` (operator-run) before `/war`.** Spec 1 especially — it changes the land CAS
  success contract.

## Execution recommendation
- **Run serially in roadmap order via WAR** (`/war <spec> --working dev --landing master`), 1 → 2 → 3 → 4 → 5 → 6. WAR
  parallelizes **within** each spec (task waves) at the right granularity for this contention profile.
- Spec 1 first (BUG), then spec 2 (rebased onto the corrected land path). Specs 3/4/5 are clean isolated lanes whose only
  coupling is the version stack; spec 6 last (cosmetic, authored on the post-#268 tip).
