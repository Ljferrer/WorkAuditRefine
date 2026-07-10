# Red-team report — war-execution-engine-input-and-lifecycle-hardening (round 2, Option B)

**Plan:** `docs/plans/2026-07-08-war-execution-engine-input-and-lifecycle-hardening.md`
**Source spec:** `docs/specs/2026-07-08-war-execution-engine-input-and-lifecycle-hardening-design.md`
**Baseline:** `dev/…-war-execution-engine…` (stacked on plans 1–8, now merged to master)
**Runs:** round-1 `wf_4eb46eb9-894` (whole-prompt design, BLOCKED — 1 Major); Option-B rounds `wf_75455d32-163` (infra-degraded) + `wf_867889bc-c20` (clean) · **Date:** 2026-07-10

## Verdict: **CLEARED-WITH-NOTES** (Option B design)

The undefined-render guard was redesigned to Option B (operator decision 2026-07-10, zero false positives) after round 1 proved the ratified whole-prompt `\bundefined\b` scan false-positives on legitimate content. Round-2 re-run: **13 probes, 12 pass + 1 warn (Minor, resolved by patch)**, 0 blockers, escape guard exit 0.

## Design change verified (executed)

- **`pt` tagged prompt template** (`pt-tag-executed-proof`, executed → pass): value-identity `=== undefined` check throws on a missing interpolation naming the adjacent fragment; a **defined** string containing the word "undefined" renders untouched (zero-false-positive control); `?? '<unset>'` suppression works; byte-identical to untagged rendering incl. numbers. Design is sound by construction.
- **Task 1.2(B) full A-prelude relocation** (`anchor-b-full-prelude-relocation`, executed → pass): round-2a's executed `executable-proof` caught a **Major** — moving only the parse+destructure into the try stranded ~18 other A-derived consts (`NS`, `roundLimit`, `intent`, `memory`, `endStateClaims`, `defaultRoster`, …) → `ReferenceError: A is not defined` on the happy path. Corrected: the slice now relocates the entire A-dependent prelude (L123–269) into the try, accumulators stay hoisted, `phaseId` hoisted, both `phase:` return sites swapped. Sandbox proof: valid args run clean; `args='null'` → clean `held:workflow-error phase:null`, no secondary crash.

## Findings & resolutions

- **F1 — Major (round-2a executable-proof, executed).** Incomplete parse relocation → happy-path `ReferenceError`. **Resolved** by the full-prelude relocation (plan `0b959d1`).
- **F2 — Minor (round-2 claims-vs-reality).** Task 1.1 / spec §3.2 claimed all three scalars `'null'`/`'true'`/`'5'` throw a raw destructure `TypeError`; only `'null'` does (destructuring boolean/number primitives doesn't throw). **Resolved** — spec §3.2 + Task 1.1 corrected: only `'null'` throws pre-guard; the guard's value for `'true'`/`'5'` is uniformity + stopping silent-proceed; the delete-the-feature RED case is `'null'` (do not assert `'true'`/`'5'` throw pre-guard).

## Passed (analyzed)

design-consistency (spec↔plan describe the same `pt` mechanism; no surviving `dispatch()`/whole-prompt-scan live instruction); prompt-literals-taggable (every dispatched prompt reachable by tagging literals; `auditPrompt` carries the `Sub-issue #${task.issue}` example); enum-discipline (routes to existing `held:workflow-error`, no enum widening, not in `HARD_ESCALATION_REASONS`); drift-guard (Task 1.2 both-sites args-guard test + wave-edge dep intact; `pt` single-file needs no mirror; coverage grep floor ships in-task); backstop-legitimacy (all 4 justified with named runners; entry 1 now correctly frames the residual as tag coverage / false-negatives).

## Infra note (not a plan defect)

Round-2a: the 0.14.22 red-team scaffold routes analyzed probes to `agentType: 'Explore'`, a built-in agent this harness dropped mid-session → 11/13 probes died. Patched the scaffold copy to `general-purpose`. Filed as a WAR-engine robustness issue (scaffold should fall back when a built-in agent is absent).

## Residual risk

Four ratified backstops carried into the `/war` handoff (undefined-render **tag coverage** — false negatives via future untagged literals, grep floor + audit lens; live `--reclaim-empty-orphan`; `ensure-exclude` explicit-arg live wiring; concurrent same-plan runs vs reclaim — accepted residual per ADR 0034).
