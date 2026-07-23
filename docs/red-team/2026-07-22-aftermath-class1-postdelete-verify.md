# Red-team report — Aftermath Class-1 post-delete residual-set verification

- **Plan:** `docs/plans/2026-07-22-aftermath-class1-postdelete-verify.md`
- **Source spec:** `docs/specs/2026-07-22-aftermath-class1-postdelete-verify-design.md`
- **Repo base:** `dev/2026-07-22-aftermath-class1-postdelete-verify` @ `67aae1e` (campaign plan 7 of 9)
- **artifactKind:** `impl-plan`
- **Verdict:** **CLEARED-WITH-NOTES** (1 round; one `needsDecision` resolved by plan patch, deterministically re-verified)
- **Run:** `wf_68960869-13d` (task `wuggtq3wj`) — model opus / effort high

## Attack surface

- **Executed proof:** 3 probes (2 bespoke + 1 spine) — `base-anchor-repro`, `throwaway-repo-git-semantics-demonstration`, and the spine `executable-proof`. All in throwaway sandboxes / read-only greps; target repo never mutated (escape guard exit 0).
- **Analyzed:** 6 probes (5 spine + 1 bespoke `stale-claim-retirement-drift-guard`).
- **Coverage:** expected 9, on-target 9, offTarget 0, dropped 0 — coverage whole.
- **Lead-run checks:** backstop-legitimacy (3 AI-declared entries) + the two drift-guard spine probes (`unguarded-new-mirror` vacuous — no inline mirror; `default-flip-old-absent` folded into the bespoke `stale-claim-retirement-drift-guard`).

## Executed proof — highlights

- **`throwaway-repo-git-semantics-demonstration` (PASS):** the plan's own backstop #1, run here as an executable proof. In throwaway `file://` repos: two heads H (hold) + D (delete) pushed; a piped `while read` exclusion filter meant to spare H silently no-ops in the subshell, so `git push origin --delete H D` deletes **both** and git prints success — the exact silent data-loss the plan exists to catch. The plan's remedy (one fresh `git ls-remote --heads`, two-sided diff against the hold set) flags **H MISSING = data-loss row**; the printed restore `git push origin <H-snapshot-sha>:refs/heads/H` recovers H at the exact snapshot SHA. **The prose teaches a procedure git actually supports.**
- **`base-anchor-repro` (PASS):** every base-state anchor claim verified accurate at `67aae1e` — insertion anchors present (SKILL Class-1 stranded-upstream + Class-4 join rule); `grep -icF 'ls-remote'` = 6 (banned anchor, as claimed); `hold set` and `before declaring the run clean` both zero-hit in the SKILL **and** the structure test (so both mandated `has_i()` pins go red pre-fix); the optional `:refs/heads/` restore-refspec and prose `snapshot` zero-hit in both files; the stale lesson clause present exactly once; the existing Class-1 gate-evidence block intact with all four pre-existing assertions (`git cherry`, `--unset-upstream`, row-scoped is-ancestor keep-green, row-scoped `exact ref being removed`).

## Findings and resolutions

### Resolved (was `needsDecision`, now patched) — unadjudicated sweep hit in the landed 2026-07-16 plan

`stale-claim-retirement-drift-guard` (status warn). End state 6 / Task 1.1's stale-claim sweep `grep -rn 'not encoded' docs/ skills/` matches a **third** substantive artifact the plan's adjudication list never named: the landed `docs/plans/2026-07-16-aftermath-class1-gate-evidence.md` (~L381, `…is not encoded / anywhere and stays the lesson's standing warning`). The plan enumerated only the lesson dated line (corrected) and the 2026-07-16 **spec** Context band (uncorrected), leaving a worker to guess whether to edit an immutable landed plan.

**Adjudication (AFK self-adjudicated):** ACCEPTED. A landed plan is a point-in-time record, never retro-edited — established doctrine, and the 2026-07-16 plan states the convention itself ("point-in-time record, never corrected"). Same rule as the already-exempted dated spec band, one surface over.

**Patch applied** (plan, two surfaces): End state 6 and Task 1.1's stale-claim sweep now name the landed 2026-07-16 plan as **deliberately left uncorrected**, and make the adjudication list exhaustive-over-base-hits ("a fourth hit is a survey-derived correction and does not edit any landed plan or dated spec band").

**Re-verification (deterministic, by command):** `grep -rn 'not encoded' docs/ skills/` at base returns exactly two substantive artifacts outside plan 7's own slug — the lesson (adjudication iii: corrected) and the 2026-07-16 plan (adjudication ii: uncorrected). Both now covered. The 2026-07-16 *spec* carries no literal `not encoded` hit (its mention is a hand-scan same-meaning exemption). Blocker fully closed.

### Auto-noted (Minor, non-blocking)

- **AI-declared intent (`intent-vs-plan`, probe PASS):** the `## AI-Commander's Intent` block is AI-authored under `/war-machine --afk` (ADR 0014), no operator ratification. The intent is well-formed — End-state conditions 1–10 each individually checkable and each mapped to a delivering task; collectively sufficient for the Purpose under the prose-only Method. No intent defect. Ratification path is this red-team validation; human upgrade path is `/war-strategy <plan>`.
- **3 AI-declared backstops (Lead backstop-legitimacy check):** all legitimate — each names a concrete deferral reason, a runner, and timing, and no cheaper pre-merge proxy covers them. (1) Throwaway-repo demonstration — deferral justified (a committed behavioral test of git's own semantics is a spec §9 non-goal; aftermath has no test-asset family per ADR 0027); **exercised here as an executed probe (PASS)**. (2) Prose truth beyond the two pins — the known ceiling of the grep-guard family. (3) First live Class-1 execution — Lead-executed prose over live git state, not fixture-able. Each carries its AI-declared marker for operator attention (ADR 0014 provenance).

## Spine lenses — all pass

`claims-vs-reality`, `executable-proof`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan` — 6/6 pass (the sole `intent-vs-plan` Minor is the AI-declared note above, not a defect).

## Adjudications

| # | ruling | route | re |
|---|--------|-------|----|
| 1 | The landed 2026-07-16 **plan** (`docs/plans/2026-07-16-aftermath-class1-gate-evidence.md`, ~L381) is deliberately left **uncorrected** by the stale-claim sweep — a landed plan is a point-in-time record, never retro-edited (the 2026-07-16 plan records this convention itself). Same rule as the dated spec band. | red-team r1; **patched** (End state 6 + Task 1.1 sweep) | The plan's sweep adjudication list named only the lesson line + the 2026-07-16 *spec* band, leaving the landed 2026-07-16 *plan* hit unruled. |
| 2 | AFK provenance standing — the `## AI-Commander's Intent` + `## Deferred validations (backstops — AI-declared)` headings are AI-declared (ADR 0014); intent is the ceiling, plan slice the floor; backstop AI-declared markers render at every land and in the wrap-up. | auto-noted; ratified | Intent + backstops carry no operator ratification. |
